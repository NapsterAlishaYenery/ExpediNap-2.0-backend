const express = require('express');
const router = express.Router();

// Middlewares de seguridad
const authMiddleware = require('../middleware/auth.middleware');
const isAdminMiddleware = require('../middleware/isAdmin.middleware');
const writeLimiter = require('../middleware/rateLimiter.middleware');

// Controlador
const ncfController = require('../controllers/ncf.controller');

// El Validador que acabamos de pulir
const validateNcf = require('../middleware/validate-ncf.middleware');

/**
 * RUTAS PARA EL POOL DE NCF
 * Base Path sugerido: /api/ncf
 */

// --- RUTAS GET (Lectura) ---

// Obtener todos los NCFs con filtros y paginación (Solo Admin)
router.get('/all', authMiddleware, isAdminMiddleware, ncfController.getAllNcfs
);

// Obtener estadísticas de disponibilidad (Solo Admin)
router.get('/stats', authMiddleware, isAdminMiddleware, ncfController.getNcfStats
);

// --- RUTAS POST (Escritura) ---
// Carga individual de un NCF (Solo Admin + Limiter)
router.post('/save-single', authMiddleware, isAdminMiddleware, writeLimiter, validateNcf.createSingle, ncfController.saveSingleNcf
);

// Carga masiva de NCFs (Solo Admin + Limiter)
router.post('/save-bulk', authMiddleware, isAdminMiddleware, writeLimiter, validateNcf.createBulk, ncfController.saveBulkNcfs
);


// --- RUTAS DELETE (Eliminación) ---

// Eliminar un NCF específico (Solo Admin + Limiter)
router.delete('/delete/:id', authMiddleware, isAdminMiddleware, writeLimiter, validateNcf.id, ncfController.deleteNcf
);

module.exports = router;