const { Types } = require("mongoose");

const CAMPOS_PERMITIDOS = [
    "name",
    "description",
    "regularPriceUsd",
    "offerPriceUsd",
    "location",
    "categories",
    "duration",
    "includes",
    "minimumAge",
    "itinerary",
    "recommendations",
    "startingPoint",
    "pickupTime",
    "images"
];

const validateExcursion = {

    // --- VALIDAR CREATE ---
    create: (req, res, next) => {

        const data = req.body;

        // 1. Verificar campos obligatorios para creación
        const camposObligatorios = [
            "name",
            "description",
            "regularPriceUsd",
            "offerPriceUsd",
            "location",
            "categories",
            "duration",
            "includes",
            "minimumAge",
            "itinerary",
            "recommendations",
            "startingPoint",
            "pickupTime",
            "images"];

        for (const campo of camposObligatorios) {
            if (!data[campo]) {
                return res.status(400).json({
                    ok: false,
                    type: 'ValidationError',
                    message: `The field '${campo}' is required.`
                });
            }
        }

        // 2. Validar tipos complejos rápidamente
        if (data.images && (!data.images.main || !data.images.main.alt)) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: "The main image (main.url and main.alt) is required"
            });
        }

        if (data.duration && (typeof data.duration.time !== 'number' || !data.duration.unit)) {
            return res.status(400).json({ ok: false, message: "La duración debe tener un tiempo (número) y una unidad (hour, hours, day, days, week, weeks, month, months, year, years)" });
        }

        next();
    },

    // --- VALIDAR UPDATE ---
    upDate: (req, res, next) => {

        const updates = req.body;
        const camposRecibidos = Object.keys(updates);

        const camposProhibidos = ["_id", "createdAt", "updatedAt"];

        if (camposRecibidos.length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'No fields were provided for updating.'
            });
        }

        // Dentro de tu validateExcursion.upDate...
        if (updates.offerPriceUsd && updates.regularPriceUsd) {
            if (updates.offerPriceUsd >= updates.regularPriceUsd) {
                return res.status(400).json({
                    ok: false,
                    type: 'ValidationError',
                    message: "Offer price must be lower than regular price"
                });
            }
        }

        for (const campo of camposRecibidos) {

            // Bloquear campos protegidos
            if (camposProhibidos.includes(campo)) {
                return res.status(400).json({
                    ok: false,
                    type: 'ValidationError',
                    message: `You cannot update the field '${campo}'. It is a protected field.`
                });
            }

            // Bloquear campos inexistentes
            if (!CAMPOS_PERMITIDOS.includes(campo)) {
                return res.status(400).json({
                    ok: false,
                    type: 'ValidationError',
                    error: `The field '${campo}' It is not valid for updating..`
                });
            }
        }

        next();
    },

    // --- VALIDAR ID ---
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

module.exports = validateExcursion;