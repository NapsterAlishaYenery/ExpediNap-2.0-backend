const NCF = require("../models/NcfPool.model"); //NCF NUMERO CON VALOR FISCAL


/**
 * Guarda un solo NCF de forma individual
 */
exports.saveSingleNcf = async (req, res) => {
    try {
        // Extraemos 'fechaVencimiento' porque así lo envía el Middleware filtrado
        const { tipoNcf, ncf, fechaVencimiento } = req.body;

        const nuevoNcf = new NCF({
            tipoNcf,
            ncf,
            fechaVencimiento: new Date(fechaVencimiento),
            estado: 'available' // 'isUsed' no existe en tu modelo, usamos 'estado'
        });

        await nuevoNcf.save();

        res.status(201).json({
            ok: true,
            message: "NCF saved individually",
            data: nuevoNcf
        });
    } catch (error) {
        console.error("Error in saveSingleNcf:", error); // Importante para debug

        // Si es error de duplicado en MongoDB
        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                message: `The NCF ${JSON.stringify(error.keyValue)} already exists.`,
                type: "DUPLICATE_ERROR"
            });
        }

        res.status(500).json({
            ok: false,
            message: "Error saving NCF",
            type: "SERVER_ERROR",
            error: error.message // Esto te ayudará a ver por qué falló en Postman
        });
    }
};

/**
 * Guarda múltiples NCFs en una sola operación (Bulk Insert)
 */
exports.saveBulkNcfs = async (req, res) => {
    try {
        const { ncfs } = req.body;

        const ncfsParaGuardar = ncfs.map(item => ({
            tipoNcf: item.tipoNcf,
            ncf: item.ncf,
            fechaVencimiento: new Date(item.fechaVencimiento),
            estado: 'available'
        }));

        const docs = await NCF.insertMany(ncfsParaGuardar);

        res.status(201).json({
            ok: true,
            message: `${docs.length} NCF numbers successfully loaded`,
            data: { count: docs.length }
        });
    } catch (error) {

        console.error("Error in saveBulkNcfs:", error);

        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                message: "One or more NCF numbers already exist in the system.",
                type: "DUPLICATE_ERROR",
                // Opcional: mostrar cuál falló
                error: error.writeErrors ? error.writeErrors[0].errmsg : error.message
            });
        }
        res.status(500).json({
            ok: false,
            message: "Error in bulk upload of NCFs",
            type: "SERVER_ERROR",
            error: error.message
        });
    }
};


/**
 * Obtener todos los NCFs con filtros y paginación
 */
exports.getAllNcfs = async (req, res) => {
    try {
        const { tipoNcf, estado, ncf } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50; // Límite más alto por ser datos ligeros
        const skip = (page - 1) * limit;

        let query = {};

        if (tipoNcf) query.tipoNcf = tipoNcf;
        if (estado) query.estado = estado;
        if (ncf) query.ncf = { $regex: ncf, $options: 'i' };

        const [ncfs, totalItems] = await Promise.all([
            NCF.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            NCF.countDocuments(query)
        ]);

        if (!ncfs) {
            return res.status(404).json({
                ok: false,
                message: "No NCF records were found",
                type: "NOT_FOUND"
            });
        }

        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            ok: true,
            data: ncfs,
            message: "NCFs successfully recovered",
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error retrieving NCFs from the server",
            type: "SERVER_ERROR"
        });
    }
};

/**
 * Obtener estadísticas de disponibilidad (Para alertas de "Se están acabando")
 */
exports.getNcfStats = async (req, res) => {
    try {
        const stats = await NCF.aggregate([
            {
                $group: {
                    _id: "$tipoNcf",
                    available: {
                        $sum: { $cond: [{ $eq: ["$estado", "available"] }, 1, 0] }
                    },
                    used: {
                        $sum: { $cond: [{ $eq: ["$estado", "used"] }, 1, 0] }
                    },
                    expired: {
                        $sum: { $cond: [{ $eq: ["$estado", "expired"] }, 1, 0] }
                    }
                }
            }
        ]);

        return res.status(200).json({
            ok: true,
            data: stats,
            message: "NCF statistics generated"
        });
    } catch (error) {
        
        return res.status(500).json({
            ok: false,
            message: "Error generating statistics",
            type: "SERVER_ERROR"
        });
    }
};

/**
 * Eliminar un NCF (Solo si no ha sido usado)
 */
exports.deleteNcf = async (req, res) => {
    try {
        const { id } = req.params;

        const ncfEncontrado = await NCF.findById(id);

        if (!ncfEncontrado) {
            return res.status(404).json({
                ok: false,
                message: "NCF not found",
                type: "NOT_FOUND"
            });
        }

        if (ncfEncontrado.estado === 'used') {
            return res.status(400).json({
                ok: false,
                message: "You cannot delete an NCF that has already been used on an invoice",
                type: "BAD_REQUEST"
            });
        }

        const deleteNcf = await NCF.findByIdAndDelete(id);

        return res.status(200).json({
            ok: true,
            message: "NCF removed successfully",
            data: deleteNcf
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error al eliminar el NCF",
            type: "SERVER_ERROR"
        });
    }
};