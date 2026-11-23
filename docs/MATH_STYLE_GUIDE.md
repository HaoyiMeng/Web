# Haoyi Studio 数学公式排版规范 / Math Style Guide

> **唯一推荐的新增公式输入格式：LaTeX。** 网站通过锁定版本的 MathJax 3.2.2 将 TeX 排成 CommonHTML 数学字体；原有 MathML 继续受支持，并由同一个引擎排版。任何新知识卡片、理论笔记、摘要公式、题目解析都按本规范书写。

## 一、数学记号

| 对象 | 输入示例 | 规则 |
| --- | --- | --- |
| 标量变量 | `x, t, p, U, T, \alpha` | 默认数学斜体，不要手工挑选普通文本字体 |
| 向量 | `\boldsymbol{V}, \boldsymbol{u}, \boldsymbol{n}` | 使用粗数学斜体，不用普通文本 `<b>` |
| 函数 | `\sin\theta, \cos\theta, \ln r, \exp(x)` | 使用 LaTeX 内置正体函数名称 |
| 常见无量纲数 | `\mathrm{Re}, \mathrm{Ma}, \mathrm{Pr}` | 保持标准正体；复合系数可用 `C_p`、`C_L` |
| 微分 | `\frac{\mathrm{d}y}{\mathrm{d}x}\,\mathrm{d}x` | 微分算子及 `\mathrm{d}x` 用正体 |
| 偏导 | `\frac{\partial\phi}{\partial x}` | 使用 `\partial` |
| 积分与求和 | `\int_0^c\cdots\,\mathrm{d}x`, `\sum_{n=1}^{\infty}A_n` | 积分上下限、求和指标完整标示 |
| 主值积分 | `\operatorname{PV}\!\int_0^c\cdots\,\mathrm{d}x` | 明确奇异积分含义 |
| 单位 | `50\,\mathrm{m\,s^{-1}}` | 数值与单位之间加适量空白，单位用正体 |
| 多行推导 | `\begin{aligned}...\\...\end{aligned}` | 用等号对齐，不用 HTML `<br>` 模拟排版 |
| 分段函数 | `\begin{cases}...\\...\end{cases}` | 用 `cases`，不要在文本中拼花括号 |

**统一约定：** 物理量下标若是描述词，使用正体如 `\alpha_{\mathrm{ID}}` 或 `\Gamma_{\mathrm{lift}}`；作为变量的下标如 `x_i` 保留斜体。正升力涡片与逆时针环量两类符号约定必须明确说明。角度公式默认使用弧度；展示度数写 `6^\circ`。

## 二、网页作者如何新增公式

**独立公式**，保留访问脚本失败时可读的普通文本回退：

```html
<div class="g-math">
  <small>THIN-AIRFOIL LIFT / 升力系数</small>
  <span class="math-display"
        data-tex="C_L=2\pi\left(A_0+\frac{A_1}{2}\right)">
    CL = 2π(A₀ + A₁/2)
  </span>
</div>
```

**段落内公式**：

```html
<p>当 <span class="math-inline" data-tex="\alpha=0">α = 0</span> 时，
讨论弯度本身对环量的影响。</p>
```

**动态公式**：前端通过 DOM 增加带有 `data-tex` 的元素，类型排版器会处理公式资料库和无量纲数页面的动态导航。其他动态场景可在更新 DOM 后触发：

```js
document.dispatchEvent(new CustomEvent('haoyi:math-update', {
  detail: {root: document.getElementById('my-math-panel')}
}));
```

**卡片摘要**使用 `js/math-notation.mjs` 的 `mathSymbol()`，为中文标题旁的数学摘要提供统一的正体/斜体和脚标规则。新增有代表性的卡片符号请在该文件中登记。

## 三、页面与兼容

- 样式：`assets/math-standards.css`
- 排版器：`js/math-typeset.mjs`
- 浏览器排版：MathJax v3.2.2 `tex-mml-chtml`，主 CDN 为 jsDelivr，备用 CDN 为 cdnjs。
- 旧的 `js/formula-math.mjs`、`js/numbers-data.mjs` 所生成 MathML 保持语义不变，由 MathJax 统一渲染。未来新公式优先用 TeX，不再以 Unicode + HTML 上下标组合复杂分式。
- 保留长公式的横向滚动和文本回退，不用把公式存成图片或截图。图表 SVG 中的轴标签、测量数值不应由 MathJax 随帧反复重排。
- 网络屏蔽两个 CDN 时，已有 MathML 使用浏览器原生回退；LaTeX 作者必须提供可读的纯文本回退。

## 四、发布前检查

1. 用 MathJax 分别查看桌面和窄屏：分式上下层、积分限、Greek 字母、下标、单位是否清晰。
2. 检查所有 `data-tex` 是否括号配对，不能显示 TeX 错误。
3. 检查动态详情页切换及卡片摘要重新排版。
4. 不改变已有物理模型的符号约定和计算结果，仅调整表示形式。
5. 在新页面引入 `assets/math-standards.css` 与 `js/math-typeset.mjs`，两者缺一不可。
