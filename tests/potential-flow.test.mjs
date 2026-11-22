import assert from 'node:assert/strict';
import {TAU,compileField,measureCircle,advance,singularities,cylinderModel,exteriorField} from '../js/potential-flow.mjs';
import {traceCurve,layoutCurves,cylinderSeparatrices} from '../js/potential-flow-lines.mjs';

const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b} (tolerance ${tol})`);
const element=(type,strength=8,extra={})=>({type,strength,x:0,y:0,angle:0,enabled:true,...extra});
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}

check('Uniform flow: potential gradient, streamfunction and rotation',()=>{
  const f=compileField([],{speed:2,angle:30}).at(2,3);
  near(f.u,Math.sqrt(3));near(f.v,1);near(f.phi,2*Math.sqrt(3)+3);near(f.psi,3*Math.sqrt(3)-2);
});
check('Source/sink inverse radius law and signed flux',()=>{
  for(const Q of [-12,12]){
    const field=compileField([element('source',Q)]),f=field.at(2,0);
    near(f.u,Q/(4*Math.PI));near(f.v,0);near(f.phi,Q/TAU*Math.log(2));
    for(const r of [.4,1,3]){const m=measureCircle(field,0,0,r);near(m.flux,Q);near(m.circulation,0);}
  }
});
check('Vortex circulation and zero net flux, enclosed vs excluded',()=>{
  const field=compileField([element('vortex',-7)]),f=field.at(2,0);
  near(f.u,0);near(f.v,-7/(4*Math.PI));
  near(measureCircle(field,0,0,2).circulation,-7);near(measureCircle(field,0,0,2).flux,0);
  near(measureCircle(field,3,0,.6).circulation,0);near(measureCircle(field,3,0,.6).flux,0);
});
check('Analytical velocities agree with both scalar gradients',()=>{
  const h=1e-5;
  for(const e of [element('source'),element('vortex'),element('doublet',13,{angle:37}),element('pair',5,{angle:28,separation:1.2})]){
    const field=compileField([e],{speed:.7,angle:-15});
    for(const [x,y] of [[2,1],[-1,2],[1,-2]]){
      const f=field.at(x,y),xp=field.at(x+h,y),xm=field.at(x-h,y),yp=field.at(x,y+h),ym=field.at(x,y-h);
      near((xp.phi-xm.phi)/(2*h),f.u);near((yp.phi-ym.phi)/(2*h),f.v);
      near((yp.psi-ym.psi)/(2*h),f.u);near(-(xp.psi-xm.psi)/(2*h),f.v);
    }
  }
});
check('Superposition and disabled elements',()=>{
  const a=element('source',6,{x:-1}),b=element('vortex',-3,{x:1});
  const combined=compileField([a,b]).at(.3,.7),fa=compileField([a]).at(.3,.7),fb=compileField([b]).at(.3,.7);
  for(const k of ['u','v','phi','psi'])near(combined[k],fa[k]+fb[k]);
  near(compileField([a,{...b,enabled:false}]).at(.3,.7).v,fa.v);
  assert.ok(compileField([element('source',0)]).at(0,0));
});
check('Finite source/sink pair converges to doublet with fixed moment',()=>{
  for(const angle of [0,60,-130]){
    const doublet=compileField([element('doublet',10,{angle})]).at(2,3);
    let previous=Infinity;
    for(const separation of [.4,.1,.025,.005]){
      const pair=compileField([element('pair',1,{angle,separation,lockMoment:true,moment:10})]).at(2,3);
      const error=Math.hypot(pair.u-doublet.u,pair.v-doublet.v);
      assert.ok(error<previous);previous=error;
      if(separation===.005)for(const k of ['u','v','phi','psi'])near(pair[k],doublet[k],1e-6);
    }
  }
});
check('Doublet has zero circulation and net flux',()=>{
  const f=compileField([element('doublet',14,{angle:42})]);
  const m=measureCircle(f,0,0,1.2);near(m.flux,0);near(m.circulation,0);
});
check('Flux and circulation add only the enclosed singularities',()=>{
  const f=compileField([element('source',5),element('source',-3,{x:.5}),element('source',19,{x:5}),element('vortex',7,{y:.5}),element('doublet',4)],{speed:1.2,angle:50});
  const m=measureCircle(f,0,0,2);near(m.flux,2);near(m.circulation,7);near(m.enclosedQ,2);near(m.enclosedGamma,7);
});
check('Singularities are excluded, never smoothed or silently clamped',()=>{
  const f=compileField([element('source')]);assert.equal(f.at(0,0),null);assert.equal(f.at(.1,0,.12),null);assert.ok(f.at(.13,0,.12));
  assert.equal(measureCircle(f,1,0,1),null);assert.equal(measureCircle(f,0,0,0),null);
});
check('Branch cuts are detected only for the appropriate scalar',()=>{
  const s=compileField([element('source')]),v=compileField([element('vortex')]);
  assert.ok(s.crossesCut(-2,-.1,-2,.1,'psi'));assert.ok(!s.crossesCut(-2,-.1,-2,.1,'phi'));
  assert.ok(v.crossesCut(-2,-.1,-2,.1,'phi'));assert.ok(!v.crossesCut(2,-.1,2,.1,'phi'));
  near(s.at(-2,.000001).psi-s.at(-2,-.000001).psi,8,2e-6);
});
check('RK4 maintains a vortex orbit and advects at actual speed',()=>{
  const field=compileField([element('vortex',TAU)]);let p={x:2,y:0};
  for(let i=0;i<1000;i++)p=advance(field,p.x,p.y,.01);
  near(Math.hypot(p.x,p.y),2,1e-8);near(Math.atan2(p.y,p.x),2.5,1e-8);
  const uniform=compileField([],{speed:3,angle:0}),q=advance(uniform,1,2,.1);near(q.x,1.3);near(q.y,2);
});
check('Pair expansion uses source in +alpha direction',()=>{
  const p=singularities([element('pair',4,{separation:2,angle:90})]);near(p[0].y,1);near(p[1].y,-1);near(p[0].strength,4);near(p[1].strength,-4);
});
const cylinder=(ratio,angle=180,radius=1)=>{
  const uniform={speed:1.2,angle};
  const elements=[element('doublet',TAU*uniform.speed*radius**2,{id:1,angle:angle-180,x:.2,y:-.3}),element('vortex',ratio*2*TAU*radius*uniform.speed,{id:2,x:.2,y:-.3})];
  const body=cylinderModel(elements,uniform),raw=compileField(elements,uniform);
  return {body,raw,field:exteriorField(raw,body),elements,uniform};
};
const bounds={xmin:-6,xmax:6,ymin:-5,ymax:5};
check('Cylinder: no penetration and constant surface streamfunction at any rotation/circulation',()=>{
  for(const ratio of [-1.5,-1,0,.5,1,1.5])for(const angle of [0,37,180]){
    const {body,raw,field}=cylinder(ratio,angle,1.4);let psi;
    for(let i=0;i<100;i++){
      const t=TAU*i/100,p=body.local(body.radius*Math.cos(t),body.radius*Math.sin(t)),f=raw.at(p.x,p.y);
      near(f.u*(p.x-body.x)+f.v*(p.y-body.y),0,1e-9);
      psi??=f.psi;near(f.psi,psi,1e-9);
    }
    assert.equal(field.at(body.x+.1,body.y),null);
    for(const p of body.stagnation){near(raw.at(p.x,p.y).speed,0,1e-8);assert.ok(Math.hypot(p.x-body.x,p.y-body.y)>=body.radius-1e-8);}
    assert.equal(body.stagnation.length,Math.abs(ratio)<1?2:1);
    near(measureCircle(field,body.x,body.y,body.radius*1.1).circulation,body.gamma,1e-8);
    assert.equal(measureCircle(field,body.x,body.y,body.radius*.8),null);
  }
});
check('Cylinder is not inferred for displaced, misaligned, zero-uniform or additional fields',()=>{
  const {elements,uniform}=cylinder(.5);
  assert.equal(cylinderModel(elements,{...uniform,speed:0}),null);
  assert.equal(cylinderModel([{...elements[0],angle:20},elements[1]],uniform),null);
  assert.equal(cylinderModel([elements[0],{...elements[1],x:1}],uniform),null);
  assert.equal(cylinderModel([...elements,element('source')],uniform),null);
  assert.ok(cylinderModel([{...elements[0],angle:180,strength:-elements[0].strength},elements[1]],uniform));
});
check('All three cylinder separatrices preserve psi, including the detached closed loop',()=>{
  for(const ratio of [-1.5,-1,-.5,0,.5,1,1.5]){
    const {body,raw}=cylinder(ratio,27),target=raw.at(body.stagnation[0].x,body.stagnation[0].y).psi;
    const curves=cylinderSeparatrices(body,12);
    assert.equal(curves.filter(c=>c.closed).length,Math.abs(ratio)>1?1:0);
    for(const curve of curves)for(const p of curve.points){
      assert.ok(Math.hypot(p.x-body.x,p.y-body.y)>=body.radius-1e-8);
      near(raw.at(p.x,p.y).psi,target,2e-7);
    }
  }
});
check('Closed vortex streamlines and source equipotentials complete one orbit',()=>{
  for(const [type,quantity] of [['vortex','psi'],['source','phi']]){
    const f=compileField([element(type,TAU)]),c=traceCurve(f,{x:2,y:0},{bounds,step:.04,quantity});
    assert.ok(c.closed);assert.ok(c.points.length>250&&c.points.length<350);
    for(const p of c.points)near(Math.hypot(p.x,p.y),2,2e-6);
  }
});
check('Uniform curves reach both viewport edges instead of ending near another line',()=>{
  for(const quantity of ['phi','psi']){
    const curves=layoutCurves(compileField([],{speed:1,angle:20}),{bounds,pixelsPerUnit:70,density:10,quantity});
    assert.ok(curves.length>10);
    for(const curve of curves)assert.deepEqual(curve.ends,['viewport','viewport']);
  }
});
check('Traced cylinder streamlines stay exterior and conserve streamfunction',()=>{
  for(const ratio of [.5,1,1.5]){
    const {field,body}=cylinder(ratio);
    for(const seed of [{x:-5,y:1},{x:1.5,y:2},{x:0,y:1.2}]){
      const c=traceCurve(field,seed,{bounds,step:.04}),psi=field.at(seed.x,seed.y).psi;
      assert.ok(c.points.length>30);assert.ok(!c.ends.includes('limit'));
      for(const p of c.points){assert.ok(Math.hypot(p.x-body.x,p.y-body.y)>=body.radius-1e-7);near(field.at(p.x,p.y).psi,psi,2e-5);}
    }
  }
});
check('Equipotential tracing crosses an atan2 cut on its continuous local branch',()=>{
  const field=compileField([element('vortex',TAU)],{speed:1,angle:0});
  const c=traceCurve(field,{x:-2,y:.1},{bounds,step:.02,quantity:'phi'});
  let crossings=0;
  for(let i=1;i<c.points.length;i++){
    const a=c.points[i-1],b=c.points[i];
    if(field.crossesCut(a.x,a.y,b.x,b.y,'phi'))crossings++;
    const f=field.at((a.x+b.x)/2,(a.y+b.y)/2),dx=b.x-a.x,dy=b.y-a.y;
    assert.ok(Math.abs((dx*f.u+dy*f.v)/(Math.hypot(dx,dy)*f.speed))<.01);
  }
  assert.ok(crossings>0);
});
console.log(`${checks} numerical checks passed.`);
