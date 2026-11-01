import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {PNG} from 'pngjs';
import {inWork,hash} from './dev-evidence.mjs';
import {auditPixels} from './art-quality.mjs';
if(process.argv.includes('--help')){console.log('node scripts/standardize-chair-sheet.mjs --input source.png --palette locked.json --output work/new-candidate');process.exit(0);}
const arg=n=>process.argv[process.argv.indexOf(n)+1];for(const n of ['--input','--palette','--output'])if(!process.argv.includes(n))throw Error('Missing '+n);
const output=inWork(process.cwd(),arg('--output'));if(existsSync(output))throw Error('Candidate exists');
const bytes=readFileSync(arg('--input')),raw=PNG.sync.read(bytes);if(raw.width!==1024||raw.height!==1536)throw Error('Review a new native layout before using a different source');
const {palette}=JSON.parse(readFileSync(arg('--palette'))),colors=palette.map(s=>s.slice(1).match(/../g).map(n=>parseInt(n,16))),memo=new Map();
function nearest(r,g,b){const key=r*65536+g*256+b;if(memo.has(key))return memo.get(key);let best=colors[0],distance=Infinity;for(const c of colors){const d=(c[0]-r)**2+(c[1]-g)**2+(c[2]-b)**2;if(d<distance){distance=d;best=c;}}memo.set(key,best);return best;}
// Native row gutters are irregular; never slice the donor into guessed equal cells.
const rows=[[40,336,320],[344,636,624],[640,930,918],[932,1226,1213],[1228,1520,1496]],centers=[143,391,646,899],scale=.4,anchor=[64,136];
const png=new PNG({width:512,height:800});
for(let row=0;row<5;row++)for(let view=0;view<4;view++)for(let y=0;y<160;y++)for(let x=0;x<128;x++){
 const sx=Math.floor(centers[view]+(x+.5-anchor[0])/scale),sy=Math.floor(rows[row][2]+(y+.5-anchor[1])/scale);
 if(sx<view*256||sx>=(view+1)*256||sy<rows[row][0]||sy>=rows[row][1])continue;
 const s=(sy*raw.width+sx)*4;if(raw.data[s+3]<200)continue;
 const n=((row*160+y)*png.width+view*128+x)*4;png.data.set([...nearest(...raw.data.subarray(s,s+3)),255],n);
}
const audit=auditPixels(png,{palette,maxColors:256});if(!audit.passed)throw Error('Inspect candidate before export: '+JSON.stringify(audit));
mkdirSync(output,{recursive:true});const data=PNG.sync.write(png);writeFileSync(resolve(output,'chairs-cardinal.png'),data);
writeFileSync(resolve(output,'candidate.json'),JSON.stringify({sourceSha256:hash(bytes),sha256:hash(data),width:512,height:800,frameSize:[128,160],columns:4,rows:5,anchor,scale,nativeRows:rows,nativeCenters:centers,palette,audit},null,2)+'\n');console.log(JSON.stringify({output,audit}));
