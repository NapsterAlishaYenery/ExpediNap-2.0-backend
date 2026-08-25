const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weather.controller');

const authMiddleware  = require('../middleware/auth.middleware');
const isAdminMiddleware = require('../middleware/isAdmin.middleware');

// ✅ GET - Obtener clima (con cache por defecto)
router.get('/', weatherController.getWeather);

// ✅ POST - Forzar actualización (solo admin)
router.post('/refresh',  authMiddleware, isAdminMiddleware, weatherController.refreshWeather);

module.exports = router;