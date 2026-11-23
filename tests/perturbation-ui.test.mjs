import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Build the test DOM from the live standalone page, including actual defaults,
// data attributes and parent cards. Missing selectors must fail, not invent nodes.
const nodes = new Map(), elements = [];
let focused = null;
class Element {
  constructor(tag = 'div', parent = null) {
    this.tagName = tag;
    this.parentElement = parent;
    this.children = [];
    this.attrs = {};
    this.events = new Map();
    this.textContent = '';
    this.dataset = {};
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.hidden = false;
    this.tabIndex = 0;
    this.classList = {
      contains: name => (this.attrs.class || '').split(/\s+/).includes(name),
      toggle: (name, force) => {
        const classes = new Set((this.attrs.class || '').split(/\s+/).filter(Boolean));
        const include = force ?? !classes.has(name);
        if (include) classes.add(name); else classes.delete(name);
        this.attrs.class = [...classes].join(' ');
        return include;
      },
    };
  }
  setAttribute(name, value) {
    this.attrs[name] = String(value);
    if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value);
  }
  getAttribute(name) { return this.attrs[name] ?? null; }
  append(child) { child.parentElement = this; this.children.push(child); }
  replaceChildren(...children) { this.children = []; children.forEach(child => this.append(child)); }
  matches(selector) {
    if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
    if (/^\[[\w-]+\]$/.test(selector)) return Object.hasOwn(this.attrs, selector.slice(1, -1));
    throw new Error(`Unsupported test selector: ${selector}`);
  }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
  addEventListener(type, listener) {
    if (!this.events.has(type)) this.events.set(type, []);
    this.events.get(type).push(listener);
  }
  fire(type, details = {}) {
    assert.ok(this.events.has(type), `No ${type} listener on ${this.attrs.id || this.tagName}`);
    const event = {target:this, defaultPrevented:false, preventDefault(){this.defaultPrevented = true;}, ...details};
    this.events.get(type).forEach(listener => listener(event));
    return event;
  }
  focus() { focused = this; }
}
const html = readFileSync(new URL('../perturbation.html', import.meta.url), 'utf8');
assert.match(html, /src="\.\/js\/perturbation-ui\.mjs(?:\?[^"]*)?"/);
const stack = [], voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
for (const match of html.matchAll(/<(\/?)([a-z][\w:-]*)\b([^>]*)>/gi)) {
  const [, closing, tag, attributes] = match;
  if (closing) { if (stack.at(-1)?.tagName === tag) stack.pop(); continue; }
  const node = new Element(tag, stack.at(-1));
  for (const attribute of attributes.matchAll(/([^\s=/'"<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    node.setAttribute(attribute[1], attribute[2] ?? attribute[3] ?? attribute[4] ?? '');
  }
  node.value = node.attrs.value || '';
  for (const key of ['checked','disabled','hidden']) node[key] = Object.hasOwn(node.attrs, key);
  if (node.attrs.id) { assert.ok(!nodes.has(node.attrs.id), `Duplicate ID ${node.attrs.id}`); nodes.set(node.attrs.id, node); }
  node.parentElement?.append(node);
  elements.push(node);
  if (!voidTags.has(tag) && !attributes.endsWith('/')) stack.push(node);
}
const $ = id => { assert.ok(nodes.has(id), `Missing live-page element: ${id}`); return nodes.get(id); };
globalThis.document = {
  getElementById:$,
  querySelectorAll:selector => elements.filter(node => node.matches(selector)),
  createElementNS:(_ns, tag) => new Element(tag),
};
await import('../js/perturbation-ui.mjs');

const presets = document.querySelectorAll('[data-p-case]');
const tabs = document.querySelectorAll('[data-p-view]');
assert.equal(presets.length, 4);
assert.equal(tabs.length, 3);
const preset = name => presets.find(node => node.dataset.pCase === name).fire('click');
const input = (id, value) => { $(id).value = String(value); $(id).fire('input'); };
const toggle = (id, checked) => { $(id).checked = checked; $(id).fire('change'); };
const number = id => Number($(id).textContent);
const paths = id => $(id).children.filter(node => node.tagName === 'path');
const references = id => paths(id).filter(node => node.attrs.stroke === '#8596a5').map(node => node.attrs.d);
const ticks = id => $(id).children.filter(node => node.tagName === 'text' && node.attrs.x === '5').map(node => node.textContent);
function finiteOutput() {
  for (const id of ['p-pressure','p-shape','p-sheets']) {
    assert.ok($(id).children.length > 3, `${id} was not rendered`);
    for (const node of $(id).children) assert.doesNotMatch(Object.values(node.attrs).join(' '), /NaN|Infinity|undefined/);
  }
  for (const id of ['p-cp-upper','p-cp-lower','p-cl','p-cl-delta','p-ratio','p-error']) assert.ok(Number.isFinite(number(id)), id);
}
finiteOutput();
assert.ok(Math.abs(number('p-cl') - 2*Math.PI*(3*Math.PI/180 + .04)) < .0005);
for (const id of ['p-incidence','p-bending','p-body']) toggle(id, false);
for (const id of ['p-cp-upper','p-cp-lower','p-cl']) assert.equal(number(id), 0);
for (const id of ['p-alpha','p-camber','p-thickness']) {
  assert.equal($(id).disabled, true);
  assert.ok($(id).closest('.p-param-card').classList.contains('p-inactive'));
}
console.log('PASS perturbation UI: live-page startup, physical readouts and disabled contributions');

for (const name of ['alpha','camber','thickness','all']) {
  preset(name);
  for (const [id, enabledCase] of [['p-incidence','alpha'],['p-bending','camber'],['p-body','thickness']]) assert.equal($(id).checked, name === enabledCase || name === 'all');
  for (const button of presets) assert.equal(button.getAttribute('aria-pressed'), String(button.dataset.pCase === name));
  if (name === 'thickness') {
    assert.equal(number('p-cl'), 0);
    assert.equal(number('p-cp-upper'), number('p-cp-lower'));
  } else assert.ok(number('p-cl') > 0);
  finiteOutput();
}
input('p-alpha', 4);
assert.ok(presets.every(button => button.getAttribute('aria-pressed') === 'false'));
console.log('PASS perturbation UI: four presets, active state and custom parameters');

function selectedTab(index) {
  for (const [i, tab] of tabs.entries()) {
    assert.equal(tab.getAttribute('aria-selected'), String(i === index));
    assert.equal(tab.tabIndex, i === index ? 0 : -1);
    assert.equal($(tab.getAttribute('aria-controls')).hidden, i !== index);
  }
}
selectedTab(0);
tabs[1].fire('click'); selectedTab(1);
for (const [from, key, to] of [[1,'ArrowRight',2],[2,'ArrowRight',0],[0,'ArrowLeft',2],[2,'Home',0],[0,'End',2]]) {
  assert.equal(tabs[from].fire('keydown', {key}).defaultPrevented, true);
  selectedTab(to);
  assert.equal(focused, tabs[to]);
}
assert.equal(tabs[2].fire('keydown', {key:'Tab'}).defaultPrevented, false);
console.log('PASS perturbation UI: chart tabs, keyboard navigation and focus');

$('p-reset').fire('click');
input('p-alpha', 10);
input('p-camber', 5);
$('p-save-baseline').fire('click');
const savedPressure = references('p-pressure');
const savedShape = references('p-shape');
const savedLift = number('p-cl');
assert.equal(number('p-cl-delta'), 0);
assert.match($('p-baseline-status').textContent, /手动保存/);
input('p-alpha', 0); input('p-camber', 0);
assert.ok(Math.abs(number('p-cl-delta') + savedLift) < .001);
assert.deepEqual(references('p-pressure'), savedPressure);
assert.deepEqual(references('p-shape'), savedShape);
const delta = $('p-cl-delta').textContent;
input('p-x', .8);
assert.equal($('p-cl-delta').textContent, delta);
console.log('PASS perturbation UI: saved reference is stable while current parameters and probe move');

// Save a zero reference, expand the scale, then reduce the response.
for (const id of ['p-incidence','p-bending','p-body']) toggle(id, false);
$('p-save-baseline').fire('click');
preset('alpha'); input('p-alpha', 10);
const expandedTicks = ticks('p-pressure');
input('p-alpha', 1);
assert.deepEqual(ticks('p-pressure'), expandedTicks);
toggle('p-keep-scale', false);
assert.notDeepEqual(ticks('p-pressure'), expandedTicks);
toggle('p-keep-scale', true);
const pressurePathCount = paths('p-pressure').length;
toggle('p-quadratic', false);
assert.equal(paths('p-pressure').length, pressurePathCount - 2);
toggle('p-quadratic', true);
assert.equal(paths('p-pressure').length, pressurePathCount);
console.log('PASS perturbation UI: locked and automatic axes, optional quadratic overlay');

preset('all');
for (const alpha of [-10, 10]) for (const position of [.01, .99]) {
  input('p-alpha', alpha); input('p-camber', alpha/2); input('p-thickness', 12); input('p-x', position);
  finiteOutput();
}
input('p-x', .01);
assert.match($('p-validity').textContent, /超过 0.2/);
$('p-reset').fire('click');
for (const [id, expected] of [['p-alpha',3],['p-camber',2],['p-thickness',6],['p-x',.4]]) assert.equal(Number($(id).value), expected);
assert.equal(number('p-cl-delta'), 0);
assert.match($('p-baseline-status').textContent, /初始工况/);
finiteOutput();
console.log('PASS perturbation UI: endpoint probes, extremes, validity warning and full parameter/reference reset');
