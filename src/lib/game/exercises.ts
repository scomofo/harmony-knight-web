import {
  CADENCES,
  CIRCLE_OF_FIFTHS,
  C_MAJOR,
  INTERVAL_NAMES,
  KEYS,
  MAJOR_SCALE,
  NATURAL_MINOR_SCALE,
  ROMAN_NUMERALS,
  TONIC_MIDI,
  closelyRelatedKeys,
  diatonicTriad,
  noteName,
  pick,
  shuffle,
  voiceNear,
  type RomanNumeral,
} from "./music.ts";

export type ExercisePlayback = "single" | "sequence" | "chord" | "progression" | "silent";

export type Exercise = {
  type: string;
  prompt: string;
  notes: number[];
  correctAnswer: string;
  options: string[];
  hint?: string;
  /** Shown after answering — the teaching moment. */
  explain?: string;
  playback?: ExercisePlayback;
  metadata?: Record<string, unknown>;
};

function ensureOption<T extends { name: string }>(options: T[], correct: T): T[] {
  if (!options.some((o) => o.name === correct.name)) options[0] = correct;
  return options;
}

/* ---------------------------------------------------------------- Level 0 */

export function pitchHighLow(): Exercise {
  const base = 60 + Math.floor(Math.random() * 8);
  const higher = Math.random() < 0.5;
  const offset = (3 + Math.floor(Math.random() * 5)) * (higher ? 1 : -1);
  return {
    type: "pitch",
    prompt: "Is the second tone higher or lower?",
    notes: [base, base + offset],
    correctAnswer: higher ? "Higher" : "Lower",
    options: ["Higher", "Lower"],
    playback: "sequence",
    explain: higher
      ? "The second tone climbed. Higher pitch means faster vibration — a thinner, lighter sound."
      : "The second tone dropped. Lower pitch means slower vibration — a heavier, darker sound.",
  };
}

export function dynamicsLoudSoft(): Exercise {
  const loud = Math.random() < 0.5;
  return {
    type: "dynamics",
    prompt: "Is this tone loud or soft?",
    notes: [60 + Math.floor(Math.random() * 12)],
    correctAnswer: loud ? "Loud (forte)" : "Soft (piano)",
    options: ["Loud (forte)", "Soft (piano)"],
    playback: "single",
    metadata: { volume: loud ? 1 : 0.2 },
    explain: loud
      ? "Composers write f — forte — for loud. Same pitch, more energy."
      : "Composers write p — piano — for soft. Same pitch, less energy.",
  };
}

const TIMBRES = ["Warm", "Hollow", "Bright", "Reed"] as const;
const TIMBRE_EXPLAIN: Record<(typeof TIMBRES)[number], string> = {
  Warm: "Warm: few overtones, soft edges — like a flute or a gently struck bell.",
  Hollow: "Hollow: only odd overtones, a woody centre — like a clarinet.",
  Bright: "Bright: many high overtones, a sharp edge — like a trumpet or violin.",
  Reed: "Reed: two slightly detuned voices beating together — like an accordion or oboe.",
};

export function timbreExercise(): Exercise {
  const correct = pick(TIMBRES);
  return {
    type: "timbre",
    prompt: "Which colour of sound is this?",
    notes: [60 + Math.floor(Math.random() * 7)],
    correctAnswer: correct,
    options: shuffle([...TIMBRES]),
    playback: "single",
    metadata: { timbre: correct },
    explain: TIMBRE_EXPLAIN[correct],
  };
}

export function sensoryExercise(): Exercise {
  const roll = Math.random();
  if (roll < 0.34) return pitchHighLow();
  if (roll < 0.67) return dynamicsLoudSoft();
  return timbreExercise();
}

/* ---------------------------------------------------------------- Level 4 */

const INTERVAL_EXPLAIN: Record<number, string> = {
  1: "A minor 2nd is the closest step — one semitone. Think of the Jaws theme.",
  2: "A major 2nd is a whole step. Happy Birthday opens with one.",
  3: "A minor 3rd — three semitones. Greensleeves opens with one.",
  4: "A major 3rd — four semitones. The first two notes of a major chord.",
  5: "A perfect 4th — five semitones. Here Comes the Bride.",
  6: "A tritone — six semitones, exactly half an octave. The Simpsons theme.",
  7: "A perfect 5th — seven semitones. Twinkle Twinkle, or the Star Wars theme.",
  8: "A minor 6th — eight semitones. The Entertainer's opening leap.",
  9: "A major 6th — nine semitones. My Bonnie Lies Over the Ocean.",
  10: "A minor 7th — ten semitones. Somewhere from West Side Story.",
  11: "A major 7th — eleven semitones. Take On Me's big leap.",
  12: "An octave — twelve semitones. Somewhere Over the Rainbow.",
};

