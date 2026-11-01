import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {openSync,closeSync} from 'node:fs';
import {verifyCheckpoint,inWork,json,newDirectory,save} from './dev-evidence.mjs';
import {routeTask,registry} from './skill-router.mjs';
import {compareCaptures,checkReport} from './visual-evidence.mjs';
const args=process.argv.slice(2),value=flag=>{const i=args.indexOf(flag);return i<0?undefined:args[i+1];};
const allowed=new Set(['npm test','npm run build','npm run test:browser','npm run test:graphics','npm run test:assets','npm run test:pipeline','npm run assets:check','npm run test:visual','npm run test:office']);
try{
 const root=process.cwd(),checkpoint=inWork(root,value('--checkpoint')),metadata=verifyCheckpoint(root,checkpoint),before=inWork(root,value('--before')||metadata.visualBefore);
 if(json(resolve(before,'capture.json')).runtimeSha!==metadata.runtimeSha)throw new Error('Baseline does not match the runtime source in the checkpoint');
 const out=newDirectory(root,value('--output')),plan=routeTask(value('--task')||'Kiểm thử game'),results=[];
 if(plan.requiresDesignCheckpoint)throw new Error('Record the engine/runtime design checkpoint before implementing this major change');
 save(resolve(out,'plan.json'),plan);
 for(const command of [...new Set(['npm test','npm run build',...plan.checks])]){
  if(!allowed.has(command))throw new Error('Check is not in the reviewed command allowlist');
  if(command==='npm run test:visual')continue; // The real before/after comparison below is stronger than a same-source self-check.
  console.log('CHECK '+command);const log=resolve(out,command.replace(/[^a-z0-9]+/g,'-')+'.log'),fd=openSync(log,'w');
  try{const [binary,...argv]=command.split(' ');execFileSync(binary,argv,{stdio:['ignore',fd,fd],env:{...process.env,TRED_GRAPHICS_OUTPUT:resolve(out,'graphics'),TRED_OFFICE_OUTPUT:resolve(out,'office')}});results.push({command,status:'passed',log});}
  catch(error){results.push({command,status:'failed',log});save(resolve(out,'verification.json'),{status:'failed',checkpoint,results});throw new Error('Check failed; inspect '+log);}
  finally{closeSync(fd);}
 }
 const after=resolve(out,'visual-after');execFileSync(process.execPath,['tests/visual-capture.mjs','--output',after],{stdio:'inherit'});
 const report=compareCaptures(root,before,after,resolve(out,'comparison'),registry.visual);
 save(resolve(out,'verification.json'),{status:report.status==='unchanged'?'passed':report.status,checkpoint,before,after,results,comparison:resolve(report.directory,'comparison.json')});
 console.log(JSON.stringify({status:report.status,output:out,images:report.images.length,checks:results.length}));
 if(report.status==='unchanged')checkReport(root,resolve(report.directory,'comparison.json'));else process.exitCode=2;
}catch(error){console.error(error.message);process.exitCode=1;}
