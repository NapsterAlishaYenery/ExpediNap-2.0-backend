const { Schema, model } = require('mongoose');
const ClientSchema = require('./schema/Client.schema');

const YachtOrderSchema = new Schema({
    orderNumber: {
        type: String,
        required: [true, 'Order number is required'],
        unique: true,
        index: true,
        uppercase: true
    },
    customer: ClientSchema,
    yachtId: {
        type: Schema.Types.ObjectId,
        ref: 'yacht',
        required: [true, 'Yacht ID is required']
    },
    yachtName: {
        type: String,
        required: [true, 'Yacht name is required'],
        trim: true
    },
    destination: {
        type: String,
        required: [true, 'Destination is required'],
        enum: {
            values: ['Saona Island', 'Catalina Island', 'River Sunset'],
            message: '{VALUE} is not a valid destination'
        }
    },
    duration: {
        type: String,
        required: [true, 'Duration is required'],
        enum: ['Full Day', 'Half Day', 'Sunset Trip']
    },
    timeTrip: {
        type: String,
        required: [true, 'Time trip is required']
    },
    travelDate: {
        type: Date,
        required: [true, 'Travel date is required']
    },
    pricing: {
        basePrice: {
            type: Number,
            required: true,
            min: [0, 'Base price cannot be negative']
        },
        tax: {
            type: Number,
            required: true,
            default: 0
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
        enum: ['pending', 'confirmed', 'paid', 'cancelled', 'deleted', 'completed'],
        default: 'pending',
        lowercase: true
    },
    isAvailable: {
        type: Boolean,
        default: false
    },
    internalNotes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
}, {
    versionKey: false,
    timestamps: true
});


module.exports = model("yachtOrders", YachtOrderSchema);