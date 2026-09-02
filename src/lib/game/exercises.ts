import {
  INTERVAL_NAMES,
  KEYS,
  C_MAJOR,
  noteName,
  pick,
  shuffle,
} from "./music";

export type Exercise = {
  type: string;
  prompt: string;
  notes: number[];
  correctAnswer: string;
  options: string[];
  hint?: string;
  metadata?: Record<string, unknown>;
};

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
  };
}

export function dynamicsLoudSoft(): Exercise {
  const loud = Math.random() < 0.5;
  return {
    type: "dynamics",
    prompt: "Is this tone loud or soft?",
    notes: [60 + Math.floor(Math.random() * 12)],
    correctAnswer: loud ? "Loud" : "Soft",
    options: ["Loud", "Soft"],
    metadata: { volume: loud ? 1 : 0.22 },
  };
}

export function timbreExercise(): Exercise {
  const kinds = ["Warm", "Hollow", "Bright", "Reed"];
  const correct = pick(kinds);
  return {
    type: "timbre",
    prompt: "Which color of sound is this?",
    notes: [64],
    correctAnswer: correct,
    options: shuffle(kinds),
    metadata: { timbre: correct },
  };
}

export function intervalExercise(maxSemitones = 12): Exercise {
  const intervals = Object.entries(INTERVAL_NAMES)
    .map(([k, v]) => ({ semitones: Number(k), name: v }))
    .filter((i) => i.semitones > 0 && i.semitones <= maxSemitones);
  const correct = pick(intervals);
  const base = 60 + Math.floor(Math.random() * 8);
  const options = shuffle(intervals).slice(0, 4);
  if (!options.some((o) => o.name === correct.name)) {
    options[0] = correct;
  }
  return {
    type: "interval",
    prompt: "What interval is this?",
    notes: [base, base + correct.semitones],
    correctAnswer: correct.name,
    options: shuffle(options.map((o) => o.name)),
    hint: "Listen, then name the distance.",
  };
}

export type TriadQuality = "Major" | "Minor" | "Augmented" | "Diminished";

const TRIAD_INTERVALS: Record<TriadQuality, [number, number]> = {
  Major: [4, 7],
  Minor: [3, 7],
  Augmented: [4, 8],
  Diminished: [3, 6],
};

export function triadExercise(): Exercise {
  const qualities: TriadQuality[] = ["Major", "Minor", "Augmented", "Diminished"];
  const correct = pick(qualities);
  const root = pick(C_MAJOR.slice(0, 6));
  const [third, fifth] = TRIAD_INTERVALS[correct];
  return {
    type: "triad",
    prompt: "What quality is this triad?",
    notes: [root, root + third, root + fifth],
    correctAnswer: correct,
    options: shuffle(qualities),
  };
}

export type RhythmPattern = { name: string; beats: number[] };

export const RHYTHMS: RhythmPattern[] = [
  { name: "Whole note", beats: [4] },
  { name: "Half notes", beats: [2, 2] },
  { name: "Quarter notes", beats: [1, 1, 1, 1] },
  { name: "Eighth notes", beats: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] },
  { name: "Dotted half + quarter", beats: [3, 1] },
  { name: "Dotted quarter + eighth", beats: [1.5, 0.5, 1.5, 0.5] },
];

export function rhythmExercise(): Exercise {
  const correct = pick(RHYTHMS);
  const options = shuffle(RHYTHMS).slice(0, 4);
  if (!options.some((o) => o.name === correct.name)) options[0] = correct;
  return {
    type: "rhythm",
    prompt: "Which rhythm did you hear?",
    notes: [60],
    correctAnswer: correct.name,
    options: shuffle(options.map((o) => o.name)),
    metadata: { beats: correct.beats },
  };
}

export function keySignatureExercise(): Exercise {
  const pool = KEYS.filter((k) => k.isMajor && k.accidentals <= 4);
  const correct = pick(pool);
  const options = shuffle(pool).slice(0, 4);
  if (!options.some((o) => o.name === correct.name)) options[0] = correct;
  const accWord =
    correct.kind === "none"
      ? "no sharps or flats"
      : `${correct.accidentals} ${correct.kind}${correct.accidentals === 1 ? "" : "s"}`;
  return {
    type: "key",
    prompt: `Which major key has ${accWord}?`,
    notes: [],
    correctAnswer: correct.name,
    options: shuffle(options.map((o) => o.name)),
  };
}

export function scaleExercise(): Exercise {
  const majors = KEYS.filter((k) => k.isMajor && k.accidentals <= 3);
  const correct = pick(majors);
  const tonicMidi: Record<string, number> = {
    C: 60,
    G: 67,
    D: 62,
    A: 69,
    E: 64,
    F: 65,
    Bb: 70,
  };
  const tonic = tonicMidi[correct.tonic] ?? 60;
  const pattern = [0, 2, 4, 5, 7, 9, 11, 12];
  const options = shuffle(majors).slice(0, 4);
  if (!options.some((o) => o.name === correct.name)) options[0] = correct;
  return {
    type: "scale",
    prompt: "Which major scale is this?",
    notes: pattern.map((s) => tonic + s),
    correctAnswer: correct.name,
    options: shuffle(options.map((o) => o.name)),
  };
}

export function sensoryExercise(): Exercise {
  const roll = Math.random();
  if (roll < 0.34) return pitchHighLow();
  if (roll < 0.67) return dynamicsLoudSoft();
  return timbreExercise();
}

export { noteName };
