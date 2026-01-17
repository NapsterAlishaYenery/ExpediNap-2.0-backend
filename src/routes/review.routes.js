const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const isAdminMiddleware = require('../middleware/isAdmin.middleware')
const writeLimiter = require('../middleware/rateLimiter.middleware')
const reviewController = require('../controllers/review.controller');
const validateReview = require('../middleware/validate-review.middleware');


// Crear una reseña 
router.post('/create', [writeLimiter, validateReview.create], reviewController.createReview);

// Obtener reseñas aprobadas 
router.get('/all-approved', reviewController.getApprovedReviews);

// Obtener estadísticas 
router.get('/stats', reviewController.getReviewStats);

// Listado maestro 
router.get('/all', [authMiddleware, isAdminMiddleware], reviewController.getAllReviewsAdmin);

// Actualizar
router.patch('/update/:id', [authMiddleware, isAdminMiddleware, writeLimiter, validateReview.id, validateReview.upDate], reviewController.updateReview);

// Borrado lógico 
router.delete('/delete/:id', [authMiddleware, isAdminMiddleware, writeLimiter, validateReview.id], reviewController.deleteReview);

// Borrado físico 
router.delete('/purge/:id', [authMiddleware, isAdminMiddleware, writeLimiter, validateReview.id], reviewController.purgeReview);

module.exports = router;