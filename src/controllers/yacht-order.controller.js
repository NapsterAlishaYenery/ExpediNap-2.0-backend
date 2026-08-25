const YachtOrder = require("../models/yacht-order.model");
const Yacht = require("../models/yachts.model");

const { buildYachtInvoiceTemplate } = require('../templates/emailTemplates');
const { enviarEmail } = require('../services/mail/emailService');

const ncfService = require('../services/ncf.service');

const generarNumeroOrden = () => {
    return `YT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

exports.createYachtOrder = async (req, res) => {
    try {
        const {
            yachtId,
            destination,
            duration,
            travelDate,
            fullName,
            email,
            phone,
        } = req.body;

        // 1. VALIDACIÓN DE FECHA
        const selectedDate = new Date(travelDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate <= today) {
            return res.status(400).json({
                ok: false,
                message: "Invalid travel date. Yacht bookings must be made at least 24 hours in advance.",
                type: "INVALID_DATE"
            });
        }

        const yachtData = await Yacht.findById(yachtId);

        if (!yachtData) {
            return res.status(404).json({
                ok: false,
                message: "Selected yacht not found",
                type: "NOT_FOUND"
            });
        }

        // 2. LÓGICA DE PRECIOS
        let basePrice = 0;
        let timeTripSelected = "";

        const destKey = destination === 'Saona Island' ? 'saonaPrice' :
            destination === 'Catalina Island' ? 'catalinaPrice' : null;

        if (destKey && yachtData[destKey]) {
            basePrice = duration === 'Full Day' ? yachtData[destKey].fullDay : yachtData[destKey].halfDay;
            if (duration === 'Full Day') {
                timeTripSelected = yachtData.timeAvailable.fullDay;
            } else {
                timeTripSelected = yachtData.timeAvailable.halfDay.join(' / ');
            }
        } else if (destination === 'River Sunset' && yachtData.riverSunset) {
            basePrice = yachtData.riverSunset.price;
            timeTripSelected = yachtData.riverSunset.timeTrip;
        }

        if (!basePrice || basePrice === 0) {
            return res.status(400).json({
                ok: false,
                message: "Price not available for this destination/duration",
                type: "PRICE_ERROR"
            });
        }

        const tax = Number((basePrice * 0.18).toFixed(2));
        const totalPrice = Number((basePrice + tax).toFixed(2));

        // 3. ASIGNACIÓN DE NCF
        const internalOrderNumber = generarNumeroOrden();
        let datosFiscales;

        try {
            // Asignamos B02 (Consumo) por defecto
            datosFiscales = await ncfService.getAndUseNextNcf('B02', internalOrderNumber);
        } catch (ncfErr) {
            return res.status(500).json({
                ok: false,
                message: "NCF Error: No sequence numbers available.",
                error: ncfErr.message
            });
        }

        // 4. CREAR LA ORDEN CON LOS DATOS FISCALES
        const nuevaOrden = new YachtOrder({
            orderNumber: internalOrderNumber,
            customer: { fullName, email, phone },
            yachtId: yachtData._id,
            yachtName: yachtData.name,
            destination,
            duration,
            timeTrip: timeTripSelected,
            travelDate,
            pricing: {
                basePrice,
                tax,
                totalPrice,
                currency: 'USD'
            },
            status: 'pending',
            fiscalData: datosFiscales // <--- NCF ASIGNADO
        });

        const ordenGuardada = await nuevaOrden.save();

        // 5. ENVÍO DE CORREOS (Usando el template con la caja fiscal)
        try {
            const emailHtmlClient = buildYachtInvoiceTemplate(ordenGuardada, false);
            await enviarEmail({
                to: email,
                subject: `YACHT BOOKING REQUEST: ${ordenGuardada.orderNumber} - ${ordenGuardada.yachtName.toUpperCase()}`,
                html: emailHtmlClient,
            });

            const emailHtmlAdmin = buildYachtInvoiceTemplate(ordenGuardada, true);
            await enviarEmail({
                to: process.env.CONTACT_EMAIL_RECEIVER,
                subject: `✅ NEW YACHT REQUEST: ${ordenGuardada.orderNumber} - ${ordenGuardada.customer.fullName}`,
                html: emailHtmlAdmin
            });
        } catch (mailError) {
            console.error("[MAIL-ERROR] Yacht Order Notification:", mailError.message);
        }

        return res.status(201).json({
            ok: true,
            message: 'Yacht booking request successfully received with NCF',
            data: ordenGuardada
        });

    } catch (error) {
        console.error("[CREATE-YACHT-ORDER-ERROR]:", error);
        if (error.name === 'ValidationError') {
            const firstError = Object.values(error.errors)[0].message;
            return res.status(400).json({
                ok: false, message: firstError, type: "VALIDATION_ERROR"
            });
        }
        res.status(500).json({
            ok: false, message: "Internal server error", type: "SERVER_ERROR"
        });
    }
};

exports.getAllYachtOrders = async (req, res) => {
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
            YachtOrder.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            YachtOrder.countDocuments(query)
        ]);

        if (!orders) {
            return res.status(404).json({
                ok: false,
                message: "No yacht orders found.",
                type: "NOT_FOUND"
            });
        }

        const totalPages = Math.ceil(totalItems / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return res.status(200).json({
            ok: true,
            data: orders,
            message: "Yacht orders retrieved successfully",
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNextPage,
                hasPrevPage
            }
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error retrieving orders from server",
            type: "SERVER_ERROR"
        });
    }
};

exports.getYachtOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await YachtOrder.findById(id)

        if (!order) {
            return res.status(404).json({
                ok: false,
                message: "Order not found",
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

exports.updateYachtOrder = async (req, res) => {
    try {

        const { id } = req.params;
        const updateData = req.body;

        const orderUpdated = await YachtOrder.findByIdAndUpdate(
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

        if (orderUpdated.isAvailable && orderUpdated.status === 'confirmed') {
            try {
                // 1. Correo para el Cliente
                const emailHtmlClient = buildYachtInvoiceTemplate(orderUpdated, false);
                await enviarEmail({
                    to: orderUpdated.customer.email,
                    subject: `YACHT CONFIRMED: ${orderUpdated.orderNumber} - ${orderUpdated.yachtName.toUpperCase()}`,
                    html: emailHtmlClient,
                });

                // 2. Correo para el Admin 
                const emailHtmlAdmin = buildYachtInvoiceTemplate(orderUpdated, true);
                await enviarEmail({
                    to: process.env.CONTACT_EMAIL_RECEIVER,
                    subject: `🚨 YACHT UPDATED: ${orderUpdated.orderNumber} - ${orderUpdated.customer.fullName}`,
                    html: emailHtmlAdmin
                });
                
            } catch (mailError) {
                console.error("[MAIL-ERROR] Yacht Confirmation:", mailError.message);;
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

exports.deleteYachtOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await YachtOrder.findByIdAndUpdate(
            id,
            { status: 'deleted' },
            { new: true }
        );
        if (!order) {
            return res.status(404).json({
                ok: false,
                message: "Order not found",
                type: "NOT_FOUND"
            });
        }

        return res.status(200).json({
            ok: true,
            message: "Order moved to trash",
            data: order
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error during soft delete",
            type: "SERVER_ERROR"
        });
    }
};

exports.purgeYachtOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await YachtOrder.findById(id);

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

        // 2. PROTECCIÓN FISCAL: Si tiene NCF, no se puede purgar.
        // En Yates es vital porque el NCF ya tiene asociado un ITBIS (18%) y un monto.
        if (order.fiscalData && order.fiscalData.ncf) {
            return res.status(400).json({
                ok: false,
                message: `This yacht order contains fiscal data (NCF: ${order.fiscalData.ncf}) and cannot be purged for auditing purposes.`,
                type: "FISCAL_PROTECTION_ERROR"
            });
        }

        await YachtOrder.findByIdAndDelete(id);

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

exports.getYachtStats = async (req, res) => {
    try {

        const stats = await YachtOrder.aggregate([
            {
                $facet: {
                    "byStatus": [{ $group: { _id: "$status", count: { $sum: 1 } } }],

                    "financials": [
                        { $match: { status: { $in: ['confirmed', 'paid', 'completed'] } } },
                        { $group: { _id: null, totalRevenue: { $sum: "$pricing.totalPrice" } } }
                    ],
                    "totalActive": [
                        { $match: { status: { $ne: 'deleted' } } },
                        { $count: "count" }]
                }
            }
        ]);

        const formattedStats = {
            totalOrders: stats[0].totalActive[0]?.count || 0,
            revenue: stats[0].financials[0]?.totalRevenue || 0,
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
            message: "Yacht statistics retrieved successfully",
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