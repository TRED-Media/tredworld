import {pixelPalette} from './pixel-palette.js';
// One color/alpha contract for every world material. Sources remain untouched.
// The quantized lookup is bounded (32³), independent of frame count and zoom.
let lookup;
const exactColors=new Set(pixelPalette.map(c=>c[0]*65536+c[1]*256+c[2]));
export function standardPixels(data,recolor=true){
 if(!lookup){lookup=new Uint16Array(32768);for(let n=0;n<lookup.length;n++){const r=(n>>10)*8+4,g=((n>>5)&31)*8+4,b=(n&31)*8+4;let best=0,distance=Infinity;for(let k=0;k<pixelPalette.length;k++){const c=pixelPalette[k],d=(c[0]-r)**2+(c[1]-g)**2+(c[2]-b)**2;if(d<distance){distance=d;best=k;}}lookup[n]=best;}}
 for(let n=0;n<data.length;n+=4){if(data[n+3]<128){data[n]=data[n+1]=data[n+2]=data[n+3]=0;continue;}if(recolor&&!exactColors.has(data[n]*65536+data[n+1]*256+data[n+2])){const c=pixelPalette[lookup[((data[n]>>3)<<10)|((data[n+1]>>3)<<5)|(data[n+2]>>3)]];data[n]=c[0];data[n+1]=c[1];data[n+2]=c[2];}data[n+3]=255;}
 return data;
}
