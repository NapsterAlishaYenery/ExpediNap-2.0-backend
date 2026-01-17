const { Schema, model } = require("mongoose");

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const phoneRegex = /^[0-9]{8,15}$/;


const UsuarioSchema = new Schema({
    name: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastname: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        index: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [255, 'Username cannot exceed 255 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        index: true,
        trim: true,
        lowercase: true,
        match: [emailRegex, 'Please provide a valid email address'],
        maxlength: [255, 'Email cannot exceed 255 characters']
    },
    password_hash: {
        type: String,
        required: [true, 'Password is required'],
        select: false 
    },
    phone: {
        type: String,
        trim: true,
        match: [phoneRegex, 'Please provide a valid phone number (digits only)'],
        maxlength: [20, 'Phone number cannot exceed 20 characters']
    },
    age: {
        type: Number,
        min: [1, 'Age must be at least 1'],
        max: [120, 'Age cannot exceed 120']
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    active: {
        type: Boolean,
        default: true
    },
    direction: {
        street: {
            type: String,
            trim: true,
            maxlength: [255, 'Street address is too long']
        },
        city: {
            type: String,
            trim: true,
            maxlength: [100, 'City name is too long']
        },
        municipality: {
            type: String,
            trim: true,
            maxlength: [100, 'Municipality name is too long']
        },
        zip_code: {
            type: String,
            trim: true,
            maxlength: [10, 'Zip code is too long']
        }
    }
}, {
    versionKey: false,
    timestamps: true 
});

module.exports = model("Usuario", UsuarioSchema);