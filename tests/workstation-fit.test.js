import test from 'node:test';
import assert from 'node:assert/strict';
import {workstationLayout,stationPosition} from '../src/workstation-layout.js';
import {shirtFit} from '../src/wearable-fit.js';

const slots=['desk','chair','case','monitor','accessory','cooling','decor'];
const catalog=slots.flatMap(category=>Array.from({length:5},(_,variant)=>({id:category+variant,category,slot:category,variant})));
const user=variant=>({equipment:Object.fromEntries(slots.map(slot=>[slot,slot+variant])),layout:{}});
const sources=item=>({sw:item.category==='desk'?350:item.category==='monitor'?300:100,sh:item.category==='desk'?175:item.category==='monitor'?200:150});
function checkSurface(parts){
 const desk=parts.find(p=>p.slot==='desk');
 for(const slot of ['case','monitor','accessory']){
  const p=parts.find(p=>p.slot===slot);
  assert(p.x>=desk.surface.left-1e-8&&p.x+p.w<=desk.surface.right+1e-8,slot+' stays above table width');
  assert(p.y+p.h>=desk.surface.back-1e-8&&p.y+p.h<=desk.surface.front+1e-8,slot+' rests on table plane');
 }
 const pc=parts.find(p=>p.slot==='case'),cooling=parts.find(p=>p.slot==='cooling');
 assert(cooling.x>=pc.x&&cooling.y>=pc.y&&cooling.x+cooling.w<=pc.x+pc.w&&cooling.y+cooling.h<=pc.y+pc.h,'cooler is inside case');
 assert.equal(parts.find(p=>p.slot==='chair').view,'back');
}
test('all desks and accessory kinds share real surface anchors, including saved layout extremes',()=>{
 for(let variant=0;variant<5;variant++)for(const value of [0,25,50,75,100]){
  const u=user(variant);u.layout=Object.fromEntries(slots.filter(s=>s!=='cooling').map(s=>[s,{x:value,y:value}]));
  const before=JSON.stringify(u);checkSurface(workstationLayout(u,catalog,sources));assert.equal(JSON.stringify(u),before,'render never migrates player data');
 }
});
test('moving a desk moves its monitor, PC and keyboard together without changing equipment',()=>{
 const u=user(0),before=workstationLayout(u,catalog,sources);u.layout.desk={x:50,y:100};
 const after=workstationLayout(u,catalog,sources),delta=after.find(p=>p.slot==='desk').y-before.find(p=>p.slot==='desk').y;
 for(const slot of ['case','monitor','accessory'])assert(Math.abs(after.find(p=>p.slot===slot).y-before.find(p=>p.slot===slot).y-delta)<1e-8);
 checkSurface(after);
});
test('dragging surface items round-trips their constrained 0–100 layout positions',()=>{
 for(const slot of ['case','monitor','accessory','chair','desk'])for(const value of [0,37,100]){
  const u=user(0);u.layout[slot]={x:value,y:value};const parts=workstationLayout(u,catalog,sources),p=parts.find(p=>p.slot===slot);
  const normalized=stationPosition(slot,p.x,p.y,parts);assert.equal(normalized.y,value);if(slot!=='desk')assert.equal(normalized.x,value);
 }
});
test('garments use a single undistorted collar-to-hem transform for different anatomies',()=>{
 for(let direction=0;direction<4;direction++)for(let variant=0;variant<5;variant++)for(const neckY of [-35,-32]){
  const frame={sw:direction<2?230:155,sh:190},anatomy={neck:{x:1,y:neckY},waistY:-20},fit=shirtFit(frame,{variant},direction,anatomy);
  assert(Math.abs(fit.w/fit.h-frame.sw/frame.sh)<1e-9);assert(Math.abs(fit.y+fit.h-(-20+[4,1,1,3,3][variant]))<1e-9);
  assert(fit.y<neckY&&fit.y+fit.h>neckY);
 }
 assert.throws(()=>shirtFit({sw:20,sh:20},{variant:0,art:{collar:[.5,1]}},0,{neck:{x:0,y:-33},waistY:-20}),/collar/);
});
