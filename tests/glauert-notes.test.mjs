import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=relative=>readFileSync(new URL('../'+relative,import.meta.url),'utf8');
const article=read('glauert.html');
const library=read('library.html');
const notes=read('study-notes.html');
const physics=read('physics.html');
const code=read('js/glauert.mjs');
assert.match(library,/href="\.\/study-notes\.html"/,'Study Notes must be a live Library card');
assert.doesNotMatch(library,/PLANNED · 即将探索/);
assert.match(notes,/href="\.\/glauert\.html"/);
assert.doesNotMatch(physics,/href="\.\/glauert\.html"/,'Glauert is reference material, not an experiment tile');
assert.match(article,/href="\.\/study-notes\.html"/);
assert.doesNotMatch(article,/三页笔记|课堂笔记|第一张笔记|笔记写作|LECTURE 15/);
for(const path of ['glauert-singularities.svg','glauert-theta.svg','glauert-boundary.svg']){
  assert.match(article,new RegExp('src="\\.\\/assets\\/'+path.replace('.','\\.')+'"'));
  const svg=read('assets/'+path);
  assert.match(svg,/<svg[^>]+viewBox=/);
  assert.match(svg,/<title[\s>]/);
  assert.match(svg,/<desc[\s>]/);
}
for(const id of ['g-plot','g-camber-plot','g-probe','g-gamma-probe','g-dcp-probe','g-y-probe']){
  assert.match(article,new RegExp('id="'+id+'"'));
  assert.ok(code.includes("'"+id+"'"),'JS must bind '+id);
}
const ids=[...article.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
assert.equal(ids.length,new Set(ids).size,'No duplicate IDs on Glauert page');
for(const target of article.matchAll(/href="#([^"]+)"/g)){
 assert.ok(ids.includes(target[1]),'Missing anchor #'+target[1]);
}
console.log('PASS Study Notes navigation, no lecture references, responsive SVG assets and interactive chart hooks');
