import crypto from 'crypto';
import db from './db';

const DELIVERI_API_URL = process.env.DELIVERI_API_URL || '';
const TRADEEASE_TO_DELIVERI_SECRET = process.env.TRADEEASE_TO_DELIVERI_SECRET || process.env.TRADEEASE_WEBHOOK_SECRET || '';
function signPayload(rawBody:string, secret:string){return crypto.createHmac('sha256',secret).update(rawBody).digest('hex');}
export interface DeliveriFulfilmentResult { deliveryId:string; trackingNumber:string; qrCodeToken:string; status:string; estimatedDeliveryFee:number; }

function scheduleRetry(id:string,attempts:number,error:string,status:number|null){const delay=Math.min(3600,30*Math.pow(2,Math.max(0,attempts-1))); db.prepare(`UPDATE deliveri_outbox SET status='retrying',next_attempt_at=datetime('now',?),last_error=?,http_status=? WHERE id=?`).run(`+${delay} seconds`,error.slice(0,1000),status,id);}

async function sendOutboxRow(row:any):Promise<DeliveriFulfilmentResult|null>{
  if(!DELIVERI_API_URL||!TRADEEASE_TO_DELIVERI_SECRET) return null;
  const attempts=Number(row.attempts||0)+1; db.prepare(`UPDATE deliveri_outbox SET attempts=?,status='sending' WHERE id=?`).run(attempts,row.id);
  const signature=signPayload(row.payload_json,TRADEEASE_TO_DELIVERI_SECRET);
  try{
    const res=await fetch(`${DELIVERI_API_URL.replace(/\/$/,'')}/api/webhooks/tradeease/orders`,{method:'POST',headers:{'Content-Type':'application/json','X-TradeEase-Signature':signature,'X-TradeEase-Event-Id':row.event_id,'X-TradeEase-Event-Type':row.event_type,'X-TradeEase-Spec-Version':'1.1','X-TradeEase-Provider-Code':'DELIVERI'},body:row.payload_json,signal:AbortSignal.timeout(7000)});
    const body=await res.json().catch(()=>({}));
    if(!res.ok){scheduleRetry(row.id,attempts,`DELIVERI responded with HTTP ${res.status}`,res.status);return null;}
    db.prepare(`UPDATE deliveri_outbox SET status='sent',sent_at=datetime('now'),http_status=?,last_error=NULL WHERE id=?`).run(res.status,row.id);
    return body as DeliveriFulfilmentResult;
  }catch(e:any){scheduleRetry(row.id,attempts,e?.message||'Network error',null);return null;}
}

export async function processDeliveriOutbox(limit=20){
  if(!DELIVERI_API_URL||!TRADEEASE_TO_DELIVERI_SECRET)return;
  const rows=db.prepare(`SELECT * FROM deliveri_outbox WHERE status IN ('pending','retrying') AND (next_attempt_at IS NULL OR next_attempt_at<=datetime('now')) ORDER BY created_at LIMIT ?`).all(limit) as any[];
  for(const row of rows) await sendOutboxRow(row);
}

export function startDeliveriOutboxWorker(){
  db.prepare(`UPDATE deliveri_outbox SET status='retrying',next_attempt_at=datetime('now'),last_error=COALESCE(last_error,'Recovered after TradeEase restart') WHERE status='sending'`).run();
  const timer=setInterval(()=>processDeliveriOutbox().catch(e=>console.error('[deliveri-outbox]',e)),Number(process.env.DELIVERI_OUTBOX_INTERVAL_MS||10000)); (timer as any).unref?.(); return timer;
}

export async function sendOrderToDeliveri(order:{orderId:string;fulfillmentId?:string;vendorOrderId?:string;vendorId?:string;orderNumber?:string;buyerName:string;buyerPhone?:string;deliveryAddress:string;city?:string;state?:string;vendorName?:string;packageDescription?:string;packageWeight?:number;packageValue:number;deliveryFee:number;paymentMethod?:string;paymentStatus?:string;deliveryInstructions?:string;}):Promise<DeliveriFulfilmentResult|null>{
  if(!DELIVERI_API_URL){console.warn('[deliveri] DELIVERI_API_URL is not configured');return null;}
  if(!TRADEEASE_TO_DELIVERI_SECRET){console.error('[deliveri] TRADEEASE_TO_DELIVERI_SECRET is not configured');return null;}
  const eventId=`evt_${crypto.randomUUID()}`; const fulfillmentId=String(order.fulfillmentId||order.vendorOrderId||order.orderId);
  const payload={specVersion:'1.1',eventId,eventType:'order.fulfillment_requested',source:'TradeEase',occurredAt:new Date().toISOString(),providerCode:'DELIVERI',data:{providerCode:'DELIVERI',fulfillmentId,orderId:order.orderId,orderNumber:order.orderNumber||order.orderId,vendorId:order.vendorId||null,vendorOrderId:order.vendorOrderId||null,buyerName:order.buyerName,buyerPhone:order.buyerPhone||null,deliveryAddress:order.deliveryAddress,city:order.city||null,state:order.state||null,vendorName:order.vendorName||null,packageDescription:order.packageDescription||null,packageWeight:Number(order.packageWeight||0),packageValue:Number(order.packageValue||0),deliveryFee:Number(order.deliveryFee||0),paymentMethod:order.paymentMethod||'Cash on Delivery',paymentStatus:order.paymentStatus||'Pending',deliveryInstructions:order.deliveryInstructions||null}};
  const id=`DEO-${eventId.slice(4)}`; db.prepare(`INSERT INTO deliveri_outbox(id,event_id,event_type,fulfillment_id,order_id,payload_json,status,next_attempt_at) VALUES(?,?,?,?,?,?,?,datetime('now'))`).run(id,eventId,'order.fulfillment_requested',fulfillmentId,order.orderId,JSON.stringify(payload),'pending');
  const row=db.prepare('SELECT * FROM deliveri_outbox WHERE id=?').get(id) as any; return sendOutboxRow(row);
}
