import {vehicleProfile,riderPose} from './vehicle-rig.js';
import {actorAnatomy} from './actor-anatomy.js';
import {shirtFit} from './wearable-fit.js';
import {containRect,drawFrame,spriteFrame} from './sprite-fit.js';
import {cardinalFrame,wardrobeSource,itemSource,artRevision} from './art-assets.js';
import {actorRig,wardrobeSlots,wearableRules,wearableBox,attachmentBox,vehicleMount,vehicleRules,directionIndex,animationPose,textureKey,FrameCache} from './asset-rules.js';
export {wardrobeSlots} from './asset-rules.js';

export function characterVariant(user){
 if(user?.avatarModel==='female')return 1;
 if(user?.avatarModel==='male')return 0;
 return ['tuyen','xinh','muoi'].includes(user?.id)?1:0;
}
const hands=new FrameCache(16),bodies=new FrameCache(64),catalogIndexes=new WeakMap();
function equipmentFor(user,items){
 let index=catalogIndexes.get(items);if(!index){index=new Map(items.map(item=>[item.id,item]));catalogIndexes.set(items,index);}
 return Object.fromEntries([...wardrobeSlots,'pet'].map(slot=>[slot,index.get(user?.equipment?.[slot])]));
}
function handLayer(f,model,direction){
 const key=[artRevision(),model,direction].join(':');if(hands.has(key))return hands.get(key);
 const image=document.createElement('canvas');image.width=f.sw;image.height=f.sh;
 const ctx=image.getContext('2d');ctx.drawImage(f.image,f.sx,f.sy,f.sw,f.sh,0,0,f.sw,f.sh);
 const pixels=ctx.getImageData(0,0,f.sw,f.sh);
 for(let y=0;y<f.sh;y++)for(let x=0;x<f.sw;x++){
  const n=(y*f.sw+x)*4,r=pixels.data[n],g=pixels.data[n+1],b=pixels.data[n+2];
  // Keep continuous neck, arms and hands. The old wrist-only strip left a gap
  // below short sleeves; drawing it last also painted skin over jacket cuffs.
  if(y<f.sh*.35||y>f.sh*.80||!(r>g*1.13&&g>b*1.08&&r>130))pixels.data[n+3]=0;
 }
 ctx.putImageData(pixels,0,0);const result={image,sx:0,sy:0,sw:f.sw,sh:f.sh};hands.set(key,result);return result;
}
function fitted(c,frame,box){return drawFrame(c,frame,box.x,box.y,box.w,box.h,box.alignY??1);}
function bodyFrame(model,direction,equipment){
 const base=cardinalFrame('characters-cardinal',model,direction,2);if(!base||base.empty)return null;
 const key=[artRevision(),model,direction,...wardrobeSlots.map(slot=>equipment[slot]?textureKey(equipment[slot]):'')].join('|');
 if(bodies.has(key))return bodies.get(key);
 const anatomy=actorAnatomy(model,direction);if(!anatomy)return null;
 const canvas=document.createElement('canvas');canvas.width=actorRig.canvas.w*actorRig.textureScale;canvas.height=actorRig.canvas.h*actorRig.textureScale;
 const c=canvas.getContext('2d');c.scale(actorRig.textureScale,actorRig.textureScale);c.translate(actorRig.canvas.x,actorRig.canvas.y);c.imageSmoothingEnabled=false;
 const worn=Object.fromEntries(wardrobeSlots.map(slot=>[slot,equipment[slot]?wardrobeSource(equipment[slot],direction):null]));
 const d=containRect(base.sw,base.sh,actorRig.body.x,actorRig.body.y,actorRig.body.w,actorRig.body.h,1);d.x=Math.round(d.x);d.y=Math.round(d.y);
 const full=(source=base)=>{
  c.save();if(worn.hat){c.beginPath();const cap=attachmentBox('hat',direction,anatomy);c.rect(-24,cap.y+cap.h*.58,48,70);c.clip();}
  c.drawImage(source.image,source.sx,source.sy,source.sw,source.sh,d.x,d.y,d.w,d.h);c.restore();
 };
 if(worn.shirt){
  const headCut=anatomy.neck.y-(direction===1?0:1.5);
  c.save();c.beginPath();c.rect(-24,actorRig.head.top,48,headCut-actorRig.head.top);c.rect(-24,anatomy.waistY,48,(worn.shoes?anatomy.cuffY:0)-anatomy.waistY);c.clip();full();c.restore();
  full(handLayer(base,model,direction));
  fitted(c,worn.shirt,shirtFit(worn.shirt,equipment.shirt,direction,anatomy));
  // Original chin/neck and hair overlap the inner collar, preserving skin tone.
  c.save();c.beginPath();c.rect(-24,actorRig.head.top,48,headCut-actorRig.head.top);c.clip();full();c.restore();
  // Only original skin crosses this seam; base-shirt shoulders must not survive
  // as gray wedges behind the new collar.
  c.save();c.beginPath();c.rect(-24,headCut,48,anatomy.neck.y+.25-headCut);c.clip();full(handLayer(base,model,direction));c.restore();
 }else{
  c.save();if(worn.shoes){c.beginPath();c.rect(-24,actorRig.head.top,48,anatomy.cuffY-actorRig.head.top);c.clip();}full();c.restore();
 }
 for(const slot of ['hat','glasses']){
  const item=equipment[slot];if(!item||!worn[slot]||wearableRules[slot].hidden?.includes(direction))continue;
  fitted(c,worn[slot],attachmentBox(slot,direction,anatomy));
 }
 bodies.set(key,canvas);return canvas;
}

