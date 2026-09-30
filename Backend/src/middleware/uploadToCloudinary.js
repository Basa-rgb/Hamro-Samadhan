const cloudinary = require("../config/cloudinary");

// Sends a buffer to Cloudinary and resolves with the stored image
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "hamro-samadhan/reports",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(buffer);
  });
};

module.exports = uploadToCloudinary;