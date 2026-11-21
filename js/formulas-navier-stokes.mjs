import { v, b, o, n, t, row, sub, sup, frac, eq, plus, par, dot, grad, div, dt, pt, equation } from './formula-math.mjs';

const rho = v('ρ');
const velocity = b('v');
const stress = b('τ');
const identity = b('I');
const deformation = b('D');
const laplacian = (field) => row(sup(o('∇'), n(2)), field);
const massFlux = row(rho, velocity);
const momentumFlux = row(rho, velocity, o('⊗'), velocity);
const totalFlux = row(par(plus(row(rho, v('E')), v('p'))), velocity);
const momentumRight = row(o('−'), grad(v('p')), o('+'), div(stress), o('+'), rho, b('b'));
const energyRight = row(div(par(dot(stress, velocity))), o('−'), div(b('q')), o('+'), rho, dot(b('b'), velocity), o('+'), v('r'));

export const navierStokesFormula = {
  id: 'navier-stokes',
  name: 'Navier–Stokes 方程组与闭合关系',
  italian: 'Equazioni di Navier–Stokes e relazioni di chiusura',
  symbol: 'N–S',
  category: '闭合与模型',
  summary: '把质量、动量和能量平衡，接到流体的黏性、导热和热力学性质上。',
  question: '平衡方程已经写下来了，为什么还不能直接求出速度、压力和温度？因为应力、热流和热力学状态之间还需要材料关系。',
  equations: [
    equation('质量平衡', '∂ρ/∂t + ∇·(ρv) = 0', eq(plus(pt(rho), div(par(massFlux))), n(0))),
    equation('动量平衡', '∂(ρv)/∂t + ∇·(ρv⊗v) = −∇p + ∇·τ + ρb', eq(plus(pt(par(massFlux)), div(par(momentumFlux))), momentumRight)),
    equation('总能量平衡', '∂(ρE)/∂t + ∇·[(ρE+p)v] = ∇·(τ·v) − ∇·q + ρb·v + r', eq(plus(pt(par(row(rho, v('E')))), div(par(totalFlux))), energyRight)),
  ],
  terms: [
    ['ρ、v、p、T', '密度 kg/m³、速度 m/s、热力学压力 Pa、绝对温度 K。速度和体力是向量。'],
    ['E = e + |v|²/2', '单位质量总能量，J/kg；由内能和动能构成，这里不包含势能。'],
    ['σ = −pI + τ', 'σ 是总 Cauchy 应力，τ 是黏性应力；单位均为 Pa，I 为单位张量。'],
    ['D', '变形速率张量，单位 s⁻¹；是 ∇v 的对称部分，不是物质导数 D/Dt。'],
    ['μ、λ、μ_bulk', '剪切黏度、第二黏度系数、体积黏度，单位 Pa·s；μ_bulk = λ + 2μ/3。'],
    ['q、k', '导热热流密度向量 W/m²、导热系数 W/(m·K)。q·n > 0 表示热量穿出控制面。'],
    ['b、r', 'b 是单位质量体力，m/s²；r 是单位体积供热率，W/m³，因此能量式中直接写 +r。'],
  ],
  steps: [
    {
      title: '保留完整平衡，再辨认缺少的关系',
      text: '质量、动量和总能量平衡给出共同的守恒框架。压力提供法向压缩作用，黏性应力还可以传递切向力；热流描述边界上的能量输送。这些量出现在方程里，却尚未说明怎样由速度和温度求出。先把总应力拆开，不预先删除体力、黏性或导热。',
      equations: [equation('总应力分解', 'σ = −pI + τ', eq(b('σ'), row(o('−'), v('p'), identity, o('+'), stress)))],
    },
    {
      title: '采用各向同性牛顿流体的黏性本构关系',
      text: '刚体转动不改变流体微团的形状，不应独自产生黏性应力；产生形状与体积变化的是速度梯度的对称部分 D。对各向同性牛顿流体，黏性应力对 D 取线性关系。μ 控制剪切响应，体积黏度控制膨胀压缩的黏性响应。Stokes 假设再把体积黏度近似为零；这是一项材料近似，不是由质量守恒推出的。',
      equations: [
        equation('变形速率', 'D = [∇v + (∇v)ᵀ]/2', eq(deformation, frac(plus(grad(velocity), sup(par(grad(velocity)), t('T'))), n(2)))),
        equation('一般牛顿型黏性应力', 'τ = 2μD + λ(∇·v)I', eq(stress, plus(row(n(2), v('μ'), deformation), row(v('λ'), par(div(velocity)), identity)))),
        equation('第二黏度与体积黏度', 'λ = μ_bulk − 2μ/3', eq(v('λ'), row(sub(v('μ'), t('bulk')), o('−'), frac(row(n(2), v('μ')), n(3))))),
        equation('Stokes 假设', 'μ_bulk ≈ 0 ⇒ λ ≈ −2μ/3', row(sub(v('μ'), t('bulk')), o('≈'), n(0), o('⇒'), v('λ'), o('≈'), o('−'), frac(row(n(2), v('μ')), n(3)))),
      ],
    },
    {
      title: '用导热定律和热力学关系连接温度、压力与能量',
      text: '温度梯度指向升温方向，Fourier 定律中的负号让热流指向低温处。把 q = −k∇T 代入能量式，−∇·q 就成为 +∇·(k∇T)。还需选择状态方程和内能关系；例如理想气体可用 p = ρRT，而 e = c_vT 还要求 c_v 可视作常数，并选定内能零点。μ、体积黏度和 k 也需要相应物性模型。',
      equations: [
        equation('Fourier 导热定律', 'q = −k∇T', eq(b('q'), row(o('−'), v('k'), grad(v('T'))))),
        equation('能量中的导热项', '−∇·q = ∇·(k∇T)', eq(row(o('−'), div(b('q'))), div(par(row(v('k'), grad(v('T'))))))),
        equation('一种热力学闭合选择', 'p = ρRT；e = c_vT（定比热理想气体）', row(eq(v('p'), row(rho, v('R'), v('T'))), o(';'), eq(v('e'), row(sub(v('c'), v('v')), v('T'))))),
      ],
    },
    {
      title: '代入后得到可求解的模型，再按条件简化',
      text: '将黏性本构、导热定律和热力学关系代入上面的三条平衡式，配合物性、初始条件与边界条件，才构成完整问题。只有 μ、λ 为常数，才能把应力散度展开为下式；再施加 ∇·v = 0，才得到熟悉的 μ∇²v。若 μ 随温度变化，应保留散度内的变黏度。',
      equations: [
        equation('常黏度时的应力散度', '∇·τ = μ∇²v + (μ+λ)∇(∇·v)', eq(div(stress), plus(row(v('μ'), laplacian(velocity)), row(par(plus(v('μ'), v('λ'))), grad(par(div(velocity))))))),
        equation('常黏度、不可压缩动量式', 'ρ Dv/Dt = −∇p + μ∇²v + ρb', eq(row(rho, dt(velocity)), row(o('−'), grad(v('p')), o('+'), v('μ'), laplacian(velocity), o('+'), rho, b('b')))),
      ],
    },
  ],
  meaning: [
    '守恒方程回答“哪些量必须平衡”，本构关系回答“这种流体怎样传力、怎样传热”。换成非牛顿流体时，平衡框架仍可保留，但应力关系需要更换。',
    '∇·τ 是单位体积的黏性合力；∇·(τ·v) 是黏性应力通过表面传递功率的净效果。它们分别进入动量与总能量，物理角色不同。',
    '不可压缩条件约束流体微团的体积变化；Stokes 假设约束黏度系数。两者是独立假设，不可压缩也不意味着无黏。',
  ],
  conditions: [
    '本条采用经典连续介质、各向同性牛顿流体和 Fourier 导热模型；未加入组分扩散、化学反应和独立转动自由度等额外平衡。体热源可通过 r 明确给定。',
    'μ ≥ 0、μ_bulk ≥ 0、k ≥ 0 是常用的热力学相容条件。Stokes 假设 μ_bulk≈0 并不适用于所有流体或所有快速压缩过程。',
    '求解仍需几何、初始状态与边界条件。黏性固壁通常给定无滑移速度，并给定壁温或热流等热边界条件；不能同时任意指定全部边界变量。',
    '令 τ = 0 可得到 Euler 动量方程，体力 ρb 仍然保留。通常的无黏、无热传导 Euler 方程组还令 q = 0；要删除体力必须另行假设 b = 0。',
    '定常只删除显式时间导数；v·∇v 仍可非零。低速近似、不可压缩、绝热与无黏分别对应不同的条件。',
  ],
  example: {
    title: '两块平板之间：黏度如何变成壁面力',
    text: '平行板间距 H = 1 mm，下板固定，上板以 U = 1 m/s 匀速平移。取定常、不可压缩、常黏度、无压强梯度的充分发展 Couette 流，速度为 v = (Uy/H, 0, 0)。虽然 ∇·v = 0，速度梯度仍不为零，因此黏性剪应力不会消失。若 μ = 1.8 × 10⁻⁵ Pa·s，剪应力大小为 0.018 Pa；它沿切向阻碍两板的相对运动。',
    equations: [equation('剪切本构的直接应用', 'τ_xy = μ du/dy = μU/H = 0.018 Pa', row(eq(sub(v('τ'), row(v('x'), v('y'))), row(v('μ'), frac(row(v('d'), v('u')), row(v('d'), v('y')))), frac(row(v('μ'), v('U')), v('H')), n('0.018')), t(' Pa')))],
  },
  related: ['continuity', 'momentum', 'total-energy', 'internal-energy'],
  sources: [
    { title: 'Virginia Tech · Governing equations and constitutive relations', url: 'https://pressbooks.lib.vt.edu/configurationaerodynamics/chapter/foundations-of-fluid-mechanics/' },
    { title: 'NPTEL · Newtonian constitutive relation and Stokes hypothesis', url: 'https://archive.nptel.ac.in/content/storage2/courses/112107080/module2/lecture4/lecture4.pdf' },
    { title: 'NASA Glenn · Navier–Stokes equation set', url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/navier-strokes-equation/' },
  ],
};
