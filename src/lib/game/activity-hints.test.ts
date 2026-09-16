import { it } from "node:test";
import assert from "node:assert/strict";
import { activityForUnit } from "./activity-catalog.ts";
import { updateActivity } from "./activities.ts";
import { activityHint } from "./activity-hints.ts";

it("preserves the original answer and assistance through progressively stronger help", () => {
  const a = activityForUnit("4-triads")!;
  let p = updateActivity(a, undefined, { type: "edit", draft: [[60, 63, 67]] });
  p = updateActivity(a, p, { type: "hint" });
  assert.equal(p.tasks.major!.hintLevel, 1);
  assert.deepEqual(p.tasks.major!.draft, [[60, 63, 67]]);
  const hint = activityHint(a.tasks[0]!, p.tasks.major!.draft, 2);
  assert.deepEqual(
    hint.focus.map((f) => f.midi),
    [63, 64],
  );
  p = updateActivity(a, p, { type: "reveal" });
  assert.deepEqual(p.tasks.major!.beforeCorrection, [[60, 63, 67]]);
  p = updateActivity(a, p, { type: "check" });
  assert.equal(p.tasks.major!.firstCorrect, false);
  assert.equal(p.tasks.major!.solved, true);
});
it("does not flag a valid alternate voice leading merely because it differs from the example", () => {
  const t = activityForUnit("6-parallels")!.tasks[0]!;
  assert.deepEqual(activityHint(t, [[64, 65]], 2).focus, []);
  assert.equal(activityHint(t, [[67, 69]], 2).focus[0]!.index, 1);
});
