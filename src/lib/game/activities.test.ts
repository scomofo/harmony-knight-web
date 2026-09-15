import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  activityComplete,
  evaluateActivity,
  updateActivity,
  type ActivityProgress,
} from "./activities.ts";
import { activityForUnit, LESSON_ACTIVITIES } from "./activity-catalog.ts";
import { unitById } from "./course.ts";
import { useGameStore } from "./store.ts";

const task = (id: string, index = 0) => activityForUnit(id)!.tasks[index]!;
const correct = (id: string, draft: number[][], index = 0) =>
  evaluateActivity(task(id, index), draft).correct;

describe("authored interactive activities", () => {
  it("provides valid, selectable worked answers for every task, without dangling unit IDs", () => {
    for (const [id, activity] of Object.entries(LESSON_ACTIVITIES)) {
      assert.ok(unitById(id), id);
      assert.ok(activity.tasks.length);
      assert.equal(new Set(activity.tasks.map((t) => t.id)).size, activity.tasks.length, id);
      for (const t of activity.tasks) {
        assert.deepEqual(
          evaluateActivity(t, t.solution),
          { correct: true, message: t.explanation },
          `${id}/${t.id}`,
        );
        if (t.kind === "voice") assert.equal(t.positions.length, t.solution[0]!.length);
        if (t.kind !== "rhythm") {
          assert.equal(new Set(t.choices.map((c) => c.midi)).size, t.choices.length);
          for (const n of t.initial.flat())
            assert.ok(
              t.choices.some((c) => c.midi === n),
              `${id}: initial note ${n}`,
            );
        }
      }
    }
  });
  it("judges chord quality and inversion by the actual pitches and lowest sounding note", () => {
    assert.equal(correct("4-triads", [[60, 63, 67]], 1), true);
    assert.equal(correct("4-triads", [[60, 64, 67]], 1), false);
    assert.equal(correct("4-inversions", [[72, 64, 67]], 1), true);
    assert.equal(correct("4-inversions", [[60, 64, 67]], 1), false);
    assert.equal(correct("4-inversions", [[64, 67, 72, 72]], 1), false);
    assert.equal(correct("8-sevenths", [[60, 64, 67, 70]]), false);
  });
  it("checks missing and extra attacks independently in both polyrhythm rows", () => {
    assert.equal(
      correct("8-polyrhythm", [
        [0, 2, 4],
        [0, 3],
      ]),
      true,
    );
    assert.equal(
      correct("8-polyrhythm", [
        [0, 2, 4],
        [0, 2, 4],
      ]),
      false,
    );
    assert.equal(
      correct("8-polyrhythm", [
        [0, 2, 4, 5],
        [0, 3],
      ]),
      false,
    );
    assert.equal(correct("8-polyrhythm", [[0, 2, 4], []]), false);
    assert.equal(
      correct("8-polyrhythm", [
        [0, 2, 4],
        [0, 3, 9],
      ]),
      false,
    );
    assert.equal(correct("2-syncopation", [[3]]), true);
    assert.equal(
      correct("2-syncopation", [[3, 4]]),
      false,
      "a tie must not create a second attack",
    );
  });
  it("accepts alternative consonant repairs instead of requiring one canned line", () => {
    assert.equal(correct("6-parallels", [[64, 65]]), true);
    assert.equal(correct("6-parallels", [[67, 65]]), true);
    assert.equal(correct("6-parallels", [[67, 69]]), false);
    assert.equal(correct("6-parallels", [[65, 65]]), false, "a fourth above the bass is dissonant");
  });
  it("requires contrary steps and the final octave for a closing gesture", () => {
    assert.equal(correct("9-close", [[71, 72]]), true);
    assert.equal(correct("9-close", [[65, 72]]), false, "a leap is not a step");
    assert.equal(
      correct("9-close", [[62, 60]]),
      false,
      "unison in similar motion is not this cadence",
    );
    assert.equal(correct("6-motion", [[72, 71, 67]]), true);
    assert.equal(correct("6-motion", [[67, 67, 67]]), false, "oblique is not contrary");
  });
  it("permits a passing fourth approached and left by step in either direction", () => {
    assert.equal(correct("9-moving-species", [[64, 65, 67]]), true);
    assert.equal(correct("9-moving-species", [[67, 65, 64]]), true);
    assert.equal(
      correct("9-moving-species", [[64, 65, 64]]),
      false,
      "a neighbour is not this passing task",
    );
    assert.equal(
      correct("9-moving-species", [[60, 65, 67]]),
      false,
      "do not leap into the dissonance",
    );
  });
  it("requires preparation, a held fourth and downward resolution for a suspension", () => {
    assert.equal(correct("9-suspensions", [[60, 60, 59]]), true);
    assert.equal(correct("9-suspensions", [[60, 62, 59]]), false);
    assert.equal(correct("9-suspensions", [[59, 59, 57]]), false);
    assert.equal(correct("9-suspensions", [[60, 60, 62]]), false);
  });
  it("checks melodic transformations and modal features without first-species restrictions", () => {
    assert.equal(correct("10-fugue", [[67, 69, 71, 67]]), true);
    assert.equal(correct("10-fugue", [[67, 69, 72, 67]]), false);
    assert.equal(correct("10-development", [[60, 58, 56, 60]]), true);
    assert.equal(correct("10-modes", [[71, 65, 64, 62]]), true);
    assert.equal(correct("10-modes", [[65, 67, 69, 62]]), false);
    assert.equal(
      correct("9-line", [[60, 62, 64, 65, 67, 65, 62, 60]]),
      false,
      "recover the descending leap upwards",
    );
  });
});

