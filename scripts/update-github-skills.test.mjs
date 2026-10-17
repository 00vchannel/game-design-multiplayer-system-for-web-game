import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {configurations,createSkillUpdater} from './update-github-skills.mjs';
const config=configurations.multiplayer;
const hash=b=>createHash('sha256').update(b).digest('hex');
async function temporary(t){
 const base=path.resolve(os.tmpdir());
 const dir=await fs.mkdtemp(path.join(base,'skill-update-test-'));
 t.after(async()=>{assert.equal(path.dirname(dir),base);assert.ok(path.basename(dir).startsWith('skill-update-test-'));await fs.rm(dir,{recursive:true,force:true});});
 return dir;
}
async function fixture(t,kind){
 const root=await temporary(t),skillsDir=path.join(root,'skills'),source=path.join(root,'source');
 const alias=path.join(skillsDir,kind==='primary'?config.skillName:config.aliases[0]);
 await fs.mkdir(alias,{recursive:true});await fs.mkdir(source);
 const old='original known legacy instructions';
 const generic=(await fs.readFile(new URL('../skills/'+config.aliases[0]+'/SKILL.md',import.meta.url),'utf8')).replaceAll('\r\n','\n');
 assert.ok(config.knownLegacyVariants['SKILL.md'].includes(hash(generic)));
 const current=kind==='old'?old:kind==='edited'?'user edits':generic;
 await fs.writeFile(path.join(alias,'SKILL.md'),current);
 await fs.writeFile(path.join(source,'SKILL.md'),'current standalone instructions');
 const snapshot={repository:config.repository,commit:'a'.repeat(40),source,files:{'SKILL.md':hash('current standalone instructions')}};
 if(kind==='managed')await fs.writeFile(path.join(alias,'.deep-frame-install.json'),JSON.stringify({schema:1,repository:config.repository,files:{'SKILL.md':hash(old)}}));
 return {skillsDir,alias,current,snapshot,updater:createSkillUpdater({...config,knownLegacyFiles:{'SKILL.md':hash(old)}})};
}
for(const kind of ['old','generic'])test('migrates '+kind+' legacy alias and preserves backup',async t=>{
 const f=await fixture(t,kind);const result=await f.updater.installSnapshot(f.snapshot,{skillsDir:f.skillsDir});
 assert.equal(result.status,'updated');
 assert.equal(await fs.readFile(path.join(result.target,'SKILL.md'),'utf8'),'current standalone instructions');
 assert.equal(await fs.readFile(path.join(result.backup,'SKILL.md'),'utf8'),f.current);
 const again=await f.updater.installSnapshot(f.snapshot,{skillsDir:f.skillsDir});assert.equal(again.status,'unchanged');
});
for(const kind of ['edited','managed','primary'])test('preserves '+kind+' contents instead of accepting alias exception',async t=>{
 const f=await fixture(t,kind);
 await assert.rejects(f.updater.installSnapshot(f.snapshot,{skillsDir:f.skillsDir}),/保留學員修改/);
 assert.equal(await fs.readFile(path.join(f.alias,'SKILL.md'),'utf8'),f.current);
});
for(const missing of config.requiredPaths.filter(p=>p.startsWith('references/')))test('rejects missing '+missing+' before downloading',async t=>{
 const root=await temporary(t);const original=globalThis.fetch;let requests=0;
 globalThis.fetch=async input=>{requests++;const url=String(input);
  if(url.endsWith('/commits/main'))return new Response(JSON.stringify({sha:'a'.repeat(40)}));
  if(url.includes('/git/trees/'))return new Response(JSON.stringify({truncated:false,tree:config.requiredPaths.filter(p=>p!==missing).map(p=>({path:'skills/'+config.skillName+'/'+p,type:'blob',mode:'100644',size:1,sha:'b'.repeat(40)}))}));
  throw Error('Unexpected file download');
 };
 try{await assert.rejects(createSkillUpdater(config).fetchSnapshot(root),/Skill 不完整/);assert.equal(requests,2);}finally{globalThis.fetch=original;}
});
