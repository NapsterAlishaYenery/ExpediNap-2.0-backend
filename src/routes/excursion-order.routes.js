const express = require('express');
const router = express.Router();

// Middlewares
const authMiddleware = require('../middleware/auth.middleware');
const isAdminMiddleware = require('../middleware/isAdmin.middleware');
const writeLimiter = require('../middleware/rateLimiter.middleware');
const validateExcursionOrder = require('../middleware/validate-order-excursion.middleware');
const validateID = require('../middleware/validate-id.middleware');

// Controlador
const excursionOrderController = require('../controllers/excursion-order.controller');


// ==========================================
// RUTAS DE PAGO (DESACTIVADAS TEMPORALMENTE)
// ==========================================
// Angular llamará aquí después de que el usuario apruebe el pago
// router.post('/paypal/capture/:orderId', excursionOrderController.captureExcursionPayment);
// router.post('/request', [writeLimiter, validateExcursionOrder.create], excursionOrderController.createExcursionOrder);


// ==========================================
// NUEVA RUTA: RESERVA MANUAL (WHATSAPP)
// ==========================================
// Esta es la que Angular usará ahora
router.post('/manual-request', [writeLimiter, validateExcursionOrder.create], excursionOrderController.createManualExcursionOrder);

// Obtener todas las órdenes 
router.get('/all-orders', [authMiddleware, isAdminMiddleware], excursionOrderController.getAllExcursionOrders);

// Obtener estadísticas 
router.get('/stats', [ authMiddleware, isAdminMiddleware], excursionOrderController.getExcursionStats);

// Detalle 
router.get('/detail/:id', [authMiddleware, isAdminMiddleware, validateID.id], excursionOrderController.getExcursionOrderById);

// Actualizar 
router.patch('/update/:id', [authMiddleware, isAdminMiddleware, writeLimiter, validateID.id, validateExcursionOrder.update], excursionOrderController.updateExcursionOrder);

// Borrado lógico
router.delete('/delete/:id', [authMiddleware, isAdminMiddleware, validateID.id], excursionOrderController.deleteExcursionOrder);

// Borrado físico 
router.delete('/purge/:id', [authMiddleware, isAdminMiddleware, validateID.id], excursionOrderController.purgeExcursionOrder);




module.exports = router;