const Yachts = require('../models/yachts.model');

exports.createYatch = async (req, res) => {

    const {
        name,
        maxPax,
        saonaPrice,
        catalinaPrice,
        timeAvailable,
        includes,
        extras,
        description,
        riverSunset,
        images
    } = req.body;

    try {
        const newYatch = await Yachts.create({
            name,
            maxPax,
            saonaPrice,
            catalinaPrice,
            timeAvailable,
            includes,
            extras,
            description,
            riverSunset,
            images
        });

        res.status(201).json({
            ok: true,
            data: newYatch,
            message: 'New Yacht Added sussesfull'
        });

    } catch (error) {

        if (error.name === 'ValidationError') {
            const message = Object.values(error.errors).map(val => val.message).join(', ');
            return res.status(400).json({
                ok: false,
                type: 'ValidationError',
                message: 'One or more fields are invalid',
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                type: 'DuplicateError',
                message: `The name "${name}" already exists. Please choose another.`
            });
        }

        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server'
        });
    }
}

exports.upDateYatch = async (req, res) => {

    const { id } = req.params;
    const updates = req.body;
    try {

        const updateYatch = await Yachts.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updateYatch) {
            return res.status(404).json({
                ok: false,
                type: 'NotFound',
                message: 'Yacht not found'
            });
        }

        res.status(200).json({
            ok: true,
            data: updateYatch,
            message: 'Yacht updated'
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                ok: false,
                type: "DuplicateError",
                message: `The name already exists. Please choose another.`
            });
        }

        if (error.name === "ValidationError") {
            const firstError = Object.values(error.errors)[0].message;
            return res.status(400).json({
                ok: false,
                type: "ValidationError",
                message: firstError
            });
        }

        res.status(500).json({
            ok: false,
            type: "ServerError",
            message: "Internal server error"
        });
    }
}

exports.deleteYatch = async (req, res) => {

    const { id } = req.params;

    try {

        const deleteYatch = await Yachts.findByIdAndDelete(id);

        if (!deleteYatch) {
            return res.status(404).json({
                ok: false,
                type: 'NotFound',
                message: 'Yacht not found'
            });
        }

        res.status(200).json({
            ok: true,
            data: deleteYatch,
            message: 'Yacht deleted successfully'
        });


    } catch (error) {
        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Internal server error'
        });
    }
};

exports.getAllYatch = async (req, res) => {

    try {

        const { name, sortBy, order } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;


        let query = {};

        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }

        let sortOptions = { createdAt: -1 };

        if (sortBy === 'saona' || sortBy === 'saonaPrice') {

            const direction = parseInt(order) || 1;
            sortOptions = { 'saonaPrice.fullDay': direction };
        }
        else if (sortBy === 'catalina' || sortBy === 'catalinaPrice') {

            const direction = parseInt(order) || 1;
            sortOptions = { 'catalinaPrice.fullDay': direction };
        }

        const skip = (page - 1) * limit;

        const [allYatchs, totalItems] = await Promise.all([
            Yachts.find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(limit),
            Yachts.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalItems / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return res.status(200).json({
            ok: true,
            data: allYatchs,
            message: totalItems > 0 ? 'Yachts retrieved successfully.' : 'No yachts found.',
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
            type: 'ServerError',
            message: 'A critical error occurred on the server while fetching yachts.',
        });
    }
}

exports.getYatchByID = async (req, res) => {
    const { id } = req.params;
    try {

        const yatch = await Yachts.findById(id);

        if (!yatch) {
            return res.status(404).json({
                ok: false,
                type: 'NotFoundError',
                message: 'The requested yacht does not exist.'
            });
        }

        return res.status(200).json({
            ok: true,
            data: yatch,
            message: 'Yacht retrieved successfully.'
        });

    } catch (error) {

        return res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'A critical error occurred on the server.',
        });
    }
}

exports.getYachtsSimpleList = async (req, res) => {
    try {
        const list = await Yachts.find()
            .select('_id name ')
            .sort({ name: 1 });

        return res.status(200).json({
            ok: true,
            data: list,
            message: 'name list'
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            type: 'ServerError',
            message: 'Error retrieving yacht list.'
        });
    }
};