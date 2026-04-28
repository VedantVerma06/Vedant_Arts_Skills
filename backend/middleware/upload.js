import fs from "fs";
import os from "os";
import path from "path";
import multer from "multer";

const uploadDir = path.join(os.tmpdir(), "vedant-arts-skills-uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .slice(0, 80);

    cb(null, `${Date.now()}-${baseName || "image"}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPG, JPEG, PNG, and WEBP images are allowed"), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export default upload;
