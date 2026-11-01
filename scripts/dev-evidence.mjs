import {existsSync,lstatSync,mkdirSync,readFileSync,writeFileSync,copyFileSync,realpathSync} from 'node:fs';
import {resolve,relative,dirname,sep} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
export const hash=data=>createHash('sha256').update(data).digest('hex');
export const json=path=>JSON.parse(readFileSync(path,'utf8'));
export const save=(path,data)=>{mkdirSync(dirname(path),{recursive:true});writeFileSync(path,JSON.stringify(data,null,2)+'\n');};
export function inWork(root,target){
 root=realpathSync(root);const path=resolve(root,target),work=resolve(root,'work');
 if(!path.startsWith(work+sep))throw new Error('Evidence and recovery outputs must be inside ignored work/');
 let current=root;for(const part of relative(root,path).split(sep)){current=resolve(current,part);if(existsSync(current)&&lstatSync(current).isSymbolicLink())throw new Error('Evidence path must not traverse a symlink');}
 return path;
}
export function newDirectory(root,target){const path=inWork(root,target);if(existsSync(path))throw new Error('Output exists; choose a new immutable evidence directory');mkdirSync(path,{recursive:true});return path;}
const git=(root,...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
export const protectedPath=p=>/^(?:data|work|node_modules|dist|\.git|\.vercel)(?:\/|$)/.test(p)||/(?:^|\/)\.env(?:\.|$)/.test(p)&&!p.endsWith('.env.example');
export const runtimePath=p=>/^(src|public|server|api|shared|deployment)\//.test(p)||/^(index\.html|vite\.config\.ts|tsconfig\.json|vercel\.json)$/.test(p);
export const runtimeHash=files=>hash(JSON.stringify(files.filter(f=>runtimePath(f.path)).map(f=>[f.path,f.sha256]).sort((a,b)=>a[0].localeCompare(b[0]))));
export function createCheckpoint(root,target,label='checkpoint'){
 const out=newDirectory(root,target),files=[],deleted=[];
 const tracked=[...new Set([...execFileSync('git',['ls-files','-z','--cached'],{cwd:root,encoding:'utf8'}).split('\0'),...execFileSync('git',['ls-tree','-r','--name-only','-z','HEAD'],{cwd:root,encoding:'utf8'}).split('\0')].filter(Boolean))],others=execFileSync('git',['ls-files','-z','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
 for(const path of new Set([...tracked,...others])){
  if(protectedPath(path))continue;
  const source=resolve(root,path);if(!existsSync(source)){if(tracked.includes(path))deleted.push(path);continue;}
  if(lstatSync(source).isSymbolicLink())throw new Error('Checkpoint refuses symlink source: '+path);
  const dest=resolve(out,'source',path);mkdirSync(dirname(dest),{recursive:true});copyFileSync(source,dest);files.push({path,sha256:hash(readFileSync(source))});
 }
 const metadata={version:1,label,createdAt:new Date().toISOString(),head:git(root,'rev-parse','HEAD'),branch:git(root,'branch','--show-current'),status:git(root,'status','--porcelain=v1'),files,deleted,runtimeSha:runtimeHash(files),excluded:['data/','work/','.env*','.vercel/','node_modules/','dist/']};
 const paths=[...files.map(f=>f.path),...deleted];
 save(resolve(out,'checkpoint.json'),metadata);writeFileSync(resolve(out,'working.patch'),paths.length?execFileSync('git',['diff','HEAD','--binary','--',...paths],{cwd:root}):'');
 return {directory:out,...metadata};
}
export function verifyCheckpoint(root,directory){
 const path=inWork(root,directory),metadata=json(resolve(path,'checkpoint.json'));
 if(metadata.version!==1||!/^[0-9a-f]{40}$/.test(metadata.head))throw new Error('Invalid checkpoint');
 for(const entry of metadata.files){
  if(protectedPath(entry.path)||relative(resolve(root),resolve(root,entry.path)).startsWith('..')||entry.path.split('/').some(p=>p==='..'||p==='')||/^[/\\]|^[a-z]:/i.test(entry.path))throw new Error('Invalid snapshot source path');
  if(hash(readFileSync(resolve(path,'source',entry.path)))!==entry.sha256)throw new Error('Checkpoint content changed: '+entry.path);
 }
 return metadata;
}
export function restoreCheckpoint(root,directory,target){
 const checkpoint=inWork(root,directory),metadata=verifyCheckpoint(root,checkpoint),out=inWork(root,target);
 if(existsSync(out))throw new Error('Recovery worktree already exists');
 execFileSync('git',['-c','core.hooksPath=/dev/null','worktree','add','--detach',out,metadata.head],{cwd:root,stdio:'pipe'});
 for(const entry of metadata.files){const dest=resolve(out,entry.path);mkdirSync(dirname(dest),{recursive:true});copyFileSync(resolve(checkpoint,'source',entry.path),dest);}
 // Deletions are reproduced only in the new detached worktree, never here.
 for(const path of metadata.deleted){if(protectedPath(path)||path.split('/').includes('..')||relative(out,resolve(out,path)).startsWith('..')||/^[/\\]|^[a-z]:/i.test(path))throw new Error('Invalid deletion path');execFileSync('git',['rm','--ignore-unmatch','--',path],{cwd:out,stdio:'pipe'});}
 return {directory:out,head:metadata.head,files:metadata.files.length,isolated:true};
}
export const evidenceId=()=>new Date().toISOString().replace(/[^0-9TZ]/g,'')+'-'+randomUUID().slice(0,8);
