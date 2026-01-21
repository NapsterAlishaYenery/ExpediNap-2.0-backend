const { Types } = require("mongoose");

const CAMPOS_PERMITIDOS_UPDATE = [
    'status',
    'pricing',
    'internalNotes'
];

const CAMPOS_PERMITIDOS_CREATE = [
    'fullName',
    'email',
    'phone',
    'transferType',
    'pickUpLocation',
    'destination',
    'numPassengers',
    'pickUpDate',
    'flightNumber', // Nuevo
    'arrivalTime'   // Nuevo
];

const validateTransferOrder = {

    create: (req, res, next) => {

        const data = req.body;

        const camposObligatorios = [
            'fullName',
            'email',
            'phone',
            'transferType',
            'pickUpLocation',
            'destination',
            'pickUpDate'
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

        if (data.pickUpDate && isNaN(new Date(data.pickUpDate).getTime())) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'pickUpDate is not a valid date format.'
            });
        }

        // Opcional: Validar que sea un formato de hora HH:mm
        if (data.arrivalTime && !/^([01]\d|2[0-3]):?([0-5]\d)$/.test(data.arrivalTime)) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'arrivalTime must be in HH:mm format.'
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
                message: `Invalid fields for update: ${camposInvalidos.join(', ')}`
            });
        }

        if (updates.pricing) {
            const { totalPrice, currency } = updates.pricing;
            if (totalPrice !== undefined && (typeof totalPrice !== 'number' || totalPrice < 0)) {
                return res.status(400).json({
                    ok: false,
                    type: 'ValidationError',
                    message: 'totalPrice must be a positive number.'
                });
            }

            if (currency && currency.length !== 3) {
                return res.status(400).json({
                    ok: false,
                    type: 'ValidationError',
                    message: 'Currency must be exactly 3 characters (e.g., USD).'
                });
            }
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

module.exports = validateTransferOrder;