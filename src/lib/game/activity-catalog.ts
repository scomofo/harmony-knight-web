import { noteName } from "./music.ts";
import type {
  ChordTask,
  HarmonyListeningTask,
  LessonActivity,
  NoteChoice,
  RhythmTask,
  VoiceTask,
} from "./activities.ts";
import { LISTENING_ACTIVITIES } from "./listening-activities.ts";

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
  instruction: `Build ${title}. Choose ${solution.length} notes from the palette. The octave numbers show exactly where each note should sit, so you can focus on the chord shape.`,
  hint,
  explanation: hint,
  choices: pool,
  solution: [solution],
  initial: [[]],
  context,
});
const harmonyListen = (
  id: string,
  title: string,
  instruction: string,
  clips: HarmonyListeningTask["clips"],
  answer: number,
  explanation: string,
  writtenClue: string,
): HarmonyListeningTask => ({
  kind: "harmony-listening",
  id,
  title,
  instruction,
  clips,
  options: clips.map((clip) => clip.label),
  solution: [[answer]],
  initial: [[]],
  hint: writtenClue,
  explanation,
  writtenClue,
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
  explanation: `That pattern works. ${instruction}`,
});
const voice = (
  id: string,
  title: string,
  rule: VoiceTask["rule"],
  bass: number[],
  solution: number[],
  instruction: string,
  options: Partial<
    Pick<VoiceTask, "choices" | "positions" | "chords" | "initial" | "hideReference">
  > = {},
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
  ...LISTENING_ACTIVITIES,
  "1-alphabet": {
    title: "Continue the alphabet",
    tasks: [
      voice(
        "1-alphabet",
        "Continue the alphabet",
        "exact",
        [48, 48, 48],
        [69, 71, 72],
        "Choose A4, B4, C5: letter names repeat after G.",
        {
          choices: choices(
            [...new Set([...[69, 71, 72], 60, 61, 66])].sort((a, b) => a - b),
            { 63: "Eb4" },
          ),
          hideReference: true,
          positions: ["Note 1", "Note 2", "Note 3"],
          initial: [[60, 60, 60]],
        },
      ),
    ],
  },
  "1-staff": {
    title: "Read upward by steps",
    tasks: [
      voice(
        "1-staff",
        "Read upward by steps",
        "exact",
        [48, 48, 48],
        [64, 65, 67],
        "Match the first three notes in the picture: E4 F4 G4. Each neighbouring staff line or space advances one letter.",
        {
          choices: choices(
            [...new Set([...[64, 65, 67], 60, 61, 66])].sort((a, b) => a - b),
            { 63: "Eb4" },
          ),
          hideReference: true,
          positions: ["Note 1", "Note 2", "Note 3"],
          initial: [[60, 60, 60]],
        },
      ),
    ],
  },
  "1-landmarks": {
    title: "Find three landmarks",
    tasks: [
      voice(
        "1-landmarks",
        "Find three landmarks",
        "exact",
        [48, 48, 48],
        [60, 67, 53],
        "Choose middle C (C4), treble G (G4), bass F (F3). These are anchors, not a rising melody.",
        {
          choices: choices(
            [...new Set([...[60, 67, 53], 60, 61, 66])].sort((a, b) => a - b),
            { 63: "Eb4" },
          ),
          hideReference: true,
          positions: ["Note 1", "Note 2", "Note 3"],
          initial: [[60, 60, 60]],
        },
      ),
    ],
  },
  "1-steps": {
    title: "Compare half and whole steps",
    tasks: [
      voice(
        "1-steps",
        "Compare half and whole steps",
        "exact",
        [48, 48, 48],
        [64, 65, 67],
        "Build E4 F4 G4. E to F is a half step; F to G is a whole step.",
        {
          choices: choices(
            [...new Set([...[64, 65, 67], 60, 61, 66])].sort((a, b) => a - b),
            { 63: "Eb4" },
          ),
          hideReference: true,
          positions: ["Note 1", "Note 2", "Note 3"],
          initial: [[60, 60, 60]],
        },
      ),
    ],
  },
  "3-major": {
    title: "Build C major",
    tasks: [
      voice(
        "3-major",
        "Build C major",
        "exact",
        [48, 48, 48, 48, 48, 48, 48, 48],
        [60, 62, 64, 65, 67, 69, 71, 72],
        "Build C D E F G A B C. E\u2013F and B\u2013C are the half steps.",
        {
          choices: choices(
            [...new Set([...[60, 62, 64, 65, 67, 69, 71, 72], 60, 61, 66])].sort((a, b) => a - b),
            { 63: "Eb4" },
          ),
          hideReference: true,
          positions: [
            "Note 1",
            "Note 2",
            "Note 3",
            "Note 4",
            "Note 5",
            "Note 6",
            "Note 7",
            "Note 8",
          ],
          initial: [[60, 60, 60, 60, 60, 60, 60, 60]],
        },
      ),
    ],
  },
  "3-signatures": {
    title: "Apply one sharp",
    tasks: [
      voice(
        "3-signatures",
        "Apply one sharp",
        "exact",
        [48, 48, 48, 48, 48, 48, 48, 48],
        [67, 69, 71, 72, 74, 76, 78, 79],
        "Build G A B C D E F-sharp G. The key signature changes F to F-sharp.",
        {
          choices: choices(
            [...new Set([...[67, 69, 71, 72, 74, 76, 78, 79], 60, 61, 66])].sort((a, b) => a - b),
            { 63: "Eb4" },
          ),
          hideReference: true,
          positions: [
            "Note 1",
            "Note 2",
            "Note 3",
            "Note 4",
            "Note 5",
            "Note 6",
            "Note 7",
            "Note 8",
          ],
          initial: [[60, 60, 60, 60, 60, 60, 60, 60]],
        },
      ),
    ],
  },
  "3-circle": {
    title: "Travel by fifths",
    tasks: [
      voice(
        "3-circle",
        "Travel by fifths",
        "exact",
        [48, 48, 48],
        [60, 67, 74],
        "Choose C4 G4 D5: successive fifths, neighbouring keys on the circle.",
        {
          choices: choices(
            [...new Set([...[60, 67, 74], 60, 61, 66])].sort((a, b) => a - b),
            { 63: "Eb4" },
          ),
          hideReference: true,
          positions: ["Note 1", "Note 2", "Note 3"],
          initial: [[60, 60, 60]],
        },
      ),
    ],
  },
  "3-minor": {
    title: "Create a leading tone",
    tasks: [
      voice(
        "3-minor",
        "Create a leading tone",
        "exact",
        [48, 48, 48, 48, 48, 48, 48, 48],
        [69, 71, 72, 74, 76, 77, 80, 81],
        "Build A B C D E F G-sharp A: harmonic minor raises degree seven.",
        {
          choices: choices(
            [...new Set([...[69, 71, 72, 74, 76, 77, 80, 81], 60, 61, 66])].sort((a, b) => a - b),
            { 63: "Eb4" },
          ),
          hideReference: true,
          positions: [
            "Note 1",
            "Note 2",
            "Note 3",
            "Note 4",
            "Note 5",
            "Note 6",
            "Note 7",
            "Note 8",
          ],
          initial: [[60, 60, 60, 60, 60, 60, 60, 60]],
        },
      ),
    ],
  },
  "4-intervals": {
    title: "Spell a minor third",
    tasks: [
      voice(
        "4-intervals",
        "Spell a minor third",
        "exact",
        [48, 48],
        [60, 63],
        "Choose C4 then Eb4: three letters inclusive and three semitones apart.",
        {
          choices: choices(
            [...new Set([...[60, 63], 60, 61, 66])].sort((a, b) => a - b),
            { 63: "Eb4" },
          ),
          hideReference: true,
          positions: ["Note 1", "Note 2"],
          initial: [[60, 60]],
        },
      ),
    ],
  },
  "4-tension": {
    title: "Compare interval spacing",
    tasks: [
      harmonyListen(
        "tension",
        "Hear two colours",
        "Compare both clips. Which has half-step spacing? This asks about spacing, not whether the sound is good or bad.",
        [
          { label: "Clip A", chords: [[60, 67]] },
          { label: "Clip B", chords: [[60, 61]] },
        ],
        1,
        "Clip B contains C and Db, a half step apart. Context still shapes how settled an interval feels.",
        "Clip A is a fifth; clip B is a half step.",
      ),
    ],
  },

  "0-pulse": {
    title: "Build a steady pulse",
    tasks: [
      rhythm(
        "pulse",
        "Four steady beats",
        "Give each numbered beat one clear tap. Leave the in-between '&' spaces empty so you can hear the difference between the pulse and the subdivisions.",
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
        "Start once on beat 1 and let that sound occupy the whole bar. Do not add another attack on beats 2, 3 or 4.",
        ["1", "2", "3", "4"],
        [[0]],
        1,
      ),
      rhythm(
        "halves",
        "Two half notes in 4/4",
        "Hear the bar as two equal halves: begin one note on 1, then the next on 3.",
        ["1", "2", "3", "4"],
        [[0, 2]],
        1,
      ),
      rhythm(
        "quarters",
        "Four quarter notes in 4/4",
        "Now let every beat speak: start a new note on 1, 2, 3 and 4.",
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
        "Keep all six eighth notes even, but make 1, 3 and 5 feel heavier. That turns the six subdivisions into three groups of two—the feel of 3/4.",
        ["1", "2", "3", "4", "5", "6"],
        [[0, 2, 4]],
        0.5,
        ["Accents"],
        true,
      ),
      rhythm(
        "compound",
        "6/8: 3 + 3",
        "Keep the very same six subdivisions, then move the weight to 1 and 4. Now you should feel two larger groups of three—the usual shape of 6/8.",
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
        "Feel each dotted quarter as three eighth-note spaces. Start on 1, then on the '&' after 2; repeat the same long-short shape from beat 3.",
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
        "Let beats 1 and 2 pass in silence. Enter on the '&' after 2, then hold through beat 3 instead of striking again. That offbeat arrival is the point of the exercise.",
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
    title: "Hear the ending, then build it",
    tasks: [
      harmonyListen(
        "hear-closed-open",
        "Which ending sounds more finished?",
        "Hear both short progressions. One lands on tonic; the other stops on the dominant and leaves the phrase asking for more.",
        [
          {
            label: "Example A",
            chords: [
              [55, 59, 62],
              [60, 64, 67],
            ],
          },
          {
            label: "Example B",
            chords: [
              [48, 52, 55],
              [53, 57, 60],
              [55, 59, 62],
            ],
          },
        ],
        0,
        "Example A is the stronger close: G major resolves to C major. Example B stops on G, so it sounds open.",
        "Listen to the final chord. C feels like arrival here; G still carries dominant tension.",
      ),
      chord(
        "pac",
        "the final C chord of a strong V–I cadence",
        [60, 64, 67, 72],
        "Choose C4–E4–G4–C5. Hear how the G chord in the context wants to settle onto this root-position C chord with tonic on top.",
        choices([59, 60, 62, 64, 65, 67, 69, 72]),
        [[55, 59, 62, 67]],
      ),
      chord(
        "plagal",
        "the final C chord after F major",
        [60, 64, 67],
        "Choose C4–E4–G4 after the F chord. This IV–I motion settles differently from V–I; listen for the softer kind of arrival.",
        choices([60, 64, 65, 67, 69, 72]),
        [[53, 57, 60]],
      ),
      chord(
        "half",
        "the G chord that leaves the phrase open",
        [55, 59, 62],
        "Choose G3–B3–D4 after the C and F context. Ending on V is a half cadence: it sounds like a comma because the dominant still wants somewhere to go.",
        choices([53, 55, 57, 59, 60, 62, 64]),
        [
          [48, 52, 55],
          [53, 57, 60],
        ],
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
    title: "Repair voices that fuse together",
    tasks: [
      voice(
        "repair-fifths",
        "Repair C–G followed by D–A",
        "consonant",
        [60, 62],
        [67, 65],
        "The starting line moves in parallel perfect fifths. Change the second upper note so the intervals stay consonant but the two parts keep more independence.",
        { initial: [[67, 69]] },
      ),
      voice(
        "repair-octaves",
        "Repair C–C followed by D–D",
        "consonant",
        [60, 62],
        [72, 71],
        "The starting line doubles the bass in parallel octaves. Keep the first octave, then choose a consonant second note that does not simply copy the bass upward.",
        {
          choices: choices([60, 62, 64, 65, 67, 69, 71, 72, 74]),
          initial: [[72, 74]],
        },
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
  "7-related": {
    title: "Move into a nearby key",
    tasks: [
      chord(
        "dominant-key",
        "G major, one-note away from C major",
        [55, 59, 62],
        "Choose G3–B3–D4. C major and G major share most of their material; the new key mainly introduces F# when it needs to establish G strongly.",
        choices([53, 55, 57, 59, 60, 62, 64, 66]),
        [[48, 52, 55]],
      ),
      chord(
        "relative-minor",
        "A minor, C major's relative minor",
        [57, 60, 64],
        "Choose A3–C4–E4. Relative major and minor share a key signature, so the change of home comes from emphasis and cadence rather than a new collection of notes.",
        choices([55, 57, 59, 60, 62, 64, 65]),
        [[48, 52, 55]],
      ),
    ],
  },
  "7-pivot": {
    title: "Hear a new home, then use a pivot",
    tasks: [
      harmonyListen(
        "hear-modulation",
        "Which example really establishes G as home?",
        "Both examples visit D7 and G. Listen past that moment: which one continues to make G feel like the new tonic instead of immediately returning to C?",
        [
          {
            label: "Example A",
            chords: [
              [48, 52, 55],
              [57, 60, 64],
              [50, 54, 57, 60],
              [55, 59, 62],
              [55, 59, 62],
            ],
          },
          {
            label: "Example B",
            chords: [
              [48, 52, 55],
              [57, 60, 64],
              [50, 54, 57, 60],
              [55, 59, 62],
              [48, 52, 55],
            ],
          },
        ],
        0,
        "Example A keeps G in focus after D7–G, so the new tonic has time to settle. Example B returns straight to C.",
        "A modulation needs more than one altered chord. Listen for continued emphasis after the arrival.",
      ),
      chord(
        "pivot-am",
        "A minor as vi in C and ii in G",
        [57, 60, 64],
        "A3–C4–E4 belongs to both keys. Hear it first as vi after C, then imagine the same notes reinterpreted as ii on the way toward D7–G.",
        choices([55, 57, 59, 60, 62, 64, 66]),
        [[48, 52, 55]],
      ),
      chord(
        "pivot-c",
        "C major as I in C and IV in G",
        [60, 64, 67],
        "C4–E4–G4 can be home in C or become IV once G takes over as tonic. The chord does not change—its job changes because the surrounding harmony does.",
        choices([57, 59, 60, 62, 64, 66, 67]),
        [[55, 59, 62]],
      ),
    ],
  },
  "7-tonicization": {
    title: "Spotlight a chord without leaving home",
    tasks: [
      chord(
        "v-of-vi",
        "E major, V of vi in C major",
        [52, 56, 59],
        "Choose E3–G#3–B3. G# is outside C major, but it points directly to A minor. If the music returns to C soon after, A minor was tonicized rather than established as a new key.",
        choices([52, 55, 56, 57, 59, 60, 64], { 56: "G#3" }),
        [
          [48, 52, 55],
          [57, 60, 64],
        ],
      ),
      chord(
        "return-home",
        "C major after the brief A-minor spotlight",
        [60, 64, 67],
        "Choose C4–E4–G4. Returning convincingly to C after E–Am helps you hear the earlier A minor as a local emphasis, not a full modulation.",
        choices([57, 59, 60, 62, 64, 67, 69]),
        [
          [52, 56, 59],
          [57, 60, 64],
        ],
      ),
    ],
  },
  "7-secondary": {
    title: "Hear the extra pull, then build it",
    tasks: [
      harmonyListen(
        "hear-secondary",
        "Which progression gives G an extra dominant pull?",
        "Both examples move toward G and then C. One uses ordinary ii–V–I in C; the other changes D minor to D7 so F# leans into G.",
        [
          {
            label: "Example A",
            chords: [
              [50, 53, 57],
              [55, 59, 62],
              [60, 64, 67],
            ],
          },
          {
            label: "Example B",
            chords: [
              [50, 54, 57, 60],
              [55, 59, 62],
              [60, 64, 67],
            ],
          },
        ],
        1,
        "Example B uses D7. Its F# is the leading tone of G, so G briefly receives dominant-style emphasis before the music returns to C.",
        "Listen for the brighter chromatic note in the first chord of one example: F# points upward to G.",
      ),
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
    title: "Hear seventh-chord colour, then build it",
    tasks: [
      harmonyListen(
        "hear-major-vs-dominant",
        "Which C chord has the dominant-seventh bite?",
        "Hear Cmaj7 and C7 side by side. Both start with a C-major triad; the seventh is the only note that changes.",
        [
          { label: "Example A", chords: [[60, 64, 67, 71]] },
          { label: "Example B", chords: [[60, 64, 67, 70]] },
        ],
        1,
        "Example B is C7: Bb creates the minor seventh above C. Example A uses B natural and is Cmaj7.",
        "Focus on the top note: B natural gives the smoother major-seventh colour; Bb gives the dominant-seventh sound.",
      ),
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
    title: "Hear borrowed colour, then build it",
    tasks: [
      harmonyListen(
        "hear-borrowed-iv",
        "Which middle chord is borrowed from C minor?",
        "Both progressions begin and end on C major. In one, the middle chord is F major; in the other, A drops to Ab and the chord becomes F minor.",
        [
          {
            label: "Example A",
            chords: [
              [48, 52, 55],
              [53, 57, 60],
              [48, 52, 55],
            ],
          },
          {
            label: "Example B",
            chords: [
              [48, 52, 55],
              [53, 56, 60],
              [48, 52, 55],
            ],
          },
        ],
        1,
        "Example B borrows F minor from the parallel key, C minor. C remains home; only the colour of the middle chord changes.",
        "Listen to the third of the F chord: A natural belongs to F major; Ab turns it into borrowed F minor.",
      ),
      chord(
        "iv",
        "F minor, borrowed iv in C",
        [53, 56, 60],
        "F3–Ab3–C4 lowers A to Ab. Hear that one altered note change the colour while C can still remain the tonic.",
        choices([53, 55, 56, 57, 59, 60, 62], { 56: "Ab3" }),
        [
          [48, 52, 55],
          [45, 48, 52],
        ],
      ),
      chord(
        "neapolitan",
        "Db major, the Neapolitan in C",
        [61, 65, 68],
        "Choose Db4–F4–Ab4. The flattened second degree gives this chord its distinctive colour; in tonal writing it often moves toward V rather than becoming a new tonic.",
        choices([60, 61, 62, 64, 65, 67, 68], { 61: "Db4", 68: "Ab4" }),
        [[60, 64, 67]],
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
  "10-post-tonal": {
    title: "Transform one small pitch-class idea",
    tasks: [
      voice(
        "transpose-cell",
        "Transpose C–C#–E up two semitones",
        "exact",
        [60, 61, 64],
        [62, 63, 66],
        "Treat the notes as pitch classes first: [0,1,4] becomes [2,3,6]. In this register that is D4–D#4–F#4. The shape stays the same because every pitch moved by the same amount.",
        {
          choices: choices([60, 61, 62, 63, 64, 65, 66], { 61: "C#4", 63: "D#4", 66: "F#4" }),
          positions: ["0 + 2", "1 + 2", "4 + 2"],
        },
      ),
      voice(
        "retrograde-cell",
        "Reverse C–C#–E",
        "exact",
        [60, 61, 64],
        [64, 61, 60],
        "Retrograde changes order, not pitch content: [0,1,4] becomes [4,1,0]. Play the same three pitch classes backward as E4–C#4–C4.",
        {
          choices: choices([60, 61, 62, 63, 64, 65, 66], { 61: "C#4", 63: "D#4", 66: "F#4" }),
          positions: ["Last becomes first", "Middle stays middle", "First becomes last"],
        },
      ),
    ],
  },
};

export function activityForUnit(id: string): LessonActivity | undefined {
  return LESSON_ACTIVITIES[id];
}
