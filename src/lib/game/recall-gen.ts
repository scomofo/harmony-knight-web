import {
  CADENCES,
  CIRCLE_OF_FIFTHS,
  INTERVAL_NAMES,
  KEYS,
  MAJOR_SCALE,
  ROMAN_NUMERALS,
  TONIC_MIDI,
  classifyInterval,
  closelyRelatedKeys,
  diatonicTriad,
  keySignatureAccidentals,
  majorTriad,
  minorTriad,
  pick,
  pitchClass,
  shuffle,
  type CadenceKind,
} from "./music.ts";
import { RHYTHMS } from "./exercises.ts";
import { noteValueName } from "./rhythm.ts";
import { rngFor } from "./rng.ts";
import type { CheckQuestion } from "./lessons.ts";

/**
 * Generated recall checks for due review (Phase 1 of generated practice).
 *
 * When a completed unit comes due, the learner is re-asked its concept with a
 * fresh pair of questions instead of the authored pair they have already
 * answered. Every generated answer is *derived* from the verified theory
 * core (`music.ts`) or the audited exercise families' own data — never
 * hand-written per item — and every unit's scope is capped at what that unit
 * has taught, using the same caps the exercise families already encode.
 *
 * A unit generates only when a verified generator family matches its concept.
 * The units NOT in this registry keep their authored checks at review:
 *   0-pulse, 1-alphabet, 1-staff, 1-landmarks, 1-steps, 2-syncopation,
 *   4-inversions, 5-melody, 6-voices, 6-parallels, 6-motion, 6-decoration,
 *   7-pivot, 7-tonicization, 7-secondary, 8-sevenths, 8-extensions,
 *   8-borrowed, 9-line, 9-close, 9-moving-species, 9-suspensions,
 *   10-fugue, 10-development, 10-post-tonal
 * (no clean verified family exists for their concepts — pitch-class sets,
 * species rules, seventh-chord spelling and the like are derivable in
 * principle, but no audited family generates them, so their coverage stays
 * authored until a family exists). recall-gen.test.ts pins this list.
 *
 * Pairs are a pure function of (unit, review round): the seed is
 * hash(unitId, reviewCount), both already persisted, so the screen, the
 * answer validator and the scheduler all derive the identical pair with no
 * new stored state, and the pair is stable across a mid-review refresh.
 * Consecutive rounds are guaranteed not to repeat the identical pair.
 */

type Rng = () => number;
type Form = (rng: Rng) => CheckQuestion;

export type RecallGenerator = {
  /** The verified exercise family this unit's generation is built on. */
  family: string;
  /** The taught-scope cap applied, in words (pinned by tests). */
  scope: string;
  forms: Form[];
};

/* ------------------------------------------------------------ helpers */

function mcq(
  rng: Rng,
  prompt: string,
  answer: string,
  distractors: string[],
  why: string,
): CheckQuestion {
  const wrong = [...new Set(distractors)].filter((d) => d !== answer);
  return { prompt, answer, why, options: shuffle([answer, ...wrong], rng) };
}

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Spell the pitch class reached by moving `letterSteps` letter names from `fromLetter`. */
export function spellNote(fromLetter: string, letterSteps: number, targetPc: number): string {
  const letter = LETTERS[(LETTERS.indexOf(fromLetter) + letterSteps) % 7]!;
  const diff = (((targetPc - NATURAL_PC[letter]!) % 12) + 12) % 12;
  const accidental =
    diff === 0 ? "" : diff === 1 ? "#" : diff === 11 ? "b" : diff === 2 ? "##" : "bb";
  return `${letter}${accidental}`;
}

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
const majorName = (tonic: string) => `${tonic} major`;
const minorName = (tonic: string) => `${tonic} minor`;

/** "4 beats" / "1 beat" / "Half a beat" for a length in quarter-note beats. */
export function beatsLabel(beats: number): string {
  if (beats === 0.5) return "Half a beat";
  if (beats === 1) return "1 beat";
  return `${beats} beats`;
}

const NOTE_VALUES = [4, 3, 2, 1.5, 1, 0.5]; // whole, dotted half, half, dotted quarter, quarter, eighth

/* ------------------------------------------------------- Level 0: sensory */

const pitchForms: Form[] = [
  (rng) => {
    const faster = rng() < 0.5;
    return mcq(
      rng,
      `A tone vibrates ${faster ? "faster" : "slower"} than it did a moment ago. It sounds…`,
      faster ? "Higher" : "Lower",
      [faster ? "Lower" : "Higher"],
      "Pitch is how high or low a sound sits. Faster vibration sounds higher; slower vibration sounds lower.",
    );
  },
  (rng) => {
    const up = rng() < 0.5;
    return mcq(
      rng,
      `A singer slides ${up ? "up to a higher" : "down to a lower"} note. Her voice is now vibrating…`,
      up ? "More quickly" : "More slowly",
      [up ? "More slowly" : "More quickly", "At exactly the same rate"],
      "Higher pitch means faster vibration. Sliding up speeds the vibration up; sliding down slows it down.",
    );
  },
  (rng) => {
    const high = rng() < 0.5;
    const louder = rng() < 0.5;
    return mcq(
      rng,
      `A ${high ? "high" : "low"} note is played ${louder ? "much louder" : "much more softly"}. What happens to its pitch?`,
      "It stays the same",
      ["It becomes higher", "It becomes lower"],
      "Loudness and pitch are separate qualities. Making a note louder or softer does not move it up or down.",
    );
  },
];

const dynamicsForms: Form[] = [
  (rng) => {
    const marking = pick(["p", "f"], rng);
    return mcq(
      rng,
      `The marking ${marking} means a note should be played…`,
      marking === "p" ? "Softly" : "Loudly",
      [marking === "p" ? "Loudly" : "Softly", "Quickly"],
      "p is short for piano, meaning soft; f is short for forte, meaning loud. The marking changes the size of the sound, not its speed.",
    );
  },
  (rng) => {
    const louder = rng() < 0.5;
    return mcq(
      rng,
      `Which marking asks for the ${louder ? "louder" : "softer"} sound?`,
      louder ? "f (forte)" : "p (piano)",
      [louder ? "p (piano)" : "f (forte)", "They ask for the same loudness"],
      "Of the two markings in this lesson, f (forte) asks for loud and p (piano) asks for soft.",
    );
  },
  (rng) => {
    const first = pick(["p", "f"], rng);
    const other = first === "p" ? "f" : "p";
    return mcq(
      rng,
      `A note is marked ${first}. It is played again marked ${other}, at the same pitch. What has changed?`,
      "Only the loudness",
      ["The pitch", "The speed"],
      "Dynamics are about how loud the sound is. Changing the marking changes the energy, while the pitch stays where it was.",
    );
  },
];

