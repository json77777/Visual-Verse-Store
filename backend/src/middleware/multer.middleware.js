import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null,file.originalname)
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // Images
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/jfif",
      "image/pjpeg",

      // Videos
      "video/mp4",
      "video/mkv",
      "video/webm",
      "video/quicktime",

      // Digital products
      "application/zip",
      "application/x-zip-compressed",
      "application/pdf",
      "application/octet-stream"
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      console.error("Rejected mimetype:", file.mimetype);
      const err = new Error(`Unsupported file type: ${file.mimetype}`);
      // Let the global error handler map this to a 400.
      err.statusCode = 400;
      return cb(err, false);
    }

    cb(null, true);
  }

});

