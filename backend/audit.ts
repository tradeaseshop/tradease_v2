import { randomUUID } from 'crypto';
import db from './db';
import type { Request } from 'express';
export function audit(req: Request, action: string, entityType: string, entityId: string|null, details: any = null) {
  try { db.prepare(`INSERT INTO audit_logs (id,actor_id,actor_role,action,entity_type,entity_id,details,ip) VALUES (?,?,?,?,?,?,?,?)`).run(randomUUID(),req.auth?.id||null,req.auth?.role||null,action,entityType,entityId,details?JSON.stringify(details):null,req.ip); } catch(e){ console.warn('[audit] log failed',e); }
}
