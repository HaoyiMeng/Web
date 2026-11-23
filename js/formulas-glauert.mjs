import {texEquation as T} from './formula-math.mjs';
const R=String.raw;

export const glauertFormula = {
  id:'glauert',group:'models',name:'Glauert 薄翼理论',
  italian:'Teoria di Glauert · Vortex-sheet and Fourier solution',symbol:'A₀、Aₙ',category:'空气动力学 · 涡片解析解',
  summary:'集中查阅涡片积分方程、Glauert 系数、环量、升力及两种特征迎角。',
  question:'已知迎角与中弧线，如何求涡片分布、压力差和升力？理想迎角与零升力迎角有什么区别？',
  equations:[
    T('Glauert 涡片展开','γ(θ) = 2U∞[A₀ cot(θ/2) + Σ Aₙ sin(nθ)]',R`\gamma(\theta)=2U_\infty\left[A_0\frac{1+\cos\theta}{\sin\theta}+\sum_{n=1}^{\infty}A_n\sin(n\theta)\right]`),
    T('零阶系数','A₀ = α − (1/π)∫₀π (dym/dx)dθ = α − αID',R`A_0=\alpha-\frac{1}{\pi}\int_0^\pi\frac{\mathrm{d}y_m}{\mathrm{d}x}\,\mathrm{d}\theta=\alpha-\alpha_{\mathrm{ID}}`),
    T('高阶系数','Aₙ = (2/π)∫₀π (dym/dx)cos(nθ)dθ，n ≥ 1',R`A_n=\frac{2}{\pi}\int_0^\pi\frac{\mathrm{d}y_m}{\mathrm{d}x}\cos(n\theta)\,\mathrm{d}\theta,\qquad n\ge1`),
    T('二维升力系数','CL = 2π(A₀ + A₁/2) = 2π(α − αL=0)',R`C_L=2\pi\left(A_0+\frac{A_1}{2}\right)=2\pi\left(\alpha-\alpha_{L=0}\right)`),
    T('理想迎角与零升力迎角','αID = (1/π)∫₀π (dym/dx)dθ；αL=0 = αID − A₁/2',R`\begin{aligned}\alpha_{\mathrm{ID}}&=\frac{1}{\pi}\int_0^\pi\frac{\mathrm{d}y_m}{\mathrm{d}x}\,\mathrm{d}\theta,\\\alpha_{L=0}&=\alpha_{\mathrm{ID}}-\frac{A_1}{2}.\end{aligned}`),
  ],
  terms:[['c、x、θ','c 为弦长，x 从前缘指向后缘。θ = 0 对应前缘，θ = π 对应后缘；θ 是映射坐标，不是迎角。'],['U∞、α','来流速率（与基础卡片 V∞ 相同）和迎角；α 一律用弧度。'],['ym、ys','中弧线与半厚度；先把 dym/dx 写成 x(θ) 的函数，再对 θ 积分。'],['γ、q','涡片与源片强度，单位 m/s；γ = u′+ − u′−，取顺时针、正升力方向为正，区别于体涡量。'],['A₀、Aₙ','无量纲 Glauert 系数；固定几何时只有 A₀ 随迎角改变。'],['Γlift、Γccw','Γlift = ∫γ dx 是正升力约定的环量，Γccw = −Γlift 是逆时针正环量。'],['CL、L′、PV','CL 为二维升力系数（基础卡片记 Cl），L′ 为单位展长升力；PV 为柯西主值。']],
  steps:[
    {title:'用几何斜率确定奇点分布',text:'迎角与弯度使用涡片，厚度使用源片。源片产生两侧共同的轴向扰动，在一阶压力差中抵消。闭合翼型的半厚度在两端为零，净源量也为零。',equations:[
      T('几何分解与源强','ym = (y+ + y−)/2；ys = (y+ − y−)/2；q = 2U∞ dys/dx',R`\begin{aligned}y_m&=\frac{y^++y^-}{2},\qquad y_s=\frac{y^+-y^-}{2},\\q(x)&=2U_\infty\frac{\mathrm{d}y_s}{\mathrm{d}x},\qquad\int_0^c q(x)\,\mathrm{d}x=0.\end{aligned}`),
      T('涡片基本积分方程','(1/2π)PV∫₀ᶜ γ(x′)/(x−x′)dx′ = U∞(α−dym/dx)',R`\frac{1}{2\pi}\operatorname{PV}\!\int_0^c\frac{\gamma(x')}{x-x'}\,\mathrm{d}x'=U_\infty\left(\alpha-\frac{\mathrm{d}y_m}{\mathrm{d}x}\right)`),
    ]},
    {title:'半圆映射与后缘条件',text:'映射把翼弦转换为角区间，便于使用三角函数。展开中的各项在尖后缘趋于零，满足 Kutta 条件。A₀ 非零时，前缘可出现平方根奇性。',equations:[
      T('Glauert 坐标变换','x = c(1−cosθ)/2；dx = (c/2)sinθ dθ；0 ≤ θ ≤ π',R`x=\frac{c}{2}(1-\cos\theta),\quad\mathrm{d}x=\frac{c}{2}\sin\theta\,\mathrm{d}\theta,\quad0\le\theta\le\pi`),
      T('Kutta 后缘条件','γ(c) = 0',R`\gamma(c)=0`),
    ]},
    {title:'主值积分化为 Fourier 系数',text:'代入展开后，主值积分给出余弦函数。对化简后的方程直接积分得到 A₀；乘 cos(nθ) 再积分，由正交性得到 Aₙ。积分里的导数仍是 dym/dx。',equations:[
      T('关键主值积分（0 < θ < π，n ≥ 1）','G₀ = π；Gₙ = −πcos(nθ)',R`\begin{aligned}\operatorname{PV}\!\int_0^\pi\frac{1+\cos\theta'}{\cos\theta'-\cos\theta}\,\mathrm{d}\theta'&=\pi,\\\operatorname{PV}\!\int_0^\pi\frac{\sin\theta'\sin(n\theta')}{\cos\theta'-\cos\theta}\,\mathrm{d}\theta'&=-\pi\cos(n\theta).\end{aligned}`),
      T('化简后的 Fourier 方程','dym/dx = α − A₀ + Σ Aₙcos(nθ)',R`\frac{\mathrm{d}y_m}{\mathrm{d}x}=\alpha-A_0+\sum_{n=1}^{\infty}A_n\cos(n\theta)`),
    ]},
    {title:'由涡片连接压力差、环量与升力',text:'压力差采用下表面减上表面。全弦积分后只有 A₀ 与 A₁ 贡献总环量；高阶系数仍会改变局部压力分布。下式等号均在一阶模型内成立。',equations:[
      T('一阶压力差','ΔCp = Cp,lower − Cp,upper = 2γ/U∞',R`\Delta C_p=C_{p,\mathrm{lower}}-C_{p,\mathrm{upper}}=\frac{2\gamma(x)}{U_\infty}`),
      T('环量与单位展长升力','Γlift = ∫₀ᶜ γdx = πU∞c(A₀+A₁/2)；L′ = ρU∞Γlift',R`\begin{aligned}\Gamma_{\mathrm{lift}}&=\int_0^c\gamma(x)\,\mathrm{d}x=\pi U_\infty c\left(A_0+\frac{A_1}{2}\right),\\L'&=\rho U_\infty\Gamma_{\mathrm{lift}}=-\rho U_\infty\Gamma_{\mathrm{ccw}},\\C_L&=\frac{L'}{\tfrac12\rho U_\infty^2c}=\frac{2\Gamma_{\mathrm{lift}}}{U_\infty c}.\end{aligned}`),
    ]},
  ],
  meaning:['理想迎角使 A₀ = 0，消除前缘 A₀ 奇性项；零升力迎角使 A₀ + A₁/2 = 0。两者通常不同，理想迎角仍可有升力。','固定几何时，升力曲线斜率为 2π 每弧度。弯度改变零升力迎角；一阶厚度项不改变升力。'],
  example:{title:'校验：薄平板、圆弧与抛物线中弧线',text:'薄平板 α = 5° 时 CL ≈ 0.548。抛物线最大弯度比 m = 0.02、α = 0 时，CL ≈ 0.251，αID = 0，αL=0 = −0.04 rad ≈ −2.29°。圆弧表达式只采用小弯度近似。',equations:[
    T('薄平板','ym = 0 ⇒ A₀ = α，Aₙ = 0；γ = 2U∞α√[(c−x)/x]；CL = 2πα',R`\begin{aligned}y_m=0&\Rightarrow A_0=\alpha,\quad A_{n\ge1}=0,\\\gamma(x)&=2U_\infty\alpha\sqrt{\frac{c-x}{x}},\quad C_L=2\pi\alpha.\end{aligned}`),
    T('小弯度圆弧','dym/dx = 2βcosθ ⇒ A₁ = 2β；CL = 2π(α+β)',R`\frac{\mathrm{d}y_m}{\mathrm{d}x}=2\beta\cos\theta\;\Rightarrow\;A_0=\alpha,\quad A_1=2\beta,\quad A_{n\ge2}=0,\quad C_L=2\pi(\alpha+\beta)`),
    T('抛物线中弧线','ym/c = 4mX(1−X) ⇒ A₀ = α，A₁ = 4m；CL = 2π(α+2m)',R`\begin{aligned}X&=x/c,\quad y_m/c=4mX(1-X),\\A_0&=\alpha,\quad A_1=4m,\quad A_{n\ge2}=0,\\C_L&=2\pi(\alpha+2m),\quad\alpha_{\mathrm{ID}}=0,\quad\alpha_{L=0}=-2m.\end{aligned}`),
  ]},
  conditions:['二维、定常、不可压、无黏，奇点以外的外流无旋。','迎角、弯度斜率、厚度斜率及局部扰动速度比足够小。所有迎角公式用弧度。','前缘奇性不表示真实流体速度无限大；本模型不能预测失速、分离、摩擦阻力或激波。'],
  related:['thin-airfoil'],
  sources:[{title:'学习笔记：Glauert 完整推导与交互计算',url:'./glauert.html'},{title:'小扰动交互实验',url:'./perturbation.html'}],
  sourceNote:'按学习笔记 Glauert 薄翼理论整理；详细推导与图示保留在学习笔记，此卡片集中提供公式与重要结论。',
};
