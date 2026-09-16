import type { ActivityTask, ListeningSound } from "./activities.ts";
import type { LessonExample } from "./lessons.ts";
import { noteName } from "./music.ts";

export type TeachingEvent = {
  at: number;
  duration: number;
  notes: number[];
  volume?: number;
  timbre?: ListeningSound["timbre"];
  click?: "accent" | "quiet";
};
export type TeachingStep = { at: number; duration: number; label: string; notes: number[] };
export type TeachingPlan = { events: TeachingEvent[]; steps: TeachingStep[]; duration: number };
export type PlaybackPart = "together" | "upper" | "bass";

function plan(events: TeachingEvent[], steps: TeachingStep[]): TeachingPlan {
  return {
    events,
    steps,
    duration: Math.max(
      0,
      ...events.map((e) => e.at + e.duration + 0.03),
      ...steps.map((s) => s.at + s.duration),
    ),
  };
}
export function soundPlan(sounds: ListeningSound[]): TeachingPlan {
  return plan(
    sounds.map((s, i) => ({
      at: i * 1.05,
      duration: 0.75,
      notes: [s.midi],
      volume: s.volume,
      timbre: s.timbre,
    })),
    sounds.map((s, i) => ({
      at: i * 1.05,
      duration: 0.78,
      label: sounds.length === 1 ? "Sound" : `Sound ${i + 1}`,
      notes: [s.midi],
    })),
  );
}
export function examplePlan(example: LessonExample): TeachingPlan {
  if (example.mode === "timbre")
    return soundPlan([{ midi: example.notes[0] as number, timbre: example.timbre }]);
  const chords =
    example.mode === "progression"
      ? (example.notes as number[][])
      : example.mode === "chord"
        ? [example.notes as number[]]
        : (example.notes as number[]).map((n) => [n]);
  const gap =
    example.mode === "progression"
      ? 0.85
      : (example.sequence?.gap ?? (chords.length > 5 ? 0.24 : 0.42));
  const duration =
    example.mode === "chord"
      ? 0.9
      : example.mode === "progression"
        ? 0.8
        : (example.sequence?.duration ?? (chords.length > 5 ? 0.32 : 0.5));
  return plan(
    chords.map((notes, i) => ({ at: i * gap, duration, notes, volume: example.volumes?.[i] })),
    chords.map((notes, i) => ({
      at: i * gap,
      duration: i < chords.length - 1 ? Math.min(gap, duration + 0.03) : duration + 0.03,
      notes,
      label: notes.map((n) => noteName(n)).join(" · "),
    })),
  );
}

/** A single score drives both sound scheduling and visual positions. */
export function activityPlan(
  task: ActivityTask,
  draft: number[][],
  part: PlaybackPart = "together",
): TeachingPlan {
  if (task.kind === "listening") return soundPlan(task.sounds);
  if (task.kind === "chord")
    return examplePlan({
      label: task.title,
      mode: "progression",
      notes: [...(task.context ?? []), draft[0]!],
    });
  if (task.kind === "rhythm") {
    const stepSeconds = (60 / 72) * task.stepBeats;
    const events: TeachingEvent[] = [];
    if (task.subdivisionPulse) {
      for (let i = 0; i < task.labels.length; i++)
        events.push({
          at: i * stepSeconds,
          duration: 0.07,
          notes: [],
          click: draft.some((r) => r.includes(i)) ? "accent" : "quiet",
        });
    } else
      draft.forEach((row, r) => {
        const attacks = [...row].sort((a, b) => a - b);
        attacks.forEach((column, i) =>
          events.push({
            at: column * stepSeconds,
            duration: ((attacks[i + 1] ?? task.labels.length) - column) * stepSeconds - 0.02,
            notes: [r ? 55 : 67],
            volume: 0.65,
          }),
        );
      });
    return plan(
      events,
      task.labels.map((label, i) => ({
        at: i * stepSeconds,
        duration: stepSeconds,
        label,
        notes: draft.flatMap((row, r) => (row.some((n) => n <= i) ? [r ? 55 : 67] : [])),
      })),
    );
  }
  const upper = draft[0]!;
  const melodic = task.rule === "line" || task.rule === "exact";
  const gap = task.rule === "passing" ? 0.4 : melodic ? 0.55 : 0.75;
  const events: TeachingEvent[] = [];
  if (task.chords) {
    upper.forEach((n, i) =>
      events.push({
        at: i * gap,
        duration: gap - 0.03,
        notes:
          part === "upper" ? [n] : part === "bass" ? task.chords![i]! : [...task.chords![i]!, n],
      }),
    );
  } else {
    const line = (notes: number[], lower: boolean) => {
      for (let i = 0; i < notes.length; i++) {
        let end = i + 1;
        if (lower) while (end < notes.length && notes[end] === notes[i]) end++;
        else if (task.rule === "suspension" && i === 0 && notes[0] === notes[1]) end = 2;
        events.push({
          at: i * gap,
          duration: (end - i) * gap - 0.03,
          notes: [notes[i]!],
          volume: lower ? 0.55 : 0.8,
        });
        i = end - 1;
      }
    };
    if (part !== "bass" || melodic) line(upper, false);
    if (!melodic && part !== "upper") line(task.bass, true);
  }
  return plan(
    events,
    upper.map((n, i) => ({
      at: i * gap,
      duration: gap,
      label: `${i + 1}. ${task.positions[i]}`,
      notes:
        melodic || part === "upper" ? [n] : part === "bass" ? [task.bass[i]!] : [task.bass[i]!, n],
    })),
  );
}

export function activeTeachingStep(plan: TeachingPlan, elapsed: number): number {
  return plan.steps.findIndex((step) => elapsed >= step.at && elapsed < step.at + step.duration);
}
