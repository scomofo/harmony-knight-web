export const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export const FIGURENOTE_COLORS = [
  "#E53935", // C red
  "#AD1457", // C#
  "#FF6F00", // D orange
  "#6A1B9A", // D#
  "#E8C547", // E yellow (toned down for contrast on dark)
  "#2E7D32", // F green
  "#00695C", // F#
  "#1565C0", // G blue
  "#283593", // G#
  "#FF8F00", // A amber
  "#4E342E", // A#
  "#607D8B", // B blue-grey
] as const;

export type FigureNoteShape = "circle" | "square" | "triangle" | "diamond";

const FIGURENOTE_SHAPES: FigureNoteShape[] = [
  "circle",
  "circle",
  "square",
  "square",
  "triangle",
  "diamond",
  "diamond",
  "circle",
  "circle",
  "square",
  "square",
  "triangle",
];

export type IntervalQuality = "perfectConsonance" | "imperfectConsonance" | "dissonance";

export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

export function octaveOf(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

export function noteName(midi: number): string {
  return `${NOTE_NAMES[pitchClass(midi)]}${octaveOf(midi)}`;
}

export function noteLetter(midi: number): string {
  return NOTE_NAMES[pitchClass(midi)];
}

export function figureNoteColor(midi: number): string {
  return FIGURENOTE_COLORS[pitchClass(midi)];
}

export function figureNoteShape(midi: number): FigureNoteShape {
  return FIGURENOTE_SHAPES[pitchClass(midi)];
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function classifyInterval(semitones: number): IntervalQuality {
  const interval = Math.abs(semitones) % 12;
  if (interval === 0 || interval === 5 || interval === 7) {
    return "perfectConsonance";
  }
  if (interval === 3 || interval === 4 || interval === 8 || interval === 9) {
    return "imperfectConsonance";
  }
  return "dissonance";
}

export const INTERVAL_NAMES: Record<number, string> = {
  0: "Unison",
  1: "Minor 2nd",
  2: "Major 2nd",
  3: "Minor 3rd",
  4: "Major 3rd",
  5: "Perfect 4th",
  6: "Tritone",
  7: "Perfect 5th",
  8: "Minor 6th",
  9: "Major 6th",
  10: "Minor 7th",
  11: "Major 7th",
  12: "Octave",
};

export function intervalName(semitones: number): string {
  return INTERVAL_NAMES[Math.abs(semitones)] ?? `${semitones} semitones`;
}

const DIATONIC = [0, 2, 4, 5, 7, 9, 11];

export function diatonicIndex(pc: number): number {
  const i = DIATONIC.indexOf(pc);
  return i >= 0 ? i : DIATONIC.findIndex((n) => n > pc) - 0.5;
}

/** Staff steps from C4 (MIDI 60). Each diatonic step is 1. */
export function staffStepsFromC4(midi: number): number {
  const oct = octaveOf(midi);
  const pc = pitchClass(midi);
  const dia = DIATONIC.includes(pc) ? DIATONIC.indexOf(pc) : DIATONIC.findIndex((n) => n > pc);
  const octaveOffset = (oct - 4) * 7;
  return octaveOffset + (dia < 0 ? 6 : dia);
}

export const C_MAJOR = [60, 62, 64, 65, 67, 69, 71, 72];
export const A_MINOR = [57, 59, 60, 62, 64, 65, 67, 69];

export const KEYS: {
  name: string;
  tonic: string;
  accidentals: number;
  kind: "sharp" | "flat" | "none";
  isMajor: boolean;
  relative: string;
}[] = [
  { name: "C Major", tonic: "C", accidentals: 0, kind: "none", isMajor: true, relative: "A Minor" },
  {
    name: "G Major",
    tonic: "G",
    accidentals: 1,
    kind: "sharp",
    isMajor: true,
    relative: "E Minor",
  },
  {
    name: "D Major",
    tonic: "D",
    accidentals: 2,
    kind: "sharp",
    isMajor: true,
    relative: "B Minor",
  },
  {
    name: "A Major",
    tonic: "A",
    accidentals: 3,
    kind: "sharp",
    isMajor: true,
    relative: "F# Minor",
  },
  {
    name: "E Major",
    tonic: "E",
    accidentals: 4,
    kind: "sharp",
    isMajor: true,
    relative: "C# Minor",
  },
  {
    name: "B Major",
    tonic: "B",
    accidentals: 5,
    kind: "sharp",
    isMajor: true,
    relative: "G# Minor",
  },
  {
    name: "F# Major",
    tonic: "F#",
    accidentals: 6,
    kind: "sharp",
    isMajor: true,
    relative: "D# Minor",
  },
  {
    name: "Db Major",
    tonic: "Db",
    accidentals: 5,
    kind: "flat",
    isMajor: true,
    relative: "Bb Minor",
  },
  {
    name: "Ab Major",
    tonic: "Ab",
    accidentals: 4,
    kind: "flat",
    isMajor: true,
    relative: "F Minor",
  },
  {
    name: "Eb Major",
    tonic: "Eb",
    accidentals: 3,
    kind: "flat",
    isMajor: true,
    relative: "C Minor",
  },
  {
    name: "Bb Major",
    tonic: "Bb",
    accidentals: 2,
    kind: "flat",
    isMajor: true,
    relative: "G Minor",
  },
  { name: "F Major", tonic: "F", accidentals: 1, kind: "flat", isMajor: true, relative: "D Minor" },
];

export const CIRCLE_OF_FIFTHS = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];

export const TONIC_MIDI: Record<string, number> = {
  C: 60,
  G: 67,
  D: 62,
  A: 69,
  E: 64,
  B: 71,
  "F#": 66,
  Db: 61,
  Ab: 68,
  Eb: 63,
  Bb: 70,
  F: 65,
};

export function majorTriad(rootMidi: number): [number, number, number] {
  return [rootMidi, rootMidi + 4, rootMidi + 7];
}

export function minorTriad(rootMidi: number): [number, number, number] {
  return [rootMidi, rootMidi + 3, rootMidi + 7];
}

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function pick<T>(arr: readonly T[], rng: () => number = Math.random): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

/** Order sharps appear in a key signature (F# C# G# D# A# E# B#). */
export const SHARP_ORDER = ["F#", "C#", "G#", "D#", "A#", "E#", "B#"] as const;
/** Order flats appear in a key signature (Bb Eb Ab Db Gb Cb Fb). */
export const FLAT_ORDER = ["Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb"] as const;

/**
 * Staff steps from C4 for each accidental in a treble-clef key signature,
 * in the order they are written.
 */
export const TREBLE_SHARP_STEPS = [10, 7, 11, 8, 5, 9, 6] as const; // F5 C5 G5 D5 A4 E5 B4
export const TREBLE_FLAT_STEPS = [6, 9, 5, 8, 4, 7, 3] as const; // B4 E5 A4 D5 G4 C5 F4
/** A bass-clef staff line sits 12 diatonic steps below the treble line in the same position (G2 vs E4). */
export const BASS_CLEF_STEP_OFFSET = 12;

export function keySignatureAccidentals(key: (typeof KEYS)[number]): string[] {
  if (key.kind === "none") return [];
  const order = key.kind === "sharp" ? SHARP_ORDER : FLAT_ORDER;
  return order.slice(0, key.accidentals) as unknown as string[];
}

/** Neighbours on the circle plus the relative minor — the closely related keys. */
export function closelyRelatedKeys(tonic: string): string[] {
  const i = CIRCLE_OF_FIFTHS.indexOf(tonic);
  if (i < 0) return [];
  const left = CIRCLE_OF_FIFTHS[(i + 11) % 12]!;
  const right = CIRCLE_OF_FIFTHS[(i + 1) % 12]!;
  return [left, right];
}

export const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11, 12] as const;
export const NATURAL_MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10, 12] as const;

