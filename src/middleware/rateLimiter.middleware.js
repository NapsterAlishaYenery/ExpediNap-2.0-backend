const rateLimit = require('express-rate-limit');

const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, 
    message: 'Too many write/edit requests. Please try again later.',
    headers: true, 
});

module.exports = writeLimiter;