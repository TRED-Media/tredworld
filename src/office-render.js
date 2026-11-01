import {cardinalFrame,chairSource,loadArt,wardrobeSource} from './art-assets.js';
import {drawFrame} from './sprite-fit.js';
import {drawCharacter} from './character-art.js';
import {actorRig,FrameCache} from './asset-rules.js';
import {sourcePoint} from './office-seats.js';
import {worldMaterialDensity} from './render-quality.js';
const foregroundCache=new FrameCache(16);
export const officeImage=loadArt('office-standard');
let officeSurface;
function preparedOffice(){
 if(!officeImage.complete||!officeImage.naturalWidth)return false;
 if(!officeSurface){officeSurface=document.createElement('canvas');officeSurface.width=1344*worldMaterialDensity;officeSurface.height=950*worldMaterialDensity;const c=officeSurface.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(officeImage,0,31,officeImage.naturalWidth,officeImage.naturalWidth*950/1344,0,0,officeSurface.width,officeSurface.height);}
 return officeSurface;
}
export function drawOfficeBackground(ctx){
 const surface=preparedOffice();if(!surface)return false;ctx.drawImage(surface,0,0,1344,950);return true;
}
export function drawForeground(ctx,object){
 const surface=preparedOffice();if(!surface)return;
 let layer=foregroundCache.get(object.id);const [x,y,w,h]=object.rect,p=sourcePoint(x,y),end=sourcePoint(x+w,y+h),density=worldMaterialDensity,tx=Math.round(p.x*density),ty=Math.round(p.y*density),tw=Math.round(end.x*density)-tx,th=Math.round(end.y*density)-ty;
 if(!layer){layer=document.createElement('canvas');layer.width=tw;layer.height=th;const c=layer.getContext('2d');c.drawImage(surface,tx,ty,tw,th,0,0,tw,th);const pixels=c.getImageData(0,0,tw,th);for(let n=0;n<pixels.data.length;n+=4){const [r,g,b]=pixels.data.subarray(n,n+3);if(r>125&&r<215&&Math.max(r,g,b)-Math.min(r,g,b)<22)pixels.data[n+3]=0;}c.putImageData(pixels,0,0);foregroundCache.set(object.id,layer);}
 ctx.drawImage(layer,tx/density,ty/density,tw/density,th/density);
}
export function drawOfficeSeat(ctx,seat,user,items,frame=0){
 const source=seat.item?chairSource(seat.item,seat.direction):cardinalFrame('chairs-cardinal',seat.style,seat.direction,5);if(!source)return;
 const box={x:seat.floor.x-seat.w/2,y:seat.floor.y-seat.h,w:seat.w,h:seat.h};
 drawFrame(ctx,source,box.x,box.y,box.w,box.h,1);
 if(!user)return;
 const {x,y}=seat.floor,side=seat.direction>=2,forward=seat.direction===2?-1:1;
 // Bent legs and supported feet replace standing shins in the seated pose.
 ctx.fillStyle='#172334';
 for(const sign of [-1,1]){const hipX=x+(side?0:sign*4),kneeX=x+(side?forward*9:sign*5);ctx.fillRect(Math.min(hipX,kneeX)-2,y-24,Math.abs(kneeX-hipX)+5,6);ctx.fillRect(kneeX-2,y-19,5,10);}
 const shoe=items.find(i=>i.id===user.equipment?.shoes),foot=shoe&&wardrobeSource(shoe,seat.direction);
 if(foot)drawFrame(ctx,foot,x+(side?forward*7:-8),y-11,side?11:16,7,1);
 else{ctx.fillStyle='#38465d';ctx.fillRect(x+(side?forward*7-3:-8),y-9,side?8:16,4);}
 drawCharacter(ctx,user,items,x,y-actorRig.floorOffset-8,{direction:seat.direction,frame,pet:false,aura:false,pose:'sit'});
 // Rear shell / far side of the backrest occludes the seated torso, not the head.
 if(seat.direction===1)drawFrame(ctx,source,box.x,box.y,box.w,box.h,1);
 else if(side){ctx.save();ctx.beginPath();ctx.rect(seat.direction===2?x+seat.w*.12:x-seat.w/2,box.y,seat.w*.38,seat.h*.72);ctx.clip();drawFrame(ctx,source,box.x,box.y,box.w,box.h,1);ctx.restore();}
}
export function drawInteractionMarker(ctx,object,{focused=false,occupied=false,frame=0}={}){
 const p=object.floor||object.point,size=focused?6:3;
 ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y+4));
 ctx.fillStyle='#172334';ctx.fillRect(-size-1,-size-1,size*2+2,size*2+2);ctx.fillStyle=occupied?'#718198':focused?'#ed718f':'#cdb587';ctx.fillRect(-size,-size,size*2,size*2);ctx.fillStyle='#243348';ctx.fillRect(-size+1,-size+1,size*2-2,size*2-2);
 if(focused){ctx.strokeStyle=occupied?'#96a29f':'#ed718f';ctx.lineWidth=1;ctx.strokeRect(-object.w/2-2,-object.h-6,object.w+4,object.h+4);ctx.fillStyle='#f1ebdf';ctx.fillRect(-1,-2,2,4);}
 ctx.restore();
}
