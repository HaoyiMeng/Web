import assert from 'node:assert/strict';
import {createModel,PRESETS,mapPoint,derivative} from '../js/conformal.mjs';
import {traceCurve,layoutCurves} from '../js/potential-flow-lines.mjs';
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b} (tol ${tol})`);
const norm=p=>Math.hypot(p.x,p.y);
const bounds={xmin:-6,xmax:6,ymin:-4.6,ymax:4.6};

for(const preset of Object.values(PRESETS))for(const alpha of [-20,0,6,20])for(const kutta of [true,false]){
  const m=createModel({...preset,alpha,kutta,gamma:8});
  close(norm({x:1-m.cx,y:-m.cy}),m.radius);
  // Independent boundary condition and contour integral for circulation.
  let circulation=0;
  for(let i=0;i<720;i++){
    const t=(i+.5)*2*Math.PI/720,p=m.surface(t),v=m.field.at(p.x,p.y);
    close(v.u*Math.cos(t)+v.v*Math.sin(t),0,1e-8);
    close(v.psi,m.field.at(...Object.values(m.surface(.4))).psi,1e-8);
    circulation+=(-v.u*Math.sin(t)+v.v*Math.cos(t))*m.radius*2*Math.PI/720;
  }
  close(circulation,m.gamma,1e-8);
  for(const p of [{x:-3,y:1},{x:.2,y:2.2},{x:3,y:-1},{x:-4,y:-2}]){
    const f=m.at(p),inverse=m.inverse(mapPoint(p));
    close(inverse.x,p.x);close(inverse.y,p.y);
    close(f.speed*Math.hypot(...Object.values(derivative(p))),f.circle.speed,1e-8);
    // Numeric gradient of mapped potential agrees with transformed velocity.
    const h=1e-5,q=mapPoint(p);
    const potential=(x,y)=>{const z=m.inverse({x,y});return m.field.at(z.x,z.y).phi;};
    close((potential(q.x+h,q.y)-potential(q.x-h,q.y))/(2*h),f.u,2e-7);
    close((potential(q.x,q.y+h)-potential(q.x,q.y-h))/(2*h),f.v,2e-7);
  }
  const te=m.at({x:1,y:0});
  if(kutta){
    assert.equal(te.singular,false);assert.ok(Number.isFinite(te.speed));
    for(const side of [-1,1]){
      const near=m.at(m.surface(m.thetaTE+side*1e-6));
      close(near.u,te.u,2e-5);close(near.v,te.v,2e-5);
    }
  }else assert.equal(te.singular,true);
}
// Known analytical solutions: flat-plate CL and uniform zero-incidence flow.
for(const alpha of [-20,-6,0,6,20]){
  const m=createModel({...PRESETS.flat,alpha});
  close(m.chord,4);close(m.cl,2*Math.PI*Math.sin(alpha*Math.PI/180));
}
const flat=createModel({...PRESETS.flat,alpha:0});
for(const p of [{x:1,y:0},{x:-1,y:0},{x:0,y:1.2},{x:2,y:1}])close(flat.at(p).speed,1);
const symmetric=createModel({...PRESETS.symmetric,alpha:0});close(symmetric.gamma,0);close(symmetric.cl,0);
// Surface pressure integration must agree with Kutta–Joukowski lift for a thick foil.
for(const alpha of [-10,0,10]){
  const m=createModel({...PRESETS.cambered,alpha}),n=12000;let fx=0,fy=0;
  for(let i=0;i<n;i++){
    const t=m.thetaTE+2*Math.PI*(i+.5)/n,p=m.surface(t),f=m.at(p),d=derivative(p);
    const dx=-m.radius*Math.sin(t),dy=m.radius*Math.cos(t),dxp=d.x*dx-d.y*dy,dyp=d.y*dx+d.x*dy;
    fx-=f.cp*dyp*2*Math.PI/n/m.chord;fy+=f.cp*dxp*2*Math.PI/n/m.chord;
  }
  const a=m.flowAngle*Math.PI/180;close(-fx*Math.sin(a)+fy*Math.cos(a),m.cl,2e-5);
  close(fx*Math.cos(a)+fy*Math.sin(a),0,2e-5);
}
// Continuous traces conserve ψ and stay outside the circle, including manual high circulation.
for(const gamma of [undefined,0,18,-18]){
  const m=createModel({kutta:gamma===undefined,gamma});
  const seed={x:.1,y:1.8},curve=traceCurve(m.field,seed,{bounds,step:.04});
  assert.ok(curve.points.length>50);const psi=m.field.at(seed.x,seed.y).psi;
  for(const p of curve.points){assert.ok(Math.hypot(p.x-m.cx,p.y-m.cy)>=m.radius-1e-8);close(m.field.at(p.x,p.y).psi,psi,2e-5);assert.ok(Number.isFinite(mapPoint(p).x));}
}
const extreme=createModel({cx:-.35,cy:.3,alpha:20,kutta:false,gamma:20});
const curves=layoutCurves(extreme.field,{bounds,pixelsPerUnit:55.55,density:6,body:extreme.body});
assert.ok(curves.length>5);
assert.ok(curves.every(c=>c.points.every(p=>Number.isFinite(mapPoint(p).x))));
console.log('PASS conformal: four geometries, boundary condition, circulation, inverse map, velocity gradient, Kutta limits, flat-plate lift, integrated pressure and continuous curves');
