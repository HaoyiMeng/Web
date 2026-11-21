import { numbers, categories, searchNumbers } from './numbers-data.mjs';

const catalog = document.getElementById('numbers-catalog');
const detail = document.getElementById('number-detail');
const grid = document.getElementById('number-grid');
const search = document.getElementById('number-search');
const filters = document.getElementById('number-filters');
const count = document.getElementById('number-count');
const empty = document.getElementById('number-empty');
const breadcrumb = document.querySelector('.numbers-breadcrumbs');
let category = 'all';
let catalogOriginId = null;
let catalogScroll = 0;

// Only the reviewed, repository-owned formula markup is rendered as HTML.
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const symbol = (value) => escape(value).replace(/_([a-z]+)/g, '<sub>$1</sub>');

function renderCatalog() {
  const matches = searchNumbers(search.value, category);
  grid.innerHTML = matches.map((item) => `
    <a class="number-card" data-category="${item.category}" href="#${item.id}">
      <div class="number-card-top"><span class="number-symbol">${symbol(item.symbol)}</span><span class="number-category">${categories[item.category]}</span></div>
      <h2>${item.name}</h2><span class="number-italian" lang="it">${item.italian}</span>
      <p>${item.summary}</p><span class="number-card-foot">查看公式与应用</span>
    </a>`).join('');
  count.textContent = `显示 ${matches.length} / ${numbers.length} 个数字`;
  empty.hidden = matches.length !== 0;
}

function renderDetail(item) {
  detail.innerHTML = `
    <a class="number-back" href="#">返回数字目录</a>
    <div class="number-detail-head">
      <span class="number-detail-symbol" aria-hidden="true">${symbol(item.symbol)}</span>
      <div class="number-detail-name"><span class="number-category">${categories[item.category]}</span>
        <h1 id="number-title" tabindex="-1">${item.name} <span>${symbol(item.symbol)}</span></h1>
        <p lang="it">${item.italian}</p></div>
    </div>
    <div class="number-formula" role="group" aria-label="定义公式：${escape(item.formulaText)}">${item.formula}</div>
    <p class="number-meaning">${item.meaning}</p>
    <div class="number-detail-grid">
      <section class="number-panel"><h2>公式里的每个量</h2><dl class="number-variables">${item.variables.map(([term, definition]) => `<dt>${symbol(term)}</dt><dd>${escape(definition)}</dd>`).join('')}</dl></section>
      <section class="number-panel"><h2>用在什么地方</h2><ul>${item.applications.map((text) => `<li>${text}</li>`).join('')}</ul></section>
    </div>
    <section class="number-example"><h2>代入数字，感受尺度</h2><p>${item.example}</p></section>
    <section class="number-caution"><h2>使用时留意</h2><p>${item.caution}</p></section>
    <nav class="number-related" aria-label="相关数字"><h2>连起来理解</h2>${item.related.map((id) => {
      const target = numbers.find((entry) => entry.id === id);
      return `<a href="#${id}">${symbol(target.symbol)} · ${target.name}</a>`;
    }).join('')}</nav>
    <section class="number-source"><h2>参考资料</h2><ul>${item.sources.map((source) => `<li><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)}</a></li>`).join('')}</ul></section>
  `;
  detail.setAttribute('aria-labelledby', 'number-title');
}

function route(initial = false) {
  // Unknown anchors (including the skip link) remain on the catalog.
  const id = location.hash.slice(1);
  if (id === 'main-content') return;
  const item = numbers.find((entry) => entry.id === id);
  if (item) {
    if (!catalog.hidden) {
      catalogScroll = window.scrollY;
      catalogOriginId = item.id;
    }
    renderDetail(item);
    catalog.hidden = true;
    detail.hidden = false;
    breadcrumb.innerHTML = `<a href="./library.html">Library</a><span aria-hidden="true">/</span><a href="#">数字</a><span aria-hidden="true">/</span><span aria-current="page">${item.name}</span>`;
    document.title = `${item.name} ${item.symbol} — 数字 — Haoyi Studio`;
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('number-title').focus({ preventScroll: true });
  } else {
    detail.hidden = true;
    catalog.hidden = false;
    breadcrumb.innerHTML = '<a href="./library.html">Library</a><span aria-hidden="true">/</span><a href="#" aria-current="page">数字</a>';
    document.title = '数字 — Haoyi Studio';
    if (!initial && catalogOriginId && !id) {
      const origin = grid.querySelector(`a[href="#${catalogOriginId}"]`) || search;
      origin.focus({ preventScroll: true });
      window.scrollTo({ top: catalogScroll, behavior: 'instant' });
    }
  }
}

search.addEventListener('input', renderCatalog);
document.querySelector('.numbers-skip').addEventListener('click', (event) => {
  event.preventDefault();
  const main = document.getElementById('main-content');
  main.focus({ preventScroll: true });
  main.scrollIntoView({ behavior: 'instant' });
});
filters.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-category]');
  if (!button) return;
  category = button.dataset.category;
  filters.querySelectorAll('button').forEach((entry) => entry.setAttribute('aria-pressed', String(entry === button)));
  renderCatalog();
});
window.addEventListener('hashchange', () => route());
renderCatalog();
route(true);
