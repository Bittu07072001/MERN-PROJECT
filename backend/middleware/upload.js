const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const cloudinary = require('cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imageStorage = cloudinaryStorage({
  cloudinary,
  folder: 'homeconnect/properties',
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
});

const videoStorage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2) + path.extname(file.originalname));
  },
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

const videoFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) cb(null, true);
  else cb(new Error('Only video files are allowed'), false);
};

const upload      = multer({ storage: imageStorage, fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadVideo = multer({ storage: videoStorage, fileFilter: videoFilter, limits: { fileSize: 200 * 1024 * 1024 } });

module.exports = upload;
module.exports.uploadVideo = uploadVideo;
