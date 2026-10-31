export const rooms=[{id:'reception',name:'LỄ TÂN',x:32,y:32,w:310,h:380},{id:'studio',name:'STUDIO / PHOTOBOOTH',x:1030,y:32,w:282,h:400},{id:'meeting',name:'PHÒNG HỌP & LOUNGE',x:452,y:500,w:360,h:416},{id:'storage',name:'KHO & HẬU KỲ',x:32,y:500,w:368,h:416},{id:'pantry',name:'PANTRY & MEDIA',x:912,y:500,w:400,h:416}];
export const people=['Thịnh','Tuyền','Hưng','Hải','Dân','Xinh','Huy Trần','Muội'];
export const desks=[{x:460,y:210,owner:0},{x:620,y:210,owner:1},{x:780,y:210,owner:2},{x:460,y:350,owner:3},{x:620,y:350,owner:4},{x:780,y:350,owner:5},{x:96,y:730,owner:6},{x:240,y:730,owner:7},{x:990,y:780,owner:4},{x:1140,y:780,owner:5}];
// Collision rectangles follow the clean office scene, with gaps at visible doors.
const sceneRect=(x,y,w,h)=>({x:x*1344/1448,y:(y-100)*950/850,w:w*1344/1448,h:h*950/850});
export const obstacles=[[375,110,14,310],[490,486,395,14],[475,530,14,350],[875,490,14,120],[875,710,14,170],[490,866,390,16],[940,486,410,14],[935,490,14,160],[935,840,14,40],[940,866,410,16],[1342,490,14,390],[20,866,450,16],[598,598,170,100],[550,752,245,80],[144,247,195,65],[155,417,190,48],[1120,365,180,65],[977,552,245,74]].map(r=>sceneRect(...r));
export function blocked(x,y){if(x<20||x>1324||y<20||y>1220)return true;if(obstacles.some(r=>x>r.x-6&&x<r.x+r.w+6&&y>r.y-6&&y<r.y+r.h+6))return true;return desks.some(d=>x>d.x-12&&x<d.x+104&&y>d.y-12&&y<d.y+63);}
