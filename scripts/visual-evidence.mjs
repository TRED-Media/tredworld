import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';
import {hash,json,save,inWork,newDirectory} from './dev-evidence.mjs';
export const profiles=[['desktop',1440,1000,1],['mobile',390,844,3],['landscape',844,390,2]];
export const expectedImages=[...profiles.flatMap(([p])=>['world','store','fitting','profile','workspace'].map(s=>p+'-'+s+'.png')),'actors.png',...[0,7,14,21].map(p=>'riders-'+p+'.png')].sort();
export function diffPixels(before,after,tolerance=0){
 if(before.width!==after.width||before.height!==after.height)throw new Error('Image dimensions changed');
 const output=new PNG({width:before.width,height:before.height});let changed=0,rawChanged=0;
 for(let i=0;i<before.data.length;i+=4){
  const dr=Math.abs(before.data[i]-after.data[i]),dg=Math.abs(before.data[i+1]-after.data[i+1]),db=Math.abs(before.data[i+2]-after.data[i+2]),da=Math.abs(before.data[i+3]-after.data[i+3]);
  if(dr||dg||db||da)rawChanged++;
  const different=dr>tolerance||dg>tolerance||db>tolerance||da>tolerance;if(different)changed++;
  const grey=Math.round((before.data[i]+before.data[i+1]+before.data[i+2])/9);
  output.data.set(different?[255,55,95,255]:[grey,grey,grey,255],i);
 }
 return {changed,rawChanged,noisePixels:rawChanged-changed,total:before.width*before.height,ratio:changed/(before.width*before.height),diff:output};
}
export function validateCapture(directory,expected=expectedImages){
 const manifest=json(resolve(directory,'capture.json'));
 if(manifest.version!==1||manifest.complete!==true)throw new Error('Incomplete visual capture');
 if(JSON.stringify(manifest.images.map(i=>i.file).sort())!==JSON.stringify([...expected].sort()))throw new Error('Missing, duplicate or unexpected visual scenarios');
 for(const item of manifest.images){
  if(!/^[a-z0-9-]+\.png$/.test(item.file))throw new Error('Invalid screenshot path');
  const data=readFileSync(resolve(directory,item.file));if(hash(data)!==item.sha256)throw new Error('Screenshot changed after capture: '+item.file);
  const image=PNG.sync.read(data);if(image.width!==item.width||image.height!==item.height)throw new Error('Screenshot metadata dimensions changed');
 }
 return manifest;
}
export function compareCaptures(root,beforeDir,afterDir,output,rules,expected=expectedImages){
 const before=inWork(root,beforeDir),after=inWork(root,afterDir),out=newDirectory(root,output);
 const report={version:1,before,after,createdAt:new Date().toISOString(),rules,errors:[],images:[],requiresReview:false};
 try{
  const a=validateCapture(before,expected),b=validateCapture(after,expected);
  report.beforeManifestSha=hash(readFileSync(resolve(before,'capture.json')));report.afterManifestSha=hash(readFileSync(resolve(after,'capture.json')));
  if(JSON.stringify(a.environment)!==JSON.stringify(b.environment))throw new Error('Render environments differ; do not approve or silently replace the baseline');
  for(const [name,max] of [['jsGzip',rules.maxJsGzipBytes],['cssGzip',rules.maxCssGzipBytes]])if(b.bundle[name]>max)report.errors.push(`Bundle ${name} ${b.bundle[name]} exceeds ${max}`);
  for(const image of a.images){
   const left=PNG.sync.read(readFileSync(resolve(before,image.file))),right=PNG.sync.read(readFileSync(resolve(after,image.file)));
   try{const critical=/^(actors|riders-)/.test(image.file),tolerance=critical?0:rules.uiChannelTolerance??rules.channelTolerance;
    const result=diffPixels(left,right,tolerance),diffFile='diff-'+image.file;writeFileSync(resolve(out,diffFile),PNG.sync.write(result.diff));report.images.push({file:image.file,beforeSha:image.sha256,afterSha:b.images.find(i=>i.file===image.file).sha256,changed:result.changed,rawChanged:result.rawChanged,noisePixels:result.noisePixels,tolerance,ratio:result.ratio,diffFile});if(result.ratio>rules.maxChangedRatio||result.noisePixels>(rules.maxUiNoisePixels||0))report.requiresReview=true;}
   catch(error){report.errors.push(image.file+': '+error.message);}
  }
 }catch(error){report.errors.push(error.message);}
 report.status=report.errors.length?'blocked':report.requiresReview?'review-required':'unchanged';save(resolve(out,'comparison.json'),report);
 const embedded=new Map();
 const body=report.images.map(i=>`<section><h2>${i.file} · ${i.changed} pixel thay đổi · ${i.noisePixels} pixel nhiễu ≤${i.tolerance}</h2><div>${[['Trước',resolve(before,i.file)],['Sau',resolve(after,i.file)],['Diff',resolve(out,i.diffFile)]].map(([label,path])=>{const data=readFileSync(path),key=hash(data);embedded.set(key,'data:image/png;base64,'+data.toString('base64'));return `<figure><figcaption>${label}</figcaption><img data-image="${key}" width="${data.readUInt32BE(16)}" height="${data.readUInt32BE(20)}" loading="lazy" decoding="async" alt="${label} ${i.file}"></figure>`;}).join('')}</div></section>`).join('');
 const escaped=report.errors.join('\n').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
 writeFileSync(resolve(out,'comparison.html'),`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>T-RED visual regression</title><style>body{background:#192136;color:#f0ebdf;font:14px system-ui;margin:20px}section>div{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}figure{margin:0}img{display:block;width:100%;height:auto;image-rendering:pixelated}figcaption{padding:8px}h2{font-size:16px}section{margin-bottom:28px}p{white-space:pre-wrap}</style><h1>T-RED · ${report.status}</h1><p>${escaped}</p>${body}<script>const images=${JSON.stringify(Object.fromEntries(embedded))};for(const el of document.querySelectorAll('[data-image]'))el.src=images[el.dataset.image];</script></html>`);
 return {directory:out,...report};
}
export function reviewReport(root,path,reason,inspected){
 path=inWork(root,path);const report=json(path);
 if(report.status==='blocked'||report.errors.length)throw new Error('Cannot review away missing evidence, dimension, environment or budget failures');
 if(!reason||reason.trim().length<20)throw new Error('Record a specific visual finding/reason (at least 20 characters)');
 const names=new Set(report.images.map(i=>i.file));if(!inspected.length||inspected.some(i=>!names.has(i)))throw new Error('Name the actual inspected images');
 const changed=report.images.filter(i=>i.changed>0||i.noisePixels>(report.rules.maxUiNoisePixels||0)).map(i=>i.file);if(changed.some(i=>!inspected.includes(i)))throw new Error('Inspect every changed image before recording review');
 if(existsSync(path+'.review.json'))throw new Error('Review already exists; create a new comparison instead of overwriting evidence');
 const review={version:1,reportSha:hash(readFileSync(path)),candidateSha:report.afterManifestSha,reason,inspected,reviewedAt:new Date().toISOString()};save(path+'.review.json',review);return review;
}
export function checkReport(root,path,expected=expectedImages){
 path=inWork(root,path);const report=json(path);if(report.status==='blocked'||report.errors.length)throw new Error('Visual report is blocked');
 validateCapture(inWork(root,report.before),expected);validateCapture(inWork(root,report.after),expected);
 if(hash(readFileSync(resolve(report.before,'capture.json')))!==report.beforeManifestSha||hash(readFileSync(resolve(report.after,'capture.json')))!==report.afterManifestSha)throw new Error('Capture metadata changed after comparison');
 if(report.requiresReview){const reviewPath=path+'.review.json';if(!existsSync(reviewPath))throw new Error('Changed images require visual inspection and a bound review record');const review=json(reviewPath);if(review.reportSha!==hash(readFileSync(path))||review.candidateSha!==report.afterManifestSha)throw new Error('Visual review is stale');}
 return {status:'passed',comparison:report.status,images:report.images.length};
}
