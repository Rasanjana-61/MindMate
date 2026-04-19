const fs = require("fs");
const path = require("path");
const multer = require("multer");

const profileUploadDir = path.join(process.cwd(), "uploads", "profile-images");
const resourceUploadDir = path.join(process.cwd(), "uploads", "resources");
fs.mkdirSync(profileUploadDir, { recursive: true });
fs.mkdirSync(resourceUploadDir, { recursive: true });

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileUploadDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || ".jpg";
    cb(null, `${req.user._id}-${Date.now()}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
    return;
  }

  cb(new Error("Only image uploads are allowed."));
};

const uploadProfileImage = multer({
  storage: profileStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const resourceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resourceUploadDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || ".txt";
    cb(null, `${req.user._id}-${Date.now()}${extension}`);
  },
});

const resourceFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "video/mp4",
    "video/webm",
    "video/x-matroska",
    "audio/mpeg",
    "audio/wav",
    "audio/mp3",
    "application/epub+zip"
  ];
  const allowedExtensions = [".pdf", ".docx", ".txt", ".mp4", ".mkv", ".webm", ".mp3", ".wav", ".epub"];
  const extension = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(extension)) {
    cb(null, true);
    return;
  }

  cb(new Error("Only PDF, DOCX, TXT, Video (MP4/MKV/WEBM), and Audio (MP3/WAV) files are allowed."));
};

const uploadResourceFile = multer({
  storage: resourceStorage,
  fileFilter: resourceFileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
  },
});

module.exports = { uploadProfileImage, uploadResourceFile };
