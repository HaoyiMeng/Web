import assert from 'node:assert/strict';
import { solveNozzle, LIMITS, area, areaMach, machFromArea, pressureRatio, THROAT_X } from '../js/nozzle.mjs';
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
assert.throws(()=>solveNozzle(1.1));assert.throws(()=>solveNozzle(0));
console.log('✓ Gas dynamics checks passed. Limits:',LIMITS);
