import http from 'node:http';
import {readFileSync,existsSync,mkdirSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Engine,GameError} from './engine.js';
import {blocked} from '../src/world.js';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
export function createGameServer({dbPath=resolve(root,'data/game.sqlite')}={}){
 if(dbPath!==':memory:')mkdirSync(resolve(dbPath,'..'),{recursive:true});
 const engine=new Engine(dbPath),streams=new Set(),positions=new Map(),attempts=new Map();
 const cookie=req=>String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('tred_session='))?.slice(13);
 const snapshot=()=>({users:engine.read().users.filter(u=>u.active).map(u=>({...engine.publicUser(u),...(positions.get(u.id)||{}),online:[...streams].some(s=>s.id===u.id)}))});
 let closed=false;
 const broadcast=()=>{if(closed)return;const data=JSON.stringify(snapshot());for(const s of streams)s.res.write(`event: world\ndata: ${data}\n\n`);};
 const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost'),path=url.pathname;
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 try{
 if(!path.startsWith('/api/')){let file=resolve(root,'dist','.'+decodeURIComponent(path));if(!file.startsWith(resolve(root,'dist')+'/'))file=resolve(root,'dist/index.html');if(!existsSync(file)||statSync(file).isDirectory())file=resolve(root,'dist/index.html');if(!existsSync(file))return json(404,{error:'Run npm run build first'});res.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'}[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});return res.end(readFileSync(file));}
 if(req.method==='POST'&&req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)throw new GameError('Origin không hợp lệ',403);
 let body={};if(req.method==='POST'){let raw='',size=0;for await(const chunk of req){size+=chunk.length;if(size>800000)throw new GameError('Yêu cầu quá lớn',413);raw+=chunk;}try{body=JSON.parse(raw||'{}');if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();}catch{throw new GameError('JSON không hợp lệ');}}
 if(path==='/api/health')return json(200,{ok:true,storage:'SQLite',realtime:'SSE',mode:'local-demo'});
 if(path==='/api/login'&&req.method==='POST'){const ip=req.socket.remoteAddress;let a=attempts.get(ip);if(!a||Date.now()-a.at>60000){a={at:Date.now(),count:0};attempts.set(ip,a);}if(++a.count>20)throw new GameError('Thử đăng nhập quá nhiều, chờ một phút',429);const token=engine.login(body.id,body.password);res.setHeader('Set-Cookie',`tred_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${process.env.COOKIE_SECURE==='1'?'; Secure':''}`);return json(200,{ok:true});}
 const token=cookie(req),id=engine.auth(token);
 if(path==='/api/logout'&&req.method==='POST'){engine.logout(token);for(const s of streams)if(s.token===token){s.res.end();streams.delete(s);}res.setHeader('Set-Cookie','tred_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(200,{ok:true});}
 if(path==='/api/state'&&req.method==='GET')return json(200,engine.state(id));
 if(path==='/api/admin'&&req.method==='GET')return json(200,engine.admin(id));
 if(path==='/api/events'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});const stream={id,token,res};streams.add(stream);broadcast();req.on('close',()=>{streams.delete(stream);broadcast();});return;}
 if(path==='/api/position'&&req.method==='POST'){const {x,y,animation}=body;if(!Number.isFinite(x)||!Number.isFinite(y)||blocked(x,y))throw new GameError('Vị trí không hợp lệ');const old=positions.get(id);if(old&&Math.hypot(x-old.position.x,y-old.position.y)>Math.max(80,(Date.now()-old.at)*.3))throw new GameError('Di chuyển quá nhanh');positions.set(id,{position:{x,y},animation:['idle','walk','sit','interact','emote'].includes(animation)?animation:'idle',at:Date.now()});broadcast();return json(200,{ok:true});}
 if(path.startsWith('/api/action/')&&req.method==='POST'){const result=engine.mutate(id,path.split('/').pop(),body,String(req.headers['idempotency-key']||''));broadcast();for(const stream of streams)stream.res.write('event: changed\ndata: {}\n\n');return json(200,result);}
 return json(404,{error:'Không có endpoint này'});
 }catch(e){json(e.status||500,{error:e instanceof GameError?e.message:'Lỗi server, thao tác chưa hoàn tất'});if(!(e instanceof GameError))console.error(e);}
 });
 const heartbeat=setInterval(()=>{for(const s of streams){try{engine.auth(s.token);s.res.write(': heartbeat\n\n');}catch{s.res.end();streams.delete(s);}}},15000);heartbeat.unref();server.on('close',()=>{closed=true;clearInterval(heartbeat);engine.close();});return {server,engine,streams};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const {server}=createGameServer({dbPath:process.env.GAME_DB||resolve(root,'data/game.sqlite')});const port=Number(process.env.PORT||3001);server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`T-RED local server http://${process.env.HOST||'127.0.0.1'}:${port}`));}
