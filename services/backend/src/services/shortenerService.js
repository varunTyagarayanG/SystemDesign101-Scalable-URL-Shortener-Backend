
const axios = require('axios');
const Url = require('../models/urls');
const { client: redisClient } = require('../cache/redisClient');
const { publishEvent } = require('./analyticsPublisher');

const KEYGEN_URL = process.env.KEYGEN_URL || 'http://key-generator-service:4000/generate';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function createShortUrl(longUrl) {
    // 1) Call Key-Generator microservice
    const resp = await axios.get(KEYGEN_URL);
    const shortId = resp.data.shortId;

    // 2) Store in MongoDB
    const urlDoc = await Url.create({ shortId, longUrl });

    // 3) Prime Redis cache
    await redisClient.set(shortId, longUrl);

    // 4) Publish analytics event for creation
    await publishEvent('create', { shortId, longUrl });

    // 5) Return the full short URL
    return `${BASE_URL}/api/urls/${shortId}`;
}

async function getLongUrl(shortId) {
    // 1) Check Redis
    const cached = await redisClient.get(shortId);
    if (cached) {
        // Publish cacheHit event
        await publishEvent('redirect', { shortId, longUrl: cached, cacheHit: true });
        return cached;
    }

    // 2) Fallback to MongoDB
    const urlDoc = await Url.findOne({ shortId });
    if (!urlDoc) {
        return null;
    }
    const longUrl = urlDoc.longUrl;

    // 3) Prime Redis for next time
    await redisClient.set(shortId, longUrl);

    // 4) Publish cacheMiss event
    await publishEvent('redirect', { shortId, longUrl, cacheHit: false });

    return longUrl;
}

module.exports = { createShortUrl, getLongUrl };
