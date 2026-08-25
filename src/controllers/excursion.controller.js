
const Excursions = require('../models/excursion.model');
const deleteLocalFiles = require('../utils/fileCleanup.util');
const { uploadFile, deleteFile } = require('../services/cloudinary.service');
const sanitizeFolderName = require('../utils/sanitize-folder-name');

/**
 * CREATE - Crear una nueva excursión
 * POST /api/excursions
 */
exports.createExcursion = async (req, res) => {
    try {
        // 1. Extraer los datos del body (ya validados por Joi)
        const excursionData = req.body;

        // 2. Validar que se hayan subido archivos (mínimo la imagen principal)
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'BadRequest',
                message: 'At least one image (main image) is required'
            });
        }

        // VERIFICAR DUPLICADO PRIMERO (antes de subir imágenes)
        const existingExcursion = await Excursions.findOne({
            name: excursionData.name
        })

        if (existingExcursion) {
            return res.status(400).json({
                ok: false,
                type: 'DuplicateError',
                message: `An excursion with name "${excursionData.name}" already exists.`
            });
        }

        // 3. Subir archivos a Cloudinary
        // pasar el nombre de la excurion
        const folderName = sanitizeFolderName(excursionData.name);
        const uploadPromises = req.files.map(file =>
            uploadFile(file.path, 'excursions', folderName)
        );

        const uploadResults = await Promise.all(uploadPromises);

        console.log('📦 Upload results:', uploadResults);

        // 4. Construir el objeto images (main + gallery)
        const mainImage = {
            public_id: uploadResults[0].public_id,
            url: uploadResults[0].url,
            thumbnailUrl: uploadResults[0].url,
            alt: excursionData.name || 'Excursion main image',
            mediaType: uploadResults[0].resource_type || 'image',
            width: uploadResults[0].width || 0,
            height: uploadResults[0].height || 0,
            format: uploadResults[0].format || 'jpg',
            order: 0,
            duration: uploadResults[0].duration || null
        };

        const galleryImages = uploadResults.slice(1).map((result, index) => ({
            public_id: result.public_id,
            url: result.url,
            thumbnailUrl: result.url,
            alt: `${excursionData.name} - Gallery ${index + 1}`,
            mediaType: result.resource_type || 'image',
            width: result.width || 0,
            height: result.height || 0,
            format: result.format || 'jpg',
            order: index + 1,
            duration: result.duration || null
        }));

        const images = {
            main: mainImage,
            gallery: galleryImages
        };

        // 5. Calcular order automáticamente
        const lastExcursion = await Excursions.findOne().sort({ order: -1 });
        const nextOrder = lastExcursion ? lastExcursion.order + 1 : 1;

        // 6. Construir el documento final
        const excursionDocument = {
            ...excursionData,
            images: images,
            cloudinaryFolder: folderName,
            order: nextOrder
        };

        // 7. Crear en la base de datos
        const newExcursion = await Excursions.create(excursionDocument);

        // 8. Respuesta exitosa
        res.status(201).json({
            ok: true,
            data: newExcursion,
            message: 'Excursion created successfully'
        });

    } catch (error) {
        console.error('--- CREATE EXCURSION ERROR ---', error);

        // Error de duplicado (nombre o slug duplicado)
        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                type: 'DuplicateError',
                message: 'An excursion with this name already exists. Please use another name.'
            });
        }

        // Error de validación de Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                messages: messages
            });
        }

        // Error genérico del servidor
        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Internal Server Error'
        });

    } finally {
        // 9. Limpiar archivos temporales
        if (req.files && req.files.length > 0) {
            await deleteLocalFiles(req.files);
        }
    }
};

/**
 * UPDATE - Actualizar una excursión (solo datos de texto)
 * PATCH /api/excursions/update/:id
 */
