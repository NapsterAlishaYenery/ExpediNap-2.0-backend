const axios = require('axios');

/**
 * Obtiene las reseñas reales de Google Business Profile (Places API New)
 * Las variables sensibles se extraen del .env para mayor seguridad.
 */
exports.getGoogleReviews = async (req, res) => {
    try {
        // 1. Extraemos las credenciales del entorno (.env)
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        const placeId = process.env.GOOGLE_PLACE_ID;

        // 2. Definimos las constantes de la petición
        // La URL utiliza el Place ID de ExpediNap
        const URL = `https://places.googleapis.com/v1/places/${placeId}`;

        // El FieldMask le dice a Google exactamente qué campos queremos (ahorra ancho de banda y costos)
        const FIELD_MASK = 'rating,userRatingCount,reviews,displayName';

        // 3. Realizamos la llamada a la API de Google usando Axios
        const response = await axios.get(URL, {
            headers: {
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': FIELD_MASK
            }
        });

        // 4. Mapeamos y filtramos la respuesta para enviarle al Frontend solo lo necesario
        const filteredData = {
            rating: response.data.rating,
            totalReviews: response.data.userRatingCount,
            businessName: response.data.displayName.text,
            // Transformamos el arreglo de reseñas de Google a nuestro formato
            reviews: response.data.reviews.map(rev => ({
                author: rev.authorAttribution.displayName,
                photo: rev.authorAttribution.photoUri,
                rating: rev.rating,
                text: rev.text.text,
                relativeTime: rev.relativePublishTimeDescription,
                publishDate: rev.publishTime
            }))
        };

        // 5. Respuesta exitosa
        return res.status(200).json({
            ok: true,
            message: 'Google reviews retrieved successfully',
            data: filteredData
        });

    } catch (error) {
        // Manejo de errores detallado
        console.error('Error al obtener reseñas de Google:', error.message);

        // Si el error viene de la API de Google (ej: API Key inválida)
        if (error.response) {
            return res.status(error.response.status).json({
                ok: false,
                message: error.response.data.error?.message || 'Error en la API externa de Google',
                type: 'EXTERNAL_API_ERROR'
            });
        }

        // Error genérico del servidor
        res.status(500).json({
            ok: false,
            message: 'Internal server error while fetching Google reviews',
            type: 'SERVER_ERROR'
        });
    }
};