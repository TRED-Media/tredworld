import './style.css';
import {configureCanvas,displayRatio,cameraView,screenToWorld,worldToScreen,alternateZoom,setWorldMaterial} from './render-quality.js';
import {icon} from './visuals.js';
import {PresenceMotion} from './presence-motion.js';
const presenceMotion=new PresenceMotion();
import {visibleInOffice} from '../shared/presence.js';
import {game,mountEconomy,openEconomy,syncPosition,chairCheckin,vehicleAction} from './economy-ui.js';
import {drawOfficeProp,workstationParts,drawStationPart} from './item-art.js';
import {drawCharacter,drawRider} from './character-art.js';
import {drawFrame} from './sprite-fit.js';
import {itemSource} from './art-assets.js';
import {actorRig} from './asset-rules.js';
import {vehicleProfile} from './vehicle-rig.js';
import {rooms,desks,blocked} from './world.js';
import {api} from './api.js';
import {officeObjects,hitObject,nearestObject} from './office-interactions.js';
import {officeSeats,occupantOf,foregroundFurniture,sourcePoint} from './office-seats.js';
import {SeatController} from './seat-controller.js';
import {drawOfficeBackground,drawOfficeSeat,drawForeground,drawInteractionMarker} from './office-render.js';
import './moodboard.css';
import './quality.css';
const app=document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML=`<header><a class="brand" href="/">T-RED <span>WORLD</span><small>OFFICE LIFE SIM</small></a><div class="top-center"><span class="live"></span> VĂN PHÒNG T-RED <b> / </b> ĐÀ NẴNG</div><button id="sound" title="Bật/tắt âm thanh">♫ <span>Âm thanh tắt</span></button><button id="profile" class="user"><i>H</i><span>Hải<small>Media Manager · Lv.1</small></span></button></header><main><aside><div class="side-title">KHÁM PHÁ THẾ GIỚI</div><nav id="nav"></nav><div class="side-bottom"><div class="mini-brand">T<span>—</span>RED</div><p>Good people.<br>Good work.<br>Great moments.</p><span class="version">BẢN CHƠI THỬ · 0.1</span></div></aside><section class="play"><div class="world-top"><div><span class="eyebrow">MỘT NGÀY MỚI, MỘT CÂU CHUYỆN MỚI</span><h1>Chào buổi sáng, Hải <span>☀</span></h1><p>Văn phòng đã sẵn sàng. Hôm nay bạn sẽ tạo nên điều gì?</p></div><button id="checkin" class="primary">◉ &nbsp; Check-in văn phòng</button></div><div class="game-frame"><div class="game-hud"><div class="location"><span class="live"></span><b id="location">Văn phòng · Tầng 1</b><small id="clock"></small></div><div class="wallet"><span>🪙 <b>—</b></span><span>XP <b>—</b></span><button id="map" title="Sơ đồ văn phòng">▦</button><button id="settings" title="Cài đặt">⚙</button></div></div><canvas id="game" aria-label="Bản đồ văn phòng tương tác. Dùng WASD hoặc kéo để di chuyển."></canvas><div class="area-label">T-RED OFFICE <span>WORK · CREATE · TOGETHER</span></div><button class="interact" id="interact">E &nbsp; Tương tác</button><div class="game-footer"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Di chuyển <b>·</b> <kbd>E</kbd> Tương tác</span><span>● <b>8</b> nhân vật mẫu <i>·</i> Demo cục bộ</span></div><div id="joystick"><i></i></div><button id="zoom" class="zoom">− / +</button></div><div class="under-world"><span><i class="live"></i> Bạn đang ở <b id="zone">khu làm việc chung</b></span><span>Hãy đến gần một chiếc bàn để khám phá setup <b>↗</b></span></div></section><section class="right"><div class="date"><span id="date"></span><b>☀ 28°</b></div><div class="card player-card"><div class="card-label">NHÂN VẬT CỦA BẠN <span>•••</span></div><canvas id="avatar" width="96" height="100"></canvas><h2>Hải <span>LV.1</span></h2><p>Media Manager</p><div class="xp"><i></i></div><small>Đang kết nối…</small><button id="profile2">Xem hồ sơ nhân vật →</button></div><div class="card quest-card"><div class="card-label">NHIỆM VỤ HÔM NAY <span>▤</span></div><p class="muted">Mỗi bước nhỏ, một thành tựu mới.</p><div id="daily"></div><button id="quests">Xem tất cả nhiệm vụ →</button></div><div class="tip"><span>✦</span><div><b>Góc nhỏ, dấu ấn riêng</b><p>Khám phá góc làm việc của đồng đội và tìm cảm hứng cho riêng bạn.</p><button id="workspace">Ghé góc làm việc →</button></div></div></section></main><footer><span>© T-RED MEDIA <b> / </b> MADE FOR OUR PEOPLE</span><span class="live"></span><span>Làm việc cùng nhau. Lớn lên cùng nhau.</span></footer><div id="modal" hidden></div><div id="toast" role="status"></div>`;
const navItems=[['office','⌂','Văn phòng'],['quests','▤','Nhiệm vụ'],['store','♜','RED Store'],['inventory','▣','Túi đồ'],['workspace','▱','Góc làm việc'],['garage','♧','Bộ sưu tập xe'],['profile','○','Cá nhân']];
document.querySelector('#nav')!.innerHTML=navItems.map(([id,_symbol,label],i)=>`<button data-page="${id}" class="${i===0?'active':''}"><span>${icon(id)}</span>${label}${id==='quests'?'<em>3</em>':''}</button>`).join('');
const canvas=document.querySelector<HTMLCanvasElement>('#game')!,ctx=canvas.getContext('2d')!;
let px=860,py=455,camX=0,camY=0,scale=canvas.clientWidth<500?.85:1.1,frame=0,last=0,moving=false,facing=0,driving=false;let view=cameraView(1,1,scale,displayRatio(),px,py); const keys=new Set<string>();let joy:{x:number,y:number,dx:number,dy:number}|null=null;let pointerStart:{x:number,y:number}|null=null;
const seating=new SeatController(api,(message:string)=>toast(message),()=>game.state?.me.id);
let sceneObjects:any[]=[],hoverPoint:{x:number,y:number}|null=null,identity:string|undefined;
const interactionHint=document.createElement('div');interactionHint.id='interaction-hint';interactionHint.setAttribute('role','status');interactionHint.setAttribute('aria-live','polite');document.querySelector('.game-frame')!.append(interactionHint);
function rect(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)}
function text(c:CanvasRenderingContext2D,t:string,x:number,y:number,size=10,color='#424955'){c.font=`bold ${size}px monospace`;c.fillStyle=color;c.fillText(t,x,y)}
function nameplate(label:{name:string,x:number,y:number,secondary?:boolean}){
 const p=worldToScreen(view,label.x,label.y);if(p.x<0||p.x>view.width||p.y<0||p.y>view.height)return;
 ctx.font=`${label.secondary?500:600} ${label.secondary?11:12}px system-ui, sans-serif`;ctx.textBaseline='middle';
 const width=Math.min(220,ctx.measureText(label.name).width+14),x=Math.round(Math.max(2,Math.min(view.width-width-2,p.x-width/2))),y=Math.round(p.y);
 ctx.fillStyle=label.secondary?'#263348ed':'#1e2b40f2';ctx.fillRect(x,y,width,20);ctx.fillStyle='#718198';ctx.fillRect(x,y,width,1);
 ctx.fillStyle='#f1ebdf';ctx.fillText(label.name,x+7,y+10,width-14);ctx.textBaseline='alphabetic';
}
function plant(c:CanvasRenderingContext2D,x:number,y:number,s=1){if(drawOfficeProp(c,2,x-16*s,y-48*s,32*s,66*s))return;c.save();c.translate(x,y);c.scale(s,s);rect(c,-10,4,20,18,'#444e59');rect(c,-8,3,16,15,'#e0ded4');rect(c,-6,14,12,3,'#b0b5b1');rect(c,-2,-22,4,28,'#596b39');for(let i=0;i<8;i++){const a=i*2.4;rect(c,Math.sin(a)*10-5,-8-i*3,10,10,i%2?'#527a43':'#779854');rect(c,Math.sin(a)*10-3,-8-i*3,3,6,'#9db268');}c.restore()}
function equippedVehicle(user:any){return game.state?.catalog.find((i:any)=>i.id===user?.equipment?.vehicle);}
function actorDepth(user:any,y:number,direction:number,ride=false){if(!ride)return y+actorRig.floorOffset;const vehicle=equippedVehicle(user);if(!vehicle)return y+actorRig.floorOffset;const profile=vehicleProfile(vehicle);return y+(direction<2?profile.h:profile.w)/2;}
function worldCharacter(user:any,x:number,y:number,direction:number,walk=false,ride=false){
 const options={direction,frame,moving:walk,aura:game.aura};
 if(ride&&equippedVehicle(user))drawRider(ctx,user,game.state.catalog,equippedVehicle(user),x,y,options);
 else drawCharacter(ctx,user,game.state?.catalog||[],x,y,options);
}
function draw(){
 const {width:w,height:h,ratio}=configureCanvas(canvas,canvas.clientWidth,canvas.clientHeight);view=cameraView(w,h,scale,ratio,px,py);camX=view.x;camY=view.y;canvas.dataset.worldScale=String(view.scale);canvas.dataset.cameraX=String(camX);canvas.dataset.cameraY=String(camY);canvas.dataset.seatId=seating.seatId||'';canvas.dataset.walkTarget=seating.target?.id||'';
 ctx.fillStyle='#c3c5bf';ctx.fillRect(0,0,w,h);setWorldMaterial(ctx,true);ctx.save();ctx.scale(view.scale,view.scale);ctx.translate(-camX,-camY);
 for(let y=0;y<1248;y+=32)for(let x=0;x<1344;x+=32){rect(ctx,x,y,31,31,(x/32+y/32)%2?'#babdb7':'#c1c3bd');}
 drawOfficeBackground(ctx);
 const layers:{depth:number,order:number,paint:()=>void}[]=[],labels:{name:string,x:number,y:number,secondary?:boolean}[]=[];
 const add=(depth:number,order:number,paint:()=>void)=>layers.push({depth,order,paint});
 if(game.state){
  sceneObjects=officeObjects(game.state.users,game.state.catalog,workstationParts);
  const me={...game.state.me,online:true,seatId:seating.seatId,seat:undefined},users=[...game.world.filter((u:any)=>u.id!==me.id&&visibleInOffice(u)),...(me.status==='Onsite'?[]:[me])];
  for(const object of sceneObjects){
   if(object.kind==='workspace'){
    const d=desks[object.deskIndex],table=object.parts.find((p:any)=>p.slot==='desk'),depth=d.y-22+(table?table.y+table.h:69);
    for(const part of object.parts)if(part.slot!=='chair')add(depth,part.layer,()=>drawStationPart(ctx,part,d.x,d.y-22,96,frame*1000/60));
    labels.push({name:game.state.users.find((u:any)=>u.id===object.owner)?.name||'',x:d.x+48,y:object.point.y+5,secondary:true});
   }else if(object.kind==='chair'){
    const occupant=occupantOf(object,users);add(object.floor.y,10,()=>drawOfficeSeat(ctx,object,occupant,game.state.catalog,frame));
   }
  }
  for(const object of foregroundFurniture){const p=sourcePoint(object.rect[0],object.rect[1]+object.rect[3]);add(p.y,15,()=>drawForeground(ctx,object));}
  presenceMotion.retain(game.world.map((u:any)=>u.id));
  for(const user of game.world){
   if(user.id===me.id||!user.online||!visibleInOffice(user)||user.seatId)continue;
   const pose=presenceMotion.sample(user,performance.now());add(actorDepth(user,pose.y,pose.direction,user.vehicleParked===false),10,()=>worldCharacter(user,pose.x,pose.y,pose.direction,pose.moving,user.vehicleParked===false));labels.push({name:user.name,x:pose.x,y:pose.y-(user.vehicleParked===false?70:54)});
  }
  if(!seating.seatId&&me.status!=='Onsite'){add(actorDepth(me,py,facing,driving),10,()=>worldCharacter(me,px,py,facing,moving,driving));labels.push({name:me.name,x:px,y:py-(driving?70:54)});}
  game.state.users.forEach((user:any,i:number)=>{const vehicle=game.state.catalog.find((it:any)=>it.id===user.equipment.vehicle);if(vehicle){if(!(user.id===me.id?driving:user.vehicleParked===false))add(1128,5,()=>drawFrame(ctx,itemSource(vehicle),60+(i%12)*106,1038,90,90,1));}});
 }
 for(const xx of [34,1290])for(const yy of [300,440,740,990])add(yy+20,5,()=>plant(ctx,xx,yy,1.4));
 layers.sort((a,b)=>a.depth-b.depth||a.order-b.order);for(const layer of layers)layer.paint();
 const focused=hoverPoint?hitObject(sceneObjects,hoverPoint.x,hoverPoint.y):nearestObject(sceneObjects,{x:px,y:py});
 canvas.dataset.focusObject=focused?.id||'';canvas.dataset.seatCount=String(sceneObjects.filter(o=>o.kind==='chair').length);
 for(const object of sceneObjects)drawInteractionMarker(ctx,object,{focused:object.id===focused?.id,occupied:object.kind==='chair'&&!!occupantOf(object,game.world),frame});
 ctx.restore();setWorldMaterial(ctx,false);for(const label of labels)nameplate(label);
 const active=sceneObjects.find(o=>o.id===seating.seatId),hint=active||focused;
 interactionHint.hidden=!game.state||!document.querySelector('#modal')!.hasAttribute('hidden');
 interactionHint.textContent=seating.target?'Đang đi tới '+seating.target.label+' · Di chuyển để hủy':active?(active.owner===game.state?.me.id&&game.state?.me.status!=='Working'?'E · Check-in làm việc | Di chuyển để đứng':'E · Đứng dậy | Di chuyển để rời ghế'):hint?(hint.kind==='chair'?(occupantOf(hint,game.world)?'Ghế đang có người':'Chạm / E · Ngồi · '+hint.label):'Chạm / E · '+hint.label):'Dấu vuông vàng: có thể tương tác';
 canvas.style.cursor=focused?'pointer':'grab';
}