exports.upDateExcursion = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
        // 1. Buscar la excursión existente
        const existingExcursion = await Excursions.findById(id);

        if (!existingExcursion) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'The excursion does not exist.'
            });
        }

        // 2. ✅ Verificar duplicado de nombre (si se envía)
        if (updateData.name && updateData.name !== existingExcursion.name) {
            const nameExists = await Excursions.findOne({
                name: updateData.name,
                _id: { $ne: id }
            });

            if (nameExists) {
                return res.status(400).json({
                    ok: false,
                    type: 'DuplicateError',
                    message: `An excursion with the name "${updateData.name}" already exists.`
                });
            }
        }

        // 3. ✅ Verificar que al menos un campo sea actualizado (el middleware solo valida el formato)
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'At least one field must be provided for update.'
            });
        }

        // 4. ✅ Ejecutar la actualización (los campos prohibidos ya fueron filtrados por Joi)
        const updatedExcursion = await Excursions.findByIdAndUpdate(
            id,
            { $set: updateData },
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            ok: true,
            data: updatedExcursion,
            message: 'Excursion updated successfully'
        });

    } catch (error) {
        console.error('--- UPDATE EXCURSION ERROR ---', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                messages: messages
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                type: 'DuplicateError',
                message: 'The name already exists. Please choose another.'
            });
        }

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server'
        });
    }
};


/**
 * DELETE EXCURSION - Eliminar una excursión completa (con todas sus imágenes)
 * DELETE /api/excursions/delete/:id
 */
exports.deleteExcursion = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Buscar la excursión
        const excursion = await Excursions.findById(id);
        if (!excursion) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'The excursion you are trying to delete does not exist.'
            });
        }

        // 2. Recopilar TODOS los public_id de Cloudinary
        const publicIdsToDelete = [];

        // 2.1 Agregar main image
        if (excursion.images?.main?.public_id) {
            publicIdsToDelete.push(excursion.images.main);
        }

        // 2.2 Agregar todas las imágenes de la galería
        if (excursion.images?.gallery && excursion.images.gallery.length > 0) {
            excursion.images.gallery.forEach(img => {
                if (img) {
                    publicIdsToDelete.push(img);
                }
            });
        }

        // 3. Eliminar TODAS las imágenes de Cloudinary (en paralelo)
        if (publicIdsToDelete.length > 0) {
            console.log(`🗑️ Eliminando ${publicIdsToDelete.length} imágenes de Cloudinary...`);
            const deletePromises = publicIdsToDelete.map(item => deleteFile(item.public_id, item.mediaType));
            await Promise.all(deletePromises);
            console.log(`✅ ${publicIdsToDelete.length} imágenes eliminadas de Cloudinary`);
        } else {
            console.log('ℹ️ No se encontraron imágenes para eliminar en Cloudinary');
        }

        // 4. Eliminar el documento de la base de datos
        await Excursions.findByIdAndDelete(id);

        // 5. Respuesta exitosa
        res.status(200).json({
            ok: true,
            data: null,
            message: `Excursion "${excursion.name}" deleted successfully`
        });

    } catch (error) {
        console.error('--- DELETE EXCURSION ERROR ---', error);

        // Error de validación de ID
        if (error.name === 'CastError') {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'Invalid ID format'
            });
        }

        // Error genérico del servidor
        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred while deleting.'
        });
    }
};


/**
 * DELETE GALLERY IMAGE - Eliminar una imagen de la galería por índice
 * DELETE /api/excursions/:id/gallery/:index
 */
exports.deleteGalleryImage = async (req, res) => {
    try {
        const { id, index } = req.params;
        const galleryIndex = parseInt(index);

        // 1. Buscar la excursión
        const excursion = await Excursions.findById(id);
        if (!excursion) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'Excursion not found'
            });
        }

        // 2. Validar que la galería tenga imágenes
        if (!excursion.images.gallery || excursion.images.gallery.length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'BadRequest',
                message: 'Gallery is empty. No images to delete.'
            });
        }

        // 3. Validar que el índice exista
        if (galleryIndex < 0 || galleryIndex >= excursion.images.gallery.length) {
            return res.status(400).json({
                ok: false,
                type: 'BadRequest',
                message: `Index ${galleryIndex} does not exist. Gallery has ${excursion.images.gallery.length} images.`
            });
        }

        // 4. Obtener la imagen a eliminar
        const imageToDelete = excursion.images.gallery[galleryIndex];

        // 5. Eliminar de Cloudinary
        await deleteFile(imageToDelete.public_id, imageToDelete.mediaType);
        console.log(`✅ Imagen eliminada de Cloudinary: ${imageToDelete.public_id}`);

        // 6. Eliminar del array
        excursion.images.gallery.splice(galleryIndex, 1);

        // 7. Reordenar la galería (actualizar orders)
        excursion.images.gallery = excursion.images.gallery.map((img, idx) => ({
            ...img,
            order: idx + 1,
            alt: `${excursion.name} - Gallery ${idx + 1}`
        }));

        // 8. Forzar que Mongoose detecte el cambio
        excursion.markModified('images');

        // 9. Guardar
        await excursion.save();

        res.json({
            ok: true,
            data: excursion,
            message: `Gallery image at index ${galleryIndex} deleted successfully`
        });

    } catch (error) {
        console.error('--- DELETE GALLERY IMAGE ERROR ---', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                messages: messages
            });
        }

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Error deleting gallery image'
        });
    }
};


