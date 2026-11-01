// One reviewed palette; immutable candidates. No master or player-data writes.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';
import {inWork,hash} from './dev-evidence.mjs';
import {auditPixels} from './art-quality.mjs';
if(process.argv.includes('--help')){console.log('node scripts/standardize-world-art.mjs --input office-source.png --output work/new-candidate [--palette locked.json]');process.exit(0);}
const arg=n=>process.argv[process.argv.indexOf(n)+1];
if(!process.argv.includes('--input')||!process.argv.includes('--output'))throw Error('Supply --input and new --output');
const output=inWork(process.cwd(),arg('--output'));if(existsSync(output))throw Error('Candidate exists');
const sources=['office-empty-stations','characters-cardinal','wear-shirt','wear-hat','wear-shoes','wear-glasses','furniture-straight','chairs-rear','items-atlas','vehicle-atlas','pet-atlas','office-atlas'];
let palette;
if(process.argv.includes('--palette'))palette=JSON.parse(readFileSync(arg('--palette'))).palette;
else{
 const counts=new Map();
 for(const name of sources){const p=PNG.sync.read(readFileSync('public/art/'+name+'.png')),step=Math.max(1,Math.floor(Math.sqrt(p.width*p.height/60000)));for(let y=0;y<p.height;y+=step)for(let x=0;x<p.width;x+=step){const i=(y*p.width+x)*4;if(p.data[i+3]<128)continue;const k=((p.data[i]>>3)<<10)|((p.data[i+1]>>3)<<5)|(p.data[i+2]>>3);counts.set(k,(counts.get(k)||0)+1);}}
 const bins=[...counts].map(([key,n])=>({c:[(key>>10)*8+4,((key>>5)&31)*8+4,(key&31)*8+4],n}));
 const boxes=[bins];
 while(boxes.length<240){let index=-1,best=0,axis=0;for(let b=0;b<boxes.length;b++){const box=boxes[b];if(box.length<2)continue;const ranges=[0,1,2].map(k=>Math.max(...box.map(p=>p.c[k]))-Math.min(...box.map(p=>p.c[k]))),score=Math.max(...ranges)*Math.sqrt(box.reduce((n,p)=>n+p.n,0));if(score>best){index=b;best=score;axis=ranges.indexOf(Math.max(...ranges));}}if(index<0)break;const box=boxes.splice(index,1)[0].sort((a,b)=>a.c[axis]-b.c[axis]),total=box.reduce((n,p)=>n+p.n,0);let n=0,cut=1;for(;cut<box.length-1;cut++){n+=box[cut-1].n;if(n>=total/2)break;}boxes.push(box.slice(0,cut),box.slice(cut));}
 palette=boxes.map(box=>{const n=box.reduce((n,p)=>n+p.n,0);return '#'+[0,1,2].map(k=>Math.min(255,Math.round(box.reduce((n,p)=>n+p.c[k]*p.n,0)/n)).toString(16).padStart(2,'0')).join('');});
 palette=[...new Set(['#101624','#172334','#25334a','#38465d','#657580','#96a29f','#c4c6be','#f1ebdf','#ed718f','#ce665c','#e8b28e','#f2c39b','#79a777','#6997ca','#d1ad78','#ffffff',...palette])];
}
const colors=palette.map(c=>c.slice(1).match(/../g).map(v=>parseInt(v,16))),memo=new Map();
function nearest(r,g,b){const key=r*65536+g*256+b;if(memo.has(key))return memo.get(key);let best=colors[0],distance=Infinity;for(const c of colors){const d=(c[0]-r)**2+(c[1]-g)**2+(c[2]-b)**2;if(d<distance){distance=d;best=c;}}memo.set(key,best);return best;}
const source=readFileSync(arg('--input')),png=PNG.sync.read(source);
if(png.width!==1448||png.height!==1086)throw Error('Office must preserve the original 1448×1086 coordinate system');
// Large connected neutral regions are floor material, not prop details. Replace
// their painted haze with a stable tile field before palette quantization.
const seen=new Uint8Array(png.width*png.height),queue=new Uint32Array(seen.length);let floorPixels=0;
const isFloor=i=>{const n=i*4,[r,g,b,a]=png.data.subarray(n,n+4);return a>=128&&r>=130&&r<=190&&Math.max(r,g,b)-Math.min(r,g,b)<14;};
for(let i=0;i<seen.length;i++){
 if(seen[i]||!isFloor(i))continue;let end=1;queue[0]=i;seen[i]=1;
 for(let at=0;at<end;at++){const k=queue[at],x=k%png.width,y=Math.floor(k/png.width);for(const j of [x?k-1:-1,x<png.width-1?k+1:-1,y?k-png.width:-1,y<png.height-1?k+png.width:-1])if(j>=0&&!seen[j]&&isFloor(j)){seen[j]=1;queue[end++]=j;}}
 if(end<5000)continue;
 for(let at=0;at<end;at++){const k=queue[at],x=k%png.width,y=Math.floor(k/png.width),grid=x%48===0||y%48===0;png.data.set(grid?[168,170,163,255]:[153,155,148,255],k*4);floorPixels++;}
}
for(let n=0;n<png.data.length;n+=4)png.data.set(png.data[n+3]<128?[0,0,0,0]:[...nearest(...png.data.subarray(n,n+3)),255],n);
const audit=auditPixels(png,{maxColors:256,palette});if(!audit.passed)throw Error(JSON.stringify(audit));
mkdirSync(output,{recursive:true});const data=PNG.sync.write(png);
writeFileSync(resolve(output,'office-standard.png'),data);writeFileSync(resolve(output,'pixel-palette.js'),'// Locked T-RED material palette, extracted from preserved masters.\nexport const pixelPalette='+JSON.stringify(colors)+';\n');
writeFileSync(resolve(output,'candidate.json'),JSON.stringify({sourceSha256:hash(source),sha256:hash(data),width:png.width,height:png.height,palette,sourceMasters:sources,floorPixels,audit},null,2)+'\n');
console.log(JSON.stringify({output,audit}));
