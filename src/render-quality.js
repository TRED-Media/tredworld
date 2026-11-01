// CSS/world coordinates stay independent of the physical canvas resolution.
export const worldMaterialDensity=2;
export function setWorldMaterial(context,enabled=true){context.worldMaterialDensity=enabled?worldMaterialDensity:0;}
export function materialDensity(context){return context.worldMaterialDensity||0;}
export function displayRatio(value=globalThis.devicePixelRatio||1){return Number.isFinite(value)?Math.max(1,Math.min(3,value)):1;}
export function configureCanvas(canvas,width,height,{ratio=displayRatio(),pixelArt=true}={}){
 ratio=Number.isFinite(ratio)?Math.max(.25,Math.min(8,ratio)):1;
 const w=Math.max(1,Math.round(width*ratio)),h=Math.max(1,Math.round(height*ratio));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.imageSmoothingEnabled=!pixelArt;
 canvas.dataset.logicalWidth=String(width);canvas.dataset.logicalHeight=String(height);canvas.dataset.pixelRatio=String(ratio);
 return {ctx,width,height,ratio};
}
export function cameraView(width,height,zoom,ratio,x,y){
 ratio=displayRatio(ratio);
 const physicalScale=Math.max(1,Math.round(zoom*ratio)),scale=physicalScale/ratio;
 const snap=value=>Math.round(value*physicalScale)/physicalScale;
 return {width,height,scale,ratio,x:snap(Math.max(0,Math.min(Math.max(0,1344-width/scale),x-width/scale/2))),y:snap(Math.max(0,Math.min(Math.max(0,1248-height/scale),y-height/scale/2)))};
}
export function screenToWorld(view,x,y){return {x:x/view.scale+view.x,y:y/view.scale+view.y};}
export function worldToScreen(view,x,y){return {x:(x-view.x)*view.scale,y:(y-view.y)*view.scale};}
export function alternateZoom(view){
 const far=Math.max(1,Math.round(.8*view.ratio))/view.ratio,near=Math.max(2,Math.round(1.5*view.ratio))/view.ratio;
 return view.scale>far?far:near;
}
