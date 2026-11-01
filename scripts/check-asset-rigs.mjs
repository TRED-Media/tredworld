import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {wearRegions} from '../src/wear-regions.js';
import {atlasRegions} from '../src/atlas-regions.js';
import {directions,vehicleMount} from '../src/asset-rules.js';
import {catalog} from '../shared/catalog.js';
import {vehicleProfile,riderPose} from '../src/vehicle-rig.js';

assert.deepEqual(directions,['front','back','left','right'],'Keep the shipped cardinal order; map external skills explicitly');
const dimensions=file=>{const b=readFileSync(new URL('../public/art/'+file+'.png',import.meta.url));return [b.readUInt32BE(16),b.readUInt32BE(20)];};
function checkRegions(file,regions){const [width,height]=dimensions(file);for(const [x,y,w,h] of regions){assert([x,y,w,h].every(Number.isInteger),`${file}: use native integer source rectangles`);assert(x>=0&&y>=0&&w>0&&h>0&&x+w<=width&&y+h<=height,`${file}: a sprite extends beyond its master`);}}
for(const [slot,regions] of Object.entries(wearRegions)){assert.equal(regions.length,20);checkRegions('wear-'+slot,regions);}
for(const slot of ['vehicle','pet'])checkRegions(slot+'-atlas',atlasRegions[slot]);
const vehicles=catalog.filter(v=>v.category==='vehicle'&&v.tier===0);
assert.equal(vehicles.length,12);
for(const vehicle of vehicles){
 const profile=vehicleProfile(vehicle);assert.equal(profile.angles.length,4);
 if(vehicle.kind==='car'){vehicleMount(vehicle);continue;}
 const rect={x:-profile.w/2,y:-profile.h/2,w:profile.w,h:profile.h};
 for(let direction=0;direction<4;direction++){
  const poses=[0,7,14,21].map(frame=>riderPose(vehicle,rect,direction,frame,true));
  for(const pose of poses){
   for(const point of [pose.hip,pose.neck,...pose.grips,...pose.feet])assert(point.every(Number.isFinite),'Mount anchors must stay finite during animation');
   assert(pose.neck[1]<pose.hip[1],'Torso projection must preserve an upright head');
   assert(Math.hypot(pose.neck[0]-pose.hip[0],pose.neck[1]-pose.hip[1])<=profile.rider.torso*1.1+1e-8,'Rider torso must not stretch away from the saddle');
   assert.deepEqual(pose.hip,poses[0].hip,'Cadence must not move the rider off the seat');
   assert.deepEqual(pose.grips,poses[0].grips,'Hands must stay on the bars');
  }
 }
}
console.log('PASS 80 directional garment regions, 32 complete vehicle/pet crops, twelve four-direction mounts and four riding phases');