const TIMBRE_PAIRS: [string, string][] = [
  ["A piano", "a trumpet"],
  ["A flute", "a guitar"],
  ["A violin", "a clarinet"],
  ["A cello", "a trumpet"],
  ["A guitar", "an oboe"],
];

const timbreForms: Form[] = [
  (rng) => {
    const [a, b] = pick(TIMBRE_PAIRS, rng);
    return mcq(
      rng,
      `${a} and ${b} play the same note at the same loudness. What can still differ?`,
      "Their timbre — the character of the sound",
      ["Their pitch", "Their loudness"],
      "Timbre is the fingerprint of a sound: the blend of overtones and attack that lets you tell instruments apart even when pitch and loudness match.",
    );
  },
  (rng) =>
    mcq(
      rng,
      "Timbre is the quality of a sound that lets you…",
      "Tell two instruments apart on the same note",
      ["Hear how high a note is", "Hear how loud a note is"],
      "Pitch tells you how high, loudness tells you how big. Timbre is the character that identifies the instrument itself.",
    ),
];

/* ------------------------------------------------------- Level 2: rhythm */

const durationForms: Form[] = [
  (rng) => {
    const value = pick(NOTE_VALUES, rng);
    const others = shuffle(
      NOTE_VALUES.filter((v) => v !== value),
      rng,
    ).slice(0, 3);
    return mcq(
      rng,
      `In 4/4, a ${noteValueName(value)} note lasts for how many quarter-note beats?`,
      beatsLabel(value),
      others.map(beatsLabel),
      `A ${noteValueName(value)} note lasts ${beatsLabel(value).toLowerCase()}. The whole bar of 4/4 holds four quarter-note beats.`,
    );
  },
  (rng) => {
    const value = pick([4, 2, 1, 0.5], rng);
    const count = 4 / value;
    return mcq(
      rng,
      `How many ${noteValueName(value)} notes fill one bar of 4/4?`,
      String(count),
      ["1", "2", "4", "8"].filter((c) => c !== String(count)),
      `Each ${noteValueName(value)} note lasts ${beatsLabel(value).toLowerCase()}, so ${count} of them fill the bar's four beats.`,
    );
  },
  (rng) => {
    const value = pick([2, 1, 1.5, 0.5], rng);
    const total = value * 2;
    return mcq(
      rng,
      `Two ${noteValueName(value)} notes in a row last for how many quarter-note beats altogether?`,
      beatsLabel(total),
      [beatsLabel(value), beatsLabel(total + 1), beatsLabel(total - 0.5)],
      `One ${noteValueName(value)} note lasts ${beatsLabel(value).toLowerCase()}, so two of them last ${beatsLabel(total).toLowerCase()}.`,
    );
  },
];

const dotForms: Form[] = [
  (rng) => {
    const dotted = pick([3, 1.5], rng);
    const base = dotted === 3 ? 2 : 1;
    return mcq(
      rng,
      `A dotted ${noteValueName(base)} note lasts for how many quarter-note beats?`,
      beatsLabel(dotted),
      [beatsLabel(base), beatsLabel(dotted + 1), beatsLabel(base * 2)],
      `A dot adds half of the note's own length: a ${noteValueName(base)} note (${beatsLabel(base).toLowerCase()}) grows by ${beatsLabel(dotted - base).toLowerCase()} to ${beatsLabel(dotted).toLowerCase()}.`,
    );
  },
  (rng) =>
    mcq(
      rng,
      "A dot written after a note…",
      "Adds half of the note's own length",
      ["Adds one full beat, whatever the note", "Doubles the note's length"],
      "A dot stretches a note by half of itself: a dotted half note is 2 + 1 = 3 beats, and a dotted quarter is 1 + ½ = 1½ beats.",
    ),
  (rng) => {
    const [aName, a, bName, b] = pick(
      [
        ["dotted quarter", 1.5, "eighth", 0.5],
        ["dotted half", 3, "quarter", 1],
        ["dotted quarter", 1.5, "quarter", 1],
        ["dotted half", 3, "eighth", 0.5],
      ] as const,
      rng,
    );
    return mcq(
      rng,
      `A ${aName} note plus a ${bName} note adds up to how many quarter-note beats?`,
      beatsLabel(a + b),
      [beatsLabel(a), beatsLabel(b), beatsLabel(a + b + 0.5)],
      `The ${aName} note lasts ${beatsLabel(a).toLowerCase()} and the ${bName} note lasts ${beatsLabel(b).toLowerCase()} — ${beatsLabel(a + b).toLowerCase()} together.`,
    );
  },
];

const METER_FEELS: Record<string, string> = {
  "6/8": "Two dotted-quarter beats",
  "3/4": "Three quarter-note beats",
  "2/4": "Two quarter-note beats",
  "4/4": "Four quarter-note beats",
};

/** Family patterns whose beats actually fill their bar (a fragment pattern like the 1.5-beat "Waltz eighths" cannot be described as a whole bar). */
const FULL_BAR_PATTERNS = RHYTHMS.filter(
  (r) => r.beats.reduce((a, b) => a + b, 0) === Number(r.meter[0]),
);

