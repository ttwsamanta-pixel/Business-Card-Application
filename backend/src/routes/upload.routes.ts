import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import multer from "multer";
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { config } from "../config.js";
import { ok, fail } from "../utils/http.js";

const uploadRoot = path.resolve(config.UPLOAD_DIR);
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadRoot),
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    callback(null, `${randomUUID()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    callback(null, allowed.includes(file.mimetype));
  }
});

export const uploadRouter = Router();

uploadRouter.post("/", authenticate, upload.single("file"), (req, res) => {
  if (!req.file) return fail(res, 422, "A valid image file is required");
  const publicUrl = `${config.API_URL}/uploads/${req.file.filename}`;
  return ok(res, {
    originalName: req.file.originalname,
    fileName: req.file.filename,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    publicUrl
  }, 201);
});