/**
 * GET ALL - Obtener todas las excursiones con filtros y paginación
 * GET /api/excursions/all?name=saona&category=sea&location=punta&page=1&limit=12
 */
exports.getAllExcursions = async (req, res) => {
    try {
        // 1. Capturar parámetros de filtro y paginación
        const { name, category, location, isFeatured  } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;

        // 2. Construir el objeto de búsqueda dinámico
        let query = {};

        // ✅ Filtro por Nombre (igual)
        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }

        // ✅ Filtro por Categoría (igual)
        if (category) {
            query.categories = category.toLowerCase();
        }

        // ✅ Filtro por Ubicación (AHORA usa locationName)
        if (location) {
            query['location.locationName'] = { $regex: location, $options: 'i' };
        }

        // ✅ NUEVO: Filtro por isFeatured
        if (isFeatured !== undefined) {
            // Convertir string a boolean
            query.isFeatured = isFeatured === 'true';
        }
        const skip = (page - 1) * limit;

        // 3. Ejecución concurrente (Promise.all)
        const [allExcursions, totalItems] = await Promise.all([
            Excursions.find(query)
                .sort({ order: 1 }) // ← Cambiado a -1 (más nuevo primero)
                .skip(skip)
                .limit(limit),
            Excursions.countDocuments(query)
        ]);

        // 4. Verificar si hay resultados
        if (!allExcursions || allExcursions.length === 0) {
            return res.status(200).json({
                ok: true,
                data: [],
                message: 'No excursions found.',
                pagination: {
                    page,
                    limit,
                    totalItems: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            });
        }

        // 5. Calcular metadatos
        const totalPages = Math.ceil(totalItems / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        // 6. Respuesta estructurada
        return res.status(200).json({
            ok: true,
            data: allExcursions,
            message: 'Excursions retrieved successfully.',
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        });

    } catch (error) {
        console.error('--- GET ALL ERROR ---', error);
        return res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server.',
        });
    }
};


/**
 * GET BY ID - Obtener una excursión por su ID
 * GET /api/excursions/detail/:id
 */
exports.getExcursionsByID = async (req, res) => {
    const { id } = req.params;
    try {

        const excursion = await Excursions.findById(id);

        if (!excursion) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'The requested excursion does not exist.'
            });
        }

        return res.status(200).json({
            ok: true,
            data: excursion,
            message: 'Excursion retrieved successfully.'
        });

    } catch (error) {

        return res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server.',
        });
    }
}


/**
 * GET BY SLUG - Obtener una excursión por su slug (URL amigable)
 * GET /api/excursions/slug/:slug
 */
exports.getExcursionBySlug = async (req, res) => {
    const { slug } = req.params;
    try {
        const excursion = await Excursions.findOne({ slug });

        if (!excursion) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'The requested excursion does not exist.'
            });
        }

        return res.status(200).json({
            ok: true,
            data: excursion,
            message: 'Excursion retrieved successfully by slug.'
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Error retrieving excursion by slug.',
        });
    }
}


/**
 * GET SIMPLE LIST - Obtener lista básica de excursiones (solo ID y nombre)
 * GET /api/excursions/all-for-select
 * @usecase Llenar selectores en el frontend
 */
exports.getExcursionsSimpleList = async (req, res) => {
    try {
        const list = await Excursions.find()
            .select('_id name')
            .sort({ name: 1 });

        return res.status(200).json({
            ok: true,
            data: list,
            message: 'name list'
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Error retrieving excursion list.'
        });
    }
};


/**
 * ADD GALLERY IMAGES - Agregar imágenes a la galería de una excursión
 * POST /api/excursions/:id/gallery
 * Body: FormData con archivos (campo 'images')
 */
