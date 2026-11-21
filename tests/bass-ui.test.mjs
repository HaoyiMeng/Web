import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// A dependency-free DOM boundary for user interaction tests; no layout claims.
const elements = new Map();
const exampleButtons = [];
const documentListeners = new Map();
class Element {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.disabled = false;
    this.tabIndex = 0;
    this._text = '';
    this._value = undefined;
  }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set value(value) { this._value = String(value); }
  get value() { return this._value ?? this.children[0]?.value ?? this._text; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; this._text = ''; this._value = undefined; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  addEventListener(name, handler) {
    if (!this.listeners.has(name)) this.listeners.set(name, []);
    this.listeners.get(name).push(handler);
  }
  async fire(name, fields = {}) {
    const event = { target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...fields };
    for (const handler of this.listeners.get(name) ?? []) await handler(event);
    return event;
  }
  focus() { document.activeElement = this; void this.fire('focus'); }
  click() { return this.disabled ? Promise.resolve() : this.fire('click'); }
}
const html = readFileSync(new URL('../bass.html', import.meta.url), 'utf8');
for (const match of html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
  elements.set(match[2], new Element(match[1]));
}
for (const match of html.matchAll(/data-example="([^"]+)"/g)) {
  const element = new Element('button'); element.dataset.example = match[1]; exampleButtons.push(element);
}
const $ = id => elements.get(id);
globalThis.document = {
  hidden: false, activeElement: null,
  getElementById: $, createElement: tag => new Element(tag),
  querySelectorAll: selector => selector === '[data-example]' ? exampleButtons : [],
  addEventListener: (name, callback) => documentListeners.set(name, callback),
  removeEventListener: name => documentListeners.delete(name),
};
globalThis.window = { addEventListener() {}, removeEventListener() {} };
$('scale-select').value = 'major';
$('note-preference').value = 'sharp';
await import('../js/bass-ui.mjs');
const notes = $('fretboard').children.flatMap(cell => cell.children).filter(child => child.tagName === 'BUTTON');
const at = (row, fret) => notes.find(note => Number(note.dataset.string) === row && Number(note.dataset.fret) === fret);
const example = kind => exampleButtons.find(button => button.dataset.example === kind).click();
assert.equal(notes.length, 52);
assert.match(at(3, 0).getAttribute('aria-label'), /E1/);
assert.match(at(0, 0).getAttribute('aria-label'), /G2/);
assert.equal($('sound-toggle').disabled, true, 'Unavailable audio must not block interval interaction');
assert.equal($('sound-toggle').getAttribute('aria-checked'), 'false');

// C2 on A string, E2 on D string; retain the focused button during updates.
at(2, 3).focus();
await at(2, 3).click();
assert.equal(document.activeElement, at(2, 3));
assert.equal($('spelling-1').value, 'C2');
await at(1, 2).click();
assert.equal($('interval-name').textContent, '大三度');
assert.equal($('interval-distance').textContent, '4');
assert.equal($('interval-direction').textContent, '上行');
assert.equal(at(2, 3).getAttribute('aria-pressed'), 'true');
assert.equal(at(1, 2).getAttribute('aria-pressed'), 'true');
await $('swap-notes').click();
assert.equal($('interval-name').textContent, '大三度');
assert.equal($('interval-direction').textContent, '下行');

// A third click starts another pair, with the old positions unselected.
await at(3, 0).click();
assert.equal($('spelling-1').value, 'E1');
assert.equal($('spelling-2').disabled, true);
assert.equal(at(2, 3).getAttribute('aria-pressed'), 'false');
await at(3, 0).click();
assert.equal($('interval-name').textContent, '纯一度');
assert.match(at(3, 0).textContent, /1·2/);
await $('clear-notes').click();
await at(3, 0).click(); await at(1, 2).click();
assert.equal($('interval-name').textContent, '纯八度');
assert.equal($('interval-distance').textContent, '12');

await example('enharmonic');
assert.equal($('interval-name').textContent, '增二度');
$('spelling-2').value = 'E♭2';
await $('spelling-2').fire('change');
assert.equal($('interval-name').textContent, '小三度');
assert.equal($('interval-distance').textContent, '3');
assert.equal($('spelling-2').value, 'E♭2');
await example('augmented');
assert.equal($('interval-name').textContent, '增三度');
assert.equal($('interval-distance').textContent, '5');
await example('diminished');
assert.equal($('interval-name').textContent, '减三度');
assert.equal($('interval-distance').textContent, '2');
assert.match($('interval-explanation').textContent, /字母/);

// Roving focus includes boundaries and survives root/preference changes.
at(0, 0).focus();
const event = await at(0, 0).fire('keydown', { key: 'ArrowDown' });
assert.equal(event.defaultPrevented, true);
assert.equal(document.activeElement, at(1, 0));
assert.equal(notes.filter(note => note.tabIndex === 0).length, 1);
await at(1, 0).fire('keydown', { key: 'End' });
assert.equal(document.activeElement, at(1, 12));
$('root-select').value = '2'; await $('root-select').fire('change');
assert.equal(document.activeElement, at(1, 12));
assert.equal($('interval-name').textContent, '减三度', 'Scale highlighter must not rewrite the selected interval');
assert.equal($('spelling-2').value, 'E♭♭2');
assert.match($('interval-announcement').textContent, /减三度/);
console.log('✓ Bass UI selection, enharmonic edits, examples, direction, restart and keyboard focus.');
