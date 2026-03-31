import fs from "fs";
import path from "path";
import multer from "multer";

const uploadRoot = path.resolve(process.cwd(), "uploads", "authors");
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadRoot);
  },
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "");
    callback(null, `${Date.now()}-${safeName}`);
  },
});

function fileFilter(_req, file, callback) {
  if (!file.mimetype.startsWith("image/")) {
    callback(new Error("Only image uploads are allowed."));
    return;
  }

  callback(null, true);
}

export const uploadAuthorImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
