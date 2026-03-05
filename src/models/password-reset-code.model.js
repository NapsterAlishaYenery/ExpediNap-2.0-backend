// models/password-reset.model.js
const mongoose = require('mongoose');

const passwordResetCodeSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        index: true 
    },
    code: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now, 
        expires: '5m' // Mongoose borra esto solito en 5 mins
    } 
});

module.exports = mongoose.model('PasswordResetCode', passwordResetCodeSchema);