const Yachts = require('../models/yachts.model');
const deleteLocalFiles = require('../utils/fileCleanup.util');
const { uploadFile, deleteFile } = require('../services/cloudinary.service');
const sanitizeFolderName = require('../utils/sanitize-folder-name');


/**
 * CREATE - Crear un nuevo yate
 * POST /api/yachts
 */
exports.createYatch = async (req, res) => {
    try {
        // 1. Extraer los datos del body (ya validados por Joi)
        const yachtData = req.body;

        // 2. Validar que se hayan subido archivos (mínimo la imagen principal)
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'BadRequest',
                message: 'At least one image (main image) is required'
            });
        }

        // VERIFICAR DUPLICADO PRIMERO (antes de subir imágenes)
        const existingYacht = await Yachts.findOne({
            name: yachtData.name
        });

        if (existingYacht) {
            return res.status(400).json({
                ok: false,
                type: 'DuplicateError',
                message: `A yacht with name "${yachtData.name}" already exists.`
            });
        }

        // 3. Subir archivos a Cloudinary
        // pasar el nombre del yate
        const folderName = sanitizeFolderName(yachtData.name);
        const uploadPromises = req.files.map(file =>
            uploadFile(file.path, 'yachts', folderName)
        );

        const uploadResults = await Promise.all(uploadPromises);

        console.log('📦 Upload results:', uploadResults);

        // 4. Construir el objeto images (main + gallery)
        const mainImage = {
            public_id: uploadResults[0].public_id,
            url: uploadResults[0].url,
            thumbnailUrl: uploadResults[0].url,
            alt: yachtData.name || 'Yacht main image',
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
            alt: `${yachtData.name} - Gallery ${index + 1}`,
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

        // 5. Construir el documento final
        const yachtDocument = {
            ...yachtData,
            images: images,
            cloudinaryFolder: folderName
        };

        // 6. Crear en la base de datos
        const newYacht = await Yachts.create(yachtDocument);

        // 7. Respuesta exitosa
        res.status(201).json({
            ok: true,
            data: newYacht,
            message: 'Yacht created successfully'
        });

    } catch (error) {
        console.error('--- CREATE YACHT ERROR ---', error);

        // Error de duplicado (nombre o slug duplicado)
        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                type: 'DuplicateError',
                message: 'A yacht with this name already exists. Please use another name.'
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
        // 8. Limpiar archivos temporales
        if (req.files && req.files.length > 0) {
            await deleteLocalFiles(req.files);
        }
    }
};

/**
 * UPDATE - Actualizar un yate (solo datos de texto)
 * PATCH /api/yachts/update/:id
 */
exports.upDateYatch = async (req, res) => {

    const { id } = req.params;
    const updates = req.body;
    try {

        const updateYatch = await Yachts.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updateYatch) {
            return res.status(404).json({
                ok: false,
                type: 'NotFound',
                message: 'Yacht not found'
            });
        }

        res.status(200).json({
            ok: true,
            data: updateYatch,
            message: 'Yacht updated'
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                type: "DuplicateError",
                message: `The name already exists. Please choose another.`
            });
        }

        if (error.name === "ValidationError") {
            const firstError = Object.values(error.errors)[0].message;
            return res.status(400).json({
                ok: false,
                type: "ValidationError",
                message: firstError
            });
        }

        res.status(500).json({
            ok: false,
            type: "ServerError",
            message: "Internal server error"
        });
    }
}

/**
 * DELETE YACHT - Eliminar un yate completo (con todas sus imágenes)
 * DELETE /api/yachts/delete/:id
 */
