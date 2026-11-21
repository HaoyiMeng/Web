import {v,b,o,n,t,row,sub,sup,frac,eq,plus,par,dot,grad,div,dt,pt,equation} from './formula-math.mjs';

// Site convention: (grad a)_ij = ∂_j a_i, (div T)_i = ∂_j T_ij.
// Tensor-product slots are ordered: (a ⊗ b)_ij = a_i b_j.
const f=v('f'), g=v('g'), a=b('a'), c=b('b'), tensor=b('T'), velocity=b('v');
const indices=(s)=>row(...[...s].map(v));
const comp=(s,i)=>sub(s,indices(i));
const partial=(i,s)=>row(sub(o('∂'),v(i)),s);
const cross=(x,y)=>row(x,o('×'),y);
const outer=(x,y)=>row(x,o('⊗'),y);
const transpose=(x)=>sup(par(x),t('T'));
const curl=(x)=>cross(o('∇'),x);
const directional=(x,y)=>row(par(dot(x,o('∇'))),y);
const laplacian=(x)=>row(sup(o('∇'),n(2)),x);
const tuple=(...x)=>row(o('('),...x.flatMap((s,i)=>i?[o(','),s]:[s]),o(')'));
const brackets=(x)=>row(o('['),x,o(']'));
const zero=b('0');
const multiline=(left,first,second)=>`<mtable columnalign="right left" columnspacing="0.25em"><mtr><mtd>${left}</mtd><mtd>${row(o('='),first)}</mtd></mtr><mtr><mtd></mtd><mtd>${second}</mtd></mtr></mtable>`;

const arizona={title:'University of Arizona · Vector calculus refresher',url:'https://opentextbooks.library.arizona.edu/mathematicalmodeling/chapter/appendix-vector-calculus/'};
const gatech={title:'Georgia Tech · Vector identities',url:'https://harrell.math.gatech.edu/pde/vectorid.html'};
const kelly={title:'University of Auckland · Vectors and tensors, §1.14',url:'https://pkel015.connect.amazon.auckland.ac.nz/SolidMechanicsBooks/Part_III/Chapter_1_Vectors_Tensors/Vectors_Tensors_Complete.pdf'};
const vt={title:'Virginia Tech · Foundations of fluid mechanics',url:'https://pressbooks.lib.vt.edu/configurationaerodynamics/chapter/foundations-of-fluid-mechanics/'};

