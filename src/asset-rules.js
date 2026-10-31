import {atlasRegions} from './atlas-regions.js';
// World-space pixels. Actor root remains compatible with saved positions;
// all anatomical anchors are relative to the floor, 21 pixels below that root.
export const directions=['front','back','left','right'];
export const wardrobeSlots=['shirt','hat','glasses','shoes'];
export const actorRig={
 floorOffset:21,body:{x:-20,y:-60,w:40,h:60},waist:-20,
 canvas:{w:64,h:84,x:32,y:63},head:{top:-65,bottom:-33},
 neck:{x:-3,y:-36,w:6,h:8},hands:{from:.66,to:.77},seated:{shift:4,cut:-12}
};
export const wearableRules={
 shirt:{row:1,front:{x:-12,y:-35,w:24,h:21},side:{x:-8,y:-35,w:16,h:21},layer:20},
 shoes:{row:2,front:{x:-11,y:-10,w:22,h:10},side:{x:-8,y:-10,w:16,h:10},layer:40},
 hat:{row:0,front:{x:-17,y:-61,w:34,h:22},side:{x:-16,y:-61,w:32,h:22},layer:50},
 glasses:{row:3,front:{x:-11,y:-45,w:22,h:7},left:{x:-12,y:-45,w:13,h:7},right:{x:-1,y:-45,w:13,h:7},hidden:[1],layer:60}
};
// Attachment sizes are constrained by measured anatomy, not shop-card bounds.
export const attachmentFit={
 hat:{skullWidth:1.13,headHeight:.64,alignY:0},
 glasses:{faceWidth:.72,faceHeight:.30,eyeY:.48,alignY:.5},
 shoes:{footWidth:1.02,cuffOverlap:1,alignY:1}
};
export function attachmentBox(slot,direction,anatomy){
 const fallback=wearableBox(slot,direction);if(!anatomy)return slot==='shirt'?fallback:null;
 const {head,face,frontalFace,feet}=anatomy;
 if(slot==='hat'){
  const w=frontalFace.w*attachmentFit.hat.skullWidth,h=head.h*attachmentFit.hat.headHeight;
  return {x:head.x+head.w/2-w/2,y:head.y-.5,w,h,alignY:0};
 }
 if(slot==='glasses'){
  const side=direction>=2,w=face.w*(side?.70:attachmentFit.glasses.faceWidth),h=face.h*attachmentFit.glasses.faceHeight;
  const center=face.x+face.w/2,eye=face.y+face.h*attachmentFit.glasses.eyeY;
  return {x:side?(direction===2?face.x-.5:face.x+face.w-w+.5):center-w/2,y:eye-h/2,w,h,alignY:.5};
 }
 if(slot==='shoes'){
  const w=feet.w*attachmentFit.shoes.footWidth;
  return {x:feet.x+feet.w/2-w/2,y:-fallback.h,w,h:fallback.h,alignY:1};
 }
 return fallback;
}
export const atlasRules={
 'characters-cardinal':{columns:4,rows:2},'wearables-cardinal':{columns:4,rows:4},
 'furniture-straight':{columns:5,rows:2},
 'vehicle-atlas':{columns:4,rows:3,rowCuts:[0,455/1374,870/1374,1],regions:atlasRegions.vehicle,isolate:true},
 'pet-atlas':{columns:5,rows:4,regions:atlasRegions.pet,isolate:true}
};
export const stationRules={
 desk:{x:0,y:22,w:96,h:56,layer:1},chair:{x:31,y:65,w:36,h:47,layer:5},
 monitor:{x:25,y:2,w:44,h:34,layer:3},case:{x:73,y:18,w:23,h:36,layer:3},
 cooling:{x:77,y:31,w:16,h:19,layer:4},accessory:{x:28,y:39,w:37,h:16,layer:4},
 decor:{x:1,y:6,w:25,h:34,layer:3}
};
export const vehicleRules={
 car:{w:46,h:74,scale:.24,mount:{window:[[.28,.445],[.72,.445],[.78,.575],[.22,.575]],seat:[.39,.513],portrait:{top:-61,bottom:-25}},angles:[0,Math.PI,Math.PI/2,-Math.PI/2]},
 bike:{w:36,h:64,scale:.56,angles:[Math.PI,0,-Math.PI/2,Math.PI/2]},
 scooter:{w:38,h:66,scale:.56,angles:[Math.PI,0,-Math.PI/2,Math.PI/2]},
 motorbike:{w:38,h:68,scale:.56,angles:[Math.PI,0,-Math.PI/2,Math.PI/2]}
};
export function validateVehicleMount(mount){
 if(!mount||!Array.isArray(mount.window)||mount.window.length<3)throw new Error('Vehicle needs a windshield polygon');
 for(const point of [...mount.window,mount.seat])if(!Array.isArray(point)||point.length!==2||!point.every(n=>Number.isFinite(n)&&n>=0&&n<=1))throw new Error('Vehicle anchors must be normalized');
 if(!mount.portrait||!Number.isFinite(mount.portrait.top)||!Number.isFinite(mount.portrait.bottom)||mount.portrait.top>=mount.portrait.bottom)throw new Error('Invalid driver portrait crop');
 if(mount.portrait.top < -actorRig.canvas.y || mount.portrait.bottom>actorRig.waist)throw new Error('Driver crop must exclude hips, legs and shoes');
 if(!pointInPolygon(mount.seat,mount.window))throw new Error('Driver seat must be inside windshield');
 return mount;
}
export function pointInPolygon([x,y],points){
 let inside=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [xi,yi]=points[i],[xj,yj]=points[j];
  if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
 }
 return inside;
}
export function vehicleMount(vehicle){
 const rule=vehicleRules[vehicle.kind]||vehicleRules.bike;
 if(!rule.mount)return null;
 const custom=vehicle.mount||vehicle.art?.mount;
 if(vehicle.art&&!custom)throw new Error('New car artwork must declare its windshield and driver seat');
 return validateVehicleMount(custom||rule.mount);
}
export function directionIndex(value){return Number.isInteger(value)&&value>=0&&value<4?value:0;}
export function vehicleGroundOffset(kind,direction){const rule=vehicleRules[kind]||vehicleRules.bike;return (directionIndex(direction)<2?rule.h:rule.w)/2;}
export function wearableBox(slot,direction){const rule=wearableRules[slot];return rule?.[directions[direction]]||rule?.[direction>=2?'side':'front'];}
export function animationPose(frame=0,moving=false,pose='stand'){
 const tick=Number.isFinite(frame)?frame:0,walking=moving&&pose==='stand';
 return {bob:walking?Math.round(Math.sin(tick*.2)):0,seated:pose==='sit'||pose==='drive',step:walking?Math.round(Math.sin(tick*.2)):0};
}
// New catalog art may select any grid cell. It inherits its category's rig.
export function validateArtSpec(spec){
 if(!spec||typeof spec.atlas!=='string'||!/^[a-z0-9-]+$/.test(spec.atlas))throw new Error('Invalid atlas name');
 for(const field of ['columns','rows'])if(!Number.isInteger(spec[field])||spec[field]<1||spec[field]>64)throw new Error(`Invalid ${field}`);
 for(const [field,limit] of [['column',spec.columns],['row',spec.rows]])if(!Number.isInteger(spec[field])||spec[field]<0||spec[field]>=limit)throw new Error(`Invalid ${field}`);
 if(spec.directional&&spec.columns!==4)throw new Error('Directional atlas needs four columns');
 return spec;
}
export function textureKey(item){return JSON.stringify([item.category,item.variant,item.color,item.art||null]);}
export function visualKey(item){return JSON.stringify([textureKey(item),item.tier]);}
export class FrameCache extends Map{
 constructor(limit=128){super();this.limit=limit;}
 set(key,value){if(this.has(key))this.delete(key);super.set(key,value);while(this.size>this.limit)this.delete(this.keys().next().value);return this;}
 get(key){if(!this.has(key))return undefined;const value=super.get(key);this.delete(key);super.set(key,value);return value;}
}
