// src/services/weather.service.js
const axios = require('axios');
const { API_KEY, API_URL, DEFAULT_UNITS, DEFAULT_LANG } = require('../config/weather.config');
const cacheService = require('./cache.service');

/**
 * Obtiene el clima de una ciudad con cache
 * @param {string} city - Nombre de la ciudad
 * @param {boolean} forceRefresh - Forzar actualización
 * @returns {Promise<Object>} - Datos del clima
 */
const getWeather = async (city, forceRefresh = false) => {
    // ✅ Clave única para el cache (incluye la ciudad)
    const CACHE_KEY = `weather_${city.toLowerCase().trim()}`;
    
    // ✅ Si se fuerza actualización, eliminar cache
    if (forceRefresh) {
        cacheService.del(CACHE_KEY);
    }

    // ✅ Obtener del cache o ejecutar la petición
    const result = await cacheService.getOrSet(
        CACHE_KEY,
        async () => {
            try {
                const response = await axios.get(API_URL, {
                    params: {
                        q: city,
                        appid: API_KEY,
                        units: DEFAULT_UNITS,
                        lang: DEFAULT_LANG
                    }
                });

                // ✅ Transformar los datos
                const filteredData = {
                    name: response.data.name,
                    temp: Math.round(response.data.main.temp),
                    description: response.data.weather[0].description,
                    icon: response.data.weather[0].icon,
                    humidity: response.data.main.humidity,
                    // ✅ Datos adicionales útiles
                    //feelsLike: Math.round(response.data.main.feels_like),
                    //windSpeed: response.data.wind.speed,
                    //country: response.data.sys.country
                };

                console.log(`✅ Clima actualizado para ${city}: ${filteredData.temp}°C`);
                return filteredData;

            } catch (error) {
                console.error(`Error al obtener clima para ${city}:`, error.message);

                if (error.response) {
                    throw {
                        status: error.response.status,
                        message: error.response.data.message || 'Error fetching weather data',
                        type: 'EXTERNAL_API_ERROR'
                    };
                }

                throw {
                    status: 500,
                    message: 'Error retrieving weather data',
                    type: 'SERVICE_ERROR'
                };
            }
        },
        1800 // 30 minutos de cache (configurable)
    );

    return result;
};

/**
 * Forzar actualización del clima (para admin)
 */
const refreshWeather = async (city) => {
    return await getWeather(city, true);
};

module.exports = {
    getWeather,
    refreshWeather
};