import { it } from "node:test";
import assert from "node:assert/strict";
import {
  makeProgressBackup,
  readProgressBackup,
  restoreProgressBackup,
} from "./progress-backup.ts";
import { useGameStore } from "./store.ts";
import { activityForUnit } from "./activity-catalog.ts";

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
