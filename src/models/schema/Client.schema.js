
const { Schema} = require('mongoose');

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const phoneRegex = /^[0-9]{8,15}$/;

const ClientSchema = new Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [50, 'Full name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [emailRegex, 'Please provide a valid email address'],
        maxlength: [255, 'Email cannot exceed 255 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone is required'],
        trim: true,
        match: [phoneRegex, 'Please provide a valid phone number (digits only)'],
        maxlength: [20, 'Phone number cannot exceed 20 characters']
    }
}, { _id: false });

module.exports = ClientSchema;