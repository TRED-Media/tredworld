// A garment is fitted once between its collar and hem, never as separate strips.
// UV anchors describe the source artwork; anatomy describes the wearer.
const collars={front:[.20,.13,.13,.11,.11],back:[.09,.06,.06,.07,.07],side:[.20,.12,.12,.10,.10]};
const hemOverlap=[4,1,1,3,3];
export function shirtFit(frame,item,direction,anatomy){
 const variant=Number.isInteger(item.variant)?((item.variant%5)+5)%5:0;
 const custom=item.art?.collar;
 const v=custom?.[1]??collars[direction===0?'front':direction===1?'back':'side'][variant];
 const u=custom?.[0]??(direction<2?.5:direction===2?.48:.52);
 if(![u,v].every(Number.isFinite)||u<0||u>1||v<0||v>=1)throw new Error('Shirt collar must be a normalized UV anchor');
 const h=(anatomy.waistY+hemOverlap[variant]-anatomy.neck.y)/(1-v),w=h*frame.sw/frame.sh;
 return {x:anatomy.neck.x-u*w,y:anatomy.neck.y-v*h,w,h,alignY:0};
}
