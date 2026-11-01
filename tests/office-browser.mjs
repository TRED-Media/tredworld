import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {createGameServer} from '../server/index.js';
import {fixtureViteConfig,isolateBrowser} from './fixture-policy.mjs';
import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import {newDirectory} from '../scripts/dev-evidence.mjs';
const flag=process.argv.indexOf('--output'),out=newDirectory(process.cwd(),flag<0?(process.env.TRED_OFFICE_OUTPUT||'work/office-qa/'+Date.now()):process.argv[flag+1]);
const temp=mkdtempSync(join(tmpdir(),'tred-office-')),{server,streams}=createGameServer({dbPath:join(temp,'fixture.sqlite')});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const vite=await createServer(fixtureViteConfig(`http://127.0.0.1:${server.address().port}`));await vite.listen();
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});const errors=[];
const login=async(context,id)=>{await isolateBrowser(context,vite.resolvedUrls.local[0],errors);const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));await page.goto(vite.resolvedUrls.local[0]);await page.locator('#login select').selectOption(id);if(id==='admin')await page.locator('#login [name=password]').fill('admin');await page.locator('#login button').click();await page.locator('#modal').waitFor({state:'hidden'});await page.evaluate(async()=>{const {loadArt}=await import('/src/art-assets.js');await Promise.all(['characters-cardinal','wear-shirt','wear-shoes','wear-glasses','wear-hat','chairs-cardinal','office-standard','items-atlas','furniture-straight'].map(n=>loadArt(n).decode()));});return page;};
const state=p=>p.evaluate(()=>fetch('/api/state').then(r=>r.json()));
const point=async(p,id)=>p.evaluate(async id=>{const {officeObjects}=await import('/src/office-interactions.js'),{game}=await import('/src/economy-ui.js'),{workstationParts}=await import('/src/item-art.js');const o=officeObjects(game.state.users,game.state.catalog,workstationParts).find(o=>o.id===id),c=document.querySelector('#game'),r=c.getBoundingClientRect(),scale=+c.dataset.worldScale;return {x:r.left+(o.floor.x- +c.dataset.cameraX)*scale,y:r.top+(o.floor.y-15- +c.dataset.cameraY)*scale};},id);
const sit=async(p,id,touch=false)=>{const at=await point(p,id);if(touch)await p.touchscreen.tap(at.x,at.y);else await p.mouse.click(at.x,at.y);await p.waitForFunction(id=>document.querySelector('#game').dataset.seatId===id,id);};
try{
 const context=await browser.newContext({viewport:{width:2560,height:1800}}),page=await login(context,'admin');await page.waitForFunction(()=>document.querySelector('#game').dataset.seatCount==='28');
 const audit=await page.evaluate(async()=>{
  const {characterSurface,drawCharacter,drawRider}=await import('/src/character-art.js'),{wardrobeSource,cardinalFrame,chairSource,stationSource}=await import('/src/art-assets.js'),{drawOfficeSeat}=await import('/src/office-render.js'),{drawFrame}=await import('/src/sprite-fit.js'),{setWorldMaterial}=await import('/src/render-quality.js'),{game}=await import('/src/economy-ui.js'),catalog=game.state.catalog;
  const failures=[],clipping=[],alpha=[],renders={};let count=0;
  for(const density of [2,4])for(const id of ['hai','tuyen'])for(let variant=0;variant<5;variant++)for(let direction=0;direction<4;direction++){
   const user={id,equipment:Object.fromEntries(['shirt','hat','glasses','shoes'].map(slot=>[slot,catalog.find(i=>i.active&&i.category===slot&&i.variant===variant).id]))},surface=characterSurface(user,catalog,direction,density),pixels=surface.getContext('2d').getImageData(0,0,surface.width,surface.height).data;
   for(let y=0;y<surface.height;y++)for(let x=0;x<surface.width;x++){const a=pixels[(y*surface.width+x)*4+3];if((x<4||y<4||x>=surface.width-4||y>=surface.height-4)&&a)clipping.push({id,variant,direction,x,y});if(a!==0&&a!==255)alpha.push({id,variant,direction});}
   const without={...user,equipment:{...user.equipment}};delete without.equipment.hat;const bare=characterSurface(without,catalog,direction,density).getContext('2d').getImageData(0,0,surface.width,surface.height).data;
   for(let y=0;y<surface.height;y++)for(let x=0;x<surface.width;x++){const n=(y*surface.width+x)*4;if(bare[n+3]>128&&pixels[n+3]===0)failures.push({id,variant,direction,x,y});}count++;
  }
  const customChair={category:'chair',variant:0,art:{atlas:'chairs-cardinal',columns:4,rows:5,column:0,row:4,directional:true}};
  for(let direction=0;direction<4;direction++){
   const actual=document.createElement('canvas'),expected=document.createElement('canvas');actual.width=expected.width=80;actual.height=expected.height=100;
   const seat={style:0,direction,w:34,h:47,floor:{x:40,y:80},item:customChair};drawOfficeSeat(actual.getContext('2d'),seat,null,catalog);drawOfficeSeat(expected.getContext('2d'),{...seat,style:4,item:undefined},null,catalog);
   if(actual.toDataURL()!==expected.toDataURL())throw Error('Office chair ignored its custom cardinal atlas');
  }
  if(stationSource(customChair)!==chairSource(customChair,1))throw Error('Preview and office chair use different views');
  let c=document.createElement('canvas');c.width=1600;c.height=1600;let ctx=c.getContext('2d');setWorldMaterial(ctx,true);ctx.fillStyle='#657580';ctx.fillRect(0,0,c.width,c.height);
  for(let style=0;style<5;style++)for(let direction=0;direction<4;direction++)for(let model=0;model<2;model++){
   ctx.save();ctx.translate(direction*400+model*200+100,style*320+245);ctx.scale(2.3,2.3);drawOfficeSeat(ctx,{style,direction,w:34,h:47,floor:{x:0,y:0}},{id:model?'tuyen':'hai',equipment:{shirt:'shirt-0-0',hat:'hat-0-0',shoes:'shoes-0-0'}},catalog);ctx.restore();
  }renders['seated-gallery.png']=c.toDataURL().split(',')[1];
  c=document.createElement('canvas');c.width=800;c.height=2400;ctx=c.getContext('2d');ctx.fillStyle='#657580';ctx.fillRect(0,0,c.width,c.height);const wear=catalog.filter(i=>i.active&&['shirt','hat','glasses','shoes'].includes(i.category));
  wear.forEach((item,row)=>{for(let direction=0;direction<4;direction++){const frame=wardrobeSource(item,direction);drawFrame(ctx,frame,direction*200+25,row*120+10,150,100,.5);}});renders['item-four-directions.png']=c.toDataURL().split(',')[1];
  const warm=document.createElement('canvas');warm.width=warm.height=512;const wc=warm.getContext('2d');setWorldMaterial(wc,true);const rider={id:'hai',equipment:{shirt:'shirt-0-0',hat:'hat-0-0',shoes:'shoes-0-0'}},bike=catalog.find(i=>i.active&&i.category==='vehicle'&&i.kind==='bike');drawCharacter(wc,rider,catalog,100,100,{pet:false,aura:false});drawRider(wc,rider,catalog,bike,250,250,{direction:0,frame:0,moving:true});const create=document.createElement.bind(document);let allocations=0;document.createElement=function(name,...args){if(name==='canvas')allocations++;return create(name,...args);};try{for(let frame=0;frame<120;frame++){drawCharacter(wc,rider,catalog,100,100,{frame,moving:true,pet:false,aura:false});drawRider(wc,rider,catalog,bike,250,250,{direction:0,frame,moving:true});}}finally{document.createElement=create;}
  return {count,failures:failures.slice(0,10),clipping:clipping.slice(0,10),alpha:alpha.slice(0,10),allocations,renders};
 });
 for(const [name,data]of Object.entries(audit.renders))writeFileSync(join(out,name),Buffer.from(data,'base64'));
 assert.deepEqual(audit.clipping,[],'all cached sprites need transparent gutters');assert.deepEqual(audit.failures,[],'equipping hats must never cut the head silhouette');assert.deepEqual(audit.alpha,[],'compiled character surfaces must have binary alpha');
 assert.equal(audit.allocations,0,'canonical world textures must not allocate canvases in warm animation');
 await page.screenshot({path:join(out,'office-desktop.png')});const before=await state(page);
 const free=await point(page,'waiting-1');await page.mouse.move(free.x,free.y);await page.waitForFunction(()=>document.querySelector('#game').dataset.focusObject==='waiting-1');await page.screenshot({path:join(out,'highlight-free.png')});
 for(const id of ['meeting-west','waiting-1','lounge-1','pantry-1','reception-counter','work-8']){await sit(page,id);assert.equal((await state(page)).me.seat.id,id);await page.screenshot({path:join(out,'seated-'+id+'.png')});await page.keyboard.press('d');await page.waitForFunction(()=>!document.querySelector('#game').dataset.seatId);}
 const after=await state(page);for(const field of ['rc','xp','inventory','equipment','status'])assert.deepEqual(after.me[field],before.me[field]);assert.equal(after.shifts.length,before.shifts.length);
 await sit(page,'waiting-1');const other=await browser.newContext({viewport:{width:2560,height:1800}}),second=await login(other,'dan');const occupied=await point(second,'waiting-1');await second.mouse.move(occupied.x,occupied.y);await second.screenshot({path:join(out,'highlight-occupied.png')});await second.mouse.click(occupied.x,occupied.y);await second.waitForTimeout(300);assert.equal(await second.locator('#game').getAttribute('data-walk-target'),'');assert.equal((await state(second)).me.seat,undefined);
 const old=await state(page);await page.reload();await page.waitForFunction(()=>document.querySelector('#game').dataset.seatId==='waiting-1');assert.equal((await state(page)).me.rc,old.me.rc);await page.keyboard.press('d');
 const far=await point(page,'pantry-1');await page.mouse.click(far.x,far.y);await page.waitForFunction(()=>document.querySelector('#game').dataset.walkTarget==='pantry-1');await page.keyboard.press('s');await page.waitForFunction(()=>!document.querySelector('#game').dataset.walkTarget);
 await sit(page,'work-8');await page.keyboard.press('e');await page.locator('#chair-checkin').waitFor();const png=new PNG({width:32,height:32});png.data.fill(255);await page.locator('#chair-checkin input[type=file]').setInputFiles({name:'checkin.png',mimeType:'image/png',buffer:PNG.sync.write(png)});await page.locator('#chair-checkin button[type=submit]').click();await page.locator('#modal').waitFor({state:'hidden'});assert.equal((await state(page)).me.status,'Working');assert.equal((await state(page)).me.xp,before.me.xp+2);await page.screenshot({path:join(out,'work-checkin.png')});await page.keyboard.press('e');
 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,hasTouch:true}),phone=await login(mobile,'visitor');await sit(phone,'work-8',true);await phone.screenshot({path:join(out,'mobile-seated.png')});await phone.keyboard.press('d');await phone.waitForFunction(()=>!document.querySelector('#game').dataset.seatId);await phone.waitForFunction(async()=>!(await fetch('/api/state').then(r=>r.json())).me.seat);
 assert.deepEqual(errors,[]);writeFileSync(join(out,'results.json'),JSON.stringify({characters:audit.count,customChairViews:4,chairs:28,sourceClipping:0,headCuts:0,alphaIssues:0,realChairClicks:9,occupied:'passed',reconnect:'passed',manualCancel:'passed',mobileDpr3:'passed',seatingEconomyUnchanged:true,photoCheckin:'passed',errors},null,2));console.log('PASS complete silhouettes, 28 reachable chairs, real click/walk/sit/stand, occupation, reconnect, cancellation, photo check-in and DPR 3 touch');
}catch(error){const page=browser.contexts()[0]?.pages()[0];if(page){await page.screenshot({path:join(out,'failure.png')}).catch(()=>{});const state=await page.locator('#game').evaluate(c=>({seat:c.dataset.seatId,target:c.dataset.walkTarget,focus:c.dataset.focusObject,toast:document.querySelector('#toast')?.textContent})).catch(()=>null);writeFileSync(join(out,'failure.json'),JSON.stringify({message:error.message,state,errors},null,2));}throw error;}
finally{await browser.close();await vite.close();for(const s of streams)s.res.end();server.closeAllConnections();await new Promise(r=>server.close(r));rmSync(temp,{recursive:true,force:true});}
