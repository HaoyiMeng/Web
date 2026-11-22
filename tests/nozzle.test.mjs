import assert from 'node:assert/strict';
import { solveNozzle, LIMITS, area, areaMach, machFromArea, pressureRatio, THROAT_X, getLimits } from '../js/nozzle.mjs';
const near=(actual,expected,tol=1e-5)=>assert.ok(Math.abs(actual-expected)<=tol,`expected ${actual} ≈ ${expected}`);
assert.ok(LIMITS.chokeBackPressure>LIMITS.shockAtExitBackPressure);
assert.ok(LIMITS.shockAtExitBackPressure>LIMITS.designBackPressure);
near(area(THROAT_X),1);
for (const branch of ['sub','sup']){
 for(const m of branch==='sub'?[.1,.3,.7,.95]:[1.05,1.6,2.4,3.5]){
   near(machFromArea(areaMach(m),branch),m,1e-6);
 }
}
for (const pb of [.99,.98,.97]){
 if (pb<=LIMITS.chokeBackPressure) continue;
 const s=solveNozzle(pb);assert.equal(s.mode,'subsonic');assert.equal(s.shock,null);
 near(s.exitPressure,pb);assert.ok(s.throatM<1);assert.ok(s.massFraction<1);
 assert.ok(s.points.every(p=>p.mach<1));
}
for(const pb of [.9,.7,.6]){
 if(pb>=LIMITS.chokeBackPressure||pb<=LIMITS.shockAtExitBackPressure)continue;
 const s=solveNozzle(pb);assert.equal(s.mode,'internal-shock');near(s.throatM,1);
 assert.ok(s.shock.x>THROAT_X&&s.shock.x<1);
 near(s.shock.pb,pb,1e-7);near(s.exitPressure,pb,1e-7);
 assert.ok(s.shock.p02p01<1);
 near(s.shock.M2**2,(1+.2*s.shock.M1**2)/(1.4*s.shock.M1**2-.2));
 const p1=pressureRatio(s.shock.M1),p2=s.shock.p02p01*pressureRatio(s.shock.M2);
 near(p2/p1,1+2*1.4/(1.4+1)*(s.shock.M1**2-1),1e-5);
}
for(const pb of [.2,.05]){
 const s=solveNozzle(pb);assert.equal(s.mode,'supersonic-exit');near(s.throatM,1);
 assert.ok(s.exitM>1);near(s.exitPressure,LIMITS.designBackPressure,1e-7);
}

// Configurable geometry, gas properties and dimensional conservation.
for(const params of [
 {gamma:1.2,exitAreaRatio:8,inletAreaRatio:3.8,totalPressureKPa:450,totalTemperatureK:900,throatAreaCm2:5,lengthM:1.2,gasConstant:300},
 {gamma:1.67,exitAreaRatio:1.1,inletAreaRatio:1.5,totalPressureKPa:30,totalTemperatureK:200,throatAreaCm2:.2,lengthM:.1,gasConstant:208.13}
]){
 const lim=getLimits(params);
 assert.ok(lim.chokeBackPressure>lim.shockAtExitBackPressure);
 assert.ok(lim.shockAtExitBackPressure>lim.designBackPressure);
 near(area(.39,{...params,throatX:.39}),1);
 for(const pb of [(1+lim.chokeBackPressure)/2,(lim.chokeBackPressure+lim.shockAtExitBackPressure)/2,lim.shockAtExitBackPressure,lim.designBackPressure*.65]){
  const s=solveNozzle(pb,301,params);
  assert.ok(s.massFlowKgS>=0&&Number.isFinite(s.massFlowKgS));
  const exit=s.evaluate(1,'downstream');
  near(exit.pressureKPa,params.totalPressureKPa*s.exitPressure,1e-7);
  near(exit.temperatureK,s.config.totalTemperatureK*exit.temperature,1e-7);
  for(const p of s.points){
   assert.ok(Number.isFinite(p.mach)&&Number.isFinite(p.pressureKPa)&&Number.isFinite(p.velocity));
   assert.ok(p.mach>=0&&p.density>=0&&p.temperatureK>0);
   near(p.density*p.velocity*p.areaCm2*1e-4,s.massFlowKgS,1e-8);
  }
 }
 const atExit=solveNozzle(lim.shockAtExitBackPressure,201,params);
 assert.equal(atExit.mode,'internal-shock');
 near(atExit.shock.x,1,1e-9);
 assert.ok(atExit.shock.p02p01<1);
}
assert.throws(()=>getLimits({gamma:1}));
assert.throws(()=>solveNozzle(.5,101,{throatAreaCm2:-1}));
assert.throws(()=>solveNozzle(1.1));assert.throws(()=>solveNozzle(0));
console.log('✓ Gas dynamics checks passed. Limits:',LIMITS);
