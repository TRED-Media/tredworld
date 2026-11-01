import {findPath,clearSegment} from './pathfinding.js';
export class SeatController{
 constructor(api,notify=(_message)=>{},getIdentity=()=>undefined){this.api=api;this.notify=notify;this.getIdentity=getIdentity;this.version=0;this.seatId=null;this.target=null;this.path=[];this.pending=false;this.renewAt=Infinity;this.released=Promise.resolve();}
 navigate(seat,position,occupied=false){
  if(occupied){this.notify('Ghế đang có người ngồi');return false;}
  const path=findPath(position,seat.approach);if(!path){this.notify('Chưa tìm được lối tới ghế này');return false;}
  this.leave();this.target=seat;this.path=path;return true;
 }
 cancelNavigation(){this.version++;this.path=[];this.target=null;}
 leave(){const hadSeat=this.seatId;this.cancelNavigation();this.seatId=null;this.renewAt=Infinity;if(hadSeat)this.released=this.api.action('seat',{seatId:null}).catch(()=>{});}
 reset(){this.cancelNavigation();this.seatId=null;this.pending=false;this.renewAt=Infinity;}
 async claim(position,seat,version){
  if(this.pending)return;this.pending=true;const identity=this.getIdentity();
  try{
   await this.api.request('position',{x:Math.round(position.x),y:Math.round(position.y),animation:'idle',facing:seat.direction,moving:false});
   await this.released;if(version!==this.version)return;
   const result=await this.api.action('seat',{seatId:seat.id});
   if(version!==this.version){if(identity===this.getIdentity())await this.api.action('seat',{seatId:null});return;}
   this.seatId=result.seat.id;this.renewAt=performance.now()+15000;this.target=null;this.notify(seat.owner===identity?'Đã ngồi · E để check-in làm việc, di chuyển để đứng':'Đã ngồi · Di chuyển hoặc nhấn E để đứng dậy');
  }catch(error){if(version===this.version){this.cancelNavigation();this.notify(error.message);}}
  finally{this.pending=false;}
 }
 step(position,dt,now=performance.now()){
  if(this.seatId){if(now>=this.renewAt&&!this.pending){this.pending=true;this.renewAt=now+15000;const id=this.seatId,version=this.version;this.api.action('seat',{seatId:id}).catch(error=>{if(version===this.version){this.leave();this.notify(error.message);}}).finally(()=>this.pending=false);}return null;}
  if(!this.target||this.pending)return null;
  let remaining=145*dt,p={...position},direction=0;
  while(this.path.length&&remaining>0){const next=this.path[0],dx=next.x-p.x,dy=next.y-p.y,distance=Math.abs(dx)+Math.abs(dy);if(distance<.1){p={...next};this.path.shift();continue;}const horizontal=Math.abs(dx)>.01;direction=horizontal?(dx<0?2:3):(dy<0?1:0);const step=Math.min(remaining,horizontal?Math.abs(dx):Math.abs(dy),2),q={x:p.x+(horizontal?Math.sign(dx)*step:0),y:p.y+(horizontal?0:Math.sign(dy)*step)};if(!clearSegment(p,q)){this.cancelNavigation();this.notify('Lối đi đã bị chặn');return null;}p=q;remaining-=step;}
  if(!this.path.length)void this.claim(p,this.target,this.version);
  return {...p,direction,moving:Math.abs(p.x-position.x)+Math.abs(p.y-position.y)>.01};
 }
}
