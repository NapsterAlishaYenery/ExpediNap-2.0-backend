const { Schema } = require('mongoose');


const ImageItemSchema = new Schema({
  public_id: {
    type: String,
    required: [true, 'Full Id is required'],
    trim: true
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    trim: true,
  },
  thumbnailUrl: {
    type: String,
    required: [true, 'The URL of thumbnail is required'],
    trim: true
  },
  alt: {
    type: String,
    required: [true, 'Alternative text (alt text) is required for SEO.'],
    trim: true,
    default: 'Excursion Web'
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  width: {
    type: Number,
    default: 0
  },
  height: {
    type: Number,
    default: 0
  },
  format: {
    type: String,
    default: 'jpg'
  },
  // Para ordenar manualmente las imágenes
  order: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: null
  }
}, { _id: false });

const ImagesSchema = new Schema(
  {
    main: {
      type: ImageItemSchema,
      required: true
    },
    gallery: {
      type: [ImageItemSchema],
      default: []
    }
  },
  { _id: false }
);

module.exports = {
  ImageItemSchema,
  ImagesSchema
};