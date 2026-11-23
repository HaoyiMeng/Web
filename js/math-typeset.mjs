/* Shared mathematics renderer: source convention is LaTeX, legacy formulas remain MathML.
 * https://docs.mathjax.org/en/v3.2/web/components/combined.html
 * Pin the CDN version. A secondary CDN and browser-native MathML remain fallbacks.
 */
const sources = [
  'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-mml-chtml.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-mml-chtml.js'
];
const config = {
  tex: {
    inlineMath: [['\\(', '\\)']],
    displayMath: [['\\[', '\\]']],
    processEscapes: true,
    packages: {'[+]': ['noerrors', 'noundefined']},
    macros: {
      dd: '\\mathrm{d}',
      pv: '\\operatorname{PV}'
    }
  },
  chtml: {scale: 1.02, matchFontHeight: false},
  options: {
    enableMenu: false,
    skipHtmlTags: ['script','noscript','style','textarea','pre','code','svg'],
    ignoreHtmlClass: 'math-ignore'
  },
  startup: {typeset: false}
};
if (!window.MathJax) window.MathJax = config;
const scriptLoad = src => new Promise((resolve,reject)=>{
  const node=document.createElement('script');
  node.async=true; node.src=src;
  node.onload=resolve;node.onerror=()=>{node.remove();reject(new Error('Math library unreachable'));};
  document.head.append(node);
});
const escapeProof = element => element.classList.contains('math-display') || element.dataset.display === 'block';
const pending = new Set();
let isReady = false;
let rendering = Promise.resolve();
function prepare(root) {
  const targets = [];
  if (root.matches && root.matches('[data-tex]:not([data-math-ready])')) targets.push(root);
  root.querySelectorAll?.('[data-tex]:not([data-math-ready])').forEach(node=>targets.push(node));
  for (const el of targets) {
    const tex=el.getAttribute('data-tex');
    if (!tex) continue;
    const display=escapeProof(el);
    el.textContent=(display?'\\[':'\\(')+tex+(display?'\\]':'\\)');
    el.dataset.mathReady='true';
  }
}
function schedule(root) {
  if (!root || !isReady) return;
  pending.add(root);
  rendering = rendering.then(async()=>{
    if(!pending.size) return;
    const roots=[...pending]; pending.clear();
    for(const el of roots)prepare(el);
    // Drop internal references for nodes removed by dynamic article navigation.
    for(const el of roots)window.MathJax.typesetClear([el]);
    await window.MathJax.typesetPromise(roots);
  }).catch(error=>console.warn('[math] typesetting issue',error));
}
async function start() {
  for(const src of sources) {
    try { await scriptLoad(src); break; }
    catch(error) { console.warn('[math] CDN fallback attempted:', src); }
  }
  if(!window.MathJax?.typesetPromise) {
    document.documentElement.classList.add('math-fallback');
    console.warn('[math] MathJax unavailable; preserving plain-text and native MathML fallbacks.');
    return;
  }
  try { await window.MathJax.startup.promise; }
  catch(error) {
    document.documentElement.classList.add('math-fallback');
    console.warn('[math] Startup failed; keeping original MathML and readable text.',error);
    return;
  }
  const targets = [document.body];
  for (const el of targets)prepare(el);
  isReady = true;
  schedule(document.body);
  for(const id of ['formula-detail','formula-grid','number-detail','number-grid']){
    const el=document.getElementById(id);
    if(!el) continue;
    const observer=new MutationObserver(changes=>{
      if(changes.some(change=>[...change.addedNodes].some(node=>
        node.nodeType===1 && !node.closest?.('mjx-container')
        && node.tagName?.toLowerCase()!=='mjx-container'
        && !node.classList?.contains('MJX_Assistive_MathML')
      ))) schedule(el);
    });
    observer.observe(el,{childList:true,subtree:false});
  }
  document.addEventListener('haoyi:math-update',event=>schedule(event.detail?.root||document.body));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{void start()},{once:true});
else void start();
