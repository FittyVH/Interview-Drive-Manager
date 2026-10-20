const { createClient } = require('redis')

const redisClient = createClient({
    url: process.env.REDIS_URI
})

redisClient.on('error', (err) => console.error('Redis Client Error:', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

async function connectToRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect()
    }
}

module.exports = { redisClient, connectToRedis }