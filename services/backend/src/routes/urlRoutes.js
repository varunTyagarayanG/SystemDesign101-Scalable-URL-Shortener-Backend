// services/backend/src/routes/urlRoutes.js

const express = require('express');
const authenticateJWT = require('../middleware/authMiddleware');
const { createShortUrl, getLongUrl } = require('../services/shortenerService');
const Url = require('../models/Url');

const router = express.Router();

// POST /api/urls
// Body: { longUrl, alias?, expiresAt? }
router.post('/', authenticateJWT, async (req, res) => {
    const { longUrl, alias, expiresAt } = req.body;
    if (!longUrl) {
        return res.status(400).json({ error: 'Missing longUrl in request body' });
    }
    try {
        const shortUrl = await createShortUrl(longUrl, alias, expiresAt);
        return res.status(201).json({ shortUrl });
    } catch (err) {
        console.error('createShortUrl error:', err);
        if (err.code === 'INVALID_ALIAS') {
            return res.status(400).json({ error: err.message });
        }
        if (err.code === 'ALIAS_TAKEN') {
            return res.status(409).json({ error: err.message });
        }
        if (err.code === 'INVALID_EXPIRY') {
            return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/urls/:shortId  (fetch longUrl)
router.get('/:shortId', async (req, res) => {
    const { shortId } = req.params;
    try {
        const longUrl = await getLongUrl(shortId);
        if (!longUrl) {
            return res.status(404).json({ error: 'Short URL not found' });
        }
        return res.redirect(301, longUrl);
    } catch (err) {
        console.error('getLongUrl error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/urls/:shortId  (soft-delete)
router.delete('/:shortId', authenticateJWT, async (req, res) => {
    const { shortId } = req.params;
    try {
        const result = await Url.updateOne(
            { shortId, deleted: false },
            { $set: { deleted: true } }
        );
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Short URL not found or already deleted' });
        }
        // optionally: remove from Redis
        await req.app.locals.redisClient.del(shortId);
        return res.status(204).end();
    } catch (err) {
        console.error('DELETE /api/urls/:shortId error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
