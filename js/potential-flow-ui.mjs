import {TAU,CORE,rad,compileField,advance,measureCircle,cylinderModel,exteriorField} from './potential-flow.mjs?v=20261122b';
import {layoutCurves} from './potential-flow-lines.mjs?v=20261122b';

const $=id=>document.getElementById(id);
const canvas=$('field'),ctx=canvas.getContext('2d');
const base=document.createElement('canvas'),bg=base.getContext('2d');
const heatCanvas=document.createElement('canvas'),heatContext=heatCanvas.getContext('2d');
const palette={source:'#f8b878',sink:'#76adff',vortex:'#b99aff',doublet:'#62d6d0',pair:'#b9d8d2'};
const symbols={source:'+',sink:'−',vortex:'↺',doublet:'⇄',pair:'±'};
let elements=[],uniform={speed:.6,angle:0},selected=null,nextId=1,tool='select';
let field=compileField([],uniform),dirty=true,width=900,height=550,dpr=1;
let view={x:0,y:0,span:12},probe={x:0,y:1.5},loop=null,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
let particles=[],drag=null,lastTime=0,frameId=0;
const layers={streams:true,potentials:true,arrows:false,particles:true,grid:true,probe:true};
let scalar='none',density=10;
let body=null;
const fmt=(v,n=2)=>!Number.isFinite(v)?'—':Math.abs(v)<.5*10**(-n)?(0).toFixed(n):Math.abs(v)>=10000?v.toExponential(2):v.toFixed(n);
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const scale=()=>width/view.span;
const world=(px,py)=>({x:view.x+(px-width/2)/scale(),y:view.y-(py-height/2)/scale()});
const screen=(x,y)=>({x:width/2+(x-view.x)*scale(),y:height/2-(y-view.y)*scale()});
const selectedElement=()=>elements.find(e=>e.id===selected);
function typeOf(e){return e.type==='source'&&e.strength<0?'sink':e.type;}
function label(e){return ({source:'点源',sink:'点汇',vortex:'点涡',doublet:'偶极子',pair:'源汇对'})[typeOf(e)]+' '+e.id;}
function signature(e){return e.type==='vortex'?'Γ':e.type==='doublet'?'μ':'Q';}
function make(type,x,y,strength){
  return {id:nextId++,type:type==='sink'?'source':type,x,y,strength:strength??(type==='sink'?-8:8),angle:0,separation:2,lockMoment:false,moment:16,enabled:true};
}
function preset(name){
  elements=[];nextId=1;uniform={speed:0,angle:0};
  view={x:0,y:0,span:12};probe={x:0,y:1.5};loop=null;
  if(name==='default'){uniform.speed=.6;elements=[make('source',-2,0),make('sink',2,0)];}
  if(name==='uniform')uniform.speed=1;
  if(name==='source')elements=[make('source',0,0)];
  if(name==='vortex')elements=[make('vortex',0,0,10)];
  if(name==='doublet')elements=[make('doublet',0,0,16)];
  if(name==='pair'){const e=make('pair',0,0,8);e.lockMoment=true;elements=[e];}
  if(name==='spiral')elements=[make('source',0,0,6),make('vortex',0,0,10)];
  if(name==='cylinder'){
    uniform={speed:1,angle:180};
    elements=[make('doublet',0,0,TAU),make('vortex',0,0,TAU)];
    view={x:0,y:-.6,span:9};probe={x:1.6,y:1.2};
    layers.streams=true;layers.potentials=false;layers.particles=false;
    for(const k of ['streams','potentials','particles'])$('show-'+k).checked=layers[k];
    scalar='none';$('background').value='none';$('speed-legend').hidden=true;
  }
  selected=elements[0]?.id??null;setTool('select');
  $('uniform-speed').value=uniform.speed;$('uniform-range').value=uniform.speed;$('uniform-angle').value=uniform.angle;
  $('scene-name').textContent=$('preset').selectedOptions[0].textContent;
  syncAll();recompute();
}
function syncAll(){syncInspector();syncList();syncLoop();}
function syncInspector(){
  const e=selectedElement();
  $('no-selection').hidden=!!e;$('selection-controls').hidden=!e;
  $('selected-type').textContent=e?typeOf(e).toUpperCase():'SELECT';
  if(!e)return;
  $('selected-name').textContent=label(e);$('element-enabled').checked=e.enabled;
  const moment=e.type==='doublet'||(e.type==='pair'&&e.lockMoment);
  const value=e.type==='pair'&&e.lockMoment?e.moment:e.strength;
  $('strength-label').innerHTML=(moment?'偶极矩 μ':e.type==='vortex'?'环量 Γ':'源强 Q')+' <small>'+(moment?'m³/s':'m²/s')+'</small>';
  $('strength-number').value=Number(value.toFixed(4));
  const inputBound=Math.max(1000000,Math.abs(value));
  $('strength-number').min=-inputBound;$('strength-number').max=inputBound;
  const bound=Math.max(20,Math.ceil(Math.abs(value)/10)*10);
  $('strength-range').min=-bound;$('strength-range').max=bound;$('strength-range').value=value;
  $('strength-min').textContent='−'+bound;$('strength-max').textContent=bound;
  $('strength-note').textContent=e.type==='vortex'?'Γ > 0 逆时针，Γ < 0 顺时针。':e.type==='doublet'?'α 从汇指向源；μ 改变符号会反转流向。':e.type==='pair'?'沿 α 方向一端为 +Q，另一端为 −Q。':'Q > 0 为源，Q < 0 为汇。';
  $('element-x').value=Number(e.x.toFixed(3));$('element-y').value=Number(e.y.toFixed(3));
  $('angle-controls').hidden=!['doublet','pair'].includes(e.type);
  $('element-angle').value=e.angle;$('angle-range').value=e.angle;
  $('pair-controls').hidden=e.type!=='pair';
  $('separation-number').value=e.separation;$('separation-range').value=e.separation;$('lock-moment').checked=e.lockMoment;
  if(e.type==='pair'){
    const q=e.lockMoment?e.moment/e.separation:e.strength;
    $('pair-note').textContent=`Q = ${fmt(q)} m²/s · μ = ${fmt(q*e.separation)} m³/s`+(e.separation<2*CORE?' · 两个奇点的显示遮罩重叠':'');
  }
}
function syncList(){
  const list=$('element-list');list.replaceChildren();
  for(const e of elements){
    const button=document.createElement('button');button.className='element-row'+(e.id===selected?' active':'')+(!e.enabled?' disabled':'');
    button.setAttribute('aria-pressed',String(e.id===selected));button.dataset.elementId=e.id;
    const q=e.type==='pair'&&e.lockMoment?e.moment/e.separation:e.strength;
    button.innerHTML=`<span class="row-label"><span class="row-icon" style="color:${palette[typeOf(e)]}">${e.type==='vortex'&&q<0?'↻':symbols[typeOf(e)]}</span>${label(e)}</span><small>${signature(e)} ${fmt(q,1)}</small>`;
    button.addEventListener('click',()=>{selected=e.id;setTool('select');syncInspector();syncList();});list.append(button);
  }
  if(!elements.length){const p=document.createElement('p');p.className='parameter-note';p.textContent='还没有放置流动元素。';list.append(p);}
  $('composition-count').textContent=elements.length+' / 16';
  const count=elements.filter(e=>e.enabled).length;
  $('element-count').textContent=count+(count===1?' ELEMENT':' ELEMENTS');
}
function syncLoop(){
  $('loop-panel').hidden=!loop;
  if(!loop)return;
  $('loop-radius').value=Number(loop.r.toFixed(2));
  const m=measureCircle(field,loop.x,loop.y,loop.r);
  $('loop-warning').hidden=!!m;
  $('loop-flux').textContent=m?fmt(m.flux,3):'—';$('loop-gamma').textContent=m?fmt(m.circulation,3):'—';
  $('loop-q').textContent=m?fmt(m.enclosedQ,2):'—';$('loop-g').textContent=m?fmt(m.enclosedGamma,2):'—';
}
function recompute(){
  body=cylinderModel(elements,uniform);
  field=exteriorField(compileField(elements,uniform),body);dirty=true;particles=[];updateProbe();syncLoop();syncCylinder();
  $('empty-overlay').hidden=field.parts.length>0||uniform.speed>0;
  const cut=scalar==='phi'?field.parts.some(e=>e.type==='vortex'):scalar==='psi'?field.parts.some(e=>e.type==='source'):false;
  $('scalar-note').hidden=scalar==='none';
  $('scalar-note').textContent=(cut?'角度主值有分支跳变，色带接缝不是流场边界。':'色阶随当前视野自动缩放。')+(scalar==='speed'?'高值按 95% 分位截色；探针保留实际数值。':scalar==='none'?'':'红色为正，蓝色为负，零值为深色。');
}
function syncCylinder(){
  $('cylinder-panel').hidden=!body;
  if(!body)return;
  const abs=Math.abs(body.lambda),critical=Math.abs(abs-1)<1e-8;
  $('cylinder-state').textContent=critical?'临界环量':abs<1?'亚临界':'超临界';
  const values={'cylinder-radius':body.radius,'cylinder-ratio':body.lambda,'cylinder-range':body.lambda};
  for(const [id,value] of Object.entries(values))if(document.activeElement!==$(id))$(id).value=Number(value.toFixed(4));
  $('cylinder-range').min=Math.min(-2,body.lambda);$('cylinder-range').max=Math.max(2,body.lambda);
  $('cylinder-values').textContent=`Γ = ${fmt(body.gamma,3)} m²/s · Γc = ${fmt(body.critical,3)} m²/s`;
  $('cylinder-stagnation').textContent=critical?'两个表面驻点在此合并。':abs<1?'两个驻点位于圆柱表面。':'外部驻点离开圆柱，内侧出现闭合环流区。';
  $('cylinder-position').textContent=body.stagnation.map((p,i)=>`S${body.stagnation.length>1?i+1:''} (${fmt(p.x)}, ${fmt(p.y)}) m`).join(' · ');
  document.querySelectorAll('[data-regime]').forEach(b=>b.setAttribute('aria-pressed',String(Math.abs(abs-Number(b.dataset.regime))<1e-8)));
}
function changeCylinder(radius,ratio){
  if(!body)return;
  const d=elements.find(e=>e.id===body.doubletId);
  d.strength=Math.sign(d.strength)*TAU*uniform.speed*radius*radius;
  let vortices=elements.filter(e=>e.type==='vortex'&&e.enabled!==false&&Math.hypot(e.x-body.x,e.y-body.y)<1e-8);
  if(!vortices.length){if(elements.length>=16)return;const v=make('vortex',body.x,body.y,0);elements.push(v);vortices=[v];}
  vortices.forEach((e,i)=>{e.strength=i===0?ratio*2*TAU*uniform.speed*radius:0;});
  recompute();syncInspector();syncList();
}
function updateProbe(){
  const f=field.at(probe.x,probe.y,CORE);
  $('probe-xy').textContent=`(${fmt(probe.x)}, ${fmt(probe.y)})`;
  $('probe-uv').textContent=f?`${fmt(f.u)} / ${fmt(f.v)}`:body&&Math.hypot(probe.x-body.x,probe.y-body.y)<body.radius?'圆柱内部':'奇点邻域';
  for(const key of ['speed','phi','psi'])$('probe-'+key).textContent=f?fmt(f[key],3):'—';
}
function setTool(t){
  tool=t;document.querySelectorAll('[data-tool]').forEach(b=>{const active=b.dataset.tool===t;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  const placement=['source','sink','vortex','doublet','pair'].includes(t);
  $('add-center').hidden=!placement;
  $('tool-hint').textContent=placement?'点击画布放置元素 · 可以连续添加 · Esc 返回选择':t==='probe'?'点击或拖动探针 P，读取局部速度、φ 与 ψ':t==='loop'?'拖动空白处画圆 · 拖动圆心平移回路 · 拖动圆边调整半径':'拖动元素改变位置 · 拖动空白处平移 · 滚轮缩放';
  canvas.style.cursor=t==='select'?'grab':'crosshair';
  if(t==='probe'){layers.probe=true;$('show-probe').checked=true;}
}
function addElement(type,x,y){
  if(elements.length>=16){$('tool-hint').textContent='最多可放置 16 个元素，请删除或复用已有元素。';return;}
  const e=make(type,x,y);elements.push(e);selected=e.id;syncAll();recompute();
  $('scene-name').textContent='自由组合';
}
function resize(){
  const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  base.width=canvas.width;base.height=canvas.height;bg.setTransform(dpr,0,0,dpr,0,0);dirty=true;particles=[];
}
function line(context,x1,y1,x2,y2){context.beginPath();context.moveTo(x1,y1);context.lineTo(x2,y2);context.stroke();}
function arrow(context,x,y,dx,dy,length,color,head=4){
  const norm=Math.hypot(dx,dy);if(norm<1e-8)return;
  dx=dx/norm*length;dy=dy/norm*length;context.strokeStyle=color;context.fillStyle=color;context.lineWidth=1;
  line(context,x-dx*.5,y-dy*.5,x+dx*.5,y+dy*.5);
  const a=Math.atan2(dy,dx),ex=x+dx*.5,ey=y+dy*.5;
  context.beginPath();context.moveTo(ex,ey);context.lineTo(ex-head*Math.cos(a-.55),ey-head*Math.sin(a-.55));context.lineTo(ex-head*Math.cos(a+.55),ey-head*Math.sin(a+.55));context.closePath();context.fill();
}
function grid(){
  const desired=view.span/12,unit=10**Math.floor(Math.log10(desired)),step=[1,2,5,10].find(n=>n*unit>=desired)*unit;
  const lo=world(0,height),hi=world(width,0);
  bg.font='11px Consolas, monospace';bg.textAlign='center';bg.fillStyle='#657d91';
  for(let x=Math.ceil(lo.x/step)*step;x<=hi.x;x+=step){
    const p=screen(x,0);bg.strokeStyle=Math.abs(x)<1e-7?'#3a5061':'#1d2e3b';bg.lineWidth=Math.abs(x)<1e-7?1:.65;line(bg,p.x,0,p.x,height);
    if(p.x>20&&p.x<width-20)bg.fillText(fmt(x,step<1?1:0),p.x,clamp(p.y+16,55,height-15));
  }
  bg.textAlign='left';
  for(let y=Math.ceil(lo.y/step)*step;y<=hi.y;y+=step){
    const p=screen(0,y);bg.strokeStyle=Math.abs(y)<1e-7?'#3a5061':'#1d2e3b';bg.lineWidth=Math.abs(y)<1e-7?1:.65;line(bg,0,p.y,width,p.y);
    if(Math.abs(y)>1e-7&&p.y>48&&p.y<height-20)bg.fillText(fmt(y,step<1?1:0),clamp(p.x+7,8,width-45),p.y-5);
  }
  bg.fillStyle='#88a3b8';bg.fillText('x / m',width-48,clamp(screen(0,0).y-8,56,height-16));bg.fillText('y / m',clamp(screen(0,0).x+8,8,width-50),56);
}
function sampleMesh(spacing=10){
  const nx=Math.ceil(width/spacing),ny=Math.ceil(height/spacing),dx=width/nx,dy=height/ny,values=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    const p=world(i*dx,j*dy);values.push(field.at(p.x,p.y,CORE));
  }
  return {nx,ny,dx,dy,values};
}
function heatmap(mesh){
  const {nx,ny,dx,dy,values}=mesh;
  const data=values.filter(Boolean).map(f=>Math.abs(f[scalar])).sort((a,b)=>a-b);
  const limit=data[Math.floor(data.length*.95)]||1;
  heatCanvas.width=nx+1;heatCanvas.height=ny+1;
  const pixels=heatContext.createImageData(nx+1,ny+1);
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
    const index=j*(nx+1)+i,f=values[index];if(!f)continue;
    const t=clamp(f[scalar]/limit,-1,1),q=Math.abs(t);
    let color,alpha;
    if(scalar==='speed'){
      color=t<.65?[22+35*t,51+170*t,72+120*t]:[60+185*(t-.65)/.35,162+52*(t-.65)/.35,150-40*(t-.65)/.35];alpha=.48;
    }else{color=t>=0?[226,112,100]:[70,132,226];alpha=q*.48;}
    pixels.data.set([...color.map(Math.round),Math.round(alpha*255)],index*4);
  }
  heatContext.putImageData(pixels,0,0);bg.imageSmoothingEnabled=true;
  bg.drawImage(heatCanvas,-dx/2,-dy/2,width+dx,height+dy);
  $('speed-max').textContent='0–'+fmt(limit,1)+' m/s';
}
function drawCurves(quantity){
  const lo=world(0,height),hi=world(width,0),bounds={xmin:lo.x,xmax:hi.x,ymin:lo.y,ymax:hi.y};
  const curves=layoutCurves(field,{bounds,pixelsPerUnit:scale(),density:quantity==='phi'?density*.72:density,quantity,body});
  bg.lineJoin='round';bg.lineCap='round';
  for(const curve of curves){
    const special=curve.kind==='separatrix';
    bg.strokeStyle=quantity==='phi'?'#b99aff80':special?'#f4dba3dc':'#62d6d0b3';
    bg.lineWidth=special?1.65:quantity==='phi'?1:1.15;
    bg.setLineDash(quantity==='phi'?[5,6]:[]);bg.beginPath();
    curve.points.forEach((p,i)=>{const s=screen(p.x,p.y);if(i===0)bg.moveTo(s.x,s.y);else bg.lineTo(s.x,s.y);});
    if(curve.closed)bg.closePath();bg.stroke();
    if(quantity==='psi'){
      bg.setLineDash([]);
      const visible=curve.points.filter(p=>{const s=screen(p.x,p.y);return s.x>30&&s.x<width-30&&s.y>55&&s.y<height-60;});
      for(const fraction of (visible.length>200?[.28,.72]:[.5])){
        const p=visible[Math.floor(visible.length*fraction)];if(!p)continue;
        const s=screen(p.x,p.y),f=field.at(p.x,p.y);
        if(f&&f.speed>1e-5)arrow(bg,s.x,s.y,f.u,-f.v,10,special?'#f4dba3':'#83e5d7b0',3);
      }
    }
  }
  bg.setLineDash([]);
}
function drawBody(){
  if(!body)return;
  const p=screen(body.x,body.y),r=body.radius*scale();
  bg.lineWidth=1.7;circle(bg,p.x,p.y,r,'#9de4d7','#14232e');
  bg.save();bg.setLineDash([3,4]);bg.strokeStyle='#a2bab276';bg.lineWidth=1;
  const end=body.local(body.radius*Math.cos(-.4),body.radius*Math.sin(-.4)),q=screen(end.x,end.y);
  line(bg,p.x,p.y,q.x,q.y);bg.restore();
  bg.font='12px Consolas,monospace';bg.textAlign='center';bg.fillStyle='#c2dbd7';
  bg.fillText('a = '+fmt(body.radius)+' m',p.x,p.y+r*.58);
  bg.fillText('U∞ = '+fmt(body.speed)+' m/s',width-110,64);
  arrow(bg,width-110,82,Math.cos(rad(body.angle)),-Math.sin(rad(body.angle)),48,'#c2dbd7',5);
  for(const [i,s] of body.stagnation.entries()){
    const q=screen(s.x,s.y);bg.lineWidth=1.5;circle(bg,q.x,q.y,4,'#ffe7aa','#19252e');
    bg.fillStyle='#ffe7aa';bg.textAlign='left';bg.fillText('S'+(body.stagnation.length>1?i+1:''),q.x+8,q.y+17);
  }
}
function rebuild(){
  bg.clearRect(0,0,width,height);
  if(scalar!=='none')heatmap(sampleMesh(7));
  if(layers.grid)grid();
  if(layers.potentials)drawCurves('phi');
  if(layers.streams)drawCurves('psi');
  if(layers.arrows){for(let y=75;y<height-40;y+=40)for(let x=25;x<width-20;x+=40){const p=world(x,y),f=field.at(p.x,p.y,CORE);if(f)arrow(bg,x,y,f.u,-f.v,17,'#c9dbe05e');}}
  drawBody();dirty=false;
}
function particle(){
  let p;
  const sources=field.parts.filter(e=>e.type==='source'&&e.strength>0);
  if(sources.length&&Math.random()<.45){const e=sources[Math.floor(Math.random()*sources.length)],a=Math.random()*TAU;p={x:e.x+CORE*1.2*Math.cos(a),y:e.y+CORE*1.2*Math.sin(a)};}
  else{
    for(let attempt=0;attempt<40;attempt++){p=world(Math.random()*width,Math.random()*height);if(field.at(p.x,p.y,CORE))break;}
  }
  return {...p,age:Math.random()*2,life:3+Math.random()*5,trail:[]};
}
function drawParticles(dt){
  if(!field.parts.length&&!uniform.speed)return;
  const amount=Math.round(Math.min(240,width*height/2600));
  while(particles.length<amount)particles.push(particle());
  ctx.lineWidth=1.35;
  for(let i=0;i<particles.length;i++){
    let p=particles[i];if(!field.at(p.x,p.y,CORE)){particles[i]=particle();continue;}const previous={x:p.x,y:p.y};
    if(!paused){
      let left=dt,steps=0,valid=true;
      while(left>1e-6&&steps++<30){
        const f=field.at(p.x,p.y,CORE);if(!f||f.speed<1e-6){valid=false;break;}
        const step=Math.min(left,.035/Math.max(f.speed,.001)),next=advance(field,p.x,p.y,step);
        if(!next){valid=false;break;}p.x=next.x;p.y=next.y;left-=step;
      }
      const s=screen(p.x,p.y);p.age+=dt;
      if(!valid||left>1e-6||p.age>p.life||s.x<0||s.x>width||s.y<0||s.y>height){particles[i]=particle();continue;}
      p.trail.push(previous);if(p.trail.length>9)p.trail.shift();
    }
    const s=screen(p.x,p.y),opacity=Math.min(1,p.age*2,(p.life-p.age)*2);
    ctx.strokeStyle=`rgba(151,236,222,${opacity*.45})`;ctx.beginPath();p.trail.forEach((q,k)=>{const t=screen(q.x,q.y);if(!k)ctx.moveTo(t.x,t.y);else ctx.lineTo(t.x,t.y);});ctx.lineTo(s.x,s.y);ctx.stroke();
    ctx.fillStyle=`rgba(199,255,242,${opacity*.8})`;ctx.beginPath();ctx.arc(s.x,s.y,1.3,0,TAU);ctx.fill();
  }
}
function circle(context,x,y,r,stroke,fill){context.beginPath();context.arc(x,y,r,0,TAU);if(fill){context.fillStyle=fill;context.fill();}if(stroke){context.strokeStyle=stroke;context.stroke();}}
function marker(e,x,y,type,strength,small=false){
  const p=screen(x,y),color=palette[type],r=small?10:13;
  ctx.save();ctx.globalAlpha=e.enabled?1:.4;ctx.lineWidth=1.5;
  if(e.enabled&&strength!==0)circle(ctx,p.x,p.y,CORE*scale(),null,'#0b111ce8');
  if(e.id===selected){ctx.lineWidth=1;circle(ctx,p.x,p.y,r+5,color,null);ctx.lineWidth=1.5;}
  circle(ctx,p.x,p.y,r,color,'#14212c');ctx.fillStyle=color;ctx.font=`${small?15:20}px "Segoe UI",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(type==='vortex'&&strength<0?'↻':symbols[type],p.x,p.y-1);
  if(!small){ctx.font='12px Consolas,monospace';ctx.textAlign='left';ctx.fillStyle='#d0dfe9';ctx.fillText(signature(e)+' '+fmt(strength,1),p.x+21,p.y-14);}
  ctx.restore();
}
function drawElements(){
  if(body){
    const p=screen(body.x,body.y);ctx.font='22px "Segoe UI",sans-serif';ctx.textAlign='center';ctx.fillStyle='#b99aff';
    ctx.fillText(body.gamma<0?'↻':body.gamma>0?'↺':'⇄',p.x,p.y-4);
    ctx.font='12px Consolas,monospace';ctx.fillStyle='#acc7d4';ctx.fillText('μ + Γ',p.x,p.y+17);return;
  }
  for(const e of elements){
    if(e.type==='pair'){
      const a=rad(e.angle),dx=e.separation/2*Math.cos(a),dy=e.separation/2*Math.sin(a),p=screen(e.x-dx,e.y-dy),q=screen(e.x+dx,e.y+dy),center=screen(e.x,e.y);
      ctx.strokeStyle='#98b2bd80';ctx.lineWidth=1;ctx.setLineDash([3,4]);line(ctx,p.x,p.y,q.x,q.y);ctx.setLineDash([]);
      const strength=e.lockMoment?e.moment/e.separation:e.strength;
      marker(e,e.x+dx,e.y+dy,strength<0?'sink':'source',strength,true);marker(e,e.x-dx,e.y-dy,strength<0?'source':'sink',-strength,true);
      circle(ctx,center.x,center.y,5,e.id===selected?'#e6f3e8':'#8aa6b4','#18242e');
      ctx.fillStyle='#b9ced9';ctx.font='12px Consolas,monospace';ctx.textAlign='center';ctx.fillText('d = '+fmt(e.separation),center.x,center.y+29);
    }else marker(e,e.x,e.y,typeOf(e),e.strength);
    if(e.type==='doublet'){const p=screen(e.x,e.y),a=rad(e.angle);arrow(ctx,p.x,p.y+30,Math.cos(a),-Math.sin(a),25,palette.doublet);}
  }
}
function drawProbe(){
  const p=screen(probe.x,probe.y),f=field.at(probe.x,probe.y,CORE);
  ctx.lineWidth=1;ctx.strokeStyle='#ebf6ff';circle(ctx,p.x,p.y,6,'#ecf8ff','#132a39');
  line(ctx,p.x-10,p.y,p.x-4,p.y);line(ctx,p.x+4,p.y,p.x+10,p.y);line(ctx,p.x,p.y-10,p.x,p.y-4);line(ctx,p.x,p.y+4,p.x,p.y+10);
  ctx.font='bold 12px Consolas,monospace';ctx.fillStyle='#e7f4fc';ctx.textAlign='left';ctx.fillText('P',p.x+12,p.y+17);
  if(f&&f.speed>1e-7){const norm=f.speed;arrow(ctx,p.x+f.u/norm*23,p.y-f.v/norm*23,f.u,-f.v,29,'#f0f9ff',5);}
}
function drawLoop(){
  if(!loop)return;const p=screen(loop.x,loop.y),r=loop.r*scale();ctx.lineWidth=1.6;ctx.setLineDash([6,5]);circle(ctx,p.x,p.y,r,'#f5d782');ctx.setLineDash([]);circle(ctx,p.x,p.y,4,'#f5d782','#27302e');circle(ctx,p.x+r,p.y,5,'#f5d782','#27302e');
  arrow(ctx,p.x,p.y-r,-1,0,20,'#f5d782',5);ctx.font='12px Consolas,monospace';ctx.textAlign='left';ctx.fillStyle='#f5d782';ctx.fillText('C · R = '+fmt(loop.r)+' m',p.x+8,p.y-r-10);
}
function frame(time){
  frameId=requestAnimationFrame(frame);if(document.hidden){lastTime=time;return;}
  const dt=Math.min((time-lastTime)/1000||0,.045);lastTime=time;
  if(dirty)rebuild();ctx.clearRect(0,0,width,height);ctx.drawImage(base,0,0,width,height);
  if(layers.particles)drawParticles(dt);drawLoop();drawElements();if(layers.probe)drawProbe();
}

// Events and keyboard equivalents.
document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
$('preset').addEventListener('change',()=>preset($('preset').value));$('reset').addEventListener('click',()=>preset($('preset').value));
$('add-center').addEventListener('click',()=>addElement(tool,view.x,view.y));
function numeric(id,fn,min,max,event='input'){
  $(id).addEventListener(event,()=>{const raw=$(id).value;if(raw.trim()==='')return;const n=Number(raw);if(!Number.isFinite(n))return;const v=clamp(n,min,max);fn(v);if(n!==v)$(id).value=v;});
  if($(id).type==='number')$(id).addEventListener('blur',()=>{if(!$(id).value||!Number.isFinite(Number($(id).value))){syncInspector();syncCylinder();}});
}
function updateElement(fn,source){const e=selectedElement();if(!e)return;fn(e);recompute();syncList();
  // Avoid replacing the focused number field while typing a decimal.
  const active=document.activeElement,value=active?.value;syncInspector();if(source&&active?.id===source)active.value=value;
  $('scene-name').textContent='自由组合';
}
for(const id of ['strength-range','strength-number'])numeric(id,v=>updateElement(e=>{if(e.type==='pair'&&e.lockMoment)e.moment=v;else e.strength=v;},id),-1e6,1e6);
for(const axis of ['x','y'])numeric('element-'+axis,v=>updateElement(e=>e[axis]=v,'element-'+axis),-100,100);
for(const id of ['element-angle','angle-range'])numeric(id,v=>updateElement(e=>e.angle=v,id),-180,180);
for(const id of ['separation-number','separation-range'])numeric(id,v=>updateElement(e=>e.separation=v,id),.04,8);
$('element-enabled').addEventListener('change',()=>updateElement(e=>e.enabled=$('element-enabled').checked));
$('lock-moment').addEventListener('change',()=>updateElement(e=>{const locked=$('lock-moment').checked;if(locked)e.moment=e.strength*e.separation;else e.strength=e.moment/e.separation;e.lockMoment=locked;}));
function removeSelected(){elements=elements.filter(e=>e.id!==selected);selected=elements.at(-1)?.id??null;syncAll();recompute();}
$('delete').addEventListener('click',removeSelected);
$('duplicate').addEventListener('click',()=>{const e=selectedElement();if(!e||elements.length>=16)return;const clone={...e,id:nextId++,x:e.x+.6,y:e.y+.6};elements.push(clone);selected=clone.id;syncAll();recompute();});
for(const id of ['uniform-speed','uniform-range'])numeric(id,v=>{uniform.speed=v;const other=id==='uniform-speed'?'uniform-range':'uniform-speed';if(v>Number($('uniform-range').max))$('uniform-range').max=v;$(other).value=v;recompute();},0,10);
numeric('uniform-angle',v=>{uniform.angle=v;recompute();},-180,180);
numeric('loop-radius',v=>{if(loop){loop.r=v;syncLoop();}},.15,20);
$('hide-loop').addEventListener('click',()=>{loop=null;syncLoop();if(tool==='loop')setTool('select');});
for(const key of Object.keys(layers))$('show-'+key).addEventListener('change',()=>{layers[key]=$('show-'+key).checked;dirty=true;if(key==='particles')particles=[];});
$('background').addEventListener('change',()=>{scalar=$('background').value;$('speed-legend').hidden=scalar!=='speed';recompute();});
numeric('density',v=>{density=v;dirty=true;},6,18);
function pauseLabel(){$('pause').textContent=paused?'播放粒子':'暂停粒子';$('pause').setAttribute('aria-pressed',String(paused));}
$('pause').addEventListener('click',()=>{paused=!paused;pauseLabel();});pauseLabel();
function zoom(factor,anchor={x:width/2,y:height/2}){const before=world(anchor.x,anchor.y);view.span=clamp(view.span*factor,2,60);const after=world(anchor.x,anchor.y);view.x+=before.x-after.x;view.y+=before.y-after.y;dirty=true;particles=[];}
numeric('cylinder-radius',v=>{if(body)changeCylinder(v,body.lambda);},.15,10);
for(const id of ['cylinder-ratio','cylinder-range'])numeric(id,v=>{if(body)changeCylinder(body.radius,v);},-10,10);
document.querySelectorAll('[data-regime]').forEach(b=>b.addEventListener('click',()=>{if(body)changeCylinder(body.radius,(Math.sign(body.lambda)||1)*Number(b.dataset.regime));}));
$('zoom-in').addEventListener('click',()=>zoom(.8));$('zoom-out').addEventListener('click',()=>zoom(1.25));$('fit').addEventListener('click',()=>{view=body?{x:body.x,y:body.y-.6*body.radius,span:9*body.radius}:{x:0,y:0,span:12};dirty=true;particles=[];});
canvas.addEventListener('wheel',event=>{event.preventDefault();const r=canvas.getBoundingClientRect();zoom(Math.exp(clamp(event.deltaY,-200,200)*.0015),{x:event.clientX-r.left,y:event.clientY-r.top});},{passive:false});
function eventPoint(event){const r=canvas.getBoundingClientRect();return {x:event.clientX-r.left,y:event.clientY-r.top};}
function hitElement(p){
  let best=null,distance=24;
  for(const e of elements){const points=[screen(e.x,e.y)];if(e.type==='pair'){const a=rad(e.angle);for(const s of [-1,1])points.push(screen(e.x+s*e.separation/2*Math.cos(a),e.y+s*e.separation/2*Math.sin(a)));}
    const d=Math.min(...points.map(q=>Math.hypot(q.x-p.x,q.y-p.y)));
    if(d<distance){distance=d;best=e;}}
  return best;
}
canvas.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;event.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(event.pointerId);
  const p=eventPoint(event),w=world(p.x,p.y);
  if(['source','sink','vortex','doublet','pair'].includes(tool)){addElement(tool,w.x,w.y);return;}
  if(tool==='probe'){probe=w;drag={type:'probe'};updateProbe();return;}
  if(tool==='loop'){
    const c=loop?screen(loop.x,loop.y):null,d=c?Math.hypot(p.x-c.x,p.y-c.y):Infinity;
    if(loop&&d<14)drag={type:'loop-center',dx:w.x-loop.x,dy:w.y-loop.y};
    else if(loop&&Math.abs(d-loop.r*scale())<14)drag={type:'loop-radius'};
    else{loop={...w,r:.15};drag={type:'loop-radius'};}
    syncLoop();return;
  }
  const e=hitElement(p);
  if(e){selected=e.id;drag={type:'element',dx:w.x-e.x,dy:w.y-e.y};syncInspector();syncList();canvas.style.cursor='grabbing';return;}
  const pp=screen(probe.x,probe.y);
  if(layers.probe&&Math.hypot(p.x-pp.x,p.y-pp.y)<15){drag={type:'probe'};return;}
  selected=null;syncInspector();syncList();drag={type:'pan',start:p,x:view.x,y:view.y};canvas.style.cursor='grabbing';
});
canvas.addEventListener('pointermove',event=>{
  if(!drag)return;const p=eventPoint(event),w=world(p.x,p.y);
  if(drag.type==='element'){const e=selectedElement();if(e){e.x=clamp(w.x-drag.dx,-100,100);e.y=clamp(w.y-drag.dy,-100,100);syncInspector();recompute();}}
  if(drag.type==='probe'){probe=w;updateProbe();}
  if(drag.type==='pan'){view.x=drag.x-(p.x-drag.start.x)/scale();view.y=drag.y+(p.y-drag.start.y)/scale();dirty=true;particles=[];}
  if(drag.type==='loop-center'){loop.x=w.x-drag.dx;loop.y=w.y-drag.dy;syncLoop();}
  if(drag.type==='loop-radius'){loop.r=clamp(Math.hypot(w.x-loop.x,w.y-loop.y),.15,20);syncLoop();}
});
function release(){drag=null;canvas.style.cursor=tool==='select'?'grab':'crosshair';}
canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
canvas.addEventListener('keydown',event=>{
  const e=selectedElement(),delta=event.shiftKey?.5:.1;
  if(event.key==='Delete'||event.key==='Backspace'){if(e){event.preventDefault();removeSelected();}}
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)&&e){event.preventDefault();if(event.key==='ArrowLeft')e.x-=delta;if(event.key==='ArrowRight')e.x+=delta;if(event.key==='ArrowUp')e.y+=delta;if(event.key==='ArrowDown')e.y-=delta;syncInspector();recompute();}
  if(event.key==='Enter'&&['source','sink','vortex','doublet','pair'].includes(tool))addElement(tool,view.x,view.y);
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){release();setTool('select');}});
document.addEventListener('visibilitychange',()=>{lastTime=performance.now();});
window.addEventListener('pagehide',()=>cancelAnimationFrame(frameId));
window.addEventListener('pageshow',event=>{if(event.persisted){lastTime=0;frameId=requestAnimationFrame(frame);}});
new ResizeObserver(resize).observe($('canvas-wrap'));
const initial=new URLSearchParams(location.search).get('scene');
if(initial==='cylinder')$('preset').value='cylinder';
preset(initial==='cylinder'?'cylinder':'default');resize();frameId=requestAnimationFrame(frame);
