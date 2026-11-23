import {v,b,o,n,row,sub,sup,frac,eq,plus,par,equation} from './formula-math.mjs';

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

export const thinAirfoilFormula={
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
  sources:[{title:'小扰动交互实验 · 压力、迎角、弯度与厚度',url:'./perturbation.html'}],
  sourceNote:'依据课堂 Aerodinamica 第十四节与提供的笔记整理；本页采用顺时针为正的涡层强度 γ。可结合交互实验检查各项变化。',
};

