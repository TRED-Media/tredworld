import test from 'node:test';
import assert from 'node:assert/strict';
import {atlasRules,wearableRules,wearableBox,wardrobeSlots,vehicleRules,validateArtSpec,visualKey,FrameCache,animationPose} from '../src/asset-rules.js';
import {containRect} from '../src/sprite-fit.js';

test('each wearable inherits a finite four-direction fit and compatible atlas row',()=>{
 for(const slot of wardrobeSlots)for(let direction=0;direction<4;direction++){
  const box=wearableBox(slot,direction);
  assert(Object.values(box).every(Number.isFinite));assert(box.w>0&&box.h>0);
  assert(wearableRules[slot].row<atlasRules['wearables-cardinal'].rows);
  for(const [w,h] of [[11,45],[45,11],[31,31]]){
   const fitted=containRect(w,h,box.x,box.y,box.w,box.h,1);
   assert(Math.abs(fitted.w/fitted.h-w/h)<1e-9);
   assert(Math.abs(fitted.y+fitted.h-box.y-box.h)<1e-9);
  }
 }
});
test('new art specs reject invalid bounds and inherit a real cardinal grid',()=>{
 const valid={atlas:'new-clothes',columns:4,rows:2,column:0,row:1,directional:true};
 assert.equal(validateArtSpec(valid),valid);
 for(const bad of [{...valid,row:2},{...valid,column:-1},{...valid,columns:3},{...valid,atlas:'../bad'},{...valid,rows:NaN}])assert.throws(()=>validateArtSpec(bad));
});
test('appearance cache keys include actual palette and art, with bounded LRU retention',()=>{
 const item={category:'shirt',variant:0,tier:0,color:'#123456'};
 assert.notEqual(visualKey(item),visualKey({...item,color:'#abcdef'}));
 assert.notEqual(visualKey(item),visualKey({...item,art:{atlas:'other'}}));
 const cache=new FrameCache(2);cache.set('a',1).set('b',2);assert.equal(cache.get('a'),1);cache.set('c',3);
 assert.equal(cache.size,2);assert.equal(cache.has('b'),false);
});
test('animation takes absolute time ticks and seated poses do not inherit walking bob',()=>{
 assert.deepEqual(animationPose(8,true,'sit'),{bob:0,seated:true,step:0});
 assert.deepEqual(animationPose(8,true,'drive'),{bob:0,seated:true,step:0});
 for(const invalid of [NaN,Infinity])assert(Number.isFinite(animationPose(invalid,true).bob));
 for(const rule of Object.values(vehicleRules))assert.equal(new Set(rule.angles).size,4);
});
test('invalid sprite sizes cannot propagate NaN transforms into the renderer',()=>{
 for(const size of [0,-1,NaN,Infinity])assert.throws(()=>containRect(size,20,0,0,40,40));
});

test('car mounts constrain the driver to an interior windshield and upper-body crop',async()=>{
 const {validateVehicleMount,vehicleMount,actorRig}=await import('../src/asset-rules.js');
 const mount=vehicleRules.car.mount;
 assert.equal(validateVehicleMount(mount),mount);
 assert(mount.portrait.bottom<=actorRig.waist);
 assert.throws(()=>validateVehicleMount({...mount,portrait:{top:-61,bottom:0}}));
 assert.throws(()=>validateVehicleMount({...mount,seat:[.5,.1]}));
 assert.throws(()=>validateVehicleMount({...mount,window:[[0,0],[1,0],[NaN,1]]}));
 assert.throws(()=>vehicleMount({kind:'car',art:{atlas:'new-car'}}));
 assert.equal(vehicleMount({kind:'car',art:{atlas:'new-car',mount}}),mount);
});
