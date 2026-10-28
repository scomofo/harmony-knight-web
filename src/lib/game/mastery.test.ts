import { it } from "node:test";
import assert from "node:assert/strict";
import { unitById } from "./course.ts";
import { activityForUnit } from "./activity-catalog.ts";
import type { ActivityProgress, LessonActivity } from "./activities.ts";
import { freshUnitProgress, servedChecks } from "./learning.ts";
import {
  independentInitialCompletion,
  independentSecureReview,
  learningStatus,
} from "./mastery.ts";

const unit = unitById("4-triads")!;
const activity = activityForUnit(unit.id)!;

function practical(
  source: LessonActivity,
  options: { assisted?: boolean; wrongFirst?: boolean } = {},
): ActivityProgress {
  return {
    index: source.tasks.length - 1,
    tasks: Object.fromEntries(
      source.tasks.map((task) => [
        task.id,
        {
          draft: task.solution,
          checks: 1,
          firstCorrect: !options.wrongFirst,
          assisted: options.assisted ?? false,
          solved: true,
        },
      ]),
    ),
  };
}

function recallProgress(reviewing = false) {
  const progress = { ...freshUnitProgress(), step: 3, reviewing };
  return {
    ...progress,
    answers: Object.fromEntries(
      servedChecks(unit, progress).map((question, index) => [index, question.answer]),
    ),
  };
}

it("distinguishes guided, corrected and independent initial completion", () => {
  const independent = recallProgress();
  assert.equal(
    independentInitialCompletion(unit, independent, activity, practical(activity)),
    true,
  );
  assert.equal(
    independentInitialCompletion(
      unit,
      independent,
      activity,
      practical(activity, { assisted: true }),
    ),
    false,
  );
  assert.equal(
    independentInitialCompletion(
      unit,
      independent,
      activity,
      practical(activity, { wrongFirst: true }),
    ),
    false,
  );
  const wrongRecall = {
    ...independent,
    answers: {
      ...independent.answers,
      0: unit.checks[0]!.options.find((answer) => answer !== unit.checks[0]!.answer)!,
    },
  };
  assert.equal(
    independentInitialCompletion(unit, wrongRecall, activity, practical(activity)),
    false,
  );
});

it("requires a fresh unaided practical review and correct unaided recall for security", () => {
  const progress = recallProgress(true);
  const review = { round: 0, progress: practical(activity), completedAt: null };
  assert.equal(independentSecureReview(unit, progress, activity, review), true);
  assert.equal(
    independentSecureReview(unit, { ...progress, assisted: true }, activity, review),
    false,
  );
  assert.equal(
    independentSecureReview(unit, progress, activity, {
      ...review,
      progress: practical(activity, { wrongFirst: true }),
    }),
    false,
  );
  assert.equal(
    independentSecureReview(unit, progress, activity, {
      ...review,
      progress: practical(activity, { assisted: true }),
    }),
    false,
  );
  assert.equal(independentSecureReview(unit, progress, undefined, review), false);
});

it("uses conservative legacy defaults and keeps secured history during rereading", () => {
  assert.equal(
    learningStatus({ ...freshUnitProgress(), completedAt: "2026-01-01T00:00:00Z" }),
    "supported",
  );
  const secure = {
    ...freshUnitProgress(),
    completedAt: "2026-01-01T00:00:00Z",
    securedAt: "2026-01-03T00:00:00Z",
    secureReviewRound: 0,
  };
  assert.equal(learningStatus(secure), "secure");
  assert.equal(learningStatus({ ...secure, step: 0, answers: {}, assisted: true }), "secure");
});
