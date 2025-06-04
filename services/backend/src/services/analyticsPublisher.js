// services/backend/src/services/analyticsPublisher.js

const amqplib = require('amqplib');
require('dotenv').config();

const RABBITMQ_URL = process.env.RABBITMQ_URL;

let connection, channel;

// Try to connect up to `retries` times, waiting `delayMs` between attempts
async function connectRabbitMQ(retries = 5, delayMs = 2000) {
    for (let i = 1; i <= retries; i++) {
        try {
            connection = await amqplib.connect(RABBITMQ_URL);
            channel = await connection.createChannel();
            await channel.assertExchange('urlEvents', 'fanout', { durable: true });
            console.log('Connected to RabbitMQ');
            return;
        } catch (err) {
            console.warn(
                `RabbitMQ connection attempt ${i} failed (${err.message}). Retrying in ${delayMs}ms…`
            );
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
    console.error(`Failed to connect to RabbitMQ after ${retries} attempts.`);
    process.exit(1);
}

async function publishEvent(eventType, payload) {
    if (!channel) {
        console.error('RabbitMQ channel not initialized');
        return;
    }
    const message = {
        type: eventType,
        data: payload,
        timestamp: new Date().toISOString()
    };
    channel.publish(
        'urlEvents',
        '',
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
    );
}

module.exports = { connectRabbitMQ, publishEvent };