export function drawCharacter(c,user,items,x,y,{direction=0,frame=0,moving=false,aura=true,pet=true,pose='stand'}={}){
 direction=directionIndex(direction);
 const equipment=equipmentFor(user,items),body=bodyFrame(characterVariant(user),direction,equipment);
 const animation=animationPose(frame,moving,pose),floor=Math.round(y)+actorRig.floorOffset;
 c.save();c.translate(Math.round(x),floor);c.imageSmoothingEnabled=false;
 c.save();
 if(animation.seated){c.translate(0,actorRig.seated.shift);c.beginPath();c.rect(-actorRig.canvas.x,actorRig.head.top,actorRig.canvas.w,actorRig.seated.cut-actorRig.head.top);c.clip();}
 if(animation.seated&&body)c.drawImage(body,-actorRig.canvas.x,-actorRig.canvas.y+animation.bob,actorRig.canvas.w,actorRig.canvas.h);
 c.restore();
 // Feet share the ground anchor; body motion never lifts the whole outfit.
 if(equipment.shoes&&!animation.seated){
  const anatomy=actorAnatomy(characterVariant(user),direction),source=wardrobeSource(equipment.shoes,direction),box=attachmentBox('shoes',direction,anatomy);
  if(anatomy&&source){
  c.save();c.beginPath();c.rect(-32,anatomy.cuffY+Math.min(0,animation.bob),64,24);c.clip();
  if(direction>=2)fitted(c,source,{...box,x:box.x+animation.step});
  else for(const half of [0,1]){
   c.save();c.beginPath();c.rect(half?0:-24,-20,24,22);c.clip();
   fitted(c,source,{...box,y:box.y-(moving&&animation.step===(half?1:-1)?1:0)});c.restore();
  }
  c.restore();
  }
 }
 // Pants occlude the ankle collar; shoes never paint over the trouser cuffs.
 if(!animation.seated&&body)c.drawImage(body,-actorRig.canvas.x,-actorRig.canvas.y+animation.bob,actorRig.canvas.w,actorRig.canvas.h);
 if(aura&&Object.values(equipment).some(i=>i?.tier===3)){
  c.fillStyle='#e6a1ed';for(let i=0;i<4;i++)c.fillRect(-21+i*14,-60+(Math.floor(frame)+i*5)%50,1,1);
 }
 if(pet&&equipment.pet){const source=itemSource(equipment.pet);drawFrame(c,source,direction===2?17:-40,-22,26,22,1);}
 c.restore();
}

