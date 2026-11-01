import {directionIndex,vehicleRules} from './asset-rules.js';

// Anchors are normalized against the fitted vehicle image, not the shop cell.
// Every model inherits a type rig and may override it with vehicle.rider.
export const riderTypes={
 bike:{seat:[.5,.61],grips:[[.22,.32],[.78,.32]],feet:[[.32,.64],[.68,.64]],scale:.78,lean:2,torso:11,pedal:.065,reach:.3},
 scooter:{seat:[.5,.46],grips:[[.17,.68],[.83,.68]],feet:[[.35,.64],[.65,.64]],scale:.78,lean:1,torso:11,pedal:0,reach:.2},
 motorbike:{seat:[.5,.30],grips:[[.2,.49],[.8,.49]],feet:[[.32,.51],[.68,.51]],scale:.76,lean:6,torso:9,pedal:0,reach:.35}
};
// Bicycles point up in the supplied sheet; scooters and motorcycles point down.
export const riderModels={
 0:{seat:[.5,.62],grips:[[.24,.32],[.76,.32]],feet:[[.32,.64],[.68,.64]],lean:2},
 1:{seat:[.5,.61],grips:[[.22,.33],[.78,.33]],feet:[[.31,.63],[.69,.63]],lean:2},
 2:{seat:[.5,.61],grips:[[.25,.31],[.75,.31]],feet:[[.33,.65],[.67,.65]],lean:5,torso:9},
 3:{seat:[.5,.54],grips:[[.15,.31],[.85,.31]],feet:[[.35,.63],[.65,.63]],forward:'up',lean:1},
 4:{seat:[.5,.27],grips:[[.2,.49],[.8,.49]],feet:[[.34,.61],[.66,.61]],lean:2},
 5:{seat:[.5,.27],grips:[[.14,.48],[.86,.48]],feet:[[.35,.61],[.65,.61]],lean:1},
 6:{seat:[.5,.28],grips:[[.2,.50],[.8,.50]],feet:[[.32,.51],[.68,.51]],lean:6},
 7:{seat:[.5,.27],grips:[[.22,.48],[.78,.48]],feet:[[.31,.50],[.69,.50]],lean:8,torso:8},
 8:{seat:[.5,.25],grips:[[.18,.48],[.82,.48]],feet:[[.3,.49],[.7,.49]],lean:7,torso:8}
};
export function vehicleProfile(vehicle){
 if(!vehicle||!vehicleRules[vehicle.kind])throw new Error('Unknown vehicle kind');
 const original=vehicleRules[vehicle.kind];
 const base={...original,...vehicle.rig};
 if(!Number.isFinite(base.w)||!Number.isFinite(base.h)||base.w<=0||base.h<=0)throw new Error('Invalid vehicle size');
 const type=riderTypes[vehicle.kind],model=riderModels[vehicle.variant]||{};
 const rider=type?{...type,...model,...vehicle.rider}:null;
 if(rider)validateRider(rider);
 const forward=vehicle.kind==='car'?'down':rider?.forward||(vehicle.kind==='bike'?'up':'down');
 const angles=forward==='up'?[Math.PI,0,-Math.PI/2,Math.PI/2]:[0,Math.PI,Math.PI/2,-Math.PI/2];
 return {...base,rider,angles};
}
export function validateRider(rider){
 if(rider.forward&&!['up','down'].includes(rider.forward))throw new Error('Vehicle forward axis must be up or down');
 for(const point of [rider.seat,...(rider.grips||[]),...(rider.feet||[])])if(!Array.isArray(point)||point.length!==2||!point.every(n=>Number.isFinite(n)&&n>=0&&n<=1))throw new Error('Rider anchors must be normalized');
 if(rider.grips?.length!==2||rider.feet?.length!==2)throw new Error('Rider requires two grips and foot supports');
 if(!Number.isFinite(rider.scale)||rider.scale<=0||rider.scale>1.5||!Number.isFinite(rider.lean)||!Number.isFinite(rider.torso)||rider.torso<=0)throw new Error('Invalid rider proportions');
 if(rider.reach!==undefined&&(!Number.isFinite(rider.reach)||rider.reach<0||rider.reach>1))throw new Error('Invalid projected rider reach');
 return rider;
}
export function rotatePoint([x,y],angle){return [x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle)];}
export function hinge(a,b,bend=3){
 const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;
 return [(a[0]+b[0])/2-dy/length*bend,(a[1]+b[1])/2+dx/length*bend];
}
export function riderPose(vehicle,rect,direction,frame=0,moving=false){
 const profile=vehicleProfile(vehicle),rig=profile.rider;if(!rig)return null;
 const angle=profile.angles[directionIndex(direction)];
 const point=([u,v])=>rotatePoint([rect.x+u*rect.w,rect.y+v*rect.h],angle);
 const hip=point(rig.seat),forward=rotatePoint([0,profile.angles[0]===Math.PI?-1:1],angle);
 const right=[forward[1],-forward[0]],phase=moving?frame*Math.PI/14:0;
 const feet=rig.feet.map((p,index)=>{
  const q=[...p];if(rig.pedal&&moving)q[1]+=Math.sin(phase+index*Math.PI)*rig.pedal;
  return point(q);
 });
 const grips=rig.grips.map(point),center=grips.reduce((a,p)=>[a[0]+p[0]/2,a[1]+p[1]/2],[0,0]);
 // Project the chest toward the actual handlebar. Front views foreshorten the
 // torso instead of drawing an upright walking body over a top-down vehicle.
 let chest=[(center[0]-hip[0])*(rig.reach||0)+forward[0]*rig.lean,Math.max(-rig.torso*1.1,Math.min(-3,-rig.torso*.7+(center[1]-hip[1])*(rig.reach||0)+forward[1]*rig.lean*.35))];
 const length=Math.hypot(...chest),limit=rig.torso*1.1;if(length>limit)chest=chest.map(n=>n*limit/length);
 const neck=[hip[0]+chest[0],hip[1]+chest[1]];
 const shoulders=[-1,1].map(sign=>[neck[0]+right[0]*5*rig.scale*sign,neck[1]+2+right[1]*3*rig.scale*sign]);
 const hips=[-1,1].map(sign=>[hip[0]+right[0]*3*rig.scale*sign,hip[1]+right[1]*2*rig.scale*sign]);
 return {hip,neck,shoulders,hips,grips,feet,right,forward,scale:rig.scale,phase,kind:vehicle.kind,parts:[0,1].map(index=>({shoulder:shoulders[index],elbow:hinge(shoulders[index],grips[index],index?2:-2),hand:grips[index],hip:hips[index],knee:hinge(hips[index],feet[index],index?4:-4),foot:feet[index]}))};
}
