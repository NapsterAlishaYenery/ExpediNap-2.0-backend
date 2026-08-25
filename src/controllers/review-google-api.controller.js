// src/controllers/review-google-api.controller.js
const { getGoogleReviews, refreshGoogleReviews } = require('../services/google.reviews.service');

/**
 * Obtiene las reseñas de Google (con cache)
 */
exports.getGoogleReviews = async (req, res) => {
    try {
        // ✅ Si se pide refresh, actualizar cache
        const forceRefresh = req.query.refresh === 'true';
        
        const data = await getGoogleReviews(forceRefresh);

        res.status(200).json({
            ok: true,
            message: 'Google reviews retrieved successfully',
            data: data,
            cached: !forceRefresh
        });

    } catch (error) {
        console.error('Error en controlador de reseñas:', error);

        res.status(error.status || 500).json({
            ok: false,
            message: error.message || 'Internal server error',
            type: error.type || 'SERVER_ERROR'
        });
    }
};

/**
 * Forzar actualización de reseñas (endpoint admin)
 */
exports.refreshGoogleReviews = async (req, res) => {
    try {
        const data = await refreshGoogleReviews();

        res.status(200).json({
            ok: true,
            message: 'Google reviews refreshed successfully',
            data: data
        });

    } catch (error) {
        console.error('Error refrescando reseñas:', error);

        res.status(error.status || 500).json({
            ok: false,
            message: error.message || 'Error refreshing reviews',
            type: error.type || 'SERVER_ERROR'
        });
    }
};