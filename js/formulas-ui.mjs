import { formulas } from './formulas-data.mjs';

const catalog = document.getElementById('formula-catalog');
const detail = document.getElementById('formula-detail');
const grid = document.getElementById('formula-grid');
const breadcrumbs = document.querySelector('.formula-breadcrumbs');
let catalogOrigin = null;
let catalogScroll = 0;
history.scrollRestoration = 'manual';

const escape = (value) => String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paragraphs = (items) => items.map((text) => `<p>${escape(text)}</p>`).join('');
const equations = (items = []) => items.map((entry) => `<figure class="formula-equation" role="group" tabindex="0" aria-label="${escape(entry.label)}：${escape(entry.text)}">${entry.math}<figcaption>${escape(entry.label)}</figcaption></figure>`).join('');

grid.innerHTML = formulas.map((item) => `<a class="formula-card" href="#${item.id}">
  <span class="formula-symbol" aria-hidden="true">${escape(item.symbol)}</span>
  <h2>${escape(item.name)}</h2><p>${escape(item.summary)}</p>
  <span class="formula-card-foot">公式 · 推导 · 物理意义</span>
</a>`).join('');

function renderArticle(item) {
  detail.innerHTML = `<a class="formula-back" href="#">返回公式目录</a>
    <header class="formula-detail-head"><span class="formula-category">${escape(item.category)}</span>
      <h1 class="formula-title" id="formula-title" tabindex="-1">${escape(item.name)}</h1>
      <p class="formula-subtitle" lang="it">${escape(item.italian)}</p></header>
    <div class="formula-question"><h2>这个方程解决什么问题？</h2><p>${escape(item.question)}</p></div>
    <nav class="formula-jumps" aria-label="本篇内容"><button type="button" data-jump="formula-result">公式</button><button type="button" data-jump="formula-derivation">推导过程</button><button type="button" data-jump="formula-meaning">物理意义</button><button type="button" data-jump="formula-conditions">适用条件</button></nav>
    <section class="formula-section" aria-labelledby="formula-result"><h2 id="formula-result" tabindex="-1">先看完整方程</h2><p class="formula-scroll-hint">较长公式可左右滑动查看。</p>${equations(item.equations)}</section>
    <section class="formula-section"><h2>符号与约定</h2><dl class="formula-term-list">${item.terms.map(([term, definition])=>`<dt>${escape(term)}</dt><dd>${escape(definition)}</dd>`).join('')}</dl></section>
    <section class="formula-section" aria-labelledby="formula-derivation"><h2 id="formula-derivation" tabindex="-1">一步步推导</h2><ol class="formula-step-list">${item.steps.map((step)=>`<li><h3>${escape(step.title)}</h3><p>${escape(step.text)}</p>${equations(step.equations)}</li>`).join('')}</ol></section>
    <section class="formula-meaning" aria-labelledby="formula-meaning"><h2 id="formula-meaning" tabindex="-1">物理意义</h2>${paragraphs(item.meaning)}</section>
    <section class="formula-example"><h2>${escape(item.example.title)}</h2><p>${escape(item.example.text)}</p>${equations(item.example.equations)}</section>
    <section class="formula-conditions" aria-labelledby="formula-conditions"><h2 id="formula-conditions" tabindex="-1">适用条件与简化</h2><ul>${item.conditions.map((text)=>`<li>${escape(text)}</li>`).join('')}</ul></section>
    <nav class="formula-related" aria-label="相关公式"><h2>接着理解</h2>${item.related.map((id)=>{
      const target = formulas.find((entry)=>entry.id===id);
      return `<a href="#${target.id}">${escape(target.name)}</a>`;
    }).join('')}</nav>
    <section class="formula-sources"><h2>参考资料</h2><p>依据课堂笔记的方程链整理，补充符号约定、推导说明与应用；以下公开资料可用于交叉核对。</p><ul>${item.sources.map((source)=>`<li><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)}</a></li>`).join('')}</ul></section>`;
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
      grid.querySelector(`a[href="#${catalogOrigin}"]`)?.focus({preventScroll:true});
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
route(true);
