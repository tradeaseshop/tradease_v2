import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { PRODUCT_IMAGE_UPLOAD_DIR } from './db';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB per photo
export const MAX_PRODUCT_IMAGES = 10;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PRODUCT_IMAGE_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10);
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const uploadProductImages = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_PRODUCT_IMAGES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error('Only JPG, PNG, or WEBP images are accepted.'));
      return;
    }
    cb(null, true);
  },
});

export function productImageUrlFor(filename: string): string {
  return `/uploads/products/${filename}`;
}
