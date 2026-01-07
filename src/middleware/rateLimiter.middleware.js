// Rate Limiter para ESCRITURA
const rateLimit = require('express-rate-limit');

const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, //50 peticiones por IP en 15 minutos para estas operaciones
    message: 'Too many write/edit requests. Please try again later.',
    headers: true, 
});

module.exports = writeLimiter;