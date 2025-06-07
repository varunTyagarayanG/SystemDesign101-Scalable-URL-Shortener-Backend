
const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('redis');

// Make sure to set REDIS_URL in your .env (e.g. redis://redis:6379)
const redisClient = Redis.createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

// Allow 100 points (requests) per 60 seconds per IP
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rlflx',
    points: 100,
    duration: 60,
    inmemoryBlockOnConsumed: 200,  // temporarily block if they burn too many
    inmemoryBlockDuration: 60
});

module.exports = async function rateLimiterMiddleware(req, res, next) {
    try {
        // key by IP
        await rateLimiter.consume(req.ip);
        next();
    } catch (rejRes) {
        res
            .status(429)
            .set('Retry-After', String(Math.round(rejRes.msBeforeNext / 1000)))
            .json({ error: 'Too many requests, please slow down.' });
    }
};
