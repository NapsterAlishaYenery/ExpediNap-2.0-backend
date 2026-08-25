// src/controllers/weather.controller.js
const { getWeather, refreshWeather } = require('../services/weather.service');

/**
 * Obtiene el clima de una ciudad (con cache)
 * GET /api/weather?city=Punta%20Cana
 * GET /api/weather?city=Punta%20Cana&refresh=true
 */
exports.getWeather = async (req, res) => {
    try {
        const { city, refresh } = req.query;
        
        if (!city) {
            return res.status(400).json({
                ok: false,
                message: 'The City is required',
                type: 'VALIDATION_ERROR'
            });
        }

        // ✅ Si se pide refresh, forzar actualización
        const forceRefresh = refresh === 'true';
        const data = await getWeather(city, forceRefresh);

        return res.status(200).json({
            ok: true,
            message: 'Weather data retrieved successfully',
            data: data,
            cached: !forceRefresh
        });

    } catch (error) {
        console.error('Error en controlador de clima:', error);

        res.status(error.status || 500).json({
            ok: false,
            message: error.message || 'Internal server error while fetching weather',
            type: error.type || 'SERVER_ERROR'
        });
    }
};

/**
 * Forzar actualización del clima (endpoint admin)
 * POST /api/weather/refresh
 */
exports.refreshWeather = async (req, res) => {
    try {
        const { city } = req.body;
        
        if (!city) {
            return res.status(400).json({
                ok: false,
                message: 'City is required',
                type: 'VALIDATION_ERROR'
            });
        }

        const data = await refreshWeather(city);

        res.status(200).json({
            ok: true,
            message: 'Weather refreshed successfully',
            data: data
        });

    } catch (error) {
        console.error('Error refrescando clima:', error);

        res.status(error.status || 500).json({
            ok: false,
            message: error.message || 'Error refreshing weather',
            type: error.type || 'SERVER_ERROR'
        });
    }
};