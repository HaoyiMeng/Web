// Self-contained learning notes. α is thermal diffusivity; k is conductivity.
const row = (...items) => `<mrow>${items.join('')}</mrow>`;
const uprightSymbols = new Set(['Re','Ma','Eu','Pr','Pe','Nu','Gr','St','Fr','We','Bi','Fo']);
const v = (s) => `<mi${uprightSymbols.has(s)?' mathvariant="normal"':''}>${s}</mi>`;
const n = (s) => `<mn>${s}</mn>`;
const op = (s) => `<mo>${s}</mo>`;
const sub = (a, b) => `<msub>${v(a)}${v(b)}</msub>`;
const pow = (a, b) => `<msup>${a}${n(b)}</msup>`;
const frac = (a, b) => `<mfrac>${a}${b}</mfrac>`;
const eq = (...items) => items.join(op('='));
const math = (s) => `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">${s}</math>`;
const nasa = { title: 'NASA · Similarity parameters', url: 'https://www.grc.nasa.gov/www/k-12/airplane/airsim.html' };
const purdue = { title: 'Purdue · Dimensionless governing equations', url: 'https://engineering.purdue.edu/~wassgren/teaching/ME30800/NotesAndReading/DimensionalAnalysis_DimensionlessGoverningEqs_LectureNotes.pdf' };
const mit = { title: 'MIT OpenCourseWare · Dimensionless numbers', url: 'https://ocw.mit.edu/courses/3-185-transport-phenomena-in-materials-engineering-fall-2003/a55c74dc21def01fc0054de35574d1e5_3_21.pdf' };

export const categories = {
  flow: '流动与受力', heat: '热传递', unsteady: '非定常', surface: '自由液面与界面',
};

