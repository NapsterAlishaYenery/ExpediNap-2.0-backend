const YachtOrder = require("../models/yacht-order.model");
const Yacht = require("../models/yachts.model"); 

   
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

        const yachtData = await Yacht.findById(yachtId);
        if (!yachtData) {
            return res.status(404).json({
                ok: false,
                message: "Selected yacht not found",
                type: "NOT_FOUND"
            });
        }

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

        }
        else if (destination === 'River Sunset' && yachtData.riverSunset) {
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

        const nuevaOrden = new YachtOrder({
            orderNumber: generarNumeroOrden(),
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
            status: 'pending'
        });

        const ordenGuardada = await nuevaOrden.save();

        return res.status(201).json({
            ok: true,
            message: 'Yacht booking request successfully received',
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

        if (!orders || orders.length === 0) {
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

        if (order.status !== 'deleted') {
            return res.status(400).json({
                ok: false,
                message: "Only orders with 'deleted' status can be permanently purged",
                type: "BAD_REQUEST"

            });
        }
        await YachtOrder.findByIdAndDelete(id);
        return res.status(200).json({
            ok: true,
            message: "Order permanently purged",
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