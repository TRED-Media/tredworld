import test from 'node:test';import assert from 'node:assert/strict';import {PresenceMotion} from '../src/presence-motion.js';
test('remote mount and actor share a monotonic interpolated root',()=>{
 const motion=new PresenceMotion();motion.sample({id:'r',position:{x:0,y:0},facing:3},0);
 const user={id:'r',position:{x:100,y:0},facing:3,moving:true};
 motion.sample(user,500);assert.equal(motion.sample(user,750).x,50);assert.equal(motion.sample(user,1000).x,100);
 assert.equal(motion.sample({...user,facing:1,moving:false},1100).direction,1);
});
test('missed corner packets follow cardinal legs and rotate at the corner',()=>{
 const motion=new PresenceMotion();motion.sample({id:'r',position:{x:0,y:0}},0);
 const user={id:'r',position:{x:100,y:100},facing:3};motion.sample(user,1000);
 assert.deepEqual(motion.sample(user,1250),{x:0,y:50,direction:0,moving:true});
 assert.deepEqual(motion.sample(user,1750),{x:50,y:100,direction:3,moving:true});
});
test('teleports snap, turn-in-place is immediate, and departed actors are released',()=>{
 const motion=new PresenceMotion();motion.sample({id:'r',position:{x:0,y:0}},0);
 assert.equal(motion.sample({id:'r',position:{x:1000,y:0},facing:2},1000).x,1000);
 assert.equal(motion.sample({id:'r',position:{x:1000,y:0},facing:1},1200).direction,1);
 motion.retain([]);assert.equal(motion.tracks.size,0);
});
