import { it } from "node:test";
import assert from "node:assert/strict";
import { activityForUnit } from "./activity-catalog.ts";
import { activityPlan, activeTeachingStep, examplePlan } from "./teaching-playback.ts";
import { lessonFor } from "./lessons.ts";

it("keeps a silent gap and separate visual cues between the pitch comparison notes", () => {
  const p = examplePlan(lessonFor(0).sections[0]!.example!);
  assert.equal(activeTeachingStep(p, 0.2), 0);
  assert.equal(activeTeachingStep(p, 0.9), -1);
  assert.equal(activeTeachingStep(p, 1.1), 1);
  assert.deepEqual(
    p.events.map((e) => e.notes),
    [[60], [72]],
  );
});
it("holds the suspension through the bass change and isolates either part", () => {
  const task = activityForUnit("9-suspensions")!.tasks[0]!;
  const p = activityPlan(task, task.solution);
  assert.equal(p.events.filter((e) => e.notes[0] === 60).length, 1);
  assert.ok(p.events.find((e) => e.notes[0] === 60)!.duration > 1.4);
  assert.deepEqual(
    activityPlan(task, task.solution, "upper").events.map((e) => e.notes),
    [[60], [59]],
  );
  assert.deepEqual(
    activityPlan(task, task.solution, "bass").events.map((e) => e.notes),
    [[53], [55]],
  );
});
it("aligns both polyrhythm rows to the same subdivision clock, including silent cells", () => {
  const task = activityForUnit("8-polyrhythm")!.tasks[0]!;
  const p = activityPlan(task, task.solution);
  assert.equal(p.events.length, 5);
  assert.equal(p.steps.length, 6);
  assert.equal(p.events.filter((e) => e.at === 0).length, 2);
  assert.equal(activeTeachingStep(p, p.steps[3]!.at + 0.001), 3);
});
