// Two-dimensional potential flow. SI units, unit span, CCW circulation > 0.
// The display exclusion radius is NOT a regularized physical core.
export const TAU = 2 * Math.PI;
export const CORE = 0.12;
export const rad = (degrees) => degrees * Math.PI / 180;

export function singularities(elements) {
  return elements.filter(e => e.enabled !== false).flatMap(e => {
    if (e.type === 'pair') {
      const a = rad(e.angle || 0), h = e.separation / 2;
      const q = e.lockMoment ? e.moment / e.separation : e.strength;
      if (q === 0) return [];
      return [1, -1].map(sign => ({x:e.x + sign*h*Math.cos(a), y:e.y + sign*h*Math.sin(a), type:'source', strength:sign*q, parent:e.id}));
    }
    return e.strength === 0 ? [] : [e];
  });
}

export function compileField(elements, uniform = {speed:0, angle:0}) {
  const parts = singularities(elements);
  const terms = parts.map(e=>({...e,k:e.strength/TAU,ex:Math.cos(rad(e.angle||0)),ey:Math.sin(rad(e.angle||0))}));
  const a = rad(uniform.angle || 0), speed = uniform.speed || 0;
  const ux = speed*Math.cos(a), uy = speed*Math.sin(a);
  function at(x, y, exclusion = 0, scalars = true) {
    let u=ux, v=uy, phi=ux*x+uy*y, psi=ux*y-uy*x;
    for (const e of terms) {
      const dx=x-e.x, dy=y-e.y, r2=dx*dx+dy*dy;
      if (r2 <= exclusion*exclusion || r2 < 1e-24) return null;
      const k=e.k;
      if (e.type === 'source') {
        u+=k*dx/r2; v+=k*dy/r2;
        if(scalars){phi+=k*Math.log(r2)/2; psi+=k*Math.atan2(dy,dx);}
      } else if (e.type === 'vortex') {
        u-=k*dy/r2; v+=k*dx/r2;
        if(scalars){phi+=k*Math.atan2(dy,dx); psi-=k*Math.log(r2)/2;}
      } else if (e.type === 'doublet') {
        const {ex,ey}=e, dot=dx*ex+dy*ey;
        if(scalars){phi-=k*dot/r2; psi+=k*(dy*ex-dx*ey)/r2;}
        u+=k*(2*dot*dx/r2-ex)/r2; v+=k*(2*dot*dy/r2-ey)/r2;
      }
    }
    return {u,v,phi,psi,speed:Math.hypot(u,v)};
  }
  // Prevent interpolating contours across an atan2 branch cut.
  function crossesCut(x0,y0,x1,y1,quantity) {
    return parts.some(e => {
      if (!((quantity==='phi' && e.type==='vortex') || (quantity==='psi' && e.type==='source'))) return false;
      const a=y0-e.y, b=y1-e.y;
      if ((a<0)===(b<0)) return false;
      const t=-a/(b-a);
      return x0+t*(x1-x0)<e.x;
    });
  }
  return {at,parts,crossesCut,velocity:(x,y,exclusion=0)=>at(x,y,exclusion,false)};
}

// Classical RK4: normalized for geometric field lines, physical velocity for particles.
export function advance(field,x,y,step,normalized=false,quantity='psi',exclusion=CORE) {
  const evaluate=field.velocity||field.at;
  function direction(px,py) {
    const f=evaluate(px,py,exclusion);
    if (!f || f.speed<1e-9) return null;
    let dx=f.u,dy=f.v;
    if(quantity==='phi') {dx=-f.v;dy=f.u;}
    const d=normalized?f.speed:1;
    return {x:dx/d,y:dy/d};
  }
  const a=direction(x,y); if(!a)return null;
  const b=direction(x+step*a.x/2,y+step*a.y/2); if(!b)return null;
  const c=direction(x+step*b.x/2,y+step*b.y/2); if(!c)return null;
  const d=direction(x+step*c.x,y+step*c.y); if(!d)return null;
  const p={x:x+step*(a.x+2*b.x+2*c.x+d.x)/6,y:y+step*(a.y+2*b.y+2*c.y+d.y)/6};
  return evaluate(p.x,p.y,exclusion)?p:null;
}

// This convention uses a positive doublet directed AGAINST the uniform flow.
// Recognize a cylinder only when every active term satisfies its boundary condition.
export function cylinderModel(elements,uniform) {
  if(!(uniform.speed>0))return null;
  const active=singularities(elements),doublets=active.filter(e=>e.type==='doublet');
  if(doublets.length!==1||active.some(e=>!['doublet','vortex'].includes(e.type)))return null;
  const d=doublets[0],a=rad(uniform.angle||0),delta=rad(d.angle||0)-a;
  if(Math.abs(Math.sin(delta))>1e-8||d.strength*Math.cos(delta)>=0)return null;
  if(active.some(e=>Math.hypot(e.x-d.x,e.y-d.y)>1e-8))return null;
  const radius=Math.sqrt(Math.abs(d.strength)/(TAU*uniform.speed));
  const gamma=active.filter(e=>e.type==='vortex').reduce((s,e)=>s+e.strength,0);
  const critical=2*TAU*uniform.speed*radius,lambda=gamma/critical;
  const local=(x,y)=>({x:d.x+x*Math.cos(a)-y*Math.sin(a),y:d.y+x*Math.sin(a)+y*Math.cos(a)});
  let stagnation;
  if(Math.abs(lambda)<1-1e-9){
    const x=radius*Math.sqrt(1-lambda*lambda);
    stagnation=[local(-x,radius*lambda),local(x,radius*lambda)];
  }else if(Math.abs(lambda)<=1+1e-9){stagnation=[local(0,Math.sign(lambda)*radius)];}
  else{stagnation=[local(0,Math.sign(lambda)*radius*(Math.abs(lambda)+Math.sqrt(lambda*lambda-1)))];}
  return {x:d.x,y:d.y,radius,gamma,critical,lambda,angle:uniform.angle||0,speed:uniform.speed,doubletId:d.id,stagnation,local};
}

export function exteriorField(field,body) {
  if(!body)return field;
  const inside=(x,y)=>(x-body.x)**2+(y-body.y)**2<body.radius**2*(1-1e-10);
  return {...field,at:(x,y,e=0)=>inside(x,y)?null:field.at(x,y,e),
    velocity:(x,y,e=0)=>inside(x,y)?null:(field.velocity||field.at)(x,y,e),body};
}

export function measureCircle(field,cx,cy,radius,samples=512) {
  let flux=0,circulation=0;
  if(radius<=0) return null;
  if(field.parts.some(e=>Math.abs(Math.hypot(e.x-cx,e.y-cy)-radius)<CORE))return null;
  for(let i=0;i<samples;i++){
    const t=TAU*(i+.5)/samples,c=Math.cos(t),s=Math.sin(t);
    const f=field.at(cx+radius*c,cy+radius*s);
    if(!f)return null;
    flux+=(f.u*c+f.v*s)*radius*TAU/samples;
    circulation+=(-f.u*s+f.v*c)*radius*TAU/samples;
  }
  let enclosedQ=0,enclosedGamma=0;
  for(const e of field.parts){
    if(Math.hypot(e.x-cx,e.y-cy)>=radius)continue;
    if(e.type==='source')enclosedQ+=e.strength;
    if(e.type==='vortex')enclosedGamma+=e.strength;
  }
  return {flux,circulation,enclosedQ,enclosedGamma};
}
