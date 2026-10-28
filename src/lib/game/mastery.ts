import { activityComplete, type ActivityProgress, type LessonActivity } from "./activities.ts";
import { servedChecks, type UnitProgress } from "./learning.ts";
import type { PracticalReview } from "./practical-review.ts";
import type { CourseUnit } from "./course.ts";

/** Eventual solutions are not independent evidence: every first check must be unaided and correct. */
export function independentPractical(
  activity: LessonActivity | undefined,
  progress: ActivityProgress | undefined,
): boolean {
  return Boolean(
    activity &&
    progress &&
    activityComplete(activity, progress) &&
    activity.tasks.every((task) => {
      const evidence = progress.tasks[task.id];
      return evidence?.firstCorrect === true && evidence.assisted === false;
    }),
  );
}

export function independentRecall(unit: CourseUnit, progress: UnitProgress): boolean {
  const checks = servedChecks(unit, progress);
  return (
    !progress.assisted &&
    checks.length > 0 &&
    checks.every((question, index) => progress.answers[index] === question.answer)
  );
}

export function independentInitialCompletion(
  unit: CourseUnit,
  progress: UnitProgress,
  activity: LessonActivity | undefined,
  activityProgress: ActivityProgress | undefined,
): boolean {
  return (
    progress.step === 3 &&
    !progress.reviewing &&
    independentRecall(unit, progress) &&
    independentPractical(activity, activityProgress)
  );
}

/** Security is awarded only for a completed practical-review round, never from aggregate counts. */
export function independentSecureReview(
  unit: CourseUnit,
  progress: UnitProgress,
  activity: LessonActivity | undefined,
  review: PracticalReview | undefined,
): boolean {
  return Boolean(
    review &&
    progress.step === 3 &&
    progress.reviewing &&
    independentPractical(activity, review.progress) &&
    independentRecall(unit, progress),
  );
}

export type LearningStatus = "in-progress" | "supported" | "independent" | "secure";

export function learningStatus(progress: UnitProgress | undefined): LearningStatus {
  if (!progress?.completedAt) return "in-progress";
  if (progress.securedAt) return "secure";
  if (progress.independentAt) return "independent";
  return "supported";
}
