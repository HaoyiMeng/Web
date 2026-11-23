import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// DOM-boundary interaction checks, not browser layout assertions.
const nodes=new Map(),tools=[],regimes=[];
let frame,resizeCallback,canvasWidth=900,canvasHeight=550,drawCalls=0;
const context=new Proxy({}, {get:(o,k)=>k in o?o[k]:k==='createImageData'?(w,h)=>({data:new Uint8ClampedArray(w*h*4)}):()=>{drawCalls++;}});
class Element {
  constructor(){this.children=[];this.dataset={};this.attrs={};this.listeners={};this.style={};this.hidden=false;this.checked=false;this.classList={toggle(){}};this._value='';}
  set value(v){this._value=String(v);}get value(){return this._value;}
  get selectedOptions(){return [{textContent:this.value}];}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k];}
  addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}
  fire(k,event={}){for(const fn of this.listeners[k]||[])fn({preventDefault(){},target:this,...event});}
  append(e){this.children.push(e);}replaceChildren(){this.children=[];}
  getContext(){return context;}
  getBoundingClientRect(){return {width:canvasWidth,height:canvasHeight,left:0,top:0};}
  focus(){document.activeElement=this;}setPointerCapture(){}
}
const html=readFileSync(new URL('../potential-flow.html',import.meta.url),'utf8');
for(const m of html.matchAll(/<\w+\b[^>]*\bid="([^"]+)"[^>]*>/g)){
  const e=new Element();e.id=m[1];e.type=m[0].match(/type="([^"]+)"/)?.[1];e.value=m[0].match(/value="([^"]*)"/)?.[1]||'';
  e.hidden=/\shidden[\s>]/.test(m[0]);e.checked=/\schecked[\s>]/.test(m[0]);nodes.set(e.id,e);
}
for(const m of html.matchAll(/data-(tool|regime)="([^"]+)"/g)){
  const e=new Element();e.dataset[m[1]]=m[2];(m[1]==='tool'?tools:regimes).push(e);
}
const $=id=>{assert.ok(nodes.has(id),'Missing HTML control: '+id);return nodes.get(id);};
globalThis.document={getElementById:$,createElement:()=>new Element(),hidden:false,activeElement:null,
  querySelectorAll:s=>s==='[data-tool]'?tools:s==='[data-regime]'?regimes:[],addEventListener(){}};
globalThis.window={addEventListener(){}};
globalThis.location={search:'?scene=cylinder'};
globalThis.matchMedia=()=>({matches:true});globalThis.devicePixelRatio=1;
globalThis.requestAnimationFrame=fn=>{frame=fn;return 1;};globalThis.cancelAnimationFrame=()=>{};
globalThis.ResizeObserver=class{constructor(fn){resizeCallback=fn;}observe(){}};
await import('../js/potential-flow-ui.mjs');
const input=(id,value)=>{$(id).focus();$(id).value=value;$(id).fire('input');document.activeElement=null;};
const clickRegime=value=>regimes.find(b=>b.dataset.regime===String(value)).fire('click');
const render=()=>{drawCalls=0;frame(100);assert.ok(drawCalls>100);};
assert.equal($('preset').value,'cylinder');assert.equal($('cylinder-panel').hidden,false);
assert.equal($('uniform-speed').value,'1');assert.equal($('uniform-angle').value,'180');
assert.equal($('show-potentials').checked,false);assert.equal($('show-particles').checked,false);
assert.match($('cylinder-stagnation').textContent,/两个驻点/);render();
clickRegime(1);assert.match($('cylinder-stagnation').textContent,/合并/);render();
clickRegime(1.5);assert.match($('cylinder-stagnation').textContent,/离开/);render();
input('cylinder-ratio',-1.5);assert.equal($('cylinder-range').value,'-1.5');
assert.match($('cylinder-position').textContent,/2.62/);
clickRegime(1);assert.equal($('cylinder-ratio').value,'-1');
input('cylinder-radius',2);assert.match($('cylinder-position').textContent,/2.00/);
input('cylinder-ratio',0);assert.match($('cylinder-stagnation').textContent,/两个驻点/);
assert.match($('cylinder-values').textContent,/Γ = 0.000/);render();
$('show-potentials').checked=true;$('show-potentials').fire('change');
for(const name of ['none','phi','psi','speed']){$('background').value=name;$('background').fire('change');render();}
// Grouped direction, position and speed preserve the cylinder.
input('uniform-angle',35);assert.equal($('cylinder-panel').hidden,false);assert.equal($('element-angle').value,'-145');
input('element-angle',60);assert.equal($('uniform-angle').value,'-120');assert.equal($('cylinder-panel').hidden,false);
input('element-x',2);input('element-y',-1);assert.equal($('cylinder-panel').hidden,false);
input('uniform-speed',0);assert.equal($('uniform-speed').value,'0.01');assert.equal($('cylinder-panel').hidden,false);
assert.equal($('cylinder-radius').value,'2');
$('reset').fire('click');$('split-cylinder').fire('click');assert.equal($('cylinder-panel').hidden,true);
input('element-angle',45);input('element-x',2);$('merge-cylinder').fire('click');assert.equal($('cylinder-panel').hidden,false);
$('reset').fire('click');$('split-cylinder').fire('click');
// Independent components can change geometry after explicit split.
$('element-list').children[1].fire('click');input('strength-number',8);input('element-x',.5);
assert.equal($('cylinder-panel').hidden,true);render();
input('element-x',0);assert.equal($('cylinder-panel').hidden,true);$('merge-cylinder').fire('click');assert.equal($('cylinder-panel').hidden,false);$('split-cylinder').fire('click');
input('uniform-speed',0);assert.equal($('cylinder-panel').hidden,true);render();
$('reset').fire('click');assert.equal($('cylinder-panel').hidden,false);
// Mobile-sized canvas and every existing preset still execute all rendering paths.
canvasWidth=366;canvasHeight=450;resizeCallback();render();
for(const name of ['default','empty','uniform','source','vortex','pair','doublet','spiral']){
  $('preset').value=name;$('preset').fire('change');assert.equal($('cylinder-panel').hidden,true);render();
}
console.log('PASS cylinder presets, signs, zero circulation, radius, layer controls, free composition, reset and resized canvas');
