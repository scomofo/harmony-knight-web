import { COURSE_UNITS, unitById, type CourseUnit } from "./course.ts";
import type { CheckQuestion } from "./lessons.ts";
import { generateRecallPair } from "./recall-gen.ts";

export type UnitProgress = {
  /** Learn, try, question 1, question 2, summary. */
  step: number;
  answers: Record<number, string>;
  completedAt: string | null;
  nextReviewAt: string | null;
  intervalDays: number;
  reviewCount: number;
  reviewing: boolean;
  assisted: boolean;
  /** The generated pair used by a completed review, including after a reload. */
  completedReviewRound?: number;
};

export const freshUnitProgress = (): UnitProgress => ({
  step: 0,
  answers: {},
  completedAt: null,
  nextReviewAt: null,
  intervalDays: 0,
  reviewCount: 0,
  reviewing: false,
  assisted: false,
});

export function localDayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * The pair of recall checks a learner is actually served for this unit in
 * their current state — the single source the lesson screen renders, the
 * answer validator checks against, and the scheduler validates. First pass
 * (and any non-review revisit) serves the authored pair. During a review the
 * pair is generated for the unit's concept, seeded by the already-persisted
 * reviewCount, so it is fresh each round yet stable across a mid-review
 * refresh. Completed reviews retain that round for summaries and backups;
 * units without a generator keep their authored pair (see recall-gen.ts).
 * Pure in (unit, progress).
 */
export function servedChecks(unit: CourseUnit, progress: UnitProgress): CheckQuestion[] {
  const round = progress.reviewing
    ? progress.reviewCount
    : progress.step === 4
      ? progress.completedReviewRound
      : undefined;
  return round === undefined ? unit.checks : (generateRecallPair(unit.id, round) ?? unit.checks);
}

/** Finite, untimed steps; a revealed answer cannot be overwritten to inflate recall. */
export function answerUnit(unit: CourseUnit, progress: UnitProgress, answer: string): UnitProgress {
  const index = progress.step - 2;
  const question = servedChecks(unit, progress)[index];
  if (!question || progress.answers[index] !== undefined || !question.options.includes(answer))
    return progress;
  return { ...progress, answers: { ...progress.answers, [index]: answer } };
}

export function advanceUnit(
  unit: CourseUnit,
  progress: UnitProgress,
  now = new Date(),
): UnitProgress {
  if (progress.step >= 4) return progress;
  const checks = servedChecks(unit, progress);
  if (
    progress.step >= 2 &&
    !checks[progress.step - 2]?.options.includes(progress.answers[progress.step - 2]!)
  )
    return progress;
  if (progress.step < 3) return { ...progress, step: progress.step + 1 };
  if (!checks.every((q, i) => q.options.includes(progress.answers[i]!))) return progress;

  const first = !progress.completedAt;
  const due =
    progress.nextReviewAt !== null && new Date(progress.nextReviewAt).getTime() <= now.getTime();
  const recalled = !progress.assisted && checks.every((q, i) => q.answer === progress.answers[i]);
  // Rereading or early repeats do not lengthen the review interval or farm review credit.
  const schedule = first || due;
  const intervalDays = schedule
    ? !recalled
      ? 1
      : first
        ? 1
        : Math.min(30, Math.max(3, progress.intervalDays * 2 + 1))
    : progress.intervalDays;
  return {
    ...progress,
    step: 4,
    reviewing: false,
    completedReviewRound: progress.reviewing ? progress.reviewCount : undefined,
    completedAt: progress.completedAt ?? now.toISOString(),
    intervalDays,
    nextReviewAt: schedule
      ? new Date(now.getTime() + intervalDays * 864e5).toISOString()
      : progress.nextReviewAt,
    reviewCount: progress.reviewCount + (!first && due ? 1 : 0),
  };
}

export function nextUnit(
  progress: Record<string, UnitProgress>,
  activeId?: string | null,
): CourseUnit | undefined {
  const active = unitById(activeId);
  if (active && progress[active.id] && progress[active.id]!.step < 4) return active;
  if (active && progress[active.id]?.completedAt) {
    const following = COURSE_UNITS.slice(COURSE_UNITS.indexOf(active) + 1).find(
      (unit) => !progress[unit.id]?.completedAt,
    );
    if (following) return following;
  }
  return COURSE_UNITS.find((unit) => !progress[unit.id]?.completedAt);
}

/** The course is finished when every unit has a completion on record. */
export function courseComplete(progress: Record<string, UnitProgress>): boolean {
  return COURSE_UNITS.every((unit) => progress[unit.id]?.completedAt);
}

export function dueUnits(progress: Record<string, UnitProgress>, now = new Date()): CourseUnit[] {
  return COURSE_UNITS.filter((unit) => {
    const p = progress[unit.id];
    return p?.completedAt && p.nextReviewAt && new Date(p.nextReviewAt).getTime() <= now.getTime();
  }).sort((a, b) => progress[a.id]!.nextReviewAt!.localeCompare(progress[b.id]!.nextReviewAt!));
}

export function weekDays(now = new Date()): { key: string; label: string }[] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return {
      key: localDayKey(day),
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
    };
  });
}