export type IntervalDirection = "ascending" | "descending" | "harmonic";

export function intervalExercise(
  maxSemitones = 12,
  opts: { directions?: IntervalDirection[]; allowed?: number[] } = {},
): Exercise {
  const directions = opts.directions ?? ["ascending"];
  const direction = pick(directions);
  const intervals = Object.entries(INTERVAL_NAMES)
    .map(([k, v]) => ({ semitones: Number(k), name: v }))
    .filter(
      (i) =>
        i.semitones > 0 &&
        i.semitones <= maxSemitones &&
        (!opts.allowed || opts.allowed.includes(i.semitones)),
    );
  const correct = pick(intervals);
  const base = 60 + Math.floor(Math.random() * 8);
  const options = ensureOption(shuffle(intervals).slice(0, 4), correct);
  const notes =
    direction === "descending"
      ? [base + correct.semitones, base]
      : [base, base + correct.semitones];
  return {
    type: "interval",
    prompt:
      direction === "harmonic"
        ? "Two tones together. What interval is this?"
        : direction === "descending"
          ? "Falling. What interval is this?"
          : "What interval is this?",
    notes,
    correctAnswer: correct.name,
    options: shuffle(options.map((o) => o.name)),
    hint: "Listen, then name the distance.",
    playback: direction === "harmonic" ? "chord" : "sequence",
    explain: INTERVAL_EXPLAIN[correct.semitones],
    metadata: { direction, semitones: correct.semitones },
  };
}

/** Grade-aware interval drill: fewer, more distinct intervals early on. */
export function intervalExerciseForGrade(grade: number): Exercise {
  if (grade <= 4) {
    return intervalExercise(12, { allowed: [2, 4, 5, 7, 12], directions: ["ascending"] });
  }
  if (grade <= 6) {
    return intervalExercise(12, {
      allowed: [1, 2, 3, 4, 5, 7, 9, 12],
      directions: ["ascending", "descending"],
    });
  }
  return intervalExercise(12, { directions: ["ascending", "descending", "harmonic"] });
}

export type TriadQuality = "Major" | "Minor" | "Augmented" | "Diminished";

const TRIAD_INTERVALS: Record<TriadQuality, [number, number]> = {
  Major: [4, 7],
  Minor: [3, 7],
  Augmented: [4, 8],
  Diminished: [3, 6],
};

const TRIAD_EXPLAIN: Record<TriadQuality, string> = {
  Major: "Major: a major 3rd then a minor 3rd (4 + 3 semitones). Bright and settled.",
  Minor: "Minor: a minor 3rd then a major 3rd (3 + 4 semitones). Darker, but still stable.",
  Augmented: "Augmented: two major 3rds (4 + 4). The fifth is stretched — it floats, unresolved.",
  Diminished:
    "Diminished: two minor 3rds (3 + 3). The fifth is squeezed — tense and wanting to move.",
};

export function triadExercise(grade = 4): Exercise {
  const qualities: TriadQuality[] =
    grade <= 4 ? ["Major", "Minor"] : ["Major", "Minor", "Augmented", "Diminished"];
  const correct = pick(qualities);
  const root = pick(C_MAJOR.slice(0, 6));
  const [third, fifth] = TRIAD_INTERVALS[correct];
  return {
    type: "triad",
    prompt: "What quality is this triad?",
    notes: [root, root + third, root + fifth],
    correctAnswer: correct,
    options: shuffle(["Major", "Minor", "Augmented", "Diminished"]),
    playback: "chord",
    explain: `${TRIAD_EXPLAIN[correct]} Root: ${noteName(root)}.`,
  };
}

/* ---------------------------------------------------------------- Level 2 */

export type RhythmPattern = { name: string; beats: number[]; meter: string; body: string };

