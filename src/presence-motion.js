// Remote presence is sampled once per actor. Vehicle, limbs and labels consume
// this same root; the local player remains immediate and responsive.
export class PresenceMotion{
 constructor(){this.tracks=new Map();}
 retain(ids){const active=new Set(ids);for(const id of this.tracks.keys())if(!active.has(id))this.tracks.delete(id);}
 sample(user,now){
  const point=user.position,dir=user.facing||0;
  if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y))return {x:0,y:0,direction:dir,moving:false};
  let track=this.tracks.get(user.id);
  if(!track){track={start:{...point},end:{...point},at:now,duration:1,direction:dir};this.tracks.set(user.id,track);}
  if(point.x!==track.end.x||point.y!==track.end.y){
   const current=this.interpolate(track,now),distance=Math.hypot(point.x-current.x,point.y-current.y);
   const duration=Math.min(1000,Math.max(80,now-track.at));
   track={start:distance>500?{...point}:current,end:{...point},at:now,duration,direction:dir};this.tracks.set(user.id,track);
  }else if(now-track.at>=track.duration||(point.x===track.start.x&&point.y===track.start.y))track.direction=dir;
  const current=this.interpolate(track,now);
  return {...current,moving:Math.hypot(point.x-current.x,point.y-current.y)>.5||user.moving===true||user.animation==='walk'};
 }
 interpolate(track,now){
  const t=Math.max(0,Math.min(1,(now-track.at)/track.duration)),a=track.start,b=track.end;
  const dx=b.x-a.x,dy=b.y-a.y,total=Math.abs(dx)+Math.abs(dy),horizontal=track.direction>=2;
  if(!total)return {x:b.x,y:b.y,direction:track.direction};
  const travelled=t*total,first=horizontal?Math.abs(dy):Math.abs(dx);
  if(travelled<first){
   return horizontal?{x:a.x,y:a.y+Math.sign(dy)*travelled,direction:dy<0?1:0}:{x:a.x+Math.sign(dx)*travelled,y:a.y,direction:dx<0?2:3};
  }
  const rest=travelled-first;
  return horizontal?{x:a.x+Math.sign(dx)*rest,y:b.y,direction:track.direction}:{x:b.x,y:a.y+Math.sign(dy)*rest,direction:track.direction};
 }
}
