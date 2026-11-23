import assert from 'node:assert/strict';
import {coefficients,distribution,rad} from '../js/glauert.mjs';
const near=(actual,expected,tolerance=1e-10)=>assert.ok(Math.abs(actual-expected)<tolerance,`expected ${expected}, got ${actual}`);

const flat=coefficients(4,0);
near(flat.A0,rad(4));
near(flat.A1,0);
near(flat.cl,2*Math.PI*rad(4));

const camber=coefficients(0,2);
near(camber.A0,0);
near(camber.A1,.08);
near(camber.alphaIdeal,0);
near(camber.alphaZeroLift,-.04);
near(camber.cl,2*Math.PI*.04);
near(distribution(.5,0,2).total,.16);
near(distribution(.5,0,2).deltaCp,.32);

for(const X of [.015,.15,.5,.8,.985]) {
 const mixed=distribution(X,3,2);
 near(mixed.total,distribution(X,3,0).total+distribution(X,0,2).total);
}
assert.equal(distribution(0,4,2),null);
assert.equal(distribution(1,4,2),null);

const atZeroLift=coefficients(-.04*180/Math.PI,2);
near(atZeroLift.cl,0);

const n=4096,dTheta=Math.PI/n;
let integrated=0;
for(let i=1;i<n;i++){
 const theta=i*dTheta;
 const X=(1-Math.cos(theta))/2;
 integrated+=distribution(X,3,2).total * .5*Math.sin(theta)*dTheta;
}
near(integrated,coefficients(3,2).circulation,2e-5);
console.log('PASS Glauert coefficients, superposition, zero-lift condition and circulation');
