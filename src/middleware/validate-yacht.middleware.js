const { Types } = require("mongoose");

const CAMPOS_PERMITIDOS = [
    'name',
    'maxPax',
    'saonaPrice',
    'catalinaPrice',
    'timeAvailable',
    'includes',
    'extras',
    'description',
    'riverSunset',
    'images'
];

const validateYacht = {

    create: (req, res, next) => {
        const data = req.body;

        // 1. Verificar campos obligatorios
        const camposObligatorios = [
            'name',
            'includes',
            'description',
            'images'
            // Quitamos saonaPrice, catalinaPrice y extras de aquí para que 
            // no fallen si el yate no los ofrece o están vacíos.
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

        // 2. Validar imágenes
        if (data.images && (!data.images.main || !data.images.main.url || !data.images.main.alt)) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: "The main image (url and alt) is required"
            });
        }

        // 3. LOGICA MODIFICADA: River Sunset
        // Ahora solo valida si viene con datos reales. Si es null o no viene, lo deja pasar.
        if (data.riverSunset && data.riverSunset.price !== null && data.riverSunset.price !== undefined) {
            if (!data.riverSunset.timeTrip) {
                return res.status(400).json({
                    ok: false,
                    type: 'ValidationError',
                    message: "If River Sunset has a price, it must also have a timeTrip."
                });
            }
        }

        // 4. LOGICA MODIFICADA: Extras
        // Usamos checks de undefined/null en lugar de ! para permitir que el precio sea 0.
        if (data.extras && Array.isArray(data.extras)) {
            for (const extra of data.extras) {
                if (
                    !extra.type || 
                    extra.available === undefined || 
                    extra.price === null || 
                    extra.price === undefined
                ) {
                    return res.status(400).json({
                        ok: false,
                        type: 'ValidationError',
                        message: "Each extra must have at least a type, availability and price (can be 0)."
                    });
                }
            }
        }

        // 5. Validar timeAvailable
        if (!data.timeAvailable || typeof data.timeAvailable !== 'object' || !data.timeAvailable.fullDay) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: "The field 'timeAvailable' must include a 'fullDay' schedule."
            });
        }

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

        // Repetimos la lógica flexible para el UPDATE
        if (updates.images && (!updates.images.main || !updates.images.main.url)) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: "Main image URL is required if updating images"
            });
        }

        // Lógica flexible para extras en Update (permite precio 0)
        if (updates.extras && Array.isArray(updates.extras)) {
            for (const extra of updates.extras) {
                if (!extra.type || extra.price === undefined) {
                    return res.status(400).json({
                        ok: false,
                        type: 'ValidationError',
                        message: "Updated extras must contain at least type and price."
                    });
                }
            }
        }

        // Lógica flexible para River Sunset en Update
        if (updates.riverSunset && updates.riverSunset.price !== null) {
            if (!updates.riverSunset.timeTrip) {
                return res.status(400).json({
                    ok: false,
                    type: 'ValidationError',
                    message: "River Sunset price requires a timeTrip duration."
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
                message: "Invalid ID"
            });
        }
        next();
    }
}

module.exports = validateYacht;