// A small, self-contained plucked bass voice. No samples or network requests.
export function createBassAudio({ onError = () => {} } = {}) {
  const host = globalThis.window ?? globalThis;
  const Audio = host.AudioContext || host.webkitAudioContext;
  const page = globalThis.document;
  const voices = new Set();
  let context = null;
  let master = null;
  let normalizer = null;
  let compressor = null;
  let volume = 0.8;
  let enabled = false;
  let disposed = false;
  let generation = 0;
  let enableGeneration = 0;
  let pendingResume = null;

  function stop() {
    // Also invalidates clicks waiting for the browser's audio permission/resume.
    generation++;
    for (const voice of [...voices]) voice.stop();
  }

  function reportFailure() {
    enabled = false;
    enableGeneration++;
    stop();
    try {
      onError(Audio
        ? '声音暂时无法播放，请重新开启声音或检查浏览器设置。指板功能仍可使用。'
        : '当前浏览器不支持声音，指板功能仍可使用。');
    } catch { /* A UI callback must not create an unhandled rejection. */ }
  }

  async function ready() {
    if (!Audio) throw new Error('Web Audio unavailable');
    if (!context || context.state === 'closed') {
      context = new Audio();
      normalizer = context.createGain();
      normalizer.gain.value = 0.95;
      compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -8;
      compressor.knee.value = 8;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.002;
      compressor.release.value = 0.18;
      master = context.createGain();
      master.gain.value = volume;
      normalizer.connect(compressor).connect(master).connect(context.destination);
    }
    if (context.state !== 'running') {
      if (!pendingResume) {
        pendingResume = Promise.resolve(context.resume()).finally(() => { pendingResume = null; });
      }
      await pendingResume;
    }
    if (context.state !== 'running') throw new Error('Audio did not resume');
  }

  async function setEnabled(value) {
    if (disposed) return false;
    const ticket = ++enableGeneration;
    enabled = Boolean(value);
    stop();
    if (!enabled) return false;
    try {
      // Called by the switch's gesture; create/resume before the first await.
      await ready();
      // Clearing/replaying notes cancels voices, not the switch's enabled intent.
      return enabled && !disposed && ticket === enableGeneration;
    } catch {
      if (ticket === enableGeneration && !disposed) reportFailure();
      return false;
    }
  }

  function setVolume(value) {
    if (disposed || !Number.isFinite(value)) return volume;
    volume = Math.max(0, Math.min(1, value));
    if (master && context?.state !== 'closed') {
      master.gain.cancelScheduledValues(context.currentTime);
      if (volume === 0) master.gain.setValueAtTime(0, context.currentTime);
      else master.gain.setTargetAtTime(volume, context.currentTime, 0.008);
    }
    return volume;
  }

  function normalizeVoices() {
    // Oscillator levels total 1; the envelope peaks below 1. Dividing by
    // voice count leaves headroom even for six perfectly aligned attacks.
    // The compressor gently rounds attacks rather than having to prevent overload.
    normalizer?.gain.setValueAtTime(0.95 / Math.max(1, voices.size), context.currentTime);
  }

  function sound(midi, at) {
    while (voices.size >= 6) voices.values().next().value.stop();
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const nodes = [];
    const oscillators = [];
    let voice;
    const disconnect = () => {
      if (voice && voices.delete(voice)) normalizeVoices();
      for (const node of nodes) {
        try { node.disconnect(); } catch { /* Already disconnected. */ }
      }
    };
    try {
      const envelope = context.createGain();
      const filter = context.createBiquadFilter();
      nodes.push(envelope, filter);
      filter.type = 'lowpass';
      filter.Q.value = 0.7;
      // A bright attack quickly loses upper harmonics, like a plucked string.
      filter.frequency.setValueAtTime(Math.min(7000, frequency * 16), at);
      filter.frequency.exponentialRampToValueAtTime(frequency * 5, at + 0.25);
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(0.82, at + 0.006);
      envelope.gain.exponentialRampToValueAtTime(0.28, at + 0.25);
      envelope.gain.exponentialRampToValueAtTime(0.0001, at + 1.7);
      filter.connect(envelope).connect(normalizer);
      // Additional upper harmonics make low bass notes audible on small speakers.
      for (const [type, level] of [['sine', 0.45], ['triangle', 0.3], ['sawtooth', 0.25]]) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        nodes.push(oscillator, gain);
        oscillators.push(oscillator);
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, at);
        gain.gain.value = level;
        oscillator.connect(gain).connect(filter);
      }
      voice = {
        stop() {
          try {
            envelope.gain.cancelScheduledValues(context.currentTime);
            envelope.gain.setValueAtTime(0, context.currentTime);
          } catch { /* The context may already be closing. */ }
          for (const oscillator of oscillators) {
            oscillator.onended = null;
            try { oscillator.stop(context.currentTime); } catch { /* Ended already. */ }
          }
          disconnect();
        }
      };
      let ended = 0;
      for (const oscillator of oscillators) {
        oscillator.onended = () => { if (++ended === oscillators.length) disconnect(); };
        oscillator.start(at);
        oscillator.stop(at + 1.72);
      }
      voices.add(voice);
      normalizeVoices();
    } catch (error) {
      if (voice) voice.stop();
      else disconnect();
      throw error;
    }
  }

  async function play(midi, delaySeconds = 0) {
    if (!enabled || disposed || page?.hidden || !Number.isInteger(midi)
        || midi < 0 || midi > 127 || !Number.isFinite(delaySeconds)
        || delaySeconds < 0 || delaySeconds > 10) return false;
    const ticket = generation;
    try {
      await ready();
      if (!enabled || disposed || page?.hidden || ticket !== generation) return false;
      sound(midi, context.currentTime + delaySeconds);
      return true;
    } catch {
      if (ticket === generation && !disposed) reportFailure();
      return false;
    }
  }

  async function playChord(midis) {
    // Snapshot before awaiting permission so callers cannot change the chord in flight.
    const notes = Array.isArray(midis) ? Array.from(midis) : [];
    if (!enabled || disposed || page?.hidden || notes.length < 1 || notes.length > 5
        || !notes.every(midi => Number.isInteger(midi) && midi >= 0 && midi <= 127)) return false;
    const ticket = generation;
    try {
      await ready();
      if (!enabled || disposed || page?.hidden || ticket !== generation) return false;
      // Capture once. Even if currentTime advances while nodes are created, every
      // oscillator starts on exactly this time, rather than forming an arpeggio.
      const at = context.currentTime + 0.008;
      for (const midi of notes) sound(midi, at);
      return true;
    } catch {
      if (ticket === generation && !disposed) reportFailure();
      return false;
    }
  }

  const onVisibility = () => { if (page.hidden) stop(); };
  page?.addEventListener('visibilitychange', onVisibility);
  host.addEventListener?.('pagehide', stop);

  function dispose() {
    if (disposed) return;
    enabled = false;
    enableGeneration++;
    disposed = true;
    stop();
    page?.removeEventListener('visibilitychange', onVisibility);
    host.removeEventListener?.('pagehide', stop);
    try { Promise.resolve(context?.close()).catch(() => {}); } catch { /* Already closed. */ }
    for (const node of [master, normalizer, compressor]) {
      try { node?.disconnect(); } catch { /* Already disconnected. */ }
    }
  }

  return { supported: Boolean(Audio), setEnabled, setVolume, play, playChord, stop, dispose };
}
