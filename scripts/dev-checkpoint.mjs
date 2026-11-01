import {resolve} from 'node:path';
import {createCheckpoint,restoreCheckpoint,verifyCheckpoint,evidenceId,save} from './dev-evidence.mjs';
import {routeTask} from './skill-router.mjs';
import {execFileSync} from 'node:child_process';
const [command,...args]=process.argv.slice(2),value=flag=>{const i=args.indexOf(flag);return i<0?undefined:args[i+1];};
try{
 const root=process.cwd();let result;
 if(command==='create'){
  result=createCheckpoint(root,value('--output')||'work/dev-checkpoints/'+evidenceId(),value('--label'));
  if(value('--task'))result.route=routeTask(value('--task'));
  if(args.includes('--visual')){execFileSync('npm',['run','build'],{stdio:'inherit'});result.visualBefore=resolve(result.directory,'visual-before');execFileSync(process.execPath,['tests/visual-capture.mjs','--output',result.visualBefore],{stdio:'inherit'});}
  save(resolve(result.directory,'checkpoint.json'),result);
 }
 else if(command==='verify')result=verifyCheckpoint(root,value('--checkpoint'));
 else if(command==='restore')result=restoreCheckpoint(root,value('--checkpoint'),value('--output')||'work/skill-rollbacks/'+evidenceId());
 else throw new Error('Use create [--label name] [--output work/new], verify --checkpoint path, or restore --checkpoint path [--output work/new]');
 console.log(JSON.stringify(command==='create'?{directory:result.directory,head:result.head,files:result.files.length,deleted:result.deleted}:result,null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
