// src/middlewares/excursion-validator.middleware.js
const Joi = require('joi');

// ========================================
// ESQUEMA DE VALIDACIÓN PARA EXCURSIÓN
// ========================================

const excursionSchema = Joi.object({
    // ========================================
    // INFORMACIÓN BÁSICA
    // ========================================
    name: Joi.string().min(3).max(100).required().messages({
        'any.required': 'Name is required',
        'string.min': 'Name must be at least 3 characters',
        'string.max': 'Name cannot exceed 100 characters'
    }),
    slug: Joi.string().optional(), // Se genera automáticamente
    shortDescription: Joi.string().min(10).max(200).required().messages({
        'any.required': 'Short description is required',
        'string.min': 'Short description must be at least 10 characters',
        'string.max': 'Short description cannot exceed 200 characters'
    }),
    longDescription: Joi.string().min(20).required().messages({
        'any.required': 'Long description is required',
        'string.min': 'Long description must be at least 20 characters'
    }),

    // ========================================
    // PRECIOS
    // ========================================
    pricing: Joi.object({
        adultPrice: Joi.number().min(0).required().messages({
            'any.required': 'Adult price is required',
            'number.min': 'Adult price cannot be negative'
        }),
        childPrice: Joi.number().min(0).required().messages({
            'any.required': 'Child price is required',
            'number.min': 'Child price cannot be negative'
        }),
        infantPrice: Joi.number().min(0).default(0).messages({
            'number.min': 'Infant price cannot be negative'
        }),
        paymentTerms: Joi.string().valid('full', 'deposit', 'pay_later').default('full'),
        depositPercentage: Joi.number().min(0).max(100).default(0),
        ageRanges: Joi.object({
            adult: Joi.number().min(13).max(99).default(13),
            child: Joi.number().min(3).max(12).default(3),
            infant: Joi.number().min(0).max(2).default(0)
        }).default({})
    }).required().messages({
        'any.required': 'Pricing information is required'
    }),

    // ========================================
    // DURACIÓN
    // ========================================
    duration: Joi.object({
        value: Joi.number().min(1).required().messages({
            'any.required': 'Duration value is required',
            'number.min': 'Duration must be at least 1'
        }),
        unit: Joi.string().valid('hour', 'hours', 'day', 'days', 'half_day').required().messages({
            'any.required': 'Duration unit is required',
            'any.only': 'Duration unit must be hour, hours, day, days, or half_day'
        })
    }).required().messages({
        'any.required': 'Duration is required'
    }),

    // ========================================
    // UBICACIÓN
    // ========================================
    location: Joi.object({
        locationName: Joi.string().required().messages({
            'any.required': 'Location name is required'
        }),
        coordinates: Joi.object({
            lat: Joi.number().optional(),
            lng: Joi.number().optional()
        }).optional(),
        displayName: Joi.string().optional().allow('')
    }).required().messages({
        'any.required': 'Location is required'
    }),

    // ========================================
    // CATEGORÍAS
    // ========================================
    categories: Joi.array().items(Joi.string()).min(1).required().messages({
        'any.required': 'At least one category is required',
        'array.min': 'At least one category is required'
    }),

    // ========================================
    // INCLUSIONES
    // ========================================
    inclusions: Joi.object({
        included: Joi.array().items(Joi.string()).min(1).required().messages({
            'any.required': 'At least one inclusion is required',
            'array.min': 'At least one inclusion is required'
        }),
        notIncluded: Joi.array().items(Joi.string()).default([])
    }).required().messages({
        'any.required': 'Inclusions are required'
    }),

    // ========================================
    // EDAD MÍNIMA
    // ========================================
    minimumAge: Joi.number().min(0).max(120).required().messages({
        'any.required': 'Minimum age is required',
        'number.min': 'Minimum age cannot be negative',
        'number.max': 'Invalid minimum age'
    }),

    // ========================================
    // ITINERARIO
    // ========================================
    itinerary: Joi.array().items(
        Joi.object({
            titleItinerary: Joi.string().required().messages({
                'any.required': 'Itinerary title is required'
            }),
            description: Joi.string().required().messages({
                'any.required': 'Itinerary description is required'
            }),
            order: Joi.number().min(0).default(0),
            icon: Joi.string().default('bi-check-circle')
        })
    ).min(1).required().messages({
        'any.required': 'At least one itinerary step is required',
        'array.min': 'At least one itinerary step is required'
    }),

    // ========================================
    // RECOMENDACIONES (QUÉ LLEVAR)
    // ========================================
    recommendations: Joi.array().items(Joi.string()).min(1).required().messages({
        'any.required': 'At least one recommendation is required',
        'array.min': 'At least one recommendation is required'
    }),

    // ========================================
    // LOGÍSTICA
    // ========================================
    startingPoint: Joi.string().required().messages({
        'any.required': 'Starting point is required'
    }),
    pickupInfo: Joi.object({
        included: Joi.boolean().default(true),
        details: Joi.string().optional().allow(''),
        airbnbFriendly: Joi.boolean().default(true)
    }).default({}),
    dropoffInfo: Joi.string().optional().allow(''),

    // ========================================
    // METADATOS
    // ========================================
    isFeatured: Joi.boolean().default(false),
    isPublished: Joi.boolean().default(true),
    // ========================================
    // SEO
    // ========================================
    seo: Joi.object({
        title: Joi.string().optional().allow(''),
        description: Joi.string().optional().allow(''),
        keywords: Joi.array().items(Joi.string()).default([])
    }).default({})
});

// ========================================
// MIDDLEWARES
// ========================================

const validateExcursion = {

    /**
     * Validación para CREAR excursión
     */
    create: (req, res, next) => {
        const { error } = excursionSchema.validate(req.body, { abortEarly: false });

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
     * Validación para ACTUALIZAR excursión (todos los campos opcionales)
     */
    update: (req, res, next) => {
        // Hacer todos los campos opcionales
        const updateSchema = excursionSchema.fork(
            Object.keys(excursionSchema.describe().keys),
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
            order: Joi.any().forbidden().messages({
                'any.unknown': 'Order is auto-generated and cannot be modified'
            }),
            // ✅ Agregar images como prohibido
            images: Joi.any().forbidden().messages({
                'any.unknown': 'Images cannot be updated through this endpoint. Use specific image endpoints.'
            }),
            cloudinaryFolder: Joi.any().forbidden().messages({
                'any.unknown': 'Cloudinary folder is auto-generated and cannot be modified'
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

module.exports = validateExcursion;