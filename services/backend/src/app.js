// services/backend/src/app.js

const express = require('express');
const dotenv = require('dotenv');
const os = require('os');
const client = require('prom-client');

const CONTAINER_ID = os.hostname();

const connectMongo = require('./db/mongo');
const { pool, connectPostgres } = require('./db/postgres');
const { client: redisClient, connectRedis } = require('./cache/redisClient');
const { connectRabbitMQ } = require('./services/analyticsPublisher');
const urlRoutes = require('./routes/urlRoutes');

dotenv.config();

const app = express();
app.use(express.json());
app.use(rateLimiter);
// --- Prometheus setup (will also be used in Day 9) ---
const register = new client.Registry();
register.setDefaultLabels({ app: 'url-shortener-backend' });
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests received',
    labelNames: ['method', 'route', 'statusCode']
});
register.registerMetric(httpRequestsTotal);

const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'statusCode'],
    buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});
register.registerMetric(httpRequestDuration);

// Metrics middleware
app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();
    const route = req.route ? req.route.path : req.path;
    res.on('finish', () => {
        httpRequestsTotal.inc({ method: req.method, route, statusCode: res.statusCode });
        end({ method: req.method, route, statusCode: res.statusCode });
    });
    next();
});

// Expose /metrics for Prometheus
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    } catch (err) {
        res.status(500).end(err);
    }
});

// Identify which backend instance handled the request
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
        await pool.query('SELECT 1');
        const mongoose = require('mongoose');
        const mongoState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        res.json({ postgres: 'connected', mongo: mongoState, instance: CONTAINER_ID });
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

// Protected and public URL-shortening routes
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
