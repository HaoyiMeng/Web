import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pages=['formulas.html','numbers.html','glauert.html','perturbation.html','conformal.html','potential-flow.html','nozzle.html','bass.html'];
const counts={};
for(const page of pages){
  const html=read(page);
  assert.match(html,/assets\/math-standards\.css/,'shared CSS absent from '+page);
  assert.match(html,/js\/math-typeset\.mjs/,'renderer missing in '+page);
  const tex=[...html.matchAll(/data-tex="([^"]+)"/g)];
  counts[page]=tex.length;
  for(const match of tex){
    const value=match[1].replaceAll('&amp;','&').replaceAll('&quot;','"');
    assert.ok(value.trim().length,'blank expression in '+page);
    assert.doesNotMatch(value,/[\x00-\x08\x0b\x0c\x0e-\x1f]/,'control character in TeX');
    let balance=0;
    for(const c of value){ if(c==='{')balance++; if(c==='}')balance--; assert.ok(balance>=0,'negative TeX brace balance in '+page); }
    assert.equal(balance,0,'unmatched braces in '+page+': '+value);
  }
}
assert.ok(counts['glauert.html']>=45,'Glauert derivation should use TeX consistently');
assert.ok(counts['perturbation.html']>=20,'Small perturbation formulas should use TeX');
assert.ok(counts['conformal.html']>=10,'Conformal mapping formulas should use TeX');
assert.ok(counts['potential-flow.html']>=10,'Potential flow formulas should use TeX');
const renderer=read('js/math-typeset.mjs');
assert.match(renderer,/tex-mml-chtml\.js/,'MathML+TeX support is required');
assert.match(renderer,/typesetPromise/,'dynamic equations must be typeset');
assert.match(renderer,/MutationObserver/,'dynamically rendered articles must be observed');
assert.match(renderer,/typesetClear/,'removed article equations must be cleared');
const formulasUI=read('js/formulas-ui.mjs');
const numbersUI=read('js/numbers-ui.mjs');
assert.match(formulasUI,/mathSymbol\(item\.symbol\)/);
assert.match(numbersUI,/mathSymbol\(item\.symbol\)/);
assert.match(formulasUI,/typesetClear/);
assert.match(numbersUI,/typesetClear/);
const formulaMath=read('js/formula-math.mjs');
const numbersData=read('js/numbers-data.mjs');
assert.match(formulaMath,/<math xmlns=/,'legacy semantic MathML should remain accessible');
assert.match(numbersData,/mathvariant="normal"/,'dimensionless symbols should be upright');
const guide=read('docs/MATH_STYLE_GUIDE.md');
assert.match(guide,/LaTeX/);
assert.match(guide,/MathML/);
console.log('PASS unified TeX, MathML, rendering, fallbacks and notation; per-page TeX counts',counts);