function update(t:number){
 const dt=Math.min((t-last)/1000,.04);last=t;
 if(identity!==game.state?.me.id){identity=game.state?.me.id;seating.reset();const saved=game.state?.me.seat;if(saved&&saved.until>game.state.serverTime){const seat=officeSeats(game.state.users,game.state.catalog).find(s=>s?.id===saved.id);if(seat){px=seat.approach.x;py=seat.approach.y;seating.seatId=seat.id;seating.renewAt=t+2000;void api.request('position',{x:Math.round(px),y:Math.round(py),animation:'sit',facing:seat.direction,moving:false}).catch(()=>{seating.leave();toast('Không thể khôi phục chỗ ngồi. Hãy chọn ghế lại.');});}}}
 let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
 if(joy){dx=joy.dx/35;dy=joy.dy/35;}
 const modalClosed=document.querySelector('#modal')!.hasAttribute('hidden');
 if((dx||dy)&&modalClosed&&(seating.seatId||seating.target||seating.pending))seating.leave();
 if(dx&&dy){if(Math.abs(dx)>=Math.abs(dy)){if(blocked(px+Math.sign(dx)*5,py))dx=0;else dy=0;}else{if(blocked(px,py+Math.sign(dy)*5))dy=0;else dx=0;}}
 const norm=Math.max(1,Math.hypot(dx,dy));moving=!!(dx||dy)&&modalClosed;
 if(moving){const oldX=px,oldY=py,speed=driving?245:145,nx=px+dx/norm*speed*dt,ny=py+dy/norm*speed*dt;if(!blocked(nx,py)&&(!driving||nx>=55&&nx<=1289))px=nx;if(!blocked(px,ny)&&(!driving||ny>=80&&ny<=1180))py=ny;const actualX=px-oldX,actualY=py-oldY;if(actualX||actualY)facing=Math.abs(actualX)>Math.abs(actualY)?(actualX<0?2:3):(actualY<0?1:0);else moving=false;}
 else if(modalClosed||seating.seatId){const auto=seating.step({x:px,y:py},dt,t);if(auto){px=auto.x;py=auto.y;facing=auto.direction;moving=auto.moving;}}
 frame=Math.floor(t*60/1000);
 if(frame%20===0){const room=rooms.find(r=>px>r.x&&px<r.x+r.w&&py>r.y&&py<r.y+r.h);const zone=py>980?'Bãi đỗ xe':room?.name||'Khu làm việc chung';document.querySelector('#zone')!.textContent=zone;document.querySelector('#location')!.textContent=zone;}
 driving=!!equippedVehicle(game.state?.me)&&game.state?.me.vehicleParked===false;if((driving||game.state?.me.status==='Onsite')&&(seating.seatId||seating.target))seating.leave();
 game.animation=driving?'drive':seating.seatId?'sit':moving?'walk':'idle';
 if(seating.seatId){const seat=sceneObjects.find(o=>o.id===seating.seatId);if(seat)facing=seat.direction;}
 const rideButton=document.querySelector<HTMLButtonElement>('#ride-vehicle')!;rideButton.hidden=false;rideButton.textContent=driving?'Xuống xe':'Lái xe';syncPosition(px,py,moving,facing);draw();requestAnimationFrame(update);
}

function resize(){configureCanvas(canvas,canvas.clientWidth,canvas.clientHeight);if(!last)scale=canvas.clientWidth<500?.85:1.1;}new ResizeObserver(resize).observe(canvas);requestAnimationFrame(update);
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement).tagName))return;if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e'].includes(e.key.toLowerCase()))e.preventDefault();keys.add(e.key.toLowerCase());if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())&&(seating.seatId||seating.target||seating.pending))seating.leave();if(e.key.toLowerCase()==='e')interact();});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();joy=null;});
const joystick=document.querySelector<HTMLElement>('#joystick')!;
canvas.onpointerdown=e=>{if(!document.querySelector('#modal')!.hasAttribute('hidden'))return;canvas.setPointerCapture(e.pointerId);pointerStart={x:e.offsetX,y:e.offsetY};joy={x:e.offsetX,y:e.offsetY,dx:0,dy:0};};
canvas.onpointermove=e=>{hoverPoint=screenToWorld(view,e.offsetX,e.offsetY);if(!joy)return;joy.dx=Math.max(-35,Math.min(35,e.offsetX-joy.x));joy.dy=Math.max(-35,Math.min(35,e.offsetY-joy.y));if(Math.hypot(joy.dx,joy.dy)>7){if(seating.seatId||seating.target||seating.pending)seating.leave();joystick.style.cssText=`display:block;left:${joy.x-37}px;top:${joy.y+58-37}px`;joystick.firstElementChild!.setAttribute('style',`transform:translate(${joy.dx}px,${joy.dy}px)`);}};
canvas.onpointerleave=()=>{hoverPoint=null;};
canvas.onpointerup=e=>{if(pointerStart&&Math.hypot(e.offsetX-pointerStart.x,e.offsetY-pointerStart.y)<8){hoverPoint=screenToWorld(view,e.offsetX,e.offsetY);const target=hitObject(sceneObjects,hoverPoint.x,hoverPoint.y);if(target)activateObject(target);}joy=null;pointerStart=null;joystick.style.display='none';};
canvas.onpointercancel=()=>{joy=null;pointerStart=null;joystick.style.display='none';};
function activateObject(target:any){if(!game.state)return;if(target.kind==='chair'){if(game.state.me.status==='Onsite'){toast('Về văn phòng trước khi ngồi ghế');return;}if(driving){toast('Gửi xe trước khi ngồi ghế');return;}if(target.id===seating.seatId){seating.leave();return;}seating.navigate(target,{x:px,y:py},!!occupantOf(target,game.world.filter((u:any)=>u.id!==game.state.me.id)));}else if(target.kind==='workspace'){const owner=game.state.users.find((u:any)=>u.id===target.owner);openEconomy('workspace',owner?.id);}else openPage('garage');}

function toast(t:string){const el=document.querySelector('#toast')!;el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),3200);}
function modal(title:string,body:string){title=title.replace(/[&<>"\']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","\'":"&#39;"}[c]!));keys.clear();joy=null;seating.cancelNavigation();const el=document.querySelector<HTMLElement>('#modal')!;el.hidden=false;el.innerHTML=`<article role="dialog" aria-modal="true" aria-label="${title}"><div class="modal-title"><h2>${title}</h2><button id="close" aria-label="Đóng">←</button></div>${body}</article>`;document.querySelector<HTMLButtonElement>('#close')!.onclick=()=>{el.hidden=true;};el.onclick=e=>{if(e.target===el)el.hidden=true;};document.querySelector<HTMLButtonElement>('#close')!.focus();}

function interact(){if(seating.seatId){const seat=sceneObjects.find(o=>o.id===seating.seatId);if(seat?.owner===game.state?.me.id&&game.state.me.status!=='Working')chairCheckin();else seating.leave();return;}if(py>982&&equippedVehicle(game.state?.me)){toggleRide();return;}const target=hoverPoint?hitObject(sceneObjects,hoverPoint.x,hoverPoint.y):nearestObject(sceneObjects,{x:px,y:py});if(target)activateObject(target);else toast('Đến gần vật có dấu vuông vàng rồi nhấn E');}
function openPage(page:string){document.querySelectorAll<HTMLElement>('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===page));if(page==='office'){document.querySelector<HTMLElement>('#modal')!.hidden=true;return;}openEconomy(page);}
const rideButton=document.createElement('button');rideButton.id='ride-vehicle';rideButton.className='ride';rideButton.hidden=true;rideButton.textContent='Lái xe';rideButton.onclick=toggleRide;document.querySelector('.game-frame')!.append(rideButton);
function toggleRide(){if(!equippedVehicle(game.state?.me)){openPage('garage');return;}if(driving&&py<982){toast('Đưa xe xuống bãi để gửi');return;}void vehicleAction(driving?'park':'ride',py);}
window.addEventListener('work-ready',()=>{if(!seating.seatId){const seat=sceneObjects.find(o=>o.kind==='chair'&&o.owner===game.state?.me.id);if(seat)activateObject(seat);}});
window.addEventListener('ride-ready',()=>{seating.leave();driving=true;game.animation='drive';px=Math.max(55,Math.min(1289,px));py=Math.max(80,Math.min(1180,py));});
document.querySelectorAll<HTMLElement>('[data-page]').forEach(b=>b.onclick=()=>openPage(b.dataset.page!));for(const id of ['profile','profile2','quests','workspace'])document.querySelector<HTMLButtonElement>('#'+id)!.onclick=()=>openPage(id==='profile2'?'profile':id);document.querySelector<HTMLButtonElement>('#interact')!.onclick=interact;document.querySelector<HTMLButtonElement>('#zoom')!.onclick=()=>{scale=alternateZoom(view);};document.querySelector<HTMLButtonElement>('#map')!.onclick=()=>{modal('Sơ đồ văn phòng · Tầng 1',`<div class="room-list">${rooms.map(r=>`<div>⌂ <b>${r.name}</b></div>`).join('')}<div>▦ MEDIA & OPERATIONS · 12 bàn</div><div>↓ PARKING · Phía Nam văn phòng</div></div><p class="muted">Các cửa nằm giữa cạnh dưới của từng phòng. Đi qua hành lang chung để khám phá.</p>`);};let sound=false;let audio:AudioContext|undefined;document.querySelector<HTMLButtonElement>('#sound')!.onclick=()=>{sound=!sound;document.querySelector('#sound span')!.textContent=sound?'Âm thanh bật':'Âm thanh tắt';if(sound){audio??=new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=660;g.gain.value=.035;o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.15);}};document.querySelector('#date')!.textContent=new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'2-digit',month:'2-digit'});setInterval(()=>{document.querySelector('#clock')!.textContent=new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});},1000);const av=document.querySelector<HTMLCanvasElement>('#avatar')!.getContext('2d')!;av.imageSmoothingEnabled=false;av.scale(2.5,2.5);drawCharacter(av,{id:'hai'},[],19,26,{pet:false});document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelector<HTMLElement>('#modal')!.hidden=true;});

