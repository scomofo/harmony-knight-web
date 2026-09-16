import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { useGameStore } from "@/lib/game/store";
import { freshUnitProgress } from "@/lib/game/learning";
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
  const view = render(<LessonScreen level={4} unitId={id} />);
  expect(screen.getByRole("heading", { name: "Try a fresh example" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "D4" }));
  const saved = localStorage.getItem("harmony-knight-save")!;
  view.unmount();
  act(() => useGameStore.setState({ practicalReviews: {} }));
  localStorage.setItem("harmony-knight-save", saved);
  await act(async () => {
    await useGameStore.persist.rehydrate();
  });
  render(<LessonScreen level={4} unitId={id} />);
  expect(screen.getByRole("button", { name: "D4" }).getAttribute("aria-pressed")).toBe("true");
  for (const n of ["F#4", "A4"]) fireEvent.click(screen.getByRole("button", { name: n }));
  fireEvent.click(screen.getByRole("button", { name: "Check my answer" }));
  fireEvent.click(screen.getByRole("button", { name: "Ready for two quick checks" }));
  expect(screen.getByRole("heading", { name: "Recall 1 of 2" })).toBeTruthy();
  expect(useGameStore.getState().conceptPractice[id]!.independent).toBe(1);
});
