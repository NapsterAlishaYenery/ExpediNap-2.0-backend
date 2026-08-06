require('dotenv').config();

module.exports = {
    API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    PLACE_ID: process.env.GOOGLE_PLACE_ID,
    API_URL: 'https://places.googleapis.com/v1/places',
    FIELD_MASK: 'rating,userRatingCount,reviews,displayName'
};