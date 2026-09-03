const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { URL } = require('url');
let Pool = null;
try { ({ Pool } = require('pg')); } catch {}
let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch {}

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const MAX_BODY = Number(process.env.MAX_BODY_BYTES || 1024 * 1024);
const IS_PROD = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const PAYMENT_MODE = String(process.env.PAYMENT_MODE || 'demo').toLowerCase();
const PAYMENT_PROVIDER = String(process.env.PAYMENT_PROVIDER || 'Razorpay');
const RAZORPAY_KEY_ID = String(process.env.RAZORPAY_KEY_ID || process.env.PAYMENT_KEY_ID || '');
const RAZORPAY_KEY_SECRET = String(process.env.RAZORPAY_KEY_SECRET || process.env.PAYMENT_KEY_SECRET || '');
const RAZORPAY_WEBHOOK_SECRET = String(process.env.RAZORPAY_WEBHOOK_SECRET || '');
const DATABASE_URL = String(process.env.DATABASE_URL || '');
const APP_BASE_URL = String(process.env.APP_BASE_URL || '').replace(/\/$/, '');

const seedProducts = [
  {id:'aero-jacket',name:'AERO JACKET',code:'AERO 001',category:'JACKETS',price:6990,compareAt:7990,description:'Lightweight windproof outerwear engineered for movement.',materials:'Aero-shell nylon, technical mesh lining',colors:['Obsidian Black','Performance Red','Arctic White'],sizes:['S','M','L','XL'],badge:'BESTSELLER',stock:24,active:true,featured:true},
  {id:'struct-hoodie',name:'STRUCT HOODIE',code:'STRUCT 002',category:'HOODIES',price:4990,compareAt:null,description:'Structured heavyweight hoodie with engineered paneling.',materials:'Premium cotton fleece, bonded rib',colors:['Obsidian Black','Titanium'],sizes:['S','M','L','XL'],stock:31,active:true,featured:true},
  {id:'velocity-tee',name:'VELOCITY TEE',code:'VELOCITY 003',category:'SHIRTS',price:2490,compareAt:null,description:'Performance jersey tee with a clean aerodynamic silhouette.',materials:'Technical stretch jersey',colors:['Obsidian Black','Arctic White','Performance Red'],sizes:['S','M','L','XL'],stock:46,active:true,featured:false},
  {id:'titan-pants',name:'TITAN PANTS',code:'TITAN 004',category:'PANTS',price:4990,compareAt:null,description:'Tapered utility trousers built for daily motion.',materials:'Stretch technical twill',colors:['Obsidian Black','Graphite'],sizes:['S','M','L','XL'],stock:18,active:true,featured:true}
];

function freshDb(){ return {users:[], products:seedProducts, carts:{}, addresses:{}, orders:[], sessions:{}, payments:{}, webhookEvents:{}}; }
fs.mkdirSync(DATA_DIR, { recursive:true });
if(!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(freshDb(), null, 2));
function readFileDb(){ try { return JSON.parse(fs.readFileSync(DB_FILE,'utf8')); } catch { const fresh=freshDb(); fs.writeFileSync(DB_FILE,JSON.stringify(fresh,null,2)); return fresh; } }
let db = readFileDb();
let storageReady = false;
let saveQueue = Promise.resolve();
let pgPool = null;

