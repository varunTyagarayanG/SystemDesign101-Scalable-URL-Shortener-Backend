// services/backend/src/routes/urlRoutes.js

const express = require('express');
const authenticateJWT = require('../middleware/authMiddleware');
const { createShortUrl, getLongUrl } = require('../services/shortenerService');

const router = express.Router();

// POST /api/urls
// Optional body field: { longUrl: "...", alias: "myAlias" }
router.post(
    '/',
    authenticateJWT,
    async (req, res) => {
        const { longUrl, alias } = req.body;
        if (!longUrl) {
            return res.status(400).json({ error: 'Missing longUrl in request body' });
        }
        try {
            const shortUrl = await createShortUrl(longUrl, alias);
            return res.status(201).json({ shortUrl });
        } catch (err) {
            console.error('createShortUrl error:', err);
            if (err.code === 'INVALID_ALIAS') {
                return res
                    .status(400)
                    .json({ error: 'Alias must be 4–20 chars, alphanumeric, underscore or hyphen' });
            }
            if (err.code === 'ALIAS_TAKEN') {
                return res.status(409).json({ error: 'Alias already in use' });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

// GET /api/urls/:shortId  (unchanged)
router.get('/:shortId', async (req, res) => {
    const { shortId } = req.params;
    try {
        const longUrl = await getLongUrl(shortId);
        if (!longUrl) return res.status(404).json({ error: 'Short URL not found' });
        return res.redirect(301, longUrl);
    } catch (err) {
        console.error('getLongUrl error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
