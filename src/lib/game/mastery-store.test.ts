import { it } from "node:test";
import assert from "node:assert/strict";
import { activityForUnit } from "./activity-catalog.ts";
import { reviewActivity } from "./practical-review.ts";
import { servedChecks } from "./learning.ts";
import { useGameStore } from "./store.ts";
import { unitById } from "./course.ts";

function solveCurrentActivity(id: string) {
  const state = useGameStore.getState();
  const review = state.practicalReviews[id];
  const activity = review ? reviewActivity(id, review.round)! : activityForUnit(id)!;
  activity.tasks.forEach((task, index) => {
    useGameStore.getState().updateLearningActivity(id, { type: "edit", draft: task.solution });
    useGameStore.getState().updateLearningActivity(id, { type: "check" });
    if (index < activity.tasks.length - 1)
      useGameStore.getState().updateLearningActivity(id, { type: "next" });
  });
}

function answerServedRecall(id: string, wrongFirst = false) {
  const unit = unitById(id)!;
  const checks = servedChecks(unit, useGameStore.getState().unitProgress[id]!);
  checks.forEach((question, index) => {
    const answer =
      wrongFirst && index === 0
        ? question.options.find((option) => option !== question.answer)!
        : question.answer;
    useGameStore.getState().answerLearningUnit(id, answer);
    useGameStore.getState().advanceLearningUnit(id);
  });
}

it("awards independent completion and one persistent secure transition without blocking or duplicate rewards", () => {
  const id = "4-triads";
  useGameStore.getState().resetProgress();
  useGameStore.getState().openUnit(id);
  useGameStore.getState().advanceLearningUnit(id);
  solveCurrentActivity(id);
  useGameStore.getState().advanceLearningUnit(id);
  answerServedRecall(id);
  let progress = useGameStore.getState().unitProgress[id]!;
  assert.equal(progress.step, 4);
  assert.ok(progress.independentAt);
  assert.equal(progress.securedAt, null);
  assert.equal(useGameStore.getState().harmonyPoints, 25);

  useGameStore.getState().revisitUnit(id, true);
  solveCurrentActivity(id);
  useGameStore.getState().advanceLearningUnit(id);
  answerServedRecall(id);
  progress = useGameStore.getState().unitProgress[id]!;
  const securedAt = progress.securedAt;
  assert.ok(securedAt);
  assert.equal(progress.secureReviewRound, 0);
  assert.equal(useGameStore.getState().harmonyPoints, 25);

  useGameStore.getState().revisitUnit(id, false);
  assert.equal(useGameStore.getState().unitProgress[id]!.securedAt, securedAt);
  assert.equal(useGameStore.getState().unitProgress[id]!.secureReviewRound, 0);
  useGameStore.getState().revisitUnit(id, true);
  solveCurrentActivity(id);
  useGameStore.getState().advanceLearningUnit(id);
  answerServedRecall(id);
  assert.equal(useGameStore.getState().unitProgress[id]!.securedAt, securedAt);
  assert.equal(useGameStore.getState().harmonyPoints, 25);
});

it("allows incorrect initial recall to complete without calling it independent", () => {
  const id = "0-pitch";
  useGameStore.getState().resetProgress();
  useGameStore.getState().openUnit(id);
  useGameStore.getState().advanceLearningUnit(id);
  solveCurrentActivity(id);
  useGameStore.getState().advanceLearningUnit(id);
  answerServedRecall(id, true);
  const progress = useGameStore.getState().unitProgress[id]!;
  assert.equal(progress.step, 4);
  assert.ok(progress.completedAt);
  assert.equal(progress.independentAt, null);
  assert.equal(progress.securedAt, null);
  assert.equal(useGameStore.getState().harmonyPoints, 25);
});
