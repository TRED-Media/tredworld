import {resolve} from 'node:path';
import {compareCaptures,reviewReport,checkReport} from './visual-evidence.mjs';
import {registry} from './skill-router.mjs';
const [command,...args]=process.argv.slice(2),value=flag=>{const i=args.indexOf(flag);return i<0?undefined:args[i+1];};
try{
 let result;
 if(command==='compare')result=compareCaptures(process.cwd(),value('--before'),value('--after'),value('--output'),registry.visual);
 else if(command==='review'){const at=args.indexOf('--inspected');result=reviewReport(process.cwd(),value('--report'),value('--reason'),at<0?[]:args.slice(at+1));}
 else if(command==='check')result=checkReport(process.cwd(),value('--report'));
 else throw new Error('Use compare --before work/... --after work/... --output work/new; review --report path --reason text --inspected file.png ...; check --report path');
 console.log(JSON.stringify(command==='compare'?{status:result.status,directory:result.directory,images:result.images.length,changed:result.images.filter(i=>i.changed).map(i=>i.file),errors:result.errors}:result,null,2));
 if(result.status==='blocked'||result.status==='review-required')process.exitCode=2;
}catch(error){console.error(error.message);process.exitCode=1;}
