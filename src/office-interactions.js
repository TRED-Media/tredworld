import {officeSeats,seatAt} from './office-seats.js';
import {desks} from './world.js';
import {artRevision} from './art-assets.js';
let key='',cached=[];
export function officeObjects(users,catalog,partsFor){
 const next=artRevision()+JSON.stringify(users.map(u=>[u.id,u.name,u.equipment,u.layout]));if(next===key)return cached;key=next;
 const seats=officeSeats(users,catalog,partsFor),workspaces=seats.filter(s=>s.owner).map(s=>{const d=desks[s.deskIndex],owner=users.find(u=>u.id===s.owner),parts=partsFor(owner,catalog),desk=parts.find(p=>p.slot==='desk');return {id:'setup-'+s.deskIndex,kind:'workspace',owner:s.owner,deskIndex:s.deskIndex,label:'Góc làm việc · '+owner.name,point:{x:d.x+48,y:d.y-22+(desk?.y||22)+(desk?.h||47)},w:96,h:desk?.h||47,parts};});
 cached=[...seats,...workspaces,{id:'garage',kind:'garage',label:'Bãi xe',point:{x:672,y:1120},w:120,h:50}];return cached;
}
export function hitObject(objects,x,y){
 const seat=seatAt(objects.filter(o=>o.kind==='chair'),x,y);if(seat)return seat;
 return objects.find(o=>o.kind==='workspace'&&Math.abs(x-o.point.x)<48&&y>=o.point.y-o.h&&y<=o.point.y)|| (y>980?objects.find(o=>o.kind==='garage'):null);
}
export function nearestObject(objects,position){
 return objects.map(object=>({object,distance:Math.hypot(position.x-(object.approach||object.point).x,position.y-(object.approach||object.point).y)})).filter(x=>x.distance<85).sort((a,b)=>a.distance-b.distance)[0]?.object;
}