const meterForms: Form[] = [
  (rng) => {
    const row = pick(FULL_BAR_PATTERNS, rng);
    const description =
      row.beats.length > 2 && row.beats.every((b) => b === row.beats[0])
        ? `${row.beats.length} ${noteValueName(row.beats[0]!)} notes`
        : row.beats.map((b) => `${noteValueName(b)} note`).join(", ");
    const total = row.beats.reduce((a, b) => a + b, 0);
    return mcq(
      rng,
      `One full bar goes: ${description}. Which meter is it in?`,
      row.meter,
      ["2/4", "3/4", "4/4"],
      `The bar adds up to ${beatsLabel(total).toLowerCase()} — that is the ${row.name.toLowerCase()} pattern in ${row.meter}. ${row.body}`,
    );
  },
  (rng) => {
    const meter = pick(Object.keys(METER_FEELS), rng);
    const why =
      meter === "6/8"
        ? "Six eighth notes group into two larger beats of three eighths each — two dotted quarters."
        : meter === "3/4"
          ? "Three quarter beats per bar, with the weight on the first: ONE two three."
          : meter === "2/4"
            ? "Two quarter beats per bar — the left-right of a march."
            : "Four quarter beats per bar — the most common grouping of all.";
    return mcq(
      rng,
      `${meter} is usually felt as…`,
      METER_FEELS[meter]!,
      Object.values(METER_FEELS),
      why,
    );
  },
  (rng) =>
    mcq(
      rng,
      "A waltz — ONE two three, ONE two three — is in which meter?",
      "3/4",
      ["2/4", "4/4"],
      "Waltz patterns live in 3/4: three quarter beats to the bar, with the weight on the first beat.",
    ),
];

/* ------------------------------------------- Level 3: scales, signatures, circle */

const KEYS_UP_TO_2 = KEYS.filter((k) => k.isMajor && k.accidentals <= 2);
const KEYS_UP_TO_4 = KEYS.filter((k) => k.isMajor && k.accidentals <= 4);
const keyLabel = (name: string) => name.replace(" Major", " major");

const majorScaleForms: Form[] = [
  (rng) => {
    const boundary = 1 + Math.floor(rng() * 7); // gap between degree `boundary` and `boundary + 1`
    const half = MAJOR_SCALE[boundary]! - MAJOR_SCALE[boundary - 1]! === 1;
    return mcq(
      rng,
      `In a major scale, between the ${ORDINALS[boundary - 1]} and ${ORDINALS[boundary]} notes there is a…`,
      half ? "Half step" : "Whole step",
      [half ? "Whole step" : "Half step"],
      `The major pattern is whole, whole, half, whole, whole, whole, half — the half steps fall between the 3rd–4th and 7th–8th notes. Between the ${ORDINALS[boundary - 1]} and ${ORDINALS[boundary]} the gap is a ${half ? "half" : "whole"} step.`,
    );
  },
  (rng) => {
    const key = pick(KEYS_UP_TO_2, rng);
    const degree = 2 + Math.floor(rng() * 6); // 2..7
    const tonicMidi = TONIC_MIDI[key.tonic]!;
    const spellDegree = (d: number) =>
      spellNote(key.tonic[0]!, d - 1, pitchClass(tonicMidi + MAJOR_SCALE[d - 1]!));
    const answer = spellDegree(degree);
    const others = shuffle(
      [1, 2, 3, 4, 5, 6, 7].filter((d) => d !== degree),
      rng,
    ).slice(0, 3);
    return mcq(
      rng,
      `In ${majorName(key.tonic)}, the ${ORDINALS[degree - 1]} note of the scale is…`,
      answer,
      others.map(spellDegree),
      `${majorName(key.tonic)} runs ${[1, 2, 3, 4, 5, 6, 7].map(spellDegree).join(" ")} — every major scale follows the same step pattern, starting on ${key.tonic}.`,
    );
  },
];

const signatureForms: Form[] = [
  (rng) => {
    const key = pick(
      KEYS_UP_TO_4.filter((k) => k.accidentals > 0),
      rng,
    );
    const word = `${key.accidentals} ${key.kind}${key.accidentals === 1 ? "" : "s"}`;
    return mcq(
      rng,
      `Which major key has ${word}?`,
      keyLabel(key.name),
      shuffle(
        KEYS_UP_TO_4.filter((k) => k.name !== key.name),
        rng,
      )
        .slice(0, 3)
        .map((k) => keyLabel(k.name)),
      `${key.name} has ${word}: ${keySignatureAccidentals(key).join(", ")}. Its relative minor is ${key.relative.replace(/ Minor$/, " minor")}.`,
    );
  },
  (rng) => {
    const key = pick(KEYS_UP_TO_4, rng);
    const answer =
      key.kind === "none"
        ? "None"
        : `${key.accidentals} ${key.kind}${key.accidentals === 1 ? "" : "s"}`;
    const distractors = shuffle(
      [
        "None",
        "1 sharp",
        "2 sharps",
        "1 flat",
        "2 flats",
        "3 sharps",
        "3 flats",
        "4 sharps",
        "4 flats",
      ].filter((d) => d !== answer),
      rng,
    ).slice(0, 3);
    return mcq(
      rng,
      `How many sharps or flats are in the key signature of ${keyLabel(key.name)}?`,
      answer,
      distractors,
      answer === "None"
        ? "C major is the open plain — no sharps, no flats."
        : `${key.name} takes the first ${key.accidentals} of the ${key.kind} order: ${keySignatureAccidentals(key).join(", ")}.`,
    );
  },
  (rng) => {
    const key = pick(
      KEYS_UP_TO_4.filter((k) => k.accidentals >= 2),
      rng,
    );
    const accs = keySignatureAccidentals(key);
    const other = pick(
      KEYS_UP_TO_4.filter((k) => k.name !== key.name && k.accidentals >= 1),
      rng,
    );
    return mcq(
      rng,
      `The key signature of ${keyLabel(key.name)} contains, in order…`,
      accs.join(", "),
      [[...accs].reverse().join(", "), keySignatureAccidentals(other).join(", ")],
      `${key.kind === "sharp" ? "Sharps" : "Flats"} are always written in the same order — ${key.kind === "sharp" ? "F# C# G# D# A# E# B#" : "Bb Eb Ab Db Gb Cb Fb"} — and ${key.name} takes the first ${key.accidentals}.`,
    );
  },
];

