import {v,b,o,n,t,row,sub,sup,frac,eq,plus,par,dot,div,pt,integral,surface,equation} from './formula-math.mjs';

const normal=b('n'), field=b('F'), velocity=b('v'), wall=b('w'), rho=v('ρ'), beta=v('β');
const time=(expression)=>row(frac(v('d'),row(v('d'),v('t'))),expression);
const volume=(expression)=>integral(v('Ω'),expression);
const sum=(index,expression)=>row(sub(o('∑'),v(index)),expression);
const partial=(value,direction)=>frac(row(o('∂'),value),row(o('∂'),v(direction)));
const curl=(value)=>row(o('∇'),o('×'),value);
const area=(domain,expression)=>integral(domain,expression,'A');
const cv=row(t('CV'),par(v('t'))), cs=row(t('CS'),par(v('t')));
const cvIntegral=(expression)=>integral(cv,expression);
const csIntegral=(expression)=>row(sub(o('∮'),cs),expression,v('d'),v('A'));
const relative=row(velocity,o('−'),wall);
const density=row(rho,beta);
const system=sub(v('B'),t('sys'));
const relativeFlux=row(density,par(dot(par(relative),normal)));
const reynolds=equation('移动或变形控制体的 Reynolds 输运定理','dB_sys/dt = d/dt ∫CV(t) ρβ dV + ∮CS(t) ρβ[(v−w)·n] dA',eq(time(system),plus(time(cvIntegral(density)),csIntegral(relativeFlux))));
const gauss=equation('Gauss 散度定理','∮∂Ω F·n dA = ∫Ω ∇·F dV',eq(surface(dot(field,normal)),volume(div(field))));
const stokes=equation('Stokes 环流定理','∮∂S F·dr = ∫S (∇×F)·n dA',eq(row(sub(o('∮'),row(o('∂'),v('S'))),dot(field,row(v('d'),b('r')))),area(v('S'),dot(par(curl(field)),normal))));

const arizona={title:'University of Arizona · Vector calculus and integral theorems',url:'https://opentextbooks.library.arizona.edu/mathematicalmodeling/chapter/appendix-vector-calculus/'};
const sydney={title:'University of Sydney · The theorem of Stokes',url:'https://extern.maths.usyd.edu.au/u/daners/publ/vector-calculus/chapter-integral-theorems-5-4.html'};
const caltech={title:'Caltech Ae/APh 101 · Reynolds transport theorem (§1.2–1.3)',url:'https://shepherd.caltech.edu/Ae101/old/guide/guide.pdf'};
const psu={title:'Penn State · Linear momentum for a moving control volume',url:'https://www.me.psu.edu/cimbala/me320/Lesson_Notes/Fluid_Mechanics_Lesson_06C.pdf'};

