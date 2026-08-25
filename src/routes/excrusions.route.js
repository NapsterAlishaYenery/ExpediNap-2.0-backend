const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const isAdminMiddleware = require('../middleware/isAdmin.middleware');
const validateExcursion = require('../middleware/validate-excursion.middleware');
const validateID = require('../middleware/validate-id.middleware');
const writeLimiter = require('../middleware/rateLimiter.middleware');
const upload = require('../middleware/upload.middleware');

const excursionController = require('../controllers/excursion.controller');


//RUTAS GET
router.get('/all', excursionController.getAllExcursions);
router.get('/all-for-select', excursionController.getExcursionsSimpleList);
router.get('/detail/:id', validateID.id, excursionController.getExcursionsByID);
router.get('/slug/:slug', excursionController.getExcursionBySlug);

//RUTAS UPDATE
router.patch('/update/:id', 
    authMiddleware, 
    isAdminMiddleware, 
    writeLimiter, 
    validateID.id, 
    validateExcursion.update, 
    excursionController.upDateExcursion);

/**
 * SWAP MAIN IMAGE - Intercambiar una imagen de la galería con la imagen principal
 * PATCH /api/excursions/:id/swap-main
 * Body: { galleryIndex: number }
 */
router.patch('/:id/swap-main',
    validateID.id,
    authMiddleware,
    isAdminMiddleware,
    writeLimiter,
    excursionController.swapImageWithMain
);

//RUTA CREATE CON VIDEOS E IMAGENES
router.post('/create', authMiddleware,
    isAdminMiddleware,
    writeLimiter,
    upload.array('images', 10),
    validateExcursion.create,
    excursionController.createExcursion);

// RUTA AGREGAR IMÁGENES/VIDEOS A GALERÍA
// POST /api/excursions/:id/gallery
router.post('/:id/gallery',
    validateID.id,
    authMiddleware,
    isAdminMiddleware,
    writeLimiter,
    upload.array('images', 10),  // Soporta imágenes y videos (hasta 10 archivos)
    excursionController.addGalleryImages
);

//RUTA DELETE
router.delete('/delete/:id', 
    authMiddleware, 
    isAdminMiddleware, 
    writeLimiter, 
    validateID.id, 
    excursionController.deleteExcursion
);

/**
 * DELETE GALLERY IMAGE - Eliminar una imagen de la galería por índice
 * DELETE /api/excursions/:id/gallery/:index
 */
router.delete('/:id/gallery/:index',
    validateID.id,
    authMiddleware,
    isAdminMiddleware,
    writeLimiter,
    excursionController.deleteGalleryImage
);



module.exports = router