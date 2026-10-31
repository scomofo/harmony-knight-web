import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { LessonScreen } from "./lesson-screen";
import { unitById, HUMANIZED_TEACHING } from "@/lib/game/course";
import { useGameStore } from "@/lib/game/store";
import { freshUnitProgress, servedChecks } from "@/lib/game/learning";
import { reviewActivity } from "@/lib/game/practical-review";
import { activityForUnit } from "@/lib/game/activity-catalog";

it("teaches the unit's live (humanized) body at Learn; the reference stays in the refresher", () => {
  useGameStore.getState().resetProgress();
  const unit = unitById("1-staff")!;
  render(<LessonScreen level={unit.level} unitId={unit.id} />);
  expect(screen.getByRole("heading", { name: unit.title })).toBeTruthy();
  // The taught paragraph is the HUMANIZED_TEACHING override verbatim.
  expect(screen.getByText(HUMANIZED_TEACHING[unit.id]!)).toBeTruthy();
  // The lessons.ts copy is present only as the collapsed reference refresher.
  const refresher = screen.getByText("Definitions and worked detail").closest("details")!;
  expect(within(refresher).getByText(unit.reference!)).toBeTruthy();
});

it("keeps original examples behind deliberate help during a fresh review and preserves the draft", async () => {
  const id = "4-triads";
  const unit = unitById(id)!;
  useGameStore.getState().resetProgress();
  useGameStore.setState({
    unitProgress: {
      [id]: { ...freshUnitProgress(), step: 4, completedAt: "2026-01-01T00:00:00Z" },
    },
  });
  useGameStore.getState().revisitUnit(id, true);
  const activity = reviewActivity(id, 0)!;
  render(<LessonScreen level={4} unitId={id} />);
  expect(screen.getByLabelText("Lesson guide").textContent).toContain(unit.title);
  expect(screen.queryByRole("img", { name: unit.visual!.alt })).toBeNull();
  expect(useGameStore.getState().unitProgress[id]!.assisted).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "D4" }));
  const draft =
    useGameStore.getState().practicalReviews[id]!.progress.tasks[activity.tasks[0]!.id]!.draft;
  fireEvent.click(screen.getByText("Need the idea again?"));
  await waitFor(() => expect(screen.getByRole("img", { name: unit.visual!.alt })).toBeTruthy());
  const supported =
    useGameStore.getState().practicalReviews[id]!.progress.tasks[activity.tasks[0]!.id]!;
  expect(supported.draft).toEqual(draft);
  expect(supported.assisted).toBe(true);
  expect(useGameStore.getState().unitProgress[id]!.assisted).toBe(true);
  act(() =>
    useGameStore
      .getState()
      .updateLearningActivity(id, { type: "edit", draft: activity.tasks[0]!.solution }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Check my answer" }));
  expect(useGameStore.getState().conceptPractice[id]!.independent).toBe(0);
  fireEvent.click(screen.getByRole("button", { name: "Ready for two quick checks" }));
  // Help starts closed again at recall; changing steps never clears the draft.
  expect(screen.queryByRole("img", { name: unit.visual!.alt })).toBeNull();
  expect(
    useGameStore.getState().practicalReviews[id]!.progress.tasks[activity.tasks[0]!.id]!.solved,
  ).toBe(true);
});

it("restores a completed generated review's actual recall and practical results after reload", async () => {
  const id = "4-triads";
  const unit = unitById(id)!;
  useGameStore.getState().resetProgress();
  useGameStore.setState({
    unitProgress: {
      [id]: {
        ...freshUnitProgress(),
        step: 4,
        completedAt: "2026-01-01T00:00:00Z",
        nextReviewAt: "2026-01-02T00:00:00Z",
        intervalDays: 1,
      },
    },
  });
  useGameStore.getState().revisitUnit(id, true);
  const view = render(<LessonScreen level={4} unitId={id} />);
  const review = reviewActivity(id, 0)!;
  act(() => {
    useGameStore
      .getState()
      .updateLearningActivity(id, { type: "edit", draft: review.tasks[0]!.solution });
    useGameStore.getState().updateLearningActivity(id, { type: "check" });
  });
  fireEvent.click(screen.getByRole("button", { name: "Ready for two quick checks" }));
  const checks = servedChecks(unit, useGameStore.getState().unitProgress[id]!);
  expect(checks.map((q) => q.answer)).not.toEqual(unit.checks.map((q) => q.answer));
  for (const [index, check] of checks.entries()) {
    fireEvent.click(screen.getByRole("button", { name: check.answer }));
    fireEvent.click(
      screen.getByRole("button", { name: index === 1 ? "Save and finish" : "Next check" }),
    );
  }
  const saved = localStorage.getItem("harmony-knight-save")!;
  view.unmount();
  act(() => useGameStore.getState().resetProgress());
  localStorage.setItem("harmony-knight-save", saved);
  await act(async () => {
    await useGameStore.persist.rehydrate();
  });
  render(<LessonScreen level={4} unitId={id} />);
  expect(screen.getByText("2 of 2 before explanations")).toBeTruthy();
  // The review has one task; the original learning activity has four.
  expect(activityForUnit(id)!.tasks.length).toBeGreaterThan(1);
  expect(screen.getByText("1 of 1 first checks without help")).toBeTruthy();
  expect(screen.queryByText("Ideas to revisit")).toBeNull();
  expect(useGameStore.getState().unitProgress[id]!.intervalDays).toBe(3);
});