exports.deleteYatch = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Buscar el yate
        const yacht = await Yachts.findById(id);
        if (!yacht) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'The yacht you are trying to delete does not exist.'
            });
        }

        // 2. Recopilar TODOS los public_id de Cloudinary
        const publicIdsToDelete = [];

        // 2.1 Agregar main image
        if (yacht.images?.main?.public_id) {
            publicIdsToDelete.push(yacht.images.main);
        }

        // 2.2 Agregar todas las imágenes de la galería
        if (yacht.images?.gallery && yacht.images.gallery.length > 0) {
            yacht.images.gallery.forEach(img => {
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
        await Yachts.findByIdAndDelete(id);

        // 5. Respuesta exitosa
        res.status(200).json({
            ok: true,
            data: null,
            message: `Yacht "${yacht.name}" deleted successfully`
        });

    } catch (error) {
        console.error('--- DELETE YACHT ERROR ---', error);

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
 * GET ALL - Obtener todos los yates con filtros, ordenamiento y paginación
 * GET /api/yachts/all?name=princess&sortBy=saonaPrice&order=1&page=1&limit=12
 */
exports.getAllYatch = async (req, res) => {

    try {

        const { name, sortBy, order } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;


        let query = {};

        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }

        let sortOptions = { createdAt: -1 };

        if (sortBy === 'saona' || sortBy === 'saonaPrice') {

            const direction = parseInt(order) || 1;
            sortOptions = { 'saonaPrice.fullDay': direction };
        }
        else if (sortBy === 'catalina' || sortBy === 'catalinaPrice') {

            const direction = parseInt(order) || 1;
            sortOptions = { 'catalinaPrice.fullDay': direction };
        }

        const skip = (page - 1) * limit;

        const [allYatchs, totalItems] = await Promise.all([
            Yachts.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit),
            Yachts.countDocuments(query)
        ]);

        if (!allYatchs) {
            return res.status(404).json({
                ok: false,
                message: "No yacht found.",
                type: "NOT_FOUND"
            });
        }

        const totalPages = Math.ceil(totalItems / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return res.status(200).json({
            ok: true,
            data: allYatchs,
            message: totalItems > 0 ? 'Yachts retrieved successfully.' : 'No yachts found.',
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

        return res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server while fetching yachts.',
        });
    }
}

/**
 * GET BY ID - Obtener un yate por su ID
 * GET /api/yachts/detail/:id
 */
exports.getYatchByID = async (req, res) => {
    const { id } = req.params;
    try {

        const yatch = await Yachts.findById(id);

        if (!yatch) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'The requested yacht does not exist.'
            });
        }

        return res.status(200).json({
            ok: true,
            data: yatch,
            message: 'Yacht retrieved successfully.'
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
 * GET BY SLUG - Obtener un yate por su slug (URL amigable)
 * GET /api/yachts/slug/:slug
 */
exports.getYachtBySlug = async (req, res) => {
    const { slug } = req.params;
    try {
        const yacht = await Yachts.findOne({ slug });

        if (!yacht) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'The requested yacht does not exist.'
            });
        }

        return res.status(200).json({
            ok: true,
            data: yacht,
            message: 'Yacht retrieved successfully by slug.'
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Error retrieving yacht by slug.',
        });
    }
}

/**
 * GET SIMPLE LIST - Obtener lista básica de yates (solo ID y nombre)
 * GET /api/yachts/all-for-select
 * @usecase Llenar selectores en el frontend (dropdowns, autocomplete, filtros)
 */
exports.getYachtsSimpleList = async (req, res) => {
    try {
        const list = await Yachts.find()
            .select('_id name ')
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
            message: 'Error retrieving yacht list.'
        });
    }
};


/**
 * ADD GALLERY IMAGES - Agregar imágenes a la galería de un yate
 * POST /api/yachts/:id/gallery
 * Body: FormData con archivos (campo 'images')
 */
exports.addYachtGalleryImages = async (req, res) => {
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

        // 2. Buscar el yate
        const yacht = await Yachts.findById(id);
        if (!yacht) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'The yacht does not exist.'
            });
        }

        // 3. Subir archivos a Cloudinary usando cloudinaryFolder
        const folderName = yacht.cloudinaryFolder;
        const uploadPromises = req.files.map(file =>
            uploadFile(file.path, 'yachts', folderName)
        );
        const uploadResults = await Promise.all(uploadPromises);

        // 4. Crear nuevos items de galería
        const currentGalleryLength = yacht.images.gallery?.length || 0;
        const newGalleryItems = uploadResults.map((result, index) => ({
            public_id: result.public_id,
            url: result.url,
            thumbnailUrl: result.url,
            alt: `${yacht.name} - Gallery ${currentGalleryLength + index + 1}`,
            mediaType: result.resource_type || 'image',
            width: result.width || 0,
            height: result.height || 0,
            format: result.format || 'jpg',
            order: currentGalleryLength + index + 1,
            duration: result.duration || null
        }));

        // 5. Agregar a la galería existente
        if (!yacht.images.gallery) {
            yacht.images.gallery = [];
        }
        yacht.images.gallery.push(...newGalleryItems);

        // 6. Guardar en la base de datos
        await yacht.save();

        // 7. Respuesta exitosa
        res.status(200).json({
            ok: true,
            data: yacht,
            message: `${newGalleryItems.length} image(s) added to gallery successfully`
        });

    } catch (error) {
        console.error('--- ADD YACHT GALLERY IMAGES ERROR ---', error);

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
        if (req.files && req.files.length > 0) {
            await deleteLocalFiles(req.files);
        }
    }
};


