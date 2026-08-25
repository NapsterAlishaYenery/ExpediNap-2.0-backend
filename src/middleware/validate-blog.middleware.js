// src/middleware/validate-blog.middleware.js
const Joi = require('joi');

// ========================================
// ESQUEMA DE VALIDACIÓN PARA BLOG
// ========================================

const blogSchema = Joi.object({
    // ========================================
    // INFORMACIÓN BÁSICA
    // ========================================
    title: Joi.string().min(3).max(200).required().messages({
        'any.required': 'Title is required',
        'string.min': 'Title must be at least 3 characters',
        'string.max': 'Title cannot exceed 200 characters'
    }),
    category: Joi.array().items(Joi.string()).min(1).required().messages({
        'any.required': 'At least one category is required',
        'array.min': 'At least one category is required'
    }),
    type: Joi.string().min(2).max(50).required().messages({
        'any.required': 'Blog type is required',
        'string.min': 'Type must be at least 2 characters',
        'string.max': 'Type cannot exceed 50 characters'
    }),
    author: Joi.string().default('Expedinap Team'),

    // ========================================
    // SEO
    // ========================================
    meta_title: Joi.string().min(10).max(100).required().messages({
        'any.required': 'Meta title is required for SEO',
        'string.min': 'Meta title must be at least 10 characters',
        'string.max': 'Meta title cannot exceed 100 characters'
    }),
    meta_description: Joi.string().min(20).max(200).required().messages({
        'any.required': 'Meta description is required for SEO',
        'string.min': 'Meta description must be at least 20 characters',
        'string.max': 'Meta description cannot exceed 200 characters'
    }),
    keywords: Joi.array().items(Joi.string()).min(1).required().messages({
        'any.required': 'Keywords are required',
        'array.min': 'At least one keyword is required'
    }),

    // ========================================
    // CONTENIDO
    // ========================================
    excerpt: Joi.string().min(10).max(300).required().messages({
        'any.required': 'Excerpt is required for the blog preview card',
        'string.min': 'Excerpt must be at least 10 characters',
        'string.max': 'Excerpt cannot exceed 300 characters'
    }),
    content: Joi.string().min(50).required().messages({
        'any.required': 'Blog content is required',
        'string.min': 'Content must be at least 50 characters'
    }),
    slug: Joi.string().optional(),
    cloudinaryFolder: Joi.string().optional()
});

// ========================================
// ESQUEMA PARA CREAR (campos obligatorios)
// ========================================

const createBlogSchema = blogSchema.keys({
    title: Joi.string().min(3).max(200).required(),
    category: Joi.array().items(Joi.string()).min(1).required(),
    type: Joi.string().min(2).max(50).required(),
    meta_title: Joi.string().min(10).max(100).required(),
    meta_description: Joi.string().min(20).max(200).required(),
    keywords: Joi.array().items(Joi.string()).min(1).required(),
    excerpt: Joi.string().min(10).max(300).required(),
    content: Joi.string().min(50).required()
});

// ========================================
// ESQUEMA PARA ACTUALIZAR (todos opcionales)
// ========================================

const updateBlogSchema = blogSchema.fork(
    Object.keys(blogSchema.describe().keys),
    (schema) => schema.optional()
);

// ✅ Campos prohibidos (no se pueden actualizar)
const forbiddenFields = {
    _id: Joi.any().forbidden(),
    slug: Joi.any().forbidden().messages({
        'any.unknown': 'Slug is auto-generated and cannot be modified'
    }),
    createdAt: Joi.any().forbidden(),
    updatedAt: Joi.any().forbidden(),
    cloudinaryFolder: Joi.any().forbidden().messages({
        'any.unknown': 'Cloudinary folder is auto-generated and cannot be modified'
    }),
    image: Joi.any().forbidden().messages({
        'any.unknown': 'Image cannot be updated through this endpoint. Use specific image endpoints.'
    }),
    // 🆕 Agregar content como prohibido
    content: Joi.any().forbidden().messages({
        'any.unknown': 'Content cannot be updated through this endpoint. Use specific content endpoints.'
    }),
    // 🆕 Agregar contentImages como prohibido
    contentImages: Joi.any().forbidden().messages({
        'any.unknown': 'Content images cannot be updated through this endpoint.'
    }),
    // 🆕 Agregar author como prohibido (el autor original debe mantenerse)
    author: Joi.any().forbidden().messages({
        'any.unknown': 'Author cannot be modified'
    })
};

const finalUpdateSchema = updateBlogSchema.append(forbiddenFields);

// 🆕 ESQUEMA PARA ACTUALIZAR CONTENIDO
const updateContentSchema = Joi.object({
    content: Joi.string().min(50).required().messages({
        'any.required': 'Content is required',
        'string.min': 'Content must be at least 50 characters'
    }),
    // Permite enviar alt para la portada (opcional)
    alt: Joi.string().optional().allow(''),
    // Todos los demás campos están prohibidos
    title: Joi.any().forbidden(),
    category: Joi.any().forbidden(),
    type: Joi.any().forbidden(),
    author: Joi.any().forbidden(),
    meta_title: Joi.any().forbidden(),
    meta_description: Joi.any().forbidden(),
    keywords: Joi.any().forbidden(),
    excerpt: Joi.any().forbidden(),
    slug: Joi.any().forbidden(),
    cloudinaryFolder: Joi.any().forbidden(),
    image: Joi.any().forbidden(),
    contentImages: Joi.any().forbidden(),
    _id: Joi.any().forbidden(),
    createdAt: Joi.any().forbidden(),
    updatedAt: Joi.any().forbidden()
});

// ========================================
// MIDDLEWARES
// ========================================

const validateBlog = {

    /**
     * Validación para CREAR blog
     */
    create: (req, res, next) => {
        const { error } = createBlogSchema.validate(req.body, { abortEarly: false });

        if (error) {
            const errors = error.details.map(detail => detail.message);
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                messages: errors
            });
        }

        next();
    },

    /**
     * Validación para ACTUALIZAR blog (todos los campos opcionales)
     */
    update: (req, res, next) => {
        const { error } = finalUpdateSchema.validate(req.body, { abortEarly: false });

        if (error) {
            const errors = error.details.map(detail => detail.message);
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                messages: errors
            });
        }

        // ✅ Verificar que al menos un campo esté presente
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'EmptyRequest',
                message: 'At least one field is required to update'
            });
        }

        next();
    },
    
    /**
     * Validación para ACTUALIZAR contenido del blog
     * Solo permite content y alt (opcional)
     */
    updateContent: (req, res, next) => {
        const { error } = updateContentSchema.validate(req.body, { abortEarly: false });

        if (error) {
            const errors = error.details.map(detail => detail.message);
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                messages: errors
            });
        }

        next();
    }
};

module.exports = validateBlog;