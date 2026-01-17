const { Schema, model } = require("mongoose");

const ClientSchema = require('./schema/Client.schema')

const TransferOrderSchema = new Schema({
    
    orderNumber: {
        type: String,
        required: [true, 'Order number is required'],
        unique: true,
        index: true,
        uppercase: true 
    },
    customer: ClientSchema,
    transferType: {
        type: String,
        required: [true, 'Tresfer Type is required'],
        default: 'Airport-hotel',
        enum: ['airport-hotel', 'hotel-airport', 'round-trip', 'hotel-hotel', 'country'],
        trim: true
    },
    pickUpLocation: {
        type: String,
        required: [true, 'Pickup location is required'],
        trim: true
    },
    destination: {
        type: String,
        required: [true, 'Destination is required'],
        trim: true
    },
    numPassengers: {
        type: Number,
        default: 1,
        min: [1, 'At least 1 passenger is required']
    },
    pickUpDate: {
        type: Date, 
        required: [true, 'Pickup date and time is required']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'paid', 'completed', 'cancelled', 'deleted'],
        default: 'pending'
    },
    pricing: {
        totalPrice: {
            type: Number,
        },
        currency: {
            type: String,
            uppercase: true,
            trim: true,
            maxlength: [3, 'Currency must be 3 characters'],
            minlength: [3, 'Currency must be 3 characters'],
            default: 'USD'
        }
    },
    internalNotes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters'] 
    }
}, {
    versionKey: false,
    timestamps: true
}
);

module.exports = model("transfersOrders", TransferOrderSchema);