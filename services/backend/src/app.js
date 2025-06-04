const express = require('express');
const dotenv = require('dotenv');
const os = require('os');

const CONTAINER_ID = os.hostname();

const connectMongo = require('./db/mongo');
const { pool, connectPostgres } = require('./db/postgres');
const { client: redisClient, connectRedis } = require('./cache/redisClient');
const { connectRabbitMQ } = require('./services/analyticsPublisher');
const urlRoutes = require('./routes/urlRoutes');

dotenv.config();

const app = express();
app.use(express.json());

// Middleware to identify which backend instance handled the request
app.use((req, res, next) => {
    res.setHeader('X-Backend-Instance', CONTAINER_ID);
    next();
});

// Health endpoint
app.get('/health', (req, res) =>
    res.json({ status: 'ok', instance: CONTAINER_ID })
);

// DB-check endpoint
app.get('/db-check', async (req, res) => {
    try {
        // Test Postgres
        await pool.query('SELECT 1');

        // Test Mongo connection state
        const mongoose = require('mongoose');
        const mongoState =
            mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

        res.json({
            postgres: 'connected',
            mongo: mongoState,
            instance: CONTAINER_ID
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cache-test endpoint
app.get('/cache-test', async (req, res) => {
    try {
        await redisClient.set('foo', 'bar');
        const value = await redisClient.get('foo');
        res.json({ foo: value, instance: CONTAINER_ID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// URL-shortening routes
app.use('/api/urls', urlRoutes);

async function start() {
    await connectPostgres();
    await connectMongo();
    await connectRedis();
    await connectRabbitMQ();

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Backend listening on port ${port}, instance ${CONTAINER_ID}`);
    });
}

start();
