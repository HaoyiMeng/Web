import {v,b,o,n,t,row,sub,sup,frac,eq,plus,par,dot,grad,div,dt,pt,integral,surface,equation} from './formula-math.mjs';

const rho=v('ρ'), velocity=b('v'), heat=b('q'), force=b('b'), stress=b('σ'), tau=b('τ');
const E=v('E'), e=v('e'), kinetic=v('κ'), temperature=v('T'), entropy=v('s');
const norm2=(x)=>sup(row(o('|'),x,o('|')),n(2));
const contraction=(a,c)=>row(a,o(':'),c);
const phi=v('Φ');
const forcePower=row(rho,dot(force,velocity));
const heatLoss=row(o('−'),div(heat));
const viscousPowerFlux=div(par(row(tau,velocity)));
const pressurePowerFlux=row(o('−'),div(par(row(v('p'),velocity))));
const kineticDefinition=equation('单位质量动能','κ = |v|²/2',eq(kinetic,frac(norm2(velocity),n(2))));
const totalMaterial=equation('随流体运动的总能平衡','ρ DE/Dt = ∇·(σv) − ∇·q + ρb·v + r',eq(row(rho,dt(E)),row(div(par(row(stress,velocity))),heatLoss,o('+'),forcePower,o('+'),v('r'))));
const kineticMaterial=equation('动量方程点乘速度','ρ Dκ/Dt = −v·∇p + v·(∇·τ) + ρb·v',eq(row(rho,dt(kinetic)),row(o('−'),dot(velocity,grad(v('p'))),o('+'),dot(velocity,par(div(tau))),o('+'),forcePower)));
const internalMaterial=equation('内能方程','ρ De/Dt = −p∇·v + Φ − ∇·q + r',eq(row(rho,dt(e)),row(o('−'),v('p'),div(velocity),o('+'),phi,heatLoss,o('+'),v('r'))));
const productIdentity=equation('应力功的乘积法则','∇·(σv) = v·(∇·σ) + σ:∇v',eq(div(par(row(stress,velocity))),plus(dot(velocity,par(div(stress))),contraction(stress,grad(velocity)))));
const nasa={title:'NASA · Navier–Stokes conservation equations (p. 10)',url:'https://ntrs.nasa.gov/api/citations/20150009530/downloads/20150009530.pdf'};
const mit={title:'MIT · Heat and energy conservation',url:'https://web.mit.edu/fluids-modules/www/fluid_transport/4-1-2energy.pdf'};
const cambridge={title:'Cambridge · Moffatt, energy and entropy equations (§1.5–1.7)',url:'https://www.damtp.cam.ac.uk/user/hkm2/PDFs/Moffatt_1977_GordonandBreach_Slogfdatohdt_149.pdf'};
const mitEntropy={title:'MIT 2.43 · Entropy balance and production (slides 23.04–23.14)',url:'https://ocw.mit.edu/courses/2-43-advanced-thermodynamics-spring-2024/mit2_43_s24_lec23.pdf'};

