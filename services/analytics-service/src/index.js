// services/analytics-service/src/index.js

const amqplib = require('amqplib');
const express = require('express');
const dotenv = require('dotenv');
const connectMongo = require('./db/mongo');
const Event = require('./models/Event');

dotenv.config();
const app = express();

let channel;

async function startConsumer() {
    try {
        // 1) Connect to RabbitMQ
        const connection = await amqplib.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertExchange('urlEvents', 'fanout', { durable: true });

        // 2) Create a transient, exclusive queue and bind it
        const q = await channel.assertQueue('', { exclusive: true });
        await channel.bindQueue(q.queue, 'urlEvents', '');

        console.log('Analytics-Service: Waiting for messages in queue', q.queue);

        // 3) Consume messages
        channel.consume(
            q.queue,
            async (msg) => {
                if (msg !== null) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        const { type, data, timestamp } = content;
                        const evt = new Event({
                            type,
                            shortId: data.shortId,
                            longUrl: data.longUrl,
                            timestamp: timestamp,
                            cacheHit: data.cacheHit !== undefined ? data.cacheHit : null
                        });
                        await evt.save();
                        channel.ack(msg);
                    } catch (err) {
                        console.error('Analytics-Service: Error processing message', err);
                        channel.ack(msg);
                    }
                }
            },
            { noAck: false }
        );
    } catch (err) {
        console.error('Analytics-Service: RabbitMQ connection error', err);
        setTimeout(startConsumer, 2000); // retry after delay
    }
}

// 4) HTTP API: GET /stats/:shortId
app.get('/stats/:shortId', async (req, res) => {
    const { shortId } = req.params;
    try {
        const redirectCount = await Event.countDocuments({
            shortId,
            type: 'redirect'
        });
        const hits = await Event.countDocuments({
            shortId,
            type: 'redirect',
            cacheHit: true
        });
        const misses = await Event.countDocuments({
            shortId,
            type: 'redirect',
            cacheHit: false
        });
        return res.json({
            shortId,
            redirectCount,
            cacheHits: hits,
            cacheMisses: misses
        });
    } catch (err) {
        console.error('Analytics-Service /stats error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

async function start() {
    await connectMongo();
    await startConsumer();

    const port = process.env.ANALYTICS_PORT || 4002;
    app.listen(port, () =>
        console.log(`Analytics-Service listening on port ${port}`)
    );
}

start();
