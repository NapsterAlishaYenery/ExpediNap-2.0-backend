const Joi = require('joi');

// ========================================
// ESQUEMA DE VALIDACIÓN PARA FORMULARIO DE CONTACTO
// ========================================

const contactSchema = Joi.object({
    fullName: Joi.string().min(2).max(100).required().messages({
        'any.required': 'Full name is required',
        'string.min': 'Full name must be at least 2 characters',
        'string.max': 'Full name cannot exceed 100 characters'
    }),
    email: Joi.string().email().required().messages({
        'any.required': 'Email is required',
        'string.email': 'Invalid email format'
    }),
    phone: Joi.string().pattern(/^[\+\d\s\-\(\)]{7,20}$/).required().messages({
        'any.required': 'Phone is required',
        'string.pattern.base': 'Invalid phone format'
    }),
    message: Joi.string().min(10).max(5000).required().messages({
        'any.required': 'Message is required',
        'string.min': 'Message must be at least 10 characters',
        'string.max': 'Message cannot exceed 5000 characters'
    })
});

// ========================================
// MIDDLEWARE
// ========================================

const validateEmailSender = {

    /**
     * Validación para ENVIAR correo de contacto
     */
    emailSend: (req, res, next) => {
        const { error } = contactSchema.validate(req.body, { abortEarly: false });

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

module.exports = validateEmailSender;