import test from 'node:test';
import assert from 'node:assert/strict';
import {configureCanvas,cameraView,screenToWorld,worldToScreen,alternateZoom} from '../src/render-quality.js';

test('camera pixels and pointer coordinates stay aligned across density, zoom and world edges',()=>{
 for(const ratio of [1,1.25,1.5,2,3])for(const zoom of [.65,.85,1.1,1.35,2.5])for(const [width,height] of [[362,586],[946,662],[1345,780]])for(const [x,y] of [[0,0],[860,455],[1344,1248]]){
  const view=cameraView(width,height,zoom,ratio,x,y),physical=view.scale*ratio;
  assert(Math.abs(physical-Math.round(physical))<1e-9);
  assert(Math.abs(view.x*physical-Math.round(view.x*physical))<1e-9);
  const screen=worldToScreen(view,x,y),world=screenToWorld(view,screen.x,screen.y);
  assert(Math.abs(world.x-x)<1e-8&&Math.abs(world.y-y)<1e-8);
  assert.notEqual(cameraView(width,height,alternateZoom(view),ratio,x,y).scale,view.scale);
 }
});
test('native preview surfaces resize only when density or dimensions change',()=>{
 let writes=0;const context={setTransform(...args){this.transform=args;}},canvas={dataset:{},getContext(){return context;},get width(){return this.w;},set width(v){writes++;this.w=v;},get height(){return this.h;},set height(v){writes++;this.h=v;}};
 configureCanvas(canvas,192,192,{ratio:3});assert.equal(canvas.width,576);assert.equal(canvas.height,576);assert.equal(context.imageSmoothingEnabled,false);
 for(let n=0;n<120;n++)configureCanvas(canvas,192,192,{ratio:3});assert.equal(writes,2);
 configureCanvas(canvas,192,192,{ratio:2,pixelArt:false});assert.equal(writes,4);assert.equal(context.imageSmoothingEnabled,true);assert.deepEqual(context.transform,[2,0,0,2,0,0]);
});
