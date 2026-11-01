import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {createGameServer} from '../server/index.js';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {fixtureViteConfig,isolateBrowser} from './fixture-policy.mjs';

const label=process.argv.includes('--before')?'before':'after';
const destination=process.env.TRED_GRAPHICS_OUTPUT||(existsSync('work/quality-restoration/current.txt')?readFileSync('work/quality-restoration/current.txt','utf8').trim():'work/quality-restoration/latest');
mkdirSync(destination,{recursive:true});
const temp=mkdtempSync(join(tmpdir(),'tred-graphics-'));
const {server,streams}=createGameServer({dbPath:join(temp,'test.sqlite')});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const vite=await createServer(fixtureViteConfig(`http://127.0.0.1:${server.address().port}`));await vite.listen();
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const errors=[],metrics=[];
try{
 for(const [name,width,height,dpr] of [['desktop',1440,1000,1],['retina',1440,1000,2],['mobile',390,844,3],['wide-mobile',430,932,2],['landscape',844,390,2]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,hasTouch:width<900});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await isolateBrowser(context,vite.resolvedUrls.local[0],errors);
  await page.goto(vite.resolvedUrls.local[0]);await page.locator('#login select').selectOption('admin');await page.locator('#login [name=password]').fill('admin');await page.locator('#login button').click();await page.locator('#modal').waitFor({state:'hidden'});
  await page.evaluate(async()=>{const {loadArt}=await import('/src/art-assets.js');await Promise.all(['characters-cardinal','wearables-cardinal','wear-shirt','wear-hat','wear-shoes','wear-glasses','vehicle-atlas','items-atlas','furniture-straight'].map(n=>loadArt(n).decode()));});
  await page.waitForTimeout(150);await page.screenshot({path:join(destination,`${label}-${name}-world.png`)});
  const metric=await page.locator('#game').evaluate(c=>({w:c.width,h:c.height,cssW:c.clientWidth,cssH:c.clientHeight,dpr:devicePixelRatio,scale:Number(c.dataset.worldScale),cameraX:Number(c.dataset.cameraX),cameraY:Number(c.dataset.cameraY)}));
  if(label==='after'){
   assert(Math.abs(metric.w-metric.cssW*Math.min(dpr,3))<=1,'world backing resolution must follow screen density');
   assert(Math.abs(metric.scale*dpr-Math.round(metric.scale*dpr))<.00001,'art pixels must align to the device pixel grid');
   const oldScale=metric.scale;await page.locator('#zoom').click();await page.waitForTimeout(50);const zoomed=await page.locator('#game').evaluate(c=>Number(c.dataset.worldScale));assert.notEqual(zoomed,oldScale,'zoom must remain effective on every screen density');await page.locator('#zoom').click();
   await page.setViewportSize({width:width-1,height});await page.waitForTimeout(80);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'resizing must not overflow');await page.setViewportSize({width,height});
  }
  metrics.push({name,...metric});
  if(label==='after'&&name==='mobile'){
   const point=await page.evaluate(async()=>{const {desks}=await import('/src/world.js'),{game,worldUser}=await import('/src/economy-ui.js');const desk=desks.find(d=>worldUser(d.owner)?.id===game.state.me.id),c=document.querySelector('#game'),r=c.getBoundingClientRect(),scale=Number(c.dataset.worldScale);return {x:r.left+(desk.seat.x-Number(c.dataset.cameraX))*scale,y:r.top+(desk.seat.y-Number(c.dataset.cameraY))*scale};});
   await page.touchscreen.tap(point.x,point.y);await page.waitForFunction(()=>document.querySelector('#game').dataset.seatId==='work-8');await page.keyboard.press('e');await page.locator('#chair-checkin').waitFor();await page.locator('#close').click();await page.keyboard.press('d');
   console.log('PASS DPR 3 touch projects the visible owner chair to the correct world interaction');
  }
  await page.locator('[data-page=store]').click();await page.locator('#category').selectOption('shirt');await page.screenshot({path:join(destination,`${label}-${name}-store.png`)});
  if(label==='after'){
   const thumbs=await page.locator('.item-card img').evaluateAll(imgs=>imgs.map(i=>({native:i.naturalWidth,display:i.getBoundingClientRect().width})));assert(thumbs.every(i=>i.native>=i.display*Math.min(dpr,3)),'thumbnails must not be upscaled on supported devices');
   if(width<650)assert(await page.locator('.item-card b').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=12),'mobile catalog text must remain readable');
  }
  await page.locator('[data-item-id="shirt-0-0"]').click();await page.screenshot({path:join(destination,`${label}-${name}-fitting.png`)});
  if(label==='after'){
   const canvas=await page.locator('#fit-preview').evaluate(c=>({w:c.width,css:c.getBoundingClientRect().width}));assert(canvas.w>=canvas.css*Math.min(dpr,3)-1,'fitting preview must use native screen density');
  }
  await page.locator('#close').click();await page.locator('[data-page=profile]').click();await page.screenshot({path:join(destination,`${label}-${name}-profile.png`)});
  await page.locator('[data-action=workspace]').click();await page.screenshot({path:join(destination,`${label}-${name}-workspace.png`)});
  if(label==='after')assert(await page.locator('#setup').evaluate(c=>c.width>=c.getBoundingClientRect().width*Math.min(devicePixelRatio,3)-2),'workspace preview must match its displayed density');
  const probe=await page.evaluate(async()=>{
   const {drawCharacter,drawRider}=await import('/src/character-art.js'),{game}=await import('/src/economy-ui.js');
   const catalog=game.state.catalog,c=document.createElement('canvas');c.width=1280;c.height=1680;const ctx=c.getContext('2d');ctx.fillStyle='#647681';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#f1ebdf';ctx.font='18px system-ui';
   for(let model=0;model<2;model++)for(let style=0;style<5;style++)for(let direction=0;direction<4;direction++){
    const user={id:model?'tuyen':'hai',equipment:Object.fromEntries(['shirt','hat','glasses','shoes'].map(s=>[s,catalog.find(i=>i.category===s&&i.variant===style&&i.active).id]))};
    ctx.save();ctx.translate(model*640+direction*160+80,style*160+120);ctx.scale(2,2);drawCharacter(ctx,user,catalog,0,0,{direction,aura:false,pet:false});ctx.restore();
   }
   const vehicles=catalog.filter(i=>i.active&&i.category==='vehicle');
   vehicles.forEach((v,index)=>{const y=860+Math.floor(index/2)*130;for(let direction=0;direction<4;direction++){
    ctx.save();ctx.translate(index%2*640+direction*160+80,y);ctx.scale(1.6,1.6);drawRider(ctx,{id:'hai',equipment:{shirt:'shirt-0-0'}},catalog,v,0,0,{direction,frame:7,moving:true,aura:false});ctx.restore();
   }});
   return c.toDataURL().split(',')[1];
  });
  if(name==='desktop')writeFileSync(join(destination,`${label}-actors.png`),Buffer.from(probe,'base64'));
  await context.close();console.log(`PASS graphics ${label}: ${name} ${width}×${height} DPR ${dpr}`);
 }
 assert.deepEqual(errors,[]);writeFileSync(join(destination,`${label}-metrics.json`),JSON.stringify(metrics,null,2));
}finally{await browser.close();await vite.close();for(const s of streams)s.res.end();server.closeAllConnections();await new Promise(r=>server.close(r));rmSync(temp,{recursive:true,force:true});}
