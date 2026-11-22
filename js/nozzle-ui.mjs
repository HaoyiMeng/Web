import {area, solveNozzle, DEFAULTS} from './nozzle.mjs';

const $ = id => document.getElementById(id);
const ns = 'http://www.w3.org/2000/svg';
const make = (tag, attrs = {}, text = '') => {
  const el = document.createElementNS(ns, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  if (text !== '') el.textContent = String(text);
  return el;
};
const fmt = (v, n = 2) => Number.isFinite(v) ? v.toFixed(n) : '—';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const SCENE_X = x => 47 + x * 628;
const PLOT_X = x => 46 + x * 454;
const MODES = {
  subsonic: ['SUBSONIC · UNCHOKED', '背压较高，喉部仍为亚声速，整个喷管内为等熵亚声速流动；出口静压等于背压。'],
  'internal-shock': ['CHOKED · NORMAL SHOCK', '喉部 M = 1，扩张段先加速为超声速，随后通过正激波回到亚声速；激波处静压跃升，总压下降。'],
  'supersonic-exit': ['CHOKED · SUPERSONIC EXIT', '喉部阻塞，扩张段维持超声速。出口状态由面积比及入口总态确定；喷管外调整未进行数值模拟。']
};
const QUANTITIES = {
  mach: ['Mach', ''],
  velocity: ['Velocity', 'm/s'],
  density: ['Density', 'kg/m³'],
  temperatureK: ['Static temperature', 'K'],
  totalPressureRatio: ['Stagnation pressure ratio', ''],
  massFlowKgS: ['Mass flow', 'kg/s']
};
const FIELDS = [
  'back-pressure', 'exit-area-ratio', 'inlet-area-ratio', 'throat-area',
  'nozzle-length', 'throat-location', 'total-pressure', 'total-temperature',
  'heat-ratio', 'gas-constant'
];
const START = {
  'back-pressure': .7, 'exit-area-ratio': DEFAULTS.exitAreaRatio,
  'inlet-area-ratio': DEFAULTS.inletAreaRatio, 'throat-area': DEFAULTS.throatAreaCm2,
  'nozzle-length': DEFAULTS.lengthM, 'throat-location': DEFAULTS.throatX,
  'total-pressure': DEFAULTS.totalPressureKPa, 'total-temperature': DEFAULTS.totalTemperatureK,
  'heat-ratio': DEFAULTS.gamma, 'gas-constant': DEFAULTS.gasConstant
};
const particles = Array.from({length:75}, (_, i) => ({
  x: (i * .61803398875) % 1,
  y: -0.85 + 1.7 * ((i * 37) % 79) / 78,
  node: null
}));
let current = null;
let animating = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let previousFrame = 0;

function config() {
  const get = id => Number(document.querySelector('[data-sync="' + id + '"]').value);
  return {
    exitAreaRatio: get('exit-area-ratio'),
    inletAreaRatio: get('inlet-area-ratio'),
    throatAreaCm2: get('throat-area'),
    lengthM: get('nozzle-length'),
    throatX: get('throat-location'),
    totalPressureKPa: get('total-pressure'),
    totalTemperatureK: get('total-temperature'),
    gamma: get('heat-ratio'),
    gasConstant: get('gas-constant')
  };
}
function pressureSetting() {
  return Number(document.querySelector('[data-sync="back-pressure"]').value);
}
function getProbeX() { return Number($('probe-location').value); }

function markerLine(svg, x, y1, y2, color, dash = '4 5', opacity = .7) {
  svg.append(make('line', {x1:x,y1,x2:x,y2,stroke:color,
    'stroke-width':1.1,'stroke-dasharray':dash,opacity}));
}
function linePath(points, xfn, yfn) {
  let result = '';
  for (let i=0; i<points.length; i++) {
    const p = points[i];
    result += (i ? 'L' : 'M') + xfn(p).toFixed(2) + ' ' + yfn(p).toFixed(2) + ' ';
  }
  return result;
}
function wallHeight(x) {
  if (!current) return 38;
  const ratio = area(x, current.config);
  const peak = Math.max(current.config.inletAreaRatio,current.config.exitAreaRatio);
  return 13 + 58 * Math.sqrt(ratio / peak);
}
function renderGeometry() {
  const svg = $('nozzle-diagram');
  svg.replaceChildren();
  const defs = make('defs');
  const gradient = make('linearGradient', {id:'nozzle-thermal-gradient',x1:'0%',x2:'100%'});
  [['0%','#7ca8db'],['45%','#9f9be5'],['100%','#d5f1ab']].forEach(([offset,color]) =>
    gradient.append(make('stop',{offset,'stop-color':color})));
  defs.append(gradient);
  svg.append(defs);
  const samples = Array.from({length:161},(_,i)=>i/160);
  const upper = linePath(samples,x=>SCENE_X(x),x=>117-wallHeight(x));
  const lower = linePath(samples.slice().reverse(),x=>SCENE_X(x),x=>117+wallHeight(x)).replace(/^M/,'L');
  svg.append(make('path',{d:upper+lower+'Z',fill:'url(#nozzle-thermal-gradient)',opacity:.25}));
  svg.append(make('path',{d:upper,stroke:'#d7e8e4',fill:'none','stroke-width':2}));
  svg.append(make('path',{d:linePath(samples,x=>SCENE_X(x),x=>117+wallHeight(x)),
    stroke:'#d7e8e4',fill:'none','stroke-width':2}));
  markerLine(svg,SCENE_X(0),117,117,'#90a6ae','5 8',.7);
  svg.append(make('line',{x1:SCENE_X(0)-6,x2:SCENE_X(1)+6,y1:117,y2:117,
    stroke:'#94acac','stroke-width':1,'stroke-dasharray':'5 7',opacity:.5}));
  markerLine(svg,SCENE_X(current.config.throatX),28,205,'#e0f4ad');
  svg.append(make('text',{x:SCENE_X(current.config.throatX),y:19,
    fill:'#d2efb8','font-size':10,'text-anchor':'middle','letter-spacing':1},'THROAT'));
  svg.append(make('text',{x:SCENE_X(0),y:225,fill:'#9babb4','font-size':10},'INLET'));
  svg.append(make('text',{x:SCENE_X(1),y:225,fill:'#9babb4','font-size':10,'text-anchor':'end'},'EXIT'));
  if (current.shock) {
    const x = SCENE_X(current.shock.x);
    svg.append(make('line',{x1:x,x2:x,y1:32,y2:202,
      stroke:'#f4c58f','stroke-width':2,'stroke-dasharray':'5 4'}));
    svg.append(make('text',{x,y:26,fill:'#f4c58f','font-size':10,'text-anchor':'middle'},'NORMAL SHOCK'));
  }
  const probeX = SCENE_X(getProbeX());
  markerLine(svg,probeX,42,198,'#ffffff','3 5',.8);
  svg.append(make('circle',{cx:probeX,cy:117,r:5,fill:'#f8fff2','fill-opacity':.85}));
  const dotGroup = make('g',{'aria-hidden':'true'});
  for (const p of particles) {
    p.node = make('circle',{r:1.8,fill:'#d6efff','fill-opacity':.7});
    dotGroup.append(p.node);
    positionParticle(p);
  }
  svg.append(dotGroup);
}
function positionParticle(p) {
  if (!p.node) return;
  p.node.setAttribute('cx',SCENE_X(p.x).toFixed(2));
  p.node.setAttribute('cy',(117 + p.y * wallHeight(p.x) * .86).toFixed(2));
}

function drawAxes(svg, yMax, unit, formatter) {
  const left = 46, right = 500, top = 18, bottom = 188;
  for (let i=0;i<=4;i++) {
    const y=bottom - i*(bottom-top)/4;
    svg.append(make('line',{x1:left,y1:y,x2:right,y2:y,stroke:'#334147','stroke-width':.85}));
    svg.append(make('text',{x:left-7,y:y+3,fill:'#98aab0','font-size':10,'text-anchor':'end'},
      formatter(yMax*i/4)));
  }
  for (let i=0;i<=4;i++) {
    const x=left + i*(right-left)/4;
    svg.append(make('line',{x1:x,y1:top,x2:x,y2:bottom,stroke:'#2b373e','stroke-width':.65}));
  }
  svg.append(make('text',{x:right,y:10,fill:'#b5c7c6','font-size':10,'text-anchor':'end'},unit));
  markerLine(svg,PLOT_X(current.config.throatX),top,bottom,'#cce4a5','4 5',.65);
  if(current.shock) markerLine(svg,PLOT_X(current.shock.x),top,bottom,'#f6ca9b','5 4',.85);
  markerLine(svg,PLOT_X(getProbeX()),top,bottom,'#ffffff','3 5',.5);
}
function drawChart(id, key, maxOverride = null) {
  const svg = $(id);
  svg.replaceChildren();
  const values=current.points.map(p=>p[key]);
  const maxValue=maxOverride || Math.max(1e-7,...values) * 1.09;
  const top=18,bottom=188;
  const y = p => bottom - clamp(p[key]/maxValue,0,1)*(bottom-top);
  const unit = id==='pressure-chart' ? 'p / p₀' :
    QUANTITIES[key][0] + (QUANTITIES[key][1] ? ' ('+QUANTITIES[key][1]+')' : '');
  const ticks = v => maxValue >= 100 ? fmt(v,0) : maxValue >= 10 ? fmt(v,1) :
    maxValue >= 1 ? fmt(v,2) : fmt(v,3);
  drawAxes(svg,maxValue,unit,ticks);
  if (id==='pressure-chart') {
    const by=bottom-current.pb/maxValue*(bottom-top);
    svg.append(make('line',{x1:46,y1:by,x2:500,y2:by,stroke:'#b2b9e0',
      'stroke-dasharray':'7 5',opacity:.85}));
    svg.append(make('text',{x:500,y:clamp(by-5,12,212),fill:'#bfc6ef',
      'text-anchor':'end','font-size':10},'pᵦ / p₀'));
  }
  svg.append(make('path',{d:linePath(current.points,p=>PLOT_X(p.x),y),
    fill:'none',stroke:id==='pressure-chart'?'#8ebfe9':'#d5f2a9',
    'stroke-width':2.4,'stroke-linejoin':'round'}));
}

function closestPoint(x) {
  const pts=current.points;
  let lo=0,hi=pts.length-1;
  while(lo<hi){const mid=(lo+hi)>>1;if(pts[mid].x<x)lo=mid+1;else hi=mid;}
  if(lo===0)return pts[0];
  if(lo===pts.length)return pts[pts.length-1];
  const a=pts[lo-1],b=pts[lo],w=(x-a.x)/(b.x-a.x || 1);
  return {velocity:a.velocity+(b.velocity-a.velocity)*clamp(w,0,1)};
}
function updateProbe() {
  if (!current) return;
  const x=getProbeX();
  const p=current.evaluate(x,'downstream');
  $('probe-position').textContent='x/L = '+fmt(x,3)+'  ·  x = '+fmt(x*current.config.lengthM,3)+' m';
  $('probe-mach').textContent=fmt(p.mach,3);
  $('probe-pressure').textContent=fmt(p.pressureKPa,2);
  $('probe-temperature').textContent=fmt(p.temperatureK,1);
  $('probe-velocity').textContent=fmt(p.velocity,1);
  $('probe-density').textContent=fmt(p.density,3);
  $('probe-total').textContent=fmt(p.totalPressureKPa,2);
}
function updateReadouts() {
  const p=current.evaluate(1,'downstream');
  $('throat-mach').textContent=fmt(current.throatM,3);
  $('exit-mach').textContent=fmt(current.exitM,3);
  $('exit-pressure').textContent=fmt(p.pressureKPa,2);
  $('mass-flow').textContent=fmt(current.massFlowKgS,4);
  $('exit-velocity').textContent=fmt(p.velocity,0);
  $('exit-temperature').textContent=fmt(p.temperatureK,1);
  $('shock-position').textContent=current.shock ? fmt(current.shock.x,3) : '—';
  $('pressure-loss').textContent=current.shock ? fmt(100*(1-current.shock.p02p01),2) : '0.00';
  $('gamma-label').textContent='γ = '+fmt(current.config.gamma,2);
  $('flow-badge').textContent=MODES[current.mode][0];
  const external = current.external==='overexpanded' ? ' 喷口过膨胀：pₑ < pᵦ，喷管外需压缩调整。'
    :current.external==='underexpanded' ? ' 喷口欠膨胀：pₑ > pᵦ，喷管外需膨胀调整。'
    :current.external==='design' ? ' 喷口静压与环境匹配（设计工况）。' : '';
  $('flow-description').textContent=MODES[current.mode][1]+external;
  $('choke-limit').textContent=fmt(current.limits.chokeBackPressure,4);
  $('shock-limit').textContent=fmt(current.limits.shockAtExitBackPressure,4);
  $('design-limit').textContent=fmt(current.limits.designBackPressure,4);
  const targets=presetPressures();
  document.querySelectorAll('[data-regime]').forEach(btn=>{
    const r=targets[btn.dataset.regime];
    btn.classList.toggle('active',Math.abs(r-current.pb)<.00055);
  });
}
function renderAll() {
  if(!$('back-pressure'))return;
  try {
    current=solveNozzle(pressureSetting(),221,config());
    updateReadouts();
    updateProbe();
    renderGeometry();
    drawChart('pressure-chart','pressure',1.02);
    drawChart('flow-chart',$('quantity-selector').value);
  } catch(err) {
    console.error('Nozzle model:',err);
    $('flow-badge').textContent='INVALID PARAMETERS';
    $('flow-description').textContent=String(err.message||err);
    current=null;
  }
}
function presetPressures() {
  const lim=current?.limits;
  if(!lim)return {};
  return {
    subsonic: (1+lim.chokeBackPressure)/2,
    internal: (lim.chokeBackPressure+lim.shockAtExitBackPressure)/2,
    'exit-shock': lim.shockAtExitBackPressure,
    design:lim.designBackPressure,
    under:Math.max(.002,lim.designBackPressure*.6)
  };
}
function setField(id,value) {
  const slider=$(id);
  const num=document.querySelector('[data-sync="'+id+'"]');
  const bounded=clamp(value,Number(num.min),Number(num.max));
  num.value=String(Number(bounded.toFixed(5)));
  slider.value=String(bounded);
}

function animate(ts) {
  if (!previousFrame) previousFrame=ts;
  const delta=clamp((ts-previousFrame)/1000,0,.04);
  previousFrame=ts;
  if (animating && current && !document.hidden) {
    const slowdown=Number($('animation-rate').value)||1000;
    for (const particle of particles) {
      const v=closestPoint(particle.x).velocity;
      particle.x += v*delta/(current.config.lengthM*slowdown);
      if (particle.x>1) particle.x-=Math.floor(particle.x);
      positionParticle(particle);
    }
  }
  requestAnimationFrame(animate);
}

if ($('back-pressure')) {
  for (const id of FIELDS) {
    const slider=$(id), number=document.querySelector('[data-sync="'+id+'"]');
    slider.addEventListener('input',()=>{
      number.value=slider.value;
      renderAll();
    });
    number.addEventListener('input',()=>{
      if(number.value!=='' && number.validity.valid){
        slider.value=number.value;
        renderAll();
      }
    });
    number.addEventListener('change',()=>{
      const value=Number(number.value);
      setField(id,Number.isFinite(value)?value:START[id]);
      renderAll();
    });
  }
  $('reset-nozzle').addEventListener('click',()=>{
    for(const [id,value] of Object.entries(START))setField(id,value);
    $('probe-location').value='.65';
    $('quantity-selector').value='mach';
    renderAll();
  });
  document.querySelectorAll('[data-regime]').forEach(button=>{
    button.addEventListener('click',()=>{
      const v=presetPressures()[button.dataset.regime];
      if(Number.isFinite(v)){
        setField('back-pressure',v);
        renderAll();
      }
    });
  });
  $('quantity-selector').addEventListener('change',()=>{
    if(current)drawChart('flow-chart',$('quantity-selector').value);
  });
  $('probe-location').addEventListener('input',()=>{
    if(!current)return;
    updateProbe();
    renderGeometry();
    drawChart('pressure-chart','pressure',1.02);
    drawChart('flow-chart',$('quantity-selector').value);
  });
  $('nozzle-diagram').addEventListener('pointerdown',event=>{
    const rect=event.currentTarget.getBoundingClientRect();
    const scaledX=(event.clientX-rect.left)/rect.width*720;
    $('probe-location').value=String(clamp((scaledX-47)/628,0,1));
    $('probe-location').dispatchEvent(new Event('input'));
  });
  const pause=$('particle-toggle');
  const setPause=()=>{
    pause.textContent=animating?'暂停动画':'继续动画';
    pause.setAttribute('aria-pressed',String(!animating));
  };
  pause.addEventListener('click',()=>{animating=!animating;setPause();});
  setPause();
  renderAll();
  requestAnimationFrame(animate);
}
