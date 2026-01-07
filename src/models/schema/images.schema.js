const { Schema } = require('mongoose');

/*
  Sub-schema reutilizable para imágenes
  ------------------------------------
  - main: imagen principal
  - gallery: imágenes secundarias
*/
const ImageItemSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
      match: [/^.+\.(jpg|jpeg|png|webp)$/i, 'Invalid image format']
    },
    alt: {
      type: String,
      default: ''
    }
  },
  { _id: false } // No crea _id para cada imagen
);

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

module.exports = ImagesSchema;
