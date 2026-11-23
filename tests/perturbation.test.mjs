import assert from 'node:assert/strict';
import {thinModel} from '../js/perturbation.mjs';
const close=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
for(const options of [{alpha:0,camber:0,thickness:0},{alpha:3,camber:.02,thickness:.06},{alpha:-7,camber:-.04,thickness:.1}]){
 const m=thinModel(options);let flux=0,lift=0;const n=1000;
 for(let i=0;i<n;i++){
  const theta=(i+.5)*Math.PI/n,x=(1-Math.cos(theta))/2,p=m.at(x,100);
  flux+=m.q((i+.5)/n)/n;lift+=(p.lower.cp-p.upper.cp)*Math.sin(theta)/2*Math.PI/n;
  for(const sign of [1,-1]){const v=sign===1?p.upper:p.lower;close(v.slope,m.a+v.v);close(v.cp,v.parts.reduce((s,p)=>s-2*p.u,0));}
 }
 close(flux,0);close(lift,m.cl,2e-6);
 const p=m.at(.4),fine=m.at(.4,1600);close(p.upper.cp,fine.upper.cp,2e-6);
}
const sym=thinModel({alpha:0,camber:0,thickness:.1});close(sym.cl,0);close(sym.at(.3).upper.cp,sym.at(.3).lower.cp);
const off=thinModel({incidence:false,bending:false,body:false});close(off.at(.4).upper.cp,0);close(off.at(.4).upper.bernoulli,0);
const large=thinModel({alpha:4,camber:.02,thickness:.04}).at(.3).upper;
const small=thinModel({alpha:2,camber:.01,thickness:.02}).at(.3).upper;
close(large.cp,2*small.cp);assert.ok(Math.abs(small.cp-small.bernoulli)<Math.abs(large.cp-large.bernoulli)*.3);
assert.equal(off.at(0),null);assert.equal(off.at(1),null);
console.log('PASS thin perturbations: tangency, flux closure, integrated lift, symmetry, PV convergence, superposition and quadratic scaling');
