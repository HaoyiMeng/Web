import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const nodes=new Map(),presets=[];let pending;
class Element {
  constructor(tag='div'){this.tag=tag;this.children=[];this.attrs={};this.listeners={};this.dataset={};this._value='';this.textContent='';this.checked=false;this.disabled=false;this.classList={toggle:(k,on)=>{const set=new Set((this.attrs.class||'').split(' '));on?set.add(k):set.delete(k);this.attrs.class=[...set].join(' ');}};}
  set value(v){this._value=String(v);}get value(){return this._value;}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k];}
  append(e){this.children.push(e);}replaceChildren(){this.children=[];}
  addEventListener(k,f){(this.listeners[k]??=[]).push(f);}
  fire(k,e={}){for(const f of this.listeners[k]||[])f({target:this,preventDefault(){},...e});}
  focus(){document.activeElement=this;}setPointerCapture(){}
  getBoundingClientRect(){return {left:0,top:0,width:600,height:460};}
}
const html=readFileSync(new URL('../conformal.html',import.meta.url),'utf8');
for(const m of html.matchAll(/<(\w+)\b[^>]*\bid="([^"]+)"[^>]*>/g)){
  const e=new Element(m[1]);e.id=m[2];for(const attr of ['value','min','max'])e[attr]=m[0].match(new RegExp(attr+'="([^"]*)"'))?.[1]||'';
  e.checked=/\schecked[\s>]/.test(m[0]);e.disabled=/\sdisabled[\s>]/.test(m[0]);nodes.set(e.id,e);
}
for(const m of html.matchAll(/data-preset="([^"]+)"/g)){const e=new Element('button');e.dataset.preset=m[1];presets.push(e);}
const $=id=>{assert.ok(nodes.has(id),'Missing control '+id);return nodes.get(id);};
globalThis.document={getElementById:$,createElementNS:(_,tag)=>new Element(tag),querySelectorAll:s=>s==='[data-preset]'?presets:[],activeElement:null};
globalThis.requestAnimationFrame=fn=>{pending=fn;return 1;};
const flush=()=>{if(pending){const f=pending;pending=null;f();}document.activeElement=null;};
await import('../js/conformal-ui.mjs');
function valid(){for(const id of ['circle-view','foil-view']){assert.ok($(id).children.length>40);for(const e of $(id).children)assert.doesNotMatch(Object.values(e.attrs).join(' '),/NaN|Infinity|undefined/);}}
const input=(id,value)=>{$(id).focus();$(id).value=value;$(id).fire('input');flush();};
const click=id=>{$(id).fire('click');flush();};
const preset=name=>{presets.find(e=>e.dataset.preset===name).fire('click');flush();};
valid();assert.equal($('gamma').disabled,true);assert.ok(Number($('lift').textContent)>0);
// Optional SVG snapshots use the actual UI-generated nodes, without claiming browser layout QA.
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const xml=e=>`<${e.tag} ${Object.entries(e.attrs).map(([k,v])=>`${k}="${esc(v)}"`).join(' ')}>${esc(e.textContent)}${e.children.map(xml).join('')}</${e.tag}>`;
function snapshot(name){if(!process.env.CONFORMAL_SNAPSHOT_DIR)return;const panels=['circle-view','foil-view'].map((id,i)=>`<text x="${600*i+20}" y="24" fill="#e7f0f3" font-size="18">${i?'Mapped airfoil':'Generating circle'}</text><svg x="${600*i}" y="35" width="600" height="460" viewBox="0 0 600 460">${$(id).children.map(xml).join('')}</svg>`).join('');writeFileSync(process.env.CONFORMAL_SNAPSHOT_DIR+'/'+name+'.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="510"><style>.flow-path{fill:none;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}</style><rect width="1200" height="510" fill="#0d1721"/>${panels}</svg>`);}
snapshot('default');
click('demo-zero');assert.equal($('lift').textContent,'0.000');assert.equal($('gamma').disabled,false);assert.match($('kutta-status').textContent,/发散/);snapshot('flat-zero');
click('demo-kutta');assert.ok(Math.abs(Number($('lift').textContent)-.65677)<.001);assert.equal($('gamma').disabled,true);snapshot('flat-kutta');
$('potentials').checked=true;$('potentials').fire('change');flush();assert.ok($('foil-view').children.filter(e=>e.attrs.stroke==='#b5a1f3').length>4);valid();snapshot('potentials');
for(const name of ['arc','symmetric','cambered']){preset(name);assert.equal(presets.find(e=>e.dataset.preset===name).attrs['aria-pressed'],'true');valid();}
input('alpha-number',-12);assert.ok(Number($('lift').textContent)<0);assert.equal($('alpha').value,'-12');
$('kutta').checked=false;$('kutta').fire('change');flush();input('gamma-number',18);assert.equal($('gamma').value,'18.000');assert.match($('kutta-status').textContent,/发散/);
input('cx-number',-.35);input('cy-number',-.3);assert.equal($('radius').textContent,'1.383');valid();snapshot('extreme');
input('alpha-number',999);assert.equal($('alpha').value,'20');input('alpha-number','');assert.equal($('alpha').value,'20');
click('reset');assert.equal($('potentials').checked,false);assert.equal($('cx-number').value,'-0.14');
let before=$('probe-z').textContent;$('circle-view').fire('keydown',{key:'ArrowUp'});flush();assert.notEqual($('probe-z').textContent,before);
before=$('probe-z').textContent;$('foil-view').fire('pointerdown',{button:0,pointerId:1,clientX:430,clientY:140});flush();$('foil-view').fire('pointerup');assert.notEqual($('probe-z').textContent,before);
$('circle-view').fire('pointerdown',{button:0,pointerId:2,clientX:300-.14*600/10.8,clientY:230-.16*600/10.8});
$('circle-view').fire('pointermove',{clientX:285,clientY:235});flush();$('circle-view').fire('pointerup');assert.ok(Number($('cx-number').value)<-.14);valid();
console.log('PASS conformal UI: both SVG planes, presets, Kutta/manual controls, equipotentials, clamping, reset, linked pointer and keyboard probes, center drag, finite drawing coordinates');
