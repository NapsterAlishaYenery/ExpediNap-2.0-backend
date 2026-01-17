const express = require('express');
const router = express.Router();

// Middlewares
const authMiddleware = require('../middleware/auth.middleware');
const isAdminMiddleware = require('../middleware/isAdmin.middleware');
const writeLimiter = require('../middleware/rateLimiter.middleware');
const validateTransferOrder = require('../middleware/validate-order-transfer.middleware');

// Controlador
const transferOrderController = require('../controllers/transfer-order.controller');



// Crear solicitud de transporte 
router.post('/request', [writeLimiter, validateTransferOrder.create], transferOrderController.createTransferOrder);

// Obtener todas las órdenes 
router.get('/all-orders', [authMiddleware, isAdminMiddleware], transferOrderController.getAllTransferOrders);

// Obtener estadísticas de transporte
router.get('/stats', [authMiddleware, isAdminMiddleware], transferOrderController.getTransferStats);

// Obtener el detalle 
router.get('/detail/:id', [authMiddleware, isAdminMiddleware, validateTransferOrder.id], transferOrderController.getTransferOrderById);

// Actualizar 
router.patch('/update/:id', [authMiddleware, isAdminMiddleware, writeLimiter, validateTransferOrder.id, validateTransferOrder.update], transferOrderController.updateTransferOrder);

// Borrado lógico 
router.delete('/delete/:id', [authMiddleware, isAdminMiddleware, validateTransferOrder.id], transferOrderController.deleteTransferOrder);

// Borrado físico 
router.delete('/purge/:id', [authMiddleware, isAdminMiddleware, validateTransferOrder.id], transferOrderController.purgeTransferOrder);

module.exports = router;