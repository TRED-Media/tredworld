const characterSheet=new Image();characterSheet.onload=()=>window.dispatchEvent(new Event('game-changed'));characterSheet.src='/art/office-character.png';
// Original pixel artwork drawn on integer grids; reference UI is rebuilt as live components.
export function pixelCharacter(c,x,y,color='#6e879e',walk=false,variant=0,frame=0,direction=0){
 if(characterSheet.complete&&characterSheet.naturalWidth){const w=characterSheet.naturalWidth/4,h=characterSheet.naturalHeight/4,col=walk?1+Math.floor(frame/8)%3:0;c.imageSmoothingEnabled=false;c.drawImage(characterSheet,col*w,direction*h,w,h,Math.round(x-21),Math.round(y-34),42,56);return;}
 const r=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x+a),Math.round(y+b),w,h);};
 const ink='#202430',hair=['#292c36','#745447','#252b38','#a78a55','#414354','#ab707b','#343340','#67584c'][variant%8],skin=['#f0c5a2','#edbb9f','#dfb18e'][variant%3],step=walk?Math.round(Math.sin(frame*.16)*2):0;
 r(-12,18,25,4,'#26304735');r(-8,8,7,11+step,ink);r(3,8,7,11-step,ink);r(-9,17+step,9,3,'#e9e5d3');r(2,17-step,9,3,'#e9e5d3');r(-10,-5,22,17,ink);r(-8,-4,18,13,color);r(-2,-3,5,10,'#e3e0d3');r(-1,-2,3,3,'#d96a7a');r(-7,0,4,2,'#94acc0');r(-8,10,18,2,'#28354b');r(-13,-2,5,10,ink);r(-12,-1,3,7,skin);r(11,-2,5,10,ink);r(12,-1,3,7,skin);
 r(-10,-30,21,2,ink);r(-14,-28,28,3,ink);r(-16,-25,32,17,ink);r(-13,-8,26,5,ink);r(-9,-4,18,2,ink);r(-12,-23,25,15,skin);r(-9,-9,19,5,skin);r(-12,-11,4,4,'#d79b86');r(10,-11,3,4,'#d79b86');
 r(-10,-29,20,3,hair);r(-14,-26,28,9,hair);r(-15,-22,7,13,hair);r(9,-22,6,12,hair);r(-8,-20,6,7,hair);r(-2,-21,5,5,hair);r(4,-20,6,8,hair);r(-9,-27,11,2,'#575560');r(-12,-24,5,3,'#494650');r(5,-27,6,2,'#4a4550');r(-7,-12,3,4,ink);r(5,-12,3,4,ink);r(-7,-12,1,1,'#fff8e7');r(5,-12,1,1,'#fff8e7');r(0,-6,3,1,'#bf7d77');r(-10,-7,3,1,'#df9c94');r(10,-7,3,1,'#df9c94');
}
export function avatarImage(user,items=[]){const canvas=document.createElement('canvas');canvas.width=96;canvas.height=108;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.scale(2,2);const shirt=items.find(i=>i.id===user?.equipment?.shirt);pixelCharacter(c,24,36,shirt?.color||'#7489a5',false,(user?.name?.charCodeAt(0)||0)%8);return canvas.toDataURL();}
const shapes={office:'M3 10h2V8h2V6h2V4h6v2h2v2h2v2h2v11h-7v-7h-4v7H3z',quests:'M7 3h3V1h4v2h3v3h3v17H4V6h3zm0 6v2h2V9zm4 0v2h6V9zm-4 5v2h2v-2zm4 0v2h6v-2z',store:'M3 3h18v5h2v5h-2v9H3v-9H1V8h2zm3 11v6h5v-6zm8 0v6h4v-6z',inventory:'M8 2h8v3h3v4h2v13H3V9h2V5h3zm0 5v3h8V7zm-2 6v6h12v-6z',profile:'M8 2h8v2h2v8h-2v2H8v-2H6V4h2zm-2 14h12v2h3v5H3v-5h3z',workspace:'M2 7h20v10H2zm4 12h14v2H4z',garage:'M6 3h12l3 7h2v10h-3v3h-3v-3H7v3H4v-3H1V10h2zm1 3-2 5h14l-2-5z',pets:'M2 5h4v6H2zm6-3h4v7H8zm6 0h4v7h-4zm6 3h4v6h-4zM8 12h8v2h3v7h-3v2H8v-2H5v-7h3z',coin:'M7 1h10v2h4v4h2v10h-2v4h-4v2H7v-2H3v-4H1V7h2V3h4zm3 5v12h4v-3h-2V9h4V6z',trophy:'M7 2h10v3h6v7h-3v3h-5v4h4v4H5v-4h4v-4H4v-3H1V5h6zm-3 6v3h3V8zm13 0v3h3V8z',settings:'M9 1h6v4h4v4h4v6h-4v4h-4v4H9v-4H5v-4H1V9h4V5h4zm0 8v6h6V9z'};
const vectorIcon=(name)=>`<svg class="pixel-icon" viewBox="0 0 24 24" aria-hidden="true" shape-rendering="crispEdges"><path fill="currentColor" fill-rule="evenodd" d="${shapes[name]||shapes.inventory}"/></svg>`;
export function workstationScene(ctx,user,items,time,aura,draw){
 const r=(x,y,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(x,y,w,h);};
 r(0,0,480,300,'#737f8d');r(0,0,480,152,'#3c4a61');for(let y=0;y<152;y+=16)for(let x=0;x<480;x+=32){r(x+(y%32?16:0),y,31,15,'#45526a');}for(let y=152;y<300;y+=22)for(let x=0;x<480;x+=32){r(x,y,31,21,(x+y)%3?'#a0a39d':'#a9aca3');}
 r(18,14,100,124,'#202d40');r(22,18,92,115,'#7c9bab');r(27,22,83,105,'#b2ccd2');r(64,18,5,115,'#35465c');r(22,72,92,5,'#35465c');r(28,28,24,4,'#d6e5e0');
 r(145,35,118,7,'#ba9771');r(145,42,118,4,'#263143');for(let i=0;i<7;i++)r(150+i*13,17+i%3*3,9,18-i%3*3,['#ce8e88','#7b98a5','#d1b878'][i%3]);
 r(317,22,111,57,'#252b43');r(320,25,105,51,'#d0b088');r(324,29,97,43,'#26334e');ctx.fillStyle='#ef718f';ctx.font='bold 30px monospace';ctx.fillText('T-RED',328,60);
 draw(ctx,user,items,100,151,260,aura,time);r(389,179,30,45,'#e1ddd1');r(393,215,22,7,'#afb9b2');for(let i=0;i<10;i++)r(378+i%4*12,128+i*4,16,14,['#446b51','#64896a','#88a576'][i%3]);
}

const uiIndices={office:0,quests:1,store:2,inventory:3,profile:4,workspace:5,garage:6,pets:7,coin:8,trophy:9,settings:10,gift:11};
export const icon=name=>name in uiIndices?`<span class="pixel-icon atlas-icon" aria-hidden="true" style="background-position:${uiIndices[name]%4*100/3}% ${Math.floor(uiIndices[name]/4)*50}%"></span>`:vectorIcon(name);
