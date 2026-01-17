const { Schema } = require('mongoose');
const priceValidator = require('../../utils/price.validator');

const PricesSchema = new Schema({
    halfDay: {
        type: Number,
        required: false,
        min: [1.0, 'Price must be greater than 0'],
        max: [1000000, 'Price cannot exceed 1,000,000'],
        default: null,
        validate: priceValidator
    },
    fullDay: {
        type: Number,
        required: false,
        min: [1.0, 'Price must be greater than 0'],
        max: [1000000, 'Price cannot exceed 1,000,000'],
        default: null,
        validate: priceValidator
    }
},
    { _id: false }
);


PricesSchema.pre('validate', function () {
  if (this.halfDay == null && this.fullDay == null) {
    this.invalidate(
      'halfDay',
      'At least one price (halfDay or fullDay) is required'
    );
  }
});

module.exports = PricesSchema;