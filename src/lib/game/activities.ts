import { counterpointQuality, validateMove, violationLabel } from "./duel.ts";

export type NoteChoice = { midi: number; label: string };
type ExerciseBase = {
  id: string;
  title: string;
  instruction: string;
  hint: string;
  explanation: string;
  /** Rows of MIDI notes, or onset indices for a rhythm. */
  solution: number[][];
  initial: number[][];
};
export type ChordTask = ExerciseBase & {
  kind: "chord";
  choices: NoteChoice[];
  context?: number[][];
};
export type RhythmTask = ExerciseBase & {
  kind: "rhythm";
  labels: string[];
  rows: string[];
  stepBeats: number;
  /** Accent exercises play quiet subdivisions beneath the selected attacks. */
  subdivisionPulse?: boolean;
};
export type VoiceTask = ExerciseBase & {
  kind: "voice";
  choices: NoteChoice[];
  bass: number[];
  positions: string[];
  rule:
    | "consonant"
    | "contrary"
    | "cadence"
    | "passing"
    | "suspension"
    | "chordTones"
    | "line"
    | "exact"
    | "dorian";
  chords?: number[][];
  tonic?: number;
};
export type ListeningSound = {
  midi: number;
  volume?: number;
  timbre?: "Warm" | "Hollow" | "Bright" | "Reed";
};
export type ListeningTask = ExerciseBase & {
  kind: "listening";
  skill: "pitch" | "dynamics" | "timbre";
  sounds: ListeningSound[];
  options: string[];
  references?: { label: string; sound: ListeningSound }[];
  writtenClue: string;
};
export type ActivityTask = ChordTask | RhythmTask | VoiceTask | ListeningTask;
export type LessonActivity = { title: string; tasks: ActivityTask[] };
export type ActivityFeedback = { correct: boolean; message: string };
export type TaskProgress = {
  draft: number[][];
  checks: number;
  firstCorrect: boolean | null;
  assisted: boolean;
  solved: boolean;
  feedback?: ActivityFeedback;
  hintLevel?: number;
  beforeCorrection?: number[][];
};
export type ActivityProgress = { index: number; tasks: Record<string, TaskProgress> };
export type ActivityAction =
  | { type: "edit"; draft: number[][] }
  | { type: "check" | "hint" | "reveal" | "next" | "previous" | "retry" };

const copy = (rows: number[][]) => rows.map((row) => [...row]);
const same = (a: number[], b: number[]) => a.length === b.length && a.every((n, i) => n === b[i]);
const sorted = (a: number[]) => [...a].sort((a, b) => a - b);
const step = (a: number, b: number) => Math.abs(a - b) >= 1 && Math.abs(a - b) <= 2;
const consonant = (bass: number, upper: number) =>
  upper >= bass && counterpointQuality(upper - bass) !== "dissonance";

export function taskProgress(task: ActivityTask, saved?: TaskProgress): TaskProgress {
  return (
    saved ?? {
      draft: copy(task.initial),
      checks: 0,
      firstCorrect: null,
      assisted: false,
      solved: false,
    }
  );
}

export function activityComplete(activity: LessonActivity, progress?: ActivityProgress): boolean {
  return activity.tasks.every((task) => progress?.tasks[task.id]?.solved);
}

