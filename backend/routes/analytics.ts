import { Router } from 'express';
import db from '../db';
import { requireRole } from '../auth';

const router=Router();

router.get('/admin',requireRole('admin'),(_req,res)=>{
  const summary=db.prepare(`SELECT COUNT(*) orders, COALESCE(SUM(CASE WHEN payment_status='Paid' THEN total_amount ELSE 0 END),0) paid_revenue, COALESCE(SUM(CASE WHEN status='Delivered' THEN total_amount ELSE 0 END),0) delivered_value, COALESCE(AVG(CASE WHEN payment_status='Paid' THEN total_amount END),0) average_order_value FROM orders`).get() as any;
  const statuses=db.prepare(`SELECT status,COUNT(*) count FROM orders GROUP BY status`).all();
  const payments=db.prepare(`SELECT payment_status status,COUNT(*) count,COALESCE(SUM(total_amount),0) amount FROM orders GROUP BY payment_status`).all();
  const vendors=db.prepare(`SELECT v.id,v.name,COUNT(DISTINCT vo.order_id) orders,COALESCE(SUM(vo.subtotal),0) gross_sales,COALESCE(SUM(vo.commission_amount),0) commission,COALESCE(SUM(vo.vendor_earnings),0) earnings FROM vendors v LEFT JOIN vendor_orders vo ON vo.vendor_id=v.id GROUP BY v.id ORDER BY gross_sales DESC LIMIT 20`).all();
  const topProducts=db.prepare(`SELECT p.id,p.title,COALESCE(SUM(oi.quantity),0) units,COALESCE(SUM(oi.price*oi.quantity),0) sales FROM products p LEFT JOIN order_items oi ON oi.product_id=p.id GROUP BY p.id ORDER BY units DESC,sales DESC LIMIT 20`).all();
  const delivery=db.prepare(`SELECT status,COUNT(*) count FROM delivery_jobs GROUP BY status`).all();
  res.json({generatedAt:new Date().toISOString(),summary,statuses,payments,vendors,topProducts,delivery});
});

router.get('/vendor',requireRole('vendor'),(req,res)=>{
  const vendor=db.prepare('SELECT id,name FROM vendors WHERE user_id=?').get(req.auth!.id) as any;
  if(!vendor)return res.status(404).json({error:'Vendor profile not found'});
  const summary=db.prepare(`SELECT COUNT(*) orders,COALESCE(SUM(subtotal),0) grossSales,COALESCE(SUM(commission_amount),0) commission,COALESCE(SUM(vendor_earnings),0) earnings FROM vendor_orders WHERE vendor_id=?`).get(vendor.id) as any;
  const statuses=db.prepare('SELECT status,COUNT(*) count FROM vendor_orders WHERE vendor_id=? GROUP BY status').all(vendor.id);
  const ledger=db.prepare(`SELECT COALESCE(SUM(CASE WHEN direction='credit' THEN amount ELSE -amount END),0) balance FROM vendor_ledger WHERE vendor_id=?`).get(vendor.id) as any;
  res.json({vendor,summary,statuses,ledgerBalance:Number(ledger?.balance||0),generatedAt:new Date().toISOString()});
});
export default router;