const circleForms: Form[] = [
  (rng) => {
    const key = pick(KEYS_UP_TO_4, rng);
    const i = CIRCLE_OF_FIFTHS.indexOf(key.tonic);
    const at = (offset: number) => CIRCLE_OF_FIFTHS[(i + offset + 12) % 12]!;
    const pair = (a: number, b: number) => `${at(a)} and ${at(b)}`;
    return mcq(
      rng,
      `Which two major keys sit beside ${key.tonic} on the circle of fifths?`,
      pair(-1, 1),
      [pair(1, 2), pair(-2, -1), pair(2, -2)],
      `On the circle, ${key.tonic} sits between ${at(-1)} and ${at(1)}. Neighbours on the circle differ by only one note in the key signature.`,
    );
  },
  (rng) => {
    const key = pick(KEYS_UP_TO_4, rng);
    const i = CIRCLE_OF_FIFTHS.indexOf(key.tonic);
    const at = (offset: number) => CIRCLE_OF_FIFTHS[(i + offset + 12) % 12]!;
    const clockwise = rng() < 0.5;
    const answer = clockwise ? at(1) : at(-1);
    return mcq(
      rng,
      `Moving ${clockwise ? "clockwise around the circle of fifths — up a fifth" : "anticlockwise around the circle of fifths — down a fifth"} from ${key.tonic} major leads to…`,
      majorName(answer),
      [majorName(clockwise ? at(-1) : at(1)), majorName(at(2)), majorName(at(-2))],
      `Each clockwise step around the circle rises a perfect fifth and adds one sharp (or removes one flat): ${key.tonic} → ${at(1)} that way, and ${key.tonic} → ${at(-1)} the other way.`,
    );
  },
];

/** Minor keys whose raised 7th spells cleanly (natural letter, # or none). */
const MINOR_RAISE_POOL: { minor: string; majorTonic: string }[] = [
  { minor: "A", majorTonic: "C" },
  { minor: "E", majorTonic: "G" },
  { minor: "B", majorTonic: "D" },
  { minor: "D", majorTonic: "F" },
  { minor: "G", majorTonic: "Bb" },
  { minor: "C", majorTonic: "Eb" },
];

const minorForms: Form[] = [
  (rng) => {
    const entry = pick(MINOR_RAISE_POOL, rng);
    const tonicMidi = TONIC_MIDI[entry.majorTonic]! - 3;
    const tonicPc = pitchClass(tonicMidi);
    const raised = spellNote(entry.minor, 6, (tonicPc + 11) % 12);
    const natural = spellNote(entry.minor, 6, (tonicPc + 10) % 12);
    const sixth = spellNote(entry.minor, 5, (tonicPc + 8) % 12);
    return mcq(
      rng,
      `In ${minorName(entry.minor)} (natural minor), which note is raised by a half step to make harmonic minor?`,
      raised,
      [natural, sixth, entry.minor],
      `Harmonic minor raises the seventh degree so it pulls toward home: in ${minorName(entry.minor)}, ${natural} becomes ${raised}, one half step below the tonic.`,
    );
  },
  (rng) => {
    const key = pick(KEYS_UP_TO_2.concat(KEYS.filter((k) => k.tonic === "Eb")), rng);
    const parallel = rng() < 0.5;
    const answer = parallel ? minorName(key.tonic) : key.relative.replace(/ Minor$/, " minor");
    const other = parallel ? key.relative.replace(/ Minor$/, " minor") : minorName(key.tonic);
    return mcq(
      rng,
      `The ${parallel ? "parallel" : "relative"} minor of ${majorName(key.tonic)} is…`,
      answer,
      [
        other,
        minorName(
          pick(
            KEYS_UP_TO_2.filter((k) => k.tonic !== key.tonic),
            rng,
          ).tonic,
        ),
      ],
      parallel
        ? "Parallel keys share the same tonic note — only the key signature changes."
        : `${majorName(key.tonic)} and ${answer} share a key signature; the relative minor's tonic sits a minor third (three semitones) below the major tonic.`,
    );
  },
  (rng) =>
    mcq(
      rng,
      "Melodic minor, on the way up, raises which degrees of natural minor?",
      "The 6th and the 7th",
      ["Only the 7th", "The 3rd and the 6th", "The 2nd and the 5th"],
      "Melodic minor raises the 6th and 7th degrees going up, smoothing the climb into the tonic; coming down it usually settles back to natural minor.",
    ),
];

/* ------------------------------------------- Level 4: intervals, tension, triads */

/** The intervalExerciseForGrade(≤4) cap: distinct ascending intervals only. */
const INTERVAL_RECALL_SET = [2, 4, 5, 7, 12];
const INTERVAL_NUMBER: Record<number, number> = { 2: 2, 4: 3, 5: 4, 7: 5, 12: 8 };
const WHITE_ROOTS: { letter: string; midi: number }[] = [
  { letter: "C", midi: 60 },
  { letter: "D", midi: 62 },
  { letter: "E", midi: 64 },
  { letter: "F", midi: 65 },
  { letter: "G", midi: 67 },
  { letter: "A", midi: 69 },
  { letter: "B", midi: 71 },
];

const intervalForms: Form[] = [
  (rng) => {
    const semitones = pick(INTERVAL_RECALL_SET, rng);
    const name = INTERVAL_NAMES[semitones]!;
    return mcq(
      rng,
      semitones === 12
        ? "How many semitones are in an octave?"
        : `How many semitones are in a ${name.toLowerCase()}?`,
      String(semitones),
      shuffle(
        INTERVAL_RECALL_SET.filter((s) => s !== semitones),
        rng,
      )
        .slice(0, 3)
        .map(String),
      `A ${name.toLowerCase()} spans ${semitones} semitones — count the half steps from the lower note to the higher one.`,
    );
  },
  (rng) => {
    const root = pick(WHITE_ROOTS, rng);
    const semitones = pick(INTERVAL_RECALL_SET, rng);
    const target = spellNote(
      root.letter,
      INTERVAL_NUMBER[semitones]! - 1,
      pitchClass(root.midi + semitones),
    );
    return mcq(
      rng,
      `${root.letter} up to ${target} is a…`,
      INTERVAL_NAMES[semitones]!,
      shuffle(
        INTERVAL_RECALL_SET.filter((s) => s !== semitones),
        rng,
      )
        .slice(0, 3)
        .map((s) => INTERVAL_NAMES[s]!),
      `${root.letter} to ${target} spans ${semitones} semitones across ${INTERVAL_NUMBER[semitones]} letter names — a ${INTERVAL_NAMES[semitones]!.toLowerCase()}.`,
    );
  },
  (rng) => {
    const semitones = pick(INTERVAL_RECALL_SET, rng);
    return mcq(
      rng,
      `An interval of ${semitones} semitones is a…`,
      INTERVAL_NAMES[semitones]!,
      shuffle(
        INTERVAL_RECALL_SET.filter((s) => s !== semitones),
        rng,
      )
        .slice(0, 3)
        .map((s) => INTERVAL_NAMES[s]!),
      `${semitones} semitones is the size of a ${INTERVAL_NAMES[semitones]!.toLowerCase()}. The interval names in this lesson are worth memorising cold.`,
    );
  },
];

