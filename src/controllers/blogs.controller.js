
const Blogs = require('../models/blogs.model');

exports.createBlog = async (req, res) => {

    const {
        title,
        category,
        type,
        author,
        meta_title,
        meta_description,
        keywords,
        excerpt,
        image,
        alt,
        content

    } = req.body;

    try {

        //Crear Excursiones
        const newBlog = await Blogs.create({
            title,
            category,
            type,
            author,
            meta_title,
            meta_description,
            keywords,
            excerpt,
            image,
            alt,
            content
        });

        res.status(201).json({
            ok: true,
            data: newBlog,
            message: 'New Blog Added sussesfull'
        });

    } catch (error) {

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'One or more fields are invalid',
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                type: 'DuplicateError',
                message: `The slug already exists.`
            });
        }

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server'
        });
    }
}

exports.upDateBlog = async (req, res) => {

    const { id } = req.params;
    const upDate = req.body;

    try {
        const updateBlog = await Blogs.findByIdAndUpdate(
            id,
            { $set: upDate },
            { new: true, runValidators: true }
        );


        if (!updateBlog) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'Error: The blog does not exist.',
            });
        }

        res.status(200).json({
            ok: true,
            data: updateBlog,
            message: 'Blog updated correctly'
        });


    } catch (error) {

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'One or more fields are invalid',
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                type: 'DuplicateError',
                message: 'The Slug already exists.'
            });
        }

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server'
        });
    }
}

exports.deleteBlog = async (req, res) => {
    const { id } = req.params;

    try {
        const deleteBlog = await Blogs.findByIdAndDelete(id);

        if (!deleteBlog) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'Error: The blog you are trying to delete does not exist.',
            });
        }

        res.status(200).json({
            ok: true,
            message: 'Blog deleted successfully',
            // Opcional: puedes devolver el ID borrado
            data: deleteBlog
        });

    } catch (error) {

        return res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred while deleting.',
        });
    }
};

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

        return res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server.',
        });
    }
}

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
            type:'ServerError',
            message: 'Server error' });
    }
}

exports.getAllBlogs = async (req, res) => {
    try {
        // 1. CAPTURAR PARÁMETROS DE FILTRO Y PAGINACIÓN
        // Agregamos 'type' y 'author' a la desestructuración
        const { title, category, type, author } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10; // Blogs suelen llevar menos por página

        // 2. CONSTRUIR EL OBJETO DE BÚSQUEDA DINÁMICO
        let query = {};

        // Filtro por Título (Regex parcial)
        if (title) {
            query.title = { $regex: title, $options: 'i' };
        }

        // Filtro por Categoría (Busca dentro del array de categorías)
        if (category) {
            query.category = category.toLowerCase();
        }

        // Filtro por Tipo (Exacto: Guide, Review, Tips...)
        if (type) {
            query.type = { $regex: type, $options: 'i' };
        }

        // Filtro por Autor (Regex parcial)
        if (author) {
            query.author = { $regex: author, $options: 'i' };
        }

        const skip = (page - 1) * limit;

        // 3. EJECUCIÓN CONCURRENTE
        const [allBlogs, totalItems] = await Promise.all([
            Blogs.find(query)
                .sort({ createdAt: -1 }) // Lo más nuevo arriba
                .skip(skip)
                .limit(limit),
            Blogs.countDocuments(query)
        ]);

        // 4. LÓGICA DE METADATOS
        const totalPages = Math.ceil(totalItems / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        // 5. RESPUESTA ESTRUCTURADA
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
        
        return res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server while fetching blogs.',
        });
    }
};
