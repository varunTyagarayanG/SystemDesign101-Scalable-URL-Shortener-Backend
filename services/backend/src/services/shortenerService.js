// services/backend/src/services/shortenerService.js

const axios = require('axios');
const { pool } = require('../db/postgres');
const Url = require('../models/Url');
const { client: redisClient } = require('../cache/redisClient');
const { publishEvent } = require('./analyticsPublisher');

const BASE_URL = process.env.BASE_URL;    // e.g. "http://localhost"
const KEYGEN_URL = process.env.KEYGEN_URL;  // e.g. "http://key-generator-service:4000"

/**
 * Create a new short URL (either auto-generated or a custom alias).
 *
 * @param {string} longUrl
 * @param {string} [customAlias]
 * @returns {Promise<string>} full short URL (e.g. "http://localhost/Ab3kLz9")
 */
async function createShortUrl(longUrl, customAlias) {
    let shortId;

    if (customAlias) {
        // validate alias format
        if (!/^[A-Za-z0-9_-]{4,20}$/.test(customAlias)) {
            const err = new Error('Invalid alias');
            err.code = 'INVALID_ALIAS';
            throw err;
        }
        // attempt to reserve in Postgres
        try {
            await pool.query(
                'INSERT INTO keys (short_id, used) VALUES ($1, TRUE)',
                [customAlias]
            );
            shortId = customAlias;
        } catch (e) {
            // unique violation => already taken
            if (e.code === '23505') {
                const err = new Error('Alias already in use');
                err.code = 'ALIAS_TAKEN';
                throw err;
            }
            throw e;
        }
    } else {
        // fetch auto-generated ID from key-generator service
        const resp = await axios.get(`${KEYGEN_URL}/generate`);
        shortId = resp.data.shortId;
    }

    // store mapping in MongoDB
    await Url.create({ shortId, longUrl });

    // prime Redis cache
    await redisClient.set(shortId, longUrl);

    // publish “create” analytics event
    publishEvent('create', { shortId, longUrl });

    // return the shortened URL at root path
    return `${BASE_URL}/${shortId}`;
}

/**
 * Look up a shortId and return its long URL.
 * Also updates cache on miss and publishes a redirect analytics event.
 *
 * @param {string} shortId
 * @returns {Promise<string|null>} the long URL or null if not found
 */
async function getLongUrl(shortId) {
    // try Redis first
    let longUrl = await redisClient.get(shortId);
    const cacheHit = Boolean(longUrl);

    if (!longUrl) {
        // cache miss → fetch from Mongo
        const doc = await Url.findOne({ shortId });
        if (!doc) return null;
        longUrl = doc.longUrl;
        // prime Redis
        await redisClient.set(shortId, longUrl);
    }

    // publish “redirect” analytics event
    publishEvent('redirect', { shortId, longUrl, cacheHit });

    return longUrl;
}

module.exports = {
    createShortUrl,
    getLongUrl
};