const CLASS_LABEL: Record<string, string> = {
  perfectConsonance: "A perfect consonance",
  imperfectConsonance: "An imperfect consonance",
  dissonance: "A dissonance",
};

const tensionForms: Form[] = [
  (rng) => {
    const target = pick(["dissonance", "perfectConsonance", "imperfectConsonance"], rng);
    const byClass = (cls: string) =>
      Object.keys(INTERVAL_NAMES)
        .map(Number)
        .filter((s) => s >= 1 && classifyInterval(s) === cls);
    const correct = pick(byClass(target), rng);
    const others = shuffle(
      ["dissonance", "perfectConsonance", "imperfectConsonance"]
        .filter((c) => c !== target)
        .flatMap((c) => shuffle(byClass(c), rng).slice(0, 2)),
      rng,
    ).slice(0, 3);
    const question =
      target === "dissonance"
        ? "Which of these intervals is dissonant?"
        : `Which of these intervals is ${target === "perfectConsonance" ? "a perfect consonance" : "an imperfect consonance"}?`;
    return mcq(
      rng,
      question,
      INTERVAL_NAMES[correct]!,
      others.map((s) => INTERVAL_NAMES[s]!),
      `The ${INTERVAL_NAMES[correct]!.toLowerCase()} is ${CLASS_LABEL[target]!.toLowerCase()} — ${target === "dissonance" ? "it leans toward resolution" : target === "perfectConsonance" ? "open and stable" : "warm, but not final"}.`,
    );
  },
  (rng) => {
    const semitones = 1 + Math.floor(rng() * 12);
    const cls = classifyInterval(semitones);
    return mcq(
      rng,
      `The ${INTERVAL_NAMES[semitones]!.toLowerCase()} is classed as…`,
      CLASS_LABEL[cls]!,
      Object.values(CLASS_LABEL),
      `Perfect consonances (unison, 4th, 5th, octave) sound open and settled; thirds and sixths are imperfect consonances; seconds, the tritone and sevenths are dissonances that lean onward.`,
    );
  },
];

type TriadQualityRecall = "Major" | "Minor";
const TRIAD_STEPS: Record<TriadQualityRecall, [number, number]> = {
  Major: [4, 7],
  Minor: [3, 7],
};

function spellTriad(
  root: { letter: string; midi: number },
  third: number,
  fifth: number,
): string[] {
  return [
    root.letter,
    spellNote(root.letter, 2, pitchClass(root.midi + third)),
    spellNote(root.letter, 4, pitchClass(root.midi + fifth)),
  ];
}

const triadForms: Form[] = [
  (rng) => {
    const root = pick(WHITE_ROOTS, rng);
    const quality = pick(["Major", "Minor"] as const, rng);
    const [third, fifth] = TRIAD_STEPS[quality];
    const answer = spellTriad(root, third, fifth).join(" ");
    const variantSteps: [number, number][] = [
      quality === "Major" ? [3, 7] : [4, 7], // the other taught quality
      [third, fifth - 1], // diminished fifth
      [third, fifth + 1], // augmented fifth
    ];
    const variants = variantSteps.filter(
      ([t, f]) => !/##|bb/.test(spellTriad(root, t, f).join(" ")),
    );
    return mcq(
      rng,
      `Which notes spell a ${root.letter} ${quality.toLowerCase()} triad?`,
      answer,
      variants.map(([t, f]) => spellTriad(root, t, f).join(" ")),
      `${root.letter} ${quality.toLowerCase()}: ${answer.replaceAll(" ", "–")} — a ${quality === "Major" ? "major" : "minor"} 3rd with a perfect 5th above the root.`,
    );
  },
  (rng) => {
    const quality = pick(["Major", "Minor"] as const, rng);
    return mcq(
      rng,
      `A ${quality.toLowerCase()} triad is built by stacking…`,
      quality === "Major" ? "A major 3rd, then a minor 3rd" : "A minor 3rd, then a major 3rd",
      [
        "A major 3rd, then a minor 3rd",
        "A minor 3rd, then a major 3rd",
        "Two major 3rds",
        "Two minor 3rds",
      ],
      `Stacking thirds: ${quality === "Major" ? "major (4 semitones) then minor (3)" : "minor (3 semitones) then major (4)"} — the two add up to the perfect 5th (7) either way.`,
    );
  },
  (rng) => {
    const root = pick(WHITE_ROOTS, rng);
    const quality = pick(["Major", "Minor"] as const, rng);
    const notes = (quality === "Major" ? majorTriad(root.midi) : minorTriad(root.midi)).map(
      (m, i) => spellNote(root.letter, [0, 2, 4][i]!, pitchClass(m)),
    );
    return mcq(
      rng,
      `The notes ${notes.join(", ")} spell a…`,
      `${quality} triad`,
      ["Major triad", "Minor triad", "Augmented triad", "Diminished triad"],
      `${notes[0]} to ${notes[1]} is a ${quality === "Major" ? "major" : "minor"} 3rd and the fifth above the root is perfect — a ${quality.toLowerCase()} triad.`,
    );
  },
];

/* ------------------------------------------- Level 5: function and cadences */

const FUNCTION_KEYS = KEYS.filter((k) => k.isMajor && k.accidentals <= 2);
const FUNCTION_DEGREES = [0, 3, 4, 5]; // romanNumeralExercise(grade 5) pool: I, IV, V, vi

function chordNameIn(key: (typeof KEYS)[number], degree: number): string {
  const tonicMidi = TONIC_MIDI[key.tonic]!;
  const rootMidi = diatonicTriad(tonicMidi, degree)[0]!;
  const root = spellNote(key.tonic[0]!, degree, pitchClass(rootMidi));
  return `${root} ${degree === 5 ? "minor" : "major"}`;
}

