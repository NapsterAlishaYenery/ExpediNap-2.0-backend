const axios = require('axios');
const { getGoogleReviews } = require('../services/google.reviews.service');

/**
 * Obtiene las reseñas reales de Google Business Profile (Places API New)
 * Las variables sensibles se extraen del .env para mayor seguridad.
 */
exports.getGoogleReviews = async (req, res) => {
    try {
        
        const data = await getGoogleReviews();

        res.status(200).json({
            ok: true,
            message: 'Google reviews retrieved successfully',
            data: data
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