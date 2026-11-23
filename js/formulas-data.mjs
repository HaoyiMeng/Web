import {v,b,o,n,t,row,sub,sup,frac,eq,plus,par,dot,grad,div,dt,pt,integral,surface,equation} from './formula-math.mjs';
import {energyFormulas} from './formulas-energy.mjs';
import {navierStokesFormula} from './formulas-navier-stokes.mjs';
import {vectorToolsFormula} from './formulas-vector.mjs';
import {theoremFormulas} from './formulas-theorems.mjs';

import {glauertFormula} from './formulas-glauert.mjs';
import {thinAirfoilFormula} from './formulas-thin-airfoil.mjs';

const rho=v('ρ'), vel=b('v'), sigma=b('σ'), tau=b('τ'), force=b('b');
const vol=(s)=>integral(v('Ω'),s);
const time=(s)=>row(frac(v('d'),row(v('d'),v('t'))),s);
const sq=(s)=>sup(s,n(2));
const kinetic=frac(sq(row(o('|'),vel,o('|'))),n(2));
const vt={title:'Virginia Tech · Foundations of fluid mechanics',url:'https://pressbooks.lib.vt.edu/configurationaerodynamics/chapter/foundations-of-fluid-mechanics/'};
const arizona={title:'University of Arizona · Vector calculus',url:'https://opentextbooks.library.arizona.edu/mathematicalmodeling/chapter/appendix-vector-calculus/'};
const J=sub(b('J'),v('a')), js=sub(b('j'),v('a')), source=sub(v('s'),v('a'));
const momentumFlux=row(rho,vel,o('⊗'),vel);
const materialAcceleration=plus(pt(vel),row(par(dot(vel,o('∇'))),vel));

