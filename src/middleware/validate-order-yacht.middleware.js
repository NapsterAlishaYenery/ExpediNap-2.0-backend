// src/middleware/validate-yacht-order.middleware.js
const Joi = require('joi');

// ========================================
// ESQUEMA DE VALIDACIÓN PARA ORDEN DE YATE
// ========================================

// Validación para CREAR orden de yate
const createYachtOrderSchema = Joi.object({
    yachtId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
        'any.required': 'Yacht ID is required',
        'string.pattern.base': 'Invalid yachtId format. Must be a valid MongoDB ObjectId.'
    }),
    destination: Joi.string().valid('Saona Island', 'Catalina Island', 'River Sunset').required().messages({
        'any.required': 'Destination is required',
        'any.only': 'Destination must be Saona Island, Catalina Island, or River Sunset'
    }),
    duration: Joi.string().valid('Full Day', 'Half Day', 'Sunset Trip').required().messages({
        'any.required': 'Duration is required',
        'any.only': 'Duration must be Full Day, Half Day, or Sunset Trip'
    }),
    travelDate: Joi.date().required().messages({
        'any.required': 'Travel date is required',
        'date.base': 'Invalid date format'
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
    })
});

// Validación para ACTUALIZAR orden de yate (solo campos permitidos)
const updateYachtOrderSchema = Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'paid', 'cancelled', 'deleted', 'completed').optional(),
    isAvailable: Joi.boolean().optional(),
    internalNotes: Joi.string().max(1000).optional().allow('').messages({
        'string.max': 'Internal notes cannot exceed 1000 characters'
    })
});

// ========================================
// MIDDLEWARES
// ========================================

const validateYachtOrder = {

    /**
     * Validación para CREAR orden de yate
     */
    create: (req, res, next) => {
        const { error } = createYachtOrderSchema.validate(req.body, { abortEarly: false });

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
     * Validación para ACTUALIZAR orden de yate
     */
    update: (req, res, next) => {
        const { error } = updateYachtOrderSchema.validate(req.body, { abortEarly: false });

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

module.exports = validateYachtOrder;