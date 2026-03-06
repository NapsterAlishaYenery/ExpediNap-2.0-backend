const TransferOrder = require("../models/transfer-order.model");

const { buildTransferInvoiceTemplate } = require('../templates/emailTemplates');
const { enviarEmail } = require('../services/mail/emailService');

const ncfService = require('../services/ncf.service');

const generarNumeroOrden = () => {
    return `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

exports.createTransferOrder = async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            transferType,
            pickUpLocation,
            destination,
            numPassengers,
            pickUpDate,
            flightNumber,
            arrivalTime
        } = req.body;

        // 1. Validación de fecha
        const selectedDate = new Date(pickUpDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate <= today) {
            return res.status(400).json({
                ok: false,
                message: "Invalid pick-up date. Transfers must be scheduled at least 24 hours in advance.",
                type: "INVALID_DATE"
            });
        }

        const internalOrderNumber = generarNumeroOrden();

        // --- ASIGNACIÓN DE NCF ---
        let datosFiscales;
        try {
            // Usamos B02 por defecto (Consumo)
            datosFiscales = await ncfService.getAndUseNextNcf('B02', internalOrderNumber);
        } catch (ncfErr) {
            return res.status(500).json({
                ok: false,
                message: "Service temporarily unavailable: NCF Pool empty.",
                error: ncfErr.message
            });
        }

        // 2. Crear la orden con datos fiscales
        const nuevaOrden = new TransferOrder({
            orderNumber: internalOrderNumber,
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
            flightNumber: flightNumber || null,
            arrivalTime: arrivalTime || null,
            pricing: {
                totalPrice: 0, // Se mantiene en 0 hasta que cotices
                currency: 'USD'
            },
            status: 'pending',
            fiscalData: datosFiscales // <--- NCF ASIGNADO
        });

        const ordenGuardada = await nuevaOrden.save();

        // 3. Envío de correos
        try {
            // Correo al Cliente
            const emailHtml = buildTransferInvoiceTemplate(ordenGuardada, false);
            await enviarEmail({
                to: email,
                subject: `TRANSFER REQUEST: ${ordenGuardada.orderNumber} - ${transferType.toUpperCase()}`,
                html: emailHtml,
            });

            // Correo al Admin
            const htmlAdmin = buildTransferInvoiceTemplate(ordenGuardada, true);
            await enviarEmail({
                to: process.env.CONTACT_EMAIL_RECEIVER,
                subject: `🚨 NEW ORDER: ${ordenGuardada.orderNumber} from ${fullName}`,
                html: htmlAdmin
            });

        } catch (mailError) {
            console.error("[MAIL-ERROR] Transfer Order Notification:", mailError.message);
        }

        return res.status(201).json({
            ok: true,
            message: 'Transfer request successfully received with NCF',
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
        console.error("Error creating transfer order:", error);
        res.status(500).json({
            ok: false,
            message: "Could not process transfer request",
            type: "SERVER_ERROR"
        });
    }
};



exports.getAllTransferOrders = async (req, res) => {
    try {

        const { customerName, status, orderNumber } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;


        let query = {};


        if (customerName && customerName.trim().length > 0) {
            query['customer.fullName'] = { $regex: customerName, $options: 'i' };
        }


        if (status && status.trim().length > 0) {
            query.status = status;
        }

        if (orderNumber && orderNumber.trim().length > 0) {
            query.orderNumber = { $regex: orderNumber, $options: 'i' };
        }


        const [orders, totalItems] = await Promise.all([
            TransferOrder.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            TransferOrder.countDocuments(query)
        ]);


        if (!orders) {
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


        if (orderUpdated.status === 'confirmed' && orderUpdated.pricing.totalPrice > 0) {
            try {
                const emailHtml = buildTransferInvoiceTemplate(orderUpdated, false);

                await enviarEmail({
                    to: orderUpdated.customer.email,
                    subject: `TRANSFER CONFIRMED: ${orderUpdated.orderNumber} - ${orderUpdated.transferType.toUpperCase()}`,
                    html: emailHtml,
                });

                const emailHtmlAdmin = buildTransferInvoiceTemplate(orderUpdated, true);
                await enviarEmail({
                    to: process.env.CONTACT_EMAIL_RECEIVER,
                    subject: `✅ TRANSFER UPDATED/CONFIRMED: ${orderUpdated.orderNumber}`,
                    html: emailHtmlAdmin
                });

            } catch (mailError) {
                console.error("[MAIL-ERROR] Transfer Order Notification:", mailError.message);
            }
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

        // 1. Verificación de estado (Solo desde la papelera)
        if (order.status !== 'deleted') {
            return res.status(400).json({
                ok: false,
                message: "Only orders with 'deleted' status can be permanently purged",
                type: "BAD_REQUEST"
            });
        }

        // 2. PROTECCIÓN FISCAL: Si ya tiene NCF, no se borra.
        // Aunque el Transfer sea "pending" y cueste 0 ahora mismo, 
        // ya quemó un número de NCF en el Pool al crearse.
        if (order.fiscalData && order.fiscalData.ncf) {
            return res.status(400).json({
                ok: false,
                message: `Fiscal Integrity: This transfer has an assigned NCF (${order.fiscalData.ncf}) and cannot be purged.`,
                type: "FISCAL_PROTECTION_ERROR"
            });
        }

        await TransferOrder.findByIdAndDelete(id);

        return res.status(200).json({
            ok: true,
            message: "Transfer order permanently purged from database",
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
            message: "Transfers Statistics retrieved successfully",
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