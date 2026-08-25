// src/middleware/validate-id.middleware.js
const { Types } = require('mongoose');

const validateGlobalID = {
    /**
     * Valida que el ID proporcionado sea un ObjectId válido de MongoDB
     */
    id: (req, res, next) => {
        const { id } = req.params;

        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'The provided ID is not a valid MongoDB ID.'
            });
        }

        next();
    }
};

module.exports = validateGlobalID;