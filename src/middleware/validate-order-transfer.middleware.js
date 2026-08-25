// src/middleware/validate-transfer-order.middleware.js
const Joi = require('joi');

// ========================================
// ESQUEMA DE VALIDACIÓN PARA TRANSFER
// ========================================

// Validación para CREAR orden de transfer
const createTransferOrderSchema = Joi.object({
    fullName: Joi.string().min(2).max(50).required().messages({
        'any.required': 'Full name is required',
        'string.min': 'Full name must be at least 2 characters',
        'string.max': 'Full name cannot exceed 50 characters'
    }),
    email: Joi.string().email().required().messages({
        'any.required': 'Email is required',
        'string.email': 'Invalid email format'
    }),
    phone: Joi.string().pattern(/^[\+\d\s\-\(\)]{7,20}$/).required().messages({
        'any.required': 'Phone is required',
        'string.pattern.base': 'Invalid phone format'
    }),
    transferType: Joi.string().valid('airport-hotel', 'hotel-airport', 'round-trip', 'hotel-hotel', 'country').required().messages({
        'any.required': 'Transfer type is required',
        'any.only': 'Invalid transfer type. Must be airport-hotel, hotel-airport, round-trip, hotel-hotel, or country'
    }),
    pickUpLocation: Joi.string().min(3).max(255).required().messages({
        'any.required': 'Pickup location is required',
        'string.min': 'Pickup location must be at least 3 characters',
        'string.max': 'Pickup location cannot exceed 255 characters'
    }),
    destination: Joi.string().min(3).max(255).required().messages({
        'any.required': 'Destination is required',
        'string.min': 'Destination must be at least 3 characters',
        'string.max': 'Destination cannot exceed 255 characters'
    }),
    numPassengers: Joi.number().integer().min(1).max(50).default(1).messages({
        'number.min': 'At least 1 passenger is required',
        'number.max': 'Cannot exceed 50 passengers',
        'number.integer': 'Passengers must be an integer'
    }),
    pickUpDate: Joi.date().required().messages({
        'any.required': 'Pickup date is required',
        'date.base': 'Invalid date format'
    }),
    flightNumber: Joi.string().max(20).optional().allow('', null).messages({
        'string.max': 'Flight number cannot exceed 20 characters'
    }),
    arrivalTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().allow('', null).messages({
        'string.pattern.base': 'arrivalTime must be in HH:mm format'
    })
});

// Validación para ACTUALIZAR orden de transfer
const updateTransferOrderSchema = Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'paid', 'completed', 'cancelled', 'deleted').optional(),
    pricing: Joi.object({
        totalPrice: Joi.number().min(0).optional().messages({
            'number.min': 'Total price cannot be negative'
        }),
        currency: Joi.string().length(3).uppercase().default('USD').messages({
            'string.length': 'Currency must be exactly 3 characters'
        })
    }).optional(),
    internalNotes: Joi.string().max(1000).optional().allow('').messages({
        'string.max': 'Internal notes cannot exceed 1000 characters'
    })
});

// ========================================
// MIDDLEWARES
// ========================================

const validateTransferOrder = {

    /**
     * Validación para CREAR orden de transfer
     */
    create: (req, res, next) => {
        const { error } = createTransferOrderSchema.validate(req.body, { abortEarly: false });

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
     * Validación para ACTUALIZAR orden de transfer
     */
    update: (req, res, next) => {
        const { error } = updateTransferOrderSchema.validate(req.body, { abortEarly: false });

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

module.exports = validateTransferOrder;