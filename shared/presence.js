// Presence describes appearance only. Ownership still comes from game state.
export function appearancePresence(body,user) {
 const animation=['idle','walk','sit','interact','emote','drive'].includes(body.animation)?body.animation:'idle';
 return {
  facing:Number.isInteger(body.facing)&&body.facing>=0&&body.facing<=3?body.facing:0,
  animation:animation==='drive'&&(!user.equipment?.vehicle||user.vehicleParked!==false)||animation==='sit'&&!(user.seat?.until>Date.now()||user.seatUntil>Date.now())?'idle':animation,
  seatId:animation==='sit'?(user.seat?.until>Date.now()?user.seat.id:user.seatUntil>Date.now()?user.seatId:null):null,
  moving:body.moving===true||animation==='walk'
 };
}

export function visibleInOffice(user) {
 return !!user && user.status!=='Onsite' && (user.online===true || ['At Office','Working'].includes(user.status));
}
