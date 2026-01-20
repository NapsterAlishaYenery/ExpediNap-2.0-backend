const TransferOrder = require("../models/transfer-order.model");

const generarNumeroOrden = () => {
    return `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

exports.createTransferOrder = async (req, res) => {
    try {
        // Desestructuramos lo que viene del formulario de la web
        const {
            fullName,
            email,
            phone,
            transferType,
            pickUpLocation,
            destination,
            numPassengers,
            pickUpDate, // Viene unificado del Front (Día + Hora)
        } = req.body;

        // 1. Mapeamos al Schema con el subdocumento 'customer'
        const nuevaOrden = new TransferOrder({
            orderNumber: generarNumeroOrden(),
            customer: {
                fullName,
                email,
                phone
            },
            transferType,
            pickUpLocation,
            destination,
            numPassengers,
            pickUpDate,
            // Valores por defecto para administración
            // CAMBIO AQUÍ: Ahora es un objeto
            pricing: {
                totalPrice: 0,
                currency: 'USD'
            },
            status: 'pending'
        });

        // 2. Guardamos en la base de datos
        const ordenGuardada = await nuevaOrden.save();

        // 3. Respuesta al Frontend
        return res.status(201).json({
            ok: true,
            message: 'Transfer request successfully received',
            data: ordenGuardada
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const firstError = Object.values(error.errors)[0].message;
            return res.status(400).json({
                ok: false,
                message: firstError,
                type: "VALIDATION_ERROR"
            });
        }
        res.status(500).json({
            ok: false,
            message: "Could not process transfer request",
            type: "SERVER_ERROR"
        });
    }
};

exports.getAllTransferOrders = async (req, res) => {
    try {
        // 1. CAPTURAR PARÁMETROS
        const { customerName, status, orderNumber } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        // 2. FILTROS DINÁMICOS
        let query = {};

        // Búsqueda por Nombre del Cliente
        if (customerName && customerName.trim().length > 0) {
            query['customer.fullName'] = { $regex: customerName, $options: 'i' };
        }

        // Búsqueda por Estado
        if (status && status.trim().length > 0) {
            query.status = status;
        }

        // Búsqueda por Número de Orden (TR-XXXX)
        // Usamos regex también por si el admin solo pega una parte del código
        if (orderNumber && orderNumber.trim().length > 0) {
            query.orderNumber = { $regex: orderNumber, $options: 'i' };
        }

        // 3. EJECUCIÓN CONCURRENTE
        const [orders, totalItems] = await Promise.all([
            TransferOrder.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            TransferOrder.countDocuments(query)
        ]);

        // 4. VALIDACIÓN DE EXISTENCIA
        if (!orders || orders.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "No transfer orders found",
                type: "NOT_FOUND"
            });
        }

        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            ok: true,
            message: "Orders retrieved successfully",
            data: orders,
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
        res.status(500).json({
            ok: false,
            message: "Error retrieving orders",
            type: "SERVER_ERROR"
        });
    }
};

exports.getTransferOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await TransferOrder.findById(id);

        if (!order) {
            return res.status(404).json({
                ok: false,
                message: "Transfer order not found",
                type: "NOT_FOUND"
            });
        }

        return res.status(200).json({
            ok: true,
            message: "Order retrieved successfully",
            data: order
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error retrieving order",
            type: "SERVER_ERROR"
        });
    }
};

exports.updateTransferOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const orderUpdated = await TransferOrder.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!orderUpdated) {
            return res.status(404).json({
                ok: false,
                message: "Order not found",
                type: "NOT_FOUND"
            });
        }

        return res.status(200).json({
            ok: true,
            message: "Order updated successfully",
            data: orderUpdated
        });

    } catch (error) {

        if (error.name === 'ValidationError') {
            const firstError = Object.values(error.errors)[0].message;
            return res.status(400).json({
                ok: false,
                message: firstError,
                type: "VALIDATION_ERROR"
            });
        }

        res.status(500).json({
            ok: false,
            message: "Error updating order",
            type: "SERVER_ERROR"
        });
    }
};

exports.deleteTransferOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const orderSoftDeleted = await TransferOrder.findByIdAndUpdate(
            id,
            { status: 'deleted' },
            { new: true }
        );

        if (!orderSoftDeleted) {
            return res.status(404).json({
                ok: false,
                message: "Order not found",
                type: "NOT_FOUND"
            });
        }

        return res.status(200).json({
            ok: true,
            message: "Order moved to trash (Soft Delete)",
            data: orderSoftDeleted
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error processing soft delete",
            type: "SERVER_ERROR"
        });
    }
};

exports.purgeTransferOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await TransferOrder.findById(id);

        if (!order) {
            return res.status(404).json({
                ok: false,
                message: "Order not found",
                type: "NOT_FOUND"
            });
        }

        if (order.status !== 'deleted') {
            return res.status(400).json({
                ok: false,
                message: "Only orders with 'deleted' status can be permanently purged",
                type: "BAD_REQUEST"
            });
        }

        
        await TransferOrder.findByIdAndDelete(id);

        return res.status(200).json({
            ok: true,
            message: "Order permanently purged from database",
            data: order
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error purging order",
            type: "SERVER_ERROR"
        });
    }
};

exports.getTransferStats = async (req, res) => {
    try {
        const stats = await TransferOrder.aggregate([
            {
                $facet: {
                    "byStatus": [
                        {
                            $group: {
                                _id: "$status",
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    "financials": [
                        {
                            $match: { status: { $in: ['confirmed', 'paid', 'completed'] } }
                        },
                        {
                            $group: {
                                _id: null,
                                totalRevenue: { $sum: "$pricing.totalPrice" },
                                avgPrice: { $avg: "$pricing.totalPrice" }
                            }
                        }
                    ],
                    "totalActive": [
                        {
                            $match: { status: { $ne: 'deleted' } }
                        },
                        {
                            $count: "count"
                        }
                    ]
                }
            }
        ]);

        const formattedStats = {
            totalOrders: stats[0].totalActive[0]?.count || 0,
            revenue: stats[0].financials[0]?.totalRevenue || 0,
            averageTicket: stats[0].financials[0]?.avgPrice || 0,
            statusCount: stats[0].byStatus.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, { 
                pending: 0, 
                confirmed: 0, 
                paid: 0, 
                completed: 0, 
                cancelled: 0, 
                deleted: 0 
            })
        };

        return res.status(200).json({
            ok: true,
            message: "Statistics retrieved successfully",
            data: formattedStats
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error retrieving statistics",
            type: "SERVER_ERROR"
        });
    }
};