import {v,b,o,n,row,sub,sup,frac,eq,plus,par,equation,texEquation as T} from './formula-math.mjs';

const U=sub(v('V'),o('∞')), cp=sub(v('C'),v('p')), cl=sub(v('C'),v('l'));
const up=sup(v('u'),o('′')), vp=sup(v('v'),o('′')), x=v('x'), xi=v('ξ'), c=v('c');
const ym=sub(v('y'),v('m')), ys=sub(v('y'),v('s'));
const at=(f,arg=x)=>row(f,par(arg));
const derivative=f=>frac(row(v('d'),f),row(v('d'),x));
const integral=(body,pv=false)=>row(pv?v('PV'):'',`<msubsup>${o('∫')}${n(0)}${c}</msubsup>`,body,v('d'),xi);
const kernel=f=>frac(at(f,xi),row(x,o('−'),xi));
const half=f=>frac(f,n(2));
const sq=f=>sup(f,n(2));
const E=equation;

const original={
  id:'thin-airfoil',group:'models',name:'一阶薄翼理论',italian:'Teoria dei profili sottili · First-order thin airfoil theory',symbol:'Cₗ ≈ 2πα',category:'空气动力学 · 小扰动近似',
  summary:'把小迎角、弯度与厚度的影响分开，查阅切向条件、源涡分布、压力与升力公式。',
  question:'翼型很薄、迎角很小时，怎样用弦线上的源和涡分布描述扰动，并求出上下表面的压力差与升力？',
  equations:[E('一阶压力系数','Cp ≈ −2u′/V∞',eq(cp,row(o('−'),frac(row(n(2),up),U)))),E('对称薄翼的小迎角结果','Cl ≈ 2πα（α 用弧度）',row(cl,o('≈'),n(2),v('π'),v('α')))],
  terms:[['x、c','x 从前缘沿弦线指向后缘，0 < x < c；c 为弦长。y 向上。'],['V∞、α','来流速率与迎角；本页来流分量为 (V∞ cos α, V∞ sin α)，计算时 α 用弧度。'],['u′、v′','相对均匀来流的水平、竖直扰动速度，单位 m/s。'],['+、−','上表面与下表面；不是数值的正负号。'],['ym、ys','中弧线与半厚度：上下表面 y± = ym ± ys。'],['q、γ','弦线上单位长度的源强和涡强，单位 m/s。γ 按课堂第十四节取顺时针为正。'],['Γccw、L′、Cl','Γccw 为逆时针正环量；L′ 为单位展长升力（N/m），向来流左侧为正；Cl 为二维升力系数。'],['PV','柯西主值：对积分奇点两侧对称取极限，不可直接代入分母为零的表达式。']],
  steps:[
    {title:'小扰动与势函数',text:'二维、定常、不可压缩、无黏，流场在奇点分布之外无旋。总速度由均匀来流与扰动组成；α、表面斜率、扰动速度比均为小量。',equations:[
      E('速度分解','V = V∞ + V′，V′ = u′i + v′j',row(eq(b('V'),plus(sub(b('V'),o('∞')),sup(b('V'),o('′')))),o(','),eq(sup(b('V'),o('′')),plus(row(up,b('i')),row(vp,b('j')))))),
      E('扰动势与 Laplace 方程','u′ = ∂φ′/∂x，v′ = ∂φ′/∂y，∇²φ′ = 0',row(eq(up,frac(row(o('∂'),sup(v('φ'),o('′'))),row(o('∂'),x))),o(','),eq(vp,frac(row(o('∂'),sup(v('φ'),o('′'))),row(o('∂'),v('y')))),o(','),eq(row(sup(o('∇'),n(2)),sup(v('φ'),o('′'))),n(0))))]},
    {title:'几何分解：弯度与厚度',text:'弯度控制中弧线的偏移，厚度描述绕中弧线的对称展开。三种扰动来源是小迎角、小弯度与小厚度。',equations:[E('中弧线与半厚度','ym = (y+ + y−)/2，ys = (y+ − y−)/2',row(eq(ym,half(plus(sup(v('y'),o('+')),sup(v('y'),o('−'))))),o(','),eq(ys,half(row(sup(v('y'),o('+')),o('−'),sup(v('y'),o('−')))))))]},
    {title:'线性化切向条件',text:'无穿透条件要求流速与表面相切。用 u ≈ V∞、v ≈ V∞α + v′，并把扰动边界条件移到弦线 y = 0 上，得到一阶条件。',equations:[E('上下表面的切向条件','dy±/dx = α + v′±/V∞',eq(derivative(sup(v('y'),o('±'))),plus(v('α'),frac(sup(v('v'),o('′±')),U))))]},
    {title:'厚度对应源汇分布',text:'源层使竖直速度在上下两侧发生跳变，水平扰动速度两侧相同。闭合翼型前后缘的半厚度均为零，因此总源强为零。',equations:[
      E('由半厚度斜率求源强','q(x) = 2V∞ dys/dx',eq(at(v('q')),row(n(2),U,derivative(ys)))),
      E('源层两侧的竖直扰动','vs± = ±q(x)/2',eq(sup(sub(v('v'),v('s')),o('±')),row(o('±'),half(at(v('q')))))),
      E('源层的水平扰动','us(x) = (1/2π) PV ∫₀ᶜ q(ξ)/(x−ξ) dξ',eq(at(sub(v('u'),v('s'))),row(frac(n(1),row(n(2),v('π'))),integral(kernel(v('q')),true)))),
      E('闭合翼型的净源强','∫₀ᶜ q(ξ)dξ = 0',eq(integral(at(v('q'),xi)),n(0)))]},
    {title:'迎角与弯度对应涡分布',text:'本页 γ 顺时针为正；涡层使水平速度跳变，竖直诱导速度两侧相同。对上下表面切向条件取平均，得到薄翼理论的积分方程。后缘还需满足 Kutta 条件。',equations:[
      E('涡层两侧的水平扰动','uγ± = ±γ(x)/2',eq(sup(sub(v('u'),v('γ')),o('±')),row(o('±'),half(at(v('γ')))))),
      E('涡层诱导的竖直速度','vγ(x) = −(1/2π) PV ∫₀ᶜ γ(ξ)/(x−ξ) dξ',eq(at(sub(v('v'),v('γ'))),row(o('−'),frac(n(1),row(n(2),v('π'))),integral(kernel(v('γ')),true)))),
      E('薄翼理论基本积分方程','(1/2π) PV ∫₀ᶜ γ(ξ)/(x−ξ) dξ = V∞(α−dym/dx)',eq(row(frac(n(1),row(n(2),v('π'))),integral(kernel(v('γ')),true)),row(U,par(row(v('α'),o('−'),derivative(ym)))))),
      E('尖后缘的 Kutta 条件','γ(c) = 0',eq(at(v('γ'),c),n(0)))]},
    {title:'从伯努利关系得到一阶压力系数',text:'先保留完整速度平方，再舍去 αv′、u′²、v′² 等二阶小量。一阶 Cp 可以相加；完整伯努利表达式中的平方会产生交叉项，不能直接逐项相加。',equations:[
      E('不可压缩势流的压力系数','Cp = 1 − [(V∞ cos α + u′)² + (V∞ sin α + v′)²]/V∞²',eq(cp,row(n(1),o('−'),frac(plus(sq(par(plus(row(U,v('cos'),v('α')),up))),sq(par(plus(row(U,v('sin'),v('α')),vp)))),sq(U))))),
      E('一阶压力系数的叠加','Cp ≈ Cp,α + Cp,m + Cp,s = −2(u′α + u′m + u′s)/V∞',row(cp,o('≈'),eq(plus(sub(cp,v('α')),sub(cp,v('m')),sub(cp,v('s'))),row(o('−'),frac(row(n(2),par(plus(sub(up,v('α')),sub(up,v('m')),sub(up,v('s'))))),U)))))]},
    {title:'由压力差与环量求升力',text:'厚度引起的水平扰动在上下表面相同，所以在一阶压力差中抵消。升力来自迎角和弯度的涡分布。这里的环量符号必须与源涡公式保持一致。',equations:[
      E('上下表面压力差','Cp− − Cp+ ≈ 2γ(x)/V∞',row(sup(cp,o('−')),o('−'),sup(cp,o('+')),o('≈'),frac(row(n(2),at(v('γ'))),U))),
      E('单位展长升力','L′ ≈ ρV∞ ∫₀ᶜ γ(ξ)dξ = −ρV∞Γccw',row(sup(v('L'),o('′')),o('≈'),eq(row(v('ρ'),U,integral(at(v('γ'),xi))),row(o('−'),v('ρ'),U,sub(v('Γ'),v('ccw')))))),
      E('升力系数','Cl ≈ 2/(V∞c) ∫₀ᶜ γ(ξ)dξ',row(cl,o('≈'),frac(n(2),row(U,c)),integral(at(v('γ'),xi))))]},
  ],
  meaning:['迎角和弯度决定上下表面的速度差；厚度在一阶近似中改变两侧共同的压力分布。','可以叠加的是各项扰动速度，均匀来流只加一次。压力系数的线性叠加同样只是一阶结论。'],
  example:{title:'最简单的校验：无弯度薄平板',text:'ym = 0，并施加后缘 Kutta 条件，得到下式。α = 5° = 0.0873 rad 时，Cl ≈ 0.548。前缘的理论奇性不代表真实流体速度可以无限大。',equations:[E('薄平板涡分布','γ(x) = 2V∞α √[(c−x)/x]',eq(at(v('γ')),row(n(2),U,v('α'),`<msqrt>${frac(row(c,o('−'),x),x)}</msqrt>`)))]},
  conditions:['二维、定常、不可压缩、无黏；奇点分布以外的流动无旋。','迎角、弯度斜率与厚度斜率足够小，且局部 |u′|、|v′| 远小于 V∞。','前缘附近常出现奇性，局部小扰动条件可能失效；不可用这套模型预测分离、失速或黏性阻力。','保角变换求得的有限厚度势流与一阶薄翼近似是不同层次的模型；不要把本页近似当作任意翼型的精确解。'],
  related:['continuity','vector-tools'],
  sources:[{title:'小扰动交互实验 · 压力、迎角、弯度与厚度',url:'./perturbation.html'},{title:'Glauert 薄翼理论 · 涡片与傅里叶系数详细推导',url:'./glauert.html'}],
  sourceNote:'依据课堂 Aerodinamica 第十四节与提供的笔记整理；本页采用顺时针为正的涡层强度 γ。可结合交互实验检查各项变化。',
};