exports.addGalleryImages = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Validar que se hayan subido archivos
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'BadRequest',
                message: 'At least one image is required'
            });
        }

        // 2. Buscar la excursión
        const excursion = await Excursions.findById(id);
        if (!excursion) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'The excursion does not exist.'
            });
        }

        // 3. Subir archivos a Cloudinary
        const folderName = excursion.cloudinaryFolder;
        const uploadPromises = req.files.map(file =>
            uploadFile(file.path, 'excursions', folderName)
        );
        const uploadResults = await Promise.all(uploadPromises);

        // 4. Crear nuevos items de galería
        const currentGalleryLength = excursion.images.gallery?.length || 0;
        const newGalleryItems = uploadResults.map((result, index) => ({
            public_id: result.public_id,
            url: result.url,
            thumbnailUrl: result.url,
            alt: `${excursion.name} - Gallery ${currentGalleryLength + index + 1}`,
            mediaType: result.resource_type || 'image',
            width: result.width || 0,
            height: result.height || 0,
            format: result.format || 'jpg',
            order: currentGalleryLength + index + 1,
            duration: result.duration || null
        }));

        // 5. Agregar a la galería existente
        if (!excursion.images.gallery) {
            excursion.images.gallery = [];
        }
        excursion.images.gallery.push(...newGalleryItems);

        // 6. Guardar en la base de datos
        await excursion.save();

        // 7. Respuesta exitosa
        res.status(200).json({
            ok: true,
            data: excursion,
            message: `${newGalleryItems.length} image(s) added to gallery successfully`
        });

    } catch (error) {
        console.error('--- ADD GALLERY IMAGES ERROR ---', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                messages: messages
            });
        }

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Error adding images to gallery'
        });

    } finally {
        // 8. Limpiar archivos temporales
        if (req.files && req.files.length > 0) {
            await deleteLocalFiles(req.files);
        }
    }
};


/**
 * SWAP IMAGE WITH MAIN - Intercambiar una imagen de la galería con la imagen principal
 * PATCH /api/excursions/:id/swap-main
 * Body: { galleryIndex: number }
 *       (índice de la imagen en la galería que pasará a ser la principal)
 */
exports.swapImageWithMain = async (req, res) => {

    console.log('✅ Executing: swapMainImage');
    console.log('Params:', req.params);
    console.log('Body:', req.body);

    try {
        const { id } = req.params;
        const { index } = req.body;

        // ✅ Validar que el índice exista
        if (index === undefined || index === null) {
            return res.status(400).json({
                ok: false,
                type: 'BadRequest',
                message: 'Index is required'
            });
        }

        // ✅ Buscar la excursión
        const excursion = await Excursions.findById(id);
        if (!excursion) {
            return res.status(404).json({
                ok: false,
                type: 'NotFound',
                message: 'Excursion not found'
            });
        }

        // ✅ Validar que la galería tenga imágenes
        if (!excursion.images.gallery || excursion.images.gallery.length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'BadRequest',
                message: 'Gallery is empty. No images to swap with.'
            });
        }

        // ✅ Validar que el índice exista en la galería
        if (index < 0 || index >= excursion.images.gallery.length) {
            return res.status(400).json({
                ok: false,
                type: 'BadRequest',
                message: `Index ${index} does not exist. Gallery has ${excursion.images.gallery.length} images.`
            });
        }

        // ✅ Copiar los objetos (crear copias) para no modificar los originales
        const oldMain = excursion.images.main.toObject();
        const selectedImage = excursion.images.gallery[index].toObject();

        // ✅ Asignar orders
        oldMain.order = index + 1;
        oldMain.alt = `${excursion.name} - Gallery ${index + 1}`;
        selectedImage.order = 0;
        selectedImage.alt = `${excursion.name} - main 0 ` || 'Excursion main image';


        // ✅ Intercambiar
        excursion.images.main = selectedImage;
        excursion.images.gallery[index] = oldMain;

        // para oblicar a verificar el objeto prinsioal de imagenes en excursion
        excursion.markModified('images');
        await excursion.save();

        res.json({
            ok: true,
            data: excursion,
            message: `Main image swapped with gallery image at index ${index}`
        });

    } catch (error) {
        console.error('--- SWAP MAIN IMAGE ERROR ---', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                messages: messages
            });
        }

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Internal Server Error'
        });
    }
};
