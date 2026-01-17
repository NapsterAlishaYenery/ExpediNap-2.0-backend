const express = require('express');
const router = express.Router();

// Middlewares
const authMiddleware = require('../middleware/auth.middleware');
const isAdminMiddleware = require('../middleware/isAdmin.middleware');
const writeLimiter = require('../middleware/rateLimiter.middleware');
const validateYachtOrder = require('../middleware/validate-order-yacht.middleware');

// Controlador
const yachtOrderController = require('../controllers/yacht-order.controller');


// Crear solicitud de reserva 
router.post('/request', [writeLimiter, validateYachtOrder.create], yachtOrderController.createYachtOrder);


// Obtener todas las órdenes 
router.get('/all-orders', [authMiddleware, isAdminMiddleware], yachtOrderController.getAllYachtOrders);

// Obtener estadísticas financieras 
router.get('/stats', [authMiddleware, isAdminMiddleware], yachtOrderController.getYachtStats);

// Obtener el detalle 
router.get('/detail/:id', [authMiddleware, isAdminMiddleware, validateYachtOrder.id], yachtOrderController.getYachtOrderById);

// Actualizar estado
router.patch('/update/:id', [authMiddleware, isAdminMiddleware, writeLimiter, validateYachtOrder.id, validateYachtOrder.update], yachtOrderController.updateYachtOrder);

// Borrado lógico 
router.delete('/delete/:id', [authMiddleware, isAdminMiddleware, validateYachtOrder.id], yachtOrderController.deleteYachtOrder);

// Borrado físico 
router.delete('/purge/:id', [authMiddleware, isAdminMiddleware, validateYachtOrder.id], yachtOrderController.purgeYachtOrder);

module.exports = router;