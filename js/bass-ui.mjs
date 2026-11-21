import { BASS_STRINGS, NOTES_SHARP, getSpellings, defaultSpelling, analyzeInterval } from './bass-theory.mjs';
import { createBassAudio } from './bass-audio.mjs';

const $ = id => document.getElementById(id);
const SCALES = { major: [0,2,4,5,7,9,11], minor: [0,2,3,5,7,8,10], pentatonic: [0,3,5,7,10], chromatic: [0,1,2,3,4,5,6,7,8,9,10,11] };
const selections = [];
const buttons = [];
let soundEnabled = false;
let soundRequest = 0;
const audio = createBassAudio({ onError(message) {
  soundEnabled = false;
  updateSound();
  $('sound-status').textContent = message;
} });

const noteAt = (stringIdx, fret) => ({ ...defaultSpelling(BASS_STRINGS[stringIdx].midi + fret, $('note-preference').value), stringIdx, fret });
const samePosition = (a, b) => a && b && a.stringIdx === b.stringIdx && a.fret === b.fret;
const positionText = note => `${BASS_STRINGS[note.stringIdx].name} 弦 · ${note.fret === 0 ? '空弦' : `第 ${note.fret} 品`} · ${note.name}`;

function updateSound() {
  $('sound-toggle').setAttribute('aria-checked', String(soundEnabled));
  $('sound-toggle').textContent = `声音：${soundEnabled ? '开' : '关'}`;
  $('play-pair').disabled = !soundEnabled || selections.length !== 2;
}

function buildBoard() {
  const board = $('fretboard');
  BASS_STRINGS.forEach((string, stringIdx) => {
    const label = document.createElement('span');
    label.className = 'string-label'; label.textContent = string.name; board.append(label);
    for (let fret = 0; fret <= 12; fret++) {
      const cell = document.createElement('div');
      cell.className = `fret-cell${fret === 0 ? ' open' : ''}`;
      const button = document.createElement('button');
      button.type = 'button'; button.tabIndex = buttons.length === 0 ? 0 : -1;
      button.dataset.string = stringIdx; button.dataset.fret = fret;
      button.addEventListener('focus', () => buttons.forEach(b => { b.tabIndex = b === button ? 0 : -1; }));
      button.addEventListener('click', () => {
        if (selections.length === 2) { audio.stop(); selections.length = 0; }
        const note = noteAt(stringIdx, fret);
        selections.push(note); if (soundEnabled) void audio.play(note.midi); updateSelection();
      });
      button.addEventListener('keydown', event => {
        let row = stringIdx, col = fret;
        if (event.key === 'ArrowLeft') col = Math.max(0, col - 1);
        else if (event.key === 'ArrowRight') col = Math.min(12, col + 1);
        else if (event.key === 'ArrowUp') row = Math.max(0, row - 1);
        else if (event.key === 'ArrowDown') row = Math.min(3, row + 1);
        else if (event.key === 'Home') col = 0;
        else if (event.key === 'End') col = 12;
        else return;
        event.preventDefault(); buttons[row * 13 + col].focus();
      });
      buttons.push(button); cell.append(button); board.append(cell);
    }
  });
  for (let fret = -1; fret <= 12; fret++) {
    const label = document.createElement('span'); label.className = 'fret-num';
    label.textContent = fret < 0 ? '' : fret === 0 ? '空弦' : String(fret);
    $('fret-caption').append(label);
  }
}

function updateBoard() {
  const root = Number($('root-select').value), scale = SCALES[$('scale-select').value];
  buttons.forEach(button => {
    const note = noteAt(Number(button.dataset.string), Number(button.dataset.fret));
    const pitch = note.midi % 12, active = scale.includes((pitch - root + 12) % 12);
    const indices = selections.flatMap((selected, i) => samePosition(selected, note) ? [i] : []);
    const displayed = indices.length ? selections[indices[0]] : note;
    button.className = `note-dot${active ? ' in-scale' : ''}${pitch === root ? ' root' : ''}${indices.includes(0) ? ' is-first' : ''}${indices.includes(1) ? ' is-second' : ''}`;
    button.textContent = displayed.name;
    if (indices.length) {
      const badge = document.createElement('span'); badge.className = 'note-order';
      badge.setAttribute('aria-hidden', 'true'); badge.textContent = indices.map(i => i + 1).join('·'); button.append(badge);
    }
    button.setAttribute('aria-pressed', String(indices.length > 0));
    button.setAttribute('aria-label', `${BASS_STRINGS[note.stringIdx].name} 弦 · ${note.fret === 0 ? '空弦' : `第 ${note.fret} 品`} · ${displayed.name}${indices.length ? `，已选第 ${indices.map(i => i + 1).join('、')} 个音` : ''}${active ? '，音阶内' : '，音阶外'}`);
  });
  $('scale-notes').textContent = '音阶音高：' + scale.map(i => defaultSpelling(48 + (root + i) % 12, $('note-preference').value).name.replace(/-?\d+$/, '')).join(' · ');
}

function updateSelection() {
  for (let i = 0; i < 2; i++) {
    const select = $(`spelling-${i + 1}`), note = selections[i];
    select.replaceChildren(); select.disabled = !note;
    if (note) {
      getSpellings(note.midi).forEach(spelling => {
        const option = document.createElement('option'); option.value = spelling.name; option.textContent = spelling.name; select.append(option);
      });
      select.value = note.name;
    } else {
      const option = document.createElement('option'); option.textContent = '在指板选音'; select.append(option);
    }
    $(`position-${i + 1}`).textContent = note ? positionText(note) : '等待选择';
  }
  $('clear-notes').disabled = selections.length === 0; $('swap-notes').disabled = selections.length !== 2;
  updateSound(); updateBoard();
  $('note-readout').textContent = selections.map((note, i) => `${i + 1}. ${positionText(note)}`).join(' / ') || '等待选音';
  if (selections.length === 2) {
    const result = analyzeInterval(...selections);
    $('interval-name').textContent = result.name;
    $('interval-pair').textContent = `${selections[0].name} → ${selections[1].name}`;
    $('interval-symbol').textContent = result.symbol; $('interval-distance').textContent = String(result.distance); $('interval-direction').textContent = result.direction;
    $('interval-explanation').replaceChildren(...result.explanation.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    $('interval-announcement').textContent = `${selections[0].name} 到 ${selections[1].name}：${result.name}，${result.distance} 个半音，${result.direction}。`;
  } else {
    $('interval-name').textContent = selections.length ? '再选第二个音' : '先选第一个音';
    $('interval-pair').textContent = selections.length ? `已选 ${selections[0].name}，也可再次点击同一音` : '从指板上的任意位置开始';
    ['interval-symbol', 'interval-distance', 'interval-direction'].forEach(id => { $(id).textContent = '—'; });
    $('interval-explanation').replaceChildren(...['先按字母音名计数，包含起点和终点，得到“几度”。', '再比较实际半音数与该度数的纯／大音程基准，得到音程性质。'].map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    $('interval-announcement').textContent = selections.length ? `第一个音 ${selections[0].name}，请选择第二个音。` : '选择已清空。请选择第一个音。';
  }
}

if ($('fretboard')) {
  NOTES_SHARP.forEach((name, i) => {
    const option = document.createElement('option'); option.value = i; option.textContent = name; $('root-select').append(option);
  });
  $('root-select').value = '0';
  ['root-select', 'scale-select', 'note-preference'].forEach(id => $(id).addEventListener('change', updateBoard));
  [0, 1].forEach(i => $(`spelling-${i + 1}`).addEventListener('change', event => {
    const spelling = getSpellings(selections[i].midi).find(note => note.name === event.target.value);
    Object.assign(selections[i], spelling); updateSelection();
  }));
  $('clear-notes').addEventListener('click', () => { audio.stop(); selections.length = 0; updateSelection(); });
  $('swap-notes').addEventListener('click', () => { audio.stop(); selections.reverse(); updateSelection(); });
  $('sound-toggle').addEventListener('click', async () => {
    const request = ++soundRequest; soundEnabled = !soundEnabled; updateSound();
    const requested = soundEnabled;
    const enabled = await audio.setEnabled(requested);
    if (request !== soundRequest) return;
    soundEnabled = enabled; updateSound();
    if (enabled) $('sound-status').textContent = '合成拨弦贝斯已开启；点击音符试听，关闭开关可立即静音。';
    else if (!requested) $('sound-status').textContent = '声音已关闭；仍可继续选音与分析。';
  });
  $('play-pair').addEventListener('click', () => {
    if (!soundEnabled || selections.length !== 2) return;
    audio.stop(); void audio.play(selections[0].midi); void audio.play(selections[1].midi, .65);
  });
  document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => {
    audio.stop();
    const example = button.dataset.example;
    const last = example === 'augmented' ? { midi: 41, name: 'E♯2', fret: 3 } : example === 'diminished' ? { midi: 38, letter: 'E', accidental: -2, fret: 0 } : { midi: 39, name: 'D♯2', fret: 1 };
    const spelling = getSpellings(last.midi).find(note => last.name ? note.name === last.name : note.letter === last.letter && note.accidental === last.accidental);
    selections.splice(0, 2, { ...defaultSpelling(36), stringIdx: 2, fret: 3 }, { ...spelling, stringIdx: 1, fret: last.fret });
    updateSelection();
  }));
  window.addEventListener('pagehide', () => audio.stop());
  if (!audio.supported) { $('sound-toggle').disabled = true; $('sound-status').textContent = '当前浏览器不支持音频；选音与音程分析仍可使用。'; }
  buildBoard(); updateSelection();
}
