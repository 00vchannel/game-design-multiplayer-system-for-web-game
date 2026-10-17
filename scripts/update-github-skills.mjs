import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
export const configurations={
  "multiplayer": {
    "repository": "00vchannel/game-design-multiplayer-system-for-web-game",
    "skillName": "game-design-multiplayer-system-for-web-game-00vchannel",
    "recordPrefix": "multiplayer-00vchannel",
    "key": "multiplayer",
    "manifestKey": "multiplayer",
    "aliases": [
      "game-design-multiplayer-system-for-web-game"
    ],
    "requiredPaths": [
      "SKILL.md",
      "assets/starter/package.json",
      "references/integration.md",
      "references/troubleshooting.md",
      "references/verification.md",
      "references/deployment.md"
    ],
    "knownLegacyVariants": {"SKILL.md": ["a605c6136cde06c5a0f12c5405c6772a7ad5f6afc51375ba92c9cd17eb6f0c5d"], "assets/starter/AGENTS.md": ["5d9fe32f405a70a264cb19dcc38bf7236b3a6af59aabe1a7eb89a8e9b9d33d83"]},
    "knownLegacyFiles": {
      "assets/starter/shared/protocol.js": "424b4a30aa9ea955c1ca43040f4adbc6105127903b9b540f97f1b2da73127817",
      "assets/starter/src/net/room-client.js": "3272044f8d3c8cf08d7a43b8dbadf0236413123a5700c39d81a726c80a6c7e50",
      "assets/starter/src/net/host.worker.js": "d11ef6651b52f14641076bf2999d7f554f50af9d654da3d838445c9a3fc4f04c",
      "assets/starter/src/net/multiplayer.js": "32fb9d1a9add8ecbdfe2de5a4e4f1ec6aa0652959e90226d75d95063111ee293",
      "assets/starter/src/game/adapter.js": "af856b146f74e183d05fd5a8f9f260620bfaf218718e4f4e94bb1f32f14fe872",
      "assets/starter/src/style.css": "c517c144adaea9302a13210705f75842992ec9d30777893bfcaffdb3340309b1",
      "assets/starter/src/main.js": "3d50a60e6c8f7ed0ed259acec68181fb22c010930db0a6688eb61c7206ebe9a8",
      "assets/starter/worker/index.js": "271c34a33be682c779cf627a417115f770284914b163f4f2e49f0248dbe6c5e0",
      "assets/starter/tests/adapter.test.js": "96ea5eab802784732b6052b89627f005ad7a5054d6190752b11559ff6079e4ae",
      "assets/starter/index.html": "31849fe0e9a45432c48eb0043905fd376651218cda2d8fcb4066f0439ab0549d",
      "assets/starter/vite.config.js": "272aff73a0ab22091d6fa26fc979f594c6247c028458c8d09b0f5d8229d10fab",
      "assets/starter/wrangler.jsonc": "bafb1929b3c4e4c4d6d45a5be2364486ebad6af1dac98dafd6f03fbaa670811a",
      "assets/starter/.gitignore": "e20e7e1e0e72a316235f7b164541fc7523245464a93e9d948f7c5654b546dbb3",
      "assets/starter/package.json": "72e755f8ec3ff94561c5992bedef7ce8e80c595cf99ce7b33ac222a5ccd1abb2",
      "assets/starter/package-lock.json": "f48eecadeff1e141cf1277d728abafa87ec23147fe679ec43f9273c7b7882a56",
      "assets/starter/README.md": "601b987c2e7b4672aaf94724990b34409c5de2737d8f26022621e796bea2ba6d",
      "assets/starter/AGENTS.md": "28925a89ce81f4916beb43022ffb9a384b03218172354d9e40ee8cdb492dc89c",
      "references/integration.md": "9bc6dac6fb4828bbb97b90ec093d7783a3a78b252813873f9d0db250f7a33404",
      "references/troubleshooting.md": "ec1ab511a720330fa44cb65ace292d27ca0c5de8beb0a93870d42cd81963cfd7",
      "references/verification.md": "240f64932a8b3726499a57c66afeed37e6e7d4c25f3e864abe34a2cc08c45160",
      "references/deployment.md": "0ea1af53e814919887981543309152888ce19883d3c6f6456ba01c7adc528b76",
      "agents/openai.yaml": "20abfb16ca154bba9f4607de2d4942f41e7773e986781074f43f9366f5124c05",
      "SKILL.md": "756d04be6dcf0da1ee67704292a5f29ea5a57913c8fd1c8dbd560454bc81b36c"
    }
  },
  "brainstorm": {
    "repository": "00vchannel/gameplay-brainstorm-00vchannel",
    "skillName": "gameplay-brainstorm-00vchannel",
    "recordPrefix": "brainstorm",
    "key": "brainstorm",
    "manifestKey": "skill",
    "aliases": [],
    "requiredPaths": [
      "SKILL.md"
    ],
    "knownLegacyFiles": {
      "SKILL.md": "7378c799fae9d88ee3e401a39a6dd93943e2a32dfbb9cd50a2e62e7ea71df663",
      "agents/openai.yaml": "340f31d32187bc527fb1db9da2a691570930bf7ac213a3ca8ceaf13f7e7440d4",
      "references/gameplay-evidence.md": "5e19405df66d60cab3cb90890a56d478f6a2e4fb3653ca0331dbc46289c04118"
    }
  }
};
export function createSkillUpdater(config){
const {repository,skillName,recordPrefix,key,manifestKey,aliases,requiredPaths,knownLegacyFiles,knownLegacyVariants={}}=config;
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
async function fetchSnapshot(workDir){
 const statePath=path.join(workDir,'.'+recordPrefix+'-update.json');await plain(statePath);
 const previous=await exists(statePath)?await json(statePath):null;
 let commit=previous?.status==='pending'&&previous.repository===repository?previous.commit:null;
 if(!commit)commit=(await api('commits/main')).sha;
 if(!/^[a-f0-9]{40}$/.test(commit))throw Error('GitHub 版本不合法');
 await atomic(statePath,{repository,commit,status:'pending',checkedAt:new Date().toISOString()});
 const tree=await api('git/trees/'+commit+'?recursive=1');if(tree.truncated)throw Error('GitHub 檔案清單不完整');
 const prefix='skills/'+skillName+'/';const entries=tree.tree.filter(x=>x.path.startsWith(prefix)&&x.type!=='tree');
 if(!entries.length||entries.length>1000)throw Error('Skill 檔案數量不合法');
 const source=path.join(workDir,'.'+recordPrefix+'-downloads',commit);await plain(source);
 let size=0;const names=new Set();
 for(const e of entries){const rel=e.path.slice(prefix.length);within(source,rel);if(e.type!=='blob'||!['100644','100755'].includes(e.mode)||!Number.isInteger(e.size)||e.size<0||e.size>2*1024*1024||! /^[a-f0-9]{40}$/.test(e.sha)||names.has(rel.toLowerCase()))throw Error('Skill 含不支援檔案');size+=e.size;names.add(rel.toLowerCase());}
 if(size>20*1024*1024||requiredPaths.some(p=>!names.has(p.toLowerCase())))throw Error('Skill 不完整或過大');
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
async function installSnapshot(snapshot,{skillsDir,legacyFiles={},afterRename}={}){
 skillsDir=path.resolve(skillsDir);const parent=path.dirname(skillsDir),target=path.join(skillsDir,skillName);
 await plain(skillsDir);await plain(target);await fs.mkdir(skillsDir,{recursive:true});
 const lockPath=path.join(parent,'.deep-frame-'+key+'.lock');await plain(lockPath);
 let lock;try{lock=await fs.open(lockPath,'wx');}catch(e){if(e.code!=='EEXIST')throw e;const saved=await json(lockPath);if(!Number.isInteger(saved.pid)||saved.pid<=0)throw Error('更新鎖需人工檢查');try{process.kill(saved.pid,0);throw Error('已有更新程序執行中');}catch(error){if(error.code!=='ESRCH')throw error;}await fs.unlink(lockPath);lock=await fs.open(lockPath,'wx');}
 await lock.writeFile(JSON.stringify({pid:process.pid,target}));
 const journalPath=path.join(parent,'.deep-frame-'+key+'-journal.json');
 try{
  await plain(journalPath);
  // Restore the previous complete directory if a process stopped between renames.
  if(await exists(journalPath)){const j=await json(journalPath);const backupRoot=path.join(parent,'skill-backups');const previousTarget=j.previousTarget||j.target;const allowedTargets=[target,...aliases.map(a=>path.join(skillsDir,a))];if(!allowedTargets.includes(j.target)||!allowedTargets.includes(previousTarget)||typeof j.backup!=='string'||path.dirname(j.backup)!==backupRoot||![skillName,...aliases].some(name=>path.basename(j.backup).startsWith(name+'-')))throw Error('更新恢復紀錄不合法');await plain(j.backup);if(!await exists(j.target)){if(!await exists(j.backup))throw Error('更新中斷且備份不存在；保留現場');if(await exists(previousTarget))throw Error('恢復位置已存在；保留備份');await moveDirectory(j.backup,previousTarget);}await fs.unlink(journalPath);}
  const aliasTargets=[];for(const alias of aliases){const p=path.join(skillsDir,alias);await plain(p);if(await exists(p))aliasTargets.push(p);}
  if(aliasTargets.length>1||(await exists(target)&&aliasTargets.length))throw Error('新舊 Skill 目錄同時存在；保留內容，請先合併或停用舊版');
  const previousTarget=aliasTargets[0]||target;
  const current=await inventory(previousTarget);const stateFile=path.join(previousTarget,marker);await plain(stateFile);
  const saved=await exists(stateFile)?await json(stateFile):null;
  if(saved&&(saved.repository!==repository||saved.schema!==1||!saved.files||typeof saved.files!=='object'))throw Error('Skill 安裝紀錄不合法');
  const baseline=saved?.files||(Object.keys(legacyFiles).length?legacyFiles:knownLegacyFiles);
  const conflict=Object.keys(current).filter(name=>baseline[name]!==current[name]&&snapshot.files[name]!==current[name]&&!(!saved&&previousTarget!==target&&knownLegacyVariants[name]?.includes(current[name])));
  if(conflict.length)throw Error('保留學員修改，未更新 Skill：'+conflict.join('、'));
  const actual=await inventory(snapshot.source);const keys=Object.keys(snapshot.files).sort();
  if(JSON.stringify(Object.keys(actual).sort())!==JSON.stringify(keys)||keys.some(n=>actual[n]!==snapshot.files[n]))throw Error('待安裝 Skill 校驗失敗');
  if(previousTarget===target&&saved?.commit===snapshot.commit&&JSON.stringify(Object.keys(current).sort())===JSON.stringify(keys)&&keys.every(n=>current[n]===snapshot.files[n]))return {status:'unchanged',commit:snapshot.commit,target};
  const id=randomUUID(),stage=path.join(parent,'skill-updates',skillName+'-'+id),backup=path.join(parent,'skill-backups',skillName+'-'+id);
  await plain(stage);await plain(backup);await fs.mkdir(stage,{recursive:true});
  for(const name of keys){const dest=within(stage,name);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(within(snapshot.source,name),dest,fs.constants.COPYFILE_EXCL);}
  await atomic(path.join(stage,marker),{schema:1,repository,commit:snapshot.commit,files:snapshot.files,installedAt:new Date().toISOString()});
  // Recheck immediately before moving: never replace edits made while downloading/copying.
  if(JSON.stringify(await inventory(previousTarget))!==JSON.stringify(current))throw Error('安裝期間檔案已改動；保留目前 Skill');
  const hadTarget=await exists(previousTarget);
  if(hadTarget){await fs.mkdir(path.dirname(backup),{recursive:true});await atomic(journalPath,{target,previousTarget,backup});await moveDirectory(previousTarget,backup);}
  try{if(afterRename)await afterRename();await moveDirectory(stage,target);}catch(e){if(hadTarget&&!await exists(target))await moveDirectory(backup,previousTarget);throw e;}
  if(hadTarget)await fs.unlink(journalPath);
  return {status:'updated',commit:snapshot.commit,target,backup:hadTarget?backup:null,requiresZCodeRefresh:true};
 }finally{await lock.close();await fs.unlink(lockPath);}
}
async function run(opts={}){
 const workDir=path.resolve(opts['--work-dir']||process.cwd());await plain(workDir);
 const legacyPath=opts['--legacy-manifest'];const legacyManifest=legacyPath?(await json(legacyPath))[manifestKey]:null;
 const legacyFiles=legacyManifest?(legacyManifest.legacyFiles||legacyManifest.files):{};
 const snapshot=await fetchSnapshot(workDir);
 const result=await installSnapshot(snapshot,{skillsDir:opts['--skills-dir']||path.join(os.homedir(),'.zcode','skills'),legacyFiles});
 await atomic(snapshot.statePath,{repository,commit:snapshot.commit,status:'complete',result,checkedAt:new Date().toISOString()});
 return result;
}
return {repository,skillName,fetchSnapshot,installSnapshot,run};
}
async function main(){
 const args=process.argv.slice(2),opts={};for(let i=0;i<args.length;i+=2){if(!['--skill','--skills-dir','--work-dir','--legacy-manifest'].includes(args[i])||!args[i+1])throw Error('不支援的參數');opts[args[i]]=args[i+1];}
 const selected=opts['--skill']||'multiplayer';const keys=selected==='all'?['brainstorm','multiplayer']:[selected];const results={};let failed=false;
 for(const key of keys){if(!Object.hasOwn(configurations,key))throw Error('未知 Skill');try{results[key]=await createSkillUpdater(configurations[key]).run(opts);}catch(e){failed=true;results[key]={status:'blocked',message:e.message};}}
 console.log(JSON.stringify(results,null,2));if(failed)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=1;});
