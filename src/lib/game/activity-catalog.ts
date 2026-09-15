import { noteName } from "./music.ts";
import type { ChordTask, LessonActivity, NoteChoice, RhythmTask, VoiceTask } from "./activities.ts";

const choices = (midis: number[], spelling: Record<number, string> = {}): NoteChoice[] =>
  midis.map((midi) => ({ midi, label: spelling[midi] ?? noteName(midi) }));
const chromatic = choices(
  Array.from({ length: 13 }, (_, i) => 60 + i),
  { 63: "Eb4", 66: "Gb4", 70: "Bb4" },
);
const white = choices([60, 62, 64, 65, 67, 69, 71, 72]);
const eighths = ["1", "1 &", "2", "2 &", "3", "3 &", "4", "4 &"];
const chord = (
  id: string,
  title: string,
  solution: number[],
  hint: string,
  pool = chromatic,
  context?: number[][],
): ChordTask => ({
  kind: "chord",
  id,
  title,
  instruction: `Build ${title}. Select ${solution.length} notes from the palette; octave numbers fix the register.`,
  hint,
  explanation: hint,
  choices: pool,
  solution: [solution],
  initial: [[]],
  context,
});
const rhythm = (
  id: string,
  title: string,
  instruction: string,
  labels: string[],
  solution: number[][],
  stepBeats: number,
  rows = ["Pattern"],
  subdivisionPulse = false,
): RhythmTask => ({
  kind: "rhythm",
  id,
  title,
  instruction,
  labels,
  solution,
  rows,
  stepBeats,
  subdivisionPulse,
  initial: rows.map(() => []),
  hint: instruction,
  explanation: `${title}: the attacks now match. ${instruction}`,
});
const voice = (
  id: string,
  title: string,
  rule: VoiceTask["rule"],
  bass: number[],
  solution: number[],
  instruction: string,
  options: Partial<Pick<VoiceTask, "choices" | "positions" | "chords" | "initial">> = {},
): VoiceTask => ({
  kind: "voice",
  id,
  title,
  rule,
  bass,
  solution: [solution],
  choices: white,
  positions: bass.map((_, i) => `Beat ${i + 1}`),
  initial: [bass.map(() => 60)],
  instruction,
  hint: instruction,
  explanation: instruction,
  ...options,
});

