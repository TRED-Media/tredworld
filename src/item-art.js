import {drawSprite,drawFrame} from './sprite-fit.js';
import {FrameCache,visualKey} from './asset-rules.js';
import {itemSource,artRevision,loadArt} from './art-assets.js';
import {workstationLayout} from './workstation-layout.js';
const cache=new FrameCache(320);
const office=loadArt('office-atlas');
// Original, integer-grid pixel sprites. Every catalog variant changes silhouette/details and palette.
export function drawItem(ctx,item,x=0,y=0,size=64,time=0,aura=true,badge=true){
 if(!item)return;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(size/64,size/64);ctx.imageSmoothingEnabled=false;
 const c=item.color,t=item.tier,v=item.variant%5,ink='#182334',light='#e3e2d6',metal='#718598';
 const r=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
 const oval=(x,y,w,h,col)=>{for(let row=0;row<h;row++){const inset=Math.round(w/2*(1-Math.sqrt(Math.max(0,1-Math.pow((row+.5-h/2)/(h/2),2)))));r(x+inset,y+row,w-2*inset,1,col);}};
 const box=(x,y,w,h,col)=>{r(x-2,y-2,w+4,h+4,ink);r(x,y,w,h,col);r(x,y,w,2,light);};
 if(t===3&&aura){const p=Math.floor(time/250)%4;for(let i=0;i<8;i++){const xx=5+(i*17+v*3)%53,yy=4+(i*23)%52;if((i+p)%3!==0){r(xx,yy,3,3,'#efa9fa');r(xx-2,yy+1,7,1,'#c582eb');}}}
 const source=itemSource(item);
 if(source){drawFrame(ctx,source,2,1,60,56);}else switch(item.category){
 case 'shirt':{box(19,16,26,33,c);r(10,18,9,17,c);r(45,18,9,17,c);r(12,32,6,4,light);r(47,32,6,4,light);r(26,14,12,7,ink);r(29,17,6,4,light);if(v%2)r(30,22,3,27,metal);else r(21,32,22,3,light);r(36,27,5,6,ink);if(v>2){r(18,12,7,9,c);r(39,12,7,9,c);}break;}
 case 'glasses':{const h=8+v*2;box(9,25,18,h,t>1?c:metal);box(37,25,18,h,t>1?c:metal);r(27,29,10,3,ink);r(3,24,7,4,c);r(54,24,7,4,c);r(12,28,12,h-4,'#273c58');r(40,28,12,h-4,'#273c58');r(13,29,7,2,'#b7d8e1');r(41,29,7,2,'#b7d8e1');break;}
 case 'hat':{box(17,18-v,31,24,c);r(12,40-v,44,6,ink);r(v%2?7:16,39-v,v%2?48:35,4,c);r(29,25,8,9,t>1?'#ed9acc':light);r(23,18-v,3,20,metal);if(v===4){r(27,8,10,8,light);}break;}
 case 'shoes':for(let i=0;i<2;i++){const xx=8+i*26;box(xx,22+i*4,18,23,c);r(xx-4,39+i*4,24,8,c);r(xx-4,47+i*4,25,4,light);for(let j=0;j<3;j++)r(xx+3,27+j*4+i*4,11,2,light);if(v%2)r(xx+12,31+i*4,3,10,ink);}break;
 case 'case':{const shell=t>1?'#d8dedf':'#617185';r(12,10,31,46,ink);r(15,9,27,44,shell);r(43,13,10,43,ink);r(44,15,7,38,'#38465c');r(18,13,21,35,'#253146');r(19,15,2,30,'#879baa');r(17,51,24,3,metal);r(17,55,5,4,ink);r(45,55,5,4,ink);for(let j=0;j<2+(v%2);j++){const yy=16+j*(v%2?10:16);oval(23,yy,13,13,t>=2?['#ac83ef','#6cd1dc','#e784bd'][j%3]:c);oval(25,yy+2,9,9,'#1c2c42');oval(28,yy+5,3,3,light);r(29,yy+2,1,9,c);r(25,yy+6,9,1,c);}r(45,19,4,3,light);r(45,27,3,16,c);r(20,48,17,2,c);break;}
 case 'monitor':{box(5,12,54,33,metal);r(8,15,48,27,'#24334f');for(let i=0;i<5;i++){r(10+i*9,32-(i+v)%4*4,8,8,c);}r(29,45,6,9,ink);r(19,54,27,4,metal);if(v%2)r(31,15,2,27,metal);break;}
 case 'cooling':{box(8,12,18,40,metal);for(let i=0;i<3;i++){r(11,16+i*11,12,8,c);r(15,18+i*11,4,4,ink);}r(27,15,22,3,c);r(47,15,3,22,c);r(30,47,20,3,c);box(37,33,18,17,c);r(42,37,8,8,ink);break;}
 case 'desk':{box(5,18,54,24,c);for(let j=0;j<3;j++)r(8,22+j*6,48,1,'#e6caaa');r(9,43,6,14,ink);r(49,43,6,14,ink);if(v%2)box(40,42,14,13,metal);if(t>1)r(7,39,50,2,'#c08eef');break;}
 case 'chair':{box(19,7,27,28,c);r(21,10,4,22,metal);r(39,10,4,22,metal);box(16,37,33,11,c);r(11,29,5,17,ink);r(50,29,5,17,ink);r(29,49,6,9,metal);r(15,58,34,3,ink);if(v%2)r(27,3,12,6,c);break;}
 case 'decor':{if(v===0||v===4){box(23,39,20,17,c);r(31,14,4,28,'#71976b');for(let i=0;i<5;i++){r(18+i%2*17,12+i*5,14,9,['#85a77d','#648f6b'][i%2]);}}else if(v===1){box(10,9,44,43,c);r(14,13,36,35,'#435674');r(18,28,12,16,light);r(31,21,15,23,'#c8989c');}else if(v===2){box(13,12,39,42,metal);for(let i=0;i<4;i++){r(17,17+i*8,31,3,c);}}else{r(29,16,5,35,metal);r(19,51,26,5,ink);box(19,10,25,18,c);}break;}
 case 'accessory':{if(v===0){box(5,25,44,19,metal);for(let i=0;i<8;i++)for(let j=0;j<3;j++)r(8+i*5,28+j*4,3,2,c);box(53,25,7,15,c);}else if(v===1){box(12,12,14,38,metal);box(40,12,14,38,metal);r(15,30,8,12,c);r(43,30,8,12,c);}else if(v===2){r(16,15,33,6,c);r(12,20,6,25,c);r(47,20,6,25,c);box(10,29,10,22,metal);box(45,29,10,22,metal);}else if(v===3){box(16,23,34,24,metal);box(26,27,16,16,c);r(23,17,18,6,ink);}else{box(9,17,46,31,c);r(13,21,38,23,'#354967');r(25,25,14,14,light);}break;}
 case 'vehicle':{if(item.kind==='car'){r(13,15,5,10,ink);r(46,15,5,10,ink);r(13,43,5,11,ink);r(46,43,5,11,ink);oval(16,2,32,59,ink);oval(19,4,26,55,c);r(20,13,2,36,'#ffffff30');r(42,13,2,36,'#121b3540');r(22,17,20,13,'#223248');r(24,19,16,3,'#92adb8');r(22,42,20,10,'#223248');r(21,7,6,4,light);r(37,7,6,4,light);r(21,54,5,3,'#e47081');r(38,54,5,3,'#e47081');if(v%2)r(30,5,3,10,light);}else{r(28,2,8,15,ink);r(28,47,8,15,ink);r(15,19,34,4,metal);r(13,18,6,6,ink);r(45,18,6,6,ink);box(25,item.kind==='bike'?25:20,item.kind==='bike'?10:16,28,c);r(29,30,8,15,ink);r(28,21,10,6,light);if(item.kind==='motorbike'){r(20,26,5,15,c);r(41,26,5,15,c);}}break;}
 case 'pet':{const bob=Math.floor(time/200)%2,n=item.variant;const coats=['#b98454','#353441','#7baa55','#efeee3','#a58c73','#e8a34e','#d58d43','#d7c0a3','#e5a04d','#a5ae58','#667084','#f4eee1','#eee9e4','#d6c7c5','#9ccf96','#dba15b','#f3eee6','#edc15f','#634bb2','#32adc5'],fur=coats[n],cream='#f6ebd6';
 if(item.kind==='reptile'){oval(11,30,36,16,ink);oval(13,31,33,12,fur);oval(40,23,19,18,ink);oval(42,25,15,14,fur);for(let i=0;i<5;i++)r(4+i*3,43-i*2,5,4,fur);for(const xx of [17,36]){r(xx,41,4,10,ink);r(xx-2,48,8,3,fur);}r(51,28,3,4,ink);r(51,28,1,1,cream);for(let i=0;i<5;i++)r(15+i*6,28-i%2*2,3,5,n===19?'#d36fef':cream);}
 else{const cat=item.kind==='cat';oval(16,29,36,25,ink);oval(18,30,32,22,fur);oval(21,35,24,17,cream);oval(11,14,37,30,ink);oval(13,16,33,26,fur);for(const xx of [14,36]){r(xx,cat?6:9,8,15,ink);r(xx+2,cat?9:12,4,11,fur);r(xx+3,14,2,6,'#d79c9b');}if(n===0||n===11){oval(8,19,9,23,ink);oval(9,20,7,20,fur);oval(43,19,9,23,fur);}oval(19,28,24,14,cream);if([3,10,13].includes(n))oval(14,18,12,15,'#576076');r(20,26,3,5,ink);r(37,26,3,5,ink);r(20,26,1,2,cream);r(37,26,1,2,cream);r(28,33,5,3,ink);r(30,36,1,3,ink);r(26,39,4,1,'#c68383');r(32,39,4,1,'#c68383');oval(17,48+bob,12,8,ink);oval(19,48+bob,9,6,cream);oval(36,48-bob,12,8,ink);oval(37,48-bob,9,6,cream);oval(48,29-bob*2,10,16,fur);if(n===11){r(32,41,5,4,'#d54c76');r(39,41,5,4,'#d54c76');}if([4,8,17].includes(n)){for(let i=0;i<3;i++)r(25+i*4,17,2,6,'#a77748');}if(n===18){for(let i=0;i<7;i++)r(16+(i*11)%28,19+(i*7)%27,2,2,['#60e0ed','#ef91f1'][i%2]);}}
 break;}
 }
 if(badge&&t===1){r(22,59,20,2,'#8aad85');}
 if(badge&&t>=2){const col=t>=4?'#edbb62':t===2?'#83c8ef':'#f4a6df';r(8,59,48,2,col);if(t===3)r(10,56,4+(Math.floor(time/200)%5)*8,2,col);}
 ctx.restore();
}
export function itemImage(item){const key=[artRevision(),item.id,visualKey(item)].join(':');if(cache.has(key))return cache.get(key);const c=document.createElement('canvas');c.width=c.height=256;drawItem(c.getContext('2d'),item,0,0,256);const url=c.toDataURL();cache.set(key,url);return url;}
export function workstationParts(user,items){
 return workstationLayout({...user,equipment:{monitor:'monitor-0-0',...user?.equipment}},items);
}
export function drawStationPart(ctx,part,x,y,w=96,time=0){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(w/96,w/96);ctx.imageSmoothingEnabled=false;
 const source=itemSource(part.item);
 if(source)drawFrame(ctx,source,part.x,part.y,part.w,part.h,1);
 else drawItem(ctx,part.item,part.x,part.y,Math.min(part.w,part.h),time,false,false);
 ctx.restore();
}
export function drawWorkstation(ctx,user,items,x,y,w=96,aura=true,time=0){
 if(!user)return;
 for(const part of workstationParts(user,items))drawStationPart(ctx,part,x,y,w,time);
}

export function drawOfficeProp(ctx,index,x,y,width,height=width){const a={image:office,columns:4,rows:3};if(!a.image.complete||!a.image.naturalWidth)return false;const w=a.image.naturalWidth/a.columns,h=a.image.naturalHeight/a.rows;ctx.imageSmoothingEnabled=false;const xs=[0,.31,.56,.755,1],ys=[0,.35,.69,1],col=index%4,row=Math.floor(index/4);drawSprite(ctx,a.image,xs[col]*a.image.naturalWidth,ys[row]*a.image.naturalHeight,(xs[col+1]-xs[col])*a.image.naturalWidth,(ys[row+1]-ys[row])*a.image.naturalHeight,x,y,width,height);return true;}
