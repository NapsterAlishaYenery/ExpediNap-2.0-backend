const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review-google-api.controller');

// GET: /api/google/review
router.get('/review', reviewController.getGoogleReviews);

module.exports = router;