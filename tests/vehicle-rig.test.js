import test from 'node:test';import assert from 'node:assert/strict';
import {vehicleProfile,riderPose,validateRider,riderTypes} from '../src/vehicle-rig.js';
const kinds=['bike','bike','bike','scooter','scooter','scooter','motorbike','motorbike','motorbike'];
const rect={x:-20,y:-34,w:40,h:68};
test('all models keep their native forward axis aligned with the four movement directions',()=>{
 for(let variant=0;variant<9;variant++)for(let direction=0;direction<4;direction++){
  const pose=riderPose({kind:kinds[variant],variant},rect,direction);
  const expected=[[0,1],[0,-1],[-1,0],[1,0]][direction];
  assert(Math.hypot(pose.forward[0]-expected[0],pose.forward[1]-expected[1])<1e-8);
  for(const part of pose.parts)for(const point of Object.values(part))assert(point.every(Number.isFinite));
 }
});
test('cycling changes pedal contacts while hips and hands remain attached',()=>{
 const vehicle={kind:'bike',variant:0};
 const stopped=riderPose(vehicle,rect,3,0,false),stationary=riderPose(vehicle,rect,3,14,false);
 assert.deepEqual(stopped.feet,stationary.feet);
 const a=riderPose(vehicle,rect,3,7,true),b=riderPose(vehicle,rect,3,21,true);
 assert.notDeepEqual(a.feet,b.feet);assert.deepEqual(a.hip,b.hip);assert.deepEqual(a.grips,b.grips);
});
test('model-specific profiles and future overrides use a shared validated rig',()=>{
 const profiles=kinds.map((kind,variant)=>vehicleProfile({kind,variant}).rider);
 assert.equal(new Set(profiles.map(p=>JSON.stringify(p))).size,9);
 assert.equal(vehicleProfile({kind:'bike',variant:0,rig:{w:70,h:110},rider:{seat:[.5,.7]}}).w,70);
 assert.throws(()=>validateRider({...riderTypes.bike,grips:[[NaN,.3],[.8,.3]]}));
 assert.throws(()=>vehicleProfile({kind:'bike',variant:0,rig:{w:-1}}));
});
