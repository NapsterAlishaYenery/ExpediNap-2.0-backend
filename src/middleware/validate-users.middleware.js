// src/middlewares/validate-user.middleware.js
const Joi = require('joi');
const { Types } = require('mongoose');

// ========================================
// ESQUEMA DE VALIDACIÓN PARA USUARIO
// ========================================

const userSchema = Joi.object({
    // ========================================
    // INFORMACIÓN PERSONAL
    // ========================================
    name: Joi.string().min(2).max(50).required().messages({
        'any.required': 'First name is required',
        'string.min': 'First name must be at least 2 characters',
        'string.max': 'First name cannot exceed 50 characters'
    }),
    lastname: Joi.string().min(2).max(50).required().messages({
        'any.required': 'Last name is required',
        'string.min': 'Last name must be at least 2 characters',
        'string.max': 'Last name cannot exceed 50 characters'
    }),
    username: Joi.string().min(3).max(255).required().messages({
        'any.required': 'Username is required',
        'string.min': 'Username must be at least 3 characters',
        'string.max': 'Username cannot exceed 255 characters'
    }),
    email: Joi.string().email().required().messages({
        'any.required': 'Email is required',
        'string.email': 'Please provide a valid email address'
    }),
    password: Joi.string().min(6).required().messages({
        'any.required': 'Password is required',
        'string.min': 'Password must be at least 6 characters'
    }),

    // ========================================
    // INFORMACIÓN ADICIONAL
    // ========================================
    phone: Joi.string().pattern(/^[0-9]{8,15}$/).optional().allow('').messages({
        'string.pattern.base': 'Please provide a valid phone number (digits only)'
    }),
    age: Joi.number().integer().min(1).max(120).optional().messages({
        'number.min': 'Age must be at least 1',
        'number.max': 'Age cannot exceed 120',
        'number.integer': 'Age must be an integer'
    }),
    role: Joi.string().valid('admin', 'super-admin', 'user').default('user'),
    active: Joi.boolean().default(true),

    // ========================================
    // DIRECCIÓN
    // ========================================
    direction: Joi.object({
        street: Joi.string().max(255).optional().allow(''),
        city: Joi.string().max(100).optional().allow(''),
        municipality: Joi.string().max(100).optional().allow(''),
        zip_code: Joi.string().max(10).optional().allow('')
    }).optional().default({
        street: '',
        city: '',
        municipality: '',
        zip_code: ''
    })
});

// ========================================
// ESQUEMA PARA REGISTRO (con password obligatorio)
// ========================================

const registerSchema = userSchema.keys({
    name: Joi.string().min(2).max(50).required(),
    lastname: Joi.string().min(2).max(50).required(),
    username: Joi.string().min(3).max(255).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

// ========================================
// ESQUEMA PARA LOGIN
// ========================================

const loginSchema = Joi.object({
    username: Joi.string().required().messages({
        'any.required': 'Username is required'
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required'
    })
});

// ========================================
// ESQUEMA PARA ACTUALIZAR (todos opcionales)
// ========================================

const updateSchema = userSchema.fork(
    Object.keys(userSchema.describe().keys),
    (schema) => schema.optional()
);

// ✅ Campos prohibidos (no se pueden actualizar)
const forbiddenUpdateFields = {
    _id: Joi.any().forbidden(),
    username: Joi.any().forbidden().messages({
        'any.unknown': 'Username cannot be modified'
    }),
    email: Joi.any().forbidden().messages({
        'any.unknown': 'Email cannot be modified'
    }),
    password: Joi.any().forbidden().messages({
        'any.unknown': 'Password cannot be modified through this endpoint'
    }),
    password_hash: Joi.any().forbidden(),
    createdAt: Joi.any().forbidden(),
    updatedAt: Joi.any().forbidden()
};

const finalUpdateSchema = updateSchema.append(forbiddenUpdateFields);

// ========================================
// MIDDLEWARES
// ========================================

const validateUser = {

    /**
     * Validación para REGISTRO de usuario
     */
    register: (req, res, next) => {
        const { error } = registerSchema.validate(req.body, { abortEarly: false });

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
     * Validación para LOGIN de usuario
     */
    login: (req, res, next) => {
        const { error } = loginSchema.validate(req.body, { abortEarly: false });

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
     * Validación para ACTUALIZAR usuario (todos los campos opcionales)
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
    }
};

module.exports = validateUser;