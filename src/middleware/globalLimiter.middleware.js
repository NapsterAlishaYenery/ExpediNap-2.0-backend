const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 500, 
    message: {
        status: 429,
        message: 'You have made too many requests. For security reasons, please wait 15 minutes.'
    },
    standardHeaders: true, 
    legacyHeaders: false, 
});

module.exports = globalLimiter;