/** Teaching checks are specific to the named style; passing tones and suspensions are deliberate exceptions. */
export function evaluateActivity(task: ActivityTask, draft: number[][]): ActivityFeedback {
  const fail = (message: string): ActivityFeedback => ({ correct: false, message });
  const pass = (): ActivityFeedback => ({ correct: true, message: task.explanation });
  if (task.kind === "listening") {
    const picked = draft[0]?.[0];
    if (
      draft.length !== 1 ||
      draft[0]?.length !== 1 ||
      !Number.isInteger(picked) ||
      picked! < 0 ||
      picked! >= task.options.length
    )
      return fail("Choose one answer after comparing the sounds or using the written clue.");
    return picked === task.solution[0]![0]
      ? pass()
      : fail(`Listen again and compare with the references. ${task.hint}`);
  }
  if (task.kind === "rhythm") {
    if (
      draft.length !== task.rows.length ||
      draft.some(
        (row) =>
          row.some((n) => !Number.isInteger(n) || n < 0 || n >= task.labels.length) ||
          new Set(row).size !== row.length,
      )
    ) {
      return fail("Use the marked subdivisions in each row.");
    }
    for (let row = 0; row < task.rows.length; row++) {
      const target = task.solution[row]!;
      const extra = draft[row]!.filter((n) => !target.includes(n));
      const missing = target.filter((n) => !draft[row]!.includes(n));
      if (extra.length || missing.length) {
        return fail(
          `${task.rows[row]}: ${extra.length ? `${extra.length} extra attack${extra.length === 1 ? "" : "s"}` : ""}${extra.length && missing.length ? " and " : ""}${missing.length ? `${missing.length} missing attack${missing.length === 1 ? "" : "s"}` : ""}. ${task.hint}`,
        );
      }
    }
    return pass();
  }
  const notes = draft[0] ?? [];
  if (draft.length !== 1 || notes.some((n) => !task.choices.some((choice) => choice.midi === n))) {
    return fail("Choose the notes using the available controls.");
  }
  if (task.kind === "chord") {
    if (new Set(notes).size !== notes.length || !same(sorted(notes), sorted(task.solution[0]!))) {
      return fail(
        `Choose ${task.solution[0]!.length} notes in the requested register. ${task.hint}`,
      );
    }
    return pass();
  }
  if (notes.length !== task.bass.length) return fail("Choose one upper note for every position.");
  if (task.rule === "exact") {
    return same(notes, task.solution[0]!) ? pass() : fail(task.hint);
  }
  if (task.rule === "line") {
    if (notes[0] !== (task.tonic ?? 60) || notes.at(-1) !== (task.tonic ?? 60))
      return fail("Begin and end on the tonic named in the task to frame the line.");
    const peak = Math.max(...notes);
    if (notes.filter((n) => n === peak).length !== 1)
      return fail("Give the phrase one highest note, heard just once.");
    for (let i = 1; i < notes.length; i++) {
      const move = notes[i]! - notes[i - 1]!;
      if (Math.abs(move) > 7) return fail(`Position ${i + 1}: keep leaps within a fifth.`);
      if (
        Math.abs(move) > 2 &&
        (i === notes.length - 1 ||
          !step(notes[i]!, notes[i + 1]!) ||
          Math.sign(notes[i + 1]! - notes[i]!) === Math.sign(move))
      ) {
        return fail(
          `After the leap into position ${i + 1}, move by step in the opposite direction.`,
        );
      }
    }
    return pass();
  }
  if (task.rule === "dorian") {
    const tonic = task.tonic ?? 62;
    return notes.includes(tonic + 3) && notes.includes(tonic + 9) && notes.at(-1) === tonic
      ? pass()
      : fail(
          "Include the minor third and natural sixth named in the task, and finish on its tonic.",
        );
  }
  if (task.rule === "chordTones") {
    const bad = notes.findIndex(
      (n, i) => !task.chords![i]!.some((chordNote) => chordNote % 12 === n % 12),
    );
    return bad < 0
      ? pass()
      : fail(
          `Position ${bad + 1}: choose a note belonging to the chord shown below it. ${task.hint}`,
        );
  }
  if (notes.some((n, i) => n < task.bass[i]!))
    return fail("Keep the upper voice at or above the bass.");
  if (task.rule === "passing") {
    const [a, b, c] = notes as [number, number, number];
    return consonant(task.bass[0]!, a) &&
      consonant(task.bass[2]!, c) &&
      !consonant(task.bass[1]!, b) &&
      step(a, b) &&
      step(b, c) &&
      Math.sign(b - a) === Math.sign(c - b)
      ? pass()
      : fail(
          "Connect two consonances with a weak-beat dissonance. Approach and leave it by step in the same direction.",
        );
  }
  if (task.rule === "suspension") {
    const [a, b, c] = notes as [number, number, number];
    return consonant(task.bass[0]!, a) &&
      a === b &&
      (b - task.bass[1]!) % 12 === 5 &&
      step(b, c) &&
      c < b &&
      [3, 4].includes((c - task.bass[2]!) % 12)
      ? pass()
      : fail(
          "Prepare a consonance, hold the same upper note over the changing bass as a fourth, then resolve down by step to a third.",
        );
  }
  for (let i = 0; i < notes.length; i++) {
    const result = validateMove({
      cantusNote: { midi: task.bass[i]! },
      userNote: { midi: notes[i]! },
      previousCantusNote: i ? { midi: task.bass[i - 1]! } : undefined,
      previousUserNote: i ? { midi: notes[i - 1]! } : undefined,
    });
    if (!result.isValid) {
      return fail(
        `Position ${i + 1}: ${result.violations[0] ? violationLabel(result.violations[0]) : "choose a consonance above the bass. A fourth is dissonant in this two-voice style."}`,
      );
    }
    if (i && (task.rule === "contrary" || task.rule === "cadence")) {
      const lowerMove = task.bass[i]! - task.bass[i - 1]!;
      const upperMove = notes[i]! - notes[i - 1]!;
      if (Math.sign(lowerMove) * Math.sign(upperMove) !== -1)
        return fail("Move the upper voice in the opposite direction to the bass at each change.");
      if (
        task.rule === "cadence" &&
        (!step(notes[i - 1]!, notes[i]!) || !step(task.bass[i - 1]!, task.bass[i]!))
      ) {
        return fail("Both voices need to move by step into the final octave.");
      }
    }
  }
  if (task.rule === "cadence" && notes.at(-1)! - task.bass.at(-1)! !== 12)
    return fail("Finish one octave above the final bass note.");
  return pass();
}

