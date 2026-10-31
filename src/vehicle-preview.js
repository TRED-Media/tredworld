import {drawRider} from './character-art.js';

export function mountVehiclePreview(root,user,catalog){
 const controls=document.createElement('div');controls.className='eco-toolbar';
 const view={model:user.avatarModel||(['tuyen','xinh','muoi'].includes(user.id)?'female':'male'),moving:true};
 for(const [value,label] of [['male','Nam'],['female','Nữ'],['motion','Dừng / chạy']]){
  const button=document.createElement('button');button.textContent=label;
  button.onclick=()=>{if(value==='motion')view.moving=!view.moving;else view.model=value;};controls.append(button);
 }
 root.append(controls);
 const models=[...new Map(catalog.filter(i=>i.category==='vehicle').map(i=>[i.variant,i])).values()].sort((a,b)=>a.variant-b.variant);
 const rows=models.map(vehicle=>{
  const card=document.createElement('section'),title=document.createElement('p'),canvas=document.createElement('canvas');
  title.textContent=vehicle.name+' · '+({bike:'Đạp xe',scooter:'Ngồi lái',motorbike:'Tư thế thể thao',car:'Trong khoang xe'}[vehicle.kind]||'Lái xe');
  canvas.width=640;canvas.height=190;canvas.style.cssText='display:block;width:100%;height:auto;image-rendering:pixelated';
  canvas.setAttribute('aria-label',vehicle.name+' — Front, Back, Left, Right');card.append(title,canvas);root.append(card);
  return {vehicle,canvas,ctx:canvas.getContext('2d')};
 });
 let last=-Infinity;
 const paint=time=>{
  if(!root.isConnected)return;
  if(time-last>=50){
   last=time;
   for(const {vehicle,ctx} of rows){
    ctx.fillStyle='#647681';ctx.fillRect(0,0,640,190);ctx.fillStyle='#f1e8d7';ctx.font='11px monospace';
    for(let direction=0;direction<4;direction++){
     ctx.fillText(['FRONT','BACK','LEFT','RIGHT'][direction],direction*160+60,15);
     ctx.save();ctx.translate(direction*160+80,106);ctx.scale(1.8,1.8);
     drawRider(ctx,{...user,avatarModel:view.model},catalog,vehicle,0,0,{direction,moving:view.moving,frame:view.moving?time*60/1000:0,aura:false});ctx.restore();
    }
   }
  }
  requestAnimationFrame(paint);
 };requestAnimationFrame(paint);
 return rows;
}
