const cloudinary = require("cloudinary").v2;

// Image storage config, credentials come from .env so they stay out of git
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports =cloudinary;