export const RHYTHMS: RhythmPattern[] = [
  { name: "Whole note", beats: [4], meter: "4/4", body: "Arms wide — one long hold." },
  { name: "Two half notes", beats: [2, 2], meter: "4/4", body: "Hands to the waist, twice." },
  { name: "Four quarter notes", beats: [1, 1, 1, 1], meter: "4/4", body: "Four steady claps." },
  {
    name: "Eighth notes",
    beats: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    meter: "4/4",
    body: "Finger taps, twice per beat.",
  },
  { name: "Dotted half + quarter", beats: [3, 1], meter: "4/4", body: "Long hold, then one clap." },
  {
    name: "Dotted quarter + eighth",
    beats: [1.5, 0.5, 1.5, 0.5],
    meter: "4/4",
    body: "Long-short, long-short — a skip.",
  },
  { name: "Waltz: three quarters", beats: [1, 1, 1], meter: "3/4", body: "ONE two three." },
  { name: "Waltz: half + quarter", beats: [2, 1], meter: "3/4", body: "Hold, then step." },
  { name: "March: two quarters", beats: [1, 1], meter: "2/4", body: "Left, right." },
  {
    name: "Quarter + two eighths, twice",
    beats: [1, 0.5, 0.5, 1, 0.5, 0.5],
    meter: "4/4",
    body: "Clap, tap-tap, clap, tap-tap.",
  },
];

export function rhythmPatternsForGrade(grade: number): RhythmPattern[] {
  if (grade <= 2) return RHYTHMS.filter((r) => r.meter === "4/4" && r.beats.length <= 4);
  if (grade <= 4) return RHYTHMS.filter((r) => r.meter !== "3/4" || r.beats.length <= 3);
  return RHYTHMS;
}

export function rhythmExercise(grade = 2): Exercise {
  const pool = rhythmPatternsForGrade(grade);
  const correct = pick(pool);
  const options = ensureOption(shuffle(pool).slice(0, 4), correct);
  const total = correct.beats.reduce((a, b) => a + b, 0);
  return {
    type: "rhythm",
    prompt: `Which rhythm did you hear? (${correct.meter})`,
    notes: [60],
    correctAnswer: correct.name,
    options: shuffle(options.map((o) => o.name)),
    playback: "silent",
    metadata: { beats: correct.beats, meter: correct.meter },
    explain: `${correct.name}: ${correct.beats.join(" + ")} = ${total} beats in ${correct.meter}. ${correct.body}`,
  };
}

/* ---------------------------------------------------------------- Level 3 */

export function keySignatureExercise(maxAccidentals = 4): Exercise {
  const pool = KEYS.filter((k) => k.isMajor && k.accidentals <= maxAccidentals);
  const correct = pick(pool);
  const options = ensureOption(shuffle(pool).slice(0, 4), correct);
  const accWord =
    correct.kind === "none"
      ? "no sharps or flats"
      : `${correct.accidentals} ${correct.kind}${correct.accidentals === 1 ? "" : "s"}`;
  const showStaff = Math.random() < 0.6;
  return {
    type: "key",
    prompt: showStaff ? "Which major key is this signature?" : `Which major key has ${accWord}?`,
    notes: [],
    correctAnswer: correct.name,
    options: shuffle(options.map((o) => o.name)),
    playback: "silent",
    metadata: { tonic: correct.tonic, showStaff },
    explain:
      correct.kind === "none"
        ? "C major is the open plain — no sharps, no flats. Its relative minor is A minor."
        : correct.kind === "sharp"
          ? `${correct.name}: ${accWord}. The last sharp is one semitone below the tonic. Relative minor: ${correct.relative}.`
          : `${correct.name}: ${accWord}. The second-to-last flat names the key. Relative minor: ${correct.relative}.`,
  };
}

export function scaleExercise(grade = 3): Exercise {
  const majors = KEYS.filter((k) => k.isMajor && k.accidentals <= (grade <= 3 ? 2 : 4));
  const useMinor = grade >= 5 && Math.random() < 0.4;
  const correctKey = pick(majors);
  const tonic = TONIC_MIDI[correctKey.tonic] ?? 60;
  const options = ensureOption(shuffle(majors).slice(0, 4), correctKey);
  if (useMinor) {
    // Natural minor built on the relative minor of the chosen key.
    const relTonic = tonic - 3;
    return {
      type: "scale",
      prompt: "Major or natural minor?",
      notes: NATURAL_MINOR_SCALE.map((s) => relTonic + s),
      correctAnswer: "Natural minor",
      options: ["Major", "Natural minor"],
      playback: "sequence",
      explain: `${correctKey.relative}, natural minor: the third step is lowered, so the scale sounds darker. Pattern: W H W W H W W.`,
    };
  }
  if (grade >= 5 && Math.random() < 0.4) {
    return {
      type: "scale",
      prompt: "Major or natural minor?",
      notes: MAJOR_SCALE.map((s) => tonic + s),
      correctAnswer: "Major",
      options: ["Major", "Natural minor"],
      playback: "sequence",
      explain: `${correctKey.name}, major: the bright third. Pattern: W W H W W W H.`,
    };
  }
  return {
    type: "scale",
    prompt: "Which major scale is this?",
    notes: MAJOR_SCALE.map((s) => tonic + s),
    correctAnswer: correctKey.name,
    options: shuffle(options.map((o) => o.name)),
    playback: "sequence",
    explain: `${correctKey.name} starts on ${noteName(tonic)}. Every major scale uses the same pattern — whole, whole, half, whole, whole, whole, half.`,
  };
}

