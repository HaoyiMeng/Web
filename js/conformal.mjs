// Joukowski flow, nondimensionalized by b and U∞. Positive Γ is CCW.
// The circle passes through z=+1; z=-1 remains inside or on the circle.
import {compileField, cylinderModel, exteriorField} from './potential-flow.mjs?v=20261122b';
export const PRESETS = {
  flat: {cx:0, cy:0, label:'平板'},
  arc: {cx:0, cy:.16, label:'圆弧'},
  symmetric: {cx:-.14, cy:0, label:'对称翼型'},
  cambered: {cx:-.14, cy:.16, label:'弯曲翼型'}
};
const TAU=2*Math.PI;
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const mul=(a,b)=>({x:a.x*b.x-a.y*b.y,y:a.x*b.y+a.y*b.x});
const scale=(a,s)=>({x:a.x*s,y:a.y*s});
const div=(a,b)=>scale(mul(a,{x:b.x,y:-b.y}),1/(b.x*b.x+b.y*b.y));
const abs=a=>Math.hypot(a.x,a.y);
const exp=a=>({x:Math.cos(a),y:Math.sin(a)});
const clamp=(v,l,h)=>Math.max(l,Math.min(h,v));
const finite=(v,f)=>Number.isFinite(Number(v))?Number(v):f;

export function mapPoint(z) { return add(z,div({x:1,y:0},z)); }
export function derivative(z) { return sub({x:1,y:0},div({x:1,y:0},mul(z,z))); }

export function createModel(options={}) {
  const cx=clamp(finite(options.cx,-.14),-.35,0),cy=clamp(finite(options.cy,.16),-.3,.3);
  const alpha=clamp(finite(options.alpha,6),-20,20);
  const center={x:cx,y:cy},radius=Math.hypot(1-cx,cy),thetaTE=Math.atan2(-cy,1-cx);
  const surface=t=>({x:cx+radius*Math.cos(t),y:cy+radius*Math.sin(t)});
  const outline=Array.from({length:721},(_,i)=>surface(thetaTE+TAU*i/720));
  const foil=outline.map(mapPoint),distanceTE=p=>Math.hypot(p.x-2,p.y);
  // Leading edge is the boundary point farthest from TE. Refine its sampled
  // bracket so incidence and lift use the actual chord, including cambered foils.
  let leadingIndex=0;
  for(let i=1;i<720;i++)if(distanceTE(foil[i])>distanceTE(foil[leadingIndex]))leadingIndex=i;
  let lo=thetaTE+TAU*(leadingIndex-1)/720,hi=lo+2*TAU/720;
  for(let i=0;i<60;i++){
    const l=lo+(hi-lo)/3,r=hi-(hi-lo)/3;
    if(distanceTE(mapPoint(surface(l)))<distanceTE(mapPoint(surface(r))))lo=l;else hi=r;
  }
  const leading=cx===0?{x:-2,y:0}:cy===0?mapPoint({x:cx-radius,y:0}):mapPoint(surface((lo+hi)/2));
  const chord=distanceTE(leading);
  const chordAngle=Math.atan2(-leading.y,2-leading.x),flowAngle=alpha+chordAngle*180/Math.PI,a=flowAngle*Math.PI/180;
  const gammaK=4*Math.PI*radius*Math.sin(thetaTE-a);
  const gamma=options.kutta===false?clamp(finite(options.gamma,0),-20,20):gammaK;
  const matched=Math.abs(gamma-gammaK)<1e-10;
  const parts=[{type:'doublet',x:cx,y:cy,strength:TAU*radius*radius,angle:flowAngle+180},
    {type:'vortex',x:cx,y:cy,strength:gamma}];
  const raw=compileField(parts,{speed:1,angle:flowAngle});
  const body=cylinderModel(parts,{speed:1,angle:flowAngle}),field=exteriorField(raw,body);
  // Far-field lift normal to U∞; with CCW-positive Γ, CL = -2Γ/(U∞ c).
  const cl=-2*gamma/chord;
  function at(z) {
    const circle=field.at(z.x,z.y,0);
    if(!circle)return null;
    const w=sub(z,center),z2=mul(z,z),w2=mul(w,w);
    const d=derivative(z),q={x:circle.u,y:-circle.v};
    let mapped;
    if(abs(d)<1e-7) {
      if(abs(q)>1e-6)return {circle,point:mapPoint(z),singular:true,speed:Infinity,cp:-Infinity};
      // Removable 0/0: use W''/f'' at either critical point, never velocity clamping.
      const qp=add(div(scale(exp(a),2*radius*radius),mul(w2,w)),div({x:0,y:gamma/TAU},w2));
      mapped=div(qp,div({x:2,y:0},mul(z2,z)));
    }else if(matched && abs(sub(z,{x:1,y:0}))<.08) {
      // Cancel the common (z-1) factor analytically near the cusped trailing edge.
      const other=div(scale(exp(2*a),-radius*radius),sub({x:1,y:0},center));
      mapped=div(mul(mul(exp(-a),sub(w,other)),z2),mul(w2,add(z,{x:1,y:0})));
    }else mapped=div(q,d);
    const speed=abs(mapped);
    return {circle,point:mapPoint(z),u:mapped.x,v:-mapped.y,speed,cp:1-speed*speed,singular:false};
  }
  function inverse(p) {
    // Solve z² - ζz + 1 = 0 and select the root outside the generating circle.
    const discriminant=sub(mul(p,p),{x:4,y:0}),r=abs(discriminant);
    const root={x:Math.sqrt(Math.max(0,(r+discriminant.x)/2)),y:(discriminant.y<0?-1:1)*Math.sqrt(Math.max(0,(r-discriminant.x)/2))};
    const roots=[scale(add(p,root),.5),scale(sub(p,root),.5)];
    roots.sort((p,q)=>abs(sub(q,center))-abs(sub(p,center)));
    return abs(sub(roots[0],center))>=radius*(1-1e-9)?roots[0]:null;
  }
  return {cx,cy,alpha,flowAngle,chordAngle,leading,center,radius,thetaTE,gammaK,gamma,matched,field,body,surface,outline,foil,chord,cl,at,inverse};
}

export function projectOutside(model,p,padding=.03) {
  const dx=p.x-model.cx,dy=p.y-model.cy,r=Math.hypot(dx,dy),min=model.radius+padding;
  if(r>=min)return p;
  const t=r>1e-12?Math.atan2(dy,dx):Math.PI/2;
  return {x:model.cx+min*Math.cos(t),y:model.cy+min*Math.sin(t)};
}
