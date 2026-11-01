import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {createGameServer} from '../server/index.js';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync,readdirSync,existsSync,statSync} from 'node:fs';
import {tmpdir,platform,arch} from 'node:os';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {PNG} from 'pngjs';
import {hash,save,newDirectory,runtimePath,runtimeHash} from '../scripts/dev-evidence.mjs';
import {profiles,expectedImages} from '../scripts/visual-evidence.mjs';
import {fixtureViteConfig,isolateBrowser} from './fixture-policy.mjs';

const index=process.argv.indexOf('--output');if(index<0)throw new Error('Supply --output work/new-immutable-capture');
const output=newDirectory(process.cwd(),process.argv[index+1]),temp=mkdtempSync(join(tmpdir(),'tred-visual-'));
const {server,streams}=createGameServer({dbPath:join(temp,'fixture.sqlite')});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const vite=await createServer(fixtureViteConfig(`http://127.0.0.1:${server.address().port}`));await vite.listen();
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const errors=[],images=[];let fonts='unavailable';try{fonts=hash(execFileSync('fc-list',[],{encoding:'utf8'}).split('\n').sort().join('\n'));}catch{}
const sources=execFileSync('git',['ls-files','-z','--cached','--others','--exclude-standard'],{encoding:'utf8'}).split('\0').filter(p=>p&&runtimePath(p)&&existsSync(p)).map(path=>({path,sha256:hash(readFileSync(path))}));
const manifest={version:1,complete:false,sourceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runtimeSha:runtimeHash(sources),environment:{browser:browser.version(),platform:platform(),arch:arch(),fonts,locale:'vi-VN',timezone:'Asia/Ho_Chi_Minh',clock:'2026-11-01T05:01:00Z',profiles},images,errors,bundle:{jsGzip:0,cssGzip:0}};
const assetDir=resolve('dist/assets');if(!existsSync(assetDir))throw new Error('Run npm run build before visual capture');
for(const file of readdirSync(assetDir)){if(!statSync(join(assetDir,file)).isFile()||!/(\.js|\.css)$/.test(file))continue;const size=gzipSync(readFileSync(join(assetDir,file))).length;if(file.endsWith('.js'))manifest.bundle.jsGzip+=size;if(file.endsWith('.css'))manifest.bundle.cssGzip+=size;}
function record(file){const data=readFileSync(resolve(output,file)),png=PNG.sync.read(data);images.push({file,sha256:hash(data),width:png.width,height:png.height});}
try{
 for(const [name,width,height,deviceScaleFactor] of profiles){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor,hasTouch:name!=='desktop',locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce'}),page=await context.newPage();let logged=false;
  await isolateBrowser(context,vite.resolvedUrls.local[0],errors);
  page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.method()+' '+new URL(r.url()).pathname+' '+r.failure()?.errorText));
  page.on('console',m=>{if(m.type()==='error'&&!(!logged&&/401/.test(m.text())))errors.push(m.text());});
  await context.addInitScript(()=>localStorage.setItem('tred-aura','off'));
  await page.clock.install({time:new Date('2026-11-01T05:00:00Z')});
  await page.goto(vite.resolvedUrls.local[0]);await page.locator('#login select').selectOption('admin');await page.locator('#login [name=password]').fill('admin');await page.locator('#login button').click();await page.locator('#modal').waitFor({state:'hidden'});logged=true;
  await page.evaluate(async()=>{const {loadArt}=await import('/src/art-assets.js');await Promise.all(['characters-cardinal','wear-hat','wear-shirt','wear-shoes','wear-glasses','vehicle-atlas','pet-atlas','items-atlas','office-atlas','furniture-straight','chairs-rear'].map(n=>loadArt(n).decode()));});
  await page.clock.pauseAt(new Date('2026-11-01T05:01:00Z'));
  const click=selector=>page.evaluate(selector=>{const el=document.querySelector(selector);if(!el)throw Error('Missing capture control '+selector);el.click();},selector);
  const capture=async screen=>{await page.clock.runFor(160);await page.evaluate(()=>Promise.all([...document.images].filter(i=>i.isConnected).map(i=>i.decode())));const file=name+'-'+screen+'.png';await page.screenshot({path:resolve(output,file),animations:'disabled'});record(file);};
  await capture('world');await click('[data-page=store]');await page.evaluate(()=>{const el=document.querySelector('#category');el.value='shirt';el.dispatchEvent(new Event('change',{bubbles:true}));});await capture('store');
  await click('[data-item-id="shirt-0-0"]');await capture('fitting');await click('#close');await click('[data-page=profile]');await capture('profile');await click('[data-action=workspace]');await capture('workspace');
  if(name==='desktop'){
   const galleries=await page.evaluate(async()=>{
    const {drawCharacter,drawRider}=await import('/src/character-art.js'),{game}=await import('/src/economy-ui.js'),catalog=game.state.catalog;
    const result={};let c=document.createElement('canvas');c.width=1280;c.height=850;let ctx=c.getContext('2d');ctx.fillStyle='#647681';ctx.fillRect(0,0,c.width,c.height);
    for(let model=0;model<2;model++)for(let variant=0;variant<5;variant++)for(let direction=0;direction<4;direction++){
     const equipment=Object.fromEntries(['shirt','hat','glasses','shoes'].map(slot=>[slot,catalog.find(i=>i.active&&i.category===slot&&i.variant===variant).id]));ctx.save();ctx.translate(model*640+direction*160+80,variant*170+125);ctx.scale(2,2);drawCharacter(ctx,{id:model?'tuyen':'hai',equipment},catalog,0,0,{direction,frame:7,aura:false,pet:false});ctx.restore();
    }result['actors.png']=c.toDataURL().split(',')[1];
    for(const phase of [0,7,14,21]){
     c=document.createElement('canvas');c.width=1536;c.height=1320;ctx=c.getContext('2d');ctx.fillStyle='#647681';ctx.fillRect(0,0,c.width,c.height);
     const vehicles=catalog.filter(i=>i.active&&i.category==='vehicle').sort((a,b)=>a.variant-b.variant);
     vehicles.forEach((vehicle,row)=>{for(let model=0;model<2;model++)for(let direction=0;direction<4;direction++){
      const user={id:model?'tuyen':'hai',equipment:Object.fromEntries(['shirt','hat','glasses','shoes'].map(slot=>[slot,catalog.find(i=>i.active&&i.category===slot&&i.variant===0).id]))};ctx.save();ctx.translate(model*768+direction*192+96,row*110+65);drawRider(ctx,user,catalog,vehicle,0,0,{direction,frame:phase,moving:true,aura:false});ctx.restore();
     }});result['riders-'+phase+'.png']=c.toDataURL().split(',')[1];
    }return result;
   });
   for(const [file,data] of Object.entries(galleries)){writeFileSync(resolve(output,file),Buffer.from(data,'base64'));record(file);}
  }
  await context.close();console.log(`CAPTURE ${name} ${width}x${height} DPR ${deviceScaleFactor}`);
 }
 if(errors.length)throw new Error(errors.join('\n'));
 if(JSON.stringify(images.map(i=>i.file).sort())!==JSON.stringify(expectedImages))throw new Error('Capture did not produce every required scenario');
 manifest.complete=true;save(resolve(output,'capture.json'),manifest);console.log(`PASS ${images.length} deterministic visual scenarios → ${output}`);
}catch(error){errors.push(error.message);save(resolve(output,'capture.json'),manifest);throw error;}
finally{await browser.close();await vite.close();for(const s of streams)s.res.end();server.closeAllConnections();await new Promise(r=>server.close(r));rmSync(temp,{recursive:true,force:true});}