export const energyFormulas=[
  {
    id:'total-energy',name:'总能量平衡',italian:'Bilancio dell’energia totale',symbol:'E',category:'能量平衡',
    summary:'内能与整体运动的动能一起记账，追踪热量和外力功怎样改变它们。',
    question:'一小团空气在加速、受压和传热时，得到的能量究竟去了哪里？',
    equations:[
      equation('本页总比能的定义','E = e + |v|²/2',eq(E,plus(e,frac(norm2(velocity),n(2))))),
      totalMaterial,
    ],
    terms:[['E、e','总比能与比内能，J/kg；E 不含重力势能。'],['σ = −pI + τ','总应力：压力部分与黏性部分，Pa。'],['q','热流密度向量，W/m²；q·n > 0 表示热量向外流出。'],['ρb·v','体力对流体做功的体积功率，W/m³；b 的单位为 m/s²。'],['r','体积热源，W/m³；正值表示向流体内部供热。']],
    steps:[
      {title:'先选同一团流体，使用热力学第一定律',text:'跟着物质体 Ωₘ(t) 运动，没有流体穿越它的边界。其能量增加率等于外界对它的做功率加净热输入。表面力是 σn，因此表面功率要点乘边界处流体速度；热通量正方向向外，所以净热输入前有负号。',equations:[equation('物质体的能量收支','d/dt ∫Ωₘ ρE dV = ∮∂Ωₘ (σn)·v dA − ∮∂Ωₘ q·n dA + ∫Ωₘ (ρb·v+r) dV',eq(row(frac(v('d'),row(v('d'),v('t'))),integral(sub(v('Ω'),v('m')),row(rho,E))),row(sub(o('∮'),row(o('∂'),sub(v('Ω'),v('m')))),dot(par(row(stress,b('n'))),velocity),v('d'),v('A'),o('−'),sub(o('∮'),row(o('∂'),sub(v('Ω'),v('m')))),dot(heat,b('n')),v('d'),v('A'),o('+'),integral(sub(v('Ω'),v('m')),par(plus(forcePower,v('r')))))))]},
      {title:'用输运定理和 Gauss 定理局部化',text:'质量守恒把物质体左侧写成 ∫ρDE/Dt dV；Gauss 定理把热流和应力功的表面积分改成体积分。对任意物质体都成立，积分内的量便必须逐点相等。普通流体应力对称，所以应力功通量可写 σv。',equations:[totalMaterial]},
      {title:'拆开压力功与黏性功',text:'代入 σ = −pI + τ，压力传递的功率与黏性应力传递的功率分别出现。此处还没有假定定常、无黏、绝热或没有体力。',equations:[equation('保留全部来源','ρ DE/Dt = −∇·(pv) + ∇·(τv) − ∇·q + ρb·v + r',eq(row(rho,dt(E)),row(pressurePowerFlux,o('+'),viscousPowerFlux,heatLoss,o('+'),forcePower,o('+'),v('r'))))]},
      {title:'换成固定控制体时，加上随流体穿界的能量',text:'固定空间中的 Ω 会有流入流出。左侧必须同时包含内部积累与对流带走的能量。由连续方程，局部保守形式与上面的物质导数形式等价。',equations:[equation('固定控制体对应的局部形式','∂(ρE)/∂t + ∇·(ρEv) = ∇·(σv) − ∇·q + ρb·v + r',eq(plus(pt(par(row(rho,E))),div(par(row(rho,E,velocity)))),row(div(par(row(stress,velocity))),heatLoss,o('+'),forcePower,o('+'),v('r'))))]},
    ],
    meaning:['E 同时包含分子的内能和整团流体有序运动的动能；二者可以相互转换，总账仍满足第一定律。','压力项是通过边界力传递能量的功率。p 的单位虽与能量密度相同，不能据此把它另加成一份“储存在压力里”的能量。'],
    conditions:['采用连续介质、普通无偶应力流体，并在惯性参考系描述。E 未包含势能，因此体力功 ρb·v 必须保留。','若把保守体力势能并入 E，需同步重写体力功项，避免重复计算。边界绝热只规定边界 q·n = 0，不能据此删除任意内部位置的导热项。'],
    example:{title:'固定控制体里的能量账',text:'设对流流入携带 100 W、流出携带 90 W，净热输入 5 W，表面力与体力净做功 15 W。控制体内总能增加率为 100 − 90 + 5 + 15 = 30 W，即每秒增加 30 J。这里的携能按 E 计算，压力功已计入外力功，不能再重复加一次。'},
    related:['balance','kinetic-energy','internal-energy'],sources:[nasa,cambridge],
  },
  {
    id:'kinetic-energy',name:'动能平衡',italian:'Bilancio dell’energia cinetica',symbol:'κ',category:'能量平衡',
    summary:'把动量方程投影到速度方向，读出哪些力正在让流体加速或减速。',
    question:'同样是受力，为什么有的力只改变流向，有的力会改变流体的速度大小？',
    equations:[kineticDefinition,kineticMaterial],
    terms:[['κ = |v|²/2','单位质量的宏观动能，J/kg；不包含分子热运动。'],['v·f','力密度 f 的功率密度；只取沿速度方向的分量。'],['Φ = τ:∇v','黏性耗散率，W/m³。这里是单位体积的量，不是单位质量的量。'],['∇·(τv)','黏性应力传递功率的散度，W/m³，与 Φ 不同。']],
    steps:[
      {title:'从完整动量方程开始',text:'保留压力梯度、黏性应力和体力。用速度与两侧点乘，相当于把牛顿第二定律乘以运动速度，把“力改变动量”改写为“力做功改变动能”。',equations:[equation('动量方程乘以速度','ρv·Dv/Dt = −v·∇p + v·(∇·τ) + ρb·v',eq(row(rho,dot(velocity,dt(velocity))),row(o('−'),dot(velocity,grad(v('p'))),o('+'),dot(velocity,par(div(tau))),o('+'),forcePower)))]},
      {title:'识别左侧是动能变化率',text:'因为 D(v·v)/Dt = 2v·Dv/Dt，所以左侧就是 ρDκ/Dt。这个转换只是微分链式法则，不需要定常或不可压缩假设。',equations:[kineticMaterial]},
      {title:'把表面传递与内部转换分开',text:'逐分量使用乘积法则：vᵢ∂ⱼτᵢⱼ = ∂ⱼ(vᵢτᵢⱼ) − τᵢⱼ∂ⱼvᵢ。于是黏性作用分成跨边界传递功率，以及从宏观动能转入内能的耗散。压力项同样拆成压力功通量和膨胀功。',equations:[equation('动能的功率收支','ρ Dκ/Dt = −∇·(pv) + p∇·v + ∇·(τv) − Φ + ρb·v',eq(row(rho,dt(kinetic)),row(pressurePowerFlux,o('+'),v('p'),div(velocity),o('+'),viscousPowerFlux,o('−'),phi,o('+'),forcePower)))]},
    ],
    meaning:['与速度垂直的力可以改变流向而不直接改变速度大小；点乘正好挑出做功的部分。','黏性力的局部功率 v·(∇·τ) 不必总为负：邻近流体或运动壁面可以通过应力向这一小块输送动能。不可逆转换对应 Φ，而不是整个黏性功率项。'],
    conditions:['这是由动量方程导出的平衡式，并不是独立的闭合关系。普通牛顿流体满足适当的非负黏性系数时，Φ ≥ 0。','定常只让局部时间导数消失；沿流线加速仍能改变动能。流体受压、传热后温度怎样变化，还要结合内能方程。'],
    example:{title:'匀速剪切也会耗散',text:'平行板间的线性剪切取 vₓ = γ̇y、vᵧ = 0，黏度 μ = 0.1 Pa·s、剪切率 γ̇ = 10 s⁻¹。每个流体质点的动能可以保持不变，但 Φ = μγ̇² = 10 W/m³。运动壁面输入的功，经黏性功通量传到流体内并转为内能。'},
    related:['momentum','total-energy','internal-energy'],sources:[cambridge,mit],
  },
  {
    id:'internal-energy',name:'内能平衡',italian:'Bilancio dell’energia interna',symbol:'e',category:'能量平衡',
    summary:'总能扣除宏观动能，留下压缩、黏性耗散和传热怎样改变内能。',
    question:'一团气体即使没有明显加速，为什么压缩它或搅拌它仍会让它升温？',
    equations:[internalMaterial,equation('黏性耗散的定义','Φ = τ:∇v = Σᵢⱼ τᵢⱼ ∂vᵢ/∂xⱼ',eq(phi,contraction(tau,grad(velocity)),row(sub(o('∑'),row(v('i'),o(','),v('j'))),sub(v('τ'),row(v('i'),v('j'))),frac(row(o('∂'),sub(v('v'),v('i'))),row(o('∂'),sub(v('x'),v('j')))))))],
    terms:[['e','单位质量内能，J/kg；对于量热完全气体 de = cᵥdT。'],['−p∇·v','压缩或膨胀引起的内能转换功率密度，W/m³。'],['Φ','宏观机械能转化为内能的黏性耗散率，W/m³。'],['−∇·q + r','导热净输入与体积热源，W/m³；Fourier 导热 q = −k∇T。']],
    steps:[
      {title:'把总能拆成内能与动能',text:'采用 E = e + κ，因此 ρDE/Dt = ρDe/Dt + ρDκ/Dt。先保留总能式中的热通量、体力功、应力功和体积热源。',equations:[totalMaterial]},
      {title:'用乘积法则展开应力功',text:'应力功通量的散度包含两部分：一部分使流体整体动能改变，另一部分作用于流体的形变。普通流体的应力张量对称时，下式与本页的梯度约定一致。',equations:[productIdentity]},
      {title:'减去动能方程',text:'总能减去由动量得到的动能式后，v·(∇·σ) 与体力功 ρb·v 同时抵消。体力没有消失，它改变整体动能的那一份已被扣除；内能仍会通过压缩和黏性受运动间接影响。',equations:[equation('扣除动能后的结果','ρ De/Dt = σ:∇v − ∇·q + r',eq(row(rho,dt(e)),row(contraction(stress,grad(velocity)),heatLoss,o('+'),v('r'))))]},
      {title:'识别压缩功、耗散和导热',text:'代入 σ = −pI + τ，利用 I:∇v = ∇·v，得到上面的完整内能方程。若再采用 Fourier 定律，导热项成为 +∇·(k∇T)，变物性时不能直接替换成 k∇²T。',equations:[internalMaterial,equation('Fourier 导热闭合后的形式','ρ De/Dt = −p∇·v + Φ + ∇·(k∇T) + r',eq(row(rho,dt(e)),row(o('−'),v('p'),div(velocity),o('+'),phi,o('+'),div(par(row(v('k'),grad(temperature)))),o('+'),v('r'))))]},
    ],
    meaning:['压缩时 ∇·v < 0，因此 −p∇·v > 0：周围压力对流体做功，内能增加。膨胀时符号反过来。','Φ 描述有序运动不可逆地转为内能；它在动能式中带负号，在内能式中带正号，二者相加时抵消，所以黏性没有凭空创造总能。'],
    conditions:['不可压缩时 ∇·v = 0，只能删除压缩功，黏性耗散和导热仍可能存在。忽略 Φ 需要量级估计，不能只因流动定常就删除它。','本页的 Φ 为体积耗散率。若资料定义单位质量耗散率 D = Φ/ρ，内能方程中应写 ρD；两种记号不可混用。无化学反应与组分扩散的简单流体，仍需状态关系才能由 e 求 T。'],
    example:{title:'绝热压缩为什么升温',text:'取当地点压力 p = 100 kPa、速度散度 ∇·v = −2 s⁻¹，暂忽略导热、黏性耗散和体积热源。则 ρDe/Dt = −p∇·v = 2.0 × 10⁵ W/m³。这个正值来自周围压力的压缩功，即使没有外界热量输入，内能也会增加。'},
    related:['total-energy','kinetic-energy','entropy'],sources:[cambridge,mit],
  },
  {
    id:'entropy',name:'熵平衡',italian:'Bilancio dell’entropia',symbol:'s',category:'热力学',
    summary:'能量守恒之外，再区分熵的搬运、外界供给和不可逆产生。',
    question:'热量从热处流向冷处时，能量并没有减少，为什么过程仍有明确的方向？',
    equations:[
      equation('Gibbs 关系','T ds = de + p d(1/ρ)',eq(row(temperature,v('d'),entropy),plus(row(v('d'),e),row(v('p'),v('d'),par(frac(n(1),rho)))))),
      equation('熵随流体质点的变化','ρT Ds/Dt = Φ − ∇·q + r',eq(row(rho,temperature,dt(entropy)),row(phi,heatLoss,o('+'),v('r')))),
    ],
    terms:[['s、T','比熵，J/(kg·K)，以及绝对温度，K；必须使用 T > 0。'],['q/T','由导热携带的熵通量，W/(m²·K)，此外还存在对流熵通量 ρsv。'],['Πₛ','内部熵产生率，W/(m³·K)；与总应力张量 σ 的符号区分。'],['r/T','本页局部平衡热源模型中的熵供给，不属于下面的耗散熵产项。']],
    steps:[
      {title:'先限定热力学状态模型',text:'对局部热力学平衡、组分固定的简单可压缩流体，Gibbs 关系把熵、内能和比容联系起来。沿同一个质点对时间求导，再乘以 ρ。',equations:[equation('沿质点求导','ρT Ds/Dt = ρ De/Dt + ρp D(1/ρ)/Dt',eq(row(rho,temperature,dt(entropy)),plus(row(rho,dt(e)),row(rho,v('p'),dt(par(frac(n(1),rho)))))))]},
      {title:'用连续方程消去比容变化',text:'质量守恒给出 Dρ/Dt = −ρ∇·v，所以 D(1/ρ)/Dt = (∇·v)/ρ。代入内能方程后，Gibbs 关系中的 +p∇·v 与内能式中的压缩功 −p∇·v 抵消。',equations:[equation('得到质点形式的熵平衡','ρT Ds/Dt = Φ − ∇·q + r',eq(row(rho,temperature,dt(entropy)),row(phi,heatLoss,o('+'),v('r'))))]},
      {title:'将熵的输运与产生分开',text:'除以 T，并使用 −(∇·q)/T = −∇·(q/T) − q·∇T/T²。再用连续方程把物质导数改写成保守形式：热量携带的熵进入通量项，其余不可逆转换进入熵产生率。',equations:[equation('保守形式','∂(ρs)/∂t + ∇·(ρsv + q/T) = Πₛ + r/T',eq(plus(pt(par(row(rho,entropy))),div(par(plus(row(rho,entropy,velocity),frac(heat,temperature))))),plus(sub(v('Π'),v('s')),frac(v('r'),temperature)))),equation('局部内部熵产生率','Πₛ = Φ/T − q·∇T/T²',eq(sub(v('Π'),v('s')),row(frac(phi,temperature),o('−'),frac(dot(heat,grad(temperature)),sup(temperature,n(2))))))]},
      {title:'用物性关系判断不可逆方向',text:'对于 Fourier 导热 q = −k∇T，导热熵产为 k|∇T|²/T²。牛顿流体在剪切黏度和体积黏度非负时 Φ ≥ 0；加上 k ≥ 0，便得到 Πₛ ≥ 0。这是模型满足第二定律的要求。',equations:[equation('牛顿／Fourier 模型的非负熵产','Πₛ = Φ/T + k|∇T|²/T² ≥ 0',row(eq(sub(v('Π'),v('s')),plus(frac(phi,temperature),frac(row(v('k'),norm2(grad(temperature))),sup(temperature,n(2))))),o('≥'),n(0)))]},
    ],
    meaning:['质量和能量可以守恒，熵还可以在内部产生。Φ/T 对应黏性耗散的熵产，−q·∇T/T² 对应有限温差导热的熵产。','一块区域的熵积累可以为零，但内部熵产生率仍为正，因为熵能够同时被流体或热流输送到区域外。'],
    conditions:['采用组分固定的简单可压缩流体与局部热平衡；存在反应、组分扩散或额外耦合输运时，要补入相应熵通量与熵产。','非负耗散要求牛顿流体 μ ≥ 0、体积黏度 ζ = λ + 2μ/3 ≥ 0，且 Fourier 导热 k ≥ 0、T > 0。r/T 在此作为局部热源供给项；热源的实际机制若需单独建模，应相应重算其熵收支。','无黏、没有热通量且没有热源时才可由此得到 Ds/Dt = 0；绝热边界本身并不排除内部黏性熵产。'],
    example:{title:'稳态导热也能产生熵',text:'10 W 热量稳态穿过热端 310 K、冷端 290 K 的导热层。能量流入与流出相等，而层内总熵产生率为 10(1/290 − 1/310) ≈ 2.22 × 10⁻³ W/K，大于零。它等于向冷端流出的熵率减去从热端流入的熵率。'},
    related:['internal-energy','total-energy','navier-stokes'],sources:[cambridge,mitEntropy],
  },
];
