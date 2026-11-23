import assert from 'node:assert/strict';
import {formulas, formulaGroups} from '../js/formulas-data.mjs';
import {renderSequence} from '../js/formulas-sequence.mjs';

const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const equations = (entries=[]) => entries.map(entry => `<figure aria-label="${escape(entry.text)}">${entry.math}<figcaption>${escape(entry.label)}</figcaption></figure>`).join('');
const paragraphs = entries => entries.map(text => `<p>${escape(text)}</p>`).join('');
const item = formulas.find(item => item.id === 'thin-airfoil');
assert.ok(item, 'Existing bookmarked topic must still resolve');
const html = renderSequence(item, formulaGroups.find(group => group.id === item.group), {escape,equations,paragraphs});
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'No duplicate heading IDs');
const jumps = [...html.matchAll(/data-jump="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(jumps, ['thin-perturbations','thin-sources','thin-vortices','thin-tangency','thin-pressure']);
for (const id of jumps) assert.ok(ids.includes(id), `Jump target ${id} exists`);
assert.equal((html.match(/<details class="formula-subcard"/g)||[]).length, 5);
assert.equal((html.match(/<details[^>]*\bopen\b/g)||[]).length, 1, 'Only the first step starts expanded');
assert.doesNotMatch(html, /undefined|\[object Object\]/);
const main = html.slice(0, html.indexOf('class="formula-supplement"'));
assert.doesNotMatch(main, /Kutta|薄平板|2πα/, 'Later results must not interrupt the main sequence');
assert.match(html, /后续补充：Kutta 条件、升力与薄平板/);
const entries = [...item.cards.flatMap(card=>card.blocks),...item.supplement];
for (const block of entries) for (const equation of block.equations || []) {
  assert.ok(equation.text && equation.label);
  assert.match(equation.math, /^<math\b/);
  assert.doesNotMatch(equation.math, /undefined|NaN/);
}
console.log('PASS formula sequence: five ordered cards, valid jump targets, initial disclosure, MathML payloads and deferred supplements');
