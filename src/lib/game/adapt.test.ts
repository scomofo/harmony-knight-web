import { it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  MAX_WEIGHT,
  MIN_RECENT_FOR_WEIGHT,
  STRONG_RATE,
  WEAK_RATE,
  recentRate,
  topicPlainName,
  topicWeights,
  weightForRate,
} from "./adapt.ts";
import type { SkillMastery } from "./store.ts";

/** A mastery record whose recent window is exactly `window`, newest last. */
function masteryWith(window: boolean[], lifetime?: { attempts: number; correct: number }) {
  return (topicId: string): SkillMastery => ({
    topicId,
    attempts: lifetime?.attempts ?? window.length,
    correct: lifetime?.correct ?? window.filter(Boolean).length,
    totalResponseMs: 0,
    bestConfidence: 0,
    recentCorrect: window,
  });
}

const rate = (correct: number, n: number) =>
  Array.from({ length: n }, (_, i) => i < correct);

/* ------------------------------------------------------------- the ramp */

it("weightForRate pins the ramp: neutral at STRONG_RATE, capped at WEAK_RATE", () => {
  assert.equal(weightForRate(1), 1);
  assert.equal(weightForRate(STRONG_RATE), 1);
  assert.equal(weightForRate(WEAK_RATE), MAX_WEIGHT);
  // The cap is in the ramp, not a clamp after the fact: worse than weak
  // still weighs exactly MAX_WEIGHT.
  assert.equal(weightForRate(0), MAX_WEIGHT);
  // Midpoint of the ramp weighs halfway.
  assert.ok(Math.abs(weightForRate((STRONG_RATE + WEAK_RATE) / 2) - 1.5) < 1e-9);
  // Just inside the ramp the weight moves just above neutral.
  const just = weightForRate(0.79);
  assert.ok(just > 1 && just < 1.1, `rate 0.79 weighs ${just}`);
});

/* ------------------------------------------------------ MinEvidenceGate */

it("MinEvidenceGate: fewer than 4 recent answers earns exactly neutral", () => {
  const rec = masteryWith([false, false, false]);
  // Three straight misses — a bad afternoon, not evidence.
  assert.equal(topicWeights({ intervals: rec("intervals") }).intervals, 1);
  assert.equal(MIN_RECENT_FOR_WEIGHT, 4);
  // The fourth answer opens the gate; all four wrong hits the cap.
  const four = masteryWith([false, false, false, false]);
  assert.equal(topicWeights({ intervals: four("intervals") }).intervals, MAX_WEIGHT);
});

it("the gate and ramp read the window that is actually there", () => {
  // n = 4 at rate 0.75 → just above 1 on the ramp.
  const w = topicWeights({ triads: masteryWith(rate(3, 4))("triads") }).triads!;
  assert.ok(Math.abs(w - 1.125) < 1e-9, `rate 0.75 at n=4 weighs ${w}`);
  // n = 10 at rate 0.3 → below WEAK_RATE, capped at exactly 2.
  const weak = topicWeights({ triads: masteryWith(rate(3, 10))("triads") }).triads;
  assert.equal(weak, MAX_WEIGHT);
});

/* ---------------------------------------------- NeutralWeightsIdentity */

it("NeutralWeightsIdentity: fresh, thin, and strong saves are all-neutral", () => {
  // Fresh save: no records at all.
  assert.deepEqual(topicWeights({}), {});
  // Thin save: records exist but nobody clears the evidence gate.
  const thin = topicWeights({
    intervals: masteryWith([false])("intervals"),
    triads: masteryWith([true, false])("triads"),
  });
  assert.deepEqual(thin, { intervals: 1, triads: 1 });
  // Strong save: every topic at or above STRONG_RATE over a full window.
  const strong = topicWeights({
    intervals: masteryWith(rate(9, 10))("intervals"),
    triads: masteryWith(rate(8, 10))("triads"),
    rhythm: masteryWith(rate(4, 4))("rhythm"),
  });
  assert.deepEqual(strong, { intervals: 1, triads: 1, rhythm: 1 });
});

/* --------------------------------------------------------- WindowDecay */

it("WindowDecay: the rolling window decides, never lifetime counters", () => {
  // A topic with a dreadful lifetime record whose recent window is
  // perfect weighs neutral — it recovered, and the weight noticed.
  const recovered = masteryWith(rate(10, 10), { attempts: 500, correct: 100 });
  assert.equal(topicWeights({ intervals: recovered("intervals") }).intervals, 1);
  // And the reverse: a strong lifetime with a shaky recent window is
  // weighted on the window alone.
  const slipped = masteryWith(rate(2, 10), { attempts: 500, correct: 490 });
  assert.equal(topicWeights({ intervals: slipped("intervals") }).intervals, MAX_WEIGHT);
  assert.equal(recentRate(recovered("intervals")), 1);
  assert.equal(recentRate(undefined), null);
});

/* --------------------------------------------------- SchedulingUntouched */

it("SchedulingUntouched: the adaptive path imports no scheduling state", () => {
  // Pinned at the source level, the way the course-pins tests pin
  // curriculum coupling: adaptivity reads mastery and nothing else.
  for (const file of ["adapt.ts", "mixed-session.ts"]) {
    const source = readFileSync(new URL(`./${file}`, import.meta.url), "utf8");
    for (const banned of ["learning.ts", "sr.ts", "review.ts", "intervalDays", "nextReviewAt"]) {
      assert.ok(!source.includes(banned), `${file} must not reference ${banned}`);
    }
  }
});

/* ------------------------------------------------------------ copy names */

it("topicPlainName names the mixed topics in plain words", () => {
  assert.equal(topicPlainName("intervals"), "intervals");
  assert.equal(topicPlainName("keys"), "key signatures");
  assert.equal(topicPlainName("harmony"), "cadences");
  assert.equal(topicPlainName("sensory"), "listening");
});
