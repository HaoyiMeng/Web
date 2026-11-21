import assert from 'node:assert/strict';
import { BASS_STRINGS, NOTES_SHARP, getSpellings, defaultSpelling, analyzeInterval } from '../js/bass-theory.mjs';

const natural = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const note = (letter, accidental = 0, octave = 2) => ({ letter, accidental, octave, midi: (octave + 1) * 12 + natural[letter] + accidental });
const interval = (a, b, symbol, name, semitones) => {
  const actual = analyzeInterval(a, b);
  assert.equal(actual.symbol, symbol);
  assert.equal(actual.name, name);
  assert.equal(actual.semitones, semitones);
  const reversed = analyzeInterval(b, a);
  assert.equal(reversed.name, name, 'Click order must not change normalized interval quality');
  assert.equal(reversed.distance, actual.distance);
  return actual;
};

assert.deepEqual(BASS_STRINGS.map(string => string.midi), [43, 38, 33, 28]);
assert.equal(NOTES_SHARP.length, 12);
for (const midi of Array.from({ length: 128 }, (_, i) => i)) {
  const spellings = getSpellings(midi);
  assert.ok(spellings.length >= 2);
  assert.equal(new Set(spellings.map(spelling => spelling.name)).size, spellings.length);
  for (const spelling of spellings) {
    assert.equal((spelling.octave + 1) * 12 + natural[spelling.letter] + spelling.accidental, midi);
    assert.ok(Math.abs(spelling.accidental) <= 2);
  }
}
assert.equal(defaultSpelling(28).name, 'E1', 'Bass open E must sound E1, not guitar E2');
assert.equal(defaultSpelling(39).name, 'D♯2');
assert.equal(defaultSpelling(39, 'flat').name, 'E♭2');
assert.equal(defaultSpelling(36, 'flat').name, 'C2', 'Natural notes remain natural');
assert.deepEqual(getSpellings(36).map(spelling => spelling.name), ['C2', 'B♯1', 'D♭♭2']);
assert.ok(getSpellings(35).some(spelling => spelling.name === 'C♭2'));
assert.ok(getSpellings(40).some(spelling => spelling.name === 'F♭2'));

const C = note('C');
interval(C, note('D', 1), 'A2', '增二度', 3);
interval(C, note('E', -1), 'm3', '小三度', 3);
interval(C, note('E'), 'M3', '大三度', 4);
interval(C, note('E', 1), 'A3', '增三度', 5);
interval(C, note('E', -2), 'd3', '减三度', 2);
interval(C, note('F'), 'P4', '纯四度', 5);
interval(C, note('F', 1), 'A4', '增四度', 6);
interval(C, note('G', -1), 'd5', '减五度', 6);
interval(C, note('G'), 'P5', '纯五度', 7);
interval(C, note('A', -1), 'm6', '小六度', 8);
interval(C, note('B'), 'M7', '大七度', 11);
interval(C, C, 'P1', '纯一度', 0);
interval(C, note('C', 1), 'A1', '增一度', 1);
interval(C, note('C', 0, 3), 'P8', '纯八度', 12);
interval(C, note('C', -1, 3), 'd8', '减八度', 11);
interval(C, note('D', 0, 3), 'M9', '大九度', 14);
const tenth = interval(C, note('E', -1, 3), 'm10', '小十度', 15);
assert.equal(tenth.simpleNumber, 3);
assert.equal(tenth.expectedSemitones, 16);
interval(note('E', 0, 1), note('G', 0, 3), 'm17', '小十七度', 27);

const descending = analyzeInterval(note('G'), C);
assert.equal(descending.direction, '下行');
assert.equal(descending.distance, 7);
assert.equal(analyzeInterval(C, note('G')).direction, '上行');
assert.equal(analyzeInterval(C, C).direction, '同音高');

const enharmonicUnison = interval(note('B', 1, 1), C, 'd2', '减二度', 0);
assert.equal(enharmonicUnison.number, 2, 'Octave spelling must survive enharmonic octave boundaries');
assert.equal(enharmonicUnison.direction, '同音高');
interval(note('E'), note('F', -1), 'd2', '减二度', 0);
interval(note('B', 0, 1), note('C', -1), 'd2', '减二度', 0);
interval(C, note('D', 2), 'AA2', '倍增二度', 4);
interval(note('C', 1), note('E', -2), 'dd3', '倍减三度', 1);
const crossed = interval(note('B', 2, 1), note('C', -1), 'ddd2', '三重减二度', -2);
assert.equal(crossed.distance, 2, 'Crossed spellings need signed theory distance and absolute acoustic distance');
assert.equal(crossed.direction, '下行');
assert.ok(crossed.explanation.some(line => line.includes('有向半音数')));
assert.deepEqual(analyzeInterval(note('B', 1, 1), note('D')).letterPath, ['B1', 'C2', 'D2']);

for (const invalid of [-1, 128, 28.5, NaN, '28']) assert.throws(() => getSpellings(invalid));
assert.throws(() => defaultSpelling(28, 'other'));
assert.throws(() => analyzeInterval({ ...C, midi: 37 }, note('G')), /does not match/);
assert.throws(() => analyzeInterval({ ...C, letter: 'H' }, note('G')));
assert.throws(() => analyzeInterval(null, C));
console.log('✓ Bass intervals: spelling, all MIDI pitches, qualities, compounds, direction and enharmonic edge cases.');
