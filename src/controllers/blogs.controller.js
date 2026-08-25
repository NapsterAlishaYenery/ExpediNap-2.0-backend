
const Blogs = require('../models/blogs.model');
const deleteLocalFiles = require('../utils/fileCleanup.util');
const { uploadFile, deleteFile } = require('../services/cloudinary.service');
const sanitizeFolderName = require('../utils/sanitize-folder-name');

/**
 * CREATE - Crear un nuevo blog
 * POST /api/blogs
 */
exports.createBlog = async (req, res) => {
    let uploadedImages = [];

    try {
        // 1. Extraer los datos del body (ya validados por Joi)
        const blogData = req.body;

        // 2. Validar que se hayan subido archivos (mínimo la imagen principal)
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'BadRequest',
                message: 'At least one image (main image) is required'
            });
        }

        // 3. Verificar duplicado (por título)
        const existingBlog = await Blogs.findOne({
            title: blogData.title
        });

        if (existingBlog) {
            return res.status(400).json({
                ok: false,
                type: 'DuplicateError',
                message: `A blog with title "${blogData.title}" already exists.`
            });
        }

        // 4. Generar cloudinaryFolder
        const folderName = sanitizeFolderName(blogData.title);
        const cloudinaryFolder = folderName;

        // 5. Subir TODOS los archivos a Cloudinary
        const uploadPromises = req.files.map(file =>
            uploadFile(file.path, 'blogs', cloudinaryFolder)
        );
        const uploadResults = await Promise.all(uploadPromises);
        uploadedImages = uploadResults.map(result => result);

        console.log('📦 Upload results:', uploadResults);

        // 6. Construir el objeto image (main) - La PRIMERA imagen
        const mainImage = {
            public_id: uploadResults[0].public_id,
            url: uploadResults[0].url,
            thumbnailUrl: uploadResults[0].url,
            alt: blogData.title || 'Blog main image',
            mediaType: uploadResults[0].resource_type || 'image',
            width: uploadResults[0].width || 0,
            height: uploadResults[0].height || 0,
            format: uploadResults[0].format || 'jpg',
            order: 0,
            duration: uploadResults[0].duration || null
        };

        // 7. Procesar el contenido HTML y guardar public_ids de las imágenes
        let processedContent = blogData.content;
        const contentImages = [];
        let imageCounter = 1;
        let videoCounter = 1;

        // Recorrer los resultados (desde el índice 1, porque el 0 es main)
        for (let i = 1; i < uploadResults.length; i++) {
            const result = uploadResults[i];
            const mediaType = result.resource_type || 'image';

            // Determinar el marcador según el tipo de archivo
            let marker;
            let order;
            if (mediaType === 'video') {
                marker = `{{video_${videoCounter}}}`;
                order = videoCounter;
                videoCounter++;
            } else {
                marker = `{{image_${imageCounter}}}`;
                order = imageCounter;
                imageCounter++;
            }

            // Reemplazar el marcador con la URL real
            processedContent = processedContent.replace(marker, result.url);

            // ✅ GUARDAR public_id para poder eliminar después
            contentImages.push({
                public_id: result.public_id,
                url: result.url,
                thumbnailUrl: result.url,
                alt: `${blogData.title} - Content Image ${order}`,
                mediaType: result.resource_type || 'image',
                width: result.width || 0,
                height: result.height || 0,
                format: result.format || 'jpg',
                order: order,
                duration: result.duration || null
            });
        }

        // 8. Construir el documento final
        const blogDocument = {
            title: blogData.title,
            category: blogData.category,
            type: blogData.type,
            author: blogData.author || 'Expedinap Team',
            meta_title: blogData.meta_title,
            meta_description: blogData.meta_description,
            keywords: blogData.keywords,
            excerpt: blogData.excerpt,
            image: mainImage,
            contentImages: contentImages, // ✅ Guardar todas las imágenes del contenido
            cloudinaryFolder: cloudinaryFolder,
            content: processedContent // ✅ HTML con URLs reales
        };

        // 9. Si se envía slug manual, usarlo
        if (blogData.slug) {
            blogDocument.slug = blogData.slug;
        }

        // 10. Crear en la base de datos
        const newBlog = await Blogs.create(blogDocument);

        // 11. Respuesta exitosa
        res.status(201).json({
            ok: true,
            data: newBlog,
            message: 'Blog created successfully'
        });

    } catch (error) {
        console.error('--- CREATE BLOG ERROR ---', error);

        // Rollback: Eliminar imágenes de Cloudinary si algo falló
        if (uploadedImages.length > 0) {
            console.log('🧹 Haciendo rollback: eliminando imágenes de Cloudinary...');
            const deletePromises = uploadedImages.map(item => deleteFile(item.public_id, item.mediaType));
            await Promise.all(deletePromises);
            console.log(`✅ ${uploadedImages.length} imágenes eliminadas de Cloudinary`);
        }

        // Error de duplicado
        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                type: 'DuplicateError',
                message: 'The slug is already in use. Please use a different title or do not send a manual slug.'
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
        // 12. Limpiar archivos temporales
        if (req.files && req.files.length > 0) {
            await deleteLocalFiles(req.files);
        }
    }
};

