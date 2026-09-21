import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { AVATAR_UPLOAD_DIR } from './db';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB — plenty for a profile picture or logo

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10);
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const uploadAvatar = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error('Only JPG, PNG, or WEBP images are accepted.'));
      return;
    }
    cb(null, true);
  },
});

// The public URL path an uploaded file is reachable at, given its stored
// filename on disk.
export function avatarUrlFor(filename: string): string {
  return `/uploads/avatars/${filename}`;
}
