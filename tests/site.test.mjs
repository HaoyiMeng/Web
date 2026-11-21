import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const walk=(dir)=>{
 const out=[];
 for(const ent of readdirSync(dir,{withFileTypes:true})){
  if(ent.name==='.git'||ent.name==='node_modules')continue;
  const name=join(dir,ent.name);
  if(ent.isDirectory())out.push(...walk(name));
  else out.push(name);
 }
 return out;
};
const files=walk(root).filter(f=>f.endsWith('.html'));
assert.ok(files.length>=7,'Expected multiple website pages');
let count=0;
for(const file of files) {
 const content=readFileSync(file,'utf8');
 const ids=[...content.matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,'Duplicate element ID in '+file);
 for(const [,link] of content.matchAll(/(?:src|href)=["'](\.[^"']+)["']/g)) {
  const clean=link.split(/[?#]/)[0];
  assert.ok(existsSync(resolve(dirname(file),clean)),'Missing relative asset '+link+' from '+file);
  count++;
 }
}
for(const file of ['index.html','timer.html','metronome.html','music.html','js/focus.mjs','js/metronome.mjs']) {
 assert.ok(existsSync(join(root,file)),file+' must exist');
}
console.log('✓ '+files.length+' pages; '+count+' relative links resolved; no duplicate IDs.');
