const { Types } = require("mongoose");

const CAMPOS_PERMITIDOS_UPDATE = [
    'status',
    'internalNotes'
];

const CAMPOS_PERMITIDOS_CREATE = [
    'excursionId',
    'fullName',
    'email',
    'phone',
    'adults',
    'children',
    'travelDate',
    'hotelName',
    'hotelNumber'
];

const validateExcursionOrder = {

    create: (req, res, next) => {
        const data = req.body;

        const camposObligatorios = [
            'excursionId',
            'fullName',
            'email',
            'phone',
            'adults',
            'travelDate',
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

        if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'Invalid email format.'
            });
        }

        if (!Types.ObjectId.isValid(data.excursionId)) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'Invalid excursionId.'
            });
        }

        if (typeof data.adults !== 'number' || data.adults < 1) {
            return res.status(400).json({
                ok: false,
                message: 'At least 1 adult is required.'
            });
        }

        const filteredData = {};
        CAMPOS_PERMITIDOS_CREATE.forEach(campo => {
            if (data[campo] !== undefined) filteredData[campo] = data[campo];
        });

        req.body = filteredData;


        next();
    },

    update: (req, res, next) => {
        const updates = req.body;
        const camposUpdate = Object.keys(updates);

        if (camposUpdate.length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'No data provided for update.'
            });
        }

        const camposInvalidos = camposUpdate.filter(campo => !CAMPOS_PERMITIDOS_UPDATE.includes(campo));

        if (camposInvalidos.length > 0) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: `Invalid fields for update: ${camposInvalidos.join(', ')}`
            });
        }


        if (updates.internalNotes && updates.internalNotes.length > 1000) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'Internal notes are too long (Max 1000 characters).'
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
                message: "The provided ID is not a valid MongoDB ObjectId."
            });
        }
        next();
    }
};

module.exports = validateExcursionOrder;