// models/schema/payment.schema.js
const { Schema } = require('mongoose');

const PaymentSchema = new Schema({
    method: {
        type: String,
        enum: ['pay_now', 'pay_later', 'cash', 'bank_transfer', 'paypal', 'stripe'],
        default: 'pay_later'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    transactionId: {
        type: String,
        trim: true,
        default: null
    },
    paymentDate: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    }
}, { _id: false });

module.exports = PaymentSchema;