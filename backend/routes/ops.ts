import { Router } from 'express';
import db from '../db';
import { requireAdminLevel } from '../auth';
const router=Router();
router.get('/health',(_req,res)=>{try{const row=db.prepare('SELECT 1 AS ok').get() as any;res.json({status:row?.ok===1?'ok':'degraded',database:row?.ok===1?'ok':'error',timestamp:new Date().toISOString(),environment:process.env.NODE_ENV||'development'});}catch{res.status(503).json({status:'degraded',database:'error'});}});
router.get('/readiness',requireAdminLevel(),(_req,res)=>{const tables=['users','vendors','products','orders','vendor_orders','vendor_ledger','delivery_jobs','notifications','refunds','audit_logs'];const missing=tables.filter(t=>{try{db.prepare(`SELECT 1 FROM ${t} LIMIT 1`).get();return false}catch{return true}});if(missing.length)return res.status(503).json({ready:false,missing});res.json({ready:true,missing:[]});});
router.get('/runtime',requireAdminLevel(),(_req,res)=>res.json({node:process.version,environment:process.env.NODE_ENV||'development',demoSeedAllowed:process.env.ALLOW_DEMO_SEED==='true',testMode:!!(db.prepare('SELECT test_mode FROM platform_settings WHERE id=1').get() as any)?.test_mode,paystackConfigured:!!process.env.PAYSTACK_SECRET_KEY,deliveriConfigured:!!process.env.DELIVERI_API_KEY,deliveriWebhookConfigured:!!process.env.DELIVERI_WEBHOOK_SECRET,geminiConfigured:!!process.env.GEMINI_API_KEY,databasePath:process.env.DATABASE_PATH||'backend/tradease.db'}));
export default router;
