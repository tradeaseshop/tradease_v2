import 'dotenv/config';
import crypto from 'crypto';
import db from './db';
import { hashPassword } from './auth';
import { validatePassword } from './routes/auth';

/**
 * Safe, explicit production admin password recovery.
 *
 * Recovery uses:
 *   ADMIN_RESET_PASSWORD=<new strong password>
 *   ADMIN_RESET_CONFIRM=RESET_ADMIN_NOW
 *   ADMIN_RESET_ID=<unique one-time identifier>
 *
 * The identifier is recorded in SQLite, so the same reset cannot run again.
 *
 * There is also a separate, opt-in initial-password synchronisation:
 *   ADMIN_PASSWORD_SYNC=true
 *
 * This is useful when a persistent Railway database already contains an
 * admin account that was created with an older ADMIN_INITIAL_PASSWORD.
 * The sync records a fingerprint of the configured initial password, so it
 * runs once for that password and does not overwrite a password later
 * changed by the administrator unless the environment password is changed
 * and the sync flag is deliberately enabled again.
 */

function ensureResetTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_password_reset_runs (
      id TEXT PRIMARY KEY,
      admin_email TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS admin_initial_password_sync_runs (
      password_fingerprint TEXT PRIMARY KEY,
      admin_email TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

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

  ensureResetTables();

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

export function syncAdminPasswordFromInitialEnv(): boolean {
  if (process.env.NODE_ENV !== 'production' || process.env.ADMIN_PASSWORD_SYNC !== 'true') return false;

  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!password) throw new Error('[admin-sync] ADMIN_INITIAL_PASSWORD is required when ADMIN_PASSWORD_SYNC=true.');
  const passwordError = validatePassword(password);
  if (passwordError) throw new Error(`[admin-sync] ${passwordError}`);

  const email = (process.env.ADMIN_INITIAL_EMAIL || 'admin@tradease.ng').trim().toLowerCase();
  ensureResetTables();

  const admin = db.prepare('SELECT id, email FROM admins WHERE lower(email) = ? LIMIT 1').get(email) as any;
  if (!admin) throw new Error(`[admin-sync] No admin account found for ${email}.`);

  const fingerprint = crypto.createHash('sha256').update(password, 'utf8').digest('hex');
  const alreadySynced = db.prepare('SELECT password_fingerprint FROM admin_initial_password_sync_runs WHERE password_fingerprint = ?').get(fingerprint);
  if (alreadySynced) {
    console.log(`[admin-sync] Initial password fingerprint already consumed for ${email}.`);
    return false;
  }

  const passwordHash = hashPassword(password);
  const transaction = db.transaction(() => {
    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(passwordHash, admin.id);
    db.prepare('INSERT INTO admin_initial_password_sync_runs (password_fingerprint, admin_email) VALUES (?, ?)').run(fingerprint, email);
  });
  transaction();

  console.log(`[admin-sync] Admin password synchronized from ADMIN_INITIAL_PASSWORD for ${email}. Disable ADMIN_PASSWORD_SYNC after this deployment.`);
  return true;
}
