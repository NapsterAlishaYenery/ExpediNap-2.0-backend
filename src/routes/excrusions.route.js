const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const isAdminMiddleware = require('../middleware/isAdmin.middleware');
const validateExcursion = require('../middleware/validate-excursion.middleware');
const writeLimiter = require('../middleware/rateLimiter.middleware');

const excursionController = require('../controllers/excursion.controller');

//RUTAS GET
router.get('/all', excursionController.getAllExcursions);
router.get('/all-for-select', excursionController.getExcursionsSimpleList);
router.get('/detail/:id', validateExcursion.id, excursionController.getExcursionsByID);


//RUTAS UPDATE
router.patch('/update/:id', authMiddleware, isAdminMiddleware, writeLimiter, validateExcursion.id, validateExcursion.upDate, excursionController.upDateExcursion);

//RUTA CREATE
router.post('/create', authMiddleware, isAdminMiddleware, writeLimiter, validateExcursion.create, excursionController.createExcursion);

//RUTA DELETE
router.delete('/delete/:id', authMiddleware, isAdminMiddleware, writeLimiter, validateExcursion.id, excursionController.deleteExcursion);

module.exports = router