export const vectorToolsFormula={
  id:'vector-tools',name:'∇ 运算工具箱',italian:'Gradiente, divergenza e rotore',symbol:'∇',category:'读懂方程的基础',
  summary:'按梯度、散度、旋度和方向导数查定义，再用对应的乘积法则展开。',
  question:'面对 ∇f、∇·a、∇×a 或 (a·∇)f，先怎样判断结果类型，再选择正确的展开规则？',
  conventionNote:'本页统一采用 (∇a)ᵢⱼ = ∂ⱼaᵢ、(∇·T)ᵢ = ∂ⱼTᵢⱼ、(a⊗b)ᵢⱼ = aᵢbⱼ。部分讲义采用转置的梯度或另一侧的张量散度；两种记法均可使用，但乘积顺序和转置必须成套核对。这里 ∇a 表示向量的 Jacobian，不能直接按普通向量的外积顺序猜读。',
  equations:[
    equation('Nabla：由三个空间偏导数组成的算子','∇ = e₁∂₁ + e₂∂₂ + e₃∂₃',eq(o('∇'),plus(row(comp(b('e'),'1'),sub(o('∂'),n(1))),row(comp(b('e'),'2'),sub(o('∂'),n(2))),row(comp(b('e'),'3'),sub(o('∂'),n(3)))))),
    equation('偏导记号','∂ᵢ = ∂/∂xᵢ',eq(sub(o('∂'),v('i')),frac(o('∂'),row(o('∂'),comp(v('x'),'i'))))),
  ],
  terms:[
    ['f、g','标量场，例如温度、压力或密度。'],
    ['a、b、v','向量场；v 专用于流体速度。粗体表示向量或张量。'],
    ['T、Tᵀ','二阶张量及其转置；Tᵀ 的 ij 分量是 Tⱼᵢ。'],
    ['⊗、·、×、:','依次为张量积、点积、叉积、双重收缩；A:B = ΣᵢΣⱼAᵢⱼBᵢⱼ。这些乘法不能互换。'],
    ['i、j、k、ℓ','取 1、2、3；同一项中重复出现两次的指标求和，未重复的指标保留。∂ⱼaᵢ 是 a 的第 i 分量沿 xⱼ 的变化率。'],
    ['εᵢⱼₖ','三维 Levi–Civita 符号：ε₁₂₃ = +1，交换两个指标变号，出现重复指标则为 0。'],
    ['eᵢ、xᵢ','固定的笛卡尔正交基向量与坐标；本页分量式使用右手坐标系。'],
  ],
  operatorOverview:[
    {operator:'∇f · 标量梯度',input:'标量 f',output:'向量',meaning:'给出各方向的变化率，指向增长最快的方向。'},
    {operator:'∇a · 向量梯度',input:'向量 a',output:'二阶张量',meaning:'记录每个向量分量沿各坐标方向的变化。'},
    {operator:'∇T · 张量梯度',input:'二阶张量 T',output:'三阶张量',meaning:'逐方向记录二阶张量的变化。'},
    {operator:'∇·a · 向量散度',input:'向量 a',output:'标量',meaning:'单位体积的净流出强度。'},
    {operator:'∇·T · 张量散度',input:'二阶张量 T',output:'向量',meaning:'将每一行通量的空间不平衡合成一个向量。'},
    {operator:'∇×a · 旋度',input:'三维向量 a',output:'向量',meaning:'局部环流的方向与强度。'},
    {operator:'(a·∇) · 方向微分算子',input:'标量／向量／张量场',output:'与输入同阶',meaning:'用 a 的分量加权各空间方向的偏导。'},
    {operator:'∇² · 拉普拉斯算子',input:'标量／向量场',output:'与输入同阶',meaning:'各坐标方向二阶偏导之和，常见于扩散项。'},
  ],
  operatorGroups:[
    {
      id:'gradient',title:'梯度 · Gradiente',
      description:'不缩并微分方向，结果比输入高一阶。向量梯度依照本页约定把分量指标放在前、微分方向放在后。',
      rules:[
        {
          kind:'definition',title:'标量梯度：标量 → 向量',note:'f(x) 的小变化满足 df = ∇f·dx；∇f 的大小是最大空间增长率。',
          equations:[equation('三个方向的偏导','∇f = (∂₁f, ∂₂f, ∂₃f)',eq(grad(f),tuple(partial('1',f),partial('2',f),partial('3',f))))],
        },
        {
          kind:'definition',title:'向量梯度：向量 → 二阶张量',note:'第 j 列记录沿 xⱼ 移动时整个向量 a 怎样变化；它把小位移 dx 映射为 da。',
          equations:[
            equation('本页的指标顺序','(∇a)ᵢⱼ = ∂ⱼaᵢ',eq(comp(par(grad(a)),'ij'),partial('j',comp(a,'i')))),
            equation('作用在小位移上','da = (∇a)dx',eq(row(v('d'),a),row(par(grad(a)),v('d'),b('x')))),
          ],
        },
        {
          kind:'definition',title:'张量梯度：二阶 → 三阶',note:'对 T 的每个分量分别求空间导数，最后一个指标 k 专门表示微分方向。',
          equations:[equation('三阶结果','(∇T)ᵢⱼₖ = ∂ₖTᵢⱼ',eq(comp(par(grad(tensor)),'ijk'),partial('k',comp(tensor,'ij'))))],
        },
        {
          kind:'product',title:'两个标量相乘',note:'与一元函数的乘积求导相同，每个因子各被求导一次。',
          equations:[equation('标量 × 标量','∇(fg) = g∇f + f∇g',eq(grad(par(row(f,g))),plus(row(g,grad(f)),row(f,grad(g)))))],
        },
        {
          kind:'product',title:'标量乘向量',note:'结果是二阶张量。按照本页指标顺序，第一项必须是 a⊗∇f；若教材转置梯度，外积顺序也会跟着转置。',
          equations:[
            equation('标量 × 向量','∇(fa) = a⊗∇f + f∇a',eq(grad(par(row(f,a))),plus(outer(a,grad(f)),row(f,grad(a))))),
            equation('按分量核对顺序','[∇(fa)]ᵢⱼ = aᵢ∂ⱼf + f∂ⱼaᵢ',eq(comp(brackets(grad(par(row(f,a)))),'ij'),plus(row(comp(a,'i'),partial('j',f)),row(f,partial('j',comp(a,'i')))))),
          ],
        },
        {
          kind:'product',title:'向量点积的梯度',note:'a·b 是标量，所以结果是向量。这里的转置确保结果分量的自由指标对应微分方向。',
          equations:[
            equation('两项转置形式','∇(a·b) = (∇a)ᵀb + (∇b)ᵀa',eq(grad(par(dot(a,c))),plus(row(transpose(grad(a)),c),row(transpose(grad(c)),a)))),
            equation('方向导数与旋度的等价形式','∇(a·b) = (a·∇)b + (b·∇)a + a×(∇×b) + b×(∇×a)',multiline(grad(par(dot(a,c))),plus(directional(a,c),directional(c,a)),row(o('+'),cross(a,par(curl(c))),o('+'),cross(c,par(curl(a)))))),
          ],
        },
        {
          kind:'product',title:'向量叉积的梯度',note:'叉积是向量，完整梯度是二阶张量。对固定 j，下式给出该张量的第 j 列，避免把向量叉积误写成普通张量乘法。',
          equations:[equation('逐列使用乘积法则','∂ⱼ(a×b) = (∂ⱼa)×b + a×(∂ⱼb)',eq(partial('j',par(cross(a,c))),plus(cross(par(partial('j',a)),c),cross(a,par(partial('j',c))))))],
        },
        {
          kind:'product',title:'张量积的梯度',note:'a⊗b 是二阶张量；再取梯度得到三阶张量，不能当成一个向量。这里 i、j、k 都是保留的自由指标。',
          equations:[equation('三阶分量形式','[∇(a⊗b)]ᵢⱼₖ = (∂ₖaᵢ)bⱼ + aᵢ(∂ₖbⱼ)',eq(
            comp(brackets(grad(par(outer(a,c)))),'ijk'),
            plus(row(par(partial('k',comp(a,'i'))),comp(c,'j')),row(comp(a,'i'),par(partial('k',comp(c,'j')))))
          ))],
        },
      ],
    },
    {
      id:'divergence',title:'散度 · Divergenza',
      description:'把一个空间微分方向与场的一个指标缩并，阶数降低一阶。本页二阶张量采用逐行散度，与边界通量 Tn 配套。',
      rules:[
        {
          kind:'definition',title:'向量散度：向量 → 标量',note:'想象一个小盒子：三对面的流出减去流入，再除以体积，就是散度。',
          equations:[equation('同方向分量的偏导相加','∇·a = ∂₁a₁ + ∂₂a₂ + ∂₃a₃',eq(div(a),plus(partial('1',comp(a,'1')),partial('2',comp(a,'2')),partial('3',comp(a,'3')))))],
        },
        {
          kind:'definition',title:'张量散度：二阶张量 → 向量',note:'对每个固定 i，把第 i 行视为一个通量向量并取散度。应力张量的散度因此可以表示单位体积的合力。',
          equations:[
            equation('重复 j 表示求和','(∇·T)ᵢ = ∂ⱼTᵢⱼ',eq(comp(par(div(tensor)),'i'),partial('j',comp(tensor,'ij')))),
            equation('与面法向相乘的通量','(Tn)ᵢ = Tᵢⱼnⱼ',eq(comp(par(row(tensor,b('n'))),'i'),row(comp(tensor,'ij'),comp(b('n'),'j')))),
          ],
        },
        {
          kind:'product',title:'标量乘向量的散度',note:'质量通量 ρv 的展开就是取 f=ρ、a=v；不能只保留 f∇·a 而漏掉密度梯度。',
          equations:[equation('标量结果','∇·(fa) = a·∇f + f∇·a',eq(div(par(row(f,a))),plus(dot(a,grad(f)),row(f,div(a)))))],
        },
        {
          kind:'product',title:'向量叉积的散度',note:'结果是标量；两项是“一个向量点乘另一个向量的旋度”，它们之间有减号。',
          equations:[equation('叉积通量','∇·(a×b) = b·(∇×a) − a·(∇×b)',eq(div(par(cross(a,c))),row(dot(c,par(curl(a))),o('−'),dot(a,par(curl(c))))))],
        },
        {
          kind:'product',title:'张量积的散度',note:'本页 a⊗b 的第二个槽位与微分指标 j 缩并，因此是 b 沿自身方向对 a 求导。交换 a、b 会改变结果。',
          equations:[
            equation('向量结果','∇·(a⊗b) = (b·∇)a + a(∇·b)',eq(div(par(outer(a,c))),plus(directional(c,a),row(a,par(div(c)))))) ,
            equation('分量检查','∂ⱼ(aᵢbⱼ) = bⱼ∂ⱼaᵢ + aᵢ∂ⱼbⱼ',eq(partial('j',par(row(comp(a,'i'),comp(c,'j')))),plus(row(comp(c,'j'),partial('j',comp(a,'i'))),row(comp(a,'i'),partial('j',comp(c,'j')))))),
          ],
        },
        {
          kind:'product',title:'标量乘二阶张量的散度',note:'T∇f 是张量作用在向量上的乘积，结果是向量。按另一侧张量散度记号推导时，转置位置可能不同。',
          equations:[equation('逐行散度的乘积法则','∇·(fT) = T∇f + f∇·T',eq(div(par(row(f,tensor))),plus(row(tensor,grad(f)),row(f,div(tensor)))))],
        },
        {
          kind:'identity',title:'旋度的散度恒为零',note:'场具有连续二阶偏导时，交换混合偏导后各项成对抵消；“散度为零”不代表旋度向量本身为零。',
          equations:[equation('标量零','∇·(∇×a) = 0',eq(div(par(curl(a))),n(0)))],
        },
      ],
    },
    {
      id:'curl',title:'旋度 · Rotore',
      description:'在三维右手坐标系中，旋度把向量场变成描述局部环流的向量。此处只定义向量旋度；张量旋度必须另行指定逐行或逐列等约定。',
      rules:[
        {
          kind:'definition',title:'向量旋度：向量 → 向量',note:'沿一个很小的回路作切向积分，除以面积，得到旋度沿该回路法向的分量；方向使用右手定则。速度旋度称为涡量。',
          equations:[
            equation('三维分量定义','(∇×a)ᵢ = εᵢⱼₖ∂ⱼaₖ',eq(comp(par(curl(a)),'i'),row(comp(v('ε'),'ijk'),partial('j',comp(a,'k'))))),
            equation('例如第三分量','(∇×a)₃ = ∂₁a₂ − ∂₂a₁',eq(comp(par(curl(a)),'3'),row(partial('1',comp(a,'2')),o('−'),partial('2',comp(a,'1'))))),
          ],
        },
        {
          kind:'product',title:'标量乘向量的旋度',note:'第一项中 ∇f 在叉积左边；调换两个向量会使该项变号。',
          equations:[equation('标量 × 向量','∇×(fa) = (∇f)×a + f(∇×a)',eq(curl(par(row(f,a))),plus(cross(par(grad(f)),a),row(f,par(curl(a))))))],
        },
        {
          kind:'product',title:'向量叉积的旋度',note:'四项分别来自两个方向导数和两个散度。也可以用本页的张量积散度法则逐项核对。',
          equations:[
            equation('四项展开','∇×(a×b) = (b·∇)a − (a·∇)b + a(∇·b) − b(∇·a)',multiline(curl(par(cross(a,c))),row(directional(c,a),o('−'),directional(a,c)),row(o('+'),a,par(div(c)),o('−'),c,par(div(a))))),
            equation('同一约定下的紧凑形式','∇×(a×b) = ∇·(a⊗b) − ∇·(b⊗a)',eq(curl(par(cross(a,c))),row(div(par(outer(a,c))),o('−'),div(par(outer(c,a)))))),
          ],
        },
        {
          kind:'identity',title:'梯度的旋度恒为零',note:'f 具有连续二阶偏导时成立。这是一个局部微分恒等式；从“无旋”反过来推出全局势函数，还需要考虑区域的拓扑。',
          equations:[equation('向量零','∇×(∇f) = 0',eq(curl(par(grad(f))),zero))],
        },
      ],
    },
    {
      id:'directional',title:'方向导数与物质导数',
      description:'(a·∇) 是一个先用向量 a 指定方向、再对右侧场求空间导数的算子。物质导数还包含固定位置的时间变化，二者并不等同。',
      rules:[
        {
          kind:'definition',title:'方向微分算子',note:'若 a 是单位向量，表示沿该方向每单位长度的变化率；若 a 是速度，得到沿运动的空间变化率。除非括号另有指定，微分只作用在算子右侧的场上。',
          equations:[equation('先给各空间偏导加权','a·∇ = a₁∂₁ + a₂∂₂ + a₃∂₃',eq(dot(a,o('∇')),plus(row(comp(a,'1'),sub(o('∂'),n(1))),row(comp(a,'2'),sub(o('∂'),n(2))),row(comp(a,'3'),sub(o('∂'),n(3))))))],
        },
        {
          kind:'definition',title:'作用于标量或向量',note:'对标量求导后仍是标量，对向量求导后仍是向量。按照本页的梯度约定，方向向量 a 乘在 ∇b 的右侧。',
          equations:[
            equation('标量结果','(a·∇)f = a·∇f',eq(directional(a,f),dot(a,grad(f)))),
            equation('向量结果','(a·∇)b = (∇b)a',eq(directional(a,c),row(par(grad(c)),a))),
            equation('分量形式','[(a·∇)b]ᵢ = aⱼ∂ⱼbᵢ',eq(comp(brackets(directional(a,c)),'i'),row(comp(a,'j'),partial('j',comp(c,'i'))))),
          ],
        },
        {
          kind:'product',title:'方向导数的乘积法则',note:'a 是本次方向微分算子的系数，右侧的 f 和 b 各被求导一次；本式不会凭空产生 ∇a 项。',
          equations:[equation('沿 a 对 fb 求导','(a·∇)(fb) = [(a·∇)f]b + f(a·∇)b',eq(directional(a,par(row(f,c))),plus(row(brackets(directional(a,f)),c),row(f,directional(a,c)))))],
        },
        {
          kind:'definition',title:'物质导数：跟随流体质点',note:'同一个质点既经历时间变化，也经过空间中不同的位置。定常只消去 ∂/∂t；对流项通常仍然存在。',
          equations:[
            equation('任意标量场','Df/Dt = ∂f/∂t + (v·∇)f',eq(dt(f),plus(pt(f),directional(velocity,f)))),
            equation('速度的物质导数就是加速度','Dv/Dt = ∂v/∂t + (v·∇)v',eq(dt(velocity),plus(pt(velocity),directional(velocity,velocity)))),
          ],
        },
        {
          kind:'identity',title:'对流加速度的 Lamb 形式',note:'令两个向量相同，可把对流加速度分为速度平方的梯度与涡量项。它是运动学恒等式，不要求定常、无黏或无旋。',
          equations:[equation('用于 Euler 与能量方程的改写','(v·∇)v = ∇(v·v/2) − v×(∇×v)',eq(directional(velocity,velocity),row(grad(par(frac(dot(velocity,velocity),n(2)))),o('−'),cross(velocity,par(curl(velocity))))))],
        },
      ],
    },
    {
      id:'laplacian',title:'拉普拉斯算子 · Laplaciano',
      description:'这是二阶空间微分算子。对标量表示梯度的散度；在固定笛卡尔基下，对向量逐分量作用。',
      rules:[
        {
          kind:'definition',title:'标量与向量的拉普拉斯',note:'温度、浓度和速度中的扩散项常含拉普拉斯算子。它依赖邻近区域的空间变化，不能只凭当地数值判断正负。',
          equations:[
            equation('标量形式','∇²f = ∇·(∇f) = ∂ᵢ∂ᵢf',eq(laplacian(f),div(par(grad(f))),partial('i',partial('i',f)))),
            equation('向量逐分量作用','(∇²a)ᵢ = ∂ⱼ∂ⱼaᵢ',eq(comp(par(laplacian(a)),'i'),partial('j',partial('j',comp(a,'i'))))),
            equation('与本页梯度／散度约定相配','∇²a = ∇·(∇a)',eq(laplacian(a),div(par(grad(a))))),
          ],
        },
        {
          kind:'product',title:'两个标量乘积的拉普拉斯',note:'二阶求导时，交叉项会出现两次，因此梯度点积前的系数是 2。',
          equations:[equation('二阶乘积法则','∇²(fg) = f∇²g + g∇²f + 2∇f·∇g',multiline(laplacian(par(row(f,g))),plus(row(f,laplacian(g)),row(g,laplacian(f))),row(o('+'),n(2),dot(grad(f),grad(g)))))],
        },
        {
          kind:'identity',title:'梯度、散度与双旋度的关系',note:'连续二阶偏导下成立。若再有 ∇·a=0，才可以把拉普拉斯写成负的双旋度。',
          equations:[equation('向量恒等式','∇²a = ∇(∇·a) − ∇×(∇×a)',eq(laplacian(a),row(grad(par(div(a))),o('−'),curl(par(curl(a))))))],
        },
      ],
    },
  ],
  steps:[
    {title:'先检查输入与输出类型',text:'看清输入是标量、向量还是张量，再看 ∇ 后面有没有点积、叉积或缩并。等号两侧必须是同一阶对象。'},
    {title:'再选对应算子的乘积法则',text:'从上面的梯度、散度、旋度或方向导数分组中查找。先写完整展开，再代入无旋、不可压缩、常密度等条件；不要提前删项。'},
    {title:'最后用分量和一个简单场核对',text:'出现转置、外积或张量散度时，写出一个带自由指标的分量式。向量梯度常有两套记法；只比较 ∇ 的外观容易把乘积顺序看反。'},
  ],
  meaning:[
    '梯度关心“往哪个方向怎样变”；散度关心“小盒子里净流出多少”；旋度关心“小回路周围怎样转”；方向导数关心“沿指定方向走时会怎样变”。',
    '∇ 是微分算子，不是可以任意交换位置的普通向量。乘积法则必须同时照顾求导作用的对象、对象阶数与指标顺序。张量各分量非零而散度为零，表示相对两面的作用抵消，并不表示每个面上没有力。',
  ],
  conditions:[
    '分量展开使用固定的笛卡尔正交基和三维右手坐标系。柱坐标与球坐标中基向量随位置变化，不能直接照抄这些偏导数组合。',
    '一阶乘积法则要求相应可微性；交换混合二阶偏导以及零旋度／零散度恒等式，通常假设场具有连续二阶偏导。遇到激波或奇点，应核对弱形式与区域。',
    '本页的向量梯度和张量散度保持与动量通量 (a⊗b)n = a(b·n) 一致；部分教材把 ∇a 或 ∇·T 定义为转置／另一侧缩并，必须连同牵引力与乘积法则一起转换。',
    '张量旋度存在逐行、逐列等不同定义；本页不把未定义的 ∇×T 当成通用运算。需使用时，先给出明确的分量定义再推导。',
    '方向导数 a·∇ 只含空间变化；物质导数 D/Dt = ∂/∂t + v·∇ 还含时间变化。定常流动的物质导数不一定为零。',
  ],
  example:{
    title:'用两个简单场检查顺序与正负号',
    text:'取 f=x、a=(y,0,0)、b=(0,x,0)。有 fa=(xy,0,0)，故 ∇(fa) 的第一行为 (y,x,0)，其余行为零；a⊗∇f 与 f∇a 正好分别给出第一行的 (y,0,0) 和 (0,x,0)。再看 a⊗b：只有 T₁₂=xy 非零，所以逐行散度为 (x,0,0)；右侧 (b·∇)a+a∇·b=(x,0,0)。同时 a×b=(0,0,xy)，其旋度为 (x,−y,0)，与四项展开一致。另取常量 Ω 及 v=(−Ωy,Ωx,0)，可得 ∇·v=0、∇×v=(0,0,2Ω)，而 (v·∇)v=(−Ω²x,−Ω²y,0)；散度为零仍可同时有旋转和向心加速度。',
  },
  related:['gauss','stokes','reynolds-transport','momentum'],
  sources:[arizona,gatech,kelly,vt],
};
