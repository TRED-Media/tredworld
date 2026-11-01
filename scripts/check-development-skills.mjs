import {readFileSync,existsSync,lstatSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {registry} from './skill-router.mjs';
import {hash,json,save} from './dev-evidence.mjs';
const root=process.cwd(),lockPath=resolve(root,'config/development-skills.lock.json');
const ids=new Set(),files={};
for(const skill of registry.skills){
 assert(!ids.has(skill.id),'Duplicate skill id');ids.add(skill.id);
 assert(skill.path.startsWith('.agents/skills/')&&skill.path.endsWith('/SKILL.md')&&!skill.path.includes('..'),'Skill path escapes reviewed project scope');
 const path=resolve(root,skill.path);assert(existsSync(path)&&!lstatSync(path).isSymbolicLink(),'Missing or symlinked skill');
 const data=readFileSync(path,'utf8');assert(data.startsWith('---\n')&&data.includes('\nname: '+skill.id+'\n'),'Skill metadata does not match registry');
 assert(skill.permissions&&Array.isArray(skill.permissions.network)&&Array.isArray(skill.permissions.credentials),'Declare permissions before enabling a skill');
 files[skill.path]=hash(data);
}
for(const skill of registry.skills)for(const id of skill.supports||[])assert(ids.has(id),'Unknown supporting skill');
for(const path of ['.agents/skills/pixel-art/SKILL.md','scripts/sprite_pipeline.py',...readdirSync(resolve(root,'.agents/skills/pixel-art/scripts')).filter(f=>f.endsWith('.py')).map(f=>'.agents/skills/pixel-art/scripts/'+f)])files[path]=hash(readFileSync(resolve(root,path)));
for(const id of [registry.orchestrator,registry.defaultSkill])assert(ids.has(id),'Missing required router skill');
for(const skill of registry.deferred)assert(!ids.has(skill.id),'An incompatible/deferred skill cannot be active');
for(const source of json(resolve(root,'config/skill-sources.json')).sources){assert(/^[a-f0-9]{64}$/.test(source.sha256),'Unpinned reviewed source');if(source.commit)assert(/^[a-f0-9]{40}$/.test(source.commit),'Invalid source commit');assert(source.decision,'Missing compatibility decision');}
const pkg=json(resolve(root,'package.json')),deps={...pkg.dependencies,...pkg.devDependencies};
assert.equal(registry.engine,'canvas-2d');assert(!deps.phaser&&!Object.keys(deps).some(k=>/spine/.test(k)),'Runtime changed: review engine compatibility and design checkpoint before enabling adapters');
if(process.argv.includes('--record-reviewed')){
 const at=process.argv.indexOf('--reason'),reason=at>=0?process.argv[at+1]:'';assert(reason&&reason.length>=20,'Record the actual source/permission review reason');
 save(lockPath,{version:1,reviewedAt:new Date().toISOString(),reason,files,registrySha:hash(readFileSync(resolve(root,'config/development-skills.json'))),sourcesSha:hash(readFileSync(resolve(root,'config/skill-sources.json')))});
}else{
 const lock=json(lockPath);assert.deepEqual(lock.files,files,'Skill instructions changed: review compatibility and permissions, then record the new lock');
 assert.equal(lock.registrySha,hash(readFileSync(resolve(root,'config/development-skills.json'))),'Routing/permissions changed without a recorded review');
 assert.equal(lock.sourcesSha,hash(readFileSync(resolve(root,'config/skill-sources.json'))),'Source decisions changed without a recorded review');
}
console.log(`PASS ${ids.size} compatible project skills: metadata, routing, permissions and reviewed hashes`);
