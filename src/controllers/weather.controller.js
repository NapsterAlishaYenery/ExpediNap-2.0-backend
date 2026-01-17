
const axios = require('axios');

exports.getWeather = async (req, res) => {
    try {
        const { city } = req.query; 
        const apiKey =  process.env.OPEN_WEATHER_API_KEY;
        
        if (!city) {
            return res.status(400).json({
                ok: false,
                message: 'The City is required',
                type: 'VALIDATION_ERROR'
            });
        }

        const url = `https://api.openweathermap.org/data/2.5/weather`;
        
        const response = await axios.get(url, {
            params: {
                q: city,
                appid: apiKey,
                units: 'metric',
                lang: 'es'
            }
        });

        const filteredData = {
            name: response.data.name,
            temp: Math.round(response.data.main.temp),
            description: response.data.weather[0].description,
            icon: response.data.weather[0].icon,
            humidity: response.data.main.humidity
        };

        return res.status(200).json({
            ok: true,
            message: 'Weather data retrieved successfully',
            data: filteredData
        });

    } catch (error) {

        if (error.response) {
            return res.status(error.response.status).json({
                ok: false,
                message: error.response.data.message || 'Error fetching weather data',
                type: 'EXTERNAL_API_ERROR'
            });
        }

        res.status(500).json({
            ok: false,
            message: 'Internal server error while fetching weather',
            type: 'SERVER_ERROR'
        });
    }
};