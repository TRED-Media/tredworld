import {containRect} from './sprite-fit.js';
import {cardinalFrame,artRevision} from './art-assets.js';
import {actorRig,FrameCache,attachmentFit} from './asset-rules.js';

const cache=new FrameCache(16);
export function actorAnatomy(model,direction){
 const key=[artRevision(),model,direction].join(':');if(cache.has(key))return cache.get(key);
 const frame=cardinalFrame('characters-cardinal',model,direction,2);if(!frame||frame.empty)return null;
 const c=document.createElement('canvas');c.width=frame.sw;c.height=frame.sh;
 const ctx=c.getContext('2d');ctx.drawImage(frame.image,frame.sx,frame.sy,frame.sw,frame.sh,0,0,frame.sw,frame.sh);
 const pixels=ctx.getImageData(0,0,frame.sw,frame.sh).data;
 const rig=actorRig.body,fit=containRect(frame.sw,frame.sh,rig.x,rig.y,rig.w,rig.h,1);
 fit.x=Math.round(fit.x);fit.y=Math.round(fit.y);const scale=fit.h/frame.sh;
 function bounds(from,to,skin=false){
  let l=frame.sw,t=frame.sh,r=-1,b=-1;
  for(let y=Math.floor(from*frame.sh);y<Math.floor(to*frame.sh);y++)for(let x=0;x<frame.sw;x++){
   const n=(y*frame.sw+x)*4,R=pixels[n],G=pixels[n+1],B=pixels[n+2];
   if(pixels[n+3]<=40||(skin&&!(R>G*1.12&&G>B*1.08&&R>140)))continue;
   l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
  }
  return r<0?null:{x:fit.x+l*scale,y:fit.y+t*scale,w:(r-l+1)*scale,h:(b-t+1)*scale};
 }
 const head=bounds(0,.46)||{...rig,h:rig.h*.46};
 const measuredFace=bounds(0,.5,true),frontal=direction===0?null:actorAnatomy(model,0);
 const face=measuredFace||{x:head.x+head.w*.15,y:head.y+head.h*.4,w:head.w*.7,h:head.h*.6};
 const feet=bounds(.93,1)||{x:-9,y:-5,w:18,h:5};
 // Locate the actual neck instead of cutting every model at a shared screen row.
 let neck=null;
 for(let y=Math.floor(frame.sh*.38);y<Math.floor(frame.sh*.52);y++){
  let left=frame.sw,right=-1;
  for(let x=Math.floor(frame.sw*.35);x<Math.ceil(frame.sw*.65);x++){
   const n=(y*frame.sw+x)*4,[R,G,B,A]=pixels.slice(n,n+4);
   if(A>128&&R>G*1.12&&G>B*1.08&&R>140){left=Math.min(left,x);right=Math.max(right,x);}
  }
  if(right>=left)neck={x:fit.x+(left+right+1)/2*scale,y:fit.y+(y+1)*scale};
 }
 neck||={x:fit.x+fit.w/2,y:actorRig.head.bottom};
 const value={head,face,frontalFace:frontal?.face||face,neck,waistY:fit.y+fit.h*.66,feet,cuffY:feet.y-attachmentFit.shoes.cuffOverlap};
 cache.set(key,value);return value;
}
