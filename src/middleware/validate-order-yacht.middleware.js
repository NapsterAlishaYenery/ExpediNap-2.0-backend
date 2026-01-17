const { Types } = require("mongoose");

const CAMPOS_PERMITIDOS_UPDATE = [
    'status',
    'isAvailable',
    'internalNotes'
];

const CAMPOS_PERMITIDOS_CREATE = [
    'yachtId',
    'destination',
    'duration',
    'travelDate',
    'fullName',
    'email',
    'phone'
];

const validateYachtOrder = {

    create: (req, res, next) => {
        const data = req.body;

        const camposObligatorios = [
            'yachtId',
            'destination',
            'duration',
            'travelDate',
            'fullName',
            'email',
            'phone'
        ];

        for (const campo of camposObligatorios) {
            if (!data[campo]) {
                return res.status(400).json({
                    ok: false,
                    type: 'ValidationError',
                    message: `The field '${campo}' is required to process the booking.`
                });
            }
        }

        if (!Types.ObjectId.isValid(data.yachtId)) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'Invalid Yacht ID format.'
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
                message: `You are not allowed to update these fields: ${camposInvalidos.join(', ')}`
            });
        }

        if (updates.internalNotes && updates.internalNotes.length > 1000) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'Internal notes exceed the 1000 character limit.'
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
                message: "The provided Order ID is not valid."
            });
        }
        next();
    }
};

module.exports = validateYachtOrder;