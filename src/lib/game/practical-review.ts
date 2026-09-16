import { activityForUnit } from "./activity-catalog.ts";
import type {
  ActivityProgress,
  ActivityTask,
  LessonActivity,
  RhythmTask,
  VoiceTask,
} from "./activities.ts";
import { noteName } from "./music.ts";

export type PracticalReview = {
  round: number;
  progress: ActivityProgress;
  completedAt: string | null;
};
export type ConceptPractice = {
  attempts: number;
  independent: number;
  recent: boolean[];
  lastPractisedAt: string;
};
export function recordConcept(
  previous: ConceptPractice | undefined,
  independent: boolean,
  now = new Date(),
): ConceptPractice {
  return {
    attempts: (previous?.attempts ?? 0) + 1,
    independent: (previous?.independent ?? 0) + Number(independent),
    recent: [...(previous?.recent ?? []), independent].slice(-8),
    lastPractisedAt: now.toISOString(),
  };
}
export function conceptStatus(p?: ConceptPractice): string {
  if (!p?.attempts) return "Not practised yet";
  if (p.recent.filter(Boolean).length / p.recent.length < 0.8) return "Worth another practice";
  return p.recent.length < 3 ? "Building familiarity" : "Consistent recent practice";
}
const labels = (count: number) =>
  Array.from({ length: count }, (_, i) => `${Math.floor(i / 2) + 1}${i % 2 ? " &" : ""}`);

function rhythmReview(id: string, source: RhythmTask, round: number): RhythmTask {
  let cells = 8,
    stepBeats = 0.5,
    solution: number[][] = [[]],
    instruction = "",
    rows = ["Pattern"],
    pulse = false;
  if (id === "0-pulse") {
    cells = 3 + (round % 3);
    stepBeats = 1;
    solution = [Array.from({ length: cells }, (_, i) => i)];
    instruction = `Build ${cells} evenly spaced beats. Put an attack on every cell.`;
  } else if (id === "2-duration") {
    const patterns = [
      [0, 2, 4],
      [0, 4, 6],
      [0, 2, 3, 4, 6],
    ];
    solution = [patterns[round % 3]!];
    instruction = [
      "Build a quarter, a quarter, then a half note in 4/4.",
      "Build a half note, then two quarters in 4/4.",
      "Build a quarter, two eighths, then two quarters in 4/4.",
    ][round % 3]!;
  } else if (id === "2-dots") {
    solution = [round % 2 ? [0, 3, 4, 7] : [0, 1, 4, 5]];
    instruction =
      round % 2 === 0
        ? "Repeat an eighth followed by a dotted quarter, twice in 4/4."
        : "Repeat a dotted quarter followed by an eighth, twice in 4/4.";
  } else if (id === "2-syncopation") {
    const start = [1, 3, 5][round % 3]!;
    solution = [[start]];
    instruction = `Start on ${labels(8)[start]} and hold to the bar line. All earlier cells are rests; use just one attack.`;
  } else if (id === "8-polyrhythm") {
    const cycles = 2 - (round % 2);
    cells = 6 * cycles;
    stepBeats = 1 / 3;
    rows = round % 2 === 0 ? ["Two-part", "Three-part"] : ["Three-part", "Two-part"];
    solution = rows.map((row) =>
      Array.from({ length: cells }, (_, i) => i).filter(
        (i) => i % (row === "Two-part" ? 3 : 2) === 0,
      ),
    );
    instruction = `Build ${cycles} cycle${cycles === 1 ? "" : "s"} of 3:2. In each six cells, the three-part attacks every two cells and the two-part every three. Both begin together.`;
  } else {
    const groups =
      id === "2-meter" ? (round % 2 ? [2, 2, 2] : [3, 3]) : round % 2 ? [3, 2] : [3, 2, 2];
    cells = groups.reduce((a, b) => a + b);
    pulse = true;
    rows = ["Accents"];
    let start = 0;
    solution = [
      groups.map((n) => {
        const at = start;
        start += n;
        return at;
      }),
    ];
    instruction = `Group ${cells} subdivisions as ${groups.join(" + ")}. Accent the first cell in each group; the remaining cells stay quiet.`;
  }
  return {
    ...source,
    labels:
      stepBeats === 0.5 && !pulse
        ? labels(cells)
        : Array.from({ length: cells }, (_, i) => String(i + 1)),
    title: "A fresh rhythm",
    instruction,
    hint: instruction,
    explanation: `The attacks match. ${instruction}`,
    rows,
    stepBeats,
    subdivisionPulse: pulse,
    solution,
    initial: rows.map(() => []),
  };
}

