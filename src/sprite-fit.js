// One uniform scale, with an explicit alignment. Never stretch a sprite.
export function containRect(sw,sh,x,y,w,h,alignY=.5){
 if(![sw,sh,x,y,w,h,alignY].every(Number.isFinite)||sw<=0||sh<=0||w<=0||h<=0)throw new RangeError('Sprite dimensions must be finite and positive');
 const scale=Math.min(w/sw,h/sh);return {x:x+(w-sw*scale)/2,y:y+(h-sh*scale)*Math.max(0,Math.min(1,alignY)),w:sw*scale,h:sh*scale};
}
const frames=new WeakMap();
export function spriteFrame(image,sx,sy,sw,sh,isolate=false){
 let cache=frames.get(image);if(!cache){cache=new Map();frames.set(image,cache);}
 // Integer boundaries avoid resampling neighbouring cells in generated atlases.
 const left=Math.round(sx),top=Math.round(sy),width=Math.max(1,Math.round(sx+sw)-left),height=Math.max(1,Math.round(sy+sh)-top);
 const key=[left,top,width,height,isolate].join(',');if(cache.has(key))return cache.get(key);
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(image,left,top,width,height,0,0,width,height);
 const pixels=ctx.getImageData(0,0,width,height),data=pixels.data;
 if(isolate){
  const seen=new Uint8Array(width*height);let largest=[];
  for(let n=0;n<seen.length;n++){
   if(seen[n]||data[n*4+3]<=32)continue;
   const component=[n];seen[n]=1;
   for(let j=0;j<component.length;j++){
    const k=component[j],x=k%width,y=Math.floor(k/width);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
     const nx=x+dx,ny=y+dy,next=ny*width+nx;
     if(nx<0||nx>=width||ny<0||ny>=height||seen[next]||data[next*4+3]<=32)continue;
     seen[next]=1;component.push(next);
    }
   }
   if(component.length>largest.length)largest=component;
  }
  const keep=new Uint8Array(seen.length);for(const n of largest)keep[n]=1;
  for(let n=0;n<keep.length;n++)if(!keep[n])data[n*4+3]=0;
  ctx.putImageData(pixels,0,0);
 }
 let l=width,t=height,r=-1,b=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>32){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
 const empty=r<0;
 const result={image:canvas,sx:empty?0:l,sy:empty?0:t,sw:empty?width:r-l+1,sh:empty?height:b-t+1,empty,cell:{w:width,h:height}};
 cache.set(key,result);return result;
}
export function drawFrame(ctx,frame,x,y,w,h,alignY=.5){
 if(!frame||frame.empty)return null;
 const d=containRect(frame.sw,frame.sh,x,y,w,h,alignY);
 d.x=Math.round(d.x);d.y=Math.round(d.y);
 ctx.imageSmoothingEnabled=false;ctx.drawImage(frame.image,frame.sx,frame.sy,frame.sw,frame.sh,d.x,d.y,d.w,d.h);
 if(globalThis.__spriteAudit&&globalThis.__spriteAudit.length<10000)globalThis.__spriteAudit.push({source:[frame.sw,frame.sh],destination:[d.w,d.h]});
 return d;
}
export function drawSprite(ctx,image,sx,sy,sw,sh,x,y,w,h,alignY=.5){return drawFrame(ctx,spriteFrame(image,sx,sy,sw,sh),x,y,w,h,alignY);}
