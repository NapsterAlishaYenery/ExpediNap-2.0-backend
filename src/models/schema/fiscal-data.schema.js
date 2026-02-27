
const { Schema } = require('mongoose');


const FiscalData = new Schema({
    ncf: {
        type: String,
        required: [true, 'Fical Number is required'],
        trim: true,
        maxlength: [50, 'Full name cannot exceed 50 characters']
    },
    ncfVencimiento: {
        type: Date,
    },
    tipoNcf: {
        type: String,
        default: 'B02'
    }
}, { _id: false });

module.exports = FiscalData;