// src/middleware/validate-ncf.middleware.js
const Joi = require('joi');

// ========================================
// ESQUEMA DE VALIDACIÓN PARA NCF
// ========================================

// Validación para un solo NCF
const singleNcfSchema = Joi.object({
    tipoNcf: Joi.string().valid('B01', 'B02', 'B11', 'B16').required().messages({
        'any.required': 'NCF type is required',
        'any.only': 'NCF type must be B01, B02, B11, or B16'
    }),
    ncf: Joi.string().pattern(/^B(01|02|11|16)\d{8}$/).required().messages({
        'any.required': 'NCF number is required',
        'string.pattern.base': 'Invalid NCF format. Must follow pattern: B0200000001'
    }),
    fechaVencimiento: Joi.date().required().messages({
        'any.required': 'Expiration date is required',
        'date.base': 'Invalid date format'
    })
});

// Validación para carga masiva (Bulk)
const bulkNcfSchema = Joi.object({
    ncfs: Joi.array().items(
        Joi.object({
            tipoNcf: Joi.string().valid('B01', 'B02', 'B11', 'B16').required(),
            ncf: Joi.string().pattern(/^B(01|02|11|16)\d{8}$/).required(),
            fechaVencimiento: Joi.date().required()
        })
    ).min(1).required().messages({
        'any.required': 'Array of NCFs is required in the "ncfs" field',
        'array.min': 'At least one NCF is required'
    })
});

// ========================================
// MIDDLEWARES
// ========================================

const validateNcf = {

    /**
     * Validación para CREAR un solo NCF
     */
    createSingle: (req, res, next) => {
        const { error } = singleNcfSchema.validate(req.body, { abortEarly: false });

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
     * Validación para CARGA MASIVA de NCFs
     */
    createBulk: (req, res, next) => {
        const { error } = bulkNcfSchema.validate(req.body, { abortEarly: false });

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

module.exports = validateNcf;