const { Schema } = require('mongoose');
const priceValidator = require('../../utils/price.validator');

const YachtRiverSunsetSchema = new Schema({
    price: {
        type: Number,
        required: false,
        min: [0, 'Price cannot be negative'],
        validate: priceValidator,
        default: null
    },
    timeTrip: {
        type: String,
        required: false,
        trim: true,
        default: null
    }
}, { _id: false }
);

module.exports = YachtRiverSunsetSchema;