import { formulas, formulaGroups } from './formulas-data.mjs';

const catalog = document.getElementById('formula-catalog');
const detail = document.getElementById('formula-detail');
const grid = document.getElementById('formula-grid');
const breadcrumbs = document.querySelector('.formula-breadcrumbs');
const groupFilters = document.getElementById('formula-group-filters');
const formulaCount = document.getElementById('formula-count');
let activeGroup = 'all';
let catalogOrigin = null;
let catalogScroll = 0;
history.scrollRestoration = 'manual';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paragraphs = (items) => items.map((text) => `<p>${escape(text)}</p>`).join('');
const equations = (items = []) => items.map((entry) => `<figure class="formula-equation" role="group" tabindex="0" aria-label="${escape(entry.label)}：${escape(entry.text)}">${entry.math}<figcaption>${escape(entry.label)}</figcaption></figure>`).join('');

const groupFor = (item) => formulaGroups.find((group) => group.id === item.group);
function renderCatalog() {
  const visibleGroups = formulaGroups.filter((group) => activeGroup === 'all' || group.id === activeGroup);
  grid.innerHTML = visibleGroups.map((group) => {
    const members = formulas.filter((item) => item.group === group.id);
    return `<section class="formula-collection" data-formula-group="${group.id}" aria-labelledby="formula-collection-${group.id}">
      <h2 class="formula-group-title" id="formula-collection-${group.id}">${escape(group.label)} <span class="formula-group-count">${members.length} 张卡片</span></h2>
      <p class="formula-group-description">${escape(group.description)}</p>
      <div class="formula-grid">${members.map((item) => `<a class="formula-card" data-formula-group="${group.id}" href="#${item.id}">
        <div class="formula-card-top"><span class="formula-symbol" aria-hidden="true">${escape(item.symbol)}</span><span class="formula-group-badge">${escape(group.label)}</span></div>
        <h3>${escape(item.name)}</h3><p>${escape(item.summary)}</p><span class="formula-card-foot">公式 · 推导 · 物理意义</span>
      </a>`).join('')}</div></section>`;
  }).join('');
  const shown = formulas.filter((item) => activeGroup === 'all' || item.group === activeGroup).length;
  formulaCount.textContent = `显示 ${shown} / ${formulas.length} 张卡片 · ${visibleGroups.length} 类`;
}
groupFilters.innerHTML = `<button type="button" data-formula-group="all" aria-pressed="true">全部</button>${formulaGroups.map((group) => `<button type="button" data-formula-group="${group.id}" aria-pressed="false">${escape(group.label)}</button>`).join('')}`;
groupFilters.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-formula-group]');
  if (!button) return;
  activeGroup = button.dataset.formulaGroup;
  groupFilters.querySelectorAll('button').forEach((entry) => entry.setAttribute('aria-pressed', String(entry === button)));
  renderCatalog();
});

function operatorOverview(item) {
  return `<section class="operator-convention"><h3>先统一记号</h3><p>${escape(item.conventionNote)}</p></section>
    <div class="operator-overview" role="region" tabindex="0" aria-label="Nabla 运算类型总览，可横向滚动"><table><caption>Nabla 运算类型总览</caption><thead><tr><th scope="col">运算</th><th scope="col">输入</th><th scope="col">输出</th><th scope="col">读法与意义</th></tr></thead><tbody>${item.operatorOverview.map((entry) => `<tr><th scope="row">${escape(entry.operator)}</th><td>${escape(entry.input)}</td><td>${escape(entry.output)}</td><td>${escape(entry.meaning)}</td></tr>`).join('')}</tbody></table></div>`;
}
const operatorRule = (rule) => `<article class="operator-rule"><h4>${escape(rule.title)}</h4>${rule.note ? `<p>${escape(rule.note)}</p>` : ''}${equations(rule.equations)}</article>`;
function operatorSections(item) {
  return `<section class="formula-section operator-groups" aria-labelledby="formula-operators"><h2 id="formula-operators">按 nabla 运算分类</h2>${item.operatorGroups.map((group) => {
    const definitions = group.rules.filter((rule) => rule.kind === 'definition');
    const otherRules = group.rules.filter((rule) => rule.kind !== 'definition');
    return `<section class="operator-group" aria-labelledby="operator-${group.id}"><h3 class="operator-group-heading" id="operator-${group.id}" tabindex="-1">${escape(group.title)}</h3><p>${escape(group.description)}</p>${definitions.map(operatorRule).join('')}${otherRules.length ? `<details class="operator-rules"><summary>乘积规则与常用恒等式（${otherRules.length} 条）</summary><div>${otherRules.map(operatorRule).join('')}</div></details>` : ''}</section>`;
  }).join('')}</section>`;
}

function renderArticle(item) {
  const isToolbox = !!item.operatorGroups;
  const group = groupFor(item);
  detail.dataset.formulaGroup = item.group;
  const jumps = isToolbox
    ? [{id:'formula-result',label:'总览'},...item.operatorGroups.map((entry) => ({id:`operator-${entry.id}`,label:entry.title})),{id:'formula-conditions',label:'适用条件'}]
    : [{id:'formula-result',label:'公式'},{id:'formula-derivation',label:'推导过程'},{id:'formula-meaning',label:'物理意义'},{id:'formula-conditions',label:'适用条件'}];
  detail.innerHTML = `<a class="formula-back" href="#">返回公式目录</a>
    <header class="formula-detail-head"><span class="formula-group-badge">${escape(group.label)}</span><span class="formula-category">${escape(item.category)}</span>
      <h1 class="formula-title" id="formula-title" tabindex="-1">${escape(item.name)}</h1>
      <p class="formula-subtitle" lang="it">${escape(item.italian)}</p></header>
    <div class="formula-question"><h2>这个公式解决什么问题？</h2><p>${escape(item.question)}</p></div>
    <nav class="formula-jumps" aria-label="本篇内容">${jumps.map((jump) => `<button type="button" data-jump="${jump.id}">${escape(jump.label)}</button>`).join('')}</nav>
    <section class="formula-section" aria-labelledby="formula-result"><h2 id="formula-result" tabindex="-1">${isToolbox ? '先看算子的输入与输出' : '先看完整公式'}</h2><p class="formula-scroll-hint">较长公式和表格可左右滑动查看。</p>${isToolbox ? operatorOverview(item) : ''}${equations(item.equations)}</section>
    <section class="formula-section"><h2>符号与约定</h2><dl class="formula-term-list">${item.terms.map(([term, definition])=>`<dt>${escape(term)}</dt><dd>${escape(definition)}</dd>`).join('')}</dl></section>
    ${isToolbox ? operatorSections(item) : ''}
    <section class="formula-section" aria-labelledby="formula-derivation"><h2 id="formula-derivation" tabindex="-1">${isToolbox ? '使用顺序' : '一步步推导'}</h2><ol class="formula-step-list">${item.steps.map((step)=>`<li><h3>${escape(step.title)}</h3><p>${escape(step.text)}</p>${equations(step.equations)}</li>`).join('')}</ol></section>
    <section class="formula-meaning" aria-labelledby="formula-meaning"><h2 id="formula-meaning" tabindex="-1">物理意义</h2>${paragraphs(item.meaning)}</section>
    <section class="formula-example"><h2>${escape(item.example.title)}</h2><p>${escape(item.example.text)}</p>${equations(item.example.equations)}</section>
    <section class="formula-conditions" aria-labelledby="formula-conditions"><h2 id="formula-conditions" tabindex="-1">适用条件与简化</h2><ul>${item.conditions.map((text)=>`<li>${escape(text)}</li>`).join('')}</ul></section>
    <nav class="formula-related" aria-label="相关公式"><h2>接着理解</h2>${item.related.map((id)=>{
      const target = formulas.find((entry)=>entry.id===id);
      return `<a href="#${target.id}">${escape(target.name)}</a>`;
    }).join('')}</nav>
    <section class="formula-sources"><h2>参考资料</h2><p>公式、推导与符号采用本页明确的约定，以下公开资料可用于交叉核对。</p><ul>${item.sources.map((source)=>`<li><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)}</a></li>`).join('')}</ul></section>`;
  detail.setAttribute('aria-labelledby','formula-title');
}

function route(initial = false) {
  const id = location.hash.slice(1);
  const item = formulas.find((entry)=>entry.id===id);
  if (item) {
    if (!catalog.hidden) { catalogOrigin=item.id; catalogScroll=window.scrollY; }
    renderArticle(item);
    catalog.hidden=true;
    detail.hidden=false;
    breadcrumbs.innerHTML=`<a href="./library.html">Library</a><span aria-hidden="true">/</span><a href="#">公式</a><span aria-hidden="true">/</span><span aria-current="page">${escape(item.name)}</span>`;
    document.title=`${item.name} — 公式 — Haoyi Studio`;
    document.getElementById('formula-title').focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
  } else {
    detail.hidden=true;
    catalog.hidden=false;
    breadcrumbs.innerHTML='<a href="./library.html">Library</a><span aria-hidden="true">/</span><a href="#" aria-current="page">公式</a>';
    document.title='公式 — Haoyi Studio';
    if (!initial && catalogOrigin) {
      (grid.querySelector(`a[href="#${catalogOrigin}"]`) || groupFilters.querySelector('button[aria-pressed="true"]')).focus({preventScroll:true});
      window.scrollTo({top:catalogScroll,behavior:'instant'});
    }
  }
}

detail.addEventListener('click',(event)=>{
  const button=event.target.closest('button[data-jump]');
  if(!button) return;
  const target=document.getElementById(button.dataset.jump);
  target.focus({preventScroll:true});
  target.scrollIntoView({behavior:'instant',block:'start'});
});
document.querySelector('.formula-skip').addEventListener('click',(event)=>{
  event.preventDefault();
  const main=document.getElementById('main-content');
  main.focus({preventScroll:true});
  main.scrollIntoView({behavior:'instant'});
});
window.addEventListener('hashchange',()=>route());
renderCatalog();
route(true);