const functionForms: Form[] = [
  (rng) => {
    const key = pick(FUNCTION_KEYS, rng);
    const degree = pick(FUNCTION_DEGREES, rng);
    return mcq(
      rng,
      `In ${majorName(key.tonic)}, which chord is ${ROMAN_NUMERALS[degree]}?`,
      chordNameIn(key, degree),
      FUNCTION_DEGREES.filter((d) => d !== degree).map((d) => chordNameIn(key, d)),
      `In ${majorName(key.tonic)}, ${ROMAN_NUMERALS[degree]} is built on the ${ORDINALS[degree]} note of the scale — ${chordNameIn(key, degree)}. Roman numerals name the job, not the key.`,
    );
  },
  (rng) => {
    const key = pick(FUNCTION_KEYS, rng);
    const degree = pick(FUNCTION_DEGREES, rng);
    return mcq(
      rng,
      `In ${majorName(key.tonic)}, ${chordNameIn(key, degree)} is…`,
      ROMAN_NUMERALS[degree]!,
      FUNCTION_DEGREES.filter((d) => d !== degree).map((d) => ROMAN_NUMERALS[d]!),
      `${chordNameIn(key, degree)} sits on degree ${degree + 1} of the ${majorName(key.tonic)} scale, so it takes the numeral ${ROMAN_NUMERALS[degree]}.`,
    );
  },
  (rng) => {
    const kind = pick(["major", "minor", "diminished"], rng);
    return mcq(
      rng,
      `Which Roman numerals are ${kind} chords in a major key?`,
      kind === "major" ? "I, IV and V" : kind === "minor" ? "ii, iii and vi" : "vii° only",
      ["I, IV and V", "ii, iii and vi", "vii° only"],
      "In a major key, I, IV and V are major; ii, iii and vi are minor; and vii° is diminished. The case of the numeral tells you the quality.",
    );
  },
];

const CADENCE_SHORT: Record<CadenceKind, string> = {
  "Perfect (V–I)": "Perfect",
  "Plagal (IV–I)": "Plagal",
  "Half (I–V)": "Half",
  "Deceptive (V–vi)": "Deceptive",
};
const ALL_CADENCE_NAMES = CADENCES.map((c) => CADENCE_SHORT[c.name]);
const romanPair = (degrees: readonly number[]) =>
  `${ROMAN_NUMERALS[degrees[0]!]}–${ROMAN_NUMERALS[degrees[1]!]}`;

function cadenceForms(subset: CadenceKind[], withScenario: boolean): Form[] {
  const pool = CADENCES.filter((c) => subset.includes(c.name));
  const forms: Form[] = [
    (rng) => {
      const cadence = pick(pool, rng);
      return mcq(
        rng,
        `A phrase ending ${romanPair(cadence.degrees)} is which cadence?`,
        CADENCE_SHORT[cadence.name],
        ALL_CADENCE_NAMES,
        `${cadence.name}. ${cadence.feel}`,
      );
    },
    (rng) => {
      const cadence = pick(pool, rng);
      return mcq(
        rng,
        `A ${CADENCE_SHORT[cadence.name].toLowerCase()} cadence moves…`,
        `From ${romanPair(cadence.degrees).replace("–", " to ")}`,
        CADENCES.filter((c) => c.name !== cadence.name).map(
          (c) => `From ${romanPair(c.degrees).replace("–", " to ")}`,
        ),
        `${cadence.name}. ${cadence.feel}`,
      );
    },
    (rng) => {
      const cadence = pick(pool, rng);
      const feelPrompt: Record<CadenceKind, string> = {
        "Perfect (V–I)": "Which cadence sounds like a full stop — tension resolving home?",
        "Plagal (IV–I)": "Which cadence is the gentle “Amen” ending?",
        "Half (I–V)": "Which cadence stops on the dominant and feels unfinished, like a comma?",
        "Deceptive (V–vi)": "Which cadence heads for home but lands on the relative minor instead?",
      };
      return mcq(
        rng,
        feelPrompt[cadence.name],
        CADENCE_SHORT[cadence.name],
        ALL_CADENCE_NAMES,
        `${cadence.name}. ${cadence.feel}`,
      );
    },
  ];
  if (withScenario) {
    forms.push((rng) => {
      const key = pick(FUNCTION_KEYS, rng);
      const deceptive = rng() < 0.5;
      if (deceptive) {
        return mcq(
          rng,
          `A phrase in ${majorName(key.tonic)} moves from ${chordNameIn(key, 4)} (V) to ${chordNameIn(key, 5)} (vi) instead of home. Its cadence is…`,
          "Deceptive",
          ALL_CADENCE_NAMES,
          "Deceptive (V–vi). The surprise: you expected home; you got the relative minor, which shares two notes with I.",
        );
      }
      return mcq(
        rng,
        `A phrase in ${majorName(key.tonic)} ends on ${chordNameIn(key, 4)}, the dominant chord. Its cadence is…`,
        "Half",
        ALL_CADENCE_NAMES,
        "Half (I–V). A comma, not a full stop: it ends on the dominant and wants more.",
      );
    });
  }
  return forms;
}

/* ------------------------------------------- Level 7: closely related keys */

/** The relatedKeyExercise home pool: circle positions 0–5 and 10–11. */
const RELATED_HOMES = CIRCLE_OF_FIFTHS.slice(0, 6).concat(CIRCLE_OF_FIFTHS.slice(10));
const ALL_KEY_NAMES = KEYS.flatMap((k) => [
  `${k.tonic} major`,
  k.relative.replace(/ Minor$/, " minor"),
]);

const relatedForms: Form[] = [
  (rng) => {
    const home = pick(RELATED_HOMES, rng);
    const related = closelyRelatedKeys(home);
    const correct = pick(related, rng);
    const far = shuffle(
      ALL_KEY_NAMES.filter((n) => n !== `${home} major` && !related.includes(n)),
      rng,
    ).slice(0, 3);
    return mcq(
      rng,
      `Which key is a close neighbour of ${home} major?`,
      correct,
      far,
      `${home} major's close family is ${related.join(", ")} — the dominant and subdominant majors and the relative minors of all three: the same key signature or one accidental away.`,
    );
  },
  (rng) => {
    const home = pick(RELATED_HOMES, rng);
    const related = closelyRelatedKeys(home);
    const correct = pick(
      ALL_KEY_NAMES.filter((n) => n !== `${home} major` && !related.includes(n)),
      rng,
    );
    return mcq(
      rng,
      `Which key is NOT closely related to ${home} major?`,
      correct,
      shuffle([...related], rng).slice(0, 3),
      `${correct} differs from ${home} major by more than one accidental. The close family is ${related.join(", ")}.`,
    );
  },
  (rng) => {
    const home = pick(RELATED_HOMES, rng);
    const related = closelyRelatedKeys(home);
    return mcq(
      rng,
      `How many keys are closely related to ${home} major, not counting ${home} major itself?`,
      "Five",
      ["Three", "Four", "Six"],
      `Five: the dominant and subdominant majors, plus the relative minors of the tonic, the dominant and the subdominant — ${related.join(", ")}.`,
    );
  },
];

