import assert from 'node:assert/strict';
import { createBassAudio } from '../js/bass-audio.mjs';

class Param {
  constructor() { this.calls = []; this.value = 0; }
  setValueAtTime(...args) { this.calls.push(['set', ...args]); this.value = args[0]; }
  setTargetAtTime(...args) { this.calls.push(['target', ...args]); this.value = args[0]; }
  linearRampToValueAtTime(...args) { this.calls.push(['linear', ...args]); }
  exponentialRampToValueAtTime(...args) { this.calls.push(['exponential', ...args]); }
  cancelScheduledValues(...args) { this.calls.push(['cancel', ...args]); }
}
class AudioNode {
  constructor() {
    this.gain = new Param(); this.frequency = new Param(); this.Q = new Param();
    for (const key of ['threshold', 'knee', 'ratio', 'attack', 'release']) this[key] = new Param();
    this.starts = []; this.stops = []; this.disconnected = false;
  }
  connect(node) { this.connected = node; return node; }
  disconnect() { this.disconnected = true; }
  start(time) { this.starts.push(time); }
  stop(time) { this.stops.push(time); }
}
class FakeContext {
  static instances = [];
  static resumeHook = null;
  constructor() {
    FakeContext.instances.push(this);
    this.state = 'suspended'; this.currentTime = 12; this.destination = {};
    this.oscillators = []; this.nodes = []; this.compressors = [];
  }
  createGain() { const n = new AudioNode(); this.nodes.push(n); return n; }
  createBiquadFilter() { const n = new AudioNode(); this.nodes.push(n); return n; }
  createOscillator() { const n = new AudioNode(); this.nodes.push(n); this.oscillators.push(n); return n; }
  createDynamicsCompressor() { const n = new AudioNode(); this.nodes.push(n); this.compressors.push(n); return n; }
  async resume() {
    if (FakeContext.resumeHook) await FakeContext.resumeHook();
    this.state = 'running';
  }
  async close() { this.state = 'closed'; }
}

const page = new EventTarget();
page.hidden = false;
const host = new EventTarget();
host.AudioContext = FakeContext;
globalThis.window = host;
globalThis.document = page;

const audio = createBassAudio();
assert.equal(audio.supported, true);
assert.equal(FakeContext.instances.length, 0, 'Do not create audio before the user enables sound');
assert.equal(await audio.play(28), false);
assert.equal(await audio.playChord([28, 32, 35]), false);
assert.equal(audio.setVolume(0.7), 0.7);
assert.equal(audio.setVolume(NaN), 0.7);
assert.equal(audio.setVolume(2), 1);
assert.equal(audio.setVolume(-1), 0);
audio.setVolume(0.8);
assert.equal(FakeContext.instances.length, 0);
assert.equal(await audio.setEnabled(true), true);
const context = FakeContext.instances[0];
assert.equal(await audio.play(28), true);
assert.equal(context.oscillators.length, 3);
for (const oscillator of context.oscillators) {
  assert.ok(Math.abs(oscillator.frequency.calls[0][1] - 41.20344461410875) < 1e-9, 'E1 is the sounding bass pitch');
  assert.deepEqual(oscillator.starts, [12]);
}
assert.equal(await audio.play(55, 0.45), true);
assert.deepEqual(context.oscillators[3].starts, [12.45]);
assert.ok(Math.abs(context.oscillators[3].frequency.calls[0][1] - 195.99771799087463) < 1e-9);
const master = context.nodes.find(node => node.connected === context.destination);
assert.equal(master.gain.value, 0.8, 'Default volume is 80%, rather than the previous 40% output gain');
const envelope = context.nodes.find(node => node.gain.calls.some(call => call[0] === 'linear'));
assert.equal(envelope.gain.calls.find(call => call[0] === 'linear')[1], 0.82, 'New pluck attack is much stronger than the previous 0.34');
assert.equal(context.compressors.length, 1);
assert.equal(context.compressors[0].ratio.value, 4);
const frequencies = context.oscillators.map(node => structuredClone(node.frequency.calls));
audio.setVolume(0.25);
assert.equal(master.gain.value, 0.25, 'The slider changes already-created output gain');
assert.deepEqual(context.oscillators.map(node => node.frequency.calls), frequencies, 'Volume must not change note frequencies');
audio.setVolume(0);
assert.deepEqual(master.gain.calls.at(-1), ['set', 0, 12], 'Zero volume immediately silences the output');
audio.setVolume(0.8);
assert.equal(await audio.setEnabled(false), false);
for (const oscillator of context.oscillators) {
  assert.equal(oscillator.stops.at(-1), 12, 'Mute cancels scheduled as well as sounding voices');
  assert.equal(oscillator.disconnected, true);
}
assert.equal(await audio.play(40), false);

await audio.setEnabled(true);
const before = context.oscillators.length;
for (let i = 0; i < 7; i++) await audio.play(33);
assert.equal(context.oscillators[before].disconnected, true, 'The oldest voice is released at the voice limit');
audio.stop();
assert.ok(context.oscillators.every(node => node.disconnected));
await audio.play(38);
const finalVoice = context.oscillators.slice(-3);
finalVoice.forEach(oscillator => oscillator.onended());
assert.ok(finalVoice.every(node => node.disconnected), 'Natural note endings clean up their nodes');
assert.equal(await audio.play(NaN), false);
assert.equal(await audio.play(28, -1), false);

audio.stop();
const chord = Object.freeze([28, 32, 35, 38, 42]);
const chordBefore = context.oscillators.length;
assert.equal(await audio.playChord(chord), true);
const chordNodes = context.oscillators.slice(chordBefore);
assert.equal(chordNodes.length, 15);
assert.deepEqual([...new Set(chordNodes.map(node => node.starts[0]))], [12.008], 'Every chord tone has the same captured startTime');
for (let i = 0; i < chord.length; i++) {
  assert.ok(Math.abs(chordNodes[i * 3].frequency.calls[0][1] - 440 * 2 ** ((chord[i] - 69) / 12)) < 1e-9);
}
const normalizer = context.nodes.find(node => node.connected === context.compressors[0]);
assert.equal(normalizer.gain.value, 0.95 / 5, 'Five simultaneous notes keep conservative attack headroom');
assert.ok(normalizer.gain.value * 5 * 0.82 * master.gain.value < 0.7, 'Aligned full-volume wave peaks remain below clipping before compression');
const validChordCount = context.oscillators.length;
for (const invalid of [null, [], [28, NaN], [28, 33.5], [28, -1], [128], new Array(3), [28, 30, 32, 34, 36, 38]]) {
  assert.equal(await audio.playChord(invalid), false);
}
assert.equal(context.oscillators.length, validChordCount, 'Invalid chords create no partial voices');
await audio.setEnabled(false);
assert.ok(chordNodes.every(node => node.disconnected && node.stops.at(-1) === 12), 'Mute cancels all chord tones');
await audio.setEnabled(true);

await audio.play(38, 1);
page.hidden = true;
page.dispatchEvent(new Event('visibilitychange'));
assert.ok(context.oscillators.every(node => node.disconnected));
assert.equal(await audio.play(38), false, 'Hidden pages must not schedule new notes');
assert.equal(await audio.playChord([28, 32, 35]), false);
page.hidden = false;

// Cancelling notes during an enable gesture must not falsely turn the UI off.
let finishEnable;
FakeContext.resumeHook = () => new Promise(resolve => { finishEnable = resolve; });
context.state = 'suspended';
const enabling = audio.setEnabled(true);
audio.stop();
finishEnable();
assert.equal(await enabling, true, 'stop() preserves the pending sound-switch intent');
assert.equal(await audio.play(28), true, 'The returned enabled state agrees with playback gating');

// Only the latest explicit switch gesture wins, including on/off/on during resume.
let finishRapidResume;
FakeContext.resumeHook = () => new Promise(resolve => { finishRapidResume = resolve; });
context.state = 'suspended';
const firstEnable = audio.setEnabled(true);
assert.equal(await audio.setEnabled(false), false);
const lastEnable = audio.setEnabled(true);
finishRapidResume();
assert.equal(await firstEnable, false, 'An older enable request cannot replace the latest gesture');
assert.equal(await lastEnable, true);
assert.equal(await audio.play(33), true);
FakeContext.resumeHook = null;

// Turning sound off while resume awaits permission cannot emit a late note.
let finishResume;
FakeContext.resumeHook = () => new Promise(resolve => { finishResume = resolve; });
context.state = 'suspended';
const pendingClick = audio.play(40);
await audio.setEnabled(false);
finishResume();
assert.equal(await pendingClick, false);
FakeContext.resumeHook = null;

// Chord selection is copied before resume, and stopping pending playback cancels it.
await audio.setEnabled(true);
let finishChordResume;
FakeContext.resumeHook = () => new Promise(resolve => { finishChordResume = resolve; });
context.state = 'suspended';
const pendingNotes = [28, 32, 35];
const chordInFlight = audio.playChord(pendingNotes);
pendingNotes[0] = 40;
finishChordResume();
assert.equal(await chordInFlight, true);
assert.ok(Math.abs(context.oscillators.at(-9).frequency.calls[0][1] - 41.20344461410875) < 1e-9, 'Mutating the input while resuming cannot change the scheduled chord');
context.state = 'suspended';
const cancelledChord = audio.playChord([28, 35]);
audio.stop();
finishChordResume();
assert.equal(await cancelledChord, false);
FakeContext.resumeHook = null;

// Failures are contained and reported once; future playback stays muted.
let errors = [];
const brokenAudio = createBassAudio({ onError: message => errors.push(message) });
FakeContext.resumeHook = async () => { throw new Error('permission denied'); };
assert.equal(await brokenAudio.setEnabled(true), false);
assert.equal(errors.length, 1);
assert.match(errors[0], /指板功能仍可使用/);
assert.equal(await brokenAudio.play(28), false);
brokenAudio.dispose();
FakeContext.resumeHook = null;

// Safari's prefixed context is supported; unsupported browsers fail gracefully.
delete host.AudioContext;
host.webkitAudioContext = FakeContext;
const safari = createBassAudio();
assert.equal(safari.supported, true);
assert.equal(await safari.setEnabled(true), true);
safari.dispose();
delete host.webkitAudioContext;
const unsupported = createBassAudio({ onError: message => errors.push(message) });
assert.equal(unsupported.supported, false);
assert.equal(await unsupported.setEnabled(true), false);
assert.match(errors.at(-1), /不支持声音/);
unsupported.dispose();

audio.dispose();
assert.equal(context.state, 'closed');
assert.equal(await audio.setEnabled(true), false);
assert.equal(await audio.play(40), false);
assert.equal(await audio.playChord([28, 32, 35]), false);
delete globalThis.window;
delete globalThis.document;
console.log('✓ Bass audio: stronger harmonics, volume/headroom, simultaneous chords, pitches, mute, cleanup, resume races and fallback.');
