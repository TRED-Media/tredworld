import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGameServer} from '../server/index.js';
import {Engine} from '../server/engine.js';
import {withCloudEngine} from '../server/cloud-store.js';
import {officeSeats} from '../src/office-seats.js';

test('HTTP seat actions use server presence and allow only one occupant across sessions',async()=>{
 const temp=mkdtempSync(join(tmpdir(),'tred-seat-api-')),{server,engine,streams}=createGameServer({dbPath:join(temp,'fixture.sqlite')});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/api/`;
 const call=(path,body,cookie,key)=>fetch(base+path,{method:body?'POST':'GET',headers:{...(cookie?{cookie}:{}),...(body?{'Content-Type':'application/json'}:{}),...(key?{'Idempotency-Key':key}:{})},...(body?{body:JSON.stringify(body)}:{})});
 try{
  const login=async id=>(await call('login',{id,password:'tred-demo-2026'})).headers.get('set-cookie').split(';')[0],a=await login('dan'),b=await login('hai'),s=engine.read(),seat=officeSeats(s.users,s.catalog)[1],before=engine.state('dan');
  assert.equal((await call('action/seat',{seatId:seat.id,position:seat.approach},a,'forged-position')).status,400);
  for(const cookie of [a,b])assert.equal((await call('position',{...seat.approach,animation:'idle'},cookie)).status,200);
  const results=await Promise.all([call('action/seat',{seatId:seat.id},a,'a-claim'),call('action/seat',{seatId:seat.id},b,'b-claim')]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  const winner=results[0].status===200?'dan':'hai',cookie=winner==='dan'?a:b;
  await call('position',{...seat.approach,animation:'sit',seatId:'forged-seat'},cookie);
  const events=await fetch(base+'events',{headers:{cookie:a}}),reader=events.body.getReader(),chunk=new TextDecoder().decode((await reader.read()).value),world=JSON.parse(chunk.match(/data: (.+)\n/)[1]);assert.equal(world.users.find(u=>u.id===winner).seatId,seat.id);await reader.cancel();
  assert.equal(engine.publicUser(engine.state(winner).me).seatId,seat.id);
  await call('action/seat',{seatId:null},cookie,'stand');assert.equal(engine.publicUser(engine.state(winner).me).seatId,null);
  for(const field of ['xp','rc','inventory','equipment'])assert.deepEqual(engine.state('dan').me[field],before.me[field]);assert.equal(engine.state('dan').shifts.length,0);
 }finally{for(const s of streams)s.res.end();server.closeAllConnections();await new Promise(r=>server.close(r));rmSync(temp,{recursive:true,force:true});}
});

test('cloud CAS retries seat contention without double booking or economy side effects',async()=>{
 const seed=new Engine();let state=seed.read(),revision=1;seed.close();const seat=officeSeats(state.users,state.catalog)[2];
 const bridge=async(operation,payload={})=>{if(operation==='read')return {state:structuredClone(state),revision};if(operation==='commit'){if(payload.revision!==revision)return {committed:false};state=structuredClone(payload.state);revision++;return {committed:true};}throw Error('Unexpected bridge operation');};
 const requests=['dan','hai'].map(id=>withCloudEngine(e=>e.mutate(id,'seat',{seatId:seat.id},'cloud-seat-'+id,{position:seat.approach}),{write:true,bridge}));
 const results=await Promise.allSettled(requests);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.status,409);assert.equal(state.users.filter(u=>u.seat?.id===seat.id).length,1);
 assert.equal(state.users.find(u=>u.id==='dan').rc,120);assert.equal(state.users.find(u=>u.id==='hai').xp,0);assert.equal(state.transactions.filter(t=>t.kind==='checkin').length,0);
});
