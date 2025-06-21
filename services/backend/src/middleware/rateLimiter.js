
const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('redis');

const redisClient = Redis.createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);


const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rlflx',
    points: 100,
    duration: 60,
    inmemoryBlockOnConsumed: 200,  
    inmemoryBlockDuration: 60
});

module.exports = async function rateLimiterMiddleware(req, res, next) {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (rejRes) {
        res
            .status(429)
            .set('Retry-After', String(Math.round(rejRes.msBeforeNext / 1000)))
            .json({ error: 'Too many requests, please slow down.' });
    }
};
