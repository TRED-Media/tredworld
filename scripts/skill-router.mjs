import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export const registry=JSON.parse(readFileSync(new URL('../config/development-skills.json',import.meta.url),'utf8'));
export const fold=text=>String(text).normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/đ/g,'d');
export function routeTask(task,files=[],config=registry){
 const documentationOnly=files.length>0&&files.every(f=>f.endsWith('.md'));
 const text=fold(task),matched=config.skills.filter(s=>s.keywords).map(s=>{
  const terms=s.keywords.filter(k=>new RegExp('(^|[^a-z0-9])'+k+'([^a-z0-9]|$)').test(text));
  const paths=files.filter(f=>s.files.some(p=>p.startsWith('.')?f.endsWith(p):p.endsWith('/')?f.startsWith(p):f===p||f.startsWith(p)));
  return {skill:s,terms,paths,score:terms.length*10+paths.length};
 }).filter(m=>m.score>0).sort((a,b)=>b.score-a.score);
 const primary=matched[0]?.skill.id||config.defaultSkill;
 const byId=new Map(config.skills.map(s=>[s.id,s])),selected=new Set([config.orchestrator,primary]);
 function add(id){if(selected.has(id))return;selected.add(id);for(const support of byId.get(id)?.supports||[])add(support);}
 for(const support of byId.get(primary)?.supports||[])add(support);
 for(const match of matched.slice(1))add(match.skill.id);
 if(/\b(gen|generate|tao|ve|sinh)\b/.test(text)&&/\b(asset|sprite|anh|nhan vat)\b/.test(text))add('game-asset-gen');
 if(primary!==config.orchestrator&&!documentationOnly)add('tred-visual-testing');
 const designCheckpoint=/\b(phaser|spine|doi engine|chuyen engine|migration|migrate|doi protocol|doi persistence|thay database)\b/.test(text);
 return {engine:config.engine,primary,skills:[...selected].map(id=>({id,path:byId.get(id).path})),checks:documentationOnly?['npm run skills:check']:[...new Set([...selected].flatMap(id=>byId.get(id).checks||[]))],reasons:matched.map(m=>({id:m.skill.id,keywords:m.terms,files:m.paths})),needsVisualEvidence:!documentationOnly,requiresDesignCheckpoint:designCheckpoint,deferred:config.deferred,workflow:documentationOnly?['review scoped documentation','check skill integrity']:['checkpoint','capture baseline','implement scoped change','capture candidate','compare + inspect','run selected checks','record evidence'],executesCommands:false};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),at=args.indexOf('--task'),task=at>=0?args[at+1]:args[0]||'';
 const fi=args.indexOf('--files'),files=fi>=0?args.slice(fi+1).filter(x=>!x.startsWith('--')):[];
 console.log(JSON.stringify(routeTask(task,files),null,2));
}
