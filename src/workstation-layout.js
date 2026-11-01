import {stationRules} from './asset-rules.js';
import {containRect} from './sprite-fit.js';
export const workstationSlots=['desk','chair','case','monitor','cooling','accessory','decor'];
export const stationBounds={width:96,height:112};
const clamp=(n,a,b)=>Math.max(a,Math.min(Math.max(a,b),n));
const percent=(n,a,b)=>b===a?50:Math.round(clamp((n-a)/(b-a),0,1)*100);

export function workstationLayout(user,items,sourceFor=()=>null){
 const equipped=Object.fromEntries(workstationSlots.map(slot=>[slot,items.find(i=>i.id===user?.equipment?.[slot])]));
 function fit(slot,box){
  const item=equipped[slot],source=item&&sourceFor(item,slot);
  const dimensions=source||{sw:slot==='desk'?205:box.w,sh:slot==='desk'?100:box.h};
  return containRect(dimensions.sw,dimensions.sh,0,0,box.w,box.h,0);
 }
 function part(slot,box,rails,defaultX,defaultY,extra={}){
  const item=equipped[slot];if(!item)return null;
  const size=fit(slot,box),position=user?.layout?.[slot];
  const x=position?rails.minX+clamp(position.x,0,100)/100*(rails.maxX-rails.minX):clamp(defaultX,rails.minX,rails.maxX);
  const y=position?rails.minY+clamp(position.y,0,100)/100*(rails.maxY-rails.minY):clamp(defaultY,rails.minY,rails.maxY);
  return {slot,item,x,y,w:size.w,h:size.h,layer:stationRules[slot].layer,placement:rails,position:{x:percent(x,rails.minX,rails.maxX),y:percent(y,rails.minY,rails.maxY)},...extra};
 }
 const desk=part('desk',stationRules.desk,{minX:0,maxX:0,minY:0,maxY:56},0,22);
 const d=desk||{x:0,y:22,w:96,h:96/2.05};
 // UVs reference the fitted, trimmed desk, never the full icon/grid cell.
 const uv=equipped.desk?.art?.surface||{left:.045,right:.955,back:.025,front:.18};
 if(!['left','right','back','front'].every(k=>Number.isFinite(uv[k])&&uv[k]>=0&&uv[k]<=1)||uv.left>=uv.right||uv.back>=uv.front)throw Error('Desk surface must be an ordered normalized rectangle');
 const surface={left:d.x+d.w*uv.left,right:d.x+d.w*uv.right,back:d.y+d.h*uv.back,front:d.y+d.h*uv.front};
 const parts=desk?[{...desk,surface}]:[];
 function desktop(slot,box,center,depth){
  if(!equipped[slot])return null;
  const size=fit(slot,box),rails={minX:surface.left,maxX:surface.right-size.w,minY:surface.back-size.h,maxY:surface.front-size.h};
  const result=part(slot,box,rails,d.x+center-size.w/2,surface.back+(surface.front-surface.back)*depth-size.h,{surface});parts.push(result);return result;
 }
 desktop('monitor',{w:44,h:34},47,.35);
 const pc=desktop('case',{w:20,h:31},83,.6);
 const accessory=equipped.accessory?.variant%5;
 const accessoryBox=accessory===0?{w:37,h:7}:accessory===1?{w:24,h:20}:accessory===2?{w:13,h:18}:accessory===3?{w:14,h:12}:{w:24,h:9};
 desktop('accessory',accessoryBox,47,.98);
 if(equipped.cooling){
  const frame=pc?{x:pc.x+pc.w*.12,y:pc.y+pc.h*.29,w:pc.w*.68,h:pc.h*.58}:{x:surface.right-16,y:surface.front-19,w:16,h:19};
  const cooling=part('cooling',frame,{minX:frame.x,maxX:frame.x,minY:frame.y,maxY:frame.y},frame.x,frame.y,{mount:'case'});parts.push(cooling);
 }
 if(equipped.decor){
  const variant=equipped.decor.variant%5;
  if(variant===0||variant===3)desktop('decor',variant===0?{w:18,h:25}:{w:12,h:24},12,.6);
  else {
   const box=variant===4?{w:76,h:28}:{w:26,h:24},x=variant===4?10:0,y=variant===4?76:Math.max(0,d.y-26);
   parts.push(part('decor',box,{minX:0,maxX:96-box.w,minY:variant===4?68:0,maxY:variant===4?84:Math.max(0,d.y-box.h)},x,y,{layer:variant===4?0:2}));
  }
 }
 if(equipped.chair){
  const size=fit('chair',stationRules.chair);
  parts.push(part('chair',stationRules.chair,{minX:0,maxX:96-size.w,minY:58,maxY:112-size.h},48-size.w/2,65,{view:'back'}));
 }
 return parts.filter(Boolean).sort((a,b)=>a.layer-b.layer||a.y+a.h-b.y-b.h);
}
export function stationPosition(slot,x,y,parts){
 const placement=parts?.find(p=>p.slot===slot)?.placement;
 if(placement)return {x:percent(x,placement.minX,placement.maxX),y:percent(y,placement.minY,placement.maxY)};
 const {w,h}=stationRules[slot];
 return {x:percent(x,0,96-w),y:percent(y,0,112-h)};
}
