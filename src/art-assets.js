import {spriteFrame} from './sprite-fit.js';
import {atlasRules,wearableRules,FrameCache,textureKey,validateArtSpec,directionIndex} from './asset-rules.js';

export const itemRows = ['shirt','glasses','hat','shoes','case','monitor','cooling','desk','chair','decor','accessory'];
const rowCuts = [0,180,275,400,525,680,805,930,1055,1220,1375,1484];
const columnCuts = [0,232,430,630,830,1060];
const accessoryCuts = [0,232,345,535,675,835,1060];
const assets = new Map();
const tinted = new FrameCache(96);
let revision = 0;

export function loadArt(name) {
 if (assets.has(name)) return assets.get(name);
 const image = new Image();
 image.onload = () => { revision++; window.dispatchEvent(new Event('art-ready')); };
 image.onerror=()=>window.dispatchEvent(new CustomEvent('art-error',{detail:{name}}));
 image.src = `/art/${name}.png`;
 assets.set(name,image);
 return image;
}
export const artRevision = () => revision;

export function cardinalFrame(name,row,direction,rows) {
 direction=directionIndex(direction);
 const image=loadArt(name);
 if(!image.complete||!image.naturalWidth)return null;
 const rule=atlasRules[name]||{columns:4,rows};
 if(!Number.isInteger(row)||row<0||row>=rule.rows)return null;
 const w=image.naturalWidth/rule.columns,h=image.naturalHeight/rule.rows;
 return spriteFrame(image,direction*w,row*h,w,h);
}

export function wardrobeSource(item,direction=0) {
 const row=wearableRules[item.category]?.row;
 if(row===undefined)return null;
 direction=directionIndex(direction);
 const frame=item.art?customSource(item.art,direction):cardinalFrame('wearables-cardinal',row,direction,4);
 if(!frame||frame.empty)return null;
 const key=[revision,direction,textureKey(item)].join(':');
 if(tinted.has(key))return tinted.get(key);
 const canvas=document.createElement('canvas');canvas.width=frame.sw;canvas.height=frame.sh;
 const ctx=canvas.getContext('2d');ctx.drawImage(frame.image,frame.sx,frame.sy,frame.sw,frame.sh,0,0,frame.sw,frame.sh);
 const hex=/^#[\da-f]{6}$/i.test(item.color)?item.color:'#ce665c';
 const target=hex.match(/[\da-f]{2}/g).map(x=>parseInt(x,16));
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
 for(let n=0;n<pixels.data.length;n+=4){
  const r=pixels.data[n],g=pixels.data[n+1],b=pixels.data[n+2],a=pixels.data[n+3],l=(r+g+b)/3;
  if(a<40||l<30||l>220)continue;
  const fabric=row===1?r>g*1.2:row===0?b>r*1.12:row===2?l<180:row===3?l>170:false;
  if(!fabric)continue;
  const shade=Math.max(.4,Math.min(1.3,l/(row===1?120:75)));
  for(let k=0;k<3;k++)pixels.data[n+k]=Math.min(255,Math.round(target[k]*shade));
 }
 ctx.putImageData(pixels,0,0);
 const result={image:canvas,sx:0,sy:0,sw:canvas.width,sh:canvas.height};tinted.set(key,result);return result;
}

function customSource(spec,direction=0){
 validateArtSpec(spec);
 const image=loadArt(spec.atlas);if(!image.complete||!image.naturalWidth)return null;
 const col=spec.directional?directionIndex(direction):spec.column;
 if(col>=spec.columns)throw new Error('Directional atlas needs four columns');
 return spriteFrame(image,col*image.naturalWidth/spec.columns,spec.row*image.naturalHeight/spec.rows,image.naturalWidth/spec.columns,image.naturalHeight/spec.rows);
}

// The atlas contains one mouse between the keyboard and speakers. Treat it as
// part of the keyboard set, so every accessory has one unambiguous frame.
export function itemSource(item) {
 if(wearableRules[item.category])return wardrobeSource(item);
 if(item.art)return customSource(item.art);
 if(['desk','monitor'].includes(item.category)){
  const image=loadArt('furniture-straight');if(!image.complete||!image.naturalWidth)return null;
  const w=image.naturalWidth/5,h=image.naturalHeight/2;
  return spriteFrame(image,item.variant%5*w,(item.category==='desk'?0:1)*h,w,h);
 }
 const row = itemRows.indexOf(item.category);
 const image = loadArt(row < 0 ? `${item.category}-atlas` : 'items-atlas');
 if (!image.complete || !image.naturalWidth) return null;
 if (row >= 0) {
  const v = item.variant % 5;
  const xs = row === 10 ? [accessoryCuts[0],accessoryCuts[2],accessoryCuts[3],accessoryCuts[4],accessoryCuts[5],accessoryCuts[6]] : columnCuts;
  return spriteFrame(image,xs[v]*image.naturalWidth/1060,rowCuts[row]*image.naturalHeight/1484,(xs[v+1]-xs[v])*image.naturalWidth/1060,(rowCuts[row+1]-rowCuts[row])*image.naturalHeight/1484);
 }
 const rule=atlasRules[`${item.category}-atlas`];
 if(!rule)return null;
 const column=item.variant%rule.columns,rowIndex=Math.floor(item.variant/rule.columns);
 const w=image.naturalWidth/rule.columns;
 const top=rule.rowCuts?rule.rowCuts[rowIndex]*image.naturalHeight:rowIndex*image.naturalHeight/rule.rows;
 const bottom=rule.rowCuts?rule.rowCuts[rowIndex+1]*image.naturalHeight:(rowIndex+1)*image.naturalHeight/rule.rows;
 return spriteFrame(image,column*w,top,w,bottom-top,rule.isolate);

}

// Preload all shop art, including assets for categories not on the first page.
for (const name of ['items-atlas','pet-atlas','vehicle-atlas','office-atlas','characters-cardinal','wearables-cardinal','furniture-straight']) loadArt(name);
