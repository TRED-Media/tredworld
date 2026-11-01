import test from 'node:test';
import assert from 'node:assert/strict';
import {auditPixels} from '../scripts/art-quality.mjs';
test('new sprite gate rejects partial alpha, isolated noise and unlocked colors',()=>{
 const data=new Uint8Array(8*8*4);for(let y=2;y<6;y++)for(let x=2;x<6;x++)data.set([51,68,85,255],(y*8+x)*4);
 const image={width:8,height:8,data},rules={palette:['#334455'],maxColors:1};
 assert(auditPixels(image,rules).passed);
 data[3]=1;const noisy=auditPixels(image,rules);assert.equal(noisy.semiTransparent,1);assert.equal(noisy.orphans,1);assert.equal(noisy.outsidePalette,1);assert.equal(noisy.passed,false);
 data[3]=0;data[(3*8+3)*4]=255;assert.equal(auditPixels(image,rules).passed,false);
});