/**
 * UPDATE - Actualizar un blog (solo datos de texto)
 * PATCH /api/blogs/update/:id
 */
exports.upDateBlog = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
        // 1. Buscar el blog existente
        const existingBlog = await Blogs.findById(id);

        if (!existingBlog) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'The blog does not exist.'
            });
        }

        // 2. ✅ Verificar duplicado de título (si se envía)
        if (updateData.title && updateData.title !== existingBlog.title) {
            const titleExists = await Blogs.findOne({
                title: updateData.title,
                _id: { $ne: id }
            });

            if (titleExists) {
                return res.status(400).json({
                    ok: false,
                    type: 'DuplicateError',
                    message: `A blog with the title "${updateData.title}" already exists.`
                });
            }
        }

        // 3. ✅ Verificar que al menos un campo sea actualizado
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'At least one field must be provided for update.'
            });
        }

        // 4. ✅ Ejecutar la actualización (Joi ya bloqueó los campos prohibidos)
        // Mongoose solo actualizará los campos que existen en el esquema
        const updatedBlog = await Blogs.findByIdAndUpdate(
            id,
            { $set: updateData },
            {
                new: true,
                runValidators: true
            }
        );

        res.status(200).json({
            ok: true,
            data: updatedBlog,
            message: 'Blog updated successfully'
        });

    } catch (error) {
        console.error('--- UPDATE BLOG ERROR ---', error);

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
                message: 'The title already exists. Please choose another.'
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
 * UPDATE CONTENT - Actualizar el contenido e imágenes de un blog
 * PATCH /api/blogs/update-content/:id
 * Body: FormData con 'content' y archivos 'images' (mínimo 1 para portada)
 * 
 * ⚠️ Este endpoint ELIMINA TODAS las imágenes viejas y las reemplaza por las nuevas.
 */
exports.updateBlogContent = async (req, res) => {
    const { id } = req.params;
    let uploadedImages = [];

    try {
        // 1. Buscar el blog existente
        const existingBlog = await Blogs.findById(id);

        if (!existingBlog) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'The blog does not exist.'
            });
        }

        // 2. Validar que se hayan subido archivos (mínimo la portada)
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'BadRequest',
                message: 'At least one image (main image) is required to update content.'
            });
        }

        // 3. Obtener el nuevo contenido del body
        const newContent = req.body.content;
        const newAlt = req.body.alt || existingBlog.title || 'Blog main image';

        // 4. Recopilar TODOS los public_id de Cloudinary (para eliminar)
        const publicIdsToDelete = [];

        // 4.1 Imagen principal
        if (existingBlog.image?.public_id) {
            publicIdsToDelete.push(existingBlog.image);
        }

        // 4.2 Imágenes del contenido
        if (existingBlog.contentImages && existingBlog.contentImages.length > 0) {
            existingBlog.contentImages.forEach(img => {
                if (img) {
                    publicIdsToDelete.push(img);
                }
            });
        }

        // 5. Eliminar TODAS las imágenes de Cloudinary
        if (publicIdsToDelete.length > 0) {
            console.log(`🗑️ Eliminando ${publicIdsToDelete.length} imágenes de Cloudinary...`);
            const deletePromises = publicIdsToDelete.map(item => deleteFile(item.public_id, item.mediaType));
            await Promise.all(deletePromises);
            console.log(`✅ ${publicIdsToDelete.length} imágenes eliminadas de Cloudinary`);
        } else {
            console.log('ℹ️ No se encontraron imágenes para eliminar en Cloudinary');
        }

        // 6. Subir TODOS los archivos a Cloudinary (en la misma carpeta)
        const uploadPromises = req.files.map(file =>
            uploadFile(file.path, 'blogs', existingBlog.cloudinaryFolder)
        );
        const uploadResults = await Promise.all(uploadPromises);
        uploadedImages = uploadResults.map(result => result);

        console.log('📦 Upload results:', uploadResults);

        // 7. Construir imagen principal (la PRIMERA imagen)
        const mainImage = {
            public_id: uploadResults[0].public_id,
            url: uploadResults[0].url,
            thumbnailUrl: uploadResults[0].url,
            alt: newAlt,
            mediaType: uploadResults[0].resource_type || 'image',
            width: uploadResults[0].width || 0,
            height: uploadResults[0].height || 0,
            format: uploadResults[0].format || 'jpg',
            order: 0,
            duration: uploadResults[0].duration || null
        };

        // 8. Procesar el contenido HTML y guardar public_ids de las nuevas imágenes
        let processedContent = newContent;
        const contentImages = [];
        let imageCounter = 1;
        let videoCounter = 1;

        // Recorrer los resultados (desde el índice 1, porque el 0 es main)
        for (let i = 1; i < uploadResults.length; i++) {
            const result = uploadResults[i];
            const mediaType = result.resource_type || 'image';

            let marker;
            let order;
            if (mediaType === 'video') {
                marker = `{{video_${videoCounter}}}`;
                order = videoCounter;
                videoCounter++;
            } else {
                marker = `{{image_${imageCounter}}}`;
                order = imageCounter;
                imageCounter++;
            }

            // Reemplazar el marcador con la URL real
            processedContent = processedContent.replace(marker, result.url);

            // GUARDAR public_id para poder eliminar después
            contentImages.push({
                public_id: result.public_id,
                url: result.url,
                thumbnailUrl: result.url,
                alt: `${existingBlog.title} - Content Image ${order}`,
                mediaType: result.resource_type || 'image',
                width: result.width || 0,
                height: result.height || 0,
                format: result.format || 'jpg',
                order: order,
                duration: result.duration || null
            });
        }

        // 9. Construir el documento actualizado
        const updateData = {
            content: processedContent,
            image: mainImage,
            contentImages: contentImages
        };

        // 10. Ejecutar la actualización
        const updatedBlog = await Blogs.findByIdAndUpdate(
            id,
            { $set: updateData },
            {
                new: true,
                runValidators: true
            }
        );

        // 11. Respuesta exitosa
        res.status(200).json({
            ok: true,
            data: updatedBlog,
            message: `Blog content updated successfully. ${uploadResults.length} images processed.`
        });

    } catch (error) {
        console.error('--- UPDATE BLOG CONTENT ERROR ---', error);

        // Rollback: eliminar imágenes subidas si algo falló
        if (uploadedImages.length > 0) {
            console.log('🧹 Haciendo rollback: eliminando imágenes de Cloudinary...');
            const deletePromises = uploadedImages.map(item =>
                deleteFile(item.public_id, item.mediaType || 'image')
            );
            await Promise.all(deletePromises);
            console.log(`✅ ${uploadedImages.length} imágenes eliminadas de Cloudinary`);
        }

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
                message: 'The title already exists.'
            });
        }

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server'
        });

    } finally {
        // 12. Limpiar archivos temporales
        if (req.files && req.files.length > 0) {
            await deleteLocalFiles(req.files);
        }
    }
};


