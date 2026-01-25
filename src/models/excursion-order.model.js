const { Schema, model } = require('mongoose');
const ClientSchema = require('./schema/Client.schema');

const ExcursionOrderSchema = new Schema({
    orderNumber: {
        type: String,
        required: [true, 'Order number is required'],
        unique: true,
        index: true,
        uppercase: true
    },
    customer: {
        type: ClientSchema,
        required: [true, 'Client Full name, email and phone is required']
    },
    hotelName: {
        type: String,
        trim: true,
        default: "Not specified"
    },
    hotelNumber: {
        type: String,
        trim: true,
        default: "Not specified"
    },
    excursionId: {
        type: Schema.Types.ObjectId,
        ref: 'excursions',
        required: [true, 'Excursion ID is required']
    },
    excursionName: {
        type: String,
        required: [true, 'Excursion name is required'],
        trim: true
    },
    location: {
        type: String,
        required: true
    },
    pax: {
        adults: {
            type: Number,
            required: true,
            min: [1, 'At least 1 adult is required']
        },
        children: {
            type: Number,
            default: 0,
            min: [0, 'Children cannot be negative']
        }
    },
    travelDate: {
        type: Date,
        required: [true, 'Travel date is required']
    },
    pricing: {
        adultPriceSnap: {
            type: Number,
            required: true
        },
        childPriceSnap: {
            type: Number,
            required: true
        },
        subtotal: {
            type: Number,
            required: true
        },
        tax: {
            type: Number,
            required: true
        },
        totalPrice: {
            type: Number,
            required: true,
            min: [0, 'Total price cannot be negative']
        },
        currency: {
            type: String,
            default: 'USD',
            maxlength: [3, 'Currency must be 3 characters'],
            minlength: [3, 'Currency must be 3 characters'],
            uppercase: true
        }
    },

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'paid', 'completed', 'cancelled', 'deleted'],
        default: 'pending',
        lowercase: true
    },
    internalNotes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters'],
        default: ""
    }
}, {
    versionKey: false,
    timestamps: true
});

module.exports = model("excursionOrders", ExcursionOrderSchema);