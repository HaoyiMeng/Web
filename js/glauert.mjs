// Glauert classroom demo: parabolic mean camber line (no thickness).
// Sign convention: gamma = u_upper - u_lower, positive circulation for positive lift.
export const rad = deg => deg * Math.PI / 180;
export function coefficients(alphaDeg, camberPercent) {
  const alpha = rad(alphaDeg);
  const m = camberPercent / 100;
  return {alpha, m, A0: alpha, A1: 4*m, alphaIdeal: 0, alphaZeroLift: -2*m,
    cl: 2*Math.PI*(alpha+2*m), circulation: Math.PI*(alpha+2*m)};
}
export function distribution(X, alphaDeg, camberPercent) {
  if (!(X>0 && X<1)) return null; // the leading edge is singular when A0 != 0
  const {A0,A1} = coefficients(alphaDeg,camberPercent);
  const alphaPart = 2*A0*Math.sqrt((1-X)/X);
  const camberPart = 4*A1*Math.sqrt(X*(1-X));
  return {alphaPart,camberPart,total:alphaPart+camberPart,deltaCp:2*(alphaPart+camberPart)};
}
const $ = id => document.getElementById(id);
const fmt = (number, digits=3) => (Math.abs(number)<.5*10**-digits ? 0 : number).toFixed(digits);
function plot(alpha,m) {
  const svg=$('g-plot');
  if(!svg) return;
  const W=720,H=310,L=58,R=18,T=25,B=45;
  const x=X=>L+X*(W-L-R);
  const samples=Array.from({length:211},(_,i)=>.01+i*.98/210);
  const vals=samples.map(X=>distribution(X,alpha,m));
  const arr=vals.flatMap(v=>[v.total,v.alphaPart,v.camberPart]);
  const yMax=Math.max(.15,...arr.map(Math.abs))*1.14;
  const y=Y=>T+(yMax-Y)/(2*yMax)*(H-T-B);
  const path=key=>samples.map((X,i)=>(i?'L':'M')+x(X).toFixed(2)+' '+y(vals[i][key]).toFixed(2)).join(' ');
  let s='';
  for(let i=-2;i<=2;i++){
    const yy=y(yMax*i/2);
    s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'" stroke="#344954" stroke-width="1"'+(i===0?'':' stroke-dasharray="4 6"')+'/>';
    s+='<text x="'+(L-10)+'" y="'+(yy+4)+'" text-anchor="end">'+fmt(yMax*i/2,2)+'</text>';
  }
  for(let i=0;i<=4;i++){
    const X=i/4,xx=x(X);
    s+='<line x1="'+xx+'" x2="'+xx+'" y1="'+T+'" y2="'+(H-B)+'" stroke="#243744" stroke-width="1"/>';
    s+='<text x="'+xx+'" y="'+(H-15)+'" text-anchor="middle">'+X.toFixed(2)+'</text>';
  }
  s+='<path d="'+path('alphaPart')+'" fill="none" stroke="#b5a1f3" stroke-width="2" stroke-dasharray="6 6"/>';
  s+='<path d="'+path('camberPart')+'" fill="none" stroke="#f1ce8d" stroke-width="2" stroke-dasharray="5 5"/>';
  s+='<path d="'+path('total')+'" fill="none" stroke="#69d9cc" stroke-width="3" stroke-linejoin="round"/>';
  s+='<text x="'+L+'" y="16">γ/U∞</text><text x="'+(W-R)+'" y="'+(H-4)+'" text-anchor="end">X = x/c</text>';
  svg.innerHTML=s;
  svg.setAttribute('aria-label','涡片强度曲线，迎角 '+alpha+' 度，最大弯度 '+m+'%，青色为总强度，紫色为迎角贡献，金色为弯度贡献');
}
function setCase(alpha,camber){
  $('g-alpha').value=String(alpha);$('g-camber').value=String(camber);render();
}
function render(){
  const alpha=Number($('g-alpha').value),m=Number($('g-camber').value);
  const c=coefficients(alpha,m);
  $('g-alpha-val').textContent=fmt(alpha,1)+'°';
  $('g-camber-val').textContent=fmt(m,1)+'%';
  $('g-a0').textContent=fmt(c.A0,4);
  $('g-a1').textContent=fmt(c.A1,4);
  $('g-cl').textContent=fmt(c.cl,3);
  $('g-circulation').textContent=fmt(c.circulation,3);
  $('g-ideal').textContent=fmt(c.alphaIdeal*180/Math.PI,2)+'°';
  $('g-zero-lift').textContent=fmt(c.alphaZeroLift*180/Math.PI,2)+'°';
  $('g-state').textContent=Math.abs(c.cl)<1e-5
    ?'此时总升力为零，但当弯度不为零时，局部涡片 γ(x) 仍可以非零。'
    :'A₀ 对应迎角的贡献，A₁ 对应当前抛物线弯度。调整滑块时两部分线性叠加。';
  plot(alpha,m);
}
if(typeof document!=='undefined'){
  const alpha=$('g-alpha'),camber=$('g-camber');
  if(alpha && camber){
    alpha.addEventListener('input',render);
    camber.addEventListener('input',render);
    document.querySelectorAll('[data-g-case]').forEach(button=>button.addEventListener('click',()=>{
      switch(button.dataset.gCase){
        case 'flat':setCase(4,0);break;
        case 'camber':setCase(0,2);break;
        case 'combined':setCase(3,2);break;
        case 'zero-lift':setCase(-2*.02*180/Math.PI,2);break;
      }
    }));
    render();
  }
}
