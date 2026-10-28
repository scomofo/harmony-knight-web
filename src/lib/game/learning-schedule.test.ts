import { it } from "node:test";
import assert from "node:assert/strict";
import { unitById } from "./course.ts";
import { advanceUnit, freshUnitProgress, reviewIntervalDays } from "./learning.ts";

const successful = {
  practicalFirstChecksPass: true,
  recallCorrect: true,
  assisted: false,
};

it("pins the fixed 1, 3, 7, 15, 30 day policy and unsuccessful outcomes", () => {
  for (const [previous, expected] of [
    [1, 3],
    [3, 7],
    [7, 15],
    [15, 30],
    [30, 30],
  ])
    assert.equal(
      reviewIntervalDays({
        previousIntervalDays: previous,
        first: false,
        scheduled: true,
        ...successful,
      }),
      expected,
    );
  for (const evidence of [
    { ...successful, assisted: true },
    { ...successful, recallCorrect: false },
    { ...successful, practicalFirstChecksPass: false },
  ])
    assert.equal(
      reviewIntervalDays({ previousIntervalDays: 15, first: false, scheduled: true, ...evidence }),
      1,
    );
  assert.equal(
    reviewIntervalDays({ previousIntervalDays: 15, first: true, scheduled: true, ...successful }),
    1,
  );
});

it("clamps every policy outcome and never lengthens an early repeat", () => {
  assert.equal(
    reviewIntervalDays({ previousIntervalDays: 0, first: false, scheduled: false, ...successful }),
    1,
  );
  assert.equal(
    reviewIntervalDays({ previousIntervalDays: 99, first: false, scheduled: false, ...successful }),
    30,
  );
  assert.equal(
    reviewIntervalDays({ previousIntervalDays: 7, first: false, scheduled: false, ...successful }),
    7,
  );
});

it("keeps early repeat dates, intervals and review credit unchanged", () => {
  const unit = unitById("0-pitch")!;
  const nextReviewAt = "2026-02-01T00:00:00.000Z";
  const progress = {
    ...freshUnitProgress(),
    step: 3,
    completedAt: "2026-01-01T00:00:00.000Z",
    nextReviewAt,
    intervalDays: 7,
    reviewCount: 2,
    reviewing: true,
    answers: Object.fromEntries(unit.checks.map((question, index) => [index, question.answer])),
  };
  const next = advanceUnit(unit, progress, new Date("2026-01-20T00:00:00.000Z"));
  assert.equal(next.intervalDays, 7);
  assert.equal(next.nextReviewAt, nextReviewAt);
  assert.equal(next.reviewCount, 2);
});
