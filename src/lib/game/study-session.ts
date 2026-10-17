import { rngFor } from "./rng.ts";

/**
 * Session seeding for the study screens (generated-practice Phase 3).
 *
 * A study session's seed is `hash(day, topic, sessionIndex)`: the day the
 * session is played, which study it is, and which session of that study it
 * is today (0 for the first, +1 each time the learner restarts it). The
 * index lives in the screen's own state — nothing is persisted — so a
 * refresh restarts the day's first session exactly (a bug report can name
 * the day and study and reproduce every question), while "train again"
 * deals a fresh, different session.
 */

/** The learner's local calendar day, `YYYY-MM-DD`. */
export function todayKey(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** The seeded rng stream for one study session. */
export function sessionRng(topic: string, sessionIndex: number, day: string = todayKey()): () => number {
  return rngFor("study", day, topic, sessionIndex);
}
