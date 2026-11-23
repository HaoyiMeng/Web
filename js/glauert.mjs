// Glauert thin-airfoil teaching model: parabolic mean camber, zero thickness.
// Positive gamma = u_upper - u_lower; all angles are converted to radians.
export const rad = degrees => degrees*Math.PI/180;
export function coefficients(alphaDeg,camberPercent){
  const alpha=rad(alphaDeg),m=camberPercent/100;
  return {alpha,m,A0:alpha,A1:4*m,alphaIdeal:0,alphaZeroLift:-2*m,
    cl:2*Math.PI*(alpha+2*m),circulation:Math.PI*(alpha+2*m)};
}
export function distribution(X,alphaDeg,camberPercent){
  if(!(X>0 && X<1)) return null;
  const {A0,A1}=coefficients(alphaDeg,camberPercent);
  const alphaPart=2*A0*Math.sqrt((1-X)/X);
  const camberPart=4*A1*Math.sqrt(X*(1-X));
  const total=alphaPart+camberPart;
  return {alphaPart,camberPart,total,deltaCp:2*total};
}
export const meanCamber=(X,camberPercent)=>4*(camberPercent/100)*X*(1-X);
const $=id=>document.getElementById(id);
const fmt=(n,d=3)=>(Math.abs(n)<.5*10**-d?0:n).toFixed(d);
const pt=(x,y)=>x.toFixed(2)+' '+y.toFixed(2);
const MARKUP_COLORS={total:'#69d9cc',alphaPart:'#b5a1f3',camberPart:'#f1ce8d'};
function niceStep(value){
  const exponent=Math.floor(Math.log10(Math.max(value,1e-6)));
  const base=10**exponent,ratio=value/base;
  return (ratio<=1?1:ratio<=2?2:ratio<=2.5?2.5:ratio<=5?5:10)*base;
}
function chartLimits(samples){
  const peak=Math.max(.08,...samples.flatMap(v=>[Math.abs(v.total),Math.abs(v.alphaPart),Math.abs(v.camberPart)]));
  return 2*niceStep(peak*1.06/2);
}
function lineFor(xs,ys,key,xMap,yMap){
  return xs.map((x,i)=>(i===0?'M':'L')+pt(xMap(x),yMap(ys[i][key]))).join(' ');
}
function renderSheetChart(alpha,camber,probe){
  const svg=$('g-plot');
  if(!svg)return;
  const W=720,H=320,L=69,R=24,T=29,B=50;
  const xMap=x=>L+x*(W-L-R);
  const xs=Array.from({length:249},(_,i)=>.01+i*.98/248);
  const samples=xs.map(X=>distribution(X,alpha,camber));
  const bound=chartLimits(samples);
  const yMap=y=>T+(bound-y)/(2*bound)*(H-T-B);
  const zero=yMap(0);
  let markup='<defs><linearGradient id="g-sheet-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#69d9cc" stop-opacity=".22"/><stop offset=".5" stop-color="#69d9cc" stop-opacity=".08"/><stop offset="1" stop-color="#69d9cc" stop-opacity=".02"/></linearGradient><clipPath id="g-sheet-clip"><rect x="'+L+'" y="'+T+'" width="'+(W-L-R)+'" height="'+(H-T-B)+'"/></clipPath></defs>';
  // Scaled grid axes with fixed physical sign: upward gamma positive.
  for(let i=-2;i<=2;i++){
    const value=bound*i/2, yy=yMap(value);
    markup+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'" stroke="'+(i===0?'#7d9c9d':'#324651')+'" stroke-width="'+(i===0?1.5:1)+'"'+(i===0?'':' stroke-dasharray="4 7"')+'/>';
    markup+='<text x="'+(L-11)+'" y="'+(yy+4)+'" text-anchor="end" fill="#abc4c7">'+fmt(value,2)+'</text>';
  }
  for(let i=0;i<=4;i++){
    const X=i/4,xx=xMap(X);
    markup+='<line x1="'+xx+'" y1="'+T+'" x2="'+xx+'" y2="'+(H-B)+'" stroke="#2c414c" stroke-width="1" stroke-dasharray="3 8"/>';
    markup+='<text x="'+xx+'" y="'+(H-24)+'" text-anchor="middle">'+X.toFixed(2)+'</text>';
  }
  markup+='<text x="'+L+'" y="18" font-size="13" font-weight="650" fill="#c8e4df">γ / U∞</text>';
  markup+='<text x="'+(W-R)+'" y="'+(H-6)+'" font-size="12" text-anchor="end">X = x/c</text>';
  markup+='<g clip-path="url(#g-sheet-clip)">';
  const totalLine=lineFor(xs,samples,'total',xMap,yMap);
  // Filled integral area (positive and negative are both rendered against gamma=0).
  const area='M'+pt(xMap(xs[0]),zero)+' '+xs.map((X,i)=>'L'+pt(xMap(X),yMap(samples[i].total))).join(' ')+' L'+pt(xMap(xs[xs.length-1]),zero)+' Z';
  markup+='<path d="'+area+'" fill="url(#g-sheet-gradient)"/>';
  markup+='<path d="'+lineFor(xs,samples,'alphaPart',xMap,yMap)+'" fill="none" stroke="'+MARKUP_COLORS.alphaPart+'" stroke-width="2.2" stroke-dasharray="8 6" vector-effect="non-scaling-stroke"/>';
  markup+='<path d="'+lineFor(xs,samples,'camberPart',xMap,yMap)+'" fill="none" stroke="'+MARKUP_COLORS.camberPart+'" stroke-width="2.2" stroke-dasharray="2 7" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
  markup+='<path d="'+totalLine+'" fill="none" stroke="'+MARKUP_COLORS.total+'" stroke-width="3.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
  const v=distribution(probe,alpha,camber);
  const pX=xMap(probe);
  markup+='<line x1="'+pX+'" x2="'+pX+'" y1="'+T+'" y2="'+(H-B)+'" stroke="#b8dbd5" stroke-width="1.4" stroke-dasharray="4 4"/>';
  for(const key of ['alphaPart','camberPart','total']){
    markup+='<circle cx="'+pX+'" cy="'+yMap(v[key])+'" r="'+(key==='total'?5.8:4)+'" fill="'+MARKUP_COLORS[key]+'" stroke="#0f1c24" stroke-width="2"/>';
  }
  markup+='</g>';
  const labelSide=probe>.72?'end':'start';
  const labelX=probe>.72?pX-12:pX+12;
  markup+='<text x="'+labelX+'" y="'+(T+15)+'" text-anchor="'+labelSide+'" font-size="12" fill="#d8f7ed">X = '+fmt(probe,3)+'</text>';
  svg.innerHTML=markup;
  svg.setAttribute('aria-label','Glauert 分布 γ/U∞。当前 α='+fmt(alpha,2)+' 度，弯度比 '+fmt(camber,2)+'%，观察点 x/c='+fmt(probe,3)+'，γ/U∞='+fmt(v.total,3));
}
function renderGeometry(camber,probe){
  const svg=$('g-camber-plot');
  if(!svg)return;
  const W=720,H=180,L=69,R=24,center=94;
  const xMap=x=>L+x*(W-L-R),yMap=y=>center-1150*y;
  const xs=Array.from({length:101},(_,i)=>i/100);
  const path='M'+xs.map(X=>pt(xMap(X),yMap(meanCamber(X,camber)))).join(' L');
  const baseline=center,peak=meanCamber(.5,camber);
  const px=xMap(probe),py=yMap(meanCamber(probe,camber));
  let markup='<rect x="'+L+'" y="22" width="'+(W-L-R)+'" height="130" rx="4" fill="#0d1a23"/>';
  for(const val of [-.05,-.025,0,.025,.05]){
    const Y=yMap(val);
    markup+='<line x1="'+L+'" y1="'+Y+'" x2="'+(W-R)+'" y2="'+Y+'" stroke="'+(val===0?'#91a9a9':'#2c4550')+'" stroke-width="'+(val===0?1.5:1)+'" stroke-dasharray="'+(val===0?'none':'3 7')+'"/>';
  }
  for(const X of [0,.25,.5,.75,1]){
    markup+='<text x="'+xMap(X)+'" y="166" text-anchor="middle" fill="#9eb9c1" font-size="11">'+fmt(X,2)+'</text>';
  }
  markup+='<path d="M'+pt(xMap(0),baseline)+' '+xs.map(X=>'L'+pt(xMap(X),yMap(meanCamber(X,camber)))).join(' ')+' L'+pt(xMap(1),baseline)+'Z" fill="#69d9cc" fill-opacity=".10"/>';
  markup+='<path d="'+path+'" fill="none" stroke="#69d9cc" stroke-width="3.2" stroke-linejoin="round"/>';
  markup+='<line x1="'+xMap(.5)+'" y1="'+baseline+'" x2="'+xMap(.5)+'" y2="'+yMap(peak)+'" stroke="#f1ce8d" stroke-width="2"/>';
  markup+='<circle cx="'+px+'" cy="'+py+'" r="5.6" fill="#f1ce8d" stroke="#0d1c24" stroke-width="2"/>';
  markup+='<line x1="'+px+'" x2="'+px+'" y1="22" y2="151" stroke="#f1ce8d" stroke-width="1" stroke-dasharray="4 5"/>';
  markup+='<text x="'+L+'" y="16" font-size="12" fill="#c8e4df">yₘ/c</text>';
  markup+='<text x="'+(W-R)+'" y="16" font-size="12" text-anchor="end" fill="#b9cfcf">m = '+fmt(camber,1)+'% · Xₘₐₓ = 0.5</text>';
  svg.innerHTML=markup;
  svg.setAttribute('aria-label','中弧线 y_m/c=4mX(1-X)，最大弯度 '+fmt(camber,2)+'%，当前测量点 x/c='+fmt(probe,3));
}
function render(){
  const alpha=Number($('g-alpha').value),camber=Number($('g-camber').value),probe=Number($('g-probe').value);
  const coeff=coefficients(alpha,camber),v=distribution(probe,alpha,camber);
  $('g-alpha-val').textContent=fmt(alpha,2)+'°';
  $('g-camber-val').textContent=fmt(camber,1)+'%';
  $('g-probe-val').textContent=fmt(probe,3);
  $('g-a0').textContent=fmt(coeff.A0,4);
  $('g-a1').textContent=fmt(coeff.A1,4);
  $('g-cl').textContent=fmt(coeff.cl,3);
  $('g-circulation').textContent=fmt(coeff.circulation,3);
  $('g-ideal').textContent=fmt(coeff.alphaIdeal*180/Math.PI,2)+'°';
  $('g-zero-lift').textContent=fmt(coeff.alphaZeroLift*180/Math.PI,2)+'°';
  $('g-gamma-probe').textContent=fmt(v.total,4);
  $('g-dcp-probe').textContent=fmt(v.deltaCp,4);
  $('g-y-probe').textContent=fmt(meanCamber(probe,camber),4);
  $('g-state').textContent=Math.abs(coeff.cl)<1e-5
    ?'当前总升力为零。弯度非零时，局部涡片强度仍可能非零；零升力不表示处处无压力差。'
    :'总曲线等于迎角贡献与弯度贡献逐点相加。改变观察位置，比较局部涡片强度、压力差和中弧线高度。';
  renderSheetChart(alpha,camber,probe);
  renderGeometry(camber,probe);
}
function setCase(alpha,camber){
  $('g-alpha').value=String(alpha);
  $('g-camber').value=String(camber);
  render();
}
if(typeof document!=='undefined'){
  const alpha=$('g-alpha'),camber=$('g-camber'),probe=$('g-probe');
  if(alpha && camber && probe){
    alpha.addEventListener('input',render);
    camber.addEventListener('input',render);
    probe.addEventListener('input',render);
    document.querySelectorAll('[data-g-case]').forEach(button=>button.addEventListener('click',()=>{
      if(button.dataset.gCase==='flat')setCase(4,0);
      if(button.dataset.gCase==='camber')setCase(0,2);
      if(button.dataset.gCase==='combined')setCase(3,2);
      if(button.dataset.gCase==='zero-lift')setCase(-.04*180/Math.PI,2);
    }));
    const chart=$('g-plot');
    const setProbeFromPointer=event=>{
      const rect=chart.getBoundingClientRect();
      const px=(event.clientX-rect.left)*720/rect.width;
      const X=Math.min(.99,Math.max(.01,(px-69)/(720-69-24)));
      probe.value=String(X);
      render();
    };
    chart.addEventListener('pointerdown',setProbeFromPointer);
    chart.addEventListener('pointermove',event=>{if(event.buttons===1)setProbeFromPointer(event)});
    chart.addEventListener('keydown',event=>{
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
        event.preventDefault();
        probe.value=String(Math.max(.01,Math.min(.99,Number(probe.value)+(event.key==='ArrowRight'?.01:-.01))));
        render();
      }
    });
    render();
  }
}
