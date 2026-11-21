import assert from 'node:assert/strict';
import { createBassAudio } from '../js/bass-audio.mjs';

class Param {
  constructor() { this.calls = []; this.value = 0; }
  setValueAtTime(...args) { this.calls.push(['set', ...args]); }
  linearRampToValueAtTime(...args) { this.calls.push(['linear', ...args]); }
  exponentialRampToValueAtTime(...args) { this.calls.push(['exponential', ...args]); }
  cancelScheduledValues(...args) { this.calls.push(['cancel', ...args]); }
}
class AudioNode {
  constructor() {
    this.gain = new Param(); this.frequency = new Param(); this.Q = new Param();
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
    this.oscillators = []; this.nodes = [];
  }
  createGain() { const n = new AudioNode(); this.nodes.push(n); return n; }
  createBiquadFilter() { const n = new AudioNode(); this.nodes.push(n); return n; }
  createOscillator() { const n = new AudioNode(); this.nodes.push(n); this.oscillators.push(n); return n; }
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
assert.equal(FakeContext.instances.length, 0);
assert.equal(await audio.setEnabled(true), true);
const context = FakeContext.instances[0];
assert.equal(await audio.play(28), true);
assert.equal(context.oscillators.length, 2);
for (const oscillator of context.oscillators) {
  assert.ok(Math.abs(oscillator.frequency.calls[0][1] - 41.20344461410875) < 1e-9, 'E1 is the sounding bass pitch');
  assert.deepEqual(oscillator.starts, [12]);
}
assert.equal(await audio.play(55, 0.45), true);
assert.deepEqual(context.oscillators[2].starts, [12.45]);
assert.ok(Math.abs(context.oscillators[2].frequency.calls[0][1] - 195.99771799087463) < 1e-9);
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
const finalPair = context.oscillators.slice(-2);
finalPair.forEach(oscillator => oscillator.onended());
assert.ok(finalPair.every(node => node.disconnected), 'Natural note endings clean up their nodes');
assert.equal(await audio.play(NaN), false);
assert.equal(await audio.play(28, -1), false);

await audio.play(38, 1);
page.hidden = true;
page.dispatchEvent(new Event('visibilitychange'));
assert.ok(context.oscillators.every(node => node.disconnected));
assert.equal(await audio.play(38), false, 'Hidden pages must not schedule new notes');
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

// Failures are contained and reported once; future playback stays muted.
let errors = [];
const brokenAudio = createBassAudio({ onError: message => errors.push(message) });
FakeContext.resumeHook = async () => { throw new Error('permission denied'); };
assert.equal(await brokenAudio.setEnabled(true), false);
assert.equal(errors.length, 1);
assert.match(errors[0], /音程辨识仍可使用/);
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
delete globalThis.window;
delete globalThis.document;
console.log('✓ Bass audio: exact bass pitches, default mute, scheduled mute, voice cleanup, resume races, visibility and fallback.');
