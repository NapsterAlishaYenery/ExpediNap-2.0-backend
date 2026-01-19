
const Reviews = require('../models/review.model');

exports.createReview = async (req, res) => {

    const {
        client,
        city,
        selectedExcursion,
        selectedYacht,
        rating,
        comment
    } = req.body;

    try {
        const newReview = await Reviews.create({
            client,
            city,
            selectedExcursion,
            selectedYacht,
            rating,
            comment
        });
        res.status(201).json({
            ok: true,
            data: newReview,
            message: 'New Review Added successfully'
        });

    } catch (error) {

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'One or more fields are invalid',
            });
        }

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server'
        });
    }
}

exports.updateReview = async (req, res) => {

    const { id } = req.params;
    const upDate = req.body;

    try {

        const upDateReview = await Reviews.findByIdAndUpdate(
            id,
            { $set: upDate },
            { new: true, runValidators: true }
        );


        if (!upDateReview) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'Error: The review does not exist.',
            });
        }

        res.status(200).json({
            ok: true,
            data: upDateReview,
            message: 'Review updated correctly'
        });

    } catch (error) {

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'One or more fields are invalid',
            });
        }

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server'
        });
    }
}

exports.deleteReview = async (req, res) => {
    const { id } = req.params;

    try {
        const deleteReview = await Reviews.findByIdAndUpdate(
            id,
            { $set: { status: 'deleted' } },
            { new: true }
        );

        if (!deleteReview) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'Error: The review you are trying to delete does not exist.',
            });
        }

        res.status(200).json({
            ok: true,
            data: deleteReview,
            message: 'Review deleted successfully'

        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred while deleting.',
        });
    }
};

exports.purgeReview = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedReview = await Reviews.findByIdAndDelete(id);

        if (!deletedReview) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'Error: The review you are trying to permanently delete does not exist.',
            });
        }

        res.status(200).json({
            ok: true,
            data: deletedReview,
            message: 'Review permanently removed from the database.'
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred while purging the review.',
        });
    }
};

exports.getApprovedReviews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 16;
        const skip = (page - 1) * limit;

        let query = { status: 'approved' };

        const [reviews, totalItems] = await Promise.all([
            Reviews.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Reviews.countDocuments(query)
        ]);


        const totalPages = Math.ceil(totalItems / limit);

        return res.status(200).json({
            ok: true,
            data: reviews,
            message: 'Reviews retrieved successfully.',
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
            type: 'ServerError',
            message: 'An error occurred while fetching reviews.',
        });
    }
};

exports.getAllReviewsAdmin = async (req, res) => {
    try {
        const { status, email, fullName } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = {};


        if (status) {
            query.status = status;
        } else {
            query.status = { $ne: 'deleted' };
        }

        if (email) {
            query['client.email'] = { $regex: email, $options: 'i' };
        }

        if (fullName) {
            query['client.fullName'] = { $regex: fullName, $options: 'i' };
        }

        const [reviews, totalItems] = await Promise.all([
            Reviews.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Reviews.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalItems / limit);


        return res.status(200).json({
            ok: true,
            data: reviews,
            message: 'Admin: Reviews list retrieved.',
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
            type: 'ServerError',
            message: 'A critical error occurred while fetching reviews for admin.',
        });
    }
};

exports.getReviewStats = async (req, res) => {
    try {

        const stats = await Reviews.aggregate([
            {
                $match: { status: 'approved' }
            },
            {
                $facet: {
                    "ratingSummary": [
                        {
                            $group: {
                                _id: null,
                                avgRating: { $avg: "$rating" },
                                totalReviews: { $sum: 1 }
                            }
                        }
                    ],
                    "starsBreakdown": [
                        { $group: { _id: "$rating", count: { $sum: 1 } } },
                        { $sort: { _id: -1 } }
                    ]
                }
            }
        ]);

        const result = {
            average: stats[0].ratingSummary[0]?.avgRating?.toFixed(1) || 0,
            total: stats[0].ratingSummary[0]?.totalReviews || 0,
            breakdown: stats[0].starsBreakdown
        };

        res.status(200).json({
            ok: true,
            data: result,
            message: 'Public stats retrieved successfully'
        });

    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error al obtener estadísticas' });
    }
};