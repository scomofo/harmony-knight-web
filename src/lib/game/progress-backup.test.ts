import { it } from "node:test";
import assert from "node:assert/strict";
import {
  makeProgressBackup,
  readProgressBackup,
  restoreProgressBackup,
} from "./progress-backup.ts";
import { useGameStore } from "./store.ts";
import { activityForUnit } from "./activity-catalog.ts";
import { unitById } from "./course.ts";
import { freshUnitProgress, servedChecks } from "./learning.ts";

it("round-trips lesson drafts, assisted history, settings and saved music without replacing store methods", () => {
  useGameStore.getState().resetProgress();
  const s = useGameStore.getState();
  s.openUnit("0-pitch");
  s.advanceLearningUnit("0-pitch");
  s.updateLearningActivity("0-pitch", { type: "hint" });
  s.updateLearningActivity("0-pitch", {
    type: "edit",
    draft: activityForUnit("0-pitch")!.tasks[0]!.solution,
  });
  s.updateLearningActivity("0-pitch", { type: "check" });
  s.editCreation(0, { title: "A saved melody" });
  s.saveCreation(0);
  s.patchSettings({ muted: true, highContrast: true });
  const backup = readProgressBackup(makeProgressBackup());
  s.resetProgress();
  let written = "";
  restoreProgressBackup(backup, {
    setItem: (_key, value) => {
      written = value;
    },
  });
  assert.ok(written.includes("A saved melody"));
  assert.equal(useGameStore.getState().unitProgress["0-pitch"]!.step, 1);
  assert.equal(useGameStore.getState().activityProgress["0-pitch"]!.tasks.up!.firstCorrect, false);
  assert.equal(useGameStore.getState().settings.muted, true);
  assert.equal(useGameStore.getState().creations[0]!.title, "A saved melody");
  assert.equal(typeof useGameStore.getState().openUnit, "function");
});
it("rejects malformed files, unsupported versions, invalid task positions and unsafe object keys", () => {
  useGameStore.getState().resetProgress();
  const pristine = JSON.parse(makeProgressBackup());
  assert.throws(() => readProgressBackup("not json"), /not valid JSON/);
  assert.throws(
    () => readProgressBackup(JSON.stringify({ ...pristine, version: 999 })),
    /not a supported/,
  );
  const invalid = structuredClone(pristine);
  invalid.data.activityProgress = { "0-pitch": { index: 400, tasks: {} } };
  assert.throws(() => readProgressBackup(JSON.stringify(invalid)), /invalid/);
  assert.throws(() => readProgressBackup('{"__proto__":{"polluted":true}}'), /unsupported/);
  const malformed = structuredClone(pristine);
  malformed.data.creationDrafts = {
    0: { title: "bad", notes: [999], rhythm: [], chords: [], tempo: 80 },
  };
  assert.throws(() => readProgressBackup(JSON.stringify(malformed)), /incompatible/);
  assert.equal(useGameStore.getState().harmonyPoints, 0);
});
it("leaves the live store untouched when browser storage refuses an import", () => {
  useGameStore.getState().resetProgress();
  const backup = readProgressBackup(makeProgressBackup());
  useGameStore.setState({ harmonyPoints: 47 });
  assert.throws(
    () =>
      restoreProgressBackup(backup, {
        setItem() {
          throw new Error("Quota exceeded");
        },
      }),
    /Quota/,
  );
  assert.equal(useGameStore.getState().harmonyPoints, 47);
});
it("fills new optional collections when restoring an earlier backup from this format", () => {
  useGameStore.getState().resetProgress();
  const backup = JSON.parse(makeProgressBackup());
  for (const key of ["practicalReviews", "conceptPractice", "creationDrafts", "creations"])
    delete backup.data[key];
  const restored = readProgressBackup(JSON.stringify(backup));
  assert.deepEqual(restored.data.creations, []);
  assert.deepEqual(restored.data.practicalReviews, {});
});

it("round-trips generated answers mid-review and after both early and due completions", () => {
  const unit = unitById("4-triads")!;
  for (const due of [false, true]) {
    useGameStore.getState().resetProgress();
    useGameStore.setState({
      unitProgress: {
        [unit.id]: {
          ...freshUnitProgress(),
          step: 2,
          completedAt: "2026-01-01T00:00:00Z",
          nextReviewAt: new Date(Date.now() + (due ? -1 : 1) * 864e5).toISOString(),
          reviewCount: 2,
          intervalDays: 3,
          reviewing: true,
        },
      },
    });
    const checks = servedChecks(unit, useGameStore.getState().unitProgress[unit.id]!);
    for (const check of checks) {
      useGameStore.getState().answerLearningUnit(unit.id, check.answer);
      const mid = readProgressBackup(makeProgressBackup()).data.unitProgress[unit.id]!;
      assert.deepEqual(servedChecks(unit, mid), checks);
      useGameStore.getState().advanceLearningUnit(unit.id);
    }
    const result = readProgressBackup(makeProgressBackup()).data.unitProgress[unit.id]!;
    assert.equal(result.step, 4);
    assert.equal(result.completedReviewRound, 2);
    assert.equal(result.reviewCount, due ? 3 : 2);
    assert.deepEqual(servedChecks(unit, result), checks);
    assert.equal(result.answers[0], checks[0]!.answer);
    assert.equal(result.answers[1], checks[1]!.answer);
    // Authored lessons still use their own checks on a reread.
    useGameStore.getState().revisitUnit(unit.id);
    assert.deepEqual(
      servedChecks(unit, useGameStore.getState().unitProgress[unit.id]!),
      unit.checks,
    );
  }
});
