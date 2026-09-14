import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db';
import { toReport } from '../serialize';
import { requireRole } from '../auth';

const router = Router();

// GET /api/reports  (admin)
router.get('/', requireRole('admin'), (_req, res) => {
  const rows = db.prepare('SELECT * FROM reports ORDER BY date DESC').all();
  res.json(rows.map(toReport));
});

// POST /api/reports  (admin logs a new dispute/complaint)
router.post('/', requireRole('admin'), (req, res) => {
  const b = req.body || {};
  if (!b.reporterName || !b.subject || !b.type) {
    return res.status(400).json({ error: 'reporterName, subject and type are required' });
  }
  const allowedTypes = ['Product Dispute', 'Failed Payout', 'Seller Fraud', 'Delivery Complaint'];
  if (!allowedTypes.includes(b.type)) {
    return res.status(400).json({ error: `type must be one of: ${allowedTypes.join(', ')}` });
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO reports (id, reporter_name, subject, type, description, status) VALUES (?, ?, ?, ?, ?, 'Open')`
  ).run(id, b.reporterName, b.subject, b.type, b.description || null);
  res.status(201).json(toReport(db.prepare('SELECT * FROM reports WHERE id = ?').get(id)));
});

// PUT /api/reports/:id/status  { status }  (admin)
router.put('/:id/status', requireRole('admin'), (req, res) => {
  const { status } = req.body || {};
  const allowed = ['Open', 'Investigating', 'Resolved'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }
  const existing = db.prepare('SELECT id FROM reports WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Report not found' });
  db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json(toReport(db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id)));
});

export default router;