/** Deterministic rounds survive refresh; changing register never changes a task's harmonic rules. */
export function reviewActivity(unitId: string, round: number): LessonActivity | undefined {
  const original = activityForUnit(unitId);
  if (!original) return;
  const source = original.tasks[round % original.tasks.length]!;
  const shift = [2, 5, -2, 7][round % 4]!;
  let task: ActivityTask;
  if (source.kind === "listening") {
    const sounds = source.sounds.map((s) => ({ ...s, midi: s.midi + shift }));
    const answer = source.options[source.solution[0]![0]!]!;
    const clue =
      source.skill === "pitch"
        ? `The second sound is ${answer.toLowerCase()}. First: ${noteName(sounds[0]!.midi)}; second: ${noteName(sounds[1]!.midi)}.`
        : source.skill === "dynamics"
          ? `The second sound is ${answer.toLowerCase()}; both notes have the same pitch.`
          : `The mystery sound matches ${answer}.`;
    task = {
      ...source,
      sounds,
      explanation: clue,
      writtenClue: clue,
      references: source.references?.map((r) => ({
        ...r,
        sound: { ...r.sound, midi: r.sound.midi + shift },
      })),
    };
  } else if (source.kind === "rhythm") task = rhythmReview(unitId, source, round);
  else {
    const move = (notes: number[]) => notes.map((n) => n + shift);
    const base = {
      ...source,
      choices: source.choices.map((c) => ({
        midi: c.midi + shift,
        label: noteName(c.midi + shift),
      })),
      solution: source.solution.map(move),
      initial: source.initial.map(move),
    };
    if (source.kind === "chord") {
      const direction = `${Math.abs(shift)} semitones ${shift > 0 ? "higher" : "lower"}`;
      task = {
        ...base,
        kind: "chord",
        context: source.context?.map(move),
        title: `Transfer: ${source.title}`,
        instruction: `Reference voicing, low to high: ${source.solution[0]!.map((n) => noteName(n)).join(" · ")}. Rebuild it ${direction}, keeping the same chord quality and bass position. The accompaniment has moved with it.`,
        hint: "Move every note by the same number of semitones; preserve the distances between notes.",
        explanation: `The same voicing moved ${direction}: ${base.solution[0]!.map((n) => noteName(n)).join(" · ")}.`,
      };
    } else {
      const tonic = (source.tonic ?? (source.rule === "dorian" ? 62 : 60)) + shift;
      const directions: Record<VoiceTask["rule"], string> = {
        consonant:
          "Choose consonances above the bass. Repair moving parallel fifths or octaves and avoid similar motion into a perfect interval.",
        contrary:
          "Make the upper voice move opposite to the bass at every change, using consonances.",
        cadence: "Close with contrary steps into an octave above the final bass.",
        passing:
          "Connect two consonances with a weak dissonance, approached and left by step in the same direction.",
        suspension:
          "Prepare a consonance, hold it as a fourth over the changing bass, then resolve down by step to a third.",
        chordTones: "Choose a melody note belonging to each chord shown below it.",
        line: `Begin and end on ${noteName(tonic)}. Use one unique highest note. Keep leaps within a fifth and recover each leap by step in the opposite direction.`,
        dorian: `Include ${noteName(tonic + 3)} and ${noteName(tonic + 9)}, and finish on ${noteName(tonic)} to show the Dorian colour.`,
        exact:
          unitId === "10-development"
            ? `Invert the reference around ${noteName(tonic)}: turn each upward distance into the same downward distance.`
            : "Transpose the reference up a perfect fifth (seven semitones).",
      };
      task = {
        ...base,
        kind: "voice",
        rule: source.rule,
        bass: move(source.bass),
        positions: source.positions,
        chords: source.chords?.map(move),
        tonic,
        title: `Fresh phrase: ${source.title}`,
        instruction: directions[source.rule],
        hint: directions[source.rule],
        explanation: `This phrase satisfies the task. ${directions[source.rule]}`,
      };
    }
  }
  task = { ...task, id: `review-${round}`, initial: task.initial.map((r) => [...r]) };
  return { title: "Practical recall · a fresh example", tasks: [task] };
}
