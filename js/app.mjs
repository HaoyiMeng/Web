import { area, THROAT_X, LIMITS, solveNozzle } from './nozzle.mjs';
const $ = id => document.getElementById(id);
const svgEl = (tag, attrs={}, text='') => {
  const e = document.createElementNS('http://www.w3.org/2000/svg',tag);
  Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));
  if(text) e.textContent=text;
  return e;
};
const fixed=(n,d=3)=>Number(n).toFixed(d);
const MODE = {
 'subsonic':{badge:'SUBSONIC · UNCHOKED',desc:'背压足够高，流动未阻塞。整个喷管内都是亚声速，喉部马赫数小于 1，喷口静压与背压相同。'},
 'internal-shock':{badge:'CHOKED · NORMAL SHOCK',desc:'喉部阻塞，扩张段上游超声速；内部正激波使流动突然变回亚声速，激波位置由背压决定。正激波引起总压损失。'},
 'supersonic-exit':{badge:'CHOKED · SUPERSONIC EXIT',desc:'喉部阻塞，扩张段维持超声速。喷管内由几何和总压决定出口状态；背压差异会影响外部射流，不在本模型中计算。'},
};
const X = x => 47 + x * 628;
const yWall = x => 38 + (area(x)-1)*26;
function renderNozzle(state){
  const svg=$('nozzle-diagram');svg.replaceChildren();
  const defs=svgEl('defs');const grad=svgEl('linearGradient',{id:'flow-gradient',x1:'0%',x2:'100%'});
  [['0%','#538aa8'],['38%','#9e93de'],['80%','#d0f1b0'],['100%','#d0f1b0']].forEach(([o,c])=>grad.append(svgEl('stop',{offset:o,'stop-color':c})));
  defs.append(grad);svg.append(defs);
  const samples=Array.from({length:100},(_,i)=>i/99);
  const top=samples.map((x,i)=>`${i?'L':'M'}${X(x).toFixed(2)} ${(116-yWall(x)).toFixed(2)}`).join(' ');
  const bottom=samples.slice().reverse().map(x=>`L${X(x).toFixed(2)} ${(116+yWall(x)).toFixed(2)}`).join(' ');
  svg.append(svgEl('path',{d:`${top} ${bottom} Z`,fill:'url(#flow-gradient)','fill-opacity':'.24'}));
  svg.append(svgEl('path',{d:top,fill:'none',stroke:'#d6e3e5','stroke-width':1.8}));
  svg.append(svgEl('path',{d:'M'+X(0)+' '+(116+yWall(0))+' '+samples.slice(1).map(x=>`L${X(x).toFixed(2)} ${(116+yWall(x)).toFixed(2)}`).join(' '),fill:'none',stroke:'#d6e3e5','stroke-width':1.8}));
  svg.append(svgEl('line',{x1:X(0)-8,y1:116,x2:X(1)+8,y2:116,stroke:'#abb9ba','stroke-width':1,'stroke-dasharray':'4 6',opacity:.6}));
  svg.append(svgEl('line',{x1:X(THROAT_X),y1:40,x2:X(THROAT_X),y2:200,stroke:'#d9f5b4','stroke-dasharray':'4 6',opacity:.7}));
  svg.append(svgEl('text',{x:X(THROAT_X),y:19,'font-size':10,'text-anchor':'middle',fill:'#d3e9c4','letter-spacing':'1.2'},'THROAT'));
  svg.append(svgEl('text',{x:X(0),y:224,'font-size':10,fill:'#a2aeb6'},'INLET'));
  svg.append(svgEl('text',{x:X(1),y:224,'font-size':10,fill:'#a2aeb6','text-anchor':'end'},'EXIT'));
  for (let i=0;i<6;i++){
    const x=.1+i*.16, len=15;
    if (state.shock && x>state.shock.x) continue;
    svg.append(svgEl('path',{d:`M${X(x)-len} 116 h${len*2} m-8 -5 l8 5 -8 5`,stroke:'#d7e9d5',fill:'none','stroke-width':1.1,opacity:.75}));
  }
  if(state.shock){const x=X(state.shock.x);
    svg.append(svgEl('line',{x1:x,y1:25,x2:x,y2:207,stroke:'#facd93','stroke-width':2,'stroke-dasharray':'6 5'}));
    svg.append(svgEl('text',{x,y:17,fill:'#facd93','font-size':10,'text-anchor':'middle'},'NORMAL SHOCK'));
  }
}
function plotPath(points,key,maxY,Y0=193,minY=21){
 return points.map((p,i)=>`${i?'L':'M'}${X(p.x).toFixed(2)} ${(Y0-(p[key]/maxY)*(Y0-minY)).toFixed(2)}`).join(' ');
}
function renderChart(state){
 const svg=$('flow-chart');svg.replaceChildren();
 const plotX=x=>38+466*x;const Y=v=>182-v/3.7*158;const PY=v=>182-v*158;
 for(let i=0;i<=4;i++){const y=24+i*39.5;
   svg.append(svgEl('line',{x1:38,y1:y,x2:504,y2:y,stroke:'#354048','stroke-width':.8}));
 }
 for(let i=0;i<=4;i++){const x=38+i*116.5;
   svg.append(svgEl('line',{x1:x,y1:24,x2:x,y2:182,stroke:'#2c363f','stroke-width':.8}));
 }
 const mkPath=(key,Yfun,color)=>{
  const d=state.points.map((p,i)=>`${i?'L':'M'}${plotX(p.x).toFixed(2)} ${Yfun(p[key]).toFixed(2)}`).join(' ');
  svg.append(svgEl('path',{d,fill:'none',stroke:color,'stroke-width':2.6,'stroke-linejoin':'round'}));
 };
 mkPath('mach',Y,'#d9f3ad');mkPath('pressure',PY,'#84bcf0');
 const xt=plotX(THROAT_X);
 svg.append(svgEl('line',{x1:xt,y1:24,x2:xt,y2:182,stroke:'#d6eab6','stroke-dasharray':'4 6',opacity:.6}));
 if(state.shock){const xs=plotX(state.shock.x);svg.append(svgEl('line',{x1:xs,y1:24,x2:xs,y2:182,stroke:'#f0ca9f','stroke-dasharray':'4 4',opacity:.7}));}
 [[0,'0'],[1,'1'],[2,'2'],[3,'3']].forEach(([v,label])=>svg.append(svgEl('text',{x:29,y:Y(v)+3,fill:'#84929b','font-size':10,'text-anchor':'end'},label)));
 svg.append(svgEl('text',{x:30,y:15,fill:'#a4b1bb','font-size':10},'M'));
 svg.append(svgEl('text',{x:510,y:15,fill:'#84bcf0','font-size':10,'text-anchor':'end'},'p/p₀'));
}
function renderPressure(pb){
 const state=solveNozzle(pb);
 $('pressure-output').textContent=fixed(pb);$('throat-mach').textContent=fixed(state.throatM,2);$('exit-mach').textContent=fixed(state.exitM,2);
 $('exit-pressure').textContent=fixed(state.exitPressure,3);$('shock-position').textContent=state.shock?`${Math.round(state.shock.x*100)}%`:'—';
 $('flow-badge').textContent=MODE[state.mode].badge;
 const extra=state.external==='overexpanded'?' 此时喷口静压高于还是低于背压？背压更高，外部需要压缩调整。':state.external==='underexpanded'?' 此时喷口静压高于背压，外部会发生膨胀调整。':'';
 $('flow-description').textContent=MODE[state.mode].desc+extra;
 document.querySelectorAll('[data-pressure]').forEach(b=>b.classList.toggle('active',Math.abs(Number(b.dataset.pressure)-pb)<.0001));
 renderNozzle(state);renderChart(state);
}
const SLIDER=$('back-pressure');SLIDER.addEventListener('input',()=>renderPressure(Number(SLIDER.value)));
document.querySelectorAll('[data-pressure]').forEach(btn=>btn.addEventListener('click',()=>{SLIDER.value=btn.dataset.pressure;renderPressure(Number(SLIDER.value));}));

const NOTES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const STRINGS=[{name:'G',pitch:7},{name:'D',pitch:2},{name:'A',pitch:9},{name:'E',pitch:4}];
const SCALES={major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],pentatonic:[0,3,5,7,10],chromatic:[0,1,2,3,4,5,6,7,8,9,10,11]};
const INTERVALS=['P1','m2','M2','m3','M3','P4','TT','P5','m6','M6','m7','M7'];
let currentSelection=null;
function renderFretboard(){
 const root=Number($('root-select').value),scale=$('scale-select').value, intervals=SCALES[scale], el=$('fretboard');el.replaceChildren();
 STRINGS.forEach((string,stringIdx)=>{
   const l=document.createElement('span');l.className='string-label';l.textContent=string.name;el.append(l);
   for(let fret=0;fret<=12;fret++){
     const note=(string.pitch+fret)%12,interval=(note-root+12)%12,active=intervals.includes(interval);
     const cell=document.createElement('div');cell.className='fret-cell'+(fret===0?' open':'');
     const b=document.createElement('button');b.type='button';b.className='note-dot'+(active?' in-scale':'')+(interval===0?' root':'');b.textContent=NOTES[note];
     b.setAttribute('aria-label',`${string.name} string, fret ${fret}, ${NOTES[note]}, interval ${INTERVALS[interval]}`);
     if(currentSelection && currentSelection.stringIdx===stringIdx && currentSelection.fret===fret)b.classList.add('selected');
     b.addEventListener('click',()=>{currentSelection={stringIdx,fret};$('note-readout').textContent=`${string.name} 弦 · 第 ${fret} 品 · ${NOTES[note]} · ${INTERVALS[interval]}`;renderFretboard();});
     cell.append(b);el.append(cell);
   }
 });
 let cap=document.querySelector('.fret-caption');if(!cap){cap=document.createElement('div');cap.className='fret-caption';el.after(cap);}cap.replaceChildren();
 for(let n=-1;n<=12;n++){const e=document.createElement('span');e.className='fret-num';e.textContent=n===-1?'':String(n);cap.append(e);}
 $('scale-notes').textContent='Scale notes: '+intervals.map(i=>NOTES[(root+i)%12]).join(' · ');
}
NOTES.forEach((name,i)=>{const option=document.createElement('option');option.value=i;option.textContent=name;$('root-select').append(option);});
$('root-select').value='0';
$('root-select').addEventListener('change',renderFretboard);$('scale-select').addEventListener('change',renderFretboard);
$('current-year').textContent=String(new Date().getFullYear());
renderPressure(Number(SLIDER.value));renderFretboard();
console.info('Haoyi Studio nozzle thresholds:',LIMITS);
