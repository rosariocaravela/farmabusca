const cloudinary = require('../config/cloudinary');

const uploadImage = async (fileBuffer, folder = 'farmabusca') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto' }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    uploadStream.end(fileBuffer);
  });
};

module.exports = { uploadImage };
