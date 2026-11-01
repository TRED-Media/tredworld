import {appearancePresence} from '../shared/presence.js';
import {withCloudEngine,rpc} from '../server/cloud-store.js';
import {GameError} from '../server/engine.js';
import {createHash} from 'node:crypto';
import {blocked} from '../src/world.js';
export default async function handler(req,res){
 const send=(status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));};
 try{
  const url=new URL(req.url,'https://'+req.headers.host);const path=url.searchParams.get('route')||url.pathname.replace(/^\/api\//,'');
  if(req.method==='POST'&&req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)throw new GameError('Origin không hợp lệ',403);
  let body=req.body||{};if(typeof body==='string'){try{body=JSON.parse(body);}catch{throw new GameError('JSON không hợp lệ');}}
  if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>800000)throw new GameError('Yêu cầu không hợp lệ',413);
  const token=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('tred_session='))?.slice(13);
  if(path==='health'){const snapshot=await rpc('read');return send(200,{ok:true,storage:'Supabase Postgres',transport:'poll',revision:snapshot.revision,initialized:!!snapshot.state});}
  if(path==='login'&&req.method==='POST'){
   const key=createHash('sha256').update(String(req.headers['x-forwarded-for']||'unknown')).digest('hex');
   if(!(await rpc('login_limit',{key})).allowed)throw new GameError('Thử đăng nhập quá nhiều, chờ một phút',429);
   const session=await withCloudEngine(e=>e.login(body.id,body.password),{write:true});
   res.setHeader('Set-Cookie',`tred_session=${session}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`);return send(200,{ok:true});
  }
  if(path==='logout'&&req.method==='POST'){const id=await withCloudEngine(e=>{const id=e.auth(token);e.logout(token);return id;},{write:true});await rpc('offline',{id});res.setHeader('Set-Cookie','tred_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');return send(200,{ok:true});}
  if(path==='state'&&req.method==='GET')return send(200,await withCloudEngine(e=>e.state(e.auth(token))));
  if(path==='admin'&&req.method==='GET')return send(200,await withCloudEngine(e=>e.admin(e.auth(token))));
  if(path.startsWith('action/')&&req.method==='POST'){
   const presence=path==='action/seat'&&body.seatId!==null?await rpc('world'):[];
   return send(200,await withCloudEngine(e=>{const id=e.auth(token);return e.mutate(id,path.slice(7),body,String(req.headers['idempotency-key']||''),{position:presence.find(p=>p.id===id)?.position,onlineIds:presence.map(p=>p.id)});},{write:true}));
  }
  if(path==='world'&&req.method==='GET'){
   const data=await withCloudEngine((e,revision)=>({users:e.state(e.auth(token)).users,revision}));const presence=await rpc('world');
   return send(200,{users:data.users.map(u=>({...u,...presence.find(p=>p.id===u.id),...appearancePresence(presence.find(p=>p.id===u.id)||{},u),online:presence.some(p=>p.id===u.id)})),revision:data.revision});
  }
  if(path==='position'&&req.method==='POST'){
   const user=await withCloudEngine(e=>e.publicUser(e.state(e.auth(token)).me));
   if(!Number.isFinite(body.x)||!Number.isFinite(body.y)||blocked(body.x,body.y))throw new GameError('Vị trí không hợp lệ');
   await rpc('presence',{...user,position:{x:body.x,y:body.y},...appearancePresence(body,user)});return send(200,{ok:true});
  }
  throw new GameError('Không có endpoint này',404);
 }catch(error){return send(error.status||500,{error:error instanceof GameError?error.message:'Lỗi cloud server. Vui lòng thử lại.'});}
}
