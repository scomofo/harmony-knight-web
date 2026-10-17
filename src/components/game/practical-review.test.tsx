import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { useGameStore } from "@/lib/game/store";
import { freshUnitProgress } from "@/lib/game/learning";
import { reviewActivity } from "@/lib/game/practical-review";
import { LessonScreen } from "./lesson-screen";

it("opens a fresh practical review before written recall and restores its draft after refresh", async () => {
  const id = "4-triads";
  useGameStore.getState().resetProgress();
  useGameStore.setState({
    unitProgress: {
      [id]: { ...freshUnitProgress(), step: 4, completedAt: "2026-01-01T00:00:00Z" },
    },
  });
  useGameStore.getState().revisitUnit(id, true);
  // Answer the generated round-0 task the screen actually serves: click
  // its solution's palette labels (the old fixed cycle made this D major;
  // the served root is now drawn per round).
  const served = reviewActivity(id, 0)!.tasks[0]!;
  if (served.kind !== "chord") throw new Error("chord review expected");
  const labelOf = (midi: number) => served.choices.find((c) => c.midi === midi)!.label;
  const [first, ...rest] = served.solution[0]!;
  const view = render(<LessonScreen level={4} unitId={id} />);
  expect(screen.getByRole("heading", { name: "Try a fresh example" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: labelOf(first!) }));
  const saved = localStorage.getItem("harmony-knight-save")!;
  view.unmount();
  act(() => useGameStore.setState({ practicalReviews: {} }));
  localStorage.setItem("harmony-knight-save", saved);
  await act(async () => {
    await useGameStore.persist.rehydrate();
  });
  render(<LessonScreen level={4} unitId={id} />);
  expect(screen.getByRole("button", { name: labelOf(first!) }).getAttribute("aria-pressed")).toBe(
    "true",
  );
  for (const n of rest) fireEvent.click(screen.getByRole("button", { name: labelOf(n) }));
  fireEvent.click(screen.getByRole("button", { name: "Check my answer" }));
  fireEvent.click(screen.getByRole("button", { name: "Ready for two quick checks" }));
  expect(screen.getByRole("heading", { name: "Recall 1 of 2" })).toBeTruthy();
  expect(useGameStore.getState().conceptPractice[id]!.independent).toBe(1);
});
