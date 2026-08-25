// src/middlewares/validate-yacht.middleware.js
const Joi = require('joi');
const { Types } = require('mongoose');

// ========================================
// ESQUEMA DE VALIDACIÓN PARA YATE
// ========================================
const yachtSchema = Joi.object({
    // ========================================
    // INFORMACIÓN BÁSICA
    // ========================================
    name: Joi.string().min(3).max(100).required().messages({
        'any.required': 'Name is required',
        'string.min': 'Name must be at least 3 characters',
        'string.max': 'Name cannot exceed 100 characters'
    }),
    slug: Joi.string().optional(),
    cloudinaryFolder: Joi.string().optional(),

    // ========================================
    // CAPACIDAD
    // ========================================
    maxPax: Joi.number().integer().min(1).max(100).required().messages({
        'any.required': 'Maximum capacity (maxPax) is required',
        'number.min': 'Capacity must be at least 1 person',
        'number.max': 'Capacity cannot exceed 100 people',
        'number.integer': 'maxPax must be an integer'
    }),

    // ========================================
    // PRECIOS (Saona y Catalina) - ✅ CORREGIDO
    // ========================================
    saonaPrice: Joi.object({
        halfDay: Joi.number().min(0).allow(null).default(null),
        fullDay: Joi.number().min(0).allow(null).default(null)
    }).optional(),

    catalinaPrice: Joi.object({
        halfDay: Joi.number().min(0).allow(null).default(null),
        fullDay: Joi.number().min(0).allow(null).default(null)
    }).optional(),

    // ========================================
    // HORARIOS DISPONIBLES
    // ========================================
    timeAvailable: Joi.object({
        halfDay: Joi.array().items(Joi.string()).default([]),
        fullDay: Joi.string().required().messages({
            'any.required': 'Full day schedule is required'
        })
    }).required().messages({
        'any.required': 'timeAvailable is required'
    }),

    // ========================================
    // INCLUSIONES
    // ========================================
    includes: Joi.array().items(Joi.string()).min(1).required().messages({
        'any.required': 'At least one inclusion is required',
        'array.min': 'At least one inclusion is required'
    }),

    // ========================================
    // EXTRAS - ✅ CORREGIDO (con todos los campos)
    // ========================================
    extras: Joi.array().items(
        Joi.object({
            type: Joi.string().required().messages({
                'any.required': 'Extra type is required'
            }),
            available: Joi.boolean().required().messages({
                'any.required': 'Extra availability is required'
            }),
            included: Joi.boolean().required().messages({
                'any.required': 'Extra inclusion status is required'
            }),
            description: Joi.string().required().messages({
                'any.required': 'Extra description is required'
            }),
            price: Joi.number().min(0).required().messages({
                'any.required': 'Extra price is required',
                'number.min': 'Price cannot be negative'
            })
        })
    ).default([]),

    // ========================================
    // DESCRIPCIÓN
    // ========================================
    description: Joi.string().min(10).required().messages({
        'any.required': 'Description is required',
        'string.min': 'Description must be at least 10 characters'
    }),

    // ========================================
    // RIVER SUNSET - ✅ CORREGIDO
    // ========================================
    riverSunset: Joi.object({
        price: Joi.alternatives()
            .try(
                Joi.number().min(0),
                Joi.valid(null),
                Joi.valid('null')  // Para cuando viene como string "null" en FormData
            )
            .default(null),
        timeTrip: Joi.alternatives()
            .try(
                Joi.string(),
                Joi.valid(null),
                Joi.valid('null')
            )
            .default(null)
    }).optional()
        .custom((value, helpers) => {
            // Si tiene precio, debe tener timeTrip
            if (value.price !== null && value.price !== undefined &&
                value.price !== 'null' && value.price !== '' &&
                (!value.timeTrip || value.timeTrip === 'null' || value.timeTrip === '')) {
                return helpers.error('any.invalid', {
                    message: 'If River Sunset has a price, it must also have a timeTrip'
                });
            }
            return value;
        })
        .messages({
            'any.invalid': 'If River Sunset has a price, it must also have a timeTrip'
        }),

    // ========================================
    // METADATOS
    // ========================================
    isFeatured: Joi.boolean().default(false),
    isPublished: Joi.boolean().default(true)
});

// ========================================
// MIDDLEWARES
// ========================================

const validateYacht = {

    /**
     * Validación para CREAR yate
     */
    create: (req, res, next) => {
        const { error } = yachtSchema.validate(req.body, { abortEarly: false });

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
     * Validación para ACTUALIZAR yate (todos los campos opcionales)
     */
    update: (req, res, next) => {
        // Hacer todos los campos opcionales
        const updateSchema = yachtSchema.fork(
            Object.keys(yachtSchema.describe().keys),
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
            images: Joi.any().forbidden().messages({
                'any.unknown': 'Images cannot be updated through this endpoint. Use specific image endpoints.'
            })
        };

        const finalSchema = updateSchema.append(forbiddenFields);

        const { error } = finalSchema.validate(req.body, { abortEarly: false });

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
};

module.exports = validateYacht;