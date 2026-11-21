const $ = (id) => document.getElementById(id);
const bpmOut = $('metro-bpm');
const slider = $('metro-speed');
const meterSelect = $('metro-meter');
const subSelect = $('metro-subdivision');
const toggle = $('metro-toggle');
const indicator = $('metro-state');
const hint = $('metro-hint');
const pulse = $('metro-pulse');
const tap = $('metro-tap');
const presets = [...document.querySelectorAll('[data-bpm]')];

const KEY = 'haoyi-studio-metronome-v1';
const clamp = (n) => Math.min(240, Math.max(30, Math.round(n)));
let settings = { bpm: 100, meter: 4, subdivision: 2 };
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (saved && Number.isFinite(saved.bpm)) settings.bpm = clamp(saved.bpm);
  if ([2,3,4,6].includes(Number(saved?.meter))) settings.meter = Number(saved.meter);
  if ([1,2,3,4].includes(Number(saved?.subdivision))) settings.subdivision = Number(saved.subdivision);
} catch { /* private storage may be unavailable */ }

slider.value = String(settings.bpm);
meterSelect.value = String(settings.meter);
subSelect.value = String(settings.subdivision);

let ctx = null;
let running = false;
let timer = null;
let step = 0;
let nextNoteTime = 0;
let lastTaps = [];
const lookAhead = 0.12; // schedule sound ahead to avoid interval jitter
const tickInterval = 25;
const activeVoices = new Set();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch {} };

function drawDots() {
  pulse.replaceChildren();
  for (let i=0; i<settings.meter; i++) {
    const dot = document.createElement('span');
    dot.className = 'metro-dot';
    dot.dataset.beat = String(i);
    dot.setAttribute('aria-hidden', 'true');
    pulse.append(dot);
  }
}
function paintBeat(beat) {
  [...pulse.children].forEach((dot,i)=>dot.classList.toggle('is-active',i===beat));
}
function setBpm(value) {
  settings.bpm = clamp(value);
  slider.value = String(settings.bpm);
  bpmOut.textContent = String(settings.bpm);
  presets.forEach(btn=>btn.classList.toggle('active',Number(btn.dataset.bpm)===settings.bpm));
  save();
  if (running && ctx) {
    // Avoid a burst of queued old-tempo notes when BPM changes.
    nextNoteTime = Math.max(nextNoteTime, ctx.currentTime + 0.035);
  }
}
function currentStepDuration() { return 60 / settings.bpm / settings.subdivision; }

function sound(at, beat, subdivision) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const main = subdivision===0;
  const accented = main && beat===0;
  oscillator.type='sine';
  oscillator.frequency.setValueAtTime(accented?1150:main?890:620,at);
  oscillator.frequency.exponentialRampToValueAtTime(accented?760:main?610:470,at + 0.038);
  gain.gain.setValueAtTime(0.0001,at);
  gain.gain.exponentialRampToValueAtTime(accented?0.24:main?0.14:0.055,at + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001,at + 0.055);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(at);
  oscillator.stop(at+0.065);
  activeVoices.add(oscillator);
  oscillator.onended=()=>{activeVoices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
}
function schedule() {
  if (!running || !ctx || ctx.state !== 'running') return;
  while(nextNoteTime < ctx.currentTime + lookAhead) {
    const sub = step % settings.subdivision;
    const beat = Math.floor(step / settings.subdivision) % settings.meter;
    const at = nextNoteTime;
    sound(at, beat, sub);
    if (sub === 0) {
      const delay = Math.max(0,(at - ctx.currentTime)*1000);
      window.setTimeout(()=>{if(running && Math.abs(at - lastVisualAt) < 0.3)paintBeat(beat);},delay);
      lastVisualAt=at;
    }
    step++;
    nextNoteTime += currentStepDuration();
  }
}
let lastVisualAt = 0;
async function start() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw Error('当前浏览器不支持 Web Audio。');
    if (!ctx) ctx = new Audio();
    await ctx.resume();
    if (ctx.state !== 'running') throw Error('声音未能启用。请检查静音设置或重新点击。');
    running = true;
    step=0;lastVisualAt=0;
    nextNoteTime = ctx.currentTime + 0.055;
    toggle.textContent='■ Stop';
    indicator.textContent='PLAYING';indicator.classList.add('is-on');
    hint.textContent='正在播放 · 点击 Stop 停止';
    schedule();
    timer = window.setInterval(schedule,tickInterval);
  } catch(err) { stop();hint.textContent='无法开启声音：'+err.message; }
}
function stop() {
  running=false;
  if(timer!==null)clearInterval(timer);
  timer=null;
  activeVoices.forEach(voice=>{try{voice.stop();}catch{}});
  activeVoices.clear();
  paintBeat(-1);
  toggle.textContent='▶ Start';
  indicator.textContent='READY';indicator.classList.remove('is-on');
  if(ctx && ctx.state==='running') ctx.suspend().catch(()=>{});
}
function updateMeter() {
  settings.meter=Number(meterSelect.value);
  settings.subdivision=Number(subSelect.value);
  save();drawDots();
  if(running && ctx){step=0;nextNoteTime=ctx.currentTime+0.055;}
}
toggle.addEventListener('click',()=>running?stop():start());
$('metro-minus').addEventListener('click',()=>setBpm(settings.bpm-1));
$('metro-plus').addEventListener('click',()=>setBpm(settings.bpm+1));
slider.addEventListener('input',()=>setBpm(Number(slider.value)));
meterSelect.addEventListener('change',updateMeter);
subSelect.addEventListener('change',updateMeter);
presets.forEach(btn=>btn.addEventListener('click',()=>setBpm(Number(btn.dataset.bpm))));
tap.addEventListener('click',()=>{
  const now=performance.now();
  lastTaps=lastTaps.filter(t=>now-t < 2600);
  lastTaps.push(now);
  if(lastTaps.length>1) {
    const intervals=lastTaps.slice(1).map((t,i)=>t-lastTaps[i]).filter(dt=>dt>=250&&dt<=2000);
    if(intervals.length) setBpm(60000/(intervals.reduce((a,b)=>a+b,0)/intervals.length));
  }
  hint.textContent=lastTaps.length<2?'继续按节奏点击 TAP。':'Tap Tempo 已读取节奏：'+settings.bpm+' BPM';
});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden && running) {
    stop();
    hint.textContent='已暂停：手机后台或锁屏可能停止音频。返回后点击 Start。';
  }
});
window.addEventListener('pagehide',stop);
setBpm(settings.bpm);drawDots();
