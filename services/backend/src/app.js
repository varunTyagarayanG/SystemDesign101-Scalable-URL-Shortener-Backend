const express = require('express');
const dotenv = require('dotenv');

const connectMongo = require('./db/mongo');
const { pool, connectPostgres } = require('./db/postgres');
const urlRoutes = require('./routes/urlRoutes');

dotenv.config();

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/db-check', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        const mongoose = require('mongoose');
        const mongoState = mongoose.connection.readyState === 1
            ? 'connected' : 'disconnected';
        res.json({ postgres: 'connected', mongo: mongoState });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.use('/api/urls', urlRoutes);

async function start() {
    await connectPostgres();
    await connectMongo();
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Backend listening on port ${port}`));
}

start();
