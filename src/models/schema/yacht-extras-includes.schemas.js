const { Schema } = require('mongoose');
const priceValidator = require('../../utils/price.validator');

const yachtExtrasIncludesSchemas = new Schema({
    type: {
        type: String,
        required: true,
        trim: true
    },
    available: {
        type: Boolean,
        required: true,
    },
    included: {
        type: Boolean,
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: [true, 'Offer Price is required'],
        min: [0, 'Price must be greater negative numbers'],
        max: [1000000, 'Price cannot exceed 1,000,000'],
        validate: priceValidator
    }
}, { _id: false }

);

module.exports = yachtExtrasIncludesSchemas;