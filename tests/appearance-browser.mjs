import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createGameServer} from '../server/index.js';
import {fixtureViteConfig,isolateBrowser} from './fixture-policy.mjs';

const dir=mkdtempSync(join(tmpdir(),'tred-appearance-'));
const {server,streams,engine}=createGameServer({dbPath:join(dir,'test.sqlite')});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const vite=await createServer(fixtureViteConfig(`http://127.0.0.1:${server.address().port}`));
await vite.listen();
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
const errors=[];
await isolateBrowser(page.context(),vite.resolvedUrls.local[0],errors);
page.on('pageerror',error=>errors.push(error.message));
mkdirSync('work/screenshots',{recursive:true});
try {
 await page.goto(vite.resolvedUrls.local[0]);
 await page.locator('#login select').selectOption('dan');
 await page.locator('#login button').click();
 await page.locator('#modal').waitFor({state:'hidden'});
 const audit=await page.evaluate(async()=>{
  const {drawCharacter,characterVariant}=await import('/src/character-art.js');
  const {loadArt,wardrobeSource}=await import('/src/art-assets.js');
  const {actorAnatomy}=await import('/src/actor-anatomy.js');
  const {attachmentBox}=await import('/src/asset-rules.js');
  const {containRect}=await import('/src/sprite-fit.js');
  const {catalog}=await import('/shared/catalog.js');
  await Promise.all(['characters-cardinal','wearables-cardinal','furniture-straight'].map(name=>loadArt(name).decode()));
  const ids=['hai','tuyen'];
  const failures=[],mirrorFailures=[],feetFailures=[],proportionFailures=[],cuffFailures=[],armFailures=[];let count=0;
  const gallery=document.createElement('canvas');gallery.width=720;gallery.height=850;
  const gc=gallery.getContext('2d');gc.fillStyle='#677783';gc.fillRect(0,0,720,850);
  for(const id of ids)for(let variant=0;variant<5;variant++)for(const moving of [false,true]){
   const user={id,equipment:Object.fromEntries(['shirt','hat','glasses','shoes'].map(slot=>[slot,`${slot}-${Math.min(variant,3)}-${variant}`]))};
   const views=[];
   for(let direction=0;direction<4;direction++){
    const c=document.createElement('canvas');c.width=64;c.height=80;
    drawCharacter(c.getContext('2d'),user,catalog,32,40,{direction,moving,frame:8,pet:false,aura:false});
    const pixels=c.getContext('2d').getImageData(0,0,64,80).data;
    const anatomy=actorAnatomy(characterVariant(user),direction);
    for(const slot of ['hat','glasses']){
     if(slot==='glasses'&&direction===1)continue;
     const item=catalog.find(i=>i.id===user.equipment[slot]),source=wardrobeSource(item,direction),box=attachmentBox(slot,direction,anatomy);
     const fit=containRect(source.sw,source.sh,box.x,box.y,box.w,box.h,box.alignY);
     if(slot==='hat'&&(fit.w>anatomy.frontalFace.w*1.25||fit.h>anatomy.head.h*.80))proportionFailures.push({id,direction,slot});
     if(slot==='glasses'&&(fit.w>anatomy.face.w*.8||fit.h>anatomy.face.h*.35))proportionFailures.push({id,direction,slot});
    }
    const bare=document.createElement('canvas');bare.width=64;bare.height=80;
    const equipment={...user.equipment};delete equipment.shoes;
    drawCharacter(bare.getContext('2d'),{...user,equipment},catalog,32,40,{direction,moving,frame:8,pet:false,aura:false});
    const reference=bare.getContext('2d').getImageData(0,0,64,80).data;
    const skin=document.createElement('canvas');skin.width=64;skin.height=80;
    const underlay={...user.equipment};delete underlay.shirt;
    drawCharacter(skin.getContext('2d'),{...user,equipment:underlay},catalog,32,40,{direction,moving,frame:8,pet:false,aura:false});
    const original=skin.getContext('2d').getImageData(0,0,64,80).data;
    for(let y=35;y<46;y++)for(let x=16;x<49;x++){
     const n=(y*64+x)*4,[r,g,b,a]=original.slice(n,n+4);
     if(a>200&&r>g*1.13&&g>b*1.08&&r>140&&pixels[n+3]<40)armFailures.push({id,variant,direction,moving,x,y});
    }
    for(let y=Math.floor(61+anatomy.cuffY-4);y<Math.floor(61+anatomy.cuffY-1);y++)for(let x=20;x<45;x++){
     const n=(y*64+x)*4;if(pixels.slice(n,n+4).some((v,i)=>v!==reference[n+i]))cuffFailures.push({id,variant,direction,moving,x,y});
    }
    for(let y=24;y<36;y++){
     let connected=false;
     for(let x=25;x<40;x++)if(pixels[(y*64+x)*4+3]>40)connected=true;
     if(!connected)failures.push({id,variant,direction,moving,row:y});
    }
    let feet=0;for(let y=54;y<64;y++)for(let x=19;x<45;x++)if(pixels[(y*64+x)*4+3]>40)feet++;
    if(feet<8)feetFailures.push({id,variant,direction,moving,feet});
    views.push(pixels);count++;
    if(id==='hai'&&!moving){gc.save();gc.translate(direction*180+10,variant*170);gc.scale(2.5,2.5);drawCharacter(gc,user,catalog,32,40,{direction,pet:false,aura:false});gc.restore();}
   }
   // Independent cardinal drawings need distinct side views, with complete feet.
   if(views[2].every((value,index)=>value===views[3][index]))mirrorFailures.push({id,variant,moving});

  }
  return {count,failures,mirrorFailures,feetFailures,proportionFailures,cuffFailures,armFailures,gallery:gallery.toDataURL().split(',')[1]};
 });
 writeFileSync('work/screenshots/appearance-directions.png',Buffer.from(audit.gallery,'base64'));
 assert.equal(audit.count,80);
 assert.deepEqual(audit.failures,[],'transparent gaps between the neck and shirt');
 assert.deepEqual(audit.feetFailures,[],'missing feet or shoes');
 assert.deepEqual(audit.mirrorFailures,[],'left and right must have distinct cardinal drawings');
 assert.deepEqual(audit.proportionFailures,[],'accessories must fit the measured skull and face');
 assert.deepEqual(audit.cuffFailures,[],'wearing shoes must not repaint the trouser cuffs');
 assert.deepEqual(audit.armFailures,[],'original forearms must stay continuous below every sleeve');
 console.log(`PASS ${audit.count} character/outfit/direction/animation combinations: necks, feet, anatomy-sized accessories and unchanged trouser cuffs`);

 const workstationAudit=await page.evaluate(async()=>{
  const {catalog}=await import('/shared/catalog.js'),{loadArt,stationSource}=await import('/src/art-assets.js');
  const {drawWorkstation,workstationParts}=await import('/src/item-art.js');
  await Promise.all(['furniture-straight','items-atlas','chairs-rear'].map(n=>loadArt(n).decode()));
  const c=document.createElement('canvas');c.width=1600;c.height=1800;const ctx=c.getContext('2d');ctx.fillStyle='#677783';ctx.fillRect(0,0,c.width,c.height);
  const failures=[];let count=0;
  for(let desk=0;desk<5;desk++)for(let style=0;style<5;style++){
   const user={equipment:Object.fromEntries(['desk','chair','case','monitor','cooling','accessory','decor'].map(slot=>[slot,catalog.find(i=>i.active&&i.category===slot&&i.variant===(slot==='desk'?desk:style)).id]))};
   const parts=workstationParts(user,catalog),surface=parts.find(p=>p.slot==='desk').surface;
   for(const slot of ['case','monitor','accessory']){
    const p=parts.find(p=>p.slot===slot),foot=Math.round(p.y)+p.h;
    if(foot<surface.back-.6||foot>surface.front+.6||p.x<surface.left-.6||p.x+p.w>surface.right+.6)failures.push({desk,style,slot,p,surface});
   }
   const chair=parts.find(p=>p.slot==='chair');if(chair.view!=='back'||!stationSource(chair.item).image)failures.push({desk,style,slot:'chair'});
   ctx.fillStyle='#eef0e5';ctx.font='14px sans-serif';ctx.fillText(`Desk ${desk+1} / setup ${style+1}`,style*320+12,desk*360+20);
   drawWorkstation(ctx,user,catalog,style*320+28,desk*360+35,260,false,0);count++;
  }
  return {count,failures,gallery:c.toDataURL().split(',')[1]};
 });
 writeFileSync('work/screenshots/workstation-all-styles.png',Buffer.from(workstationAudit.gallery,'base64'));
 assert.deepEqual(workstationAudit.failures,[],'all workstation feet must meet the real desk surface');
 console.log(`PASS ${workstationAudit.count} native-art workstation combinations: table contact plane, constrained hardware and rear-facing chairs`);

 const system=await page.evaluate(async()=>{
  const {drawCharacter,drawRider}=await import('/src/character-art.js');
  const {drawItem}=await import('/src/item-art.js');
  const {loadArt,wardrobeSource,itemSource}=await import('/src/art-assets.js');
  const {spriteFrame,drawFrame}=await import('/src/sprite-fit.js');
  const {vehicleRules}=await import('/src/asset-rules.js');
  const state=await fetch('/api/state').then(r=>r.json());
  await Promise.all(['pet-atlas','vehicle-atlas','items-atlas','office-atlas'].map(name=>loadArt(name).decode()));
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d'),empty=[];let vehicles=0;
  for(const item of state.catalog){
   const source=itemSource(item);if(!source||source.empty)empty.push(item.id);
   ctx.clearRect(0,0,128,128);drawItem(ctx,item,16,16,96,0,false,false);
   const data=ctx.getImageData(0,0,128,128).data;
   let opaque=0;for(let n=3;n<data.length;n+=4)if(data[n]>40)opaque++;
   if(opaque<20)empty.push(item.id);
  }
  const rider={id:'hai',equipment:{shirt:'shirt-0-0',shoes:'shoes-0-0',hat:'hat-0-0',glasses:'glasses-0-0'}};
  const gallery=document.createElement('canvas');gallery.width=768;gallery.height=12*110;
  const g=gallery.getContext('2d');g.fillStyle='#687987';g.fillRect(0,0,gallery.width,gallery.height);
  const skinFailures=[],roofFailures=[];
  const vehicleBase=document.createElement('canvas');vehicleBase.width=128;vehicleBase.height=128;
  const vc=vehicleBase.getContext('2d');
  for(const vehicle of state.catalog.filter(item=>item.category==='vehicle'))for(const id of ['hai','tuyen'])for(let direction=0;direction<4;direction++)for(const phase of [0,7,14,21]){
   ctx.clearRect(0,0,128,128);
   drawRider(ctx,{...rider,id},state.catalog,vehicle,64,64,{direction,frame:phase,moving:true,aura:false});vehicles++;
   if(vehicle.kind==='car'){
    const rule=vehicleRules.car,angle=rule.angles[direction],mount=vehicle.mount||vehicle.art?.mount||rule.mount;
    vc.clearRect(0,0,128,128);vc.save();vc.translate(64,64);vc.rotate(angle);
    const fit=drawFrame(vc,itemSource(vehicle),-rule.w/2,-rule.h/2,rule.w,rule.h,.5);vc.restore();
    const expected=vc.getImageData(0,0,128,128).data,actual=ctx.getImageData(0,0,128,128).data;
    const minU=Math.min(...mount.window.map(p=>p[0]))-.025,maxU=Math.max(...mount.window.map(p=>p[0]))+.025;
    const minV=Math.min(...mount.window.map(p=>p[1]))-.025,maxV=Math.max(...mount.window.map(p=>p[1]))+.025;
    let changedOutside=0;
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){
     const dx=x+.5-64,dy=y+.5-64,px=dx*Math.cos(angle)+dy*Math.sin(angle),py=-dx*Math.sin(angle)+dy*Math.cos(angle);
     const u=(px-fit.x)/fit.w,v=(py-fit.y)/fit.h;
     if(u>=minU&&u<=maxU&&v>=minV&&v<=maxV)continue;
     const n=(y*128+x)*4;for(let channel=0;channel<4;channel++)if(expected[n+channel]!==actual[n+channel]){changedOutside++;break;}
    }
    if(changedOutside)roofFailures.push({vehicle:vehicle.id,id,direction,changedOutside});
   }
   if(vehicle.kind==='car'&&direction!==1){
    const data=ctx.getImageData(51,51,26,26).data;let skin=0;
    for(let n=0;n<data.length;n+=4)if(data[n]>140&&data[n]>data[n+1]*1.12&&data[n+1]>data[n+2]*1.08&&data[n+3]>40)skin++;
    if(skin<2)skinFailures.push({vehicle:vehicle.id,id,direction,skin});
   }
   if(vehicle.tier===0&&id==='hai'&&phase===7){
    g.save();g.translate(direction*192+96,vehicle.variant*110+55);drawRider(g,rider,state.catalog,vehicle,0,0,{direction,aura:false});g.restore();
   }
  }
  // An odd-width source grid must not sample a neighbouring atlas cell.
  const grid=document.createElement('canvas');grid.width=5;grid.height=3;const gc=grid.getContext('2d');
  gc.fillStyle='#ff0000';gc.fillRect(0,0,3,3);gc.fillStyle='#0000ff';gc.fillRect(3,0,2,3);
  const left=spriteFrame(grid,0,0,2.5,3),right=spriteFrame(grid,2.5,0,2.5,3);
  const cellColors=[left,right].map(f=>[...f.image.getContext('2d').getImageData(0,0,1,1).data]);
  const dirty=document.createElement('canvas');dirty.width=10;dirty.height=10;
  const dc=dirty.getContext('2d');dc.fillStyle='#fff';dc.fillRect(2,2,4,6);dc.fillRect(0,0,1,1);
  const clean=spriteFrame(dirty,0,0,10,10,true);
  const isolatedBounds=[clean.sx,clean.sy,clean.sw,clean.sh];
  const shirt=state.catalog.find(item=>item.id==='shirt-0-0');
  const paletteChanged=wardrobeSource({...shirt,color:'#ee3344'}).image.toDataURL()!==wardrobeSource({...shirt,color:'#3366ee'}).image.toDataURL();
  ctx.clearRect(0,0,128,128);drawCharacter(ctx,rider,state.catalog,64,64,{pose:'sit',moving:true,aura:false,pet:false});
  const belowSeat=ctx.getImageData(32,80,64,40).data;
  const seatedFeetHidden=!belowSeat.some((value,index)=>index%4===3&&value>40);
  for(let direction=0;direction<4;direction++)drawCharacter(ctx,rider,state.catalog,64,64,{direction,aura:false,pet:false});
  const create=document.createElement;let allocations=0;
  document.createElement=function(name,...args){if(name==='canvas')allocations++;return create.call(this,name,...args);};
  try{for(let n=0;n<120;n++)drawCharacter(ctx,rider,state.catalog,64,64,{direction:n%4,frame:n,moving:true,aura:false,pet:false});}
  finally{document.createElement=create;}
  return {items:state.catalog.length,empty,vehicles,skinFailures,roofFailures,cellColors,isolatedBounds,allocations,paletteChanged,seatedFeetHidden,gallery:gallery.toDataURL().split(',')[1]};
 });
 writeFileSync('work/screenshots/vehicle-system-audit.png',Buffer.from(system.gallery,'base64'));
 assert.deepEqual(system.empty,[],'catalog art must remain visible without rarity badges');
 assert.deepEqual(system.skinFailures,[],'driver faces must remain visible inside all car directions');
 assert.deepEqual(system.roofFailures,[],'drivers and cabin effects must not repaint the roof, hood or exterior');
 assert.deepEqual(system.cellColors,[[255,0,0,255],[0,0,255,255]],'fractional cell edges must not bleed');
 assert.deepEqual(system.isolatedBounds,[2,2,4,6],'single-object cells must discard detached neighbour fragments');
 assert.equal(system.allocations,0,'warm walking frames must not allocate new canvases');
 assert.equal(system.paletteChanged,true,'same variant with a new color must invalidate the texture cache');
 assert.equal(system.seatedFeetHidden,true,'seated people must not retain standing legs or detached shoes');
 console.log(`PASS ${system.items} item assets, ${system.vehicles} vehicle/model/direction renders: intact roofs/exteriors, visible drivers behind glass, atlas isolation and zero canvas allocations in 120 warm frames`);

 const before=await page.evaluate(()=>fetch('/api/state').then(r=>r.json()));
 await page.locator('[data-page=store]').click();
 await page.locator('#category').selectOption('shirt');
 await page.locator('[data-item-id="shirt-0-0"]').click();
 for(const direction of [0,2,1,3]){
  await page.locator(`[data-facing="${direction}"]`).click();
  assert.equal(await page.locator(`[data-facing="${direction}"]`).getAttribute('aria-pressed'),'true');
 }
 await page.locator('#preview-walk').click();
 assert.equal(await page.locator('#preview-walk').getAttribute('aria-pressed'),'true');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'work/screenshots/appearance-mobile.png'});
 const after=await page.evaluate(()=>fetch('/api/state').then(r=>r.json()));
 assert.deepEqual(after.me.inventory,before.me.inventory);
 assert.deepEqual(after.me.equipment,before.me.equipment);
 assert.equal(after.me.rc,before.me.rc);
 assert.equal(after.me.xp,before.me.xp);
 console.log('PASS fitting room rotates and walks on mobile without changing ownership, equipment, RC or XP');

 await page.locator('#close').click();
 for(const [key,facing] of [['a',2],['d',3],['s',0]]){
  await page.keyboard.down(key);await page.waitForTimeout(260);await page.keyboard.up(key);
  await page.waitForFunction(async facing=>{const {game}=await import('/src/economy-ui.js');return game.world.find(u=>u.id===game.state.me.id)?.facing===facing;},facing);
 }
 console.log('PASS movement direction reaches authoritative presence and returns to the world renderer');
 // Exercise actual persistent mount/park actions, movement and animation state.
 engine.mutate('thinh','adjust',{userId:'dan',rc:1000,reason:'Isolated rider integration test'},'rider-qa-credit');
 await page.evaluate(async()=>{const {api}=await import('/src/api.js');await api.action('purchase',{itemId:'vehicle-0-0'});await api.action('equip',{itemId:'vehicle-0-0'});window.dispatchEvent(new Event('game-changed'));});
 await page.waitForFunction(async()=>{const {game}=await import('/src/economy-ui.js');return game.state.me.equipment.vehicle==='vehicle-0-0';});
 await page.locator('#ride-vehicle').click();
 await page.waitForFunction(async()=>{const {game}=await import('/src/economy-ui.js');return game.state.me.vehicleParked===false&&game.animation==='drive';});
 await page.keyboard.down('s');
 await page.waitForFunction(async()=>{const {game}=await import('/src/economy-ui.js');const me=game.world.find(u=>u.id==='dan');return me?.animation==='drive'&&me.moving===true;});
 await page.keyboard.up('s');
 await page.waitForFunction(async()=>{const {game}=await import('/src/economy-ui.js');return game.world.find(u=>u.id==='dan')?.moving===false;});
 await page.keyboard.down('s');
 await page.waitForFunction(async()=>{const {game}=await import('/src/economy-ui.js');return game.world.find(u=>u.id==='dan')?.position.y>=1000;},null,{timeout:10000});
 await page.keyboard.up('s');await page.locator('#ride-vehicle').click();
 await page.waitForFunction(async()=>{const {game}=await import('/src/economy-ui.js');return game.state.me.vehicleParked===true&&game.animation==='idle';});
 console.log('PASS authoritative mount → moving rider → stationary rider → park → walking transition');
 await page.locator('[data-page=garage]').click().catch(async()=>{await page.locator('[data-page=profile]').click();await page.locator('[data-action=garage]').click();});
 await page.locator('[data-action=vehicle-preview]').click();
 assert.equal(await page.locator('#vehicle-pose-preview canvas').count(),12);
 await page.screenshot({path:'work/screenshots/vehicle-preview-mobile.png'});
 console.log('PASS all twelve models have a live four-direction rider preview');
 assert.deepEqual(errors,[]);
} catch(error) {
 await page.screenshot({path:'work/screenshots/appearance-failure.png'}).catch(()=>{});
 console.error('Browser errors:',errors);
 throw error;
} finally {
 await browser.close();await vite.close();
 for(const stream of streams)stream.res.end();
 server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 rmSync(dir,{recursive:true,force:true});
}
