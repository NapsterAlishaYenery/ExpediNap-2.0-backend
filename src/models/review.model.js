const { Schema, model } = require('mongoose');
const crypto = require('crypto'); // Nativo de Node para el hash de Gravatar

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const reviewsSchema = new Schema({
    fullName: {
        type: String,
        required: [true, 'Full Name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [emailRegex, 'Please provide a valid email address'],
        maxlength: [255, 'Email cannot exceed 255 characters']
    },
    selectedExcursion: {
        type: String,
        default: null,
        trim: true
    },
    selectedYacht: {
        type: String,
        default: null,
        trim: true
    },
    rating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5'],
        required: [true, 'Rating is required'],
    },
    comment: {
        type: String,
        required: [true, 'Comment is required'],
        trim: true
    },
    status: {
        type: String, 
        enum: ['pending', 'approved', 'rejected','deleted'],
        default: 'pending'
    },
    featured: {
        type: Boolean,
        default: false
    },
    userImg: {
        type: String,
    },
    reply: {
        type: String,
        default: null
    }
}, {
    versionKey: false,
    timestamps: true
});

reviewsSchema.pre('save', function () {
    
    if (this.isModified('email')) {
        const hash = crypto
            .createHash('md5')
            .update(this.email.trim().toLowerCase())
            .digest('hex');
            
        this.userImg = `https://www.gravatar.com/avatar/${hash}?s=200&d=404`;
    }
});

module.exports = model("reviews", reviewsSchema);