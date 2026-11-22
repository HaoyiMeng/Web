import {createModel,PRESETS,mapPoint,derivative,projectOutside} from './conformal.mjs?v=20261122c';
import {layoutCurves,traceCurve} from './potential-flow-lines.mjs?v=20261122b';

const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
const state={...PRESETS.cambered,alpha:6,kutta:true,gamma:0};
const bounds={xmin:-6,xmax:6,ymin:-4.6,ymax:4.6};
const S=600/10.8,screen=p=>({x:300+S*p.x,y:230-S*p.y});
const fmt=(v,n=3)=>Number.isFinite(v)?(Math.abs(v)<.5*10**-n?0:v).toFixed(n):'发散';
const pair=p=>`(${fmt(p.x,2)}, ${fmt(p.y,2)})`;
let model,curves=[],potentials=[],probe={x:.1,y:1.8},frame=0,needsFlow=true;
const views=[$('circle-view'),$('foil-view')];
function node(name,attrs={},text){const e=document.createElementNS(ns,name);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;return e;}
function path(points,mapped=false){return points.map((p,i)=>{const q=screen(mapped?mapPoint(p):p);return `${i?'L':'M'}${q.x.toFixed(2)},${q.y.toFixed(2)}`;}).join('');}
function addPath(svg,points,mapped,color,width=1,opacity=1,dash=''){
  if(points.length<2)return;
  svg.append(node('path',{d:path(points,mapped),class:'flow-path',stroke:color,'stroke-width':width,opacity,'stroke-dasharray':dash}));
}
function label(svg,p,text,color='#96acbb',dx=9,dy=-9){const q=screen(p);svg.append(node('text',{x:q.x+dx,y:q.y+dy,fill:color,'font-size':14,'font-family':'Inter, Segoe UI, sans-serif','paint-order':'stroke',stroke:'#0d1721','stroke-width':3,'stroke-linejoin':'round'},text));}
function dot(svg,p,color,r=4){const q=screen(p);svg.append(node('circle',{cx:q.x,cy:q.y,r,fill:color,stroke:'#0d1721','stroke-width':2}));}
function arrow(svg,p,v,color,length=18){
  const magnitude=Math.hypot(v.x,v.y);if(magnitude<1e-8||!Number.isFinite(magnitude))return;
  const q=screen(p),dx=v.x/magnitude,dy=-v.y/magnitude,x=q.x+length*dx,y=q.y+length*dy;
  svg.append(node('path',{d:`M${q.x},${q.y}L${x},${y}m${-6*dx-3*dy},${-6*dy+3*dx}L${x},${y}l${-6*dx+3*dy},${-6*dy-3*dx}`,stroke:color,fill:'none','stroke-width':1.4}));
}
function scaffold(svg,mapped){
  svg.replaceChildren();
  for(let x=-5;x<=5;x++){
    const a=screen({x,y:-4.14}),b=screen({x,y:4.14});
    svg.append(node('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:x===0?'#2e4656':'#192b38','stroke-width':1}));
    if(x%2===0)label(svg,{x,y:0},String(x),'#76909f',5,17);
  }
  for(let y=-4;y<=4;y++){
    const a=screen({x:-5.4,y}),b=screen({x:5.4,y});
    svg.append(node('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:y===0?'#2e4656':'#192b38','stroke-width':1}));
  }
  label(svg,{x:4.9,y:0},mapped?'ξ / b':'x / b','#96acbb',-20,19);
  label(svg,{x:0,y:3.75},mapped?'η / b':'y / b');
  const radians=model.flowAngle*Math.PI/180;
  arrow(svg,{x:-4.5,y:3.25},{x:Math.cos(radians),y:Math.sin(radians)},'#b6c9d4',45);
  label(svg,{x:-4.5,y:3.25},`U∞ · ${fmt(model.alpha,1)}°`,'#b6c9d4',0,-14);
}
function renderPlane(svg,mapped,highlight){
  scaffold(svg,mapped);
  for(const c of potentials)addPath(svg,c.points,mapped,'#b5a1f3',.9,.5,'5 6');
  for(const c of curves)addPath(svg,c.points,mapped,c.kind==='separatrix'?'#e2bf82':'#69d9cc',c.kind==='separatrix'?1.15:1,.72);
  if(highlight.length)addPath(svg,highlight,mapped,'#f1ce8d',2.3,1);
  const outline=path(model.outline,mapped)+'Z';
  svg.append(node('path',{d:outline,fill:'#172b38',stroke:mapped?'#dcebe6':'#82b5bd','stroke-width':2,'fill-opacity':.98,'stroke-linejoin':'round'}));
  // Draw sparse direction arrows, with mapped velocities rather than scaled circle vectors.
  for(let i=2;i<curves.length;i+=5){
    const points=curves[i].points,p=points[Math.floor(points.length*.57)];if(!p)continue;
    const value=model.at(p);if(!value||value.singular)continue;
    const position=mapped?value.point:p,velocity=mapped?{x:value.u,y:value.v}:{x:value.circle.u,y:value.circle.v};
    arrow(svg,position,velocity,'#69d9cc',12);
  }
  if(!mapped){
    const c=screen(model.center);
    svg.append(node('circle',{cx:c.x,cy:c.y,r:15,fill:'#f1ce8d','fill-opacity':.09,stroke:'#f1ce8d','stroke-width':1,class:'handle'}));
    dot(svg,model.center,'#f1ce8d',4);label(svg,model.center,'C','#f1ce8d',-20,30);
    for(const x of [-1,1]){dot(svg,{x,y:0},'#b5a1f3',4);label(svg,{x,y:0},x===1?'+b · T':'−b','#c9b7fb',x===1?7:-26,-13);}
  }else{
    addPath(svg,[model.leading,{x:2,y:0}],false,'#96acbb',.8,.8,'4 4');
    dot(svg,{x:2,y:0},model.matched?'#69d9cc':'#f1ce8d',4);
    label(svg,{x:2,y:0},'TE',model.matched?'#69d9cc':'#f1ce8d',10,20);
  }
  for(const p of model.body.stagnation){
    const f=model.at(p);
    if(mapped&&(!f||f.singular||f.speed>1e-5))continue;
    const q=mapped?mapPoint(p):p;dot(svg,q,'#f1ce8d',4);label(svg,q,'S','#f1ce8d',-17,-10);
  }
  const p=mapped?mapPoint(probe):probe,q=screen(p);
  svg.append(node('circle',{cx:q.x,cy:q.y,r:9,fill:'#0d1721',stroke:'#f1ce8d','stroke-width':1.5,class:'handle'}));
  svg.append(node('path',{d:`M${q.x-13},${q.y}h26M${q.x},${q.y-13}v26`,stroke:'#f1ce8d','stroke-width':1}));
  label(svg,p,mapped?'P′':'P','#f1ce8d',14,-13);
}
function sync(){
  for(const key of ['cx','cy','alpha']){if(document.activeElement!==$(key))$(key).value=state[key];if(document.activeElement!==$(key+'-number'))$(key+'-number').value=state[key];}
  $('kutta').checked=state.kutta;
  for(const suffix of ['','-number']){$('gamma'+suffix).disabled=state.kutta;if(document.activeElement!==$('gamma'+suffix))$('gamma'+suffix).value=fmt(model.gamma,3);}
  $('gamma-mode').textContent=state.kutta?'自动':'手动';
  for(const b of document.querySelectorAll('[data-preset]')){const p=PRESETS[b.dataset.preset];b.setAttribute('aria-pressed',Math.abs(state.cx-p.cx)<1e-5&&Math.abs(state.cy-p.cy)<1e-5);}
  $('radius').textContent=fmt(model.radius);$('chord').textContent=fmt(model.chord);$('lift').textContent=fmt(model.cl);
  const status=$('kutta-status');status.classList.toggle('warning',!model.matched);
  status.textContent=model.matched?'尾缘满足库塔条件：圆上 T 是驻点，翼型 TE 处速度有限。':`尾缘未满足库塔条件，理想速度发散。所需 ΓK / (U∞b) = ${fmt(model.gammaK)}。`;
}
function render(){
  frame=0;model=createModel(state);sync();probe=projectOutside(model,probe);
  if(needsFlow){
    const config={bounds,pixelsPerUnit:S,density:Number($('density').value),body:model.body};
    curves=layoutCurves(model.field,config);
    potentials=$('potentials').checked?layoutCurves(model.field,{...config,density:6,quantity:'phi'}):[];
    needsFlow=false;
  }
  const highlight=traceCurve(model.field,probe,{bounds,step:.035,maxLength:110}).points;
  views.forEach((svg,i)=>renderPlane(svg,!!i,highlight));
  const f=model.at(probe);$('probe-z').textContent=pair(probe);$('probe-mapped').textContent=pair(mapPoint(probe));
  $('probe-circle-speed').textContent=fmt(f?.circle.speed);$('probe-foil-speed').textContent=fmt(f?.speed);
  const d=derivative(probe);$('probe-scale').textContent=fmt(Math.hypot(d.x,d.y));$('probe-cp').textContent=fmt(f?.cp);
}
function schedule(flow=false){needsFlow||=flow;if(!frame)frame=requestAnimationFrame(render);}
for(const key of ['cx','cy','alpha','gamma']){
  for(const suffix of ['','-number']){
    const input=$(key+suffix);
    input.addEventListener('input',()=>{
      if(input.value.trim()===''||!Number.isFinite(Number(input.value)))return;
      state[key]=Math.max(Number(input.min),Math.min(Number(input.max),Number(input.value)));
      $(key+(suffix?'':'-number')).value=state[key];schedule(true);
    });
    input.addEventListener('change',()=>{input.value=state[key];schedule();});
  }
}
for(const b of document.querySelectorAll('[data-preset]'))b.addEventListener('click',()=>{Object.assign(state,PRESETS[b.dataset.preset]);schedule(true);});
$('kutta').addEventListener('change',()=>{if(!$('kutta').checked)state.gamma=model.gamma;state.kutta=$('kutta').checked;schedule(true);});
$('density').addEventListener('input',()=>schedule(true));$('potentials').addEventListener('change',()=>schedule(true));
$('reset').addEventListener('click',()=>{Object.assign(state,PRESETS.cambered,{alpha:6,kutta:true,gamma:0});probe={x:.1,y:1.8};$('density').value=9;$('potentials').checked=false;schedule(true);});
for(const [id,kutta] of [['demo-zero',false],['demo-kutta',true]])$(id).addEventListener('click',()=>{Object.assign(state,PRESETS.flat,{alpha:6,gamma:0,kutta});schedule(true);});
function eventPoint(svg,e){const rect=svg.getBoundingClientRect();return {x:((e.clientX-rect.left)*600/rect.width-300)/S,y:(230-(e.clientY-rect.top)*460/rect.height)/S};}
views.forEach((svg,i)=>{
  let dragging=null;
  function move(e){
    const p=eventPoint(svg,e);
    if(dragging==='center'){
      state.cx=Math.max(-.35,Math.min(0,Math.round(p.x*200)/200));state.cy=Math.max(-.3,Math.min(.3,Math.round(p.y*200)/200));schedule(true);
    }else{
      const z=i?model.inverse(p):p;if(!z)return;probe=projectOutside(model,z);schedule();
    }
  }
  svg.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;e.preventDefault();svg.focus();
    const p=eventPoint(svg,e);dragging=!i&&Math.hypot(p.x-model.cx,p.y-model.cy)<.32?'center':'probe';svg.setPointerCapture(e.pointerId);move(e);
  });
  svg.addEventListener('pointermove',e=>{if(dragging)move(e);});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])svg.addEventListener(name,()=>{dragging=null;});
  svg.addEventListener('keydown',e=>{
    const delta={ArrowLeft:[-.08,0],ArrowRight:[.08,0],ArrowUp:[0,.08],ArrowDown:[0,-.08]}[e.key];if(!delta)return;
    e.preventDefault();const p=i?mapPoint(probe):probe,q={x:p.x+delta[0],y:p.y+delta[1]},z=i?model.inverse(q):q;
    if(z){probe=projectOutside(model,z);schedule();}
  });
});
render();
