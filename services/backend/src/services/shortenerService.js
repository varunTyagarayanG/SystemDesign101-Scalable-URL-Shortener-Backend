// services/backend/src/services/shortenerService.js

const axios = require('axios');
const { pool } = require('../db/postgres');
const Url = require('../models/Url');
const { client: redisClient } = require('../cache/redisClient');
const { publishEvent } = require('./analyticsPublisher');

const BASE_URL = process.env.BASE_URL;    // e.g. "http://localhost"
const KEYGEN_URL = process.env.KEYGEN_URL;  // e.g. "http://key-generator-service:4000"

/**
 * Create a new short URL (auto‐gen or custom alias),
 * with optional expiry. Also sets Redis TTL to match expiresAt.
 */
async function createShortUrl(longUrl, customAlias, expiresAt) {
    let shortId;

    // 1) Parse & validate expiresAt
    let expiryDate = null;
    if (expiresAt) {
        expiryDate = new Date(expiresAt);
        if (isNaN(expiryDate) || expiryDate <= Date.now()) {
            const err = new Error('expiresAt must be a valid ISO date in the future');
            err.code = 'INVALID_EXPIRY';
            throw err;
        }
    }

    // 2) Acquire a shortId (alias or auto‐gen)
    if (customAlias) {
        if (!/^[A-Za-z0-9_-]{4,20}$/.test(customAlias)) {
            const err = new Error('Alias must be 4–20 chars, alphanumeric, underscore or hyphen');
            err.code = 'INVALID_ALIAS';
            throw err;
        }
        try {
            await pool.query(
                'INSERT INTO keys (short_id, used) VALUES ($1, TRUE)',
                [customAlias]
            );
            shortId = customAlias;
        } catch (e) {
            if (e.code === '23505') {
                const err = new Error('Alias already in use');
                err.code = 'ALIAS_TAKEN';
                throw err;
            }
            throw e;
        }
    } else {
        const resp = await axios.get(`${KEYGEN_URL}/generate`);
        shortId = resp.data.shortId;
    }

    // 3) Persist in Mongo
    await Url.create({
        shortId,
        longUrl,
        expiresAt: expiryDate,
        deleted: false
    });

    // 4) Cache in Redis, with TTL if expiresAt set
    await redisClient.set(shortId, longUrl);
    if (expiryDate) {
        const seconds = Math.ceil((expiryDate.getTime() - Date.now()) / 1000);
        await redisClient.expire(shortId, seconds);
    }

    // 5) Publish analytics
    publishEvent('create', { shortId, longUrl });

    return `${BASE_URL}/${shortId}`;
}

/**
 * Lookup a shortId in Redis first, then Mongo.
 * Expired keys will be gone from Redis (due to expire()),
 * and also filtered out by Mongo’s TTL/index or filter.
 */
async function getLongUrl(shortId) {
    // 1) Try Redis cache
    let longUrl = await redisClient.get(shortId);
    const cacheHit = Boolean(longUrl);

    if (!longUrl) {
        // 2) Cache miss → fetch from Mongo, excluding deleted or expired
        const now = new Date();
        const doc = await Url.findOne({
            shortId,
            deleted: false,
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: now } }
            ]
        });
        if (!doc) return null;
        longUrl = doc.longUrl;

        // 3) Prime Redis again (with no TTL if no expiry)
        await redisClient.set(shortId, longUrl);
        if (doc.expiresAt) {
            const seconds = Math.ceil((doc.expiresAt.getTime() - Date.now()) / 1000);
            await redisClient.expire(shortId, seconds);
        }
    }

    // 4) Analytics
    publishEvent('redirect', { shortId, longUrl, cacheHit });
    return longUrl;
}

module.exports = {
    createShortUrl,
    getLongUrl
};
