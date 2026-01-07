const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500, // Permitir 300 peticiones por cada 15 min
    message: {
        status: 429,
        message: 'You have made too many requests. For security reasons, please wait 15 minutes.'
    },
    standardHeaders: true, // Retorna info del límite en los headers `RateLimit-*`
    legacyHeaders: false, // Desactiva los headers antiguos `X-RateLimit-*`
});

module.exports = globalLimiter;