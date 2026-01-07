const { Schema, model } = require('mongoose');
const stringArrayValidator = require('../utils/string-array.validator');

//Para formatear slug (ejemplo de Hola mundo a hola-mundo) npm install slugify
const slugify = require('slugify');

const BlogsSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    category: {
        type: [String],
        required: [true, 'At least one category is required'],
        validate: stringArrayValidator()
    },
    type: {
        type: String,
        required: [true, 'Blog type is required (e.g., Guide, Review, Tips)'],
        trim: true
    },
    author: {
        type: String,
        required: [true, 'Author name is required'],
        default: 'Expedinap Team',
        trim: true
    },
    slug: {
        type: String,
        required: [true, 'Slug is required for SEO URLs'],
        unique: true,
        lowercase: true,
        trim: true
    },
    meta_title: {
        type: String,
        required: [true, 'Meta title is required for SEO'],
        trim: true
    },
    meta_description: {
        type: String,
        required: [true, 'Meta description is required for SEO'],
        trim: true
    },
    keywords: {
        type: [String],
        required: [true, 'Keywords are required'],
        validate: stringArrayValidator()
    },
    excerpt: {
        type: String,
        required: [true, 'Excerpt is required for the blog preview card'],
        trim: true
    },
    image: {
        type: String, // URL de la imagen principal
        required: [true, 'la imagen es requerida JPS, JPEG, PNG, WEBP'],
        trim: true
    },
    alt: {
        type: String,
        required: [true, 'Alt text is required for accessibility and SEO'],
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Blog content is required'],
    }
}, {
    versionKey: false,
    timestamps: true
});


BlogsSchema.pre('validate', function() {

    if (this.isNew && this.title && !this.slug) {
        // Generamos el slug base desde el título
        let baseSlug = slugify(this.title, { lower: true, strict: true });

        // 2. Formatear la fecha actual (YYYY-MM-DD)
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Meses son 0-11
        const day = String(date.getDate()).padStart(2, '0');

        const dateString = `${year}-${month}-${day}`;
        
        // Opcional: Si quieres permitir títulos iguales pero slugs distintos, 
        // 3. Unir todo: ejemplo "tips-vacaciones-rd-2025-12-29"
        this.slug = `${baseSlug}-${dateString}`;
        
        // this.slug = baseSlug; 
    }
});


module.exports = model("blogs", BlogsSchema);