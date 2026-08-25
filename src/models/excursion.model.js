const { Schema, model } = require('mongoose');
const priceValidator = require('../utils/price.validator');
const { ImagesSchema } = require('./schema/images.schema');
const stringArrayValidator = require('../utils/string-array.validator');
const slugify = require('slugify');

const ExcursionsSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name of excursion is required'],
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
    shortDescription: {
        type: String,
        required: [true, 'Short description is required'],
        trim: true,
        maxlength: [200, 'Short description must be less than 200 characters']
    },
    longDescription: {
        type: String,
        required: [true, 'Long description is required'],
        trim: true
    },
    pricing: {
        adultPrice: {
            type: Number,
            required: [true, 'Adult price is required'],
            min: [0, 'Price cannot be negative'],
            validate: priceValidator
        },
        childPrice: {
            type: Number,
            required: [true, 'Child price is required'],
            min: [0, 'Price cannot be negative'],
            validate: priceValidator
        },
        infantPrice: {
            type: Number,
            default: 0,
            min: [0, 'Price cannot be negative'],
            validate: priceValidator
        },
        //  Solo para mostrar "Paga 3 días antes" o similar
        paymentTerms: {
            type: String,
            trim: true,
            enum: ['full', 'deposit', 'pay_later'],
            default: 'full'
        },
        depositPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        ageRanges: {
            adult: { type: Number, min: 13, max: 99 },
            child: { type: Number, min: 3, max: 12 },
            infant: { type: Number, min: 0, max: 2 }
        },
    },
    location: {
        locationName: {
            type: String,
            required: [true, 'Location name is required'],
            trim: true
        },
        coordinates: {
            lat: Number,
            lng: Number
        },
        //  Para "Punta Cana | 12h" en el card
        displayName: {
            type: String,
            trim: true
        }
    },
    categories: {
        type: [String],
        required: [true, 'At least one category is required'],
        validate: stringArrayValidator()
    },
    duration: {
        value: {
            type: Number,
            required: [true, 'Duration value is required'],
            min: [1, 'Duration must be at least 1']
        },
        unit: {
            type: String,
            required: [true, 'Duration unit is required'],
            lowercase: true,
            enum: ['hour', 'hours', 'day', 'days', 'half_day']
        }
    },
    inclusions: {
        included: {
            type: [String],
            required: [true, 'At least one inclusion is required'],
            validate: stringArrayValidator()
        },
        notIncluded: {
            type: [String],
            default: []
        }
    },
    minimumAge: {
        type: Number,
        min: [0, 'Minimum age cannot be negative'],
        max: [120, 'Invalid minimum age'],
        required: true
    },
    itinerary: [{
        titleItinerary: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true,
            trim: true
        },
        //  Orden para mostrar con puntos y flechas
        order: {
            type: Number,
            default: 0
        },
        icon: {
            type: String,
            default: 'bi-check-circle'
        }
    }],
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
    pickupInfo: {
        included: {
            type: Boolean,
            default: true
        },
        details: {
            type: String,
            required: [true, 'Details of pick up information is required'],
            trim: true
        },
        airbnbFriendly: {
            type: Boolean,
            default: true
        }
    },
    dropoffInfo: {
        type: String,
        required: [true, 'Drop Off information is required'],
        trim: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        required: [true, 'Order is required'],
        unique: true
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    images: {
        type: ImagesSchema,
        required: [true, 'Main Image of excursion is required']
    },
    cloudinaryFolder: {
        type: String,
        required: [true, 'Cloudinary folder is required'],
        unique: true,
        trim: true
    },
    seo: {
        title: {
            type: String,
            required: [true, 'Seo Title is required'],
            trim: true
        },
        description: {
            type: String,
            required: [true, 'Seo Descriptio is required'],
            trim: true
        },
        keywords: {
            type: [String],
            required: [true, 'Seo Keywords are required'],
            default: []
        }
    }
}, {
    versionKey: false,
    timestamps: true
}
);


//  Generar slug automáticamente
ExcursionsSchema.pre('validate', function () {
    if (this.isNew && this.name && !this.slug) {
        const date = new Date();
        const dateString = date.toISOString().split('T')[0];
        this.slug = `${slugify(this.name, { lower: true, strict: true })}-${dateString}`;
    }

    //  Validar que el depósito no exceda el precio
    if (this.pricing.paymentTerms === 'deposit' &&
        this.pricing.depositPercentage > 100) {
        this.invalidate(
            'pricing.depositPercentage',
            'Deposit percentage cannot exceed 100%'
        );
    }
});

//  Índices para búsquedas rápidas
ExcursionsSchema.index({ categories: 1 });
ExcursionsSchema.index({ 'location.coordinates': '2dsphere' });
ExcursionsSchema.index({ isPublished: 1, isFeatured: -1 });
ExcursionsSchema.index({ name: 'text', shortDescription: 'text', longDescription: 'text' });



// module.exports = model("excursions", ExcursionsSchema);
module.exports = model("excursions", ExcursionsSchema);