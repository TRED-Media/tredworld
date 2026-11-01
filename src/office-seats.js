import {desks} from './world.js';
import {workstationLayout} from './workstation-layout.js';
export const staffOrder=['thinh','tuyen','hung','hai','dan','xinh','huy','muoi','admin'];
export const sourcePoint=(x,y)=>({x:x*1344/1448,y:(y-31)*1344/1448});
// Authored spatial metadata, independent of the background raster. Coordinates
// use its preserved source frame; all chairs are rendered as separate entities.
const specs=[
 ['reception-counter',230,266,0,1,'Ghế lễ tân',230,215],
 ['waiting-1',193,473,0,2,'Ghế chờ',193,495],['waiting-2',248,473,0,2,'Ghế chờ',248,495],['waiting-3',303,473,0,2,'Ghế chờ',303,495],
 ['storage-north-1',168,590,0,1,'Ghế hậu kỳ',168,535],['storage-north-2',252,590,0,1,'Ghế hậu kỳ',252,535],['storage-north-3',354,590,0,1,'Ghế hậu kỳ',354,535],
 ['storage-south-1',253,847,0,1,'Ghế thiết bị',253,792],['storage-south-2',303,847,0,1,'Ghế thiết bị',303,792],['storage-south-3',353,847,0,1,'Ghế thiết bị',353,792],
 ['meeting-north',637,636,0,1,'Ghế họp',637,582],['meeting-west',565,696,3,1,'Ghế họp',540,705],['meeting-east',789,696,2,1,'Ghế họp',818,705],
 ['meeting-south-1',644,733,1,1,'Ghế họp',644,754],['meeting-south-2',711,733,1,1,'Ghế họp',711,754],
 ['lounge-1',586,819,0,4,'Ghế lounge',566,792],['lounge-2',657,819,0,4,'Ghế lounge',685,782],
 ['pantry-1',1150,710,0,1,'Ghế pantry',1150,736],['pantry-2',1201,710,0,1,'Ghế pantry',1201,736]
];
export const staticSeats=specs.map(([id,x,y,direction,style,label,ax,ay])=>{const floor=sourcePoint(x,y);return {id,direction,style,label,floor,approach:sourcePoint(ax,ay),w:34,h:47,kind:'chair',static:true};});
export const foregroundFurniture=[
 {id:'reception-desk',rect:[144,247,195,65]},
 {id:'storage-north-counter',rect:[138,567,282,132]},
 {id:'storage-south-counter',rect:[135,819,285,37]},
 {id:'meeting-table',rect:[590,610,165,100]},
 {id:'lounge-table',rect:[584,795,80,57]}
];
export function officeSeats(users=[],catalog=[],partsFor){
 const work=desks.map((desk,index)=>{const owner=users.find(u=>u.id===staffOrder[index]);if(!owner)return null;
  const parts=partsFor?partsFor(owner,catalog):workstationLayout(owner,catalog),chair=parts.find(p=>p.slot==='chair');
  if(!chair)return null;const origin={x:desk.x,y:desk.y-22},floor={x:origin.x+chair.x+chair.w/2,y:origin.y+chair.y+chair.h};
  return {id:'work-'+index,label:'Ghế · '+owner.name,owner:owner.id,deskIndex:index,direction:1,style:chair.item.variant%5,item:chair.item,kind:'chair',w:chair.w,h:chair.h,floor,approach:{x:floor.x,y:Math.max(desk.seat.y+5,floor.y+15)},static:false};
 }).filter(Boolean);
 return [...staticSeats,...work];
}
export function seatAt(seats,x,y){return seats.filter(s=>Math.abs(x-s.floor.x)<=Math.max(15,s.w/2+3)&&y>=s.floor.y-s.h-3&&y<=s.floor.y+5).sort((a,b)=>Math.abs(y-(a.floor.y-14))-Math.abs(y-(b.floor.y-14)))[0];}
export function occupantOf(seat,users,now=Date.now()){
 return users.find(u=>u.seat?.id===seat.id&&u.seat.until>now)||users.find(u=>u.seatId===seat.id)||users.find(u=>!u.online&&u.status==='Working'&&u.id===seat.owner);
}
