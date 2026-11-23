import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const nodes=new Map();
class E{constructor(){this.value='';this.checked=false;this.children=[];this.attrs={};this.events={};this.textContent='';}setAttribute(k,v){this.attrs[k]=String(v);}append(e){this.children.push(e);}replaceChildren(){this.children=[];}addEventListener(k,f){this.events[k]=f;}fire(k){this.events[k]();}}
const html=readFileSync(new URL('../conformal.html',import.meta.url),'utf8');
for(const m of html.matchAll(/<\w+[^>]*\bid="(p-[^"]+)"[^>]*>/g)){const e=new E();e.value=m[0].match(/value="([^"]*)"/)?.[1]||'';e.checked=/\schecked[\s>]/.test(m[0]);nodes.set(m[1],e);}
const $=id=>{assert.ok(nodes.has(id),id);return nodes.get(id);};
globalThis.document={getElementById:$,createElementNS:()=>new E()};
await import('../js/perturbation-ui.mjs');
const valid=()=>{for(const id of ['p-pressure','p-shape','p-sheets']){assert.ok($(id).children.length>3);for(const e of $(id).children)assert.doesNotMatch(Object.values(e.attrs).join(''),/NaN|Infinity/);}};
valid();for(const id of ['p-incidence','p-bending','p-body']){$(id).checked=false;$(id).fire('change');}assert.equal($('p-cp-upper').textContent,'0.000');assert.equal($('p-cl').textContent,'0.000');
$('p-reset').fire('click');assert.ok(Number($('p-cl').textContent)>0);
for(const x of [.01,.99]){$('p-x').value=x;$('p-x').fire('input');valid();}
$('p-quadratic').checked=false;$('p-quadratic').fire('change');valid();
console.log('PASS perturbation controls: contributions, reset, edge probes, pressure overlay and finite SVG output');
