// src/config/weather.config.js
require('dotenv').config();

module.exports = {
    API_KEY: process.env.OPEN_WEATHER_API_KEY,
    API_URL: 'https://api.openweathermap.org/data/2.5/weather',
    DEFAULT_UNITS: 'metric',
    DEFAULT_LANG: 'es',
    // ✅ Tiempo de cache para clima (30 minutos)
    CACHE_TTL: 1800 // 30 segundos * 60 = 1800
};