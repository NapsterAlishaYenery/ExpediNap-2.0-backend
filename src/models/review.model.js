const { Schema, model } = require('mongoose');
const crypto = require('crypto'); // Nativo de Node para el hash de Gravatar
const ClientSchema = require('./schema/Client.schema')


const reviewsSchema = new Schema({
   customer: {
        type: ClientSchema, // Aquí metemos fullName, email y phone
        required: true,
   },
    city: { // Agregamos la ciudad
        type: String,
        required: [true, 'City is required'],
        trim: true
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
    
    if (this.isModified('client.email')) {
        const emailParaHash = this.client.email.trim().toLowerCase();
        const hash = crypto
            .createHash('md5')
            .update(emailParaHash)
            .digest('hex');
            
        this.userImg = `https://www.gravatar.com/avatar/${hash}?s=200&d=404`;
    }
});

module.exports = model("reviews", reviewsSchema);