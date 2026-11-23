// Thin-airfoil demonstration: chord c=1, U∞=1. Sheet gamma is CLOCKWISE-positive.
// Demonstration family: mean line 4m x(1-x), half thickness t sin(pi x)/2.
const pi=Math.PI;
export function thinModel({alpha=3,camber=.02,thickness=.06,incidence=true,bending=true,body=true}={}){
  const a=(incidence?alpha:0)*pi/180,m=bending?camber:0,t=body?thickness:0;
  const q=x=>pi*t*Math.cos(pi*x),dq=x=>-pi*pi*t*Math.sin(pi*x);
  function at(x,n=320){
    if(!(x>0&&x<1))return null;
    // Cauchy principal value: subtract q(x) before quadrature, integrate
    // the remaining constant analytically. No arbitrary singularity cutoff.
    let integral=0;
    for(let i=0;i<n;i++){const s=(i+.5)/n;integral+=(Math.abs(x-s)<1e-10?-dq(x):(q(s)-q(x))/(x-s))/n;}
    const us=(integral+q(x)*Math.log(x/(1-x)))/(2*pi);
    const ga=2*a*Math.sqrt((1-x)/x),gm=16*m*Math.sqrt(x*(1-x));
    const vm=4*m*(1-2*x),vs=q(x)/2;
    const side=sign=>{
      const parts=[{u:sign*ga/2,v:-a},{u:sign*gm/2,v:vm},{u:us,v:sign*vs}];
      const u=parts.reduce((s,p)=>s+p.u,0),v=parts.reduce((s,p)=>s+p.v,0);
      // Same first-order velocity, but Bernoulli retains all quadratic terms.
      const bernoulli=1-(Math.cos(a)+u)**2-(Math.sin(a)+v)**2;
      return {parts,u,v,cp:-2*u,bernoulli,ratio:Math.hypot(u,v),slope:vm+sign*vs};
    };
    return {x,mean:4*m*x*(1-x),half:t*Math.sin(pi*x)/2,q:q(x),gamma:ga+gm,upper:side(1),lower:side(-1)};
  }
  return {a,m,t,q,at,cl:2*pi*(a+2*m),gammaCW:pi*(a+2*m)};
}
