const express = require('express');
const router = express.Router();

// POST /api/urls
router.post('/', (req, res) => {
    // placeholder: will generate a short URL
    res.status(201).json({ message: 'Create short URL (placeholder)' });
});

// GET /api/urls/:shortId
router.get('/:shortId', (req, res) => {
    // placeholder: will redirect to the long URL
    res.status(200).json({
        message: `Redirect for shortId=${req.params.shortId} (placeholder)`
    });
});

module.exports = router;
