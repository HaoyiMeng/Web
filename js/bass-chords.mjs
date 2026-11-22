import { analyzeInterval } from './bass-theory.mjs';

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL_PITCHES = [0, 2, 4, 5, 7, 9, 11];
const accidentalText = accidental => accidental < 0 ? '♭'.repeat(-accidental) : '♯'.repeat(accidental);
const noteName = note => `${note.letter}${accidentalText(note.accidental)}${note.octave}`;
const chordType = (id, name, symbol, degrees, semitones, labels) => Object.freeze({
  id, name, symbol,
  degrees: Object.freeze(degrees),
  semitones: Object.freeze(semitones),
  labels: Object.freeze(labels),
});

/** Formula labels describe each tone's harmonic role, independent of its octave. */
export const CHORD_TYPES = Object.freeze([
  chordType('major', '大三和弦', 'maj', [1, 3, 5], [0, 4, 7], ['1', '3', '5']),
  chordType('minor', '小三和弦', 'm', [1, 3, 5], [0, 3, 7], ['1', '♭3', '5']),
  chordType('diminished', '减三和弦', 'dim', [1, 3, 5], [0, 3, 6], ['1', '♭3', '♭5']),
  chordType('augmented', '增三和弦', 'aug', [1, 3, 5], [0, 4, 8], ['1', '3', '♯5']),
  chordType('sus2', '挂二和弦', 'sus2', [1, 2, 5], [0, 2, 7], ['1', '2', '5']),
  chordType('sus4', '挂四和弦', 'sus4', [1, 4, 5], [0, 5, 7], ['1', '4', '5']),
  chordType('dominant7', '属七和弦', '7', [1, 3, 5, 7], [0, 4, 7, 10], ['1', '3', '5', '♭7']),
  chordType('major7', '大七和弦', 'maj7', [1, 3, 5, 7], [0, 4, 7, 11], ['1', '3', '5', '7']),
  chordType('minor7', '小七和弦', 'm7', [1, 3, 5, 7], [0, 3, 7, 10], ['1', '♭3', '5', '♭7']),
  chordType('half-diminished7', '半减七和弦', 'm7♭5', [1, 3, 5, 7], [0, 3, 6, 10], ['1', '♭3', '♭5', '♭7']),
  chordType('diminished7', '减七和弦', 'dim7', [1, 3, 5, 7], [0, 3, 6, 9], ['1', '♭3', '♭5', '♭♭7']),
  chordType('minor-major7', '小大七和弦', 'm(maj7)', [1, 3, 5, 7], [0, 3, 7, 11], ['1', '♭3', '5', '7']),
  chordType('major6', '大六和弦', '6', [1, 3, 5, 6], [0, 4, 7, 9], ['1', '3', '5', '6']),
  chordType('minor6', '小六和弦', 'm6', [1, 3, 5, 6], [0, 3, 7, 9], ['1', '♭3', '5', '6']),
  chordType('dominant9', '属九和弦', '9', [1, 3, 5, 7, 9], [0, 4, 7, 10, 14], ['1', '3', '5', '♭7', '9']),
  chordType('major9', '大九和弦', 'maj9', [1, 3, 5, 7, 9], [0, 4, 7, 11, 14], ['1', '3', '5', '7', '9']),
  chordType('minor9', '小九和弦', 'm9', [1, 3, 5, 7, 9], [0, 3, 7, 10, 14], ['1', '♭3', '5', '♭7', '9']),
]);

function assertMidi(midi) {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) throw new RangeError('MIDI pitch must be an integer from 0 to 127.');
}

/**
 * Spell by degree first, then find the accidental needed for its sounding pitch.
 * Thus C♯ major contains E♯, and a diminished seventh retains a seventh letter
 * even when it sounds like a sixth. No enharmonic simplification loses its role.
 */
export function buildChord(rootSpelledNote, typeId) {
  const type = CHORD_TYPES.find(candidate => candidate.id === typeId);
  if (!type) throw new RangeError(`Unknown chord type: ${typeId}`);
  // Reuse the interval model's validation and canonical spelling, without mutation.
  const root = analyzeInterval(rootSpelledNote, rootSpelledNote).lower;
  const rootPosition = root.octave * 7 + LETTERS.indexOf(root.letter);
  const tones = type.degrees.map((degree, index) => {
    const position = rootPosition + degree - 1;
    const letterIndex = ((position % 7) + 7) % 7;
    const octave = Math.floor(position / 7);
    const midi = root.midi + type.semitones[index];
    assertMidi(midi);
    const accidental = midi - ((octave + 1) * 12 + NATURAL_PITCHES[letterIndex]);
    const tone = { midi, letter: LETTERS[letterIndex], accidental, octave,
      degree, label: type.labels[index], semitones: type.semitones[index] };
    return { ...tone, name: noteName(tone) };
  });
  const rootName = root.letter + accidentalText(root.accidental);
  return { name: `${rootName} ${type.name}`, symbol: rootName + type.symbol, type, root, tones };
}

/** Project one chord tone onto any matching fretboard pitch, retaining spelling. */
export function chordToneAtMidi(tone, midi) {
  assertMidi(midi);
  const canonical = analyzeInterval(tone, tone).lower;
  const octaveShift = (midi - canonical.midi) / 12;
  if (!Number.isInteger(octaveShift)) return null;
  const projected = { ...tone, ...canonical, midi, octave: canonical.octave + octaveShift };
  return { ...projected, name: noteName(projected) };
}