/* ----------------------------- Levels 8 and 10: bounded rhythm and mode recall */

const ODD_GROUPINGS = [
  { groups: [3, 2], unit: 4 },
  { groups: [2, 3], unit: 4 },
  { groups: [2, 2, 3], unit: 8 },
  { groups: [2, 3, 2], unit: 8 },
  { groups: [3, 2, 2], unit: 8 },
] as const;
const groupingLabel = (groups: readonly number[]) => groups.join(" + ");

const oddMeterForms: Form[] = [
  (rng) => {
    const row = pick(ODD_GROUPINGS, rng);
    const total = row.groups.reduce((sum, value) => sum + value, 0);
    return mcq(
      rng,
      `A ${groupingLabel(row.groups)} grouping fills which meter?`,
      `${total}/${row.unit}`,
      ["5/4", "7/8", "6/8", "4/4"],
      `${groupingLabel(row.groups)} adds to ${total}; the lower number names the ${row.unit === 4 ? "quarter" : "eighth"}-note unit.`,
    );
  },
  (rng) => {
    const total = pick([5, 7], rng);
    const choices = ODD_GROUPINGS.filter(
      (row) => row.groups.reduce((sum, value) => sum + value, 0) === total,
    );
    const row = pick(choices, rng);
    return mcq(
      rng,
      `Which grouping can shape ${total}/${row.unit} into smaller, even pulses?`,
      groupingLabel(row.groups),
      total === 5 ? ["2 + 2 + 3", "4 + 4"] : ["3 + 2", "4 + 4"],
      `${groupingLabel(row.groups)} adds to ${total}. The accents create unequal groups while the underlying pulses stay even.`,
    );
  },
  (rng) =>
    mcq(
      rng,
      "In 5/4 or 7/8, what stays even beneath the changing accent groups?",
      "The underlying pulse",
      ["The length of every accent group", "The tempo must speed up"],
      "Odd meter comes from grouping an even pulse into unequal spans, not from making individual pulses uneven.",
    ),
];

const polyrhythmForms: Form[] = [
  (rng) => {
    const part = pick([2, 3], rng);
    return mcq(
      rng,
      `On the taught six-part grid for 3:2, where does the ${part}-part attack?`,
      part === 2 ? "1 and 4" : "1, 3 and 5",
      [part === 2 ? "1, 3 and 5" : "1 and 4", "1, 2, 3, 4, 5 and 6"],
      `Six divided by ${part} gives an attack every ${6 / part} grid positions, starting on 1.`,
    );
  },
  (rng) =>
    mcq(
      rng,
      "In the taught 3:2 cycle, what do the two parts share?",
      "The same overall six-part time span",
      ["Attacks on every grid position", "The same number of attacks"],
      "Three attacks and two attacks fit the same six-part span; both parts meet again at the start of the next cycle.",
    ),
  (rng) =>
    mcq(
      rng,
      "After one six-part 3:2 cycle, where do both parts meet again?",
      "At the start of the next cycle",
      ["Halfway through the next cycle", "They never share an attack"],
      "The shared grid starts both parts on position 1, so the next cycle brings them together there again.",
    ),
];

const NATURAL_MINOR = [0, 2, 3, 5, 7, 8, 10];
const MODE_CASES = [
  {
    mode: "Dorian",
    baseline: "natural minor",
    pattern: [0, 2, 3, 5, 7, 9, 10],
    base: NATURAL_MINOR,
  },
  { mode: "Mixolydian", baseline: "major", pattern: [0, 2, 4, 5, 7, 9, 10], base: MAJOR_SCALE },
] as const;
const DEGREE_NAMES = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh"];

const modeForms: Form[] = [
  (rng) => {
    const row = pick(MODE_CASES, rng);
    const degree = row.pattern.findIndex((value, index) => value !== row.base[index]);
    const raised = row.pattern[degree]! > row.base[degree]!;
    return mcq(
      rng,
      `Compared with ${row.baseline}, ${row.mode} has a…`,
      `${raised ? "Raised" : "Lowered"} ${DEGREE_NAMES[degree]}`,
      [`${raised ? "Lowered" : "Raised"} ${DEGREE_NAMES[degree]}`, "Raised fifth"],
      `The ${DEGREE_NAMES[degree]} is ${raised ? "one semitone higher" : "one semitone lower"} than in ${row.baseline}; the other degrees stay the same.`,
    );
  },
  (rng) => {
    const dorian = MODE_CASES[0];
    const degree = pick([2, 5], rng);
    const pc = (62 + dorian.pattern[degree]!) % 12;
    const answer = spellNote("D", degree, pc);
    return mcq(
      rng,
      `In D Dorian, which note is the ${DEGREE_NAMES[degree]} above D?`,
      answer,
      degree === 2 ? ["F#", "E", "B"] : ["Bb", "F", "C"],
      `D Dorian keeps the white-key collection but centres D. Its ${DEGREE_NAMES[degree]} is ${answer}.`,
    );
  },
  (rng) =>
    mcq(
      rng,
      "A melody uses the white-key collection but repeatedly ends on D and emphasizes D in the bass. Which tonal centre makes it D Dorian?",
      "D",
      ["C", "G"],
      "A mode depends on its tonal centre as well as its note collection. D as home, with F and B natural above it, defines the lesson's D Dorian example.",
    ),
];

/* ------------------------------------------------------------ the registry */

