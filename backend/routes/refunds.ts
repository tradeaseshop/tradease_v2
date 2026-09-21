import { Router } from 'express';
import { randomUUID } from 'crypto';
import db from '../db';
import { requireRole } from '../auth';
import { notifyUser } from '../notifications';
import { audit } from '../audit';

const router=Router();
const allowed=['Requested','Under Review','Approved','Rejected','Processed'] as const;

router.get('/',requireRole('admin'),(_req,res)=>{
  const rows=db.prepare(`SELECT r.*,o.buyer_name,o.payment_status,o.payment_reference FROM refunds r JOIN orders o ON o.id=r.order_id ORDER BY r.created_at DESC`).all();
  res.json(rows);
});
router.get('/mine',requireRole('buyer','vendor'),(req,res)=>{
  const rows=db.prepare(`SELECT r.*,o.buyer_name,o.buyer_id FROM refunds r JOIN orders o ON o.id=r.order_id WHERE o.buyer_id=? ORDER BY r.created_at DESC`).all(req.auth!.id);
  res.json(rows);
});
router.post('/',requireRole('buyer'),(req,res)=>{
  const {orderId,reason,amount}=req.body||{};
  const order=db.prepare('SELECT * FROM orders WHERE id=? AND buyer_id=?').get(orderId,req.auth!.id) as any;
  if(!order)return res.status(404).json({error:'Order not found'});
  if(!['Paid','Delivered'].includes(order.payment_status)||order.status==='Cancelled')return res.status(400).json({error:'This order is not eligible for a refund request'});
  const existing=db.prepare("SELECT id FROM refunds WHERE order_id=? AND status NOT IN ('Rejected')").get(orderId);
  if(existing)return res.status(409).json({error:'A refund request already exists for this order'});
  const requested=Math.min(order.total_amount,Number(amount)||order.total_amount);
  const id=`RF-${randomUUID().slice(0,8).toUpperCase()}`;
  db.prepare('INSERT INTO refunds (id,order_id,requested_amount,approved_amount,status,reason,created_at) VALUES (?,?,?,?,?,?,datetime(\'now\'))').run(id,orderId,requested,null,'Requested',String(reason||'Customer refund request').slice(0,1000));
  notifyUser(req.auth!.id,'Refund request received',`Your refund request for order ${orderId} has been received.`,'refund',{orderId,refundId:id});
  res.status(201).json(db.prepare('SELECT * FROM refunds WHERE id=?').get(id));
});
router.put('/:id/status',requireRole('admin'),(req,res)=>{
  const {status,approvedAmount,notes}=req.body||{};
  if(!allowed.includes(status))return res.status(400).json({error:'Invalid refund status'});
  const r=db.prepare('SELECT * FROM refunds WHERE id=?').get(req.params.id) as any;
  if(!r)return res.status(404).json({error:'Refund not found'});
  const amount=status==='Approved'||status==='Processed' ? Math.min(r.requested_amount,Math.max(0,Number(approvedAmount??r.requested_amount))) : r.approved_amount;
  db.prepare(`UPDATE refunds SET status=?,approved_amount=?,notes=?,processed_at=CASE WHEN ?='Processed' THEN datetime('now') ELSE processed_at END,processed_by=? WHERE id=?`).run(status,amount,notes||r.notes,status,req.auth!.id,req.params.id);
  audit(req,'refund.status.update','refund',r.id,{status,approvedAmount:amount});
  const order=db.prepare('SELECT buyer_id FROM orders WHERE id=?').get(r.order_id) as any;
  if(order?.buyer_id)notifyUser(order.buyer_id,`Refund ${status}`,`Refund request ${r.id} is now ${status.toLowerCase()}.`,'refund',{orderId:r.order_id,refundId:r.id});
  res.json(db.prepare('SELECT * FROM refunds WHERE id=?').get(req.params.id));
});
export default router;
