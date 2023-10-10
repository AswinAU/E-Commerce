const mongoose = require('mongoose')

const sizeOf = require('image-size');

const imagevalidation = (req, res, next)=> {
  const { file } = req;

  // Check file format (for example, allow only JPEG and PNG)
  const allowedFormats = ['image/jpeg', 'image/png'];
  if (!allowedFormats.includes(file.mimetype)) {
    return res.status(400).json({ error: 'Invalid file format. Please upload a JPEG or PNG image.' });
  }

  // Check file size (for example, limit to 1MB)
  const maxSize = 1024 * 1024; // 1MB in bytes
  if (file.size > maxSize) {
    return res.status(400).json({ error: 'File size too large. Maximum allowed size is 1MB.' });
  }

  // Check image dimensions (for example, limit width and height)
  const dimensions = sizeOf(file.path);
  const maxWidth = 800;
  const maxHeight = 600;
  if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
    return res.status(400).json({ error: `Image dimensions should not exceed ${maxWidth}x${maxHeight} pixels.` });
  }

  // If all validations pass, proceed to the next middleware/route handler
  next();
}

module.exports = imagevalidation