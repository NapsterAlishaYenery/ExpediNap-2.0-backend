const { Schema, model } = require('mongoose');
const stringArrayValidator = require('../utils/string-array.validator');

const slugify = require('slugify');

const sanitizeHtml = require('sanitize-html');

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
        type: String, 
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


BlogsSchema.pre('validate', function () {

    if (this.isNew && this.title && !this.slug) {
        let baseSlug = slugify(this.title, { lower: true, strict: true });


        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); 
        const day = String(date.getDate()).padStart(2, '0');

        const dateString = `${year}-${month}-${day}`;

        this.slug = `${baseSlug}-${dateString}`;
    }

    if (this.content) {
        this.content = sanitizeHtml(this.content, {
            allowedTags: [
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'article', 'address', 'div', 'span', 'p', 'br', 'hr',
                'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins', 'mark', 'small', 'sub', 'sup', 'cite', 'code', 'pre', 'blockquote', 'q',
                'ul', 'ol', 'li', 'dl', 'dt', 'dd',
                'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
                'img', 'a', 'picture', 'source', 'figure', 'figcaption',
                'abbr', 'data', 'time', 'kbd', 'var', 'samp'
            ],
            allowedAttributes: {
                '*': ['class', 'id', 'title', 'lang', 'dir', 'itemprop', 'role'],
                'a': ['href', 'name', 'target', 'rel', 'download'],
                'img': ['src', 'alt', 'title', 'width', 'height', 'loading', 'srcset', 'sizes'],
                'ol': ['start', 'type', 'reversed'],
                'li': ['value'],
                'td': ['colspan', 'rowspan'],
                'th': ['colspan', 'rowspan', 'scope'],
                'source': ['src', 'srcset', 'type', 'media'],
                'time': ['datetime']
            },
            allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data'],
            allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
            allowProtocolRelative: true

        });
    }
});


module.exports = model("blogs", BlogsSchema);