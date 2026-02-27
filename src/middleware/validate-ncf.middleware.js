const { Types } = require("mongoose");

const CAMPOS_PERMITIDOS = [
    'tipoNcf',
    'ncf',
    'fechaVencimiento' // <--- Antes era 'vencimiento'
];

const validateNcf = {

    /**
     * Valida la creación de un solo NCF
     */
    createSingle: (req, res, next) => {
        const data = req.body;
        const camposObligatorios = ['tipoNcf', 'ncf', 'fechaVencimiento'];

        // 1. Verificar campos obligatorios
        for (const campo of camposObligatorios) {
            if (!data[campo]) {
                return res.status(400).json({
                    ok: false,
                    type: 'ValidationError',
                    message: `El campo '${campo}' es obligatorio.`
                });
            }
        }

        // 2. Validar formato NCF (Ej: B0200000001 -> 11 caracteres)
        if (!/^B(01|02|11|16)\d{8}$/.test(data.ncf)) { // o item.ncf en bulk
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'Formato de NCF inválido. Ej: B0200000001'
            });
        }

        // 3. Limpiar campos no permitidos
        const filteredData = {};
        CAMPOS_PERMITIDOS.forEach(campo => {
            if (data[campo] !== undefined) filteredData[campo] = data[campo];
        });

        req.body = filteredData;
        next();
    },

    /**
     * Valida la carga masiva (Bulk)
     */
    createBulk: (req, res, next) => {
        const { ncfs } = req.body;

        if (!ncfs || !Array.isArray(ncfs) || ncfs.length === 0) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'Se requiere un array de NCFs en el campo "ncfs".'
            });
        }

        // Validar cada elemento del array
        for (let i = 0; i < ncfs.length; i++) {
            const item = ncfs[i];

            if (!item.tipoNcf || !item.ncf || !item.fechaVencimiento) {
                return res.status(400).json({
                    ok: false,
                    type: 'ValidationError',
                    message: `Error en el índice ${i}: Faltan campos obligatorios (tipoNcf, ncf, fechaVencimiento).`
                });
            }

            if (!/^B[0-9]{10}$/.test(item.ncf)) {
                return res.status(400).json({
                    ok: false,
                    type: 'ValidationError',
                    message: `Error en el índice ${i}: El NCF ${item.ncf} no tiene un formato válido.`
                });
            }
        }

        next();
    },

    /**
     * Valida el ID para eliminación
     */
    id: (req, res, next) => {
        const { id } = req.params;
        if (!Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: "El ID proporcionado no es un ObjectId válido de MongoDB."
            });
        }
        next();
    }
};

module.exports = validateNcf;