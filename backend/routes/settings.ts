import { Router } from 'express';
import db from '../db';
import { toSettings } from '../serialize';
import { requireAdminLevel } from '../auth';

const router = Router();

// GET /api/settings — public, since checkout and other public-facing parts
// of the site may need to know things like the flat delivery fee.
router.get('/', (_req, res) => {
  const row = db.prepare('SELECT * FROM platform_settings WHERE id = 1').get();
  res.json(toSettings(row));
});

// PUT /api/settings — full-access admin levels only (Manager/Office
// Assistant accounts can see settings but not change payment gateway
// credentials, commission rates, or other platform-wide configuration).
router.put('/', requireAdminLevel(), (req, res) => {
  const b = req.body || {};
  const existing = db.prepare('SELECT * FROM platform_settings WHERE id = 1').get() as any;

  if (b.commissionPercent != null && (b.commissionPercent < 0 || b.commissionPercent > 50)) {
    return res.status(400).json({ error: 'commissionPercent must be between 0 and 50' });
  }
  if (b.flatDeliveryFee != null && b.flatDeliveryFee < 0) {
    return res.status(400).json({ error: 'flatDeliveryFee cannot be negative' });
  }

  db.prepare(
    `UPDATE platform_settings SET
      app_name = ?, commission_percent = ?, payment_gateway = ?, test_mode = ?,
      payout_frequency = ?, flat_delivery_fee = ?, restricted_categories = ?, updated_at = datetime('now')
     WHERE id = 1`
  ).run(
    b.appName ?? existing.app_name,
    b.commissionPercent ?? existing.commission_percent,
    b.paymentGateway ?? existing.payment_gateway,
    b.testMode != null ? (b.testMode ? 1 : 0) : existing.test_mode,
    b.payoutFrequency ?? existing.payout_frequency,
    b.flatDeliveryFee ?? existing.flat_delivery_fee,
    b.restrictedCategories ? JSON.stringify(b.restrictedCategories) : existing.restricted_categories
  );

  res.json(toSettings(db.prepare('SELECT * FROM platform_settings WHERE id = 1').get()));
});

export default router;
