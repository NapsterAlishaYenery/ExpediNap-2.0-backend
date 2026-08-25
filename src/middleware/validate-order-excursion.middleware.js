// src/middleware/validate-excursion-order.middleware.js
const Joi = require('joi');

// ========================================
// ESQUEMA DE VALIDACIÓN PARA ORDEN DE EXCURSIÓN
// ========================================

// Validación para CREAR orden
const createExcursionOrderSchema = Joi.object({
    excursionId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
        'any.required': 'Excursion ID is required',
        'string.pattern.base': 'Invalid excursionId format. Must be a valid MongoDB ObjectId.'
    }),
    fullName: Joi.string().min(2).max(100).required().messages({
        'any.required': 'Full name is required',
        'string.min': 'Full name must be at least 2 characters',
        'string.max': 'Full name cannot exceed 100 characters'
    }),
    email: Joi.string().email().required().messages({
        'any.required': 'Email is required',
        'string.email': 'Invalid email format'
    }),
    phone: Joi.string().pattern(/^[0-9]{8,15}$/).required().messages({
        'any.required': 'Phone is required',
        'string.pattern.base': 'Invalid phone format. Must be 8-15 digits'
    }),
    adults: Joi.number().integer().min(1).max(100).required().messages({
        'any.required': 'At least 1 adult is required',
        'number.min': 'At least 1 adult is required',
        'number.max': 'Adults cannot exceed 100',
        'number.integer': 'Adults must be an integer'
    }),
    children: Joi.number().integer().min(0).max(50).default(0).messages({
        'number.min': 'Children cannot be negative',
        'number.max': 'Children cannot exceed 50',
        'number.integer': 'Children must be an integer'
    }),
    travelDate: Joi.date().required().messages({
        'any.required': 'Travel date is required',
        'date.base': 'Invalid date format'
    }),
    hotelName: Joi.string().max(255).optional().allow(''),
    hotelNumber: Joi.string().max(50).optional().allow('')
});

// Validación para ACTUALIZAR orden (solo campos permitidos)
const updateExcursionOrderSchema = Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'paid', 'completed', 'cancelled', 'deleted').optional(),
    internalNotes: Joi.string().max(1000).optional().allow('').messages({
        'string.max': 'Internal notes cannot exceed 1000 characters'
    })
});

// ========================================
// MIDDLEWARES
// ========================================

const validateExcursionOrder = {

    /**
     * Validación para CREAR orden de excursión
     */
    create: (req, res, next) => {
        const { error } = createExcursionOrderSchema.validate(req.body, { abortEarly: false });

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
     * Validación para ACTUALIZAR orden de excursión
     */
    update: (req, res, next) => {
        const { error } = updateExcursionOrderSchema.validate(req.body, { abortEarly: false });

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
    }
};

module.exports = validateExcursionOrder;