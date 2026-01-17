const { Schema, model } = require('mongoose');
const priceValidator = require('../utils/price.validator');
const ImagesSchema = require('./schema/images.schema');
const stringArrayValidator = require('../utils/string-array.validator');


const ExcursionsSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name of excursion is required'],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: [true, 'Description of excursion is required'],
        trim: true
    },
    regularPriceUsd: {
        type: Number,
        required: [true, 'Regular Price is required'],
        min: [1.0, 'Price must be greater than 0'],
        max: [1000000, 'Price cannot exceed 1,000,000'],
        validate: priceValidator
    },
    offerPriceUsd: {
        type: Number,
        required: [true, 'Offer Price is required'],
        min: [1.0, 'Price must be greater than 0'],
        max: [1000000, 'Price cannot exceed 1,000,000'],
        validate: priceValidator
    },
    childPriceUsd: {
        type: Number,
        required: [true, 'Child Price is required'],
        min: [0, 'Price cannot be negative'], 
        validate: priceValidator
    },
    location: {
        type: String,
        required: [true, 'Location of excursion is required'],
        trim: true
    },
    categories: {
        type: [String],
        required: [true, 'At least one category is required'],
        validate: stringArrayValidator()

    },
    duration: {
        time: {
            type: Number,
            required: [true, 'Duration time is required'],
            min: [1, 'Duration time must be at least 1']
        },

        unit: {
            type: String,
            required: [true, 'Duration unit is required'],
            lowercase: true,
            trim: true,
            enum: {
                values: ['hour', 'hours', 'day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years'],
                message: 'Invalid duration unit'
            }
        }
    },
    includes: {
        type: [String],
        required: [true, 'At least one benefits must be added'],
        validate: stringArrayValidator()
    },
    minimumAge: {
        type: Number,
        min: [0, 'Minimum age cannot be negative'],
        max: [120, 'Invalid minimum age'],
        required: true
    },
    itinerary: {
        type: String,
        required: [true, 'Itinerary of excursion is required'],
        trim: true
    },
    recommendations: {
        type: [String],
        required: [true, 'At least one recommendations must be added'],
        validate: stringArrayValidator()
    },
    startingPoint: {
        type: String,
        required: [true, 'Starting Point of excursion is required'],
        trim: true
    },
    pickupTime: {
        type: String,
        required: [true, 'PickUp Time of excursion is required'],
        trim: true
    },
    images: {
        type: ImagesSchema,
        required: [true, 'Main Image of excursion is required']
    },
}, { 
    versionKey: false,
    timestamps: true 
}
);


ExcursionsSchema.pre('validate', function () {
    if (this.offerPriceUsd >= this.regularPriceUsd) {
        this.invalidate(
            'offerPriceUsd',
            'Offer price must be lower than regular price'
        );
    }
});

module.exports = model("excursions", ExcursionsSchema);