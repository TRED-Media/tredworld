import {Engine,GameError} from './engine.js';
export async function rpc(operation,payload={}){
 const url=process.env.GAME_SUPABASE_URL,key=process.env.GAME_SUPABASE_PUBLISHABLE_KEY,capability=process.env.GAME_STORE_CAPABILITY;
 if(!url||!key||!capability)throw new GameError('Cloud database chưa được cấu hình',503);
 const response=await fetch(url+'/rest/v1/rpc/tred_cloud_bridge',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({capability,operation,payload}),signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new GameError('Không thể truy cập cloud database',503);
 return response.json();
}
export async function withCloudEngine(fn,{write=false,bridge=rpc}={}){
 for(let attempt=0;attempt<8;attempt++){
  const snapshot=await bridge('read');const engine=new Engine(':memory:',snapshot.state);
  try{
   const result=await fn(engine,snapshot.revision);
   if(write||!snapshot.state){const saved=await bridge('commit',{revision:snapshot.revision,state:engine.read()});if(!saved.committed)continue;}
   return result;
  }finally{engine.close();}
 }
 throw new GameError('Có giao dịch đồng thời. Vui lòng thử lại.',409);
}
