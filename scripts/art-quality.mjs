// Same binary-alpha / orphan / locked-palette checks as pixel-art's audit,
// available in Node so production builds do not need Python or Pillow.
export function auditPixels({width,height,data},{maxColors=256,palette}={}){
 const colors=new Set(),allowed=palette?new Set(palette.map(c=>c.toLowerCase())):null;
 let semiTransparent=0,orphans=0,outsidePalette=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,a=data[i+3];if(a>0&&a<255)semiTransparent++;
  if(!a)continue;
  const rgb='#'+[data[i],data[i+1],data[i+2]].map(n=>n.toString(16).padStart(2,'0')).join('');colors.add(rgb);if(allowed&&!allowed.has(rgb))outsidePalette++;
  let neighbor=false;
  for(let dy=-1;dy<=1&&!neighbor;dy++)for(let dx=-1;dx<=1;dx++)if((dx||dy)&&x+dx>=0&&x+dx<width&&y+dy>=0&&y+dy<height&&data[((y+dy)*width+x+dx)*4+3]){neighbor=true;break;}
  if(!neighbor)orphans++;
 }
 return {passed:semiTransparent===0&&orphans===0&&outsidePalette===0&&colors.size<=maxColors,semiTransparent,orphans,outsidePalette,colors:colors.size,maxColors};
}
