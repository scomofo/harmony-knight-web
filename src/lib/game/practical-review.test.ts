import { it } from "node:test";
import assert from "node:assert/strict";
import { LESSON_ACTIVITIES, activityForUnit } from "./activity-catalog.ts";
import { evaluateActivity } from "./activities.ts";
import { reviewActivity, conceptStatus } from "./practical-review.ts";
import { useGameStore } from "./store.ts";
import { unitById } from "./course.ts";
import { freshUnitProgress } from "./learning.ts";

it("authors valid fresh practical reviews for every interactive concept and keeps rounds stable", () => {
  for (const id of Object.keys(LESSON_ACTIVITIES))
    for (let round = 0; round < 8; round++) {
      const activity = reviewActivity(id, round)!;
      const task = activity.tasks[0]!;
      assert.equal(evaluateActivity(task, task.solution).correct, true, `${id}/${round}`);
      assert.deepEqual(reviewActivity(id, round), activity);
      assert.notDeepEqual(reviewActivity(id, round + 1), activity, `${id}: fresh next round`);
    }
});
it("keeps practical review evidence separate, resumes partial work, and never earns repeat XP", () => {
  useGameStore.getState().resetProgress();
  const id = "4-triads",
    s = useGameStore.getState();
  useGameStore.setState({
    unitProgress: {
      [id]: {
        ...freshUnitProgress(),
        step: 4,
        completedAt: "2026-01-01T00:00:00Z",
        nextReviewAt: "2026-01-02T00:00:00Z",
        intervalDays: 3,
      },
    },
  });
  s.revisitUnit(id, true);
  assert.equal(useGameStore.getState().unitProgress[id]!.step, 1);
  const a = reviewActivity(id, 0)!;
  s.updateLearningActivity(id, { type: "check" });
  s.revisitUnit(id, true);
  assert.equal(useGameStore.getState().practicalReviews[id]!.round, 0);
  s.updateLearningActivity(id, { type: "edit", draft: a.tasks[0]!.solution });
  s.updateLearningActivity(id, { type: "check" });
  assert.equal(useGameStore.getState().conceptPractice[id]!.attempts, 1);
  assert.equal(
    conceptStatus(useGameStore.getState().conceptPractice[id]),
    "Worth another practice",
  );
  s.advanceLearningUnit(id);
  for (const q of unitById(id)!.checks) {
    s.answerLearningUnit(id, q.answer);
    s.advanceLearningUnit(id);
  }
  assert.equal(
    useGameStore.getState().unitProgress[id]!.intervalDays,
    1,
    "a corrected practical review stays due soon",
  );
  assert.equal(useGameStore.getState().harmonyPoints, 0);
  assert.deepEqual(
    useGameStore.getState().activityProgress,
    {},
    "original activities are untouched",
  );
  assert.ok(useGameStore.getState().practicalReviews[id]!.completedAt);
  s.revisitUnit(id, true);
  assert.equal(useGameStore.getState().practicalReviews[id]!.round, 1);
});

it("provides a valid bounded activity for every course unit", async () => {
  const { COURSE_UNITS } = await import("./course.ts");
  for (const unit of COURSE_UNITS) {
    const activity = activityForUnit(unit.id);
    assert.ok(activity, unit.id);
    for (const task of activity.tasks)
      assert.ok(evaluateActivity(task, task.solution).correct, unit.id);
  }
});
it("requires both intervals and triads without removing study access", () => {
  useGameStore.getState().resetProgress();
  useGameStore.setState({ gradeLevel: 4 });
  const answer = (topicId: string) =>
    useGameStore
      .getState()
      .recordPractice({ midi: 60, correct: true, responseMs: 500, topicId, trackHeat: false });
  for (let i = 0; i < 20; i++) answer("intervals");
  assert.equal(useGameStore.getState().gradeLevel, 4);
  for (let i = 0; i < 3; i++) answer("triads");
  assert.equal(useGameStore.getState().gradeLevel, 5);
});

it("keeps named keys and minor-third spelling intact in early recall rounds", () => {
  for (let round = 0; round < 8; round++) {
    const interval = reviewActivity("4-intervals", round)!.tasks[0]!;
    assert.equal(interval.kind, "voice");
    if (interval.kind !== "voice") throw new Error("voice expected");
    assert.match(interval.instruction, /C-?\d · Eb-?\d/);
    assert.equal(interval.solution[0]![1]! - interval.solution[0]![0]!, 3);
    const major = reviewActivity("3-major", round)!.tasks[0]!;
    assert.match(major.title, /C major/);
    assert.equal(major.solution[0]![0]! % 12, 0);
  }
});
