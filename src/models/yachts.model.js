const { Schema, model } = require('mongoose');
const integerValidator = require('../utils/integer.validator');
const ImagesSchema = require('./schema/images.schema');
const PricesSchema = require('./schema/prices.schema');
const stringArrayValidator = require('../utils/string-array.validator');
const yachtExtrasIncludesSchemas = require('./schema/yacht-extras-includes.schemas');
const YachtRiverSunsetSchema = require('./schema/yacht-river-sunset.schema');
const slugify = require('slugify');

const YachtsSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    slug: {
        type: String,
        required: [true, 'Slug is required for SEO URLs'],
        unique: true,
        lowercase: true,
        trim: true
    },
    maxPax: {
        type: Number,
        required: [true, 'The maximum capacity (maxPax) is required'],
        min: [1, 'Capacity must be at least 1 person'],
        max: [100, 'Capacity cannot exceed 100 people'],
        validate: integerValidator,
    },
    saonaPrice: {
        type: PricesSchema,
        required: false
    },
    catalinaPrice: {
        type: PricesSchema,
        required: false
    },
    timeAvailable: {
        halfDay: {
            type: [String],
            default: [],
            validate: stringArrayValidator({ allowEmpty: true })
        },
        fullDay: {
            type: String,
            required: [true, 'Full day schedule is required'],
            trim: true
        }
    },
    includes: {
        type: [String],
        required: [true, 'At least one benefits must be added'],
        validate: stringArrayValidator()
    },
    extras: {
        type: [yachtExtrasIncludesSchemas],
        required: false,
        default: []
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    riverSunset: {
        type: YachtRiverSunsetSchema,
        required: false,
        default: () => ({ price: null, timeTrip: null })
    },
    images: {
        type: ImagesSchema,
        required: true
    }
}, {

    versionKey: false,
    timestamps: true
});

YachtsSchema.pre('validate', function (next) {
    if (this.isNew && this.name && !this.slug) {
        const baseSlug = slugify(this.name, { lower: true, strict: true });
        
        // Usamos la fecha actual para el sufijo
        const date = new Date();
        const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        this.slug = `${baseSlug}-${dateString}`;
    }
    next();
});

module.exports = model("yacht", YachtsSchema);