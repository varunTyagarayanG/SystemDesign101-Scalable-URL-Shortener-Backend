// services/backend/src/services/analyticsPublisher.js

const amqplib = require('amqplib');
require('dotenv').config();

const RABBITMQ_URL = process.env.RABBITMQ_URL;

let connection, channel;

/**
 * Connect to RabbitMQ, retrying indefinitely with a short delay until successful.
 */
async function connectRabbitMQ(delayMs = 2000) {
    while (true) {
        try {
            connection = await amqplib.connect(RABBITMQ_URL);
            channel = await connection.createChannel();
            await channel.assertExchange('urlEvents', 'fanout', { durable: true });
            console.log('Connected to RabbitMQ');
            return;
        } catch (err) {
            console.warn(
                `RabbitMQ connection failed (${err.message}). Retrying in ${delayMs}ms…`
            );
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
}

async function publishEvent(eventType, payload) {
    if (!channel) {
        console.error('RabbitMQ channel not initialized; dropping event');
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
