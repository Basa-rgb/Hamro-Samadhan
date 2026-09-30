const multer = require("multer");

const storage = multer.memoryStorage();

// Magic bytes each real image format starts with
const IMAGE_SIGNATURES = [
  { name: "jpeg", bytes: [0xff, 0xd8, 0xff] },
  { name: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { name: "gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  {
    name: "webp",
    bytes: [0x52, 0x49, 0x46, 0x46],
    alsoAt: {
      offset: 8,
      bytes: [0x57, 0x45, 0x42, 0x50],
    },
  },
];

// Checks the buffer really is an image, not just named like one
const looksLikeAnImage = (buffer) => {
  if (!Buffer.isBuffer(buffer)) return false;

  return IMAGE_SIGNATURES.some((signature) => {
    const startMatches = signature.bytes.every(
      (byte, index) => buffer[index] === byte
    );

    if (!startMatches) return false;

    if (signature.alsoAt) {
      return signature.alsoAt.bytes.every(
        (byte, index) =>
          buffer[signature.alsoAt.offset + index] === byte
      );
    }

    return true;
  });
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const badRequest = (message) => {
  const error = new Error(message);
  error.status = 400;
  return error;
};

// Keeps the file in memory so we can check it before uploading
const upload = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },

  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(badRequest("Only image files are allowed"));
    }

    cb(null, true);
  },
});

// Drops the file if the real bytes are not an image
const verifyImage = (req, res, next) => {
  if (req.file && !looksLikeAnImage(req.file.buffer)) {
    delete req.file;
    return next(badRequest("File content is not a valid image"));
  }

  next();
};

const uploadImage = [upload.single("image"), verifyImage];

module.exports = uploadImage;