const NcfPool = require('../models/NcfPool.model'); // Ajusta la ruta a tu modelo

/**
 * Obtiene el siguiente NCF disponible y lo marca como usado.
 * @param {String} tipoNcf - El tipo de NCF a buscar (B02, B16, B01).
 * @param {String} orderId - El ID de la orden (Excursion, Yates o Transporte).
 * @returns {Object} El objeto fiscalData listo para la orden.
 */
exports.getAndUseNextNcf = async (tipoNcf, orderId) => {
    try {
        // Buscamos el NCF más antiguo disponible de ese tipo
        // Lo marcamos como 'usado' de forma atómica
        const ncfAsignado = await NcfPool.findOneAndUpdate(
            { 
                estado: 'available', 
                tipoNcf: tipoNcf 
            },
            { 
                estado: 'used',
                orderId: orderId,
                usadoEn: new Date()
            },
            { 
                new: true, 
                sort: { createdAt: 1 } // FIFO: First In, First Out
            }
        );

        if (!ncfAsignado) {
            throw new Error(`No hay NCF tipo ${tipoNcf} disponibles en el pool.`);
        }

        // Retornamos el formato exacto que espera tu sub-schema fiscalData
        return {
            ncf: ncfAsignado.ncf,
            ncfVencimiento: ncfAsignado.fechaVencimiento,
            tipoNcf: ncfAsignado.tipoNcf
        };
        
    } catch (error) {
        console.error("[NCF-SERVICE-ERROR]:", error.message);
        throw error;
    }
};