const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL
});

client.on('error', (err) => console.error('Redis Client Error', err));

async function connectRedis() {
    try {
        await client.connect();
        console.log('Redis connected');
    } catch (err) {
        console.error('Redis connection error:', err);
        process.exit(1);
    }
}

module.exports = { client, connectRedis };