export const numbers = [
  {
    id: 'reynolds', symbol: 'Re', name: '雷诺数', english: 'Reynolds number', italian: 'Numero di Reynolds', category: 'flow',
    summary: '惯性与黏性的较量，联系模型与真实流动。',
    formula: math(eq(v('Re'), frac(row(v('ρ'), v('U'), v('L')), v('μ')), frac(row(v('U'), v('L')), v('ν')))),
    formulaText: 'Re = ρUL/μ = UL/ν',
    meaning: '想象一团流体绕过机翼：惯性让它保持原来的运动，黏性把相邻流层的速度差抹平。Re 越大，在所选尺度上惯性相对越强；Re 越小，黏性影响越突出。',
    variables: [['U', '特征速度，m/s'], ['L', '特征长度，m；机翼常取弦长'], ['ρ', '流体密度，kg/m³'], ['μ', '动力黏度，Pa·s'], ['ν = μ/ρ', '运动黏度，m²/s']],
    applications: ['设计风洞试验时比较模型与实物的黏性相似性。', '分析边界层、摩擦阻力和转捩；管流通常以水力直径为长度尺度。'],
    example: '空气以 U = 50 m/s 流过弦长 L = 1.5 m 的机翼，取 ν = 1.5 × 10⁻⁵ m²/s，则 Re = 5.0 × 10⁶。',
    caution: '不存在适用于所有流动的临界 Re。转捩还依赖粗糙度、入口扰动和压力梯度；可压缩试验通常也要考虑 Ma。',
    related: ['mach', 'skin-friction', 'peclet'], sources: [nasa],
  },
  {
    id: 'mach', symbol: 'Ma', name: '马赫数', english: 'Mach number', italian: 'Numero di Mach', category: 'flow',
    summary: '流动速度相对声速有多快，可压缩效应有多强。',
    formula: math(eq(v('Ma'), frac(v('U'), v('a')))), formulaText: 'Ma = U/a',
    meaning: '声速是微小压力扰动在流体中传播的速度。Ma 把流体运动与这条“传递消息”的速度比较；当流动达到超声速时，扰动无法直接向上游传播。',
    variables: [['U', '流体相对物体的速度，m/s'], ['a', '当地声速，m/s；理想气体 a = √(γRT)'], ['γ、R、T', '比热比、气体比气体常数、当地绝对温度']],
    applications: ['判断机翼、进气道和喷管中的可压缩效应。', '区分亚声速与超声速，分析激波和膨胀波。'],
    example: '取 U = 170 m/s、当地声速 a = 340 m/s，得到 Ma = 0.50。声速会随温度变化。',
    caution: 'Ma < 0.3 是常见的低速不可压缩近似经验条件，并非普遍保证。自由来流 Ma 与机翼表面的局部 Ma 可能不同。',
    related: ['reynolds', 'euler'], sources: [nasa],
  },
  {
    id: 'euler', symbol: 'Eu', name: '欧拉数', english: 'Euler number', italian: 'Numero di Eulero', category: 'flow',
    summary: '把压力差与惯性压力尺度放在一起比较。',
    formula: math(eq(v('Eu'), frac(row(op('Δ'), v('p')), row(v('ρ'), pow(v('U'), 2))))), formulaText: 'Eu = Δp/(ρU²)',
    meaning: '压力差推动流体加速，惯性决定改变运动需要多大作用。Eu 表示压力差相对 ρU² 有多大，让不同速度和尺寸下的压力结果可以比较。',
    variables: [['Δp', '约定两点之间的压力差，Pa'], ['ρ', '参考流体密度，kg/m³'], ['U', '参考流速，m/s']],
    applications: ['比较管路、阀门、弯头和风道中的压力变化。', '在几何与相关相似参数一致时整理模型试验中的压力数据。'],
    example: 'Δp = 600 Pa、ρ = 1.2 kg/m³、U = 20 m/s，Eu = 600/(1.2 × 20²) = 1.25。',
    caution: '这里采用 Δp/(ρU²)。有些资料使用动压 ½ρU² 作分母，数值为本页的 2 倍。使用前还要明确压差方向；压差本身不一定全是不可逆损失。',
    related: ['reynolds', 'mach', 'skin-friction'], sources: [purdue],
  },
  {
    id: 'skin-friction', symbol: 'C_f', name: '表面摩擦系数', english: 'Skin-friction coefficient', italian: 'Coefficiente di attrito superficiale', category: 'flow',
    summary: '把壁面剪应力或总摩擦阻力写成无量纲形式。',
    formula: math(eq(sub('C', 'f'), frac(sub('τ', 'w'), row(frac(n(1), n(2)), v('ρ'), pow(v('U'), 2))))), formulaText: 'C_f = τ_w/(½ρU²)',
    meaning: '壁面附近的速度梯度会产生切向剪应力，拖住物体表面。C_f 把这份单位面积上的摩擦力除以参考动压，从而比较不同工况下的摩擦强弱。',
    variables: [['τ_w', '局部壁面剪应力，Pa'], ['ρ、U', '参考密度与速度；外流常取边界层外缘值'], ['平均 C_f', '平行平板平均 C_f = D_f/(½ρU²S_w)，D_f 为总摩擦阻力，S_w 为对应湿表面积']],
    applications: ['估算机翼、机身或平板的黏性摩擦阻力。', '结合 Re 与壁面条件分析层流、湍流边界层的阻力差异。'],
    example: 'τ_w = 1 Pa、ρ = 1.2 kg/m³、U = 20 m/s，则局部 C_f ≈ 0.00417。',
    caution: '局部值与全板平均值不同。笔记中的 1.328/√Re_L 是光滑平板、零压梯度、全层流的平均关联式；0.074/Re_L^(1/5) 是常用全湍流近似，不能直接用于任意几何或过渡流动。',
    related: ['reynolds', 'nusselt', 'prandtl'], sources: [
      { title: 'NASA · Skin-friction measurement', url: 'https://ntrs.nasa.gov/citations/20020041006' },
      { title: 'Utah State · Flat-plate skin friction', url: 'https://mae-nas.eng.usu.edu/MAE_5420_Web/section8/section8.1.pdf' },
    ],
  },
  {
    id: 'prandtl', symbol: 'Pr', name: '普朗特数', english: 'Prandtl number', italian: 'Numero di Prandtl', category: 'heat',
    summary: '动量扩散与热扩散，哪一个传播得更快。',
    formula: math(eq(v('Pr'), frac(v('ν'), v('α')), frac(row(v('μ'), sub('c', 'p')), sub('k', 'f')))), formulaText: 'Pr = ν/α = μc_p/k_f',
    meaning: '黏性扩散速度差，热扩散温度差。Pr 大意味着动量扩散相对更快、热扩散相对更慢；在常见边界层条件下，热边界层因此较薄。',
    variables: [['ν', '运动黏度，m²/s'], ['α', '流体热扩散率 α = k_f/(ρc_p)，m²/s'], ['k_f', '流体导热系数，W/(m·K)'], ['c_p', '定压比热容，J/(kg·K)']],
    applications: ['比较空气、水、油和液态金属的传热特性。', '与 Re 一起用于强制对流换热的 Nu 关联式。'],
    example: '取空气 ν = 1.5 × 10⁻⁵ m²/s、α = 2.2 × 10⁻⁵ m²/s，则 Pr ≈ 0.68。',
    caution: 'Pr 由物性决定，仍会随温度和压力变化。部分讲义将热扩散率写成 k = λ/(ρc_p)；本页统一用 α 表示热扩散率，k_f 表示流体导热系数。',
    related: ['peclet', 'nusselt', 'reynolds'], sources: [mit],
  },
  {
    id: 'peclet', symbol: 'Pe', name: '佩克莱数', english: 'Péclet number', italian: 'Numero di Péclet', category: 'heat',
    summary: '热量随流体搬运，与靠分子扩散传递的比较。',
    formula: math(eq(v('Pe'), frac(row(v('U'), v('L')), v('α')), row(v('Re'), v('Pr')))), formulaText: 'Pe = UL/α = Re · Pr',
    meaning: '温度差可以随流体整体运动被带走，也可以向邻近区域扩散。Pe 大时，沿所选尺度的热对流相对更强；Pe 小时，热扩散相对更显著。',
    variables: [['U', '特征速度，m/s'], ['L', '特征长度，m'], ['α', '流体热扩散率，m²/s'], ['Re、Pr', '采用一致的速度、长度和物性时，Pe = RePr']],
    applications: ['判断温度场中对流与热扩散的重要程度。', '分析微流道、换热器及流体中的热量输运。'],
    example: 'U = 10 m/s、L = 0.1 m、α = 2.2 × 10⁻⁵ m²/s，则 Pe ≈ 4.55 × 10⁴。',
    caution: '本页指热 Péclet 数。传质问题使用质量扩散系数 D，得到 Pe_m = UL/D = ReSc；不能仍用 Pr。',
    related: ['reynolds', 'prandtl', 'nusselt'], sources: [mit],
  },
  {
    id: 'nusselt', symbol: 'Nu', name: '努塞尔数', english: 'Nusselt number', italian: 'Numero di Nusselt', category: 'heat',
    summary: '对流换热相对参考导热尺度有多强。',
    formula: math(eq(v('Nu'), frac(row(v('h'), v('L')), sub('k', 'f')))), formulaText: 'Nu = hL/k_f',
    meaning: '用 q″ = h(T_w − T_∞) 描述壁面换热，再与同一温差跨过 L 的导热尺度 k_fΔT/L 比较，就得到 Nu。它把复杂流动的换热效果浓缩成一个系数。',
    variables: [['h', '对流换热系数，W/(m²·K)'], ['L', '与关联式一致的特征长度，m'], ['k_f', '流体导热系数，W/(m·K)'], ['q″ = hΔT', '单位面积热流率，W/m²；总热流率为 Q̇ = hAΔT']],
    applications: ['从 Nu 关联式求 h，再估算机翼防冰、电子散热或换热器的换热量。', '比较不同流速、流体物性和几何形状的换热效果。'],
    example: 'h = 50 W/(m²·K)、L = 0.1 m、k_f = 0.026 W/(m·K)，Nu ≈ 192；若 A = 0.2 m²、ΔT = 20 K，则 Q̇ = 200 W。',
    caution: 'Nu 不是任意情况下两股实际热流的比值。局部与平均 Nu、恒壁温与恒热流的关联式需要区分。传热 Stanton 数 St_h = Nu/(RePr)，与本页 Strouhal 数不同；Reynolds 类比 St_h ≈ C_f/2 需要 Pr≈1、近似零压梯度等边界层条件。',
    related: ['prandtl', 'peclet', 'skin-friction', 'biot'], sources: [mit,
      { title: 'NPTEL · Reynolds analogy', url: 'https://archive.nptel.ac.in/content/storage2/courses/112101002/downloads/l30.pdf' },
    ],
  },
  {
    id: 'grashof', symbol: 'Gr', name: '格拉晓夫数', english: 'Grashof number', italian: 'Numero di Grashof', category: 'heat',
    summary: '温差产生的浮力，相对黏性有多强。',
    formula: math(eq(v('Gr'), frac(row(v('g'), v('β'), row(op('|'), op('Δ'), v('T'), op('|')), pow(v('L'), 3)), pow(v('ν'), 2)))), formulaText: 'Gr = gβ|ΔT|L³/ν²',
    meaning: '受热流体密度降低，在重力作用下相对周围流体上浮；黏性阻碍这种运动。Gr 越大，温差浮力相对黏性越强，是自然对流中的关键参数。',
    variables: [['g', '重力加速度，m/s²'], ['β', '体膨胀系数，K⁻¹；理想气体近似为 1/T'], ['|ΔT|', '壁面与环境温差的大小，K'], ['L、ν', '特征长度 m、运动黏度 m²/s']],
    applications: ['分析竖直热壁、散热片周围没有风扇驱动的自然对流。', '与 Pr 组合成 Rayleigh 数 Ra = GrPr；混合对流中常比较 Gr/Re²。'],
    example: 'g = 9.81 m/s²、β = 1/300 K⁻¹、|ΔT| = 20 K、L = 0.1 m、ν = 1.5 × 10⁻⁵ m²/s，Gr ≈ 2.91 × 10⁶。',
    caution: '这里用温差绝对值表示强度，流动方向另由重力和温度分布决定。常见自然对流模型采用 Boussinesq 近似，通常要求 β|ΔT| ≪ 1。',
    related: ['prandtl', 'nusselt', 'reynolds'], sources: [mit],
  },
  {
    id: 'strouhal', symbol: 'St', name: '斯特劳哈尔数', english: 'Strouhal number', italian: 'Numero di Strouhal', category: 'unsteady',
    summary: '振荡周期与流体经过物体的时间尺度比较。',
    formula: math(eq(v('St'), frac(row(v('f'), v('L')), v('U')))), formulaText: 'St = fL/U',
    meaning: '流体通过一个长度 L 需要 L/U 的时间，振荡一个周期需要 1/f。St = (L/U)/(1/f)，表示这段通过时间里包含多少个振荡周期。',
    variables: [['f', '周期现象的频率，Hz'], ['L', '特征长度，m；圆柱常取直径'], ['U', '参考来流速度，m/s']],
    applications: ['将圆柱涡脱落频率与直径、来流速度联系起来。', '研究机翼非定常载荷、风致振动和扑翼运动。'],
    example: '圆柱直径 L = 0.1 m、U = 10 m/s、测得涡脱落频率 f = 20 Hz，则 St = 0.20。',
    caution: 'St 的取值依赖形状、Re 和工况；0.2 不是所有物体的通用常数。传热 Stanton 数也常记作 St，但定义为 h/(ρUc_p)。',
    related: ['reynolds', 'nusselt'], sources: [purdue],
  },
  {
    id: 'froude', symbol: 'Fr', name: '弗劳德数', english: 'Froude number', italian: 'Numero di Froude', category: 'surface',
    summary: '流动与重力波速度的比较，常见于自由液面。',
    formula: math(eq(v('Fr'), frac(v('U'), `<msqrt>${row(v('g'), v('L'))}</msqrt>`))), formulaText: 'Fr = U/√(gL)',
    meaning: '重力会把抬高的自由液面拉回去并产生波动。Fr 比较流速与重力作用的速度尺度 √(gL)；其平方对应惯性与重力的尺度比。',
    variables: [['U', '特征流速，m/s'], ['g', '重力加速度，m/s²'], ['L', '特征长度，m；浅水明渠常取水深或水力深度']],
    applications: ['船模试验中保持造波的重力相似性。', '在适用的浅水明渠模型中，用 Fr < 1、Fr > 1 区分缓流与急流。'],
    example: '取 U = 2 m/s、水深 L = 1 m，Fr = 2/√9.81 ≈ 0.64。',
    caution: '部分教材把 U²/(gL) 称为 Froude 数；它等于本页 Fr²。Fr = 1 的临界解释依赖所用自由液面模型，不应直接套到任意流动。',
    related: ['weber', 'reynolds'], sources: [purdue],
  },
  {
    id: 'weber', symbol: 'We', name: '韦伯数', english: 'Weber number', italian: 'Numero di Weber', category: 'surface',
    summary: '惯性能否克服表面张力，让液面变形或破碎。',
    formula: math(eq(v('We'), frac(row(v('ρ'), pow(v('U'), 2), v('L')), v('σ')))), formulaText: 'We = ρU²L/σ',
    meaning: '表面张力倾向于缩小液体界面、维持液滴形状，惯性倾向于拉伸或打散界面。We 大表示惯性相对更强，界面更可能明显变形。',
    variables: [['ρ', '明确选定相的密度，kg/m³'], ['U', '与所研究界面运动有关的相对速度，m/s'], ['L', '特征长度，m；液滴常取直径'], ['σ', '表面张力，N/m']],
    applications: ['分析燃油雾化、液滴撞击与喷雾破碎。', '比较气流中液滴的变形和界面稳定性。'],
    example: '水滴撞击问题取液相 ρ = 1000 kg/m³、U = 1 m/s、直径 L = 1 mm、σ = 0.072 N/m，We ≈ 13.9。',
    caution: '气动破碎常用气相密度与气液相对速度，液滴撞击常用液相密度。两者数值不可直接比较；破碎阈值还依赖黏性、几何与流态。',
    related: ['froude', 'reynolds'], sources: [
      { title: 'NASA · Weber number in bubble dynamics (p. 11)', url: 'https://ntrs.nasa.gov/api/citations/19680009511/downloads/19680009511.pdf' },
    ],
  },
  {
    id: 'biot', symbol: 'Bi', name: '毕奥数', english: 'Biot number', italian: 'Numero di Biot', category: 'heat',
    summary: '固体内部导热热阻与表面对流热阻的比较。',
    formula: math(eq(v('Bi'), frac(row(v('h'), sub('L', 'c')), sub('k', 's')))), formulaText: 'Bi = hL_c/k_s',
    meaning: '物体冷却时，热量先从内部传到表面，再传给周围流体。Bi 小表示内部导热相对容易，物体内部温差通常较小；Bi 大时内部温度梯度不能忽略。',
    variables: [['h', '表面对流换热系数，W/(m²·K)'], ['L_c', '固体特征长度，m；集中参数分析常取 V/A_s'], ['k_s', '固体导热系数，W/(m·K)'], ['V、A_s', '固体体积与参与对流的表面积']],
    applications: ['判断金属零件冷却能否用均匀温度的集中参数模型。', '选择瞬态导热的空间分辨率或查用适当的解析解。'],
    example: 'h = 10 W/(m²·K)、L_c = 0.005 m、k_s = 200 W/(m·K)，则 Bi = 2.5 × 10⁻⁴，内部导热很快。',
    caution: 'Bi 与 Nu 形似但物理对象不同：Bi 用固体 k_s，Nu 用流体 k_f。Bi < 0.1 是常见集中参数近似准则，仍需核对几何、初始条件和边界条件。',
    related: ['fourier', 'nusselt'], sources: [mit],
  },
  {
    id: 'fourier', symbol: 'Fo', name: '傅里叶数', english: 'Fourier number', italian: 'Numero di Fourier', category: 'heat',
    summary: '已经过去的时间，相对热扩散所需时间有多长。',
    formula: math(eq(v('Fo'), frac(row(v('α'), v('t')), pow(v('L'), 2)))), formulaText: 'Fo = αt/L²',
    meaning: '热扩散穿过长度 L 的典型时间是 L²/α。Fo 就是实际时间除以这个时间尺度；Fo 越大，温度变化越有机会深入物体。',
    variables: [['α', '所研究材料的热扩散率 α = k/(ρc_p)，m²/s'], ['t', '从所选初始时刻起经过的时间，s'], ['L', '与解析解或关联式一致的特征长度，m']],
    applications: ['描述平板、圆柱、球体升温或冷却的无量纲时间。', '与 Bi 一起判断固体瞬态温度分布，比较不同厚度材料的响应速度。'],
    example: 'α = 1.0 × 10⁻⁵ m²/s、t = 10 s、L = 0.01 m，则 Fo = 1。若 L 加倍，达到相同 Fo 所需时间变为 4 倍。',
    caution: 'Fo 大不自动意味着物体已达到环境温度；还需要 Bi、几何和边界条件。平板解析解常取半厚度，不能未经换算就替换成 Bi 中的 V/A_s。',
    related: ['biot', 'prandtl'], sources: [mit],
  },
];

export function searchNumbers(query = '', category = 'all') {
  const normalized = query.trim().toLocaleLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  const terms = normalized.split(/\s+/).filter(Boolean);
  return numbers.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    const haystack = [item.symbol, item.symbol.replaceAll('_', ''), item.name, item.english, item.italian,
      item.summary, item.meaning, ...item.applications, item.formulaText, categories[item.category]]
      .join(' ').toLocaleLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    return terms.every((term) => haystack.includes(term));
  });
}