/* ---------------------------------------------------------------- Level 7 */

export function relatedKeyExercise(): Exercise {
  const home = pick(CIRCLE_OF_FIFTHS.slice(0, 6).concat(CIRCLE_OF_FIFTHS.slice(10)));
  const related = closelyRelatedKeys(home);
  const correct = pick(related);
  const far = shuffle(CIRCLE_OF_FIFTHS.filter((k) => k !== home && !related.includes(k))).slice(
    0,
    3,
  );
  const homeKey = KEYS.find((k) => k.tonic === home);
  return {
    type: "modulation",
    prompt: `Which key is a close neighbour of ${home} major?`,
    notes: [],
    correctAnswer: `${correct} major`,
    options: shuffle([correct, ...far].map((k) => `${k} major`)),
    playback: "silent",
    metadata: { tonic: home, showStaff: false },
    explain: `${home} major touches ${related.join(" and ")} major on the circle — one accidental apart — plus its relative ${homeKey?.relative ?? "minor"}. Those share the most chords, so pivot-chord modulation is smooth.`,
  };
}

/* ---------------------------------------------------------------- Level 5 */

const ROMAN_EXPLAIN: Record<RomanNumeral, string> = {
  I: "I — the tonic. Home base. Everything else is measured against it.",
  ii: "ii — the supertonic. A minor chord that often leads toward V.",
  iii: "iii — the mediant. Rare, gentle, halfway between I and V.",
  IV: "IV — the subdominant. Lifts away from home without much tension.",
  V: "V — the dominant. Contains the leading tone; it pulls hard back to I.",
  vi: "vi — the submediant, the relative minor. Shares two notes with I.",
  "vii°": "vii° — the leading-tone chord, diminished. Tense; it behaves like V.",
};

export function romanNumeralExercise(grade = 5): Exercise {
  const degrees = grade <= 5 ? [0, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6];
  const degree = pick(degrees);
  const numeral = ROMAN_NUMERALS[degree]!;
  const tonic = 60;
  const chord = voiceNear(diatonicTriad(tonic, degree), 65);
  const optionSet = degrees.map((d) => ROMAN_NUMERALS[d]!);
  const options = shuffle(optionSet).slice(0, 4);
  if (!options.includes(numeral)) options[0] = numeral;
  return {
    type: "roman",
    prompt: "In C major, which chord is this?",
    notes: [...voiceNear(diatonicTriad(tonic, 0), 65), ...chord],
    correctAnswer: numeral,
    options: shuffle(options),
    playback: "progression",
    metadata: { chords: [voiceNear(diatonicTriad(tonic, 0), 65), chord] },
    explain: `${ROMAN_EXPLAIN[numeral]} You heard I first, then the chord in question.`,
  };
}

export function cadenceExercise(): Exercise {
  const correct = pick(CADENCES);
  const tonic = 60;
  const chords = correct.degrees.map((d) => voiceNear(diatonicTriad(tonic, d), 65));
  return {
    type: "cadence",
    prompt: "Which cadence closes this phrase?",
    notes: chords.flat(),
    correctAnswer: correct.name,
    options: shuffle(CADENCES.map((c) => c.name)),
    playback: "progression",
    metadata: { chords: [voiceNear(diatonicTriad(tonic, 0), 65), ...chords] },
    explain: `${correct.name}. ${correct.feel}`,
  };
}

export function harmonyExercise(grade = 5): Exercise {
  return Math.random() < 0.5 ? romanNumeralExercise(grade) : cadenceExercise();
}

export { noteName };
