import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

   const appDir = typeof __dirname !== 'undefined'
     ? __dirname
     : path.dirname(fileURLToPath(import.meta.url));
   
   const DB_PATH = process.env.DATABASE_PATH || path.join(appDir, 'tradeease.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(appDir, 'schema.sql'), 'utf-8');
db.exec(schema);

// Safety net for databases created before these columns existed (CREATE TABLE
// IF NOT EXISTS won't add columns to an already-existing table). Each ALTER
// is wrapped individually since SQLite throws if the column is already
// there, and we want the rest of the migrations to still run either way.
const migrations = [
  `ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'local'`,
  `ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'wallet'`,
  `ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'Pending'`,
  `ALTER TABLE orders ADD COLUMN payment_reference TEXT`,
  `ALTER TABLE vendors ADD COLUMN kyc_status TEXT NOT NULL DEFAULT 'Unverified'`,
];
for (const sql of migrations) {
  try {
    db.exec(sql);
  } catch {
    // Column already exists — fine, nothing to do.
  }
}

// Where uploaded KYC documents (ID photos, proof-of-address files) are
// stored on disk. Created on startup if it doesn't exist yet.
export const KYC_UPLOAD_DIR = path.join(__dirname, 'uploads', 'kyc');
fs.mkdirSync(KYC_UPLOAD_DIR, { recursive: true });

export default db;
