import { activityForUnit } from "./activity-catalog.ts";
import { unitById, type CourseUnit } from "./course.ts";

export const RETURN_THRESHOLD_MS = 48 * 36e5;

export function isReturning(lastActiveAt: string, now = new Date()): boolean {
  return now.getTime() - new Date(lastActiveAt).getTime() >= RETURN_THRESHOLD_MS;
}

/** Describes the same activity-backed or recall-only route that revisitUnit opens. */
export function reviewWorkload(unitId: string): string {
  const unit = unitById(unitId);
  if (!unit) return "Review · Untimed; stop anytime.";
  const questions = unit.checks.length;
  const recall = `${questions} recall question${questions === 1 ? "" : "s"}`;
  const tasks = activityForUnit(unitId)?.tasks.length ?? 0;
  if (!tasks) return `${recall} · Untimed; stop anytime.`;
  return `Fresh practical task${tasks === 1 ? "" : "s"} + ${recall} · Untimed; stop anytime.`;
}

/** Presentation-only deferral: the source array and all scheduling records remain untouched. */
export function triageDueUnits(
  due: CourseUnit[],
  returning: boolean,
  showAll: boolean,
): { visible: CourseUnit[]; deferred: number } {
  const visible = returning && !showAll ? due.slice(0, 1) : due;
  return { visible, deferred: due.length - visible.length };
}
