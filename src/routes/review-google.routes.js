const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review-google-api.controller');

const authMiddleware  = require('../middleware/auth.middleware');
const isAdminMiddleware = require('../middleware/isAdmin.middleware');

// ✅ GET - Obtener reseñas (con cache por defecto)
router.get('/review',reviewController.getGoogleReviews);

// ✅ GET - Forzar actualización (solo admin)
router.get('/review/refresh', authMiddleware, isAdminMiddleware,  reviewController.refreshGoogleReviews);

module.exports = router;