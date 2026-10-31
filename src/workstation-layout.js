import {stationRules} from './asset-rules.js';
export const workstationSlots=['desk','chair','case','monitor','cooling','accessory','decor'];
export const stationBounds={width:96,height:112};
export function workstationLayout(user,items) {
 return workstationSlots.map(slot=>{
  const item=items.find(i=>i.id===user?.equipment?.[slot]);
  if(!item)return null;
  const {x:dx,y:dy,w,h,layer}=stationRules[slot],position=user.layout?.[slot];
  const x=position?Math.max(0,Math.min(100,position.x))/100*(96-w):dx;
  const y=position?Math.max(0,Math.min(100,position.y))/100*(112-h):dy;
  return {slot,item,x,y,w,h,layer};
 }).filter(part=>part!==null).sort((a,b)=>a.layer-b.layer||a.y+a.h-b.y-b.h);
}
export function stationPosition(slot,x,y) {
 const {w,h}=stationRules[slot];
 return {x:Math.round(Math.max(0,Math.min(1,x/(96-w||1)))*100),y:Math.round(Math.max(0,Math.min(1,y/(112-h)))*100)};
}
