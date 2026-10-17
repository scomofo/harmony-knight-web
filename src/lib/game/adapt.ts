import type { TopicId } from "./curriculum.ts";
import type { SkillMastery } from "./store.ts";

/**
 * Adaptivity, Phase 1 — mixed-session weighting.
 *
 * Turns the persisted per-topic mastery records into bounded weights
 * for the mixed session's shuffle-bag (`mixed-session.ts`). The design
 * owes its shape to the original app's adapt.ts — a recency-weighted
 * accuracy rate, gentle pressure toward what's been missed — but every
 * constant here is re-derived against this app's own evidence, and the
 * differences are the point: this module reads only `mastery`, writes
 * nothing, and can only reweight pools the existing gates produced.
 *
 * The evidence, honestly stated: `mastery[topicId].recentCorrect` is
 * the last 10 answers on that topic, newest last, written by the quiz,
 * rhythm, and practice screens — including the mixed session itself, so
 * the loop this module reads from is already closed. Nothing finer
 * exists in the save (the chosen-vs-correct pair is discarded at both
 * judgement points), so Phase 1 weights *topics*, never sub-skills.
 *
 * Guardrails, as mechanisms (each is pinned by adapt.test.ts and the
 * weighting tests in mixed-session.test.ts):
 *
 * - `MinEvidenceGate` — a topic earns a non-neutral weight only with at
 *   least {@link MIN_RECENT_FOR_WEIGHT} answers in its recent window.
 *   One bad afternoon (1–3 attempts) changes nothing.
 * - `WindowDecay` — the weight derives from the *rate over the rolling
 *   window*, never from lifetime counters. As a weighted topic
 *   improves, its recent rate rises and its weight returns to neutral
 *   on its own; no decay constant, no reset.
 * - `NeutralWeightsIdentity` — a fresh save, a thin save, and a
 *   uniformly strong save all produce all-neutral weights, and a
 *   session fed neutral weights deals exactly as the unweighted
 *   session does. Cold start is the default state, not a mode.
 * - `SchedulingUntouched` — this module imports nothing from the
 *   review ladder, the SR queue, or grade progression, and reads none
 *   of their state. It cannot steer them and they cannot steer it.
 *
 * The emphasis itself is capped downstream (`ExtraSlotCap` in
 * mixed-session.ts): a weight above 1 earns a study at most one extra
 * slot per bag, so the largest weight here (2) is a bound on pressure,
 * not a share.
 */

/** Fewest recent answers before a topic may earn a non-neutral weight. */
export const MIN_RECENT_FOR_WEIGHT = 4;

/** Recent rate at or above which a topic is doing fine: weight 1. */
export const STRONG_RATE = 0.8;

/** Recent rate at or below which a topic gets the maximum weight. */
export const WEAK_RATE = 0.4;

/** The largest weight a topic can earn. The bag cap makes this a bound. */
export const MAX_WEIGHT = 2;

/**
 * Weight for one recent-accuracy rate: neutral at {@link STRONG_RATE},
 * {@link MAX_WEIGHT} at {@link WEAK_RATE}, a single linear ramp between.
 * The cap lives in the ramp — a rate of 0 weighs exactly 2, not more.
 */
export function weightForRate(rate: number): number {
  if (rate >= STRONG_RATE) return 1;
  if (rate <= WEAK_RATE) return MAX_WEIGHT;
  return 1 + (STRONG_RATE - rate) / (STRONG_RATE - WEAK_RATE);
}

/** Recent accuracy for one mastery record, or null when it has no answers. */
export function recentRate(mastery: SkillMastery | undefined): number | null {
  if (!mastery || mastery.recentCorrect.length === 0) return null;
  const correct = mastery.recentCorrect.filter(Boolean).length;
  return correct / mastery.recentCorrect.length;
}

/**
 * Per-topic weights from the persisted mastery records. Pure: same save
 * in, same weights out, and the caller's session freezes them at
 * creation (`StableWithinEpisode`). Every recorded topic gets an entry;
 * topics below the evidence gate, and topics doing fine, sit at exactly
 * 1 — neutral is a value here, not an absence.
 */
export function topicWeights(
  mastery: Record<string, SkillMastery>,
): Partial<Record<TopicId, number>> {
  const weights: Partial<Record<TopicId, number>> = {};
  for (const [topicId, record] of Object.entries(mastery)) {
    if (record.recentCorrect.length < MIN_RECENT_FOR_WEIGHT) {
      weights[topicId as TopicId] = 1;
      continue;
    }
    const rate = recentRate(record);
    weights[topicId as TopicId] = rate === null ? 1 : weightForRate(rate);
  }
  return weights;
}

/**
 * Learner-facing plain names for the topics a mixed study can evidence,
 * for the mixed screen's transparency line ("More intervals this
 * session…"). Keyed by topic; the line names the *topic* being
 * emphasised, in the words the study labels already use.
 */
const TOPIC_PLAIN_NAMES: Partial<Record<TopicId, string>> = {
  sensory: "listening",
  rhythm: "rhythm",
  scales: "scales",
  keys: "key signatures",
  intervals: "intervals",
  triads: "triads",
  harmony: "cadences",
  modulation: "related keys",
};

export function topicPlainName(topicId: TopicId): string {
  return TOPIC_PLAIN_NAMES[topicId] ?? topicId;
}