/** Fixed, authored miniatures keep saved drafts stable. Open-ended tasks accept multiple valid answers. */
export const LESSON_ACTIVITIES: Record<string, LessonActivity> = {
  "0-pulse": {
    title: "Build a steady pulse",
    tasks: [
      rhythm(
        "pulse",
        "Four steady beats",
        "Place an attack on every numbered beat. Leave the in-between '&' subdivisions empty.",
        eighths,
        [[0, 2, 4, 6]],
        0.5,
      ),
    ],
  },
  "2-duration": {
    title: "Give each note its time",
    tasks: [
      rhythm(
        "whole",
        "One whole note in 4/4",
        "Start on beat 1 and hold for the whole bar: only one attack.",
        ["1", "2", "3", "4"],
        [[0]],
        1,
      ),
      rhythm(
        "halves",
        "Two half notes in 4/4",
        "Start a new note every two beats, on 1 and 3.",
        ["1", "2", "3", "4"],
        [[0, 2]],
        1,
      ),
      rhythm(
        "quarters",
        "Four quarter notes in 4/4",
        "Start a new note on each numbered beat.",
        ["1", "2", "3", "4"],
        [[0, 1, 2, 3]],
        1,
      ),
    ],
  },
  "2-meter": {
    title: "Shape the accents",
    tasks: [
      rhythm(
        "simple",
        "3/4: 2 + 2 + 2",
        "The quiet pulse plays all six eighth notes. Mark an accent at the start of each group of two: subdivisions 1, 3 and 5.",
        ["1", "2", "3", "4", "5", "6"],
        [[0, 2, 4]],
        0.5,
        ["Accents"],
        true,
      ),
      rhythm(
        "compound",
        "6/8: 3 + 3",
        "Keep the same six eighth notes. Accent the start of each group of three: subdivisions 1 and 4.",
        ["1", "2", "3", "4", "5", "6"],
        [[0, 3]],
        0.5,
        ["Accents"],
        true,
      ),
    ],
  },
  "2-dots": {
    title: "Build a dotted rhythm",
    tasks: [
      rhythm(
        "dotted",
        "Dotted quarter, eighth — twice",
        "A dotted quarter spans three eighth-note cells. Attack on 1, the '&' after 2, 3, and the '&' after 4.",
        eighths,
        [[0, 3, 4, 7]],
        0.5,
      ),
    ],
  },
  "2-syncopation": {
    title: "Enter off the beat",
    tasks: [
      rhythm(
        "tied",
        "An offbeat entry tied across 3",
        "Rest until the '&' after 2, then make one attack and hold to the end of the bar. Do not re-attack on beat 3.",
        eighths,
        [[3]],
        0.5,
      ),
    ],
  },
  "4-triads": {
    title: "Build four triad colours",
    tasks: [
      chord(
        "major",
        "C major",
        [60, 64, 67],
        "C4–E4–G4: a major third and a perfect fifth above C.",
      ),
      chord("minor", "C minor", [60, 63, 67], "Lower the third: C4–Eb4–G4."),
      chord("diminished", "C diminished", [60, 63, 66], "Lower the third and fifth: C4–Eb4–Gb4."),
      chord("augmented", "C augmented", [60, 64, 68], "Raise the fifth of major: C4–E4–G#4."),
    ],
  },
  "4-inversions": {
    title: "Keep the chord, move the bass",
    tasks: [
      chord(
        "root",
        "C major in root position",
        [60, 64, 67],
        "Put C4 lowest, with E4 and G4 above it.",
        choices([60, 64, 67, 72, 76]),
      ),
      chord(
        "first",
        "C/E in first inversion",
        [64, 67, 72],
        "Put E4 lowest, with G4 and C5 above it. The root is still C.",
        choices([60, 64, 67, 72, 76]),
      ),
      chord(
        "second",
        "C/G in second inversion",
        [67, 72, 76],
        "Put G4 lowest, with C5 and E5 above it.",
        choices([60, 64, 67, 72, 76]),
      ),
    ],
  },
  "5-function": {
    title: "Build the same job in two keys",
    tasks: [
      chord(
        "v-c",
        "V in C major",
        [55, 59, 62],
        "G is degree 5 of C: choose G3–B3–D4.",
        choices([53, 55, 57, 59, 60, 62, 64]),
        [
          [48, 52, 55],
          [53, 57, 60],
        ],
      ),
      chord(
        "v-g",
        "V in G major",
        [62, 66, 69],
        "D is degree 5 of G: choose D4–F#4–A4.",
        choices([60, 62, 64, 65, 66, 67, 69, 71]),
        [
          [55, 59, 62],
          [60, 64, 67],
        ],
      ),
    ],
  },
  "5-cadences": {
    title: "Complete an authentic cadence",
    tasks: [
      chord(
        "pac",
        "the final C chord, with C4 in the bass and C5 on top",
        [60, 64, 67, 72],
        "Choose C4–E4–G4–C5. Root-position G–C with tonic on top of the final I makes a perfect authentic cadence.",
        choices([59, 60, 62, 64, 65, 67, 69, 72]),
        [[55, 59, 62, 67]],
      ),
    ],
  },
  "5-open-endings": {
    title: "Choose the unexpected ending",
    tasks: [
      chord(
        "deceptive",
        "vi after V in C major",
        [57, 60, 64],
        "G major leads unexpectedly to A minor: A3–C4–E4. This is a deceptive cadence.",
        choices([55, 57, 59, 60, 62, 64, 65]),
        [[55, 59, 62]],
      ),
    ],
  },
  "5-melody": {
    title: "Write a chord-tone melody",
    tasks: [
      voice(
        "phrase",
        "Five notes over C–Am–F–G–C",
        "chordTones",
        [48, 45, 41, 43, 48],
        [64, 64, 65, 62, 60],
        "Choose one chord tone at each position. Several melodies work; hear how yours fits the harmony.",
        {
          positions: ["C", "Am", "F", "G", "C"],
          chords: [
            [48, 52, 55],
            [45, 48, 52],
            [41, 45, 48],
            [43, 47, 50],
            [48, 52, 55],
          ],
        },
      ),
    ],
  },
  "6-voices": {
    title: "Give two voices room",
    tasks: [
      voice(
        "consonances",
        "A short first-species fragment",
        "consonant",
        [60, 62, 64],
        [64, 65, 67],
        "Choose a consonance above each bass note. Avoid parallel fifths and octaves, and similar motion into a perfect interval. This is a fragment, without the opening and closing requirements of a full composition.",
        { initial: [[67, 69, 71]] },
      ),
    ],
  },
  "6-parallels": {
    title: "Repair parallel fifths",
    tasks: [
      voice(
        "repair",
        "C–G followed by D–A",
        "consonant",
        [60, 62],
        [67, 65],
        "The starting line has parallel fifths. Change an upper note so both vertical intervals remain consonant without moving in parallel fifths or octaves.",
        { initial: [[67, 69]] },
      ),
    ],
  },
  "6-motion": {
    title: "Move the voices apart",
    tasks: [
      voice(
        "contrary",
        "Bass rising, upper voice falling",
        "contrary",
        [60, 62, 64],
        [72, 71, 67],
        "At every change, the bass rises and the upper voice must fall. Keep each pair consonant.",
        { initial: [[67, 69, 71]] },
      ),
    ],
  },
  "6-decoration": {
    title: "Connect consonances",
    tasks: [
      voice(
        "passing",
        "A weak passing tone over C",
        "passing",
        [60, 60, 60],
        [64, 65, 67],
        "Use consonances on the two strong positions and a dissonance between them, moving by step in one direction. E4–F4–G4 is one solution.",
        { positions: ["Strong beat", "Weak half-beat", "Next strong beat"] },
      ),
    ],
  },
  "7-pivot": {
    title: "Build a shared chord",
    tasks: [
      chord(
        "pivot",
        "A minor as a pivot from C to G",
        [57, 60, 64],
        "A3–C4–E4 belongs to both keys: vi in C and ii in G. A later cadence must establish G as home.",
        choices([55, 57, 59, 60, 62, 64, 66]),
        [[48, 52, 55]],
      ),
    ],
  },
  "7-secondary": {
    title: "Aim a dominant at G",
    tasks: [
      chord(
        "secondary-triad",
        "V/V in C major",
        [62, 66, 69],
        "Choose D4–F#4–A4. F# leads toward the target G.",
        choices([60, 62, 64, 65, 66, 67, 69, 72]),
      ),
      chord(
        "secondary-seventh",
        "V7/V in C major",
        [62, 66, 69, 72],
        "Add C5 to D4–F#4–A4 for D7. Its seventh C tends down to B as F# rises to G.",
        choices([60, 62, 64, 65, 66, 67, 69, 72]),
      ),
    ],
  },
  "8-sevenths": {
    title: "Build the seventh-chord family",
    tasks: [
      chord("major7", "Cmaj7", [60, 64, 67, 71], "C4–E4–G4–B4: major triad, major seventh."),
      chord("dominant7", "C7", [60, 64, 67, 70], "C4–E4–G4–Bb4: major triad, minor seventh."),
      chord("minor7", "Cm7", [60, 63, 67, 70], "C4–Eb4–G4–Bb4: minor triad, minor seventh."),
      chord(
        "half-diminished",
        "Cm7b5",
        [60, 63, 66, 70],
        "C4–Eb4–Gb4–Bb4: diminished triad, minor seventh.",
      ),
    ],
  },
  "8-borrowed": {
    title: "Borrow from the parallel minor",
    tasks: [
      chord(
        "iv",
        "F minor, borrowed iv in C",
        [53, 56, 60],
        "F3–Ab3–C4 lowers A to Ab. This iv comes from C minor while the larger key can stay C major.",
        choices([53, 55, 56, 57, 59, 60, 62], { 56: "Ab3" }),
        [
          [48, 52, 55],
          [45, 48, 52],
        ],
      ),
    ],
  },
  "8-odd-meter": {
    title: "Group an uneven meter",
    tasks: [
      rhythm(
        "seven",
        "7/8 grouped 2 + 2 + 3",
        "The quiet pulse plays seven eighth notes. Accent the first note of each group: subdivisions 1, 3 and 5.",
        ["1", "2", "3", "4", "5", "6", "7"],
        [[0, 2, 4]],
        0.5,
        ["Accents"],
        true,
      ),
      rhythm(
        "five",
        "5/4 grouped 3 + 2",
        "Accent quarter-note beats 1 and 4. All five quarter notes keep the same spacing.",
        ["1", "2", "3", "4", "5"],
        [[0, 3]],
        1,
        ["Accents"],
        true,
      ),
    ],
  },
  "8-polyrhythm": {
    title: "Build three against two",
    tasks: [
      rhythm(
        "three-two",
        "3:2 on one shared grid",
        "Place three equally spaced attacks on 1, 3, 5 in the top row, and two on 1, 4 in the bottom row. Both rows cover the same time span.",
        ["1", "2", "3", "4", "5", "6"],
        [
          [0, 2, 4],
          [0, 3],
        ],
        1 / 3,
        ["Three-part", "Two-part"],
      ),
    ],
  },
  "9-line": {
    title: "Shape an independent line",
    tasks: [
      voice(
        "contour",
        "An eight-note melody",
        "line",
        Array(8).fill(60),
        [60, 62, 64, 67, 65, 64, 62, 60],
        "Begin and end on C4, with one highest note heard once. Keep leaps within a fifth, and follow every leap larger than a step with a step in the opposite direction. This checks the melody's contour; it does not add a counterpoint bass.",
        { positions: Array.from({ length: 8 }, (_, i) => `Note ${i + 1}`) },
      ),
    ],
  },
  "9-close": {
    title: "Close in contrary motion",
    tasks: [
      voice(
        "close",
        "A sixth expanding to an octave",
        "cadence",
        [62, 60],
        [71, 72],
        "The bass D4 falls to C4. Find a consonant upper note that rises by step to C5, forming the final octave.",
        { positions: ["Penultimate", "Final"] },
      ),
    ],
  },
  "9-moving-species": {
    title: "Control a passing dissonance",
    tasks: [
      voice(
        "passing-fragment",
        "Strong–weak–strong",
        "passing",
        [60, 60, 60],
        [64, 65, 67],
        "Put consonances on the strong beats and a passing dissonance on the weak half-beat. Move by step in the same direction through all three notes. This is a second-species fragment, not a complete composition.",
        { positions: ["Strong beat", "Weak half-beat", "Next strong beat"] },
      ),
    ],
  },
  "9-suspensions": {
    title: "Prepare, suspend, resolve",
    tasks: [
      voice(
        "four-three",
        "A 4–3 suspension",
        "suspension",
        [53, 55, 55],
        [60, 60, 59],
        "Prepare a consonance above F3. Hold that same upper note as G3 enters, making a fourth. Resolve down by step to a third above G3. Playback sustains the preparation into the suspension.",
        {
          choices: choices([57, 59, 60, 62, 64, 65, 67]),
          positions: ["Preparation", "Suspension (tied)", "Resolution"],
          initial: [[60, 62, 60]],
        },
      ),
    ],
  },
  "10-fugue": {
    title: "Transpose a subject",
    tasks: [
      voice(
        "real-answer",
        "A real answer a fifth higher",
        "exact",
        [60, 62, 64, 60],
        [67, 69, 71, 67],
        "Transpose C4–D4–E4–C4 up seven semitones. Keep the order and every melodic interval. The reference row is the subject, not a simultaneous bass.",
        { positions: ["C4 + 7", "D4 + 7", "E4 + 7", "C4 + 7"] },
      ),
    ],
  },
  "10-development": {
    title: "Invert a melodic idea",
    tasks: [
      voice(
        "inversion",
        "Reverse interval directions around C",
        "exact",
        [60, 62, 64, 60],
        [60, 58, 56, 60],
        "C4–D4–E4–C4 moves +2, +2, −4 semitones. Starting on C4, reverse these directions to −2, −2, +4. This is melodic inversion, not chord inversion.",
        {
          choices: choices([56, 58, 60, 62, 64], { 56: "Ab3", 58: "Bb3" }),
          positions: ["Start on C4", "Down 2", "Down 2", "Up 4"],
        },
      ),
    ],
  },
  "10-modes": {
    title: "Make D sound like home",
    tasks: [
      voice(
        "dorian",
        "A four-note Dorian phrase",
        "dorian",
        [50, 50, 50, 50],
        [65, 71, 69, 62],
        "Choose four notes, using F4 and B4 somewhere and ending on D4. F supplies the minor third; B natural supplies Dorian's raised sixth. Hear the phrase over a D bass.",
        { choices: choices([62, 64, 65, 67, 69, 71, 72, 74]), initial: [[62, 62, 62, 62]] },
      ),
    ],
  },
};

export function activityForUnit(id: string): LessonActivity | undefined {
  return LESSON_ACTIVITIES[id];
}
