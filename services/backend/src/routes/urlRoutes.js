const express = require('express');
const { createShortUrl, getLongUrl } = require('../services/shortenerService');

const router = express.Router();

// POST /api/urls
router.post('/', async (req, res) => {
    const { longUrl } = req.body;
    if (!longUrl) {
        return res.status(400).json({ error: 'Missing longUrl in request body' });
    }
    try {
        const shortUrl = await createShortUrl(longUrl);
        return res.status(201).json({ shortUrl });
    } catch (err) {
        console.error('Error in createShortUrl:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/urls/:shortId
router.get('/:shortId', async (req, res) => {
    const { shortId } = req.params;
    try {
        const longUrl = await getLongUrl(shortId);
        if (!longUrl) {
            return res.status(404).json({ error: 'Short URL not found' });
        }
        return res.redirect(301, longUrl);
    } catch (err) {
        console.error('Error in getLongUrl:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
