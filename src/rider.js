// Compatibility entry point for older callers; all mounts use the shared rig.
import {drawRider} from './character-art.js';
export function drawMounted(ctx,user,items,x,y,direction=0,time=0,moving=false,aura=true){
 const vehicle=items.find(item=>item.id===user?.equipment?.vehicle);
 if(!vehicle||user.vehicleParked!==false)return false;
 drawRider(ctx,user,items,vehicle,x,y,{direction,frame:time*60/1000,moving,aura});return true;
}