async function initStorage(){
  if(!DATABASE_URL){ storageReady = true; return; }
  if(!Pool) throw new Error('PG_DRIVER_MISSING');
  pgPool = new Pool({connectionString:DATABASE_URL, max:10, ssl: /sslmode=require/i.test(DATABASE_URL) ? {rejectUnauthorized:false} : undefined});
  await pgPool.query(`CREATE TABLE IF NOT EXISTS resemble_state (id INTEGER PRIMARY KEY CHECK (id=1), payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  const r = await pgPool.query('SELECT payload FROM resemble_state WHERE id=1');
  if(r.rows[0]?.payload){ db = {...freshDb(), ...r.rows[0].payload}; }
  else { await pgPool.query('INSERT INTO resemble_state(id,payload) VALUES(1,$1)', [db]); }
  storageReady = true;
}
function saveDb(){
  fs.writeFileSync(DB_FILE+'.tmp', JSON.stringify(db,null,2)); fs.renameSync(DB_FILE+'.tmp',DB_FILE);
  if(pgPool){ saveQueue = saveQueue.then(()=>pgPool.query('UPDATE resemble_state SET payload=$1, updated_at=NOW() WHERE id=1',[db])).catch(err=>console.error('DB_SAVE_ERROR',err)); }
  return saveQueue;
}

function hashPassword(password){const salt=crypto.randomBytes(16).toString('hex');const hash=crypto.scryptSync(password,salt,64).toString('hex');return `${salt}:${hash}`;}
function verifyPassword(password,stored){try{const [salt,hash]=stored.split(':');const a=Buffer.from(hash,'hex');const b=crypto.scryptSync(password,salt,64);return a.length===b.length&&crypto.timingSafeEqual(a,b)}catch{return false}}
function safeUser(u){return u&&{id:u.id,name:u.name,email:u.email,role:u.role||'customer',createdAt:u.createdAt}};
function ensureAdmin(){const email=String(process.env.RESEMBLE_ADMIN_EMAIL||'admin@resemble.local').trim().toLowerCase();const password=String(process.env.RESEMBLE_ADMIN_PASSWORD||'ResembleAdmin123!');let u=db.users.find(x=>x.email===email);if(!u){u={id:'RS-ADMIN',name:'RESEMBLE ADMIN',email,passwordHash:hashPassword(password),role:'admin',createdAt:new Date().toISOString()};db.users.push(u);saveDb();}else if(u.role!=='admin'){u.role='admin';saveDb();}}
function parseCookies(req){const out={};(req.headers.cookie||'').split(';').forEach(p=>{const i=p.indexOf('=');if(i>0)out[p.slice(0,i).trim()]=decodeURIComponent(p.slice(i+1).trim())});return out;}
async function body(req){let raw='';let size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY) throw Object.assign(new Error('BODY_TOO_LARGE'),{code:'BODY_TOO_LARGE'});raw+=chunk}if(!raw)return {};try{return JSON.parse(raw)}catch{return null}}
function json(res,status,payload,headers={}){const body=JSON.stringify(payload);res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(body)}
function text(res,status,body,headers={}){res.writeHead(status,{'Content-Type':'text/plain; charset=utf-8',...headers});res.end(body)}
function bad(res,msg,status=400){return json(res,status,{ok:false,error:msg});}
function sessionUser(req){const token=parseCookies(req).resemble_session;if(!token)return null;const s=db.sessions[token];if(!s)return null;if(Date.now()>s.expiresAt){delete db.sessions[token];saveDb();return null}return db.users.find(u=>u.id===s.userId)||null;}
function requireUser(req,res){const u=sessionUser(req);if(!u){json(res,401,{ok:false,error:'AUTH_REQUIRED'});return null}return u;}
function requireAdmin(req,res){const u=requireUser(req,res);if(!u)return null;if(u.role!=='admin'){json(res,403,{ok:false,error:'ADMIN_REQUIRED'});return null}return u;}
function newSession(res,userId){const token=crypto.randomBytes(32).toString('hex');db.sessions[token]={userId,expiresAt:Date.now()+1000*60*60*24*14};saveDb();const secure=IS_PROD?' Secure':'';res.setHeader('Set-Cookie',`resemble_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=1209600;${secure}`);}
function clearSession(req,res){const token=parseCookies(req).resemble_session;if(token){delete db.sessions[token];saveDb()}res.setHeader('Set-Cookie','resemble_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');}
function sanitizeProduct(p){return {...p,price:Number(p.price||0),compareAt:p.compareAt===''||p.compareAt==null?null:Number(p.compareAt),stock:Number(p.stock||0),active:p.active!==false,featured:!!p.featured};}
function getProduct(id){return db.products.find(p=>p.id===id)}
function validateCartItems(items){if(!Array.isArray(items))return null;const out=[];for(const x of items){const p=getProduct(String(x.id));if(!p||p.active===false)continue;const size=String(x.size||'M');const color=String(x.color||(p.colors&&p.colors[0])||'');if(!(p.sizes||[]).includes(size)||!(p.colors||[]).includes(color))continue;const qty=Math.max(1,Math.min(99,Number(x.qty||1)));out.push({lineId:`${p.id}__${size}__${color}`,id:p.id,name:p.name,price:p.price,size,color,qty});}return out}
function calcTotals(items){const subtotal=items.reduce((n,x)=>n+x.price*x.qty,0);const shipping=subtotal>=5000?0:199;return {subtotal,shipping,total:subtotal+shipping};}
function randomOrderNumber(){return 'RSB#'+Math.floor(10000+Math.random()*90000)}

function razorpayRequest(method, pathname, payload){
  return new Promise((resolve,reject)=>{
    if(!RAZORPAY_KEY_ID||!RAZORPAY_KEY_SECRET) return reject(new Error('RAZORPAY_KEYS_MISSING'));
    const req=https.request({hostname:'api.razorpay.com',path:'/v1'+pathname,method,auth:`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`,headers:{'Content-Type':'application/json'}},res=>{let raw='';res.on('data',c=>raw+=c);res.on('end',()=>{let data;try{data=JSON.parse(raw)}catch{data={raw}};if(res.statusCode>=200&&res.statusCode<300)resolve(data);else{const e=new Error(data?.error?.description||`RAZORPAY_HTTP_${res.statusCode}`);e.status=res.statusCode;e.data=data;reject(e)}})});req.on('error',reject);req.write(JSON.stringify(payload));req.end();
  });
}
function signHmac(payload,secret){return crypto.createHmac('sha256',secret).update(payload).digest('hex')}
function verifyWebhookSignature(raw,signature){if(!RAZORPAY_WEBHOOK_SECRET||!signature)return false;const a=Buffer.from(signHmac(raw,RAZORPAY_WEBHOOK_SECRET),'hex');const b=Buffer.from(String(signature),'hex');return a.length===b.length&&crypto.timingSafeEqual(a,b)}

async function sendOrderEmail(order,user,subject='RESEMBLE ORDER UPDATE'){
  const host=process.env.SMTP_HOST, port=process.env.SMTP_PORT, from=process.env.SMTP_FROM || 'RESEMBLE <no-reply@resemble.local>', smtpUser=process.env.SMTP_USER, smtpPass=process.env.SMTP_PASS;
  if(!host||!user?.email)return {sent:false,reason:'SMTP_NOT_CONFIGURED'};
  if(!nodemailer)return {sent:false,reason:'NODEMAILER_NOT_INSTALLED'};
  const transporter=nodemailer.createTransport({host,port:Number(port||587),secure:String(process.env.SMTP_SECURE||'false')==='true',auth:smtpUser?{user:smtpUser,pass:smtpPass}:undefined});
  await transporter.sendMail({from,to:user.email,subject,text:`RESEMBLE ${subject}\nOrder ${order.number}\nTotal ₹${Number(order.total||0).toLocaleString('en-IN')}\nStatus ${order.status}`});
  return {sent:true};
}
function queueOrderEmail(order,user,subject){sendOrderEmail(order,user,subject).then(result=>{order.notification={...(order.notification||{}),email:user?.email||'',...result,queued:false,updatedAt:new Date().toISOString()};saveDb()}).catch(err=>{order.notification={...(order.notification||{}),email:user?.email||'',sent:false,queued:false,error:err.message,updatedAt:new Date().toISOString()};saveDb();console.error('EMAIL_ERROR',err.message)})}

function serveStatic(req,res){let pathname=new URL(req.url,`http://${req.headers.host}`).pathname;if(pathname==='/')pathname='/index.html';pathname=decodeURIComponent(pathname);const file=path.resolve(ROOT,'.'+pathname);if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory())return text(res,404,'Not found');const ext=path.extname(file).toLowerCase();const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.glb':'model/gltf-binary','.gltf':'model/gltf+json','.ico':'image/x-icon'};res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'});fs.createReadStream(file).pipe(res)}

const server=http.createServer(async (req,res)=>{
  const securityHeaders={
    'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': IS_PROD ? "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://cdn.jsdelivr.net https://api.razorpay.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self';" : "default-src 'self' https://cdn.jsdelivr.net https://checkout.razorpay.com 'unsafe-inline' 'unsafe-eval' data: blob:; object-src 'none';"
  }; Object.entries(securityHeaders).forEach(([k,v])=>res.setHeader(k,v));
  try{
    const u=new URL(req.url,`http://${req.headers.host}`), p=u.pathname;
    if(p.startsWith('/api/')){
      if(req.method==='GET'&&(p==='/api/health'||p==='/health')) return json(res,200,{ok:true,service:'RESEMBLE API',time:new Date().toISOString(),db:pgPool?'postgres':'json',paymentMode:PAYMENT_MODE,storageReady});
      if(req.method==='GET'&&p==='/api/products') return json(res,200,{ok:true,products:db.products});
      if(req.method==='GET'&&p.startsWith('/api/products/')){const item=getProduct(decodeURIComponent(p.split('/').pop()));return item?json(res,200,{ok:true,product:item}):json(res,404,{ok:false,error:'PRODUCT_NOT_FOUND'})}
      if(p==='/api/auth/signup'&&req.method==='POST'){const b=await body(req);if(!b)return bad(res,'INVALID_JSON');const name=String(b.name||'').trim(),email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');if(name.length<2)return bad(res,'INVALID_NAME');if(!/^\S+@\S+\.\S+$/.test(email))return bad(res,'INVALID_EMAIL');if(password.length<8)return bad(res,'WEAK_PASSWORD');if(db.users.some(x=>x.email===email))return bad(res,'ACCOUNT_EXISTS');const user={id:'RS-'+crypto.randomBytes(5).toString('hex').toUpperCase(),name,email,passwordHash:hashPassword(password),role:'customer',createdAt:new Date().toISOString()};db.users.push(user);saveDb();newSession(res,user.id);return json(res,201,{ok:true,user:safeUser(user)})}
      if(p==='/api/auth/login'&&req.method==='POST'){const b=await body(req)||{};const email=String(b.email||'').trim().toLowerCase(),password=String(b.password||'');const user=db.users.find(x=>x.email===email);if(!user||!verifyPassword(password,user.passwordHash))return bad(res,'INVALID_CREDENTIALS',401);newSession(res,user.id);return json(res,200,{ok:true,user:safeUser(user)})}
      if(p==='/api/auth/me'&&req.method==='GET'){return json(res,200,{ok:true,user:safeUser(sessionUser(req))})}
      if(p==='/api/auth/logout'&&req.method==='POST'){clearSession(req,res);return json(res,200,{ok:true})}
      if(p==='/api/account/profile'&&req.method==='PUT'){const user=requireUser(req,res);if(!user)return;const b=await body(req)||{};const name=String(b.name||'').trim();if(name.length<2)return bad(res,'INVALID_NAME');user.name=name;saveDb();return json(res,200,{ok:true,user:safeUser(user)})}
      if(p==='/api/products'&&req.method==='POST'){const user=requireAdmin(req,res);if(!user)return;const b=await body(req);if(!b)return bad(res,'INVALID_JSON');const item=sanitizeProduct(b);if(!item.id||!item.name||!item.code)return bad(res,'MISSING_PRODUCT_FIELDS');if(db.products.some(x=>x.id===item.id))return bad(res,'PRODUCT_EXISTS');db.products.push(item);saveDb();return json(res,201,{ok:true,product:item})}
      if(p.startsWith('/api/products/')&&req.method==='PUT'){const user=requireAdmin(req,res);if(!user)return;const id=decodeURIComponent(p.split('/').pop());const i=db.products.findIndex(x=>x.id===id);if(i<0)return bad(res,'PRODUCT_NOT_FOUND',404);const b=await body(req);db.products[i]=sanitizeProduct({...db.products[i],...b,id});saveDb();return json(res,200,{ok:true,product:db.products[i]})}
      if(p.startsWith('/api/products/')&&req.method==='DELETE'){const user=requireAdmin(req,res);if(!user)return;const id=decodeURIComponent(p.split('/').pop());const i=db.products.findIndex(x=>x.id===id);if(i<0)return bad(res,'PRODUCT_NOT_FOUND',404);db.products.splice(i,1);saveDb();return json(res,200,{ok:true})}
      if(p==='/api/cart'&&req.method==='GET'){const user=requireUser(req,res);if(!user)return;return json(res,200,{ok:true,items:db.carts[user.id]||[]})}
      if(p==='/api/cart'&&req.method==='PUT'){const user=requireUser(req,res);if(!user)return;const b=await body(req);const items=validateCartItems(b?.items);if(!items)return bad(res,'INVALID_CART');db.carts[user.id]=items;saveDb();return json(res,200,{ok:true,items})}
      if(p==='/api/cart'&&req.method==='DELETE'){const user=requireUser(req,res);if(!user)return;db.carts[user.id]=[];saveDb();return json(res,200,{ok:true,items:[]})}
      if(p==='/api/addresses'&&req.method==='GET'){const user=requireUser(req,res);if(!user)return;return json(res,200,{ok:true,addresses:db.addresses[user.id]||[]})}
      if(p==='/api/addresses'&&req.method==='PUT'){const user=requireUser(req,res);if(!user)return;const b=await body(req);if(!Array.isArray(b?.addresses))return bad(res,'INVALID_ADDRESSES');db.addresses[user.id]=b.addresses.slice(0,20);saveDb();return json(res,200,{ok:true,addresses:db.addresses[user.id]})}
      if(p==='/api/orders'&&req.method==='GET'){const user=requireUser(req,res);if(!user)return;return json(res,200,{ok:true,orders:db.orders.filter(o=>o.userId===user.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))})}

      if(p==='/api/payment/config'&&req.method==='GET'){return json(res,200,{ok:true,mode:PAYMENT_MODE,provider:PAYMENT_PROVIDER,currency:'INR',live:PAYMENT_MODE==='live'&&!!RAZORPAY_KEY_ID&&!!RAZORPAY_KEY_SECRET,keyId:RAZORPAY_KEY_ID||null,checkoutScript:'https://checkout.razorpay.com/v1/checkout.js'})}
      if(p==='/api/payment/create'&&req.method==='POST'){
        const user=requireUser(req,res);if(!user)return;const b=await body(req)||{};const amount=Number(b.amount);const method=String(b.method||'');
        if(!Number.isInteger(amount)||amount<=0)return bad(res,'INVALID_AMOUNT');if(!['CARD','UPI','COD'].includes(method))return bad(res,'INVALID_PAYMENT_METHOD');
        if(method==='COD'){const id='COD-'+crypto.randomBytes(5).toString('hex').toUpperCase();db.payments[id]={id,status:'AUTHORIZED',method,amount,mode:'cod',userId:user.id,createdAt:new Date().toISOString()};saveDb();return json(res,200,{ok:true,payment:{id,status:'AUTHORIZED',method,mode:'cod'}})}
        if(PAYMENT_MODE!=='live') {const id='DEMO-'+crypto.randomBytes(6).toString('hex').toUpperCase();db.payments[id]={id,status:'AUTHORIZED',method,amount,mode:'demo',userId:user.id,createdAt:new Date().toISOString()};saveDb();return json(res,200,{ok:true,payment:{id,status:'AUTHORIZED',method,mode:'demo',provider:PAYMENT_PROVIDER}})}
        if(PAYMENT_PROVIDER.toLowerCase()!=='razorpay')return bad(res,'UNSUPPORTED_PAYMENT_PROVIDER',501);
        if(!RAZORPAY_KEY_ID||!RAZORPAY_KEY_SECRET)return bad(res,'RAZORPAY_KEYS_MISSING',503);
        const rpOrder=await razorpayRequest('POST','/orders',{amount:amount*100,currency:'INR',receipt:'resemble_'+crypto.randomUUID().slice(0,8),payment_capture:1});
        db.payments[rpOrder.id]={id:rpOrder.id,status:'CREATED',method,amount,mode:'live',provider:'Razorpay',userId:user.id,razorpayOrderId:rpOrder.id,createdAt:new Date().toISOString()};saveDb();
        return json(res,200,{ok:true,payment:{id:rpOrder.id,status:'CREATED',method,mode:'live',provider:'Razorpay',razorpayOrderId:rpOrder.id,keyId:RAZORPAY_KEY_ID,amount:rpOrder.amount,currency:rpOrder.currency,name:'RESEMBLE',description:'RESEMBLE order'}});
      }
      if(p==='/api/payment/verify'&&req.method==='POST'){
        const user=requireUser(req,res);if(!user)return;const b=await body(req)||{};const rpOrderId=String(b.razorpay_order_id||''),rpPaymentId=String(b.razorpay_payment_id||''),sig=String(b.razorpay_signature||'');if(!rpOrderId||!rpPaymentId||!sig)return bad(res,'PAYMENT_FIELDS_REQUIRED');const pending=db.payments[rpOrderId];if(!pending||pending.userId!==user.id)return bad(res,'PAYMENT_NOT_FOUND',404);if(PAYMENT_MODE!=='live'||pending.mode!=='live')return bad(res,'LIVE_PAYMENT_REQUIRED');const expected=signHmac(`${rpOrderId}|${rpPaymentId}`,RAZORPAY_KEY_SECRET);if(!crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(sig)))return bad(res,'PAYMENT_SIGNATURE_INVALID',400);pending.status='VERIFIED';pending.razorpayPaymentId=rpPaymentId;pending.razorpaySignature=sig;pending.verifiedAt=new Date().toISOString();saveDb();return json(res,200,{ok:true,payment:{id:rpPaymentId,status:'VERIFIED',method:pending.method,mode:'live',provider:'Razorpay',orderId:rpOrderId}});
      }
      if(p==='/api/payment/webhook'&&req.method==='POST'){
        const raw=await new Promise((resolve,reject)=>{let s='';req.on('data',c=>s+=c);req.on('end',()=>resolve(s));req.on('error',reject)});const sig=req.headers['x-razorpay-signature'];if(!verifyWebhookSignature(raw,sig))return bad(res,'INVALID_WEBHOOK_SIGNATURE',401);let evt;try{evt=JSON.parse(raw)}catch{return bad(res,'INVALID_WEBHOOK_JSON')};const eventId=evt?.payload?.payment?.entity?.id || crypto.createHash('sha1').update(raw).digest('hex');if(db.webhookEvents[eventId])return json(res,200,{ok:true,duplicate:true});db.webhookEvents[eventId]={receivedAt:new Date().toISOString(),event:evt.event||'unknown'};const payment=evt?.payload?.payment?.entity;if(payment?.order_id&&db.payments[payment.order_id]){db.payments[payment.order_id].webhookStatus=payment.status;db.payments[payment.order_id].webhookEvent=evt.event||null;db.payments[payment.order_id].updatedAt=new Date().toISOString();}saveDb();return json(res,200,{ok:true});
      }
      if(p==='/api/orders'&&req.method==='POST'){
        const user=requireUser(req,res);if(!user)return;const b=await body(req)||{};const items=validateCartItems(b.items||db.carts[user.id]||[]);if(!items?.length)return bad(res,'EMPTY_CART');for(const x of items){const pdt=getProduct(x.id);if(!pdt||pdt.stock<x.qty)return bad(res,`OUT_OF_STOCK:${x.id}`)}
        const shipping=b.shippingAddress||null;if(!shipping||!shipping.name||!shipping.line1||!shipping.city||!shipping.postal||!shipping.country)return bad(res,'INCOMPLETE_SHIPPING');const totals=calcTotals(items);if(Number(b.shippingFee)!==totals.shipping)return bad(res,'INVALID_SHIPPING_FEE');
        const payment=b.payment||null;if(!payment?.id)return bad(res,'PAYMENT_REQUIRED');const stored=db.payments[payment.id];if(!stored||stored.userId!==user.id)return bad(res,'PAYMENT_NOT_FOUND',400);if(stored.amount!==totals.total)return bad(res,'PAYMENT_AMOUNT_MISMATCH');if(stored.status!=='AUTHORIZED'&&stored.status!=='VERIFIED')return bad(res,'PAYMENT_NOT_VERIFIED');
        if(payment.mode==='live'&&stored.status!=='VERIFIED')return bad(res,'PAYMENT_NOT_VERIFIED');
        for(const x of items){const pdt=getProduct(x.id);pdt.stock-=x.qty}
        const order={id:crypto.randomUUID(),number:randomOrderNumber(),userId:user.id,items,subtotal:totals.subtotal,shippingFee:totals.shipping,total:totals.total,status:'PROCESSING',payment:{...stored,secret:null},shippingAddress:shipping,createdAt:new Date().toISOString(),notification:{email:String(user.email),queued:true}};
        db.orders.push(order);db.carts[user.id]=[];stored.status='COMPLETED';stored.orderId=order.id;saveDb();queueOrderEmail(order,user,'ORDER CONFIRMATION');return json(res,201,{ok:true,order});
      }
      if(p==='/api/admin/stats'&&req.method==='GET'){const admin=requireAdmin(req,res);if(!admin)return;const revenue=db.orders.filter(o=>o.status!=='CANCELLED').reduce((n,o)=>n+Number(o.total||0),0);const lowStock=db.products.filter(x=>x.active!==false&&Number(x.stock||0)<=5).length;const customers=db.users.filter(x=>x.role!=='admin').length;return json(res,200,{ok:true,stats:{products:db.products.length,activeProducts:db.products.filter(x=>x.active!==false).length,lowStock,customers,orders:db.orders.length,revenue}})}
      if(p==='/api/admin/orders'&&req.method==='GET'){const admin=requireAdmin(req,res);if(!admin)return;const orders=db.orders.map(o=>({...o,user:db.users.find(u=>u.id===o.userId)?safeUser(db.users.find(u=>u.id===o.userId)):null})).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));return json(res,200,{ok:true,orders})}
      if(p.startsWith('/api/admin/orders/')&&req.method==='PUT'){const admin=requireAdmin(req,res);if(!admin)return;const id=decodeURIComponent(p.split('/').pop());const order=db.orders.find(o=>o.id===id);if(!order)return bad(res,'ORDER_NOT_FOUND',404);const b=await body(req)||{};const allowed=['PROCESSING','CONFIRMED','PACKED','SHIPPED','DELIVERED','CANCELLED'];const status=String(b.status||'');if(!allowed.includes(status))return bad(res,'INVALID_STATUS');if(order.status!=='CANCELLED'&&status==='CANCELLED'){for(const x of order.items||[]){const pdt=getProduct(x.id);if(pdt)pdt.stock+=Number(x.qty||0)}}order.status=status;order.updatedAt=new Date().toISOString();saveDb();const user=db.users.find(u=>u.id===order.userId);if(user&&['SHIPPED','DELIVERED','CANCELLED'].includes(status))queueOrderEmail(order,user,`ORDER ${status}`);return json(res,200,{ok:true,order})}
      if(p==='/api/admin/users'&&req.method==='GET'){const admin=requireAdmin(req,res);if(!admin)return;return json(res,200,{ok:true,users:db.users.map(u=>safeUser(u))})}
      return json(res,404,{ok:false,error:'API_NOT_FOUND'});
    }
    if(req.method==='GET'&&p==='/favicon.ico')return text(res,204,'');
    return serveStatic(req,res);
  }catch(err){console.error(err);if(err?.code==='BODY_TOO_LARGE')return json(res,413,{ok:false,error:'BODY_TOO_LARGE'});if(String(err.message||'').startsWith('RAZORPAY_'))return json(res,502,{ok:false,error:err.message});return json(res,500,{ok:false,error:'SERVER_ERROR',message:IS_PROD?undefined:err.message})}
});

(async()=>{try{await initStorage();ensureAdmin();server.listen(PORT,HOST,()=>console.log(`RESEMBLE v40 running at http://${HOST}:${PORT} | db=${pgPool?'postgres':'json'} | payment=${PAYMENT_MODE}`));}catch(err){console.error('STARTUP_ERROR',err);process.exit(1)}})();
