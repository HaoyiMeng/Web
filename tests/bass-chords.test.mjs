import assert from 'node:assert/strict';
import { BASS_STRINGS, defaultSpelling, getSpellings, analyzeInterval } from '../js/bass-theory.mjs';
import { CHORD_TYPES, buildChord, chordToneAtMidi } from '../js/bass-chords.mjs';

const natural = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const note = (letter, accidental = 0, octave = 2) => ({ letter, accidental, octave, midi: (octave + 1) * 12 + natural[letter] + accidental });
const toneNames = chord => chord.tones.map(tone => tone.name);
const chordAtC = id => buildChord(note('C'), id);

assert.equal(CHORD_TYPES.length, 17);
assert.equal(new Set(CHORD_TYPES.map(type => type.id)).size, CHORD_TYPES.length);
assert.deepEqual(toneNames(chordAtC('major')), ['C2', 'E2', 'G2']);
assert.deepEqual(toneNames(chordAtC('minor')), ['C2', 'E♭2', 'G2']);
assert.deepEqual(toneNames(chordAtC('diminished')), ['C2', 'E♭2', 'G♭2']);
assert.deepEqual(toneNames(chordAtC('augmented')), ['C2', 'E2', 'G♯2']);
assert.deepEqual(toneNames(chordAtC('sus2')), ['C2', 'D2', 'G2']);
assert.deepEqual(toneNames(chordAtC('sus4')), ['C2', 'F2', 'G2']);
assert.deepEqual(toneNames(chordAtC('dominant7')), ['C2', 'E2', 'G2', 'B♭2']);
assert.deepEqual(toneNames(chordAtC('major7')), ['C2', 'E2', 'G2', 'B2']);
assert.deepEqual(toneNames(chordAtC('minor7')), ['C2', 'E♭2', 'G2', 'B♭2']);
assert.deepEqual(toneNames(chordAtC('half-diminished7')), ['C2', 'E♭2', 'G♭2', 'B♭2']);
assert.deepEqual(toneNames(chordAtC('diminished7')), ['C2', 'E♭2', 'G♭2', 'B♭♭2']);
assert.deepEqual(toneNames(chordAtC('minor-major7')), ['C2', 'E♭2', 'G2', 'B2']);
assert.deepEqual(toneNames(chordAtC('major6')), ['C2', 'E2', 'G2', 'A2']);
assert.deepEqual(toneNames(chordAtC('minor6')), ['C2', 'E♭2', 'G2', 'A2']);
assert.deepEqual(toneNames(chordAtC('dominant9')), ['C2', 'E2', 'G2', 'B♭2', 'D3']);
assert.deepEqual(toneNames(chordAtC('major9')), ['C2', 'E2', 'G2', 'B2', 'D3']);
assert.deepEqual(toneNames(chordAtC('minor9')), ['C2', 'E♭2', 'G2', 'B♭2', 'D3']);
assert.equal(chordAtC('major').name, 'C 大三和弦');
assert.equal(chordAtC('major').symbol, 'Cmaj');
assert.equal(chordAtC('half-diminished7').symbol, 'Cm7♭5');

assert.deepEqual(toneNames(buildChord(note('C', 1), 'major')), ['C♯2', 'E♯2', 'G♯2']);
assert.deepEqual(toneNames(buildChord(note('B', 0, 1), 'diminished7')), ['B1', 'D2', 'F2', 'A♭2']);
assert.deepEqual(toneNames(buildChord(note('B', 1, 1), 'major7')), ['B♯1', 'D♯♯2', 'F♯♯2', 'A♯♯2']);
assert.deepEqual(toneNames(buildChord(note('C', -1), 'major')), ['C♭2', 'E♭2', 'G♭2']);
assert.deepEqual(toneNames(buildChord(note('G', 2), 'augmented')), ['G♯♯2', 'B♯♯2', 'D♯♯♯3']);

// Every supported root spelling at every fret must preserve both letter degree
// and chromatic offset for every chord type, including awkward accidentals.
for (let midi = 28; midi <= 55; midi++) {
  for (const root of getSpellings(midi)) {
    const frozenRoot = Object.freeze({ ...root });
    for (const type of CHORD_TYPES) {
      const chord = buildChord(frozenRoot, type.id);
      assert.notEqual(chord.root, frozenRoot, 'Do not mutate or alias the caller root');
      assert.equal(chord.tones.length, type.degrees.length);
      chord.tones.forEach((tone, index) => {
        const degree = type.degrees[index];
        const rootPosition = root.octave * 7 + letters.indexOf(root.letter);
        assert.equal(tone.octave * 7 + letters.indexOf(tone.letter) - rootPosition + 1, degree);
        assert.equal(tone.midi - root.midi, type.semitones[index]);
        assert.equal((tone.octave + 1) * 12 + natural[tone.letter] + tone.accidental, tone.midi);
        assert.equal(tone.degree, degree);
        assert.equal(tone.label, type.labels[index]);
        const interval = analyzeInterval(root, tone);
        assert.equal(interval.number, degree);
        assert.equal(interval.distance, type.semitones[index]);
      });
    }
  }
}

// A board tone repeats at every octave without changing its harmonic role.
const ninth = Object.freeze(chordAtC('dominant9').tones[4]);
const lowNinth = chordToneAtMidi(ninth, 38);
assert.equal(lowNinth.name, 'D2');
assert.equal(lowNinth.degree, 9);
assert.equal(lowNinth.label, '9');
assert.equal(lowNinth.semitones, 14);
assert.equal(ninth.name, 'D3');
assert.equal(chordToneAtMidi(ninth, 39), null);
assert.equal(chordToneAtMidi(ninth, 26).name, 'D1');
const bSharp = buildChord(note('B', 1, 1), 'major').tones[0];
assert.equal(chordToneAtMidi(bSharp, 48).name, 'B♯2', 'Preserve octave boundary spelling');
assert.equal(chordToneAtMidi(bSharp, 36).name, 'B♯1');
const cFlat = buildChord(note('C', -1), 'major').tones[0];
assert.equal(chordToneAtMidi(cFlat, 47).name, 'C♭3');
for (const string of BASS_STRINGS) {
  for (let fret = 0; fret <= 12; fret++) {
    const midi = string.midi + fret;
    const major = buildChord(defaultSpelling(midi), 'major');
    assert.equal(chordToneAtMidi(major.tones[0], midi).midi, midi);
    assert.ok(major.tones.some(tone => chordToneAtMidi(tone, midi)));
  }
}

assert.throws(() => buildChord(note('C'), 'unknown'));
assert.throws(() => buildChord({ ...note('C'), midi: 37 }, 'major'), /does not match/);
assert.throws(() => buildChord(defaultSpelling(127), 'major'), /MIDI/);
assert.throws(() => chordToneAtMidi(ninth, 28.5), /MIDI/);
assert.throws(() => chordToneAtMidi(ninth, -1), /MIDI/);
assert.throws(() => CHORD_TYPES[0].semitones.push(11), TypeError);
assert.throws(() => { CHORD_TYPES[0].name = 'other'; }, TypeError);
console.log('✓ Chords: 17 formulas, every bass-root spelling, seventh/ninth quality and fretboard octave projection.');
