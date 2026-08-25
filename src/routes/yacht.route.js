const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const isAdminMiddleware = require('../middleware/isAdmin.middleware');
const validateYacht = require('../middleware/validate-yacht.middleware');
const writeLimiter = require('../middleware/rateLimiter.middleware');
const upload = require('../middleware/upload.middleware');
const validateID = require('../middleware/validate-id.middleware');

const yachtController = require('../controllers/yacht.controller');

// ========================================
// RUTAS GET
// ========================================
router.get('/all', yachtController.getAllYatch);
router.get('/all-for-select', yachtController.getYachtsSimpleList);
router.get('/detail/:id', validateID.id, yachtController.getYatchByID);
router.get('/slug/:slug', yachtController.getYachtBySlug);

// ========================================
// RUTA UPDATE (solo texto)
// ========================================
router.patch('/update/:id', 
    authMiddleware, 
    isAdminMiddleware, 
    writeLimiter, 
    validateID.id, 
    validateYacht.update, 
    yachtController.upDateYatch
);

// ========================================
// RUTA CREATE (con imágenes)
// ========================================
router.post('/create', 
    authMiddleware, 
    isAdminMiddleware, 
    writeLimiter,
    upload.array('images', 10), 
    validateYacht.create, 
    yachtController.createYatch
);

// ========================================
// RUTA DELETE (elimina yate + imágenes)
// ========================================
router.delete('/delete/:id', 
    authMiddleware, 
    isAdminMiddleware, 
    writeLimiter, 
    validateID.id, 
    yachtController.deleteYatch
);

// ========================================
// 🆕 RUTAS DE GALERÍA
// ========================================

// 1. Agregar imágenes/videos a la galería
router.post('/:id/gallery',
    validateID.id,
    authMiddleware,
    isAdminMiddleware,
    writeLimiter,
    upload.array('images', 10),
    yachtController.addYachtGalleryImages
);

// 2. Eliminar una imagen de la galería por índice
router.delete('/:id/gallery/:index',
    validateID.id,
    authMiddleware,
    isAdminMiddleware,
    writeLimiter,
    yachtController.deleteYachtGalleryImage
);

// 3. Intercambiar imagen principal con una de la galería
router.patch('/:id/swap-main',
    validateID.id,
    authMiddleware,
    isAdminMiddleware,
    writeLimiter,
    yachtController.swapYachtMainImage
);

module.exports = router;