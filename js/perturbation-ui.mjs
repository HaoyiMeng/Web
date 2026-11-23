import {thinModel} from './perturbation.mjs?v=20261123b';
const $=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
const f=n=>Number.isFinite(n)?n.toFixed(3):'—';
function el(tag,attrs={},text=''){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));e.textContent=text;return e;}
function line(svg,points,color,dash=''){svg.append(el('path',{d:points.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(''),fill:'none',stroke:color,'stroke-width':2,'stroke-dasharray':dash}));}
function chart(svg,series,x,label){
  svg.replaceChildren();const values=series.flatMap(s=>s.points.map(p=>p[1]));let lo=Math.min(-.05,...values),hi=Math.max(.05,...values),span=hi-lo;lo-=span*.08;hi+=span*.08;
  const X=v=>50+500*v,Y=v=>35+175*(v-lo)/(hi-lo);
  // Cp charts conventionally put more negative values higher.
  for(let i=0;i<5;i++){const v=lo+(hi-lo)*i/4,y=Y(v);line(svg,[[50,y],[550,y]],'#29404f');svg.append(el('text',{x:4,y:y+4,fill:'#aabdca','font-size':12},v.toFixed(2)));}
  for(const s of series)line(svg,s.points.map(([x,y])=>[X(x),Y(y)]),s.color,s.dash);
  line(svg,[[X(x),25],[X(x),218]],'#f1ce8d','4 5');
  svg.append(el('text',{x:50,y:245,fill:'#aabdca','font-size':13},'0'));
  svg.append(el('text',{x:510,y:245,fill:'#aabdca','font-size':13},'1  x/c'));
  svg.append(el('text',{x:50,y:17,fill:'#e7f0f3','font-size':14},label));
}
export function renderPerturbation(){
  const model=thinModel({alpha:Number($('p-alpha').value),camber:Number($('p-camber').value)/100,thickness:Number($('p-thickness').value)/100,incidence:$('p-incidence').checked,bending:$('p-bending').checked,body:$('p-body').checked});
  const x=Number($('p-x').value),p=model.at(x),samples=Array.from({length:161},(_,i)=>model.at(.01+.98*i/160));
  for(const id of ['alpha','camber','thickness','x'])$('p-'+id+'-value').textContent=$('p-'+id).value;
  $('p-cl').textContent=f(model.cl);$('p-cp-upper').textContent=f(p.upper.cp);$('p-cp-lower').textContent=f(p.lower.cp);
  $('p-error').textContent=f(Math.max(Math.abs(p.upper.cp-p.upper.bernoulli),Math.abs(p.lower.cp-p.lower.bernoulli)));
  const ratio=Math.max(p.upper.ratio,p.lower.ratio);$('p-ratio').textContent=f(ratio);
  $('p-validity').textContent=ratio>.2
    ? '⚠ 此处 |V′|/U∞ 已超过 0.2：局部扰动不再很小，一阶近似须谨慎。0.2 是演示警示线，不是普适的误差界限；前缘尤其可能失效。'
    : '此读数衡量所选截面的局部扰动强弱；即使这里数值较小，也不保证整个翼型都满足小扰动条件。';
  const descriptions=[
    '迎角使来流相对翼弦倾斜，要求流线改变方向；在模型里体现为额外涡片与上下表面切向速度差。',
    '弯度改变中弧线斜率。即便迎角为零，弯曲的中弧线也可产生涡片、压力差和正升力。',
    '厚度改变上下表面的外法向排流需求，对应前缘附近源、后部汇；一阶压力改变在两侧相同，不独自产生升力。'
  ];
  for(let i=0;i<3;i++){
    const c=p.upper.parts[i],cp=-2*c.u;
    $('p-part-'+i).textContent=`${descriptions[i]} 当前上侧：u′/U∞ = ${f(c.u)}，v′/U∞ = ${f(c.v)}，ΔCp = ${f(cp)}。`;
  }
  $('p-sum').textContent=`在 x/c = ${x.toFixed(3)} 处，先将速度分量相加：上侧 (u′, v′)/U∞ = (${f(p.upper.u)}, ${f(p.upper.v)})；再做一阶压力换算：Cp,上 = ${f(p.upper.cp)}，Cp,下 = ${f(p.lower.cp)}。三个来源的 Cp 在这一近似下可以代数相加。`;
  chart($('p-pressure'),[
    {points:samples.map(p=>[p.x,p.upper.cp]),color:'#69d9cc'},
    {points:samples.map(p=>[p.x,p.lower.cp]),color:'#f1ce8d'},
    ...($('p-quadratic').checked?[{points:samples.map(p=>[p.x,p.upper.bernoulli]),color:'#69d9cc',dash:'5 5'},{points:samples.map(p=>[p.x,p.lower.bernoulli]),color:'#f1ce8d',dash:'5 5'}]:[])
  ],x,'Cp · 负值朝上');
  chart($('p-sheets'),[{points:samples.map(p=>[p.x,p.q]),color:'#b5a1f3'},{points:samples.map(p=>[p.x,p.gamma]),color:'#69d9cc'}],x,'q/U∞（紫）与 γ/U∞（青）· 数值向下增大');
  const svg=$('p-shape');svg.replaceChildren();const X=v=>50+500*v,Y=v=>125-500*v;
  const outline=[[X(0),Y(0)],...samples.map(p=>[X(p.x),Y(p.mean+p.half)]),[X(1),Y(0)],...[...samples].reverse().map(p=>[X(p.x),Y(p.mean-p.half)])];
  outline.push(outline[0]);line(svg,outline,'#e7f0f3');line(svg,[[50,125],[550,125]],'#587382','4 5');
  line(svg,samples.map(p=>[X(p.x),Y(p.mean)]),'#b5a1f3','5 5');line(svg,[[X(x),25],[X(x),205]],'#f1ce8d','3 5');
  const origin=[X(x),Y(p.mean+p.half)];
  function vector(u,v,color){const tip=[origin[0]+70*u,origin[1]-70*v];line(svg,[origin,tip],color);const a=Math.atan2(tip[1]-origin[1],tip[0]-origin[0]);line(svg,[[tip[0]-7*Math.cos(a-.45),tip[1]-7*Math.sin(a-.45)],tip,[tip[0]-7*Math.cos(a+.45),tip[1]-7*Math.sin(a+.45)]],color);}
  vector(Math.cos(model.a),Math.sin(model.a),'#96acbb');vector(p.upper.u,p.upper.v,'#f1ce8d');vector(Math.cos(model.a)+p.upper.u,Math.sin(model.a)+p.upper.v,'#69d9cc');
  svg.append(el('text',{x:30,y:230,fill:'#aabdca','font-size':13},'等比例翼型 · 灰：来流，金：扰动，青：合速度（统一箭头尺度）'));
}
const caseButtons=Array.from(document.querySelectorAll('[data-p-case]'));
function markCase(name){for(const button of caseButtons)button.setAttribute('aria-pressed',String(button.dataset.pCase===name));}
function resetValues(){
  for(const [id,v] of Object.entries({'p-alpha':3,'p-camber':2,'p-thickness':6,'p-x':.4}))$(id).value=v;
  for(const id of ['p-incidence','p-bending','p-body','p-quadratic'])$(id).checked=true;
}
for(const id of ['p-alpha','p-camber','p-thickness','p-x'])$(id).addEventListener('input',()=>{markCase(null);renderPerturbation();});
for(const id of ['p-incidence','p-bending','p-body','p-quadratic'])$(id).addEventListener('change',()=>{markCase(null);renderPerturbation();});
for(const button of caseButtons)button.addEventListener('click',()=>{
  const selected=button.dataset.pCase;
  resetValues();
  $('p-incidence').checked=selected==='alpha'||selected==='all';
  $('p-bending').checked=selected==='camber'||selected==='all';
  $('p-body').checked=selected==='thickness'||selected==='all';
  markCase(selected);
  renderPerturbation();
});
$('p-reset').addEventListener('click',()=>{resetValues();markCase('all');renderPerturbation();});
markCase('all');
renderPerturbation();
