import { it } from "node:test";
import assert from "node:assert/strict";
import { CHAPTER_CREATIONS, freshCreation, validCreation, creationPlan } from "./creations.ts";
import { useGameStore } from "./store.ts";

it("provides an editable, sounding and replayable creation in every chapter", () => {
  assert.equal(CHAPTER_CREATIONS.length, 11);
  CHAPTER_CREATIONS.forEach((_, chapter) => {
    const draft = freshCreation(chapter);
    assert.equal(validCreation(chapter, draft), true, String(chapter));
    const plan = creationPlan(chapter, draft);
    assert.ok(plan.events.some((e) => e.notes.length > 0));
    assert.ok(
      plan.events.every((e) => e.at >= 0 && e.duration > 0 && e.at + e.duration <= plan.duration),
    );
    assert.deepEqual(creationPlan(chapter, JSON.parse(JSON.stringify(draft))), plan);
  });
});
it("saves and updates named pieces without points, and rejects invalid notes and empty grooves", () => {
  useGameStore.getState().resetProgress();
  const s = useGameStore.getState();
  s.editCreation(0, { title: "My call", notes: [60, 67, 72, 64] });
  assert.equal(s.saveCreation(0), true);
  s.editCreation(0, { notes: [60, 64, 67, 60] });
  assert.equal(s.saveCreation(0), true);
  assert.equal(useGameStore.getState().creations.length, 1);
  s.newCreation(0);
  s.loadCreation(useGameStore.getState().creations[0]!.id);
  assert.deepEqual(useGameStore.getState().creationDrafts[0]!.notes, [60, 64, 67, 60]);
  s.editCreation(0, { notes: [999] });
  assert.deepEqual(useGameStore.getState().creationDrafts[0]!.notes, [60, 64, 67, 60]);
  s.editCreation(2, { rhythm: [[], []] });
  assert.equal(s.saveCreation(2), false);
  assert.equal(useGameStore.getState().harmonyPoints, 0);
  assert.deepEqual(useGameStore.getState().conceptPractice, {});
});
