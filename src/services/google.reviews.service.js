// src/services/google.reviews.service.js
const axios = require('axios');
const { API_KEY, PLACE_ID, API_URL, FIELD_MASK } = require('../config/google.places.config');
const cacheService = require('./cache.service');

/**
 * Obtiene las reseñas de Google Places API (con cache)
 */
const getGoogleReviews = async (forceRefresh = false) => {
    // ✅ Clave única para este cache
    const CACHE_KEY = `google_reviews_${PLACE_ID}`;
    
    // ✅ Si se fuerza actualización, eliminar cache
    if (forceRefresh) {
        cacheService.del(CACHE_KEY);
    }

    // ✅ Obtener del cache o ejecutar la petición
    const result = await cacheService.getOrSet(
        CACHE_KEY,
        async () => {
            try {
                const URL = `${API_URL}/${PLACE_ID}`;

                const response = await axios.get(URL, {
                    headers: {
                        'X-Goog-Api-Key': API_KEY,
                        'X-Goog-FieldMask': FIELD_MASK
                    }
                });

                // ✅ Transformar los datos
                const transformedData = {
                    rating: response.data.rating,
                    totalReviews: response.data.userRatingCount,
                    businessName: response.data.displayName?.text || 'Expedinap',
                    reviews: response.data.reviews?.map(rev => ({
                        author: rev.authorAttribution?.displayName || 'Anónimo',
                        photo: rev.authorAttribution?.photoUri || null,
                        rating: rev.rating || 0,
                        text: rev.text?.text || '',
                        relativeTime: rev.relativePublishTimeDescription || '',
                        publishDate: rev.publishTime || null
                    })) || []
                };

                console.log(`✅ Google Reviews actualizados (${transformedData.totalReviews} reseñas)`);
                return transformedData;

            } catch (error) {
                console.error('Error al obtener reseñas de Google:', error.message);

                if (error.response) {
                    throw {
                        status: error.response.status,
                        message: error.response.data.error?.message || 'Error in the external Google API',
                        type: 'EXTERNAL_API_ERROR'
                    };
                }

                throw {
                    status: 500,
                    message: 'Error retrieving Google reviews',
                    type: 'SERVICE_ERROR'
                };
            }
        },
        3600 // 1 hora de cache
    );

    return result;
};

/**
 * Forzar actualización de reseñas (para admin)
 */
const refreshGoogleReviews = async () => {
    return await getGoogleReviews(true);
};

module.exports = {
    getGoogleReviews,
    refreshGoogleReviews
};