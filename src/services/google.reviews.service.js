// src/services/google.reviews.service.js
const axios = require('axios');
const { API_KEY, PLACE_ID, API_URL, FIELD_MASK } = require('../config/google.places.config');

/**
 * Obtiene las reseñas de Google Places API
 */
const getGoogleReviews = async () => {
    try {
        const URL = `${API_URL}/${PLACE_ID}`;

        const response = await axios.get(URL, {
            headers: {
                'X-Goog-Api-Key': API_KEY,
                'X-Goog-FieldMask': FIELD_MASK
            }
        });

        // ✅ Transformar los datos a nuestro formato
        const transformedData = {
            rating: response.data.rating,
            totalReviews: response.data.userRatingCount,
            businessName: response.data.displayName?.text || 'Hadassa05',
            reviews: response.data.reviews?.map(rev => ({
                author: rev.authorAttribution?.displayName || 'Anónimo',
                photo: rev.authorAttribution?.photoUri || null,
                rating: rev.rating || 0,
                text: rev.text?.text || '',
                relativeTime: rev.relativePublishTimeDescription || '',
                publishDate: rev.publishTime || null
            })) || []
        };

        return transformedData;

    } catch (error) {
        console.error('Error al obtener reseñas de Google:', error.message);

        if (error.response) {
            throw {
                status: error.response.status,
                message: error.response.data.error?.message || 'Error en la API externa de Google',
                type: 'EXTERNAL_API_ERROR'
            };
        }

        throw {
            status: 500,
            message: 'Error al obtener reseñas de Google',
            type: 'SERVICE_ERROR'
        };
    }
};

module.exports = {
    getGoogleReviews
};