import { it } from "node:test";
import assert from "node:assert/strict";
import { COURSE_UNITS } from "./course.ts";
import { isReturning, reviewWorkload, triageDueUnits } from "./review-plan.ts";

it("describes the actual practical and recall workload without a fixed minute estimate", () => {
  assert.equal(
    reviewWorkload("0-pitch"),
    "Fresh practical tasks + 2 recall questions · Untimed; stop anytime.",
  );
  assert.doesNotMatch(reviewWorkload("0-pitch"), /min|about/i);
});

it("keeps return triage presentation-only and preserves all due items for voluntary access", () => {
  const due = COURSE_UNITS.slice(0, 3);
  const snapshot = structuredClone(due);
  const triaged = triageDueUnits(due, true, false);
  assert.deepEqual(triaged.visible, [due[0]]);
  assert.equal(triaged.deferred, 2);
  assert.deepEqual(due, snapshot);
  assert.deepEqual(triageDueUnits(due, true, true).visible, due);
  assert.deepEqual(triageDueUnits(due, false, false).visible, due);
  assert.deepEqual(triageDueUnits([], true, false), { visible: [], deferred: 0 });
  assert.equal(isReturning("2026-01-01T00:00:00Z", new Date("2026-01-03T00:00:00Z")), true);
  assert.equal(isReturning("2026-01-01T00:00:01Z", new Date("2026-01-03T00:00:00Z")), false);
});
