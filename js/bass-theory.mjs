// Sounding pitches: standard four-string bass, from the top row to the bottom.
export const BASS_STRINGS = Object.freeze([
  { name: 'G', midi: 43 }, { name: 'D', midi: 38 },
  { name: 'A', midi: 33 }, { name: 'E', midi: 28 },
].map(Object.freeze));

export const NOTES_SHARP = Object.freeze(['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']);
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL_PITCHES = [0, 2, 4, 5, 7, 9, 11];
const BASE_SEMITONES = [0, 2, 4, 5, 7, 9, 11];
const DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const accidentalText = accidental => accidental < 0 ? '♭'.repeat(-accidental) : '♯'.repeat(accidental);

function chineseNumber(value) {
  if (value < 10) return DIGITS[value];
  if (value < 100) return (value < 20 ? '' : DIGITS[Math.floor(value / 10)]) + '十' + (value % 10 ? DIGITS[value % 10] : '');
  return String(value);
}

function assertMidi(midi) {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) throw new RangeError('MIDI pitch must be an integer from 0 to 127.');
}

function makeNote(midi, letter, accidental, octave) {
  return { midi, letter, accidental, octave, name: `${letter}${accidentalText(accidental)}${octave}` };
}

/** All enharmonic spellings using naturals, single and double accidentals. */
export function getSpellings(midi) {
  assertMidi(midi);
  const spellings = [];
  const soundingOctave = Math.floor(midi / 12) - 1;
  for (let octave = soundingOctave - 1; octave <= soundingOctave + 1; octave++) {
    LETTERS.forEach((letter, index) => {
      const accidental = midi - ((octave + 1) * 12 + NATURAL_PITCHES[index]);
      if (Math.abs(accidental) <= 2) spellings.push(makeNote(midi, letter, accidental, octave));
    });
  }
  return spellings.sort((a, b) => Math.abs(a.accidental) - Math.abs(b.accidental) || b.accidental - a.accidental);
}

export function defaultSpelling(midi, preference = 'sharp') {
  if (preference !== 'sharp' && preference !== 'flat') throw new RangeError('Spelling preference must be sharp or flat.');
  const spellings = getSpellings(midi);
  return spellings.find(note => note.accidental === 0)
    || spellings.find(note => note.accidental === (preference === 'flat' ? -1 : 1))
    || spellings[0];
}

function normalizeNote(note) {
  if (!note || typeof note !== 'object') throw new TypeError('A spelled note is required.');
  assertMidi(note.midi);
  const index = LETTERS.indexOf(note.letter);
  if (index === -1 || !Number.isInteger(note.accidental) || !Number.isInteger(note.octave)) throw new TypeError('A note needs a letter, integer accidental and octave.');
  const expected = (note.octave + 1) * 12 + NATURAL_PITCHES[index] + note.accidental;
  if (expected !== note.midi) throw new RangeError('The written note does not match its sounding MIDI pitch.');
  return makeNote(note.midi, note.letter, note.accidental, note.octave);
}

function qualityFor(simpleNumber, difference) {
  const perfectFamily = [1, 4, 5].includes(simpleNumber);
  if (difference === 0) return { quality: perfectFamily ? '纯' : '大', qualitySymbol: perfectFamily ? 'P' : 'M' };
  if (!perfectFamily && difference === -1) return { quality: '小', qualitySymbol: 'm' };
  const augmented = difference > 0;
  const repetitions = augmented ? difference : -difference - (perfectFamily ? 0 : 1);
  const prefix = repetitions === 1 ? '' : repetitions === 2 ? '倍' : `${chineseNumber(repetitions)}重`;
  return { quality: prefix + (augmented ? '增' : '减'), qualitySymbol: (augmented ? 'A' : 'd').repeat(repetitions) };
}

/**
 * Name the interval from the lower written staff position to the upper one.
 * Reversing the clicks changes sounding direction, not the interval's name.
 * At the same staff position, put the lower sounding pitch first (A1, etc.).
 * Crossed enharmonic spellings keep a signed written semitone count; taking an
 * absolute value here would misname rare diminished and multiply diminished intervals.
 */
export function analyzeInterval(first, second) {
  const a = normalizeNote(first), b = normalizeNote(second);
  const position = note => note.octave * 7 + LETTERS.indexOf(note.letter);
  const [lower, upper] = [a, b].sort((x, y) => position(x) - position(y) || x.midi - y.midi);
  const number = position(upper) - position(lower) + 1;
  const simpleNumber = (number - 1) % 7 + 1;
  const octaves = Math.floor((number - 1) / 7);
  const semitones = upper.midi - lower.midi;
  const expectedSemitones = BASE_SEMITONES[simpleNumber - 1] + octaves * 12;
  const difference = semitones - expectedSemitones;
  const { quality, qualitySymbol } = qualityFor(simpleNumber, difference);
  const numberName = chineseNumber(number) + '度';
  const name = quality + numberName;
  const baselineName = ([1, 4, 5].includes(simpleNumber) ? '纯' : '大') + numberName;
  const distance = Math.abs(b.midi - a.midi);
  const direction = b.midi > a.midi ? '上行' : b.midi < a.midi ? '下行' : '同音高';
  const letterPath = Array.from({ length: number }, (_, step) => {
    const staffPosition = position(lower) + step;
    const letterIndex = ((staffPosition % 7) + 7) % 7;
    return LETTERS[letterIndex] + Math.floor(staffPosition / 7);
  });
  const explanation = [
    `按谱面字母从 ${lower.name} 数到 ${upper.name}（首尾都计入）：${letterPath.join(' · ')}，共 ${number} 个字母位置，所以是${numberName}。升降号不改变度数。`,
    difference === 0
      ? `${lower.name} 到 ${upper.name} 是 ${semitones} 个半音，恰好等于${baselineName}的 ${expectedSemitones} 个半音，所以是${name}。`
      : `${baselineName}的基准是 ${expectedSemitones} 个半音；按字母从 ${lower.name} 到 ${upper.name} 实际为 ${semitones} 个半音，比基准${difference > 0 ? '多' : '少'} ${Math.abs(difference)} 个半音，所以是${name}。${difference < 0 && ![1, 4, 5].includes(simpleNumber) ? '大音程少 1 个半音为小音程，再少 1 个半音才是减音程。' : ''}`,
    `本次点击 ${a.name} → ${b.name}：${direction}${distance ? ` ${distance} 个半音` : '（0 个半音）'}。音程名称依据谱面拼写，点击顺序决定听到的方向。`,
  ];
  if (semitones < 0) explanation.push('这组等音异名出现了谱面顺序与实际音高相反的情况，因此拼写计算使用有向半音数；实际听到的距离仍取绝对值。');
  if (distance === 0 && number > 1) explanation.push('这两个音在十二平均律中音高相同，但字母位置不同，因此不能只按 0 个半音一律称为纯一度。');
  return {
    name, symbol: qualitySymbol + number, quality, qualitySymbol,
    number, simpleNumber, semitones, distance, direction, lower, upper,
    expectedSemitones, difference, letterPath, explanation,
  };
}
