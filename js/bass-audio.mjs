// A small, self-contained plucked bass voice. No samples or network requests.
export function createBassAudio({ onError = () => {} } = {}) {
  const host = globalThis.window ?? globalThis;
  const Audio = host.AudioContext || host.webkitAudioContext;
  const page = globalThis.document;
  const voices = new Set();
  let context = null;
  let master = null;
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
        ? '声音暂时无法播放，请重新开启声音或检查浏览器设置。音程辨识仍可使用。'
        : '当前浏览器不支持声音，音程辨识仍可使用。');
    } catch { /* A UI callback must not create an unhandled rejection. */ }
  }

  async function ready() {
    if (!Audio) throw new Error('Web Audio unavailable');
    if (!context || context.state === 'closed') {
      context = new Audio();
      master = context.createGain();
      master.gain.value = 0.4;
      master.connect(context.destination);
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

  function sound(midi, delay) {
    while (voices.size >= 6) voices.values().next().value.stop();
    const at = context.currentTime + delay;
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const nodes = [];
    const oscillators = [];
    let voice;
    const disconnect = () => {
      if (voice) voices.delete(voice);
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
      filter.frequency.exponentialRampToValueAtTime(frequency * 3, at + 0.22);
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(0.34, at + 0.006);
      envelope.gain.exponentialRampToValueAtTime(0.09, at + 0.22);
      envelope.gain.exponentialRampToValueAtTime(0.0001, at + 1.7);
      filter.connect(envelope).connect(master);
      for (const [type, level] of [['triangle', 0.26], ['sine', 0.65]]) {
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
      sound(midi, delaySeconds);
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
    try { master?.disconnect(); } catch { /* Already disconnected. */ }
  }

  return { supported: Boolean(Audio), setEnabled, play, stop, dispose };
}
