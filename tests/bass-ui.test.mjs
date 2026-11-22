import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// A dependency-free DOM boundary for user interaction tests; no layout claims.
const elements = new Map();
const exampleButtons = [];
const modeInputs = [];
const documentListeners = new Map();
class Element {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.disabled = false;
    this.hidden = false;
    this.checked = false;
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
    const event = { target: this, defaultPrevented: false, composedPath() { return [this.target]; }, preventDefault() { this.defaultPrevented = true; }, ...fields };
    for (const handler of this.listeners.get(name) ?? []) await handler(event);
    return event;
  }
  focus() { document.activeElement = this; void this.fire('focus'); }
  click() { return this.disabled ? Promise.resolve() : this.fire('click'); }
}
const html = readFileSync(new URL('../bass.html', import.meta.url), 'utf8');
function resetElements() {
elements.clear(); exampleButtons.length = 0; modeInputs.length = 0;
for (const match of html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\bid="([^"]+)"[^>]*>/g)) {
  const element = new Element(match[1]);
  element.hidden = /\shidden(?:\s|>)/.test(match[0]);
  element.disabled = /\sdisabled(?:\s|>)/.test(match[0]);
  const value = match[0].match(/\bvalue="([^"]+)"/);
  if (value) element.value = value[1];
  elements.set(match[2], element);
}
for (const match of html.matchAll(/<input\b[^>]*\bname="fret-mode"[^>]*>/g)) {
  const element = new Element('input');
  element.value = match[0].match(/\bvalue="([^"]+)"/)[1];
  element.checked = /\schecked(?:\s|\/?>)/.test(match[0]);
  modeInputs.push(element);
}
for (const match of html.matchAll(/data-example="([^"]+)"/g)) {
  const element = new Element('button'); element.dataset.example = match[1]; exampleButtons.push(element);
}
}
resetElements();
const $ = id => elements.get(id);
globalThis.document = {
  hidden: false, activeElement: null,
  getElementById: $, createElement: tag => new Element(tag),
  querySelectorAll: selector => selector === '[data-example]' ? exampleButtons : selector === '[name="fret-mode"]' ? modeInputs : [],
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
const mode = async value => {
  for (const input of modeInputs) input.checked = input.value === value;
  await modeInputs.find(input => input.value === value).fire('change');
};
assert.equal(notes.length, 52);
assert.match(at(3, 0).getAttribute('aria-label'), /E1/);
assert.match(at(0, 0).getAttribute('aria-label'), /G2/);
assert.equal($('sound-toggle').disabled, true, 'Unavailable audio must not block interval interaction');
assert.equal($('sound-toggle').getAttribute('aria-checked'), 'false');

// Single mode is the initial experience and always replaces its current note.
assert.equal($('single-panel').hidden, false);
assert.equal($('interval-panel').hidden, true);
assert.equal($('chord-panel').hidden, true);
await at(3, 0).click();
assert.equal($('single-name').textContent, 'E1');
assert.ok(Math.abs(parseFloat($('single-frequency').textContent) - 41.2034) < 0.1);
await at(0, 0).click();
assert.equal($('single-name').textContent, 'G2');
assert.equal(at(3, 0).getAttribute('aria-pressed'), 'false');
assert.equal(at(0, 0).getAttribute('aria-pressed'), 'true');
$('bass-volume').value = '95'; await $('bass-volume').fire('input');
assert.equal($('volume-value').textContent, '95%');
await mode('interval');
assert.equal($('single-panel').hidden, true);
assert.equal($('interval-panel').hidden, false);
assert.equal(at(0, 0).getAttribute('aria-pressed'), 'false');

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

// Chord mode clears the interval pair and marks chord degrees across octaves.
const hasClass = (element, name) => element.className?.split(/\s+/).includes(name);
const chordType = async value => { $('chord-type').value = value; await $('chord-type').fire('change'); };
await mode('chord');
assert.equal($('chord-panel').hidden, false);
assert.equal($('interval-panel').hidden, true);
assert.equal($('interval-learning').hidden, true);
assert.equal(notes.some(note => hasClass(note, 'is-first') || hasClass(note, 'is-second')), false);
assert.equal($('play-chord').disabled, true, 'Chord playback must be unavailable while muted');
await at(2, 3).click();
assert.match($('chord-tones').textContent, /C2/);
assert.match($('chord-tones').textContent, /E2/);
assert.match($('chord-tones').textContent, /G2/);
assert.equal(hasClass(at(2, 3), 'tone-root'), true);
assert.equal(hasClass(at(1, 2), 'tone-third'), true);
assert.equal(hasClass(at(0, 0), 'tone-fifth'), true);
assert.equal(hasClass(at(3, 0), 'tone-third'), true, 'E1 is also a C major chord tone');
assert.equal($('play-chord').disabled, true);

await chordType('minor');
assert.match($('chord-tones').textContent, /E♭2/);
assert.equal(hasClass(at(1, 2), 'chord-tone'), false);
assert.equal(hasClass(at(1, 1), 'tone-third'), true);
assert.match(at(1, 1).textContent, /♭3/);
await chordType('major7');
assert.equal($('chord-tones').children.length, 4);
assert.match($('chord-tones').textContent, /B2/);
assert.equal(hasClass(at(0, 4), 'tone-extension'), true);
await chordType('dominant9');
assert.equal($('chord-tones').children.length, 5);
assert.match($('chord-tones').textContent, /B♭2/);
assert.match($('chord-tones').textContent, /D3/);
assert.equal(hasClass(at(1, 0), 'tone-extension'), true);
assert.match(at(1, 0).textContent, /9/, 'Ninth degree keeps its compound label even in a lower octave');

// Re-spelling the root preserves pitch but spells the chord from its letters.
await chordType('major');
$('chord-root-spelling').value = 'B♯1'; await $('chord-root-spelling').fire('change');
assert.match($('chord-tones').textContent, /B♯1/);
assert.match($('chord-tones').textContent, /D♯♯2/);
assert.match($('chord-tones').textContent, /F♯♯2/);
assert.equal(hasClass(at(1, 2), 'tone-third'), true);
$('note-preference').value = 'flat'; await $('note-preference').fire('change');
await at(2, 4).click();
assert.equal($('chord-root-spelling').value, 'D♭2');
assert.match($('chord-tones').textContent, /F2/);
assert.match($('chord-tones').textContent, /A♭2/);
assert.equal(hasClass(at(2, 3), 'is-first'), false);
assert.equal(hasClass(at(2, 4), 'is-first'), true);
assert.equal(hasClass(at(1, 2), 'chord-tone'), false, 'Old C major chord markers must be removed');

await mode('single');
assert.equal($('chord-panel').hidden, true);
assert.equal($('single-panel').hidden, false);
assert.equal(notes.some(note => hasClass(note, 'chord-tone') || hasClass(note, 'is-first') || hasClass(note, 'is-second')), false);
await at(3, 0).click();
assert.equal($('single-name').textContent, 'E1');
await mode('interval');
assert.equal($('spelling-1').disabled, true);
assert.equal($('spelling-2').disabled, true);
assert.equal(notes.some(note => hasClass(note, 'is-first')), false);

// Default spelling changes reset the active experiment in every mode.
const preference = async value => { $('note-preference').value = value; await $('note-preference').fire('change'); };
const assertCleared = (currentMode, noteButtons) => {
  assert.equal(noteButtons.some(note => note.getAttribute('aria-pressed') === 'true'), false);
  assert.equal(noteButtons.some(note => hasClass(note, 'is-first') || hasClass(note, 'is-second') || hasClass(note, 'chord-tone')), false);
  assert.equal($('note-readout').textContent, currentMode === 'chord' ? '等待选择根音' : '等待选音');
  if (currentMode === 'interval') {
    assert.equal($('spelling-1').disabled, true); assert.equal($('spelling-2').disabled, true);
    assert.equal($('interval-name').textContent, '先选第一个音');
    for (const id of ['interval-symbol', 'interval-distance', 'interval-direction']) assert.equal($(id).textContent, '—');
    assert.equal($('play-pair').disabled, true); assert.equal($('clear-notes').disabled, true);
  } else if (currentMode === 'single') {
    assert.equal($('single-name').textContent, '点击任一音');
    assert.equal($('single-frequency').textContent, '—');
  } else {
    assert.equal($('chord-name').textContent, '先选一个根音');
    assert.equal($('chord-root-spelling').disabled, true);
    assert.equal($('chord-tones').children.length, 0); assert.equal($('play-chord').disabled, true);
  }
};
const selectedName = currentMode => currentMode === 'single' ? $('single-name').textContent : currentMode === 'interval' ? $('spelling-1').value : $('chord-root-spelling').value;
for (const currentMode of ['single', 'interval', 'chord']) {
  await mode(currentMode); await preference('sharp');
  await at(2, 4).click();
  if (currentMode === 'interval') await at(1, 1).click();
  assert.equal(selectedName(currentMode), 'C♯2');
  await preference('flat'); assertCleared(currentMode, notes);
  await at(2, 4).click();
  if (currentMode === 'interval') await at(1, 1).click();
  assert.equal(selectedName(currentMode), 'D♭2', 'A fresh click must use the new flat preference');
  await preference('sharp'); assertCleared(currentMode, notes);
  await at(2, 4).click();
  assert.equal(selectedName(currentMode), 'C♯2');
  // Other controls do not dismiss a selection.
  $('bass-volume').value = '73'; await $('bass-volume').fire('input');
  $('root-select').value = '5'; await $('root-select').fire('change');
  $('scale-select').value = 'minor'; await $('scale-select').fire('change');
  assert.equal(selectedName(currentMode), 'C♯2');
}

// A blank scroller click resets; a note click (including detached badges) does not.
const scrollClick = path => $('fret-scroll').fire('click', { target: path[0], composedPath: () => path });
for (const currentMode of ['single', 'interval', 'chord']) {
  await mode(currentMode);
  const note = at(2, 4), detachedBadge = new Element('span');
  await note.click();
  await scrollClick([detachedBadge, note, $('fretboard'), $('fret-scroll')]);
  assert.equal(selectedName(currentMode), 'C♯2', 'A note badge keeps its captured note-button event path after repaint');
  await scrollClick([note, $('fretboard'), $('fret-scroll')]);
  assert.equal(selectedName(currentMode), 'C♯2', 'The bubbling note click must not clear its own selection');
  for (const blankTarget of [$('fretboard'), $('fretboard').children.find(child => hasClass(child, 'fret-cell')), $('fretboard').children.find(child => hasClass(child, 'string-label'))]) {
    await scrollClick([blankTarget, $('fretboard'), $('fret-scroll')]);
    assertCleared(currentMode, notes);
    await note.click();
  }
  await scrollClick([$('fret-caption').children[2], $('fret-caption'), $('fret-scroll')]);
  assertCleared(currentMode, notes);
  await note.click();
  const escape = await $('fret-scroll').fire('keydown', { key: 'Escape', composedPath: () => [note, $('fret-scroll')] });
  assert.equal(escape.defaultPrevented, true);
  assertCleared(currentMode, notes);
  await note.click();
  await $('note-preference').fire('keydown', { key: 'Escape' });
  assert.equal(selectedName(currentMode), 'C♯2', 'Escape in an external native control must not clear notes');
}

// A supported-audio fixture exercises the UI/audio boundary, including mode changes.
class AudioParam {
  value = 0;
  setValueAtTime(value) { this.value = value; }
  setTargetAtTime(value) { this.value = value; }
  linearRampToValueAtTime() {}
  exponentialRampToValueAtTime() {}
  cancelScheduledValues() {}
}
class AudioNode {
  constructor() {
    for (const key of ['gain', 'frequency', 'Q', 'threshold', 'knee', 'ratio', 'attack', 'release']) this[key] = new AudioParam();
    this.starts = []; this.stops = [];
  }
  connect(node) { return node; }
  disconnect() { this.disconnected = true; }
  start(at) { this.starts.push(at); }
  stop(at) { this.stops.push(at); }
}
class AudioContext {
  static instances = [];
  constructor() {
    this.state = 'running'; this.currentTime = 0; this.destination = {}; this.oscillators = [];
    AudioContext.instances.push(this);
  }
  createGain() { return new AudioNode(); }
  createBiquadFilter() { return new AudioNode(); }
  createDynamicsCompressor() { return new AudioNode(); }
  createOscillator() { const node = new AudioNode(); this.oscillators.push(node); return node; }
}
resetElements();
$('scale-select').value = 'major'; $('note-preference').value = 'sharp';
window.AudioContext = AudioContext;
await import('../js/bass-ui.mjs?supported-audio-test');
const supportedNotes = $('fretboard').children.flatMap(cell => cell.children).filter(child => child.tagName === 'BUTTON');
const supportedAt = (row, fret) => supportedNotes.find(note => Number(note.dataset.string) === row && Number(note.dataset.fret) === fret);
assert.equal(AudioContext.instances.length, 0, 'Volume initialization must not create audio before the sound gesture');
await mode('chord'); await supportedAt(2, 3).click();
assert.equal($('chord-type').children.length, 17);
assert.equal($('play-chord').disabled, true);
assert.equal(AudioContext.instances.length, 0);
await $('sound-toggle').click();
assert.equal($('sound-toggle').getAttribute('aria-checked'), 'true');
assert.equal($('play-chord').disabled, false);
await $('play-chord').click();
const context = AudioContext.instances[0];
assert.equal(context.oscillators.length, 9, 'Three chord tones each contain three oscillator components');
assert.equal(new Set(context.oscillators.map(node => node.starts[0])).size, 1, 'Chord playback must start every tone together');

// Every offered chord type remains selected-root based, without scale leakage.
for (const option of $('chord-type').children) {
  await chordType(option.value);
  assert.ok($('chord-tones').children.length >= 3 && $('chord-tones').children.length <= 5);
  assert.equal(supportedNotes.some(note => hasClass(note, 'in-scale') || hasClass(note, 'root')), false);
  assert.equal(supportedNotes.filter(note => hasClass(note, 'is-first')).length, 1);
  assert.equal(hasClass(supportedAt(0, 5), 'tone-root'), true, 'The octave root is highlighted');
  assert.equal(hasClass(supportedAt(0, 5), 'is-first'), false, 'The octave root is not the clicked root position');
}
await chordType('major'); await $('play-chord').click();
await mode('single');
assert.equal($('play-chord').disabled, true);
assert.ok(context.oscillators.every(node => node.disconnected && node.stops.at(-1) === 0), 'Changing mode cancels every currently sounding chord voice');
assert.equal(supportedNotes.some(note => hasClass(note, 'chord-tone')), false);
await supportedAt(3, 0).click();
assert.equal($('single-name').textContent, 'E1');
assert.ok(Math.abs(context.oscillators.at(-1).frequency.value - 41.2034) < 0.1);

await mode('interval'); await supportedAt(2, 3).click(); await supportedAt(1, 2).click();
await $('play-pair').click();
const pairNodes = context.oscillators.slice(-6);
assert.deepEqual([...new Set(pairNodes.map(node => node.starts[0]))], [0, 0.65]);
await $('sound-toggle').click();
assert.equal($('sound-toggle').getAttribute('aria-checked'), 'false');
assert.equal($('play-pair').disabled, true);
assert.ok(pairNodes.every(node => node.disconnected && node.stops.at(-1) === 0), 'Sound off cancels both the current and delayed second note');
const beforeMutedClick = context.oscillators.length;
await supportedAt(3, 0).click();
assert.equal(context.oscillators.length, beforeMutedClick, 'Muted notes must not create new voices');
assert.equal($('spelling-1').value, 'E1', 'Muted selection still works');

// Preference reset cancels a playing/scheduled pair without turning the sound switch off.
await $('sound-toggle').click(); await preference('sharp');
await supportedAt(2, 4).click(); await supportedAt(1, 1).click(); await $('play-pair').click();
const preferencePair = context.oscillators.slice(-6);
assert.deepEqual([...new Set(preferencePair.map(node => node.starts[0]))], [0, 0.65]);
const beforePreferenceReset = context.oscillators.length;
await preference('flat'); assertCleared('interval', supportedNotes);
assert.ok(preferencePair.every(node => node.disconnected && node.stops.at(-1) === 0), 'Changing default spelling cancels the delayed second note too');
assert.equal($('sound-toggle').getAttribute('aria-checked'), 'true');
assert.equal(context.oscillators.length, beforePreferenceReset, 'The reset itself creates no new voices');
await supportedAt(2, 4).click();
assert.equal($('spelling-1').value, 'D♭2');
assert.equal(context.oscillators.length, beforePreferenceReset + 3, 'A fresh flat-spelled note still plays normally');

// Blank area and Escape cancel sound consistently in all three modes.
for (const currentMode of ['single', 'interval', 'chord']) {
  await mode(currentMode); await supportedAt(2, 3).click();
  if (currentMode === 'interval') { await supportedAt(1, 2).click(); await $('play-pair').click(); }
  if (currentMode === 'chord') await $('play-chord').click();
  await scrollClick([$('fret-scroll')]); assertCleared(currentMode, supportedNotes);
  assert.ok(context.oscillators.every(node => node.disconnected && node.stops.at(-1) === 0), 'Blank area clears sounding and future voices');
  assert.equal($('sound-toggle').getAttribute('aria-checked'), 'true');
  await supportedAt(2, 3).click();
  await $('fret-scroll').fire('keydown', { key: 'Escape' });
  assertCleared(currentMode, supportedNotes);
  assert.ok(context.oscillators.every(node => node.disconnected && node.stops.at(-1) === 0), 'Escape stops sound as well as clearing markers');
}
console.log('✓ Bass UI modes/chords, spelling resets, blank/Escape dismissal, controls, focus and scheduled audio cancellation.');
