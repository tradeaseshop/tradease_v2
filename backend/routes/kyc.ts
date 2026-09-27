import { Router } from 'express';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import db, { KYC_UPLOAD_DIR } from '../db';
import { toKycDocument } from '../serialize';
import { requireRole } from '../auth';

const router = Router();

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, KYC_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Random name on disk — never trust or reuse the original filename, and
    // never let it be guessable, since these are sensitive ID documents.
    const ext = path.extname(file.originalname).slice(0, 10);
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error('Only JPG, PNG, WEBP, or PDF files are accepted.'));
      return;
    }
    cb(null, true);
  },
});

function getVendorForUser(userId: string): any {
  return db.prepare('SELECT * FROM vendors WHERE user_id = ?').get(userId);
}

// Recomputes and persists a vendor's overall KYC status from the state of
// their individual documents:
//  - any document Rejected           -> vendor is Rejected
//  - both 'id' and 'address' Approved -> vendor is Verified
//  - otherwise, if any document exists -> Pending
//  - no documents at all              -> Unverified
function recomputeVendorKycStatus(vendorId: string) {
  const docs = db.prepare('SELECT doc_type, status FROM kyc_documents WHERE vendor_id = ?').all(vendorId) as any[];
  let next: 'Unverified' | 'Pending' | 'Verified' | 'Rejected' = 'Unverified';
  if (docs.length > 0) {
    if (docs.some((d) => d.status === 'Rejected')) {
      next = 'Rejected';
    } else {
      const hasApprovedId = docs.some((d) => d.doc_type === 'id' && d.status === 'Approved');
      const hasApprovedAddress = docs.some((d) => d.doc_type === 'address' && d.status === 'Approved');
      next = hasApprovedId && hasApprovedAddress ? 'Verified' : 'Pending';
    }
  }
  db.prepare('UPDATE vendors SET kyc_status = ? WHERE id = ?').run(next, vendorId);
  return next;
}

// ---------- Vendor-facing ----------

// GET /api/kyc/mine — the logged-in vendor's own documents + overall status.
router.get('/mine', requireRole('vendor'), (req, res) => {
  const vendor = getVendorForUser(req.auth!.id);
  if (!vendor) return res.status(404).json({ error: 'No vendor storefront found for this account.' });
  const docs = db.prepare('SELECT * FROM kyc_documents WHERE vendor_id = ? ORDER BY uploaded_at DESC').all(vendor.id);
  res.json({ kycStatus: vendor.kyc_status, documents: docs.map(toKycDocument) });
});

// POST /api/kyc/documents  (multipart form: field "document", body field "docType": 'id' | 'address')
router.post('/documents', requireRole('vendor'), (req, res) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed.' });
    }
    const vendor = getVendorForUser(req.auth!.id);
    if (!vendor) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(404).json({ error: 'No vendor storefront found for this account.' });
    }
    const docType = req.body?.docType;
    if (!['id', 'address'].includes(docType)) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: 'docType must be "id" or "address".' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded.' });
    }

    // Replace any previous document of the same type — a vendor re-uploading
    // their ID should overwrite the old submission, not pile up duplicates.
    const previous = db.prepare('SELECT * FROM kyc_documents WHERE vendor_id = ? AND doc_type = ?').get(vendor.id, docType) as any;
    if (previous) {
      const oldPath = path.join(KYC_UPLOAD_DIR, previous.stored_file_name);
      fs.unlink(oldPath, () => {});
      db.prepare('DELETE FROM kyc_documents WHERE id = ?').run(previous.id);
    }

    const id = randomUUID();
    db.prepare(
      `INSERT INTO kyc_documents (id, vendor_id, doc_type, original_file_name, stored_file_name, mime_type, file_size, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`
    ).run(id, vendor.id, docType, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size);

    recomputeVendorKycStatus(vendor.id);

    res.status(201).json(toKycDocument(db.prepare('SELECT * FROM kyc_documents WHERE id = ?').get(id)));
  });
});

// ---------- Shared: serving the actual file ----------

// GET /api/kyc/documents/:id/file — streams the file. Only the owning
// vendor or an admin can retrieve it; nothing here is publicly reachable.
router.get('/documents/:id/file', requireRole('vendor', 'admin'), (req, res) => {
  const doc = db.prepare('SELECT * FROM kyc_documents WHERE id = ?').get(req.params.id) as any;
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  if (req.auth!.role === 'vendor') {
    const vendor = getVendorForUser(req.auth!.id);
    if (!vendor || vendor.id !== doc.vendor_id) {
      return res.status(403).json({ error: 'You do not have access to this document.' });
    }
  }

  const filePath = path.join(KYC_UPLOAD_DIR, doc.stored_file_name);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File is missing from storage.' });
  }
  res.setHeader('Content-Type', doc.mime_type);
  res.setHeader('Content-Disposition', `inline; filename="${doc.original_file_name.replace(/"/g, '')}"`);
  fs.createReadStream(filePath).pipe(res);
});

// ---------- Admin-facing ----------

// GET /api/kyc/queue  (admin) — every vendor that has at least one document,
// with their documents attached, newest activity first.
router.get('/queue', requireRole('admin'), (_req, res) => {
  const vendors = db
    .prepare(
      `SELECT DISTINCT v.* FROM vendors v
       JOIN kyc_documents d ON d.vendor_id = v.id
       ORDER BY v.joining_date DESC`
    )
    .all() as any[];

  const result = vendors.map((v) => {
    const docs = db.prepare('SELECT * FROM kyc_documents WHERE vendor_id = ? ORDER BY doc_type').all(v.id);
    return {
      vendorId: v.id,
      vendorName: v.name,
      vendorEmail: v.email,
      kycStatus: v.kyc_status,
      documents: docs.map(toKycDocument),
    };
  });
  res.json(result);
});

// PUT /api/kyc/documents/:id/review  { status: 'Approved' | 'Rejected', reason? }  (admin)
router.put('/documents/:id/review', requireRole('admin'), (req, res) => {
  const { status, reason } = req.body || {};
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be "Approved" or "Rejected"' });
  }
  const doc = db.prepare('SELECT * FROM kyc_documents WHERE id = ?').get(req.params.id) as any;
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  if (status === 'Rejected' && !reason) {
    return res.status(400).json({ error: 'A reason is required when rejecting a document.' });
  }

  db.prepare(
    `UPDATE kyc_documents SET status = ?, rejection_reason = ?, reviewed_at = datetime('now'), reviewed_by = ? WHERE id = ?`
  ).run(status, status === 'Rejected' ? reason : null, req.auth!.id, req.params.id);

  const newVendorStatus = recomputeVendorKycStatus(doc.vendor_id);

  res.json({
    document: toKycDocument(db.prepare('SELECT * FROM kyc_documents WHERE id = ?').get(req.params.id)),
    vendorKycStatus: newVendorStatus,
  });
});

export default router;