const riderSurfaces=new FrameCache(4);
const fabricColors=new WeakMap();
function fabricColor(frame){
 if(!frame)return '#7e8794';if(fabricColors.has(frame))return fabricColors.get(frame);
 const c=document.createElement('canvas');c.width=c.height=16;const ctx=c.getContext('2d');ctx.drawImage(frame.image,frame.sx+frame.sw*.18,frame.sy+frame.sh*.35,frame.sw*.2,frame.sh*.35,0,0,16,16);
 const p=ctx.getImageData(0,0,16,16).data,colors=new Map();
 for(let i=0;i<p.length;i+=4){if(p[i+3]<128||Math.max(p[i],p[i+1],p[i+2])<45)continue;const rgb=[p[i],p[i+1],p[i+2]].map(n=>Math.round(n/16)*16),key=rgb.join(',');colors.set(key,(colors.get(key)||0)+1);}
 const color='rgb('+(Array.from(colors).sort((a,b)=>b[1]-a[1])[0]?.[0]||'126,135,148')+')';fabricColors.set(frame,color);return color;
}
function bone(c,a,b,width,color){
 const steps=Math.max(1,Math.ceil(Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]))));
 for(const [w,fill] of [[width+2,'#172332'],[width,color]]){
  c.fillStyle=fill;
  for(let i=0;i<=steps;i++)c.fillRect(Math.round(a[0]+(b[0]-a[0])*i/steps-w/2),Math.round(a[1]+(b[1]-a[1])*i/steps-w/2),w,w);
 }
}
function riderPart(c,body,position,scale,head,tilt=0,direction=0){
 c.save();c.translate(Math.round(position[0]),Math.round(position[1]));if(!head)c.rotate(tilt);c.scale(scale,scale);
 c.beginPath();
 if(head)c.rect(-32,actorRig.head.top+33,64,actorRig.head.bottom-actorRig.head.top);
 else c.rect(direction>=2?-5:-8,-1,direction>=2?10:16,actorRig.waist-actorRig.head.bottom+1);
 c.clip();c.drawImage(body,-actorRig.canvas.x,-actorRig.canvas.y+33,actorRig.canvas.w,actorRig.canvas.h);c.restore();
}
function riderTorso(c,body,pose,direction){
 const width=direction>=2?10:18,from=actorRig.head.bottom,length=actorRig.waist-from;
 const distance=Math.hypot(pose.hip[0]-pose.neck[0],pose.hip[1]-pose.neck[1]);
 c.save();c.translate(...pose.neck);c.rotate(-Math.atan2(pose.hip[0]-pose.neck[0],pose.hip[1]-pose.neck[1]));
 c.drawImage(body,(actorRig.canvas.x-width/2)*actorRig.textureScale,(actorRig.canvas.y+from)*actorRig.textureScale,width*actorRig.textureScale,length*actorRig.textureScale,-width*pose.scale/2,0,width*pose.scale,Math.max(4,distance+1));c.restore();
}
function paintTwoWheel(c,user,items,vehicle,source,profile,direction,options){
 const angle=profile.angles[direction],rect=containRect(source.sw,source.sh,-profile.w/2,-profile.h/2,profile.w,profile.h,.5);
 rect.x=Math.round(rect.x);rect.y=Math.round(rect.y);
 const pose=riderPose(vehicle,rect,direction,options.frame||0,!!options.moving);
 const equipment=equipmentFor(user,items),body=bodyFrame(characterVariant(user),direction,equipment);
 if(!body)return;
 const shirt=fabricColor(equipment.shirt?wardrobeSource(equipment.shirt,direction):null),trousers='#283448',skin='#edbd9a',shortSleeves=!equipment.shirt||[1,2].includes(equipment.shirt.variant%5);
 const shoePair=wardrobeSource(equipment.shoes||{category:'shoes',variant:0,color:'#de6c80'},direction===1?1:0);
 const near=direction===2?0:1,far=1-near;
 const leg=index=>{
  const part=pose.parts[index];bone(c,part.hip,part.knee,4,trousers);bone(c,part.knee,part.foot,3,trousers);
  if(shoePair){const shoe=spriteFrame(shoePair.image,shoePair.sx+index*shoePair.sw/2,shoePair.sy,shoePair.sw/2,shoePair.sh);c.save();c.translate(...part.foot);if(direction>=2)c.rotate(direction===2?Math.PI/2:-Math.PI/2);drawFrame(c,shoe,-2,-2,4,5,1);c.restore();}
  if(vehicle.kind==='bike'){c.fillStyle='#a5aeb6';c.fillRect(Math.round(part.foot[0]-3),Math.round(part.foot[1]+2),6,1);}
 };
 leg(far);
 c.save();c.rotate(angle);drawFrame(c,source,-profile.w/2,-profile.h/2,profile.w,profile.h,.5);c.restore();
 leg(near);
 const arm=index=>{const p=pose.parts[index];bone(c,p.shoulder,p.elbow,3,shirt);bone(c,p.elbow,p.hand,2,shortSleeves?skin:shirt);};
 arm(far);
 riderTorso(c,body,pose,direction);arm(near);
 // Frame, tank/fairing and bars are in front of limbs; hands are at the grips.
 const frontUp=profile.angles[0]===Math.PI,bar=profile.rider.grips.reduce((sum,p)=>sum+p[1],0)/2;
 c.save();c.rotate(angle);c.beginPath();
 c.rect(rect.x,frontUp?rect.y:rect.y+rect.h*(bar-.025),rect.w,frontUp?rect.h*(bar+.025):rect.h*(1-bar+.025));c.clip();
 drawFrame(c,source,-profile.w/2,-profile.h/2,profile.w,profile.h,.5);c.restore();
 for(const p of pose.parts){c.fillStyle='#172332';c.fillRect(Math.round(p.hand[0]-2),Math.round(p.hand[1]-2),4,4);c.fillStyle=skin;c.fillRect(Math.round(p.hand[0]-1),Math.round(p.hand[1]-1),2,2);}
 riderPart(c,body,pose.neck,pose.scale,true,0,direction);
}
export function drawRider(c,user,items,vehicle,x,y,options={}){
 if(!vehicle)return drawCharacter(c,user,items,x,y,options);
 const source=itemSource(vehicle);
 if(!source||source.empty)return drawCharacter(c,user,items,x,y,options);
 const direction=directionIndex(options.direction),rule=vehicleProfile(vehicle),angle=rule.angles[direction];
 c.save();c.translate(Math.round(x),Math.round(y));c.imageSmoothingEnabled=false;
 if(rule.rider){
  const size=2**Math.ceil(Math.log2(Math.max(rule.w,rule.h)+120));
  let surface=riderSurfaces.get(size);
  if(!surface){surface=document.createElement('canvas');surface.width=surface.height=size*actorRig.textureScale;riderSurfaces.set(size,surface);}
  const rc=surface.getContext('2d');rc.clearRect(0,0,surface.width,surface.height);rc.save();rc.scale(actorRig.textureScale,actorRig.textureScale);rc.translate(size/2,size/2);rc.imageSmoothingEnabled=false;
  paintTwoWheel(rc,user,items,vehicle,source,rule,direction,options);rc.restore();c.drawImage(surface,-size/2,-size/2,size,size);c.restore();return;
 }
 c.save();c.rotate(angle);const fittedVehicle=drawFrame(c,source,-rule.w/2,-rule.h/2,rule.w,rule.h,0.5);c.restore();
 if(rule.mount){
  const mount=vehicleMount(vehicle);
  const points=mount.window.map(([u,v])=>[fittedVehicle.x+u*fittedVehicle.w,fittedVehicle.y+v*fittedVehicle.h]);
  const path=()=>{c.beginPath();points.forEach(([px,py],index)=>index?c.lineTo(px,py):c.moveTo(px,py));c.closePath();};
  const seat=[fittedVehicle.x+mount.seat[0]*fittedVehicle.w,fittedVehicle.y+mount.seat[1]*fittedVehicle.h];
  const center=[seat[0]*Math.cos(angle)-seat[1]*Math.sin(angle),seat[0]*Math.sin(angle)+seat[1]*Math.cos(angle)];
  const windowHeight=(Math.max(...points.map(p=>p[1]))-Math.min(...points.map(p=>p[1])));
  const portraitHeight=mount.portrait.bottom-mount.portrait.top;
  const scale=Math.min(rule.scale,windowHeight/portraitHeight);
  const body=bodyFrame(characterVariant(user),direction,equipmentFor(user,items));
  c.save();c.rotate(angle);path();c.clip();c.rotate(-angle);
  if(body)c.drawImage(body,0,(actorRig.canvas.y+mount.portrait.top)*actorRig.textureScale,actorRig.canvas.w*actorRig.textureScale,portraitHeight*actorRig.textureScale,center[0]-actorRig.canvas.x*scale,center[1]-portraitHeight*scale/2,actorRig.canvas.w*scale,portraitHeight*scale);
  c.rotate(angle);path();c.fillStyle='rgba(83,129,166,.16)';c.fill();c.strokeStyle='#435667';c.lineWidth=.7;c.stroke();c.restore();
 }
 c.restore();
}
