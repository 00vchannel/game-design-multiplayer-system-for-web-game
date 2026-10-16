import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
export const repository='00vchannel/game-design-multiplayer-system-for-web-game';
export const skillName='game-design-multiplayer-system-for-web-game';
const marker='.deep-frame-install.json';
const hash=b=>createHash('sha256').update(b).digest('hex');
const blobHash=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const exists=async p=>{try{await fs.lstat(p);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}};
async function plain(p){for(let q=path.resolve(p);;q=path.dirname(q)){try{if((await fs.lstat(q)).isSymbolicLink())throw Error('拒絕連結路徑：'+q);}catch(e){if(e.code!=='ENOENT')throw e;}if(q===path.dirname(q))break;}}
function within(root,rel){if(!rel||rel.includes('\\')||rel.includes(':')||rel.split('/').some(x=>!x||x==='.'||x==='..'||/[. ]$/.test(x)||/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(x)))throw Error('不合法檔案路徑');const p=path.resolve(root,...rel.split('/'));if(!p.startsWith(path.resolve(root)+path.sep))throw Error('路徑超出目錄');return p;}
async function moveDirectory(from,to){
 await plain(from);await plain(to);
 for(let attempt=0;;attempt++){try{await fs.rename(from,to);return;}catch(e){if(!['EPERM','EBUSY'].includes(e.code)||attempt>=4)throw e;if(!await exists(from)||await exists(to))throw e;await delay(200*(attempt+1));}}
}
async function json(p){return JSON.parse((await fs.readFile(p,'utf8')).replace(/^\uFEFF/,''));}
async function atomic(p,data){await plain(p);await fs.mkdir(path.dirname(p),{recursive:true});const temp=p+'.'+randomUUID()+'.partial';await fs.writeFile(temp,JSON.stringify(data,null,2)+'\n',{flag:'wx'});await fs.rename(temp,p);}
async function inventory(root){const files={};if(!await exists(root))return files;async function walk(dir,prefix=''){for(const e of await fs.readdir(dir,{withFileTypes:true})){const rel=prefix+e.name,p=within(root,rel);await plain(p);if(e.isDirectory())await walk(p,rel+'/');else if(e.isFile()){if(rel!==marker)files[rel]=hash(await fs.readFile(p));}else throw Error('不支援的檔案類型：'+rel);}}await walk(root);return files;}
async function bytes(url,max=2*1024*1024){const r=await fetch(url,{redirect:'error',headers:{'User-Agent':'Deep-Frame-Studio-course-setup','Accept':'application/vnd.github+json'},signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('GitHub 下載失敗 '+r.status+'；保留目前版本，稍後重新執行更新');let size=0;const parts=[];for await(const p of r.body){size+=p.length;if(size>max)throw Error('下載超出大小限制');parts.push(p);}return Buffer.concat(parts);}
const api=async suffix=>JSON.parse((await bytes('https://api.github.com/repos/'+repository+'/'+suffix)).toString());
export async function fetchSnapshot(workDir){
 const statePath=path.join(workDir,'.multiplayer-update.json');await plain(statePath);
 const previous=await exists(statePath)?await json(statePath):null;
 let commit=previous?.status==='pending'&&previous.repository===repository?previous.commit:null;
 if(!commit)commit=(await api('commits/main')).sha;
 if(!/^[a-f0-9]{40}$/.test(commit))throw Error('GitHub 版本不合法');
 await atomic(statePath,{repository,commit,status:'pending',checkedAt:new Date().toISOString()});
 const tree=await api('git/trees/'+commit+'?recursive=1');if(tree.truncated)throw Error('GitHub 檔案清單不完整');
 const prefix='skills/'+skillName+'/';const entries=tree.tree.filter(x=>x.path.startsWith(prefix)&&x.type!=='tree');
 if(!entries.length||entries.length>1000)throw Error('Skill 檔案數量不合法');
 const source=path.join(workDir,'.multiplayer-downloads',commit);await plain(source);
 let size=0;const names=new Set();
 for(const e of entries){const rel=e.path.slice(prefix.length);within(source,rel);if(e.type!=='blob'||!['100644','100755'].includes(e.mode)||!Number.isInteger(e.size)||e.size<0||e.size>2*1024*1024||! /^[a-f0-9]{40}$/.test(e.sha)||names.has(rel.toLowerCase()))throw Error('Skill 含不支援檔案');size+=e.size;names.add(rel.toLowerCase());}
 if(size>20*1024*1024||!names.has('skill.md')||!names.has('assets/starter/package.json'))throw Error('Skill 不完整或過大');
 const expected={};
 // One fixed commit per operation; cache verified blobs for interrupted downloads.
 for(let i=0;i<entries.length;i+=4)await Promise.all(entries.slice(i,i+4).map(async e=>{
  const rel=e.path.slice(prefix.length),dest=within(source,rel);await plain(dest);let body;
  if(await exists(dest)){body=await fs.readFile(dest);if(blobHash(body)!==e.sha)throw Error('下載暫存已修改：'+dest);}
  else{body=await bytes('https://raw.githubusercontent.com/'+repository+'/'+commit+'/'+e.path.split('/').map(encodeURIComponent).join('/'));if(body.length!==e.size||blobHash(body)!==e.sha)throw Error('GitHub 檔案校驗失敗：'+rel);await fs.mkdir(path.dirname(dest),{recursive:true});const temp=path.join(path.dirname(source),commit+'-'+randomUUID()+'.partial');await fs.writeFile(temp,body,{flag:'wx'});await fs.rename(temp,dest);}
  expected[rel]=hash(body);
 }));
 const actual=await inventory(source);if(JSON.stringify(Object.keys(actual).sort())!==JSON.stringify(Object.keys(expected).sort()))throw Error('下載目錄有額外檔案');
 return {repository,commit,source,files:expected,statePath};
}
export async function installSnapshot(snapshot,{skillsDir,legacyFiles={},afterRename}={}){
 skillsDir=path.resolve(skillsDir);const parent=path.dirname(skillsDir),target=path.join(skillsDir,skillName);
 await plain(skillsDir);await plain(target);await fs.mkdir(skillsDir,{recursive:true});
 const lockPath=path.join(parent,'.deep-frame-multiplayer.lock');await plain(lockPath);
 let lock;try{lock=await fs.open(lockPath,'wx');}catch(e){if(e.code!=='EEXIST')throw e;const saved=await json(lockPath);if(!Number.isInteger(saved.pid)||saved.pid<=0)throw Error('更新鎖需人工檢查');try{process.kill(saved.pid,0);throw Error('已有更新程序執行中');}catch(error){if(error.code!=='ESRCH')throw error;}await fs.unlink(lockPath);lock=await fs.open(lockPath,'wx');}
 await lock.writeFile(JSON.stringify({pid:process.pid,target}));
 const journalPath=path.join(parent,'.deep-frame-multiplayer-journal.json');
 try{
  await plain(journalPath);
  // Restore the previous complete directory if a process stopped between renames.
  if(await exists(journalPath)){const j=await json(journalPath);const backupRoot=path.join(parent,'skill-backups');if(j.target!==target||typeof j.backup!=='string'||path.dirname(j.backup)!==backupRoot||!path.basename(j.backup).startsWith(skillName+'-'))throw Error('更新恢復紀錄不合法');await plain(j.backup);if(!await exists(target)){if(!await exists(j.backup))throw Error('更新中斷且備份不存在；保留現場');await moveDirectory(j.backup,target);}await fs.unlink(journalPath);}
  const current=await inventory(target);const stateFile=path.join(target,marker);await plain(stateFile);
  const saved=await exists(stateFile)?await json(stateFile):null;
  if(saved&&(saved.repository!==repository||saved.schema!==1||!saved.files||typeof saved.files!=='object'))throw Error('Skill 安裝紀錄不合法');
  const baseline=saved?.files||legacyFiles;
  const conflict=Object.keys(current).filter(name=>baseline[name]!==current[name]);
  if(conflict.length)throw Error('保留學員修改，未更新 Skill：'+conflict.join('、'));
  const actual=await inventory(snapshot.source);const keys=Object.keys(snapshot.files).sort();
  if(JSON.stringify(Object.keys(actual).sort())!==JSON.stringify(keys)||keys.some(n=>actual[n]!==snapshot.files[n]))throw Error('待安裝 Skill 校驗失敗');
  if(saved?.commit===snapshot.commit&&JSON.stringify(Object.keys(current).sort())===JSON.stringify(keys)&&keys.every(n=>current[n]===snapshot.files[n]))return {status:'unchanged',commit:snapshot.commit,target};
  const id=randomUUID(),stage=path.join(parent,'skill-updates',skillName+'-'+id),backup=path.join(parent,'skill-backups',skillName+'-'+id);
  await plain(stage);await plain(backup);await fs.mkdir(stage,{recursive:true});
  for(const name of keys){const dest=within(stage,name);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(within(snapshot.source,name),dest,fs.constants.COPYFILE_EXCL);}
  await atomic(path.join(stage,marker),{schema:1,repository,commit:snapshot.commit,files:snapshot.files,installedAt:new Date().toISOString()});
  // Recheck immediately before moving: never replace edits made while downloading/copying.
  if(JSON.stringify(await inventory(target))!==JSON.stringify(current))throw Error('安裝期間檔案已改動；保留目前 Skill');
  const hadTarget=await exists(target);
  if(hadTarget){await fs.mkdir(path.dirname(backup),{recursive:true});await atomic(journalPath,{target,backup});await moveDirectory(target,backup);}
  try{if(afterRename)await afterRename();await moveDirectory(stage,target);}catch(e){if(hadTarget&&!await exists(target))await moveDirectory(backup,target);throw e;}
  if(hadTarget)await fs.unlink(journalPath);
  return {status:'updated',commit:snapshot.commit,target,backup:hadTarget?backup:null,requiresZCodeRefresh:true};
 }finally{await lock.close();await fs.unlink(lockPath);}
}
async function main(){
 const args=process.argv.slice(2);const opts={};for(let i=0;i<args.length;i+=2){if(!['--skills-dir','--work-dir','--legacy-manifest'].includes(args[i])||!args[i+1])throw Error('不支援的參數');opts[args[i]]=args[i+1];}
 const workDir=path.resolve(opts['--work-dir']||process.cwd());await plain(workDir);
 const legacyPath=opts['--legacy-manifest'];const legacyManifest=legacyPath?(await json(legacyPath)).multiplayer:null;
 const legacyFiles=legacyManifest?(legacyManifest.legacyFiles||legacyManifest.files):{};
 const snapshot=await fetchSnapshot(workDir);
 const result=await installSnapshot(snapshot,{skillsDir:opts['--skills-dir']||path.join(os.homedir(),'.zcode','skills'),legacyFiles});
 await atomic(snapshot.statePath,{repository,commit:snapshot.commit,status:'complete',result,checkedAt:new Date().toISOString()});
 console.log(JSON.stringify(result,null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
