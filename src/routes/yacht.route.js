const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const isAdminMiddleware = require('../middleware/isAdmin.middleware');
const validateYacht = require('../middleware/validate-yacht.middleware');
const writeLimiter = require('../middleware/rateLimiter.middleware');

const yachtController = require('../controllers/yacht.controller');

//RUTAS GET
router.get('/all', yachtController.getAllYatch);
router.get('/detail/:id', validateYacht.id, yachtController.getYatchByID);

//RUTAS UPDATE
router.patch('/update/:id', authMiddleware, isAdminMiddleware, writeLimiter, validateYacht.id, validateYacht.upDate, yachtController.upDateYatch);

//RUTA CREATE
router.post('/create', authMiddleware, isAdminMiddleware, writeLimiter, validateYacht.create, yachtController.createYatch);

//RUTA DELETE
router.delete('/delete/:id', authMiddleware, isAdminMiddleware, writeLimiter, validateYacht.id, yachtController.deleteYatch);

module.exports = router