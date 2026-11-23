import {thinModel} from './perturbation.mjs?v=20261123b';

const $ = id => document.getElementById(id);
const ns = 'http://www.w3.org/2000/svg';
const colors = {upper:'#69d9cc',lower:'#f1ce8d',source:'#b5a1f3',reference:'#8596a5',grid:'#28404f'};
const fmt = n => Number.isFinite(n) ? n.toFixed(3) : '—';
const deltaFmt = n => Number.isFinite(n) ? (Math.abs(n)<0.0005?'0.000':(n>0?'+':'')+n.toFixed(3)) : '—';
const presets = Array.from(document.querySelectorAll('[data-p-case]'));
const viewButtons = Array.from(document.querySelectorAll('[data-p-view]'));
const domains = {pressure:null,sheets:null};
const sampleX = Array.from({length:161},(_,i)=>.01+.98*i/160);

function svgEl(tag,attrs={},text=''){
  const node=document.createElementNS(ns,tag);
  for(const [name,value] of Object.entries(attrs))node.setAttribute(name,String(value));
  node.textContent=text;
  return node;
}
function path(svg,points,color,{dash='',width=2,opacity=1}={}){
  if(!points.length)return;
  svg.append(svgEl('path',{
    d:points.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(''),
    fill:'none',stroke:color,'stroke-width':width,'stroke-dasharray':dash,
    'stroke-linejoin':'round','stroke-linecap':'round',opacity
  }));
}
function point(svg,x,y,color){
  svg.append(svgEl('circle',{cx:x,cy:y,r:4.6,fill:color,stroke:'#09131b','stroke-width':2}));
}
function assemble(){
  return thinModel({
    alpha:Number($('p-alpha').value),
    camber:Number($('p-camber').value)/100,
    thickness:Number($('p-thickness').value)/100,
    incidence:$('p-incidence').checked,
    bending:$('p-bending').checked,
    body:$('p-body').checked
  });
}
function snapshot(){
  const model=assemble();
  return {model,samples:sampleX.map(x=>model.at(x)),alpha:Number($('p-alpha').value),
    camber:Number($('p-camber').value),thickness:Number($('p-thickness').value)};
}
let baseline=snapshot();
let baselineLabel='初始工况';
let activeView='pressure';
function seriesFor(view,data,showQuadratic){
  if(view==='pressure'){
    return [
      {points:data.samples.map(p=>[p.x,p.upper.cp]),color:colors.upper},
      {points:data.samples.map(p=>[p.x,p.lower.cp]),color:colors.lower},
      ...(showQuadratic?[
        {points:data.samples.map(p=>[p.x,p.upper.bernoulli]),color:colors.upper,dash:'3 6',width:1.35,opacity:.75},
        {points:data.samples.map(p=>[p.x,p.lower.bernoulli]),color:colors.lower,dash:'3 6',width:1.35,opacity:.75}
      ]:[])
    ];
  }
  return [
    {points:data.samples.map(p=>[p.x,p.q]),color:colors.source},
    {points:data.samples.map(p=>[p.x,p.gamma]),color:colors.upper}
  ];
}
function referenceSeries(view){
  return view==='pressure'
    ? [baseline.samples.map(p=>[p.x,p.upper.cp]),baseline.samples.map(p=>[p.x,p.lower.cp])]
    : [baseline.samples.map(p=>[p.x,p.q]),baseline.samples.map(p=>[p.x,p.gamma])];
}
function domainOf(values){
  let low=Math.min(-.04,...values),high=Math.max(.04,...values);
  const padding=Math.max(.06,(high-low)*.13);
  return [low-padding,high+padding];
}
function activeDomain(view,values){
  const fresh=domainOf(values);
  if(!$('p-keep-scale').checked){domains[view]=null;return fresh;}
  if(!domains[view])domains[view]=fresh;
  const [oldLow,oldHigh]=domains[view],span=oldHigh-oldLow;
  // Expand when an extreme would be clipped, but never shrink after a slider change.
  domains[view]=[fresh[0]<oldLow?fresh[0]-span*.06:oldLow,
                 fresh[1]>oldHigh?fresh[1]+span*.06:oldHigh];
  return domains[view];
}
function drawChart(svg,view,data,selectedX,label){
  svg.replaceChildren();
  const refs=referenceSeries(view);
  const actual=seriesFor(view,data,$('p-quadratic').checked);
  const all=actual.flatMap(s=>s.points.map(p=>p[1])).concat(refs.flatMap(s=>s.map(p=>p[1])));
  const [low,high]=activeDomain(view,all),X=x=>50+500*x,Y=y=>38+171*(y-low)/(high-low);
  for(let i=0;i<=4;i++){
    const value=low+(high-low)*i/4,y=Y(value);
    path(svg,[[50,y],[550,y]],value===0?colors.reference:colors.grid,{width:value===0?1.1:.8,opacity:.8});
    svg.append(svgEl('text',{x:5,y:y+4,fill:'#aabdca','font-size':12},value.toFixed(2)));
  }
  // Dashed neutral curves stay in place as the controls move.
  refs.forEach((ref,index)=>path(svg,ref.map(([x,y])=>[X(x),Y(y)]),
    colors.reference,{dash:index?'3 6':'7 5',width:1.9,opacity:.85}));
  actual.forEach(s=>path(svg,s.points.map(([x,y])=>[X(x),Y(y)]),s.color,s));
  const px=X(selectedX);
  path(svg,[[px,28],[px,218]],'#f1ce8d',{dash:'3 5',width:1.25,opacity:.9});
  const sample=data.model.at(selectedX);
  if(view==='pressure'){
    point(svg,px,Y(sample.upper.cp),colors.upper);
    point(svg,px,Y(sample.lower.cp),colors.lower);
  }else{
    point(svg,px,Y(sample.q),colors.source);
    point(svg,px,Y(sample.gamma),colors.upper);
  }
  svg.append(svgEl('text',{x:50,y:245,fill:'#aabdca','font-size':13},'0'));
  svg.append(svgEl('text',{x:498,y:245,fill:'#aabdca','font-size':13},'1   x/c'));
  svg.append(svgEl('text',{x:50,y:18,fill:'#e7f0f3','font-size':13},label));
}
function drawShape(data,selectedX){
  const svg=$('p-shape');svg.replaceChildren();
  const X=x=>50+500*x,Y=y=>122-510*y;
  const outline=items=>{
    const p=[[X(0),Y(0)],...items.map(s=>[X(s.x),Y(s.mean+s.half)]),
      [X(1),Y(0)],...[...items].reverse().map(s=>[X(s.x),Y(s.mean-s.half)])];
    p.push(p[0]);return p;
  };
  path(svg,[[50,122],[550,122]],'#587382',{dash:'4 5',width:1.5});
  path(svg,outline(baseline.samples),colors.reference,{dash:'7 5',width:1.9,opacity:.9});
  path(svg,outline(data.samples),'#e7f0f3',{width:2.4});
  path(svg,data.samples.map(p=>[X(p.x),Y(p.mean)]),colors.source,{dash:'5 6',width:1.5});
  path(svg,[[X(selectedX),26],[X(selectedX),203]],colors.lower,{dash:'3 5',width:1.2});
  const sample=data.model.at(selectedX),origin=[X(selectedX),Y(sample.mean+sample.half)];
  function vector(u,v,color){
    const tip=[origin[0]+76*u,origin[1]-76*v];
    path(svg,[origin,tip],color,{width:2.3});
    const a=Math.atan2(tip[1]-origin[1],tip[0]-origin[0]);
    path(svg,[[tip[0]-7*Math.cos(a-.45),tip[1]-7*Math.sin(a-.45)],
      tip,[tip[0]-7*Math.cos(a+.45),tip[1]-7*Math.sin(a+.45)]],color,{width:2});
  }
  vector(Math.cos(data.model.a),Math.sin(data.model.a),'#96acbb');
  vector(sample.upper.u,sample.upper.v,colors.lower);
  vector(Math.cos(data.model.a)+sample.upper.u,Math.sin(data.model.a)+sample.upper.v,colors.upper);
  svg.append(svgEl('text',{x:30,y:232,fill:'#aabdca','font-size':13},'灰虚线：参考轮廓  /  紫虚线：当前中弧线'));
}
function syncControls(){
  for(const [toggle,slider] of [['p-incidence','p-alpha'],['p-bending','p-camber'],['p-body','p-thickness']]){
    const active=$(toggle).checked;
    $(slider).disabled=!active;
    $(toggle).closest('.p-param-card').classList.toggle('p-inactive',!active);
  }
}
function markPreset(name){
  for(const b of presets)b.setAttribute('aria-pressed',String(b.dataset.pCase===name));
}
function render(){
  syncControls();
  const data=snapshot();
  const position=Number($('p-x').value),p=data.model.at(position),ref=baseline.model.at(position);
  for(const id of ['alpha','camber','thickness','x'])$('p-'+id+'-value').textContent=$('p-'+id).value;
  $('p-cl').textContent=fmt(data.model.cl);
  $('p-cl-delta').textContent=deltaFmt(data.model.cl-baseline.model.cl);
  $('p-cp-upper').textContent=fmt(p.upper.cp);
  $('p-cp-lower').textContent=fmt(p.lower.cp);
  $('p-error').textContent=fmt(Math.max(Math.abs(p.upper.cp-p.upper.bernoulli),Math.abs(p.lower.cp-p.lower.bernoulli)));
  const ratio=Math.max(p.upper.ratio,p.lower.ratio);
  $('p-ratio').textContent=fmt(ratio);
  $('p-validity').textContent=ratio>.2
    ? '⚠ 观测点的 |V′|/U∞ 已超过 0.2，局部小扰动近似可能失准。0.2 是教学提醒线，不是普适误差阈值。'
    : '当前读数仅代表观测点：即使这里的扰动较小，也不能保证整个翼型（尤其是前缘）满足近似条件。';
  const descriptions=[
    '迎角改变来流相对翼弦的方向，产生附加涡片与上下侧速度差。',
    '弯度改变中弧线斜率，即使零迎角也可能产生压力差和升力。',
    '厚度对应源汇片，改变两侧共同压力分布；本模型一阶净升力不变。'
  ];
  for(let i=0;i<3;i++){
    const c=p.upper.parts[i];
    $('p-part-'+i).textContent=`${descriptions[i]} 此处上侧 u′/U∞ = ${fmt(c.u)}，v′/U∞ = ${fmt(c.v)}，ΔCp = ${fmt(-2*c.u)}。`;
  }
  $('p-sum').textContent=`x/c = ${position.toFixed(3)}：先叠加速度，上侧 (u′, v′)/U∞ = (${fmt(p.upper.u)}, ${fmt(p.upper.v)})；再线性换算得到 Cp,上 = ${fmt(p.upper.cp)}，Cp,下 = ${fmt(p.lower.cp)}。相对于保存的参考工况，此处 ΔCp,上 = ${deltaFmt(p.upper.cp-ref.upper.cp)}，ΔCp,下 = ${deltaFmt(p.lower.cp-ref.lower.cp)}。`;
  drawChart($('p-pressure'),'pressure',data,position,'Cp · 负值朝上');
  drawChart($('p-sheets'),'sheets',data,position,'源汇片 q/U∞（紫）与涡片 γ/U∞（青）');
  drawShape(data,position);
}
function setView(name){
  activeView=name;
  for(const b of viewButtons){
    const selected=b.dataset.pView===name;
    b.setAttribute('aria-selected',String(selected));
    b.tabIndex=selected?0:-1;
    $(b.getAttribute('aria-controls')).hidden=!selected;
  }
}
for(const b of viewButtons){
  b.addEventListener('click',()=>setView(b.dataset.pView));
  b.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const i=viewButtons.indexOf(b);
    const next=event.key==='Home'?0:event.key==='End'?viewButtons.length-1
      :(i+(event.key==='ArrowRight'?1:-1)+viewButtons.length)%viewButtons.length;
    setView(viewButtons[next].dataset.pView);
    viewButtons[next].focus();
  });
}
function resetParameters(){
  for(const [id,value] of Object.entries({'p-alpha':3,'p-camber':2,'p-thickness':6,'p-x':.4}))$(id).value=value;
  for(const id of ['p-incidence','p-bending','p-body','p-quadratic'])$(id).checked=true;
}
function clearScale(){domains.pressure=null;domains.sheets=null;}
$('p-save-baseline').addEventListener('click',()=>{
  baseline=snapshot();baselineLabel='手动保存的工况';
  $('p-baseline-status').textContent='灰虚线：'+baselineLabel;
  clearScale();render();
});
$('p-keep-scale').addEventListener('change',()=>{clearScale();render();});
for(const id of ['p-alpha','p-camber','p-thickness','p-x']){
  $(id).addEventListener('input',()=>{if(id!=='p-x')markPreset(null);render();});
}
for(const id of ['p-incidence','p-bending','p-body','p-quadratic']){
  $(id).addEventListener('change',()=>{if(id!=='p-quadratic')markPreset(null);render();});
}
for(const button of presets)button.addEventListener('click',()=>{
  const selected=button.dataset.pCase;
  resetParameters();
  $('p-incidence').checked=selected==='alpha'||selected==='all';
  $('p-bending').checked=selected==='camber'||selected==='all';
  $('p-body').checked=selected==='thickness'||selected==='all';
  markPreset(selected);render();
});
$('p-reset').addEventListener('click',()=>{
  resetParameters();markPreset('all');
  baseline=snapshot();baselineLabel='初始工况';
  $('p-baseline-status').textContent='灰虚线：'+baselineLabel;
  clearScale();render();
});
setView(activeView);
markPreset('all');
render();