// Two-finger zoom uses touch events so HUD controls never start movement.
let pinchDistance=0,pinchScale=scale;
canvas.addEventListener('touchstart',e=>{if(e.touches.length===2){e.preventDefault();joy=null;joystick.style.display='none';pinchDistance=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);pinchScale=scale;}},{passive:false});
canvas.addEventListener('touchmove',e=>{if(e.touches.length===2&&pinchDistance){e.preventDefault();joy=null;scale=Math.max(.65,Math.min(2.5,pinchScale*Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)/pinchDistance));}},{passive:false});
canvas.addEventListener('touchend',()=>{pinchDistance=0;joy=null;joystick.style.display='none';});
document.querySelector<HTMLButtonElement>('#map')!.onclick=()=>{modal('Sơ đồ văn phòng · Tầng 1',`<canvas id="minimap" width="336" height="312" style="width:100%;image-rendering:pixelated;border:1px solid #73849a"></canvas><p class="muted">● Đỏ: vị trí của bạn. Đi qua các lối mở giữa phòng và hành lang. Bãi xe nằm phía Nam.</p>`);const mini=document.querySelector<HTMLCanvasElement>('#minimap')!,{ctx:c}=configureCanvas(mini,336,312,{ratio:displayRatio()*mini.getBoundingClientRect().width/336});c.fillStyle='#b9bfb7';c.fillRect(0,0,336,312);c.scale(.25,.25);for(const r of rooms){c.fillStyle='#778b9b';c.fillRect(r.x,r.y,r.w,r.h);c.strokeStyle='#e5e3d7';c.lineWidth=8;c.strokeRect(r.x,r.y,r.w,r.h);text(c,r.name,r.x+12,r.y+60,21,'#fff');}for(const d of desks){c.fillStyle='#ae8a60';c.fillRect(d.x,d.y,96,50);}c.fillStyle='#64717f';c.fillRect(0,980,1344,268);text(c,'PARKING',530,1130,32,'#fff');c.fillStyle='#ed607b';c.beginPath();c.arc(px,py,20,0,Math.PI*2);c.fill();};
if('serviceWorker' in navigator&&import.meta.env.PROD)navigator.serviceWorker.register('/sw.js').catch(()=>{});

const mapHandler=document.querySelector<HTMLButtonElement>('#map')!.onclick!;
window.addEventListener('open-map',()=>{mapHandler.call(document.querySelector<HTMLButtonElement>('#eco-map')!,new PointerEvent('click'));const el=document.querySelector('#modal article');if(el&&game.state){const info=document.createElement('p');info.textContent='Onsite: '+game.world.filter((u:any)=>u.status==='Onsite').map((u:any)=>u.name).join(', ');el.append(info);}});
void mountEconomy(modal,toast).then(()=>{if(game.state&&new URLSearchParams(location.search).get('preview')==='vehicles')openEconomy('vehicle-preview');});
