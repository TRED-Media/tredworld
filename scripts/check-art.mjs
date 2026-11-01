import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import {auditPixels} from './art-quality.mjs';
const root=new URL('../public/art/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('quality-manifest.json',root),'utf8'));
assert.equal(manifest.version,1);
const registered=new Set();
for(const source of manifest.sources){
 assert(!registered.has(source.file),`Duplicate master: ${source.file}`);registered.add(source.file);
 const data=readFileSync(new URL(source.file,root));
 assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a',`${source.file}: expected original PNG master`);
 assert.equal(data.readUInt32BE(16),source.width,`${source.file}: source width changed; review the original and update its provenance`);
 assert.equal(data.readUInt32BE(20),source.height,`${source.file}: source height changed; do not replace a master with a thumbnail`);
 assert.equal(createHash('sha256').update(data).digest('hex'),source.sha256,`${source.file}: artwork changed without a visual source review`);
 assert(source.introducedIn&&source.role,`${source.file}: missing provenance`);
 if(source.quality==='legacy-reference')assert.equal(source.sha256,source.legacySha256,`${source.file}: an original-art exception cannot follow a replacement; audit new artwork as strict`);
 else {
  assert.equal(source.quality,'strict',`${source.file}: new masters must use the strict quality profile`);
  assert(Array.isArray(source.palette)&&source.palette.length>0&&source.palette.length<=256&&source.palette.every(c=>/^#[\da-f]{6}$/i.test(c)),`${source.file}: lock the approved seed palette`);
  assert(source.maxColors===undefined||(Number.isInteger(source.maxColors)&&source.maxColors>0&&source.maxColors<=256),`${source.file}: declare a valid palette budget`);
  const image=PNG.sync.read(data),result=auditPixels(image,{maxColors:source.maxColors||source.palette.length,palette:source.palette});
  assert(result.passed,`${source.file}: pixel-art audit failed ${JSON.stringify(result)}`);
  const [w,h]=source.frameSize||[];
  assert(Number.isInteger(w)&&w>0&&Number.isInteger(h)&&h>0&&Number.isInteger(source.columns)&&Number.isInteger(source.rows)&&w*source.columns===image.width&&h*source.rows===image.height,`${source.file}: declare an exact sprite sheet layout`);
  assert(Array.isArray(source.anchor)&&source.anchor.length===2&&source.anchor.every(Number.isFinite)&&source.anchor[0]>=0&&source.anchor[0]<=w&&source.anchor[1]>=0&&source.anchor[1]<=h,`${source.file}: declare one shared frame anchor`);
 }
}
for(const file of readdirSync(root).filter(f=>f.endsWith('.png')))assert(registered.has(file),`Review and register the new master ${file} in quality-manifest.json`);
console.log(`PASS ${registered.size} registered PNG masters: dimensions, integrity, provenance; replacements require strict pixel-art checks`);