const coreFormulas=[
  {
    id:'balance',name:'一般平衡式',italian:'Equazione generale di bilancio',symbol:'∂ / ∂t',category:'守恒的共同结构',
    summary:'先看控制体里存了多少，再算流入、流出和源项。',
    question:'不跟着流体移动，只圈定空间中的一个区域，里面某种物理量为什么会变？',
    equations:[
      equation('固定控制体的积分形式','d/dt ∫Ω a dV = −∮∂Ω J_a·n dA + ∫Ω s_a dV + ∮∂Ω j_a·n dA',eq(time(vol(v('a'))),row(o('−'),surface(dot(J,b('n'))),o('+'),vol(source),o('+'),surface(dot(js,b('n')))))),
      equation('对应的局部形式','∂a/∂t + ∇·J_a = s_a + ∇·j_a',eq(plus(pt(v('a')),div(J)),plus(source,div(js)))),
    ],
    terms:[['Ω、∂Ω','空间中固定的控制体及其封闭边界。'],['n','边界的单位外法向，始终朝控制体外。'],['a','单位体积储存的物理量；质量为 ρ，动量为 ρv，总能量为 ρE。'],['J_a','向外输运该物理量的通量；纯对流且 a 为标量时 J_a = av，a 为向量时 J_a = a⊗v，此时通量是二阶张量。'],['s_a','单位体积、单位时间的源项，如 ρb 或体积热源 r。'],['j_a','写成边界输入的源通量，如应力功或向内的热输入；正负由实际物理模型定义。']],
    steps:[
      {title:'先定义储量，不急着令它等于零',text:'把体积密度 a 在 Ω 中相加，得到总量 Q。Q 可以非零，瞬时变化率也可以非零；“守恒”不是“任何固定区域里都不变”。',equations:[equation('总量与变化率','Q = ∫Ω a dV',eq(v('Q'),vol(v('a'))))]},
      {title:'固定外法向，算穿过边界的净流出',text:'J_a·n > 0 表示向外流出，会减少内部储量，所以前面放负号。入口的速度与外法向反向，点积为负，取负后正好是流入。'},
      {title:'把体源和边界作用加回来',text:'体源作用于整个体积；表面力、表面功和热输入作用于边界。它们与输运项分开记账。先保留完整项，再针对质量、动量或能量指定各项。'},
      {title:'用 Gauss 定理把面积分变成体积分',text:'固定 Ω 允许把时间导数移入积分。对边界通量应用散度定理后，所有项都在同一个体积中积分。',equations:[equation('任意固定控制体','∫Ω [∂a/∂t + ∇·J_a − s_a − ∇·j_a] dV = 0',eq(vol(row(o('['),pt(v('a')),o('+'),div(J),o('−'),source,o('−'),div(js),o(']'))),n(0)))]},
      {title:'从任意体积得到逐点方程',text:'对足够光滑的场，如果上式对任意小控制体都成立，被积函数便逐点为零，得到局部平衡式。遇到激波等不连续面，应回到积分／弱形式。'},
    ],
    meaning:['所有平衡方程都在回答同一件事：内部累积 = 净流入 + 源项。区别在于储存的是什么、怎样穿过表面、受到什么作用。','“平衡方程”也适用于加速、加热和随时间变化的流动。静态平衡或稳态，只是在特定条件下再删去某些变化项。'],
    conditions:['这里控制体固定；移动或变形控制体必须使用相对边界速度。','面积分与体积分的转换要求相应光滑性；一般守恒律也可用弱形式处理不连续流。','质量通常没有产生项；动量有外力；能量有功和热。不能把同一种源项机械地套给所有物理量。'],
    example:{title:'一个固定水箱的账本',text:'若入口流入 2 kg/s、出口流出 3 kg/s，且无质量源，水箱质量变化率为 −1 kg/s。箱内此刻仍可有 10 kg 水；“质量为 10 kg”与“每秒少 1 kg”是两种量。'},
    related:['gauss','reynolds-transport','continuity','momentum','total-energy'],sources:[arizona,vt],
  },
  {
    id:'continuity',name:'质量守恒',italian:'Equazione di continuità',symbol:'ρ',category:'质量平衡',
    summary:'质量不会凭空生成；局部密度变化与净流出互相补偿。',
    question:'一小块空间中的密度为什么会变化？怎样从流入和流出得到连续方程？',
    equations:[
      equation('保守形式','∂ρ/∂t + ∇·(ρv) = 0',eq(plus(pt(rho),div(par(row(rho,vel)))) ,n(0))),
      equation('沿流体质点的形式','Dρ/Dt + ρ ∇·v = 0',eq(plus(dt(rho),row(rho,div(vel))),n(0))),
    ],
    terms:[['ρ','流体密度，kg/m³。'],['v','当地速度向量，m/s。'],['∂ρ/∂t','固定空间位置的密度变化率。'],['D/Dt','物质导数：D/Dt = ∂/∂t + v·∇，跟着流体质点观察。'],['∇·v','局部体积膨胀率；正值表示随流体移动的小体积正在膨胀。']],
    steps:[
      {title:'把一般平衡式里的物理量换成质量',text:'单位体积质量是 ρ；单位面积质量输运是 ρv。这里讨论无总质量源、无额外表面质量源的总质量平衡。化学反应可以产生或消耗某个组分，混合物总质量仍然守恒。',equations:[equation('固定控制体','d/dt ∫Ω ρ dV + ∮∂Ω ρv·n dA = 0',eq(plus(time(vol(rho)),surface(row(rho,dot(vel,b('n'))))),n(0)))]},
      {title:'用散度定理得到保守形式',text:'把质量净流出变成 ∫Ω∇·(ρv)dV。对任意控制体成立，便得到上面的逐点方程。正的质量净流出必须由内部质量减少来补偿。'},
      {title:'展开密度与速度的乘积',text:'质量通量的散度不仅包含速度散度，也包含流体沿途经过密度不同区域的变化。',equations:[equation('乘积法则','∇·(ρv) = v·∇ρ + ρ∇·v',eq(div(par(row(rho,vel))),plus(dot(vel,grad(rho)),row(rho,div(vel)))))]},
      {title:'认出物质导数，再谈不可压缩',text:'∂ρ/∂t + v·∇ρ 正是 Dρ/Dt。若每个质点的密度不变，即 Dρ/Dt = 0，且 ρ > 0，才推出 ∇·v = 0。',equations:[equation('密度与体积变化的关系','Dρ/Dt = −ρ∇·v',eq(dt(rho),row(o('−'),rho,div(vel))))]},
    ],
    meaning:['Dρ/Dt < 0 对应 ∇·v > 0：一小团流体膨胀，同一份质量被摊到更大的体积里，密度下降。','定常只意味着固定位置的 ∂ρ/∂t = 0。质点沿着空间变化的密度场运动，Dρ/Dt 仍可能非零。'],
    conditions:['不可压缩不等于压力恒定，也不等于速度处处相同。','定常一维管流且横截面量可用平均值表示时，得到 ṁ = ρAU = 常数。','入口、出口多个时，要把每个截面的有向质量流率相加。'],
    example:{title:'收缩管里的速度',text:'对于定常、密度相同、无泄漏的一进一出管道，A₁U₁ = A₂U₂。若出口面积减半，平均出口速度加倍；可压缩流则必须同时保留密度。'},
    related:['reynolds-transport','balance','momentum','navier-stokes'],sources:[vt,arizona],
  },
  {
    id:'momentum',name:'动量平衡',italian:'Equazione della quantità di moto',symbol:'ρv',category:'力与运动',
    summary:'体力与表面力改变流体动量；加速度包含局部变化和沿途变化。',
    question:'压力、黏性和体力如何让流体加速或转弯？',
    equations:[
      equation('保守形式','∂(ρv)/∂t + ∇·(ρv⊗v) = ∇·σ + ρb',eq(plus(pt(par(row(rho,vel))),div(par(momentumFlux))),plus(div(sigma),row(rho,force)))),
      equation('Cauchy 动量方程','ρ Dv/Dt = −∇p + ∇·τ + ρb',eq(row(rho,dt(vel)),row(o('−'),grad(v('p')),o('+'),div(tau),o('+'),rho,force))),
    ],
    terms:[['ρv','单位体积动量，kg/(m²·s)。'],['ρv⊗v','动量输运的二阶张量；第 ij 分量为 ρv_i v_j。'],['σ = −pI + τ','总应力张量；p 为压力，τ 为黏性应力，I 为单位张量。'],['σn','外侧物质作用在控制体边界上的牵引力，N/m²。'],['b','单位质量体力，m/s²；重力时 b = g。'],['Dv/Dt','物质加速度 = ∂v/∂t + (v·∇)v。']],
    steps:[
      {title:'先对固定空间里的动量记账',text:'控制体内部的动量会变化，流体也会把动量带过边界。外力分成体力 ρb 和边界牵引力 σn。',equations:[equation('积分动量平衡','d/dt ∫Ω ρv dV + ∮∂Ω ρv(v·n) dA = ∫Ω ρb dV + ∮∂Ω σn dA',eq(plus(time(vol(row(rho,vel))),surface(row(rho,vel,par(dot(vel,b('n')))))),plus(vol(row(rho,force)),surface(row(sigma,b('n'))))))]},
      {title:'解释为什么通量是张量',text:'v·n 决定每秒穿过单位面积的体积；ρv 是这股流体携带的动量密度。相乘后得到穿过该面的动量流率。要同时适用于所有方向的面，就用二阶张量。',equations:[equation('通量作用在某个面上','(ρv⊗v)n = ρv(v·n)',eq(row(par(momentumFlux),b('n')),row(rho,vel,par(dot(vel,b('n'))))))]},
      {title:'把输运项展开，利用质量守恒',text:'保守形式展开后有一组 v 乘以连续方程的项。那一组为零，所以余下的是 ρ 乘以物质加速度，不能把对流加速度漏掉。',equations:[equation('连续方程消去的那一组','∂(ρv)/∂t + ∇·(ρv⊗v) = ρDv/Dt + v[∂ρ/∂t + ∇·(ρv)]',eq(plus(pt(par(row(rho,vel))),div(par(momentumFlux))),plus(row(rho,dt(vel)),row(vel,o('['),pt(rho),o('+'),div(par(row(rho,vel))),o(']')))))]},
      {title:'拆开压力和黏性应力',text:'均匀压力在小体积相对两面上抵消，压力不均匀时留下 −∇p，指向低压一侧。黏性应力的散度是表面剪切与黏性法向应力合成后的单位体积力。',equations:[equation('应力分解','σ = −pI + τ',eq(sigma,plus(row(o('−'),v('p'),b('I')),tau)))]},
      {title:'把原笔记中的旋度形式连回来',text:'定义涡量 ω = ∇×v。下面是运动学恒等式，能把对流加速度改写成速度平方的梯度与涡量项；它本身没有假设无黏、定常或无旋。',equations:[equation('Lamb 恒等式','(v·∇)v = ∇(|v|²/2) − v×ω',eq(row(par(dot(vel,o('∇'))),vel),row(grad(par(kinetic)),o('−'),vel,o('×'),b('ω'))))]},
    ],
    meaning:['对一个随流体移动的小体积，净外力决定它的动量变化率。压力、黏性和体力是不同来源的力，都应先保留。','在弯管内，即使速度大小不变，方向改变仍有加速度，也就需要净力。定常流动也完全可以有加速度。'],
    conditions:['这仍是一般动量平衡；只有指定 τ 与速度梯度的关系后，才得到牛顿流体的 Navier–Stokes 方程。','无黏令 τ = 0 得 Euler 方程；忽略重力或其他体力需要另加假设。','张量约定为 (∇v)_ij = ∂v_i/∂x_j，(∇·σ)_i = ∂σ_ij/∂x_j。普通无偶应力流体中 σ 对称。'],
    example:{title:'喷管中的净外力',text:'定常一进一出且沿同一轴线，若 ṁ = 2 kg/s，入口 U₁ = 3 m/s、出口 U₂ = 8 m/s，则流体受到的总外力为 2 × (8−3) = 10 N。这里总外力包含压力、壁面力与体力，不能直接当成壁面力。'},
    related:['continuity','kinetic-energy','navier-stokes','vector-tools'],sources:[vt],
  },

];

export const formulaGroups = [
  {id:'operations',label:'基础运算规则',description:'按 nabla 算子整理定义、输入输出和乘积规则。'},
  {id:'theorems',label:'积分与输运定理',description:'连接局部与整体，以及物质系统与控制体。'},
  {id:'balance',label:'平衡方程',description:'对质量、动量、能量和熵逐项记账。'},
  {id:'models',label:'闭合与模型',description:'用材料和热力学关系补全可求解的方程组。'},
];

export const formulas = [
  ...coreFormulas.slice(0,3),
  ...energyFormulas.filter(item=>item.id!=='entropy'),
  navierStokesFormula,
  thinAirfoilFormula,
  glauertFormula,
  ...energyFormulas.filter(item=>item.id==='entropy'),
  vectorToolsFormula,
  ...theoremFormulas,
].map(item=>({...item,group:item.group || (item.id==='vector-tools'?'operations':item.id==='navier-stokes'?'models':theoremFormulas.some(theorem=>theorem.id===item.id)?'theorems':'balance')}));