/**
 * The concept registry: unit → generator family + taught-scope cap + forms.
 * Scope caps are inherited from the exercise families, not invented:
 * intervals use intervalExerciseForGrade(≤4)'s allowed set, triads use
 * triadExercise(grade 4)'s Major/Minor set, numerals use
 * romanNumeralExercise(grade 5)'s degree pool, key signatures cap at four
 * accidentals (the audited Level 3 cap), scales at two (scaleExercise
 * grade 3). The two rhythm units draw on the rhythm family's own data
 * (RHYTHMS meters and the note-value table) rather than its grade-filtered
 * ear-identification pools.
 */
export const RECALL_REGISTRY: Record<string, RecallGenerator> = {
  "0-pitch": {
    family: "pitchHighLow (sensory)",
    scope: "the unit's two taught facts: vibration direction and pitch/loudness independence",
    forms: pitchForms,
  },
  "0-dynamics": {
    family: "dynamicsLoudSoft (sensory)",
    scope: "the two taught markings, p and f",
    forms: dynamicsForms,
  },
  "0-timbre": {
    family: "timbreExercise (sensory)",
    scope: "timbre as the character that distinguishes instruments on the same note",
    forms: timbreForms,
  },
  "2-duration": {
    family: "rhythmExercise data (note values)",
    scope: "note values whole → eighth and their lengths in quarter-note beats",
    forms: durationForms,
  },
  "2-dots": {
    family: "rhythmExercise data (note values)",
    scope: "the dot rule on half and quarter notes, and sums with quarter/eighth",
    forms: dotForms,
  },
  "2-meter": {
    family: "rhythmExercise data (RHYTHMS meters)",
    scope:
      "the taught meters 2/4, 3/4, 4/4 and the 6/8 grouping feel; bar patterns are the family's patterns that fill their bar",
    forms: meterForms,
  },
  "3-major": {
    family: "scaleExercise",
    scope:
      "scaleExercise grade 3: major keys with at most 2 accidentals; step pattern and degrees 2–7",
    forms: majorScaleForms,
  },
  "3-signatures": {
    family: "keySignatureExercise",
    scope: "major keys with at most 4 accidentals (the audited Level 3 cap)",
    forms: signatureForms,
  },
  "3-circle": {
    family: "keySignatureExercise / circle of fifths",
    scope: "neighbours and fifth-steps for major keys with at most 4 accidentals",
    forms: circleForms,
  },
  "3-minor": {
    family: "scaleExercise (minor forms)",
    scope:
      "harmonic raise for A, E, B, D, G, C minor (clean spellings); parallel/relative for keys ≤3 accidentals; melodic raise",
    forms: minorForms,
  },
  "4-intervals": {
    family: "intervalExercise",
    scope: "intervalExerciseForGrade(≤4) allowed set [2, 4, 5, 7, 12] semitones, ascending",
    forms: intervalForms,
  },
  "4-tension": {
    family: "intervalExercise (classifyInterval)",
    scope: "the app's consonance classes over intervals 1–12 semitones",
    forms: tensionForms,
  },
  "4-triads": {
    family: "triadExercise",
    scope:
      "triadExercise(grade 4) qualities Major and Minor; augmented/diminished appear only as distractors, as the unit teaches them",
    forms: triadForms,
  },
  "5-function": {
    family: "romanNumeralExercise",
    scope: "romanNumeralExercise(grade 5) degrees [I, IV, V, vi]; keys with at most 2 accidentals",
    forms: functionForms,
  },
  "5-cadences": {
    family: "cadenceExercise",
    scope:
      "the unit's taught cadences: Perfect and Plagal (all four names appear as options, as in cadenceExercise)",
    forms: cadenceForms(["Perfect (V–I)", "Plagal (IV–I)"], false),
  },
  "5-open-endings": {
    family: "cadenceExercise",
    scope:
      "the unit's taught cadences: Half and Deceptive, plus key-context scenarios (keys ≤2 accidentals)",
    forms: cadenceForms(["Half (I–V)", "Deceptive (V–vi)"], true),
  },
  "7-related": {
    family: "relatedKeyExercise",
    scope:
      "the family's home pool (circle positions 0–5, 10–11) and its five-key family from closelyRelatedKeys",
    forms: relatedForms,
  },
  "8-odd-meter": {
    family: "taught odd-meter grouping arithmetic",
    scope: "5/4 as 3+2 or 2+3; 7/8 as rotations of 2+2+3; even underlying pulses",
    forms: oddMeterForms,
  },
  "8-polyrhythm": {
    family: "taught 3:2 six-position grid",
    scope: "three attacks at 1/3/5, two at 1/4, and reunion at the next shared cycle",
    forms: polyrhythmForms,
  },
  "10-modes": {
    family: "taught Dorian/Mixolydian interval patterns",
    scope:
      "Dorian versus natural minor, Mixolydian versus major, and the D Dorian white-key example",
    forms: modeForms,
  },
};

/** Unit ids that generate recall checks at review, sorted. */
export const GENERATED_RECALL_UNITS = Object.keys(RECALL_REGISTRY).sort();

function pairFrom(generator: RecallGenerator, rng: Rng): CheckQuestion[] {
  const forms = shuffle([...generator.forms], rng);
  return [forms[0]!(rng), forms[1]!(rng)];
}

const canonical = (pair: CheckQuestion[]) =>
  pair.map((q) => `${q.prompt} ⇒ ${q.answer}`).join(" | ");

/**
 * The generated recall pair for a unit's review round, or undefined when the
 * unit has no registry entry (its authored pair serves instead). Pure in
 * (unitId, round): the same round always yields the same pair, and a round's
 * pair never repeats the previous round's pair verbatim — small families are
 * re-rolled under a salt until the pair changes.
 */
export function generateRecallPair(unitId: string, round: number): CheckQuestion[] | undefined {
  const generator = RECALL_REGISTRY[unitId];
  if (!generator) return undefined;
  let previous: string | undefined;
  let pair: CheckQuestion[] | undefined;
  for (let r = 0; r <= round; r++) {
    let salt = 0;
    let candidate = pairFrom(generator, rngFor("recall", unitId, r, salt));
    while (canonical(candidate) === previous && salt < 16) {
      salt += 1;
      candidate = pairFrom(generator, rngFor("recall", unitId, r, salt));
    }
    pair = candidate;
    previous = canonical(candidate);
  }
  return pair;
}
