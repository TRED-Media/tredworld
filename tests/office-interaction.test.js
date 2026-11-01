import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine} from '../server/engine.js';
import {officeSeats,seatAt} from '../src/office-seats.js';
import {findPath,clearSegment} from '../src/pathfinding.js';
import {SeatController} from '../src/seat-controller.js';
import {appearancePresence} from '../shared/presence.js';
import {standardPixels} from '../src/material-standard.js';
import {blocked} from '../src/world.js';

test('EVERY office chair has a unique cardinal pose, usable hit region and collision-safe path',()=>{
 const e=new Engine();try{const state=e.read(),seats=officeSeats(state.users,state.catalog);assert.equal(seats.length,28);assert.equal(new Set(seats.map(s=>s.id)).size,28);
  for(const seat of seats){assert(seat.direction>=0&&seat.direction<4);assert.equal(seatAt([seat],seat.floor.x,seat.floor.y-12).id,seat.id);const start={x:860,y:455},path=findPath(start,seat.approach);assert(path,'Unreachable '+seat.id);let last=start;for(const next of path){assert(clearSegment(last,next),'Collision crossing '+seat.id);assert(!blocked(next.x,next.y));last=next;}assert(Math.hypot(last.x-seat.approach.x,last.y-seat.approach.y)<.01);assert.equal(e.mutate('dan','seat',{seatId:seat.id},'all-'+seat.id,{position:last}).seat.id,seat.id);}
 }finally{e.close();}
});
test('seat claims validate trusted proximity, serialize occupancy and preserve wallet/inventory/check-in',()=>{
 const e=new Engine();try{const s=e.read(),seat=officeSeats(s.users,s.catalog)[1],before=e.state('dan').me,ctx={position:seat.approach};let n=0;
  const act=(id,p,context=ctx)=>e.mutate(id,'seat',p,'seat-'+(++n),context);
  assert.throws(()=>act('dan',{seatId:seat.id,position:seat.approach},{}),/đi tới ghế/);
  assert.throws(()=>act('dan',{seatId:'unknown'}),/tìm thấy ghế/);
  const claim=act('dan',{seatId:seat.id});assert.equal(claim.seat.id,seat.id);
  assert.throws(()=>act('hai',{seatId:seat.id}),/có người/);
  assert.equal(appearancePresence({animation:'sit',seatId:'forged'},e.state('dan').me).seatId,seat.id);
  assert.equal(appearancePresence({animation:'sit',seatId:seat.id},e.state('hai').me).animation,'idle');
  act('dan',{seatId:null});act('hai',{seatId:seat.id});
  const after=e.state('dan').me;for(const k of ['rc','xp','inventory','equipment','status'])assert.deepEqual(after[k],before[k]);assert.equal(e.state('dan').shifts.length,0);
  e.tx(state=>{state.users.find(u=>u.id==='hai').seat.until=Date.now()-1;return {};});act('dan',{seatId:seat.id});assert.equal(e.publicUser(e.state('dan').me).seatId,seat.id);
 }finally{e.close();}
});
test('manual cancellation invalidates an in-flight claim and releases the late lease',async()=>{
 let resolveClaim;const calls=[],api={request:async()=>({}),action:async(_name,p)=>{calls.push(p);if(p.seatId)return new Promise(resolve=>resolveClaim=resolve);return {ok:true,seat:null};}};
 const c=new SeatController(api),seat={id:'waiting-1',direction:0};const pending=c.claim({x:10,y:10},seat,c.version);while(!resolveClaim)await Promise.resolve();c.leave();resolveClaim({seat:{id:seat.id}});await pending;
 assert.equal(c.seatId,null);assert.deepEqual(calls.at(-1),{seatId:null});assert.equal(c.pending,false);
});
test('one world material conversion is binary-alpha, bounded and idempotent',()=>{
 const pixels=new Uint8ClampedArray([123,42,83,252,22,25,31,127,243,188,156,255]);standardPixels(pixels);const first=[...pixels];standardPixels(pixels);assert.deepEqual([...pixels],first);assert.equal(pixels[3],255);assert.equal(pixels[7],0);assert.equal(pixels[11],255);
});

test('navigation reaches every seat across fractional frame times without diagonal corner drift',async()=>{
 const e=new Engine();try{const state=e.read();for(const seat of officeSeats(state.users,state.catalog)){
  const messages=[],api={request:async()=>({}),action:async(_name,p)=>({seat:p.seatId?{id:p.seatId}:null})},c=new SeatController(api,message=>messages.push(message));let p={x:860,y:455};assert(c.navigate(seat,p));
  for(let frame=0;frame<3000&&!c.pending&&c.target;frame++){const next=c.step(p,.008+(frame%17)*.00137,frame*16);if(next){assert(!blocked(next.x,next.y));p=next;}}
  for(let n=0;n<5;n++)await Promise.resolve();assert.equal(c.seatId,seat.id,seat.id+': '+messages.join(', '));assert(Math.hypot(p.x-seat.approach.x,p.y-seat.approach.y)<.1);
 }}finally{e.close();}
});
