const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;

//DOCUMENTACION CLOUDINARY URL
// https://cloudinary.com/documentation/node_integration?utm_source=youtube&utm_content=nodejs_sdk_getting_started&utm_medium=video&utm_campaign=devhints