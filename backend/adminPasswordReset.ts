import 'dotenv/config';
import db from './db';
import { hashPassword } from './auth';
import { validatePassword } from './routes/auth';

/**
 * Safe, one-time production admin password recovery.
 *
 * Enable explicitly with all three variables:
 *   ADMIN_RESET_PASSWORD=<new strong password>
 *   ADMIN_RESET_CONFIRM=RESET_ADMIN_NOW
 *   ADMIN_RESET_ID=<unique one-time identifier>
 *
 * The identifier is recorded in SQLite, so the same reset cannot run again
 * after a restart. A new reset requires a new ADMIN_RESET_ID.
 */
export function runAdminPasswordReset(): boolean {
  const password = process.env.ADMIN_RESET_PASSWORD;
  const confirm = process.env.ADMIN_RESET_CONFIRM;
  const resetId = process.env.ADMIN_RESET_ID;
  const email = (process.env.ADMIN_RESET_EMAIL || 'admin@tradease.ng').trim().toLowerCase();

  const resetRequested = Boolean(password || confirm || resetId || process.env.ADMIN_RESET_EMAIL);
  if (!resetRequested) return false;

  if (process.env.NODE_ENV !== 'production') {
    console.warn('[admin-reset] Ignored: admin password reset is production-only.');
    return false;
  }
  if (!password || confirm !== 'RESET_ADMIN_NOW' || !resetId) {
    throw new Error('[admin-reset] Refusing to run. Set ADMIN_RESET_PASSWORD, ADMIN_RESET_CONFIRM=RESET_ADMIN_NOW, and a unique ADMIN_RESET_ID.');
  }

  const passwordError = validatePassword(password);
  if (passwordError) throw new Error(`[admin-reset] ${passwordError}`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_password_reset_runs (
      id TEXT PRIMARY KEY,
      admin_email TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const existingRun = db.prepare('SELECT id FROM admin_password_reset_runs WHERE id = ?').get(resetId) as any;
  if (existingRun) {
    console.log(`[admin-reset] Reset ID ${resetId} has already been used. No password change performed.`);
    return false;
  }

  const admin = db.prepare('SELECT id, email FROM admins WHERE lower(email) = ? LIMIT 1').get(email) as any;
  if (!admin) {
    throw new Error(`[admin-reset] No admin account found for ${email}.`);
  }

  const passwordHash = hashPassword(password);
  const transaction = db.transaction(() => {
    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(passwordHash, admin.id);
    db.prepare('INSERT INTO admin_password_reset_runs (id, admin_email) VALUES (?, ?)').run(resetId, email);
  });
  transaction();

  console.log(`[admin-reset] Admin password reset completed for ${email}. Reset ID ${resetId} is now consumed.`);
  return true;
}
