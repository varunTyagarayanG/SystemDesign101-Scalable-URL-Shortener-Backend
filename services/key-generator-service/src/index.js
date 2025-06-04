const express = require('express');
const dotenv = require('dotenv');
const pool = require('./db');

dotenv.config();
const app = express();
const port = process.env.KEYGEN_PORT || 4000;

app.get('/generate', async (req, res) => {
    const client = await pool.connect();
    try {
        // 1) Begin transaction
        await client.query('BEGIN');

        // 2) Select one unused key FOR UPDATE SKIP LOCKED
        const selectRes = await client.query(
            `SELECT short_id
       FROM keys
       WHERE used = FALSE
       LIMIT 1
       FOR UPDATE SKIP LOCKED`
        );

        if (selectRes.rows.length === 0) {
            // No unused keys available
            await client.query('ROLLBACK');
            return res.status(503).json({ error: 'No keys available' });
        }

        const shortId = selectRes.rows[0].short_id;

        // 3) Mark that key as used
        await client.query(
            `UPDATE keys
       SET used = TRUE
       WHERE short_id = $1`,
            [shortId]
        );

        // 4) Commit transaction
        await client.query('COMMIT');

        // 5) Return the chosen shortId
        res.json({ shortId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Key generation error:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
});

app.listen(port, () => {
    console.log(`Key-Generator Service listening on port ${port}`);
});
