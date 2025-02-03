const { RateLimiterMemory } = require('rate-limiter-flexible');
const crypto = require('crypto');

const rateLimiter = new RateLimiterMemory({
    points : 5,
    duration : 60
});

const generateShortUrl = () => {
    return crypto.randomBytes(4).toString('hex'); // Generates a 8-character hex string
  };

exports.rateLimit = rateLimiter;
exports.generateShortURL = generateShortUrl;