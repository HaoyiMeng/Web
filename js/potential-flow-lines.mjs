import {TAU,CORE,advance} from './potential-flow.mjs?v=20261122b';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const velocity=(field,p)=> (field.velocity||field.at)(p.x,p.y,CORE);

// Complete geometric integral curves. Spacing never terminates integration.
// Step doubling bounds local error; rejected steps shrink near tight turns,
// stagnation points and excluded boundaries instead of jumping across them.
export function traceCurve(field,seed,{bounds,step=.04,quantity='psi',maxLength,sign=0}={}) {
  const diagonal=Math.hypot(bounds.xmax-bounds.xmin,bounds.ymax-bounds.ymin);
  maxLength??=diagonal*8;
  const start=velocity(field,seed);
  if(!start||start.speed<1e-9)return {points:[],closed:false,ends:['invalid']};
  function half(direction) {
    const points=[seed];let p=seed,h=step,length=0;
    for(let i=0;i<16000;i++){
      let next=null,error=Infinity,accepted=false;
      for(let retry=0;retry<12;retry++){
        const full=advance(field,p.x,p.y,h*direction,true,quantity);
        const mid=advance(field,p.x,p.y,h*direction/2,true,quantity);
        next=mid&&advance(field,mid.x,mid.y,h*direction/2,true,quantity);
        error=full&&next?distance(full,next):Infinity;
        const f=next&&velocity(field,next),before=velocity(field,p);
        const alignment=f&&before?(f.u*before.u+f.v*before.v)/Math.max(1e-30,f.speed*before.speed):-1;
        if(next&&error<step*1e-4&&alignment>.5){accepted=true;break;}
        h/=2;if(h<step/256)break;
      }
      if(!accepted||!next||distance(p,next)<step/1024)return {points,closed:false,end:'boundary'};
      length+=distance(p,next);points.push(next);p=next;
      if(p.x<bounds.xmin||p.x>bounds.xmax||p.y<bounds.ymin||p.y>bounds.ymax)return {points,closed:false,end:'viewport'};
      if(length>step*20&&distance(p,seed)<h*.8){
        const f=velocity(field,p);
        if(f&&(f.u*start.u+f.v*start.v)>.95*f.speed*start.speed){
          points.push(seed);return {points,closed:true,end:'closed'};
        }
      }
      if(length>maxLength)return {points,closed:false,end:'limit'};
      if(error<step*1e-6)h=Math.min(step,h*1.5);
    }
    return {points,closed:false,end:'limit'};
  }
  const forward=half(sign||1);
  if(forward.closed||sign)return {points:forward.points,closed:forward.closed,ends:[forward.end]};
  const backward=half(-1);
  if(backward.closed)return {points:backward.points.reverse(),closed:true,ends:[backward.end]};
  return {points:[...backward.points.slice(1).reverse(),...forward.points],closed:false,ends:[backward.end,forward.end]};
}

// Exact cylinder separatrices from constant psi, including the detached
// saddle's enclosing loop at supercritical circulation. No saddle crossing
// or streamline-to-streamline stitching is needed.
export function cylinderSeparatrices(body,maxRadius) {
  const {lambda:l,radius:a,local}=body,abs=Math.abs(l),sgn=Math.sign(l)||1;
  const rs=abs>1?abs+Math.sqrt(abs*abs-1):1;
  const level=abs>1?sgn*(rs-1/rs)-2*l*Math.log(rs):0;
  function branch(r0,r1,side) {
    const points=[];
    for(let i=0;i<=400;i++){
      const t=(1-Math.cos(Math.PI*i/400))/2,r=r0*Math.exp(Math.log(r1/r0)*t);
      const sine=Math.abs(r-1)<1e-10?l:(level+2*l*Math.log(r))/(r-1/r);
      const angle=side===0?Math.asin(Math.max(-1,Math.min(1,sine))):Math.PI-Math.asin(Math.max(-1,Math.min(1,sine)));
      points.push(local(a*r*Math.cos(angle),a*r*Math.sin(angle)));
    }
    return points;
  }
  const limit=Math.max(maxRadius/a,rs*1.2),curves=[0,1].map(side=>({points:branch(rs,limit,side),closed:false,kind:'separatrix'}));
  if(abs>1+1e-9){
    let lo=1,hi=rs;
    for(let i=0;i<70;i++){const r=(lo+hi)/2;if(sgn*(level+2*l*Math.log(r))+(r-1/r)>0)hi=r;else lo=r;}
    const inner=(lo+hi)/2,p=branch(inner,rs,0),q=branch(inner,rs,1);
    curves.push({points:[...p,...q.reverse()],closed:true,kind:'separatrix'});
  }
  return curves;
}

// Occupancy is only used to choose seeds / reject redundant WHOLE curves.
// Finished paths are drawn once, so closed loops and dashed contours join.
export function layoutCurves(field,{bounds,pixelsPerUnit,density=10,quantity='psi',body=null}) {
  const w=bounds.xmax-bounds.xmin,h=bounds.ymax-bounds.ymin;
  const spacing=Math.max(20/pixelsPerUnit,w/(density*2.2)),cell=spacing*.42;
  const nx=Math.ceil(w/cell)+2,ny=Math.ceil(h/cell)+2,occupied=new Uint8Array(nx*ny);
  const index=p=>{const x=Math.floor((p.x-bounds.xmin)/cell),y=Math.floor((p.y-bounds.ymin)/cell);return x<0||y<0||x>=nx||y>=ny?-1:y*nx+x;};
  const taken=p=>{const k=index(p);return k>=0&&occupied[k];};
  function mark(points){for(const p of points){const k=index(p);if(k>=0)occupied[k]=1;}}
  const corners=[[bounds.xmin,bounds.ymin],[bounds.xmin,bounds.ymax],[bounds.xmax,bounds.ymin],[bounds.xmax,bounds.ymax]];
  const curves=body&&quantity==='psi'?cylinderSeparatrices(body,Math.max(...corners.map(([x,y])=>Math.hypot(x-body.x,y-body.y)))*1.15):[];
  curves.forEach(c=>mark(c.points));
  const seeds=[];
  // Near-body seeds retain the circulating closed streamlines.
  if(body){
    for(let r=body.radius+spacing*.35;r<body.radius+Math.max(2*body.radius,spacing*4);r+=spacing*.6)
      for(let i=0;i<8;i++)seeds.push(body.local(r*Math.cos(TAU*i/8),r*Math.sin(TAU*i/8)));
  }
  for(let y=bounds.ymin+spacing/2;y<bounds.ymax;y+=spacing){seeds.push({x:bounds.xmin,y},{x:bounds.xmax,y});}
  for(let x=bounds.xmin+spacing/2;x<bounds.xmax;x+=spacing){seeds.push({x,y:bounds.ymin},{x,y:bounds.ymax});}
  for(const e of field.parts){
    for(let r=CORE*1.25;r<Math.min(w,h)*.45;r+=spacing*.8)
      for(let i=0;i<8;i++)seeds.push({x:e.x+r*Math.cos(TAU*i/8),y:e.y+r*Math.sin(TAU*i/8)});
  }
  for(let y=bounds.ymin+spacing/2;y<bounds.ymax;y+=spacing)
    for(let x=bounds.xmin+spacing/2;x<bounds.xmax;x+=spacing)seeds.push({x,y});
  const step=2.8/pixelsPerUnit;
  for(const seed of seeds){
    if(seed.x<bounds.xmin||seed.x>bounds.xmax||seed.y<bounds.ymin||seed.y>bounds.ymax||taken(seed))continue;
    const curve=traceCurve(field,seed,{bounds,step,quantity});
    if(curve.points.length<5||curve.ends.includes('limit'))continue;
    let overlap=0,samples=0,length=0;
    for(let i=0;i<curve.points.length;i++){
      if(i)length+=distance(curve.points[i-1],curve.points[i]);
      if(i%4===0){samples++;if(taken(curve.points[i]))overlap++;}
    }
    if(length<spacing*.65||overlap/Math.max(1,samples)>.35)continue;
    curves.push(curve);mark(curve.points);
    if(curves.length>density*10)break;
  }
  return curves;
}
