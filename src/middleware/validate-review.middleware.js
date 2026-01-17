const { Types } = require("mongoose");

const CAMPOS_PERMITIDOS = [
    'status',
    'featured',
    'reply'
];

const CAMPOS_PERMITIDOS_CREATE = [
    'fullName',
    'email',
    'selectedExcursion',
    'selectedYacht',
    'rating',
    'comment'
];

const validateReview = {

    create: (req, res, next) => {

        const data = req.body;

        const camposObligatorios = [
            'fullName',
            'email',
            'rating',
            'comment'
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


        if (data.comment && data.comment.length > 500) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'Comment is too long (Max 500 characters).'
            });
        }

        const filteredData = {};
        CAMPOS_PERMITIDOS_CREATE.forEach(campo => {
            if (data[campo] !== undefined) {
                filteredData[campo] = data[campo];
            }
        });

        req.body = filteredData;

        next();
    },

    upDate: (req, res, next) => {
        const updates = req.body;
        const camposUpdate = Object.keys(updates);

        if (camposUpdate.length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'No data provided for update'
            });
        }

        const camposInvalidos = camposUpdate.filter(campo => !CAMPOS_PERMITIDOS.includes(campo));
        if (camposInvalidos.length > 0) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: `Invalid fields: ${camposInvalidos.join(', ')}`
            });
        }

        next();
    },

    id: (req, res, next) => {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: "Invalid ID"
            });
        }
        next();
    }
}

module.exports = validateReview;