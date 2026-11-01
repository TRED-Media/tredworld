import {blocked} from './world.js';
// Four-connected paths share the gameplay collision function. The grid is a
// navigation aid only; every returned segment is checked against real geometry.
export function clearSegment(a,b,collision=blocked){
 const length=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);if(a.x!==b.x&&a.y!==b.y)return false;
 for(let t=0;t<=Math.ceil(length/2);t++){const u=length?Math.min(1,t*2/length):0;if(collision(a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u))return false;}return true;
}
export function findPath(start,target,collision=blocked){
 if(collision(start.x,start.y)||collision(target.x,target.y))return null;
 const step=8,width=169,height=157,key=(x,y)=>y*width+x,point=n=>({x:n%width*step,y:Math.floor(n/width)*step});
 const near=p=>{const result=[];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const x=Math.round(p.x/step)+dx,y=Math.round(p.y/step)+dy,q={x:x*step,y:y*step};if(x<0||x>=width||y<0||y>=height||collision(q.x,q.y))continue;const corner={x:q.x,y:p.y};if(clearSegment(p,corner,collision)&&clearSegment(corner,q,collision))result.push({id:key(x,y),via:corner,d:Math.abs(q.x-p.x)+Math.abs(q.y-p.y)});}return result.sort((a,b)=>a.d-b.d);};
 const begins=near(start),ends=near(target);if(!begins.length||!ends.length)return null;
 const goals=new Map(ends.map(n=>[n.id,n])),parents=new Int32Array(width*height).fill(-2),queue=new Uint32Array(width*height);let end=0,goal=-1;
 for(const n of begins){parents[n.id]=-1;queue[end++]=n.id;}
 for(let at=0;at<end;at++){const n=queue[at];if(goals.has(n)){goal=n;break;}const p=point(n),x=n%width,y=Math.floor(n/width);for(const next of [x?n-1:-1,x<width-1?n+1:-1,y?n-width:-1,y<height-1?n+width:-1])if(next>=0&&parents[next]===-2&&clearSegment(p,point(next),collision)){parents[next]=n;queue[end++]=next;}}
 if(goal<0)return null;const ids=[];for(let n=goal;n>=0;n=parents[n])ids.push(n);ids.reverse();
 const begin=begins.find(n=>n.id===ids[0]),finish=goals.get(goal),raw=[start,begin.via,...ids.map(point),finish.via,target],result=[];
 for(const p of raw){const last=result.at(-1);if(last&&p.x===last.x&&p.y===last.y)continue;const previous=result.at(-2);if(previous&&((previous.x===last.x&&last.x===p.x)||(previous.y===last.y&&last.y===p.y)))result.pop();result.push(p);}
 return result.slice(1);
}