export const theoremFormulas=[
  {
    id:'gauss',name:'高斯散度定理',italian:'Teorema della divergenza di Gauss',symbol:'∇·',category:'积分与局部的桥梁',
    summary:'把封闭表面的净流出，换成内部每一点的散度之和。',
    question:'为什么一个区域外表面的通量，可以用内部每个小体积的净流出强度来计算？',
    equations:[gauss],
    terms:[['Ω、∂Ω','三维体积区域及其完整的封闭边界；不能漏掉入口、出口或盖面。'],['F','足够光滑的向量场，可取速度 v、质量通量 ρv 或热通量 q。'],['n','边界的单位外法向；F·n > 0 表示向外穿出。'],['∇·F','单位体积的净流出强度，是标量。若 F 为速度，单位是 s⁻¹。']],
    steps:[
      {title:'先对一个微小长方体算两面的差',text:'右面通量减去左面通量，约为 Fₓ 在 x 方向的变化率乘以体积。把另外两对面的贡献加上，就得到散度乘以体积。',equations:[equation('小体积的局部收支','δΦ_out ≈ (∂F_x/∂x + ∂F_y/∂y + ∂F_z/∂z)δV = (∇·F)δV',row(v('δ'),sub(v('Φ'),t('out')),o('≈'),eq(row(par(plus(partial(sub(v('F'),v('x')),'x'),partial(sub(v('F'),v('y')),'y'),partial(sub(v('F'),v('z')),'z'))),v('δ'),v('V')),row(par(div(field)),v('δ'),v('V')))))]},
      {title:'把大区域切成许多小块',text:'两个相邻小块共享的面，通量场相同，但两块的外法向相反。这一面在一块账上是流出，在另一块账上是等量流入，求和时恰好抵消。',equations:[equation('内部共享面的抵消','F·n₁ + F·n₂ = 0，n₂ = −n₁',row(eq(plus(dot(field,sub(b('n'),n(1))),dot(field,sub(b('n'),n(2)))),n(0)),t('，'),eq(sub(b('n'),n(2)),row(o('−'),sub(b('n'),n(1))))))]},
      {title:'内部面消失，只留下整体外边界',text:'所有小块通量加起来后，内部面两两抵消，剩下的正是原区域封闭表面的净流出。把小块尺寸趋于零，散度乘体积的求和成为体积分，得到 Gauss 定理。',equations:[gauss]},
      {title:'在平衡方程里连接积分与微分',text:'例如把质量通量取为 F = ρv，控制面上的质量净流出就能改写成体积分，再与控制体中的质量积累放到同一个积分里。若对任意控制体都成立，才能进一步得到逐点连续方程。对张量逐行使用同一定理，还能把表面牵引力转换为应力散度。',equations:[equation('张量的逐行推广','∮∂Ω Tn dA = ∫Ω ∇·T dV',eq(surface(row(b('T'),normal)),volume(div(b('T')))))]},
    ],
    meaning:['散度是局部的净流出密度；封闭边界通量是整体的净流出。定理说明二者是同一件几何事实在不同尺度上的表达。','Gauss 定理本身不要求流体不可压缩，也不要求净流出为零。只有另加质量守恒及相应物性条件，才会得到特定的零散度结论。'],
    conditions:['Ω 的边界应分片光滑并封闭，n 采用外法向；F 在包含区域及其边界的邻域内具有连续的一阶导数，是本页使用的充分条件。','若区域内有奇点或流场跨激波不光滑，不能直接套用这里的经典光滑形式；可分区、挖去奇点并补齐边界，或采用相应弱形式。','张量约定为 (∇·T)ᵢ = Σⱼ ∂Tᵢⱼ/∂xⱼ，因此表面项是 Tn；其他教材的转置约定要同步核对。'],
    example:{title:'六个面的流出与体积里的散度',text:'取瞬时速度场 v = (ax, ay, az)，a = 1 s⁻¹，在以原点为中心、边长 2 m 的立方体上计算。散度为 3 s⁻¹，体积为 8 m³，所以总净流出为 24 m³/s。逐面算时，每面的外法向速度都是 1 m/s、面积都是 4 m²，六面合计同样是 24 m³/s。这是膨胀速度场，不能再把它当作不可压缩流。'},
    related:['balance','continuity','momentum','vector-tools'],sources:[arizona],
  },
  {
    id:'stokes',name:'斯托克斯环流定理',italian:'Teorema del rotore di Stokes',symbol:'∇×',category:'积分与局部的桥梁',
    summary:'把边界上一圈的环流，换成跨面内旋度法向分量的积分。',
    question:'沿一条闭合曲线绕一圈的积分，为什么能由跨过这条曲线的曲面内部来决定？',
    equations:[stokes],
    terms:[['S、∂S','S 是有取向的曲面，∂S 是它的完整边界闭合曲线，可包含多个分量。'],['F、dr','F 为向量场；dr 是沿边界正方向的切向线元。'],['n','S 上连续选取的单位法向；它与边界绕行方向按右手定则匹配。'],['∇×F','F 的旋度。取 F = v 时，ω = ∇×v 是涡量，单位 s⁻¹。']],
    steps:[
      {title:'先在平面小矩形上沿边计算',text:'取法向为 +z 的小矩形，沿右手定则逆时针绕行。相对两条水平边贡献 −(∂Fₓ/∂y)δA，另两条边贡献 (∂Fᵧ/∂x)δA，合起来就是旋度的 z 分量乘面积。',equations:[equation('微小矩形的环流','δΓ ≈ (∂F_y/∂x − ∂F_x/∂y)δA = (∇×F)_z δA',row(v('δ'),v('Γ'),o('≈'),eq(row(par(row(partial(sub(v('F'),v('y')),'x'),o('−'),partial(sub(v('F'),v('x')),'y'))),v('δ'),v('A')),row(sub(par(curl(field)),v('z')),v('δ'),v('A')))))]},
      {title:'用小曲面片拼成整个曲面',text:'在足够小的尺度上，每片曲面近似平面，局部环流近似 (∇×F)·n δA。给所有面片一致的法向后，相邻面片会沿同一条内部边反向走过，线积分于是两两抵消。'},
      {title:'只剩外边界，再取极限',text:'小面片环流相加时，内部边界消失，剩下的是整个曲面的边界 ∂S。面积求和的极限成为旋度的曲面积分。右手定则必须贯穿所有面片和最终边界。',equations:[stokes]},
      {title:'把环流和涡量连起来',text:'若 F = v，曲线积分是速度环流 Γ。定理把 Γ 与跨面上的涡量通量联系起来。二维 Green 定理是曲面位于平面时的特例；三维 Stokes 定理还允许弯曲曲面。',equations:[equation('速度场中的环流与涡量','Γ = ∮∂S v·dr = ∫S ω·n dA；ω = ∇×v',row(eq(v('Γ'),row(sub(o('∮'),row(o('∂'),v('S'))),dot(velocity,row(v('d'),b('r')))),area(v('S'),dot(b('ω'),normal))),t('；'),eq(b('ω'),curl(velocity))))]},
    ],
    meaning:['旋度的法向分量描述局部的环流密度，把这些局部贡献在曲面上相加，就得到整条边界的环流。','这是一条空间积分恒等式，本身没有说明环流随时间守恒。Kelvin 环流定理还需要动力学条件；Stokes 定理也不等同于黏性流中的 Stokes 近似。'],
    conditions:['S 应可定向且分片光滑，边界分片光滑；F 在包含 S 的邻域内连续可微，是本页采用的充分条件。','n 与 ∂S 的绕行方向必须按右手定则对应；若同时反转两者，等式仍成立。只反转一边则差一个负号。','替换跨面时，要保证向量场在新曲面上也足够光滑。若理想化的奇异涡线或其他奇点穿过曲面，不能只因曲线上的场可读就直接套用经典定理；光滑的有限涡核则没有这项障碍。'],
    example:{title:'刚体转动：为什么涡量是角速度的两倍',text:'取 v = (−Ωy, Ωx, 0)，Ω = 2 s⁻¹。圆盘法向取 +z，半径 R = 0.5 m，边界从 +z 一侧看逆时针。涡量为 (0, 0, 2Ω)，所以 Γ = 2ΩπR² = π m²/s。沿圆周直接算，切向速度 ΩR = 1 m/s、周长 π m，环流仍是 π m²/s。若绕行方向反转，结果为 −π m²/s。'},
    related:['vector-tools','momentum','gauss'],sources:[arizona,sydney],
  },
  {
    id:'reynolds-transport',name:'雷诺输运定理',italian:'Teorema del trasporto di Reynolds',symbol:'d / dt',category:'物质体与控制体',
    summary:'用控制体内的积累，加相对边界的通量，描述同一团流体的物理量变化。',
    question:'牛顿定律和热力学定律跟着同一团物质说话，怎样把它们改写成管道、喷管或移动活塞的控制体账本？',
    equations:[reynolds],
    terms:[['B_sys、β','同一组流体质点构成的物质系统所具有的总量，以及单位质量该物理量。质量取 β = 1，动量取 β = v，总能取 β = E。'],['CV(t)、CS(t)','可移动、可变形的控制体，以及它的完整封闭控制面。'],['v、w','同一参考系中的流体速度与控制面当地速度，m/s。'],['(v−w)·n','相对控制面的法向穿越速度；正值表示流体穿出控制体。'],['ρβ','单位体积储量。β 为向量时，ρβ[(v−w)·n] 也是向量；对应通量张量为 ρβ⊗(v−w)。']],
    steps:[
      {title:'在一个时刻，让两种观察对象重合',text:'选定时刻 t，令物质系统恰好占据 CV(t)。随后物质系统跟着流体质点走，控制面则按指定的 w 移动。两者未来一般不再占据同一区域，因此它们的总量变化率不能直接画等号。'},
      {title:'先处理移动积分域多出来的薄壳',text:'即使空间中的密度场 a 不随时间变，边界向外移动也会把新体积纳入积分。边界面积 dA 在 dt 内扫过的有向体积是 (w·n)dA dt。加上旧域内场值自身的变化，得到几何输运关系。',equations:[equation('移动积分域的几何输运公式','d/dt ∫Ω(t) a dV = ∫Ω(t) ∂a/∂t dV + ∮∂Ω(t) a(w·n) dA',eq(time(integral(row(v('Ω'),par(v('t'))),v('a'))),plus(integral(row(v('Ω'),par(v('t'))),pt(v('a'))),row(sub(o('∮'),row(o('∂'),v('Ω'),par(v('t')))),v('a'),par(dot(wall,normal)),v('d'),v('A')))))]},
      {title:'比较物质体与控制体，得到相对通量',text:'物质体边界以 v 移动，控制面以 w 移动。对二者使用上面的几何公式，在它们重合的时刻相减，内部的 ∂a/∂t 项抵消，薄壳差只剩 (v−w)·n。取 a = ρβ，移项后便得到 Reynolds 输运定理。',equations:[reynolds]},
      {title:'检查固定与随体的两个极限',text:'固定控制体取 w = 0，通量用 v·n；物质控制面取 w = v，相对通量为零，控制体里的积累便等于系统的变化。流体与控制面速度的切向差不产生穿界通量，只有法向分量起作用。',equations:[equation('固定控制体','w = 0：dB_sys/dt = d/dt ∫CV ρβ dV + ∮CS ρβ(v·n) dA',row(eq(wall,b('0')),t('：'),eq(time(system),plus(time(integral(t('CV'),density)),row(sub(o('∮'),t('CS')),density,par(dot(velocity,normal)),v('d'),v('A')))))),equation('物质控制面','w = v：dB_sys/dt = d/dt ∫CV(t) ρβ dV',row(eq(wall,velocity),t('：'),eq(time(system),time(cvIntegral(density)))))]},
      {title:'最后再代入真正的物理定律',text:'输运定理只是更换观察方式。质量守恒另外给出 dM_sys/dt = 0；动量定律给出 dP_sys/dt = ΣF；能量定律给出热输入与外力功。把各自系统定律放到定理左侧，才得到相应控制体平衡式。不能对任意 B 都令系统变化率为零。'},
    ],
    meaning:['同一团物质的变化 = 控制体内正在积累的变化 + 由于流体相对边界穿出而必须补回的那一份。','控制体移动并不会改变物理定律；相对速度只修正穿界速率。动量属性 β = v 等仍使用所选惯性系中的速度，不能把公式中所有 v 都替换成 v−w。'],
    conditions:['在比较时刻，物质系统与 CV(t) 重合；系统导数针对这一组相同质点，控制体导数则针对按 w 运动的区域。','采用足够光滑的场和可微运动、分片光滑封闭控制面。控制体可以运动或变形，不能把移动域的积分导数直接交换成固定位置的偏导积分。','控制体移动不等于改用非惯性参考系。若另改为旋转或加速坐标系，动量的力与加速度表达仍需相应处理。'],
    example:{title:'移动截面与不透流活塞',text:'水以 vₙ = 3 m/s 穿过一张沿流向以 wₙ = 1 m/s 移动的假想截面，ρ = 1000 kg/m³、A = 0.01 m²。相对穿越速度是 2 m/s，向外质量通量为 ρA(vₙ−wₙ) = 20 kg/s；固定截面则为 30 kg/s。实际不透流活塞表面满足 vₙ = wₙ，因此该处相对质量通量为零，即使活塞和流体都在运动。'},
    related:['balance','continuity','momentum','total-energy','gauss'],sources:[caltech,psu],
  },
];
