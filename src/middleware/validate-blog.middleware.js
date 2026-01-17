const { Types } = require("mongoose");

const validateBlog = {

    create: (req, res, next) => {

         const data = req.body;

        const camposObligatorios = [
            'title',
            'category',
            'type',
            'meta_title',
            'meta_description',
            'keywords',
            'excerpt',
            'image',
            'alt',
            'content'
        ];

        for (const campo of camposObligatorios) {
            if (!data[campo]) {
                return res.status(400).json({
                    ok: false,
                    type: 'ValidationError',
                    message: `The field '${campo}' is required.`
                });
            }
        }

        next();
    },

  
    id: (req, res, next) => {
        const { id } = req.params;

        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'Invalid blog ID format'
            });
        }

        next();
    },

    upDate: (req, res, next) => {
        const updates = req.body;
        const camposRecibidos = Object.keys(updates);

        const camposProhibidos = ['_id', 'slug', 'createdAt', 'updatedAt'];

        if (camposRecibidos.length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'No fields provided for update'
                
            });
        }

        for (const campo of camposRecibidos) {

            if (camposProhibidos.includes(campo)) {
                return res.status(400).json({
                    ok: false,
                    type: 'FieldProtected',
                    message: `Field '${campo}' is protected and cannot be updated`
                });
            }
        }

        next();
    }
};

module.exports = validateBlog;