/**
 * DELETE GALLERY IMAGE - Eliminar una imagen de la galería por índice
 * DELETE /api/yachts/:id/gallery/:index
 */
exports.deleteYachtGalleryImage = async (req, res) => {
    try {
        const { id, index } = req.params;
        const galleryIndex = parseInt(index);

        // 1. Buscar el yate
        const yacht = await Yachts.findById(id);
        if (!yacht) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'Yacht not found'
            });
        }

        // 2. Validar que la galería tenga imágenes
        if (!yacht.images.gallery || yacht.images.gallery.length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'BadRequest',
                message: 'Gallery is empty. No images to delete.'
            });
        }

        // 3. Validar que el índice exista
        if (galleryIndex < 0 || galleryIndex >= yacht.images.gallery.length) {
            return res.status(400).json({
                ok: false,
                type: 'BadRequest',
                message: `Index ${galleryIndex} does not exist. Gallery has ${yacht.images.gallery.length} images.`
            });
        }

        // 4. Obtener la imagen a eliminar
        const imageToDelete = yacht.images.gallery[galleryIndex];

        // 5. Eliminar de Cloudinary
        await deleteFile(imageToDelete.public_id, imageToDelete.mediaType);
        console.log(`✅ Imagen eliminada de Cloudinary: ${imageToDelete.public_id}`);

        // 6. Eliminar del array
        yacht.images.gallery.splice(galleryIndex, 1);

        // 7. Reordenar la galería (actualizar orders)
        yacht.images.gallery = yacht.images.gallery.map((img, idx) => ({
            ...img,
            order: idx + 1,
            alt: `${yacht.name} - Gallery ${idx + 1}`
        }));

        // 8. Forzar que Mongoose detecte el cambio
        yacht.markModified('images');

        // 9. Guardar
        await yacht.save();

        res.json({
            ok: true,
            data: yacht,
            message: `Gallery image at index ${galleryIndex} deleted successfully`
        });

    } catch (error) {
        console.error('--- DELETE YACHT GALLERY IMAGE ERROR ---', error);

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
 * SWAP MAIN IMAGE - Intercambiar una imagen de la galería con la imagen principal
 * PATCH /api/yachts/:id/swap-main
 * Body: { index: number }
 *       (índice de la imagen en la galería que pasará a ser la principal)
 */
exports.swapYachtMainImage = async (req, res) => {
    console.log('✅ Executing: swapYachtMainImage');
    console.log('Params:', req.params);
    console.log('Body:', req.body);

    try {
        const { id } = req.params;
        const { index } = req.body;

        // 1. Validar que el índice exista
        if (index === undefined || index === null) {
            return res.status(400).json({
                ok: false,
                type: 'BadRequest',
                message: 'Index is required'
            });
        }

        // 2. Buscar el yate
        const yacht = await Yachts.findById(id);
        if (!yacht) {
            return res.status(404).json({
                ok: false,
                type: 'NotFound',
                message: 'Yacht not found'
            });
        }

        // 3. Validar que la galería tenga imágenes
        if (!yacht.images.gallery || yacht.images.gallery.length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'BadRequest',
                message: 'Gallery is empty. No images to swap with.'
            });
        }

        // 4. Validar que el índice exista en la galería
        if (index < 0 || index >= yacht.images.gallery.length) {
            return res.status(400).json({
                ok: false,
                type: 'BadRequest',
                message: `Index ${index} does not exist. Gallery has ${yacht.images.gallery.length} images.`
            });
        }

        // 5. Copiar los objetos (crear copias) para no modificar los originales
        const oldMain = yacht.images.main.toObject();
        const selectedImage = yacht.images.gallery[index].toObject();

        // 6. Asignar orders
        oldMain.order = index + 1;
        oldMain.alt = `${yacht.name} - Gallery ${index + 1}`;
        selectedImage.order = 0;
        selectedImage.alt = `${yacht.name} - Main`;

        // 7. Intercambiar
        yacht.images.main = selectedImage;
        yacht.images.gallery[index] = oldMain;

        // 8. Forzar que Mongoose detecte el cambio
        yacht.markModified('images');
        await yacht.save();

        res.json({
            ok: true,
            data: yacht,
            message: `Main image swapped with gallery image at index ${index}`
        });

    } catch (error) {
        console.error('--- SWAP YACHT MAIN IMAGE ERROR ---', error);

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