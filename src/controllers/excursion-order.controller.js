const ExcursionOrder = require("../models/excursion-order.model");
const Excursion = require("../models/excursion.model");

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

        const excursionData = await Excursion.findById(excursionId);


        if (!excursionData) {
            return res.status(404).json({
                ok: false,
                message: "Selected excursion not found",
                type: "NOT_FOUND"
            });
        }

        const adultPriceSnap = excursionData.offerPriceUsd;
        const childPriceSnap = excursionData.childPriceUsd || 0;

        const totalAdults = adults * adultPriceSnap;
        const totalChildren = (children || 0) * childPriceSnap;
        const totalPrice = Number((totalAdults + totalChildren).toFixed(2));

        const nuevaOrden = new ExcursionOrder({
            orderNumber: generarNumeroOrdenEx(),
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
                totalPrice,
                currency: 'USD'
            },
            status: 'pending'
        });

        const ordenGuardada = await nuevaOrden.save();

        return res.status(201).json({
            ok: true,
            message: 'Excursion booking request received successfully',
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
            message: "Internal server error",
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