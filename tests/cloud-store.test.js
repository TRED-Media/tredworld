import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Engine} from '../server/engine.js';
import {withCloudEngine} from '../server/cloud-store.js';
test('cloud compare-and-swap retries concurrent purchases without losing balances or ownership',async()=>{
 const seed=new Engine(),initial=seed.read();seed.close();let state=initial,revision=1;
 const bridge=async(op,p)=>{if(op==='read'){const result={state:structuredClone(state),revision};await new Promise(r=>setTimeout(r,2));return result;}if(p.revision!==revision)return {committed:false};state=structuredClone(p.state);revision++;return {committed:true};};
 const buy=(itemId,key)=>withCloudEngine(e=>e.mutate('dan','purchase',{itemId},key),{write:true,bridge});
 await Promise.all([buy('hat-0-0','a'),buy('glasses-0-0','b')]);assert.equal(state.users.find(u=>u.id==='dan').rc,30);assert.equal(state.transactions.filter(t=>t.kind==='purchase').length,2);
 await buy('hat-0-0','a');assert.equal(state.users.find(u=>u.id==='dan').rc,30);
});
test('cloud retry preserves auth and rejected mutations do not commit',async()=>{
 const seed=new Engine(),initial=seed.read();const token=seed.login('dan','tred-demo-2026');let state=seed.read();seed.close();let writes=0;
 const bridge=async(op,p)=>op==='read'?{state:structuredClone(state),revision:1}:(writes++,{committed:true});
 await assert.rejects(()=>withCloudEngine(e=>e.mutate(e.auth(token),'adjust',{rc:500,userId:'dan',reason:'cheat'},'hack'),{write:true,bridge}),/Không được/);assert.equal(writes,0);
 const user=await withCloudEngine(e=>e.state(e.auth(token)).me,{bridge});assert.equal(user.id,'dan');assert.equal(user.rc,initial.users.find(u=>u.id==='dan').rc);
});
