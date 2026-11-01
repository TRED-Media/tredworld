import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {PNG} from 'pngjs';
import {routeTask,registry} from '../scripts/skill-router.mjs';
import {createCheckpoint,restoreCheckpoint,verifyCheckpoint,hash,save} from '../scripts/dev-evidence.mjs';
import {diffPixels,compareCaptures,reviewReport,checkReport} from '../scripts/visual-evidence.mjs';
import {fixtureViteConfig,isolateBrowser} from './fixture-policy.mjs';

test('Vietnamese task routing selects one owner and compatible supporting skills',()=>{
 const rider=routeTask('Nhân vật ngồi xe sai tư thế, mũ và giày lệch hướng',['src/vehicle-rig.js']);assert.equal(rider.primary,'tred-animation');assert(rider.skills.some(s=>s.id==='tred-asset-quality'));assert(!rider.skills.some(s=>s.id==='spine-animation'));
 const ui=routeTask('Sửa UI responsive mobile và font',['src/quality.css']);assert.equal(ui.primary,'tred-game-ui');assert(ui.skills.some(s=>s.id==='web-design-guidelines'));
 const phaser=routeTask('Chuyển engine sang Phaser');assert(phaser.requiresDesignCheckpoint);assert(!phaser.skills.some(s=>s.id==='phaser'));assert.equal(phaser.executesCommands,false);
 assert.deepEqual(routeTask('Cập nhật tài liệu UI',['DEVELOPMENT_SKILLS.md']).checks,['npm run skills:check']);
 assert.equal(routeTask('ĐI CHUYỂN').primary,'tred-gameplay');
});

test('fixtures exclude production env and block external browser requests',async()=>{
 const cfg=fixtureViteConfig('http://127.0.0.1:3001');assert.equal(cfg.envDir,false);assert.equal(cfg.define['import.meta.env.VITE_GAME_API_URL'],'""');assert.equal(JSON.parse(cfg.define['import.meta.env.VITE_GAME_API_URL'])+'/api/login','/api/login');assert.throws(()=>fixtureViteConfig('https://example.invalid'),/loopback/);
 let callback,aborted=false,continued=false;const errors=[];await isolateBrowser({route:async(_pattern,fn)=>{callback=fn;}},'http://127.0.0.1:5173',errors);
 await callback({request:()=>({url:()=> 'https://example.invalid/api/purchase'}),abort:()=>{aborted=true;}});assert(aborted);assert.equal(errors.length,1);
 await callback({request:()=>({url:()=> 'http://127.0.0.1:5173/api/state'}),continue:()=>{continued=true;}});assert(continued);
});

test('checkpoint preserves dirty/untracked/deleted source and restores in another worktree',()=>{
 mkdirSync('work',{recursive:true});const root=mkdtempSync(resolve('work/checkpoint-test-'));
 const git=(...args)=>execFileSync('git',args,{cwd:root,stdio:'pipe'});
 try{
  git('init');git('config','user.name','Fixture');git('config','user.email','fixture@example.test');
  writeFileSync(join(root,'.gitignore'),'work/\ndata/\n.env\n');writeFileSync(join(root,'keep.txt'),'original');writeFileSync(join(root,'delete.txt'),'removed');git('add','.');git('commit','-m','fixture');
  writeFileSync(join(root,'keep.txt'),'dirty');writeFileSync(join(root,'new.txt'),'untracked');git('rm','delete.txt');mkdirSync(join(root,'data'));writeFileSync(join(root,'data/game.sqlite'),'preserve DB');writeFileSync(join(root,'.env'),'fixture-secret');
  const cp=createCheckpoint(root,'work/before','fixture');assert(!cp.files.some(f=>f.path==='.env'||f.path.startsWith('data/')));assert(cp.deleted.includes('delete.txt'));
  assert.throws(()=>createCheckpoint(root,'work/before'),/exists/);
  writeFileSync(join(root,'keep.txt'),'current');const recovery=restoreCheckpoint(root,'work/before','work/recovery');
  assert.equal(readFileSync(join(root,'keep.txt'),'utf8'),'current');assert.equal(readFileSync(join(root,'data/game.sqlite'),'utf8'),'preserve DB');assert.equal(readFileSync(join(recovery.directory,'keep.txt'),'utf8'),'dirty');assert.equal(readFileSync(join(recovery.directory,'new.txt'),'utf8'),'untracked');assert(!existsSync(join(recovery.directory,'delete.txt')));
  writeFileSync(join(cp.directory,'source/keep.txt'),'tampered');assert.throws(()=>verifyCheckpoint(root,cp.directory),/changed/);
  assert.throws(()=>createCheckpoint(root,'outside'),/ignored work/);
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('visual gate catches one-pixel regressions, missing frames and stale review',()=>{
 mkdirSync('work',{recursive:true});const base=mkdtempSync(resolve('work/visual-gate-test-')),expected=['actors.png'];
 const image=new PNG({width:8,height:8});image.data.fill(255);const changed=PNG.sync.read(PNG.sync.write(image));changed.data[0]=0;assert.equal(diffPixels(image,changed).changed,1);
 const environment={browser:'fixture',profiles:['desktop']};
 function capture(name,png){const dir=join(base,name);mkdirSync(dir);const buffer=PNG.sync.write(png);writeFileSync(join(dir,'actors.png'),buffer);save(join(dir,'capture.json'),{version:1,complete:true,environment,bundle:{jsGzip:0,cssGzip:0},images:[{file:'actors.png',sha256:hash(buffer),width:png.width,height:png.height}]});return dir;}
 try{
  const before=capture('before',image),after=capture('after',changed),r=compareCaptures(process.cwd(),before,after,join(base,'diff'),registry.visual,expected),report=join(r.directory,'comparison.json');assert.equal(r.status,'review-required');assert.throws(()=>checkReport(process.cwd(),report,expected),/inspection/);
  assert.throws(()=>reviewReport(process.cwd(),report,'Expected new actor palette after inspecting the images',[]),/inspected/);
  reviewReport(process.cwd(),report,'Expected palette change; inspected the actor outline and unchanged scale',['actors.png']);assert.equal(checkReport(process.cwd(),report,expected).status,'passed');
  const original=readFileSync(report,'utf8');writeFileSync(report,original+'\n');assert.throws(()=>checkReport(process.cwd(),report,expected),/stale/);writeFileSync(report,original);
  writeFileSync(join(after,'actors.png'),PNG.sync.write(image));assert.throws(()=>checkReport(process.cwd(),report,expected),/changed after capture/);
  const bad=capture('bad',image);save(join(bad,'capture.json'),{version:1,complete:true,environment,bundle:{jsGzip:0,cssGzip:0},images:[]});const blocked=compareCaptures(process.cwd(),before,bad,join(base,'bad-diff'),registry.visual,expected);assert.equal(blocked.status,'blocked');assert.throws(()=>reviewReport(process.cwd(),join(blocked.directory,'comparison.json'),'Cannot waive missing image evidence',['actors.png']),/Cannot review/);
  const resized=capture('resized',new PNG({width:9,height:8}));assert.equal(compareCaptures(process.cwd(),before,resized,join(base,'size-diff'),registry.visual,expected).status,'blocked');
  const otherEnv=capture('other-env',image),otherMeta=JSON.parse(readFileSync(join(otherEnv,'capture.json'),'utf8'));otherMeta.environment={browser:'different renderer'};save(join(otherEnv,'capture.json'),otherMeta);assert.equal(compareCaptures(process.cwd(),before,otherEnv,join(base,'env-diff'),registry.visual,expected).status,'blocked');
 }finally{rmSync(base,{recursive:true,force:true});}
});
