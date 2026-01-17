const express = require('express');
const router = express.Router();

// Middlewares
const authMiddleware = require('../middleware/auth.middleware');
const isAdminMiddleware = require('../middleware/isAdmin.middleware');
const writeLimiter = require('../middleware/rateLimiter.middleware');
const validateExcursionOrder = require('../middleware/validate-order-excursion.middleware'); //falta

// Controlador
const excursionOrderController = require('../controllers/excursion-order.controller');


router.post('/request', [writeLimiter, validateExcursionOrder.create], excursionOrderController.createExcursionOrder);

// Obtener todas las órdenes 
router.get('/all-orders', [authMiddleware, isAdminMiddleware], excursionOrderController.getAllExcursionOrders);

// Obtener estadísticas 
router.get('/stats', [ authMiddleware, isAdminMiddleware], excursionOrderController.getExcursionStats);

// Detalle 
router.get('/detail/:id', [authMiddleware, isAdminMiddleware, validateExcursionOrder.id], excursionOrderController.getExcursionOrderById);

// Actualizar 
router.patch('/update/:id', [authMiddleware, isAdminMiddleware, writeLimiter, validateExcursionOrder.id, validateExcursionOrder.update], excursionOrderController.updateExcursionOrder);

// Borrado lógico
router.delete('/delete/:id', [authMiddleware, isAdminMiddleware, validateExcursionOrder.id], excursionOrderController.deleteExcursionOrder);

// Borrado físico 
router.delete('/purge/:id', [authMiddleware, isAdminMiddleware, validateExcursionOrder.id], excursionOrderController.purgeExcursionOrder);

module.exports = router;