// Candidate-only export of the generated rear-view strip; originals stay intact.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {PNG} from 'pngjs';
import {auditPixels} from './art-quality.mjs';
import {inWork} from './dev-evidence.mjs';
const arg=name=>process.argv[process.argv.indexOf(name)+1];
if(process.argv.includes('--help')){console.log('node scripts/prepare-chair-rear.mjs --input generated-strip.png --output work/new-chair-candidate');process.exit(0);}
if(!process.argv.includes('--input')||!process.argv.includes('--output'))throw Error('Supply --input and a NEW --output under work/');
const output=inWork(process.cwd(),arg('--output'));
if(existsSync(output))throw Error('Choose a new candidate directory under work/');
const bytes=readFileSync(arg('--input')),raw=PNG.sync.read(bytes);
if(raw.width!==1983||raw.height!==793)throw Error('This reviewed export is calibrated to the 1983×793 generated strip');
const palette=['#101321','#171b2a','#202434','#292e41','#34394e','#41475d','#50566c','#656c80','#7d8395','#a1a5b2','#c6c6cd','#dedbd8','#eee8dd','#f6f0e5','#242d43','#30415d','#3c5277','#375e98','#356cac','#4387cf','#6ea5e8','#a5c6ed','#211e28','#352c33','#533b35','#704b36','#8a593c','#a56d48','#c0895d','#d4a67e','#4b2936','#783341','#a83f4a','#d34d56','#f46169','#ff8b8b'];
const colors=palette.map(s=>s.slice(1).match(/../g).map(h=>parseInt(h,16))),memo=new Map();
function nearest(r,g,b){const key=(r<<16)|(g<<8)|b;if(memo.has(key))return memo.get(key);let best=colors[0],dist=Infinity;for(const c of colors){const d=c.reduce((n,v,k)=>n+(v-[r,g,b][k])**2,0);if(d<dist){dist=d;best=c;}}memo.set(key,best);return best;}
const png=new PNG({width:640,height:192});
// One transform for the entire strip, including transparent slot padding.
const scale=.30,anchor=[64,172],sourceFloor=686,slotWidth=raw.width/5;
for(let frame=0;frame<5;frame++)for(let y=0;y<192;y++)for(let x=0;x<128;x++){
 const sx=Math.floor(frame*slotWidth+slotWidth/2+(x+.5-anchor[0])/scale),sy=Math.floor(sourceFloor+(y+.5-anchor[1])/scale);
 if(sx<frame*slotWidth||sx>=(frame+1)*slotWidth||sy<0||sy>=raw.height)continue;
 const s=(sy*raw.width+sx)*4,d=(y*png.width+frame*128+x)*4;if(raw.data[s+3]<128)continue;
 png.data.set([...nearest(...raw.data.subarray(s,s+3)),255],d);
}
const audit=auditPixels(png,{maxColors:palette.length,palette});
if(!audit.passed)throw Error('Candidate needs review: '+JSON.stringify(audit));
mkdirSync(output,{recursive:true});const data=PNG.sync.write(png);writeFileSync(resolve(output,'chairs-rear.png'),data);
writeFileSync(resolve(output,'candidate.json'),JSON.stringify({sourceSha256:createHash('sha256').update(bytes).digest('hex'),sha256:createHash('sha256').update(data).digest('hex'),width:640,height:192,frameSize:[128,192],columns:5,rows:1,anchor,palette,maxColors:palette.length,scale,sourceFloor,audit},null,2));
console.log(JSON.stringify({output,audit}));
