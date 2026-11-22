import { BASS_STRINGS, NOTES_SHARP, getSpellings, defaultSpelling, analyzeInterval } from './bass-theory.mjs';
import { CHORD_TYPES, buildChord, chordToneAtMidi } from './bass-chords.mjs';
import { createBassAudio } from './bass-audio.mjs';

const $ = id => document.getElementById(id);
const SCALES = { major: [0,2,4,5,7,9,11], minor: [0,2,3,5,7,8,10], pentatonic: [0,3,5,7,10], chromatic: [0,1,2,3,4,5,6,7,8,9,10,11] };
const HELP = { single: '点击任一位置，查看音名与实际音高；每次只保留当前这个音。', interval: '依次选两个音；第三次点击开始新一组。可重复点击同一位置。', chord: '点击一个音作为根音，再选择和弦类型；指板会标出全部和弦音。' };
const selections = [], buttons = [];
let mode = 'single', currentChord = null, soundEnabled = false, soundRequest = 0;
const audio = createBassAudio({ onError(message) {
  soundEnabled = false; updateSound(); $('sound-status').textContent = message;
} });
const noteAt = (stringIdx, fret) => ({ ...defaultSpelling(BASS_STRINGS[stringIdx].midi + fret, $('note-preference').value), stringIdx, fret });
const samePosition = (a, b) => a && b && a.stringIdx === b.stringIdx && a.fret === b.fret;
const positionText = note => `${BASS_STRINGS[note.stringIdx].name} 弦 · ${note.fret === 0 ? '空弦' : `第 ${note.fret} 品`} · ${note.name}`;
const toneClass = tone => tone.degree === 1 ? 'tone-root' : tone.degree === 3 ? 'tone-third' : tone.degree === 5 ? 'tone-fifth' : 'tone-extension';
const withoutOctave = name => name.replace(/-?\d+$/, '');
const make = (tag, className, text) => { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; };
const announce = text => { $('interval-announcement').textContent = text; };

function updateSound() {
  $('sound-toggle').setAttribute('aria-checked', String(soundEnabled));
  $('sound-toggle').textContent = `声音：${soundEnabled ? '开' : '关'}`;
  $('play-pair').disabled = !soundEnabled || mode !== 'interval' || selections.length !== 2;
  $('play-chord').disabled = !soundEnabled || mode !== 'chord' || !currentChord;
}