/**
 * DELETE BLOG - Eliminar un blog completo (con todas sus imágenes y videos)
 * DELETE /api/blogs/delete/:id
 */
exports.deleteBlog = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Buscar el blog
        const blog = await Blogs.findById(id);
        if (!blog) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'The blog you are trying to delete does not exist.'
            });
        }

        // 2. Recopilar TODOS los public_id de Cloudinary
        const publicIdsToDelete = [];

        // 2.1 Agregar imagen principal
        if (blog.image?.public_id) {
            publicIdsToDelete.push(blog.image);
        }

        // 2.2 Agregar todas las imágenes y videos del contenido
        if (blog.contentImages && blog.contentImages.length > 0) {
            blog.contentImages.forEach(item => {
                if (item) {
                    publicIdsToDelete.push(item);
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
        await Blogs.findByIdAndDelete(id);

        // 5. Respuesta exitosa
        res.status(200).json({
            ok: true,
            data: null,
            message: `Blog "${blog.title}" deleted successfully`
        });

    } catch (error) {
        console.error('--- DELETE BLOG ERROR ---', error);

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
 * GET BY ID - Obtener un blog por su ID
 * GET /api/blogs/detail/:id
 */
exports.getBlogByID = async (req, res) => {

    const { id } = req.params;

    try {

        const blog = await Blogs.findById(id);

        if (!blog) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'The requested blogs does not exist.'
            });
        }

        return res.status(200).json({
            ok: true,
            data: blog,
            message: 'Blog retrieved successfully.'
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server.',
        });
    }
}


/**
 * GET BY SLUG - Obtener un blog por su slug (URL amigable)
 * GET /api/blogs/slug/:slug
 */
exports.getBlogBySlug = async (req, res) => {

    const { slug } = req.params;

    try {
        const blog = await Blogs.findOne({ slug });

        if (!blog) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'Post not found.'
            });
        }

        res.status(200).json({
            ok: true,
            data: blog,
            message: 'The blog requested'
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Server error'
        });
    }
}


/**
 * GET ALL - Obtener todos los blogs con filtros y paginación
 * GET /api/blogs/all?title=saona&category=destinations&type=Guide&page=1&limit=12
 */
exports.getAllBlogs = async (req, res) => {
    try {
        // 1. EXTRAER LAS VARIABLES DE req.query
        const { title, category, type, author } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;

        let query = {};

        if (title) {
            query.title = { $regex: title, $options: 'i' };
        }

        if (category) {
            query.category = category.toLowerCase();
        }

        if (type) {
            query.type = { $regex: type, $options: 'i' };
        }

        if (author) {
            query.author = { $regex: author, $options: 'i' };
        }

        const skip = (page - 1) * limit;

        const [allBlogs, totalItems] = await Promise.all([
            Blogs.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Blogs.countDocuments(query)
        ]);

        if (!allBlogs) {
            return res.status(404).json({
                ok: false,
                message: "No Blogs found",
                type: "NOT_FOUND"
            });
        }

        const totalPages = Math.ceil(totalItems / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return res.status(200).json({
            ok: true,
            data: allBlogs,
            message: totalItems > 0 ? 'Blogs retrieved successfully.' : 'No blogs found.',
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

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server while fetching blogs.',
        });
    }
};