/** Persist drafts and first-check outcomes independently from lesson recall or game XP. */
export function updateActivity(
  activity: LessonActivity,
  saved: ActivityProgress | undefined,
  action: ActivityAction,
): ActivityProgress {
  const progress = saved ?? { index: 0, tasks: {} };
  const task = activity.tasks[progress.index];
  if (!task) return progress;
  const current = taskProgress(task, progress.tasks[task.id]);
  if (action.type === "next" || action.type === "previous") {
    const index = action.type === "next" ? progress.index + 1 : progress.index - 1;
    if (index < 0 || index >= activity.tasks.length || (action.type === "next" && !current.solved))
      return progress;
    return { ...progress, index };
  }
  let next = current;
  if (action.type === "retry") {
    next = { ...current, draft: copy(task.initial), solved: false, feedback: undefined };
  } else if (current.solved) return progress;
  else if (action.type === "edit")
    next = { ...current, draft: copy(action.draft), feedback: undefined };
  else if (action.type === "hint")
    next = { ...current, hintLevel: Math.min(2, (current.hintLevel ?? 0) + 1), assisted: true };
  else if (action.type === "reveal")
    next = {
      ...current,
      beforeCorrection: current.beforeCorrection ?? copy(current.draft),
      draft: copy(task.solution),
      hintLevel: 3,
      assisted: true,
      feedback: undefined,
    };
  else if (action.type === "check") {
    if (current.feedback) return progress; // repeated clicks on an unchanged answer are one check
    const feedback = evaluateActivity(task, current.draft);
    next = {
      ...current,
      feedback,
      solved: feedback.correct,
      checks: current.checks + 1,
      firstCorrect: current.firstCorrect ?? (feedback.correct && !current.assisted),
    };
  }
  return { ...progress, tasks: { ...progress.tasks, [task.id]: next } };
}
