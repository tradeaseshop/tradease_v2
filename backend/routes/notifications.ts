import { Router } from 'express';
import db from '../db';
import { requireAuth } from '../auth';

const router = Router();

router.get('/', requireAuth, (req,res)=>{
  const rows=db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 100').all(req.auth!.id) as any[];
  res.json(rows.map(r=>({id:r.id,title:r.title,message:r.message,type:r.type,data:r.data?JSON.parse(r.data):null,isRead:!!r.is_read,createdAt:r.created_at})));
});
router.put('/:id/read', requireAuth, (req,res)=>{
  const info=db.prepare('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?').run(req.params.id,req.auth!.id);
  if(!info.changes)return res.status(404).json({error:'Notification not found'});
  res.json({success:true});
});
router.put('/read-all', requireAuth, (req,res)=>{ db.prepare('UPDATE notifications SET is_read=1 WHERE user_id=?').run(req.auth!.id); res.json({success:true}); });
router.delete('/:id', requireAuth, (req,res)=>{ const info=db.prepare('DELETE FROM notifications WHERE id=? AND user_id=?').run(req.params.id,req.auth!.id); if(!info.changes)return res.status(404).json({error:'Notification not found'}); res.json({success:true}); });
export default router;
