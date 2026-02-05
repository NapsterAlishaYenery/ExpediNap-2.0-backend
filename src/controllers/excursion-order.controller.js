const ExcursionOrder = require("../models/excursion-order.model");
const Excursion = require("../models/excursion.model");

const { enviarEmail } = require('../services/mail/emailService');
const { buildExcursionInvoiceTemplate } = require('../templates/emailTemplates');

const paypalService = require('../services/paypal/paypal.service');

const generarNumeroOrdenEx = () => {
    return `EX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

exports.createExcursionOrder = async (req, res) => {
    try {
        const {
            excursionId,
            fullName,
            email,
            phone,
            adults,
            children,
            travelDate,
            hotelName,
            hotelNumber
        } = req.body;

        // --- VALIDACIÓN DE FECHA (SEGURIDAD BACKEND) ---
        const selectedDate = new Date(travelDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate <= today) {
            return res.status(400).json({
                ok: false,
                message: "Invalid travel date. Bookings must be made at least 24 hours in advance.",
                type: "INVALID_DATE"
            });
        }

        const excursionData = await Excursion.findById(excursionId);


        if (!excursionData) {
            return res.status(404).json({
                ok: false,
                message: "Selected excursion not found",
                type: "NOT_FOUND"
            });
        }

        // --- CÁLCULO DE PRECIOS ---
        const adultPriceSnap = excursionData.offerPriceUsd;
        const childPriceSnap = excursionData.childPriceUsd || 0;

        const totalAdults = adults * adultPriceSnap;
        const totalChildren = (children || 0) * childPriceSnap;
        const totalPrice = Number((totalAdults + totalChildren).toFixed(2));


        const taxRate = 0.18;
        const taxAmount = Number((totalPrice * taxRate).toFixed(2));
        const finalTotalPrice = Number((totalPrice + taxAmount).toFixed(2));

        const internalOrderNumber = generarNumeroOrdenEx();

        // --- LLAMADA AL NUEVO SERVICIO PAYPAL---
        const paypalOrder = await paypalService.createPayPalOrder(finalTotalPrice, {
            fullName,
            email,
            phone
        });


        const nuevaOrden = new ExcursionOrder({
            orderNumber: internalOrderNumber,
            customer: { fullName, email, phone },
            hotelName: hotelName || "Pick-up to be coordinated / Airbnb",
            hotelNumber: hotelNumber || "N/A",
            excursionId: excursionData._id,
            excursionName: excursionData.name,
            location: excursionData.location,
            pax: {
                adults,
                children: children || 0
            },
            travelDate,
            pricing: {
                adultPriceSnap,
                childPriceSnap,
                subtotal: Number(totalPrice.toFixed(2)),
                tax: taxAmount,
                totalPrice: finalTotalPrice,
                currency: 'USD'
            },
            paypalOrderId: paypalOrder.id,
            status: 'pending'
        });


        const ordenGuardada = await nuevaOrden.save();


        return res.status(201).json({
            ok: true,
            message: 'Excursion booking request received successfully',
            data: ordenGuardada, 
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
            message: "Internal server error",
            type: "SERVER_ERROR"
        });
    }
};

exports.captureExcursionPayment = async (req, res) => {
    try {
        const { orderId } = req.params; 

       
        const captureData = await paypalService.capturePayPalOrder(orderId);

        if (captureData.status === 'COMPLETED') {
            const order = await ExcursionOrder.findOneAndUpdate(
                { paypalOrderId: orderId },
                { status: 'paid' },
                { new: true }
            );

            if (!order) {
                return res.status(404).json({
                    ok: false,
                    message: "Order not found",
                    type: "NOT_FOUND_ERROR"
                });
            }

            try {
                const emailHtmlClient = buildExcursionInvoiceTemplate(order, false);
                await enviarEmail({
                    to: order.customer.email,
                    subject: `Booking Paid: ${order.orderNumber} - ${order.excursionName.toUpperCase()}`,
                    html: emailHtmlClient
                });

               
                const emailHtmlAdmin = buildExcursionInvoiceTemplate(order, true);
                await enviarEmail({
                    to: process.env.CONTACT_EMAIL_RECEIVER,
                    subject: `💰 NEW SALE: ${order.orderNumber} - ${order.customer.fullName}`,
                    html: emailHtmlAdmin
                });
            } catch (mailErr) {
                console.error("[MAIL-ERROR] Excursion Order Notification:", mailErr.message);
            }

            return res.status(200).json({
                ok: true,
                message: "Payment successful",
                data: order
            });
        }

        res.status(400).json({
            ok: false,
            message: "Payment not completed",
            type: "PAYMENT_ERROR"
        });

    } catch (error) {

        if (error.statusCode === 422 || (error._originalError && error._originalError.statusCode === 422)) {
            console.warn("⚠️ Pago rechazado por PayPal (Falta de fondos o tarjeta inválida)");
            return res.status(400).json({
                ok: false,
                message: "Your card was declined. Please try another payment method.",
                type: "PAYMENT_DECLINED"
            });
        }

        console.error("Capture Error:", error);
        res.status(500).json({
            ok: false,
            message: "Error capturing payment",
            type: "SERVER_ERROR"
        });
    }
};




exports.getAllExcursionOrders = async (req, res) => {

    try {
        const { customerName, status, orderNumber, excursionName } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;

        let query = {};

        if (customerName && customerName.trim().length > 0) {
            query['customer.fullName'] = { $regex: customerName, $options: 'i' };
        }

        if (orderNumber && orderNumber.trim().length) {
            query.orderNumber = { $regex: orderNumber, $options: 'i' };
        }


        if (excursionName && excursionName.trim().length) {
            query.excursionName = { $regex: excursionName, $options: 'i' };
        }

        if (status && status.trim().length > 0) {
            query.status = status;
        }

        const [orders, totalItems] = await Promise.all([
            ExcursionOrder.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            ExcursionOrder.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            ok: true,
            data: orders,
            message: "Excursion orders retrieved successfully",
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

exports.getExcursionOrderById = async (req, res) => {

    try {

        const { id } = req.params;

        const order = await ExcursionOrder.findById(id);

        if (!order) {
            return res.status(404).json({
                ok: false,
                message: "Order not found",
                type: "NOT_FOUND"
            });
        }
        res.status(200).json({
            ok: true,
            message: "Order retrieved successfully",
            data: order
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            message: "Server Error",
            type: "SERVER_ERROR"
        });
    }
};

exports.updateExcursionOrder = async (req, res) => {
    try {

        const { id } = req.params;
        const updateData = req.body;

        const orderUpdated = await ExcursionOrder.findByIdAndUpdate(
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

        // SOLO ENVIAR SI LA ORDEN ESTÁ PAGADA (Para no molestar en borradores)
        if (orderUpdated.status === 'paid') {
            try {
                const emailHtml = buildExcursionInvoiceTemplate(orderUpdated, false);
                await enviarEmail({
                    to: orderUpdated.customer.email,
                    bcc: process.env.CONTACT_EMAIL_RECEIVER,
                    subject: `UPDATED BOOKING: ${orderUpdated.orderNumber}`,
                    html: emailHtml
                });
            } catch (mailErr) {
                console.error("❌ Error enviando actualización de excursión:", mailErr);
            }
        }
        
        res.status(200).json({
            ok: true,
            data: orderUpdated,
            message: "Order updated"
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

exports.deleteExcursionOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await ExcursionOrder.findByIdAndUpdate(
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

        res.status(200).json({
            ok: true,
            message: "Order moved to trash",
            data: order
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            message: "Error deleting",
            type: "SERVER_ERROR"
        });
    }
};

exports.purgeExcursionOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await ExcursionOrder.findById(id);

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

        await ExcursionOrder.findByIdAndDelete(id);

        return res.status(200).json({
            ok: true,
            message: "Excursion order permanently purged from database",
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

exports.getExcursionStats = async (req, res) => {
    try {
        const stats = await ExcursionOrder.aggregate([
            {
                $facet: {
                    "byStatus": [{ $group: { _id: "$status", count: { $sum: 1 } } }],
                    "financials": [
                        { $match: { status: { $in: ['confirmed', 'paid', 'completed'] } } },
                        { $group: { _id: null, totalRevenue: { $sum: "$pricing.totalPrice" } } }
                    ],
                    "totalActive": [
                        { $match: { status: { $ne: 'deleted' } } },
                        { $count: "count" }
                    ]
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
            message: "Excursion statistics retrieved successfully",
            data: formattedStats
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error retrieving statistics",
            type: "SERVER_ERROR"
        });
    }
};