function buildBoard() {
  BASS_STRINGS.forEach((string, stringIdx) => {
    $('fretboard').append(make('span', 'string-label', string.name));
    for (let fret = 0; fret <= 12; fret++) {
      const cell = make('div', `fret-cell${fret === 0 ? ' open' : ''}`), button = make('button');
      button.type = 'button'; button.tabIndex = buttons.length === 0 ? 0 : -1;
      button.dataset.string = stringIdx; button.dataset.fret = fret;
      button.addEventListener('focus', () => buttons.forEach(b => { b.tabIndex = b === button ? 0 : -1; }));
      button.addEventListener('click', () => {
        if (mode !== 'interval' || selections.length === 2) { audio.stop(); selections.length = 0; }
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
      buttons.push(button); cell.append(button); $('fretboard').append(cell);
    }
  });
  for (let fret = -1; fret <= 12; fret++) $('fret-caption').append(make('span', 'fret-num', fret < 0 ? '' : fret === 0 ? '空弦' : String(fret)));
}

function updateLegend() {
  const legend = $('fret-legend'); legend.replaceChildren();
  const entries = mode === 'chord'
    ? currentChord?.tones.map(tone => [toneClass(tone), `${tone.label} · ${withoutOctave(tone.name)}`]) || []
    : [['legend-root', '音阶根音'], ['legend-scale', '音阶内'], ['legend-first', mode === 'single' ? '当前音' : '第一音'], ...(mode === 'interval' ? [['legend-second', '第二音']] : [])];
  entries.forEach(([className, text]) => { const item = make('span'); item.append(make('i', className), make('span', '', text)); legend.append(item); });
  legend.append(make('span', 'scroll-hint', '左右滑动 · 方向键移动，回车选音 · 点指板空白处或在指板内按 Esc 取消'));
}

function updateBoard() {
  const root = Number($('root-select').value), scale = SCALES[$('scale-select').value];
  buttons.forEach(button => {
    const note = noteAt(Number(button.dataset.string), Number(button.dataset.fret));
    const pitch = note.midi % 12, active = mode !== 'chord' && scale.includes((pitch - root + 12) % 12);
    const indices = selections.flatMap((selected, i) => samePosition(selected, note) ? [i] : []);
    const tone = mode === 'chord' && currentChord?.tones.find(t => t.midi % 12 === pitch);
    const chordSpelling = tone ? chordToneAtMidi(tone, note.midi) : null;
    const displayed = chordSpelling || (indices.length ? selections[indices[0]] : note);
    button.className = `note-dot${active ? ' in-scale' : ''}${mode !== 'chord' && pitch === root ? ' root' : ''}${indices.includes(0) ? ' is-first' : ''}${indices.includes(1) ? ' is-second' : ''}${tone ? ` chord-tone ${toneClass(tone)}` : ''}`;
    button.textContent = displayed.name;
    if (tone || indices.length) {
      const badge = make('span', `note-order${tone ? ' note-degree' : ''}`, tone ? tone.label : mode === 'single' ? '选' : indices.map(i => i + 1).join('·'));
      badge.setAttribute('aria-hidden', 'true'); button.append(badge);
    }
    button.setAttribute('aria-pressed', String(indices.length > 0));
    const selectedLabel = indices.length ? mode === 'interval' ? `，已选第 ${indices.map(i => i + 1).join('、')} 个音` : mode === 'chord' ? '，已选根音' : '，当前音' : '';
    const membership = mode === 'chord' ? tone ? `，和弦音 ${tone.label} 级` : '，和弦外' : active ? '，音阶内' : '，音阶外';
    button.setAttribute('aria-label', `${BASS_STRINGS[note.stringIdx].name} 弦 · ${note.fret === 0 ? '空弦' : `第 ${note.fret} 品`} · ${displayed.name}${selectedLabel}${membership}`);
  });
  $('scale-notes').textContent = mode === 'chord' ? currentChord ? '和弦级数：' + currentChord.tones.map(t => t.label).join(' · ') : '选定根音后标注和弦音' : '音阶音高：' + scale.map(i => withoutOctave(defaultSpelling(48 + (root + i) % 12, $('note-preference').value).name)).join(' · ');
  updateLegend();
}

function fillSpelling(select, note, placeholder) {
  select.replaceChildren(); select.disabled = !note;
  if (note) {
    getSpellings(note.midi).forEach(spelling => { const option = make('option', '', spelling.name); option.value = spelling.name; select.append(option); });
    select.value = note.name;
  } else select.append(make('option', '', placeholder));
}

function updateInterval() {
  for (let i = 0; i < 2; i++) {
    const note = mode === 'interval' ? selections[i] : null;
    fillSpelling($(`spelling-${i + 1}`), note, '在指板选音');
    $(`position-${i + 1}`).textContent = note ? positionText(note) : '等待选择';
  }
  $('clear-notes').disabled = selections.length === 0; $('swap-notes').disabled = selections.length !== 2;
  if (mode !== 'interval') return;
  if (selections.length === 2) {
    const result = analyzeInterval(...selections);
    $('interval-name').textContent = result.name; $('interval-pair').textContent = `${selections[0].name} → ${selections[1].name}`;
    $('interval-symbol').textContent = result.symbol; $('interval-distance').textContent = String(result.distance); $('interval-direction').textContent = result.direction;
    $('interval-explanation').replaceChildren(...result.explanation.map(text => make('li', '', text)));
    announce(`${selections[0].name} 到 ${selections[1].name}：${result.name}，${result.distance} 个半音，${result.direction}。`);
  } else {
    $('interval-name').textContent = selections.length ? '再选第二个音' : '先选第一个音';
    $('interval-pair').textContent = selections.length ? `已选 ${selections[0].name}，也可再次点击同一音` : '从指板上的任意位置开始';
    ['interval-symbol', 'interval-distance', 'interval-direction'].forEach(id => { $(id).textContent = '—'; });
    $('interval-explanation').replaceChildren(...['先按字母音名计数，包含起点和终点，得到“几度”。', '再比较实际半音数与该度数的纯／大音程基准，得到音程性质。'].map(text => make('li', '', text)));
    announce(selections.length ? `第一个音 ${selections[0].name}，请选择第二个音。` : '音程辨识模式。请选择第一个音。');
  }
}

function updateSingle() {
  const note = mode === 'single' ? selections[0] : null;
  $('single-name').textContent = note?.name || '点击任一音';
  $('single-position').textContent = note ? positionText(note) : '每次点击只查看当前这个音。';
  $('single-frequency').textContent = note ? (440 * 2 ** ((note.midi - 69) / 12)).toFixed(2) : '—';
  if (mode === 'single') announce(note ? `${note.name}，${positionText(note)}。` : '单音探索模式。点击任一音。');
}

function updateChord() {
  const root = mode === 'chord' ? selections[0] : null;
  currentChord = root ? buildChord(root, $('chord-type').value) : null;
  fillSpelling($('chord-root-spelling'), root, '在指板选根音');
  $('chord-position').textContent = root ? `根音：${positionText(root)}` : '点击一个音作为根音。';
  $('chord-name').textContent = currentChord?.name || '先选一个根音';
  $('chord-symbol').textContent = currentChord?.symbol || '再选择你想探索的和弦类型';
  $('chord-tones').replaceChildren();
  currentChord?.tones.forEach(tone => {
    const chip = make('div', `chord-tone-chip ${toneClass(tone)}`); chip.setAttribute('role', 'listitem'); chip.dataset.degree = tone.degree;
    chip.append(make('span', 'chord-degree', tone.label), make('strong', '', tone.name)); $('chord-tones').append(chip);
  });
  if (mode === 'chord') announce(currentChord ? `${currentChord.name}：${currentChord.tones.map(tone => `${tone.label} 级 ${tone.name}`).join('，')}。` : '和弦探索模式。请在指板选择一个根音。');
}

function updateSelection() {
  updateInterval(); updateSingle(); updateChord(); updateSound(); updateBoard();
  $('note-readout').textContent = selections.length ? selections.map((note, i) => `${mode === 'interval' ? `${i + 1}. ` : mode === 'chord' ? '根音 · ' : ''}${positionText(note)}`).join(' / ') : mode === 'chord' ? '等待选择根音' : '等待选音';
}

function clearSelection(message = '已取消选择，请重新选音。') {
  audio.stop(); selections.length = 0; currentChord = null;
  updateSelection(); announce(message);
}

function switchMode(next) {
  if (!Object.hasOwn(HELP, next)) return;
  audio.stop(); mode = next; selections.length = 0; currentChord = null;
  document.querySelectorAll('[name="fret-mode"]').forEach(input => { input.checked = input.value === mode; });
  ['single', 'interval', 'chord'].forEach(name => { $(`${name}-panel`).hidden = name !== mode; });
  $('interval-learning').hidden = mode !== 'interval'; $('scale-controls').hidden = mode === 'chord';
  $('selection-help').textContent = HELP[mode]; updateSelection();
}

if ($('fretboard')) {
  NOTES_SHARP.forEach((name, i) => { const option = make('option', '', name); option.value = i; $('root-select').append(option); });
  CHORD_TYPES.forEach(type => { const option = make('option', '', `${type.name} / ${type.symbol || 'maj'}`); option.value = type.id; $('chord-type').append(option); });
  $('root-select').value = '0'; $('chord-type').value = 'major';
  document.querySelectorAll('[name="fret-mode"]').forEach(input => input.addEventListener('change', () => { if (input.checked) switchMode(input.value); }));
  ['root-select', 'scale-select'].forEach(id => $(id).addEventListener('change', updateBoard));
  $('note-preference').addEventListener('change', () => clearSelection('默认拼写已更改，已清空选音，请重新选择。'));
  $('fret-scroll').addEventListener('click', event => {
    // Repainting a note can detach its badge before the click reaches this region.
    // The original event path still identifies that click as a note selection.
    const clickedNote = event.composedPath().some(node => buttons.includes(node));
    if (!clickedNote && selections.length) clearSelection();
  });
  $('fret-scroll').addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !selections.length) return;
    event.preventDefault(); clearSelection();
  });
  [0, 1].forEach(i => $(`spelling-${i + 1}`).addEventListener('change', event => {
    if (mode !== 'interval' || !selections[i]) return;
    Object.assign(selections[i], getSpellings(selections[i].midi).find(note => note.name === event.target.value)); updateSelection();
  }));
  $('chord-root-spelling').addEventListener('change', event => {
    if (mode !== 'chord' || !selections[0]) return;
    audio.stop(); Object.assign(selections[0], getSpellings(selections[0].midi).find(note => note.name === event.target.value)); updateSelection();
  });
  $('chord-type').addEventListener('change', () => { audio.stop(); updateSelection(); });
  $('clear-notes').addEventListener('click', () => clearSelection());
  $('swap-notes').addEventListener('click', () => { audio.stop(); selections.reverse(); updateSelection(); });
  $('bass-volume').addEventListener('input', () => {
    const volume = Number($('bass-volume').value); audio.setVolume(volume / 100); $('volume-value').textContent = `${volume}%`;
  });
  audio.setVolume(Number($('bass-volume').value) / 100);
  $('sound-toggle').addEventListener('click', async () => {
    const request = ++soundRequest; soundEnabled = !soundEnabled; updateSound();
    const requested = soundEnabled, enabled = await audio.setEnabled(requested);
    if (request !== soundRequest) return;
    soundEnabled = enabled; updateSound();
    if (enabled) $('sound-status').textContent = '贝斯声音已开启；点击音符试听，或在和弦模式一起弹奏。音量可在上方调节。';
    else if (!requested) $('sound-status').textContent = '声音已关闭；仍可继续探索指板。';
  });
  $('play-pair').addEventListener('click', () => {
    if (!soundEnabled || mode !== 'interval' || selections.length !== 2) return;
    audio.stop(); void audio.play(selections[0].midi); void audio.play(selections[1].midi, .65);
  });
  $('play-chord').addEventListener('click', () => {
    if (!soundEnabled || mode !== 'chord' || !currentChord) return;
    audio.stop(); void audio.playChord(currentChord.tones.map(tone => tone.midi));
  });
  document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => {
    switchMode('interval');
    const example = button.dataset.example;
    const last = example === 'augmented' ? { midi: 41, name: 'E♯2', fret: 3 } : example === 'diminished' ? { midi: 38, letter: 'E', accidental: -2, fret: 0 } : { midi: 39, name: 'D♯2', fret: 1 };
    const spelling = getSpellings(last.midi).find(note => last.name ? note.name === last.name : note.letter === last.letter && note.accidental === last.accidental);
    selections.splice(0, 2, { ...defaultSpelling(36), stringIdx: 2, fret: 3 }, { ...spelling, stringIdx: 1, fret: last.fret }); updateSelection();
  }));
  if (!audio.supported) { $('sound-toggle').disabled = true; $('sound-status').textContent = '当前浏览器不支持音频；指板探索仍可使用。'; }
  buildBoard(); switchMode('single');
}