const perturb = (component, kind) => sub(sup(v(component),o('′')),v(kind));
const sourceU = perturb('u','s'), sourceV = perturb('v','s');
const vortexU = perturb('u','γ'), vortexV = perturb('v','γ');
const small = (body) => row(body,o('≪'),n(1));
const speedComponents = E('总速度分量与扰动分量','u = V∞ cos α + u′，v = V∞ sin α + v′',row(eq(v('u'),plus(row(U,v('cos'),v('α')),up)),o(','),eq(v('v'),plus(row(U,v('sin'),v('α')),vp))));
export const thinAirfoilFormula = {
  ...original,
  symbol:'V = V∞ + V′',
  summary:'从微小扰动开始，依次理解源汇、涡分布、切向条件与压力系数。',
  question:'先定义扰动，再求沿弦向源汇和涡分布诱导的 u′、v′；用表面切向条件把速度与几何连接起来，最后计算压力系数。',
  equations:[], steps:[],
  cards:[
    {id:'perturbations',title:'微小扰动',english:'Small perturbations',summary:'先区分总速度与扰动速度，明确一阶近似保留什么。',takeaway:'u、v 是总速度分量；u′、v′ 是相对均匀来流的扰动。迎角、弯度与厚度是三种扰动来源。',blocks:[
      {title:'速度分解',text:'取 x 沿弦线从前缘指向后缘，0 < x < c；y 向上。迎角 α 以弧度计算。',equations:[original.steps[0].equations[0],speedComponents]},
      {title:'小量假设',text:'小迎角与弱扰动允许保留一阶项，忽略小量之间的乘积。翼型表面斜率也必须足够小。',equations:[E('小量条件','|α| ≪ 1，|u′|/V∞ ≪ 1，|v′|/V∞ ≪ 1',row(small(row(o('|'),v('α'),o('|'))),o(','),small(frac(row(o('|'),up,o('|')),U)),o(','),small(frac(row(o('|'),vp,o('|')),U))))]},
    ]},
    {id:'sources',title:'沿弦向的源汇分布',english:'Source and sink distribution',summary:'从微元源强 dQ 出发，分别计算水平与竖直扰动。',takeaway:'源汇层的 u′ 在上下两侧相同，v′ 则从 −q/2 跳到 +q/2。',blocks:[
      {title:'微元源强',text:'ξ 是源的位置，x 是观测位置。q 的单位为 m/s，q > 0 为源，q < 0 为汇。',equations:[E('微元流量','dQ = q(ξ)dξ',eq(row(v('d'),v('Q')),row(at(v('q'),xi),v('d'),xi)))]},
      {title:'对水平分量 u′ 的影响',text:'先求一个微元的作用，再沿整个弦长相加。PV 表示柯西主值：对 ξ = x 两侧对称取极限。',equations:[E('弦线上单个微元的水平速度（ξ ≠ x）','du′s = q(ξ)dξ/[2π(x−ξ)]',eq(row(v('d'),sourceU),frac(row(at(v('q'),xi),v('d'),xi),row(n(2),v('π'),par(row(x,o('−'),xi)))))),E('水平扰动的分布积分','u′s(x) = (1/2π) PV ∫₀ᶜ q(ξ)/(x−ξ)dξ',eq(at(sourceU),row(frac(n(1),row(n(2),v('π'))),integral(kernel(v('q')),true))))]},
      {title:'对竖直分量 v′ 的影响',text:'取跨过源汇层的小控制体，流出量给出速度跳跃 v′+ − v′− = q。单独源汇层上下对称，因此各占一半。这里 +、− 指 y → 0+、y → 0− 的侧极限。',equations:[E('上下侧的竖直速度','v′s±(x) = ±q(x)/2',eq(at(sup(sourceV,o('±'))),row(o('±'),half(at(v('q'))))))]},
    ]},
    {id:'vortices',title:'沿弦向的涡分布',english:'Vortex distribution',summary:'从微元环量出发，观察另一种速度跳跃。',takeaway:'涡层的 u′ 从 −γ/2 跳到 +γ/2；v′ 在上下两侧相同。它与源汇层的作用恰好对应。',blocks:[
      {title:'微元环量与正方向',text:'沿用笔记：涡片强度 γ 取顺时针为正，单位 m/s。γ 是单位弦长的环量，并非一般流场中的涡量 ∇×V。',equations:[E('微元顺时针环量','dΓcw = γ(ξ)dξ',eq(row(v('d'),sub(v('Γ'),v('cw'))),row(at(v('γ'),xi),v('d'),xi)))]},
      {title:'对水平分量 u′ 的影响',text:'跨涡层的小回路给出切向速度跳跃 u′+ − u′− = γ；单独涡层上下反对称。',equations:[E('上下侧的水平速度','u′γ±(x) = ±γ(x)/2',eq(at(sup(vortexU,o('±'))),row(o('±'),half(at(v('γ'))))))]},
      {title:'对竖直分量 v′ 的影响',text:'顺时针涡在其右侧诱导向下的速度，因此核函数前有负号。将各微元沿弦向积分，并以主值处理奇点。',equations:[E('弦线上单个微元的竖直速度（ξ ≠ x）','dv′γ = −γ(ξ)dξ/[2π(x−ξ)]',eq(row(v('d'),vortexV),row(o('−'),frac(row(at(v('γ'),xi),v('d'),xi),row(n(2),v('π'),par(row(x,o('−'),xi))))))),E('竖直扰动的分布积分','v′γ(x) = −(1/2π) PV ∫₀ᶜ γ(ξ)/(x−ξ)dξ',eq(at(vortexV),row(o('−'),frac(n(1),row(n(2),v('π'))),integral(kernel(v('γ')),true))))]},
    ]},
    {id:'tangency',title:'切向条件',english:'Tangency condition',summary:'把诱导速度与翼型表面的斜率连接起来。',takeaway:'源涡分布给出速度；切向条件要求这些速度符合翼型几何。边界条件在一阶近似下移到弦线计算。',blocks:[
      {title:'无穿透条件',text:'速度沿表面切线，法向分量为零。此处 u、v 必须用总速度。',equations:[E('速度与表面相切','V·n = 0，dy±/dx = v±/u±',row(eq(row(b('V'),o('·'),b('n')),n(0)),o(','),eq(derivative(sup(v('y'),o('±'))),frac(sup(v('v'),o('±')),sup(v('u'),o('±'))))))]},
      {title:'代入小扰动并线性化',text:'cos α ≈ 1、sin α ≈ α；分子本身是一阶小量，分母中的 u′ 对比值只带来二阶修正，所以分母取 V∞。',equations:[E('一阶速度分量','u ≈ V∞，v ≈ V∞α + v′',row(v('u'),o('≈'),U,o(','),v('v'),o('≈'),U,v('α'),o('+'),vp)),E('线性化切向方程','dy±/dx ≈ α + v′±/V∞',row(derivative(sup(v('y'),o('±'))),o('≈'),v('α'),o('+'),frac(sup(v('v'),o('′±')),U)))]},
      {title:'后续求解',text:'将上下侧切向条件取平均可建立中弧线积分方程，取差可确定厚度源强。相关几何分解、求解公式和升力结论统一收录于 Glauert 薄翼理论卡片。'},
    ]},
    {id:'pressure',title:'压力系数',english:'Pressure coefficient',summary:'从总速度的伯努利关系，得到可叠加的一阶压力系数。',takeaway:'一阶压力系数只依赖轴向扰动；完整伯努利关系包含二阶项。',blocks:[
      {title:'定义与总速度',text:'总速度先叠加，再取速度平方。U∞ 与本卡片 V∞ 表示同一来流速率。',equations:[
        T('压力系数定义','Cp = (p−p∞)/(ρU∞²/2) = 1−(u²+v²)/U∞²',String.raw`C_p=\frac{p-p_\infty}{\tfrac12\rho U_\infty^2}=1-\frac{u^2+v^2}{U_\infty^2}`),
        T('代入总速度分量','Cp = 1−[(U∞cosα+u′)²+(U∞sinα+v′)²]/U∞²',String.raw`C_p=1-\frac{(U_\infty\cos\alpha+u')^2+(U_\infty\sin\alpha+v')^2}{U_\infty^2}`),
      ]},
      {title:'展开与一阶近似',text:'先用三角恒等式展开，再忽略迎角与扰动的乘积以及扰动速度平方。上下表面分别使用各自的轴向扰动。',equations:[
        T('展开式（未舍弃二阶项）','Cp = −2(u′cosα+v′sinα)/U∞ − (u′²+v′²)/U∞²',String.raw`C_p=-\frac{2(u'\cos\alpha+v'\sin\alpha)}{U_\infty}-\frac{(u')^2+(v')^2}{U_\infty^2}`),
        T('一阶压力系数','Cp± ≈ −2u′±/U∞',String.raw`C_p^{\pm}\simeq-\frac{2u'_{\pm}}{U_\infty}`),
      ]},
      {title:'三种扰动的叠加',text:'迎角、弯度和厚度的扰动可线性相加。压力系数的代数叠加仅在一阶近似内成立，均匀来流只计入一次。',equations:[
        T('扰动与压力系数叠加','u′ = u′α+u′m+u′s；Cp ≈ Cp,α+Cp,m+Cp,s',String.raw`\begin{aligned}u'&=u'_\alpha+u'_m+u'_s,\\C_p&\simeq C_{p,\alpha}+C_{p,m}+C_{p,s}=-\frac{2(u'_\alpha+u'_m+u'_s)}{U_\infty}.\end{aligned}`),
      ]},
    ]},
  ],
  supplement:[],
  sources:[{title:'Glauert 公式卡片：系数、Kutta 条件、压力差与升力',url:'./formulas.html#glauert'},...original.sources],
};