export type RomanNumeral = "I" | "ii" | "iii" | "IV" | "V" | "vi" | "vii°";

export const ROMAN_NUMERALS: RomanNumeral[] = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];

/** Diatonic triad on a scale degree (0-based) of a major key, as MIDI notes. */
export function diatonicTriad(tonicMidi: number, degree: number, octave = 0): number[] {
  const scale = [0, 2, 4, 5, 7, 9, 11];
  const step = (n: number) => scale[n % 7]! + 12 * Math.floor(n / 7);
  return [step(degree), step(degree + 2), step(degree + 4)].map((s) => tonicMidi + s + octave * 12);
}

export type CadenceKind = "Perfect (V–I)" | "Plagal (IV–I)" | "Half (I–V)" | "Deceptive (V–vi)";

export const CADENCES: { name: CadenceKind; degrees: [number, number]; feel: string }[] = [
  { name: "Perfect (V–I)", degrees: [4, 0], feel: "A full stop. Tension resolves home." },
  { name: "Plagal (IV–I)", degrees: [3, 0], feel: "The Amen. Gentle, settled, no leading tone." },
  {
    name: "Half (I–V)",
    degrees: [0, 4],
    feel: "A comma. It stops on the dominant and wants more.",
  },
  {
    name: "Deceptive (V–vi)",
    degrees: [4, 5],
    feel: "The surprise. You expected home; you got the relative minor.",
  },
];

/** Voice a triad close to a target register so progressions do not leap. */
export function voiceNear(triad: number[], center = 64): number[] {
  return triad
    .map((m) => {
      let n = m;
      while (n < center - 7) n += 12;
      while (n > center + 7) n -= 12;
      return n;
    })
    .sort((a, b) => a - b);
}
