import {drawCharacter} from './character-art.js';
import {artRevision} from './art-assets.js';
import {FrameCache,textureKey} from './asset-rules.js';
export {characterVariant} from './character-art.js';
export function pixelCharacter(c,x,y,color='#6e879e',walk=false,variant=0,frame=0,direction=0){
 const ids=['hai','tuyen','hung','thinh','dan','huy','xinh','muoi','freelancer','visitor'];
 drawCharacter(c,{id:ids[variant]||'visitor',equipment:{}},[],x,y,{moving:walk,frame,direction,pet:false});
}
const portraits=new FrameCache(32);
export function avatarImage(user,items=[]){const key=JSON.stringify([artRevision(),user.id,user.avatarModel,...['shirt','hat','glasses','shoes'].map(s=>{const item=items.find(i=>i.id===user.equipment?.[s]);return item?textureKey(item):null;})]);if(portraits.has(key))return portraits.get(key);const canvas=document.createElement('canvas');canvas.width=384;canvas.height=528;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.scale(8,8);drawCharacter(c,user,items,24,42,{pet:false,aura:false});const url=canvas.toDataURL();portraits.set(key,url);return url;}
const shapes={office:'M3 10h2V8h2V6h2V4h6v2h2v2h2v2h2v11h-7v-7h-4v7H3z',quests:'M7 3h3V1h4v2h3v3h3v17H4V6h3zm0 6v2h2V9zm4 0v2h6V9zm-4 5v2h2v-2zm4 0v2h6v-2z',store:'M3 3h18v5h2v5h-2v9H3v-9H1V8h2zm3 11v6h5v-6zm8 0v6h4v-6z',inventory:'M8 2h8v3h3v4h2v13H3V9h2V5h3zm0 5v3h8V7zm-2 6v6h12v-6z',profile:'M8 2h8v2h2v8h-2v2H8v-2H6V4h2zm-2 14h12v2h3v5H3v-5h3z',workspace:'M2 7h20v10H2zm4 12h14v2H4z',garage:'M6 3h12l3 7h2v10h-3v3h-3v-3H7v3H4v-3H1V10h2zm1 3-2 5h14l-2-5z',pets:'M2 5h4v6H2zm6-3h4v7H8zm6 0h4v7h-4zm6 3h4v6h-4zM8 12h8v2h3v7h-3v2H8v-2H5v-7h3z',coin:'M7 1h10v2h4v4h2v10h-2v4h-4v2H7v-2H3v-4H1V7h2V3h4zm3 5v12h4v-3h-2V9h4V6z',trophy:'M7 2h10v3h6v7h-3v3h-5v4h4v4H5v-4h4v-4H4v-3H1V5h6zm-3 6v3h3V8zm13 0v3h3V8z',settings:'M9 1h6v4h4v4h4v6h-4v4h-4v4H9v-4H5v-4H1V9h4V5h4zm0 8v6h6V9z'};
Object.assign(shapes,{start:'M5 2h3v2h3v2h3v2h3v2h3v4h-3v2h-3v2h-3v2H8v2H5z',save:'M3 2h16v2h3v18H2V2zm3 2v7h12V4zm0 10v6h12v-6zm8-10v5h2V4z',map:'M2 3h6v2h8V3h6v18h-6v-2H8v2H2zm7 4v10h6V7zm-5-2v14h2V5zm14 0v14h2V5z'});
const vectorIcon=(name)=>`<svg class="pixel-icon" viewBox="0 0 24 24" aria-hidden="true" shape-rendering="crispEdges"><path fill="currentColor" fill-rule="evenodd" d="${shapes[name]||shapes.inventory}"/></svg>`;
export function workstationScene(ctx,user,items,time,aura,draw){
 const r=(x,y,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(x,y,w,h);};
 r(0,0,480,300,'#737f8d');r(0,0,480,152,'#3c4a61');for(let y=0;y<152;y+=16)for(let x=0;x<480;x+=32){r(x+(y%32?16:0),y,31,15,'#45526a');}for(let y=152;y<300;y+=22)for(let x=0;x<480;x+=32){r(x,y,31,21,(x+y)%3?'#a0a39d':'#a9aca3');}
 r(18,14,100,124,'#202d40');r(22,18,92,115,'#7c9bab');r(27,22,83,105,'#b2ccd2');r(64,18,5,115,'#35465c');r(22,72,92,5,'#35465c');r(28,28,24,4,'#d6e5e0');
 r(145,35,118,7,'#ba9771');r(145,42,118,4,'#263143');for(let i=0;i<7;i++)r(150+i*13,17+i%3*3,9,18-i%3*3,['#ce8e88','#7b98a5','#d1b878'][i%3]);
 r(317,22,111,57,'#252b43');r(320,25,105,51,'#d0b088');r(324,29,97,43,'#26334e');ctx.fillStyle='#ef718f';ctx.font='bold 30px monospace';ctx.fillText('T-RED',328,60);
 draw(ctx,user,items,160,72,160,aura,time);r(389,179,30,45,'#e1ddd1');r(393,215,22,7,'#afb9b2');for(let i=0;i<10;i++)r(378+i%4*12,128+i*4,16,14,['#446b51','#64896a','#88a576'][i%3]);
}

const uiIndices={office:0,quests:8,store:3,inventory:11,profile:8,workspace:1,garage:9,pets:5,coin:3,trophy:10,settings:2,gift:7,save:1,start:0,diamond:4,heart:5,star:6,mail:7};
export const icon=name=>{if(shapes[name])return vectorIcon(name);if(!(name in uiIndices))return vectorIcon(name);const index=uiIndices[name],col=index%4,row=Math.floor(index/4),xs=[40,390,735,1090,1420],ys=[80,400,720,1040];return `<svg class="pixel-icon" aria-hidden="true" viewBox="${xs[col]} ${ys[row]} ${xs[col+1]-xs[col]} ${ys[row+1]-ys[row]}" preserveAspectRatio="xMidYMid meet"><image href="/art/ui-atlas.png" width="1448" height="1086"/></svg>`;};