describe("activity progress and lesson integration", () => {
  it("preserves first-check errors across edits, worked answers, retries and serialization", () => {
    const activity = activityForUnit("4-triads")!;
    let p = updateActivity(activity, undefined, { type: "check" });
    assert.equal(p.tasks.major!.firstCorrect, false);
    assert.equal(updateActivity(activity, p, { type: "next" }), p);
    assert.equal(updateActivity(activity, p, { type: "check" }), p);
    p = updateActivity(activity, p, { type: "reveal" });
    p = updateActivity(activity, JSON.parse(JSON.stringify(p)), { type: "check" });
    assert.equal(p.tasks.major!.solved, true);
    assert.equal(p.tasks.major!.checks, 2);
    assert.equal(p.tasks.major!.firstCorrect, false);
    p = updateActivity(activity, p, { type: "retry" });
    p = updateActivity(activity, p, { type: "edit", draft: [[60, 64, 67]] });
    p = updateActivity(activity, p, { type: "check" });
    assert.equal(p.tasks.major!.firstCorrect, false);
    assert.equal(p.tasks.major!.assisted, true);
  });
  it("does not turn a revealed answer into independent success", () => {
    const activity = activityForUnit("0-pulse")!;
    const p = updateActivity(activity, updateActivity(activity, undefined, { type: "reveal" }), {
      type: "check",
    });
    assert.equal(activityComplete(activity, p), true);
    assert.equal(p.tasks.pulse!.firstCorrect, false);
  });
  it("saves every task and requires their completion before recall", () => {
    useGameStore.getState().resetProgress();
    const s = useGameStore.getState();
    const unit = unitById("4-triads")!;
    const activity = activityForUnit(unit.id)!;
    s.openUnit(unit.id);
    s.advanceLearningUnit(unit.id);
    s.advanceLearningUnit(unit.id);
    assert.equal(useGameStore.getState().unitProgress[unit.id]!.step, 1);
    for (const t of activity.tasks) {
      s.updateLearningActivity(unit.id, { type: "edit", draft: t.solution });
      s.updateLearningActivity(unit.id, { type: "check" });
      s.updateLearningActivity(unit.id, { type: "next" });
    }
    const p = useGameStore.getState().activityProgress[unit.id]!;
    assert.ok(activityComplete(activity, p));
    assert.equal(Object.values(p.tasks).filter((t) => t.firstCorrect).length, 4);
    const restored = JSON.parse(JSON.stringify(p)) as ActivityProgress;
    useGameStore.setState({ activityProgress: { [unit.id]: restored } });
    s.advanceLearningUnit(unit.id);
    assert.equal(useGameStore.getState().unitProgress[unit.id]!.step, 2);
    assert.equal(useGameStore.getState().harmonyPoints, 0);
    for (const q of unit.checks) {
      s.answerLearningUnit(unit.id, q.answer);
      s.advanceLearningUnit(unit.id);
    }
    assert.equal(useGameStore.getState().harmonyPoints, 25);
    s.updateLearningActivity(unit.id, { type: "retry" });
    s.updateLearningActivity(unit.id, { type: "reveal" });
    s.updateLearningActivity(unit.id, { type: "check" });
    assert.equal(useGameStore.getState().harmonyPoints, 25);
    assert.deepEqual(useGameStore.getState().recentAtGrade, []);
  });
  it("retains pre-activity lesson checkpoints and supplies an empty activity save for old users", () => {
    useGameStore.getState().resetProgress();
    const current = useGameStore.getState();
    const unit = unitById("9-suspensions")!;
    current.openUnit(unit.id);
    const old = {
      unitProgress: { [unit.id]: { ...useGameStore.getState().unitProgress[unit.id], step: 3 } },
      harmonyPoints: 123,
    };
    const merged = useGameStore.persist.getOptions().merge!(old, current);
    assert.deepEqual(merged.activityProgress, {});
    assert.equal(merged.unitProgress[unit.id]!.step, 3);
    assert.equal(merged.harmonyPoints, 123);
  });
});
