import { randomUUID } from 'crypto';
import db from './db';

export function notifyUser(userId: string | null | undefined, title: string, message: string, type = 'system', data: any = null) {
  if (!userId) return;
  try {
    db.prepare(`INSERT INTO notifications (id,user_id,title,message,type,data,is_read,created_at) VALUES (?,?,?,?,?,?,0,datetime('now'))`)
      .run(randomUUID(), userId, title, message, type, data ? JSON.stringify(data) : null);
  } catch (err) {
    console.warn('[notifications] unable to create notification:', err);
  }
}

export function notifyOrderParties(orderId: string, title: string, message: string, type = 'order') {
  const order = db.prepare('SELECT buyer_id FROM orders WHERE id=?').get(orderId) as any;
  notifyUser(order?.buyer_id, title, message, type, { orderId });
  const vendors = db.prepare(`SELECT DISTINCT v.user_id FROM vendor_orders vo JOIN vendors v ON v.id=vo.vendor_id WHERE vo.order_id=? AND v.user_id IS NOT NULL`).all(orderId) as any[];
  for (const v of vendors) notifyUser(v.user_id, title, message, type, { orderId });
}
