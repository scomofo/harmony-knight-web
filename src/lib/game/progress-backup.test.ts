import { it } from "node:test";
import assert from "node:assert/strict";
import {
  makeProgressBackup,
  readProgressBackup,
  restoreProgressBackup,
} from "./progress-backup.ts";
import { useGameStore } from "./store.ts";
import { activityForUnit } from "./activity-catalog.ts";
import { freshUnitProgress } from "./learning.ts";

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
  s.editCreation(0, {
    title: "A saved melody",
    transferReflection: "The reply kept the contour.",
  });
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
  assert.equal(
    useGameStore.getState().creationDrafts[0]!.transferReflection,
    "The reply kept the contour.",
  );
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

it("round-trips secure evidence, defaults legacy unit fields, and rejects inconsistent mastery records", () => {
  useGameStore.getState().resetProgress();
  useGameStore.setState({
    unitProgress: {
      "4-triads": {
        ...freshUnitProgress(),
        step: 4,
        completedAt: "2026-01-01T00:00:00Z",
        securedAt: "2026-01-03T00:00:00Z",
        secureReviewRound: 0,
      },
    },
  });
  const backup = JSON.parse(makeProgressBackup());
  const restored = readProgressBackup(JSON.stringify(backup));
  assert.equal(restored.data.unitProgress["4-triads"]!.secureReviewRound, 0);
  assert.equal(restored.data.unitProgress["4-triads"]!.securedAt, "2026-01-03T00:00:00Z");

  const legacy = structuredClone(backup);
  for (const key of ["independentAt", "securedAt", "secureReviewRound"])
    delete legacy.data.unitProgress["4-triads"][key];
  const legacyRestored = readProgressBackup(JSON.stringify(legacy));
  assert.equal(legacyRestored.data.unitProgress["4-triads"]!.securedAt, null);
  assert.equal(legacyRestored.data.unitProgress["4-triads"]!.secureReviewRound, null);

  const invalid = structuredClone(backup);
  invalid.data.unitProgress["4-triads"].secureReviewRound = null;
  assert.throws(() => readProgressBackup(JSON.stringify(invalid)), /incompatible/);
});
