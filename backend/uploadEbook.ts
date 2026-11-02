import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { EBOOK_UPLOAD_DIR } from './db';

const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'application/epub+zip']);
const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60MB — generous for an ebook

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, EBOOK_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10);
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const uploadEbookFile = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    // Some browsers send a blank/incorrect mimetype for .epub files, so
    // also allow based on file extension as a fallback.
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) && ext !== '.pdf' && ext !== '.epub') {
      cb(new Error('Only PDF or EPUB files are accepted.'));
      return;
    }
    cb(null, true);
  },
});
