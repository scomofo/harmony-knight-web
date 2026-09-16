import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { LessonActivityPanel } from "./lesson-activity";
import { activityForUnit } from "@/lib/game/activity-catalog";
import { useGameStore } from "@/lib/game/store";

it("reveals a clue, highlights the notes to inspect, then offers an audible before/after correction", () => {
  useGameStore.getState().resetProgress();
  render(<LessonActivityPanel unitId="4-triads" activity={activityForUnit("4-triads")!} />);
  const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
  for (const n of ["C4", "Eb4", "G4"]) click(n);
  click("Give me a clue");
  expect(screen.getByRole("button", { name: "Eb4" }).getAttribute("aria-describedby")).toBeNull();
  click("Show where to look");
  expect(screen.getByRole("button", { name: "Eb4" }).getAttribute("aria-describedby")).toBeTruthy();
  expect(screen.getByText(/Compare Eb4 with E4/)).toBeTruthy();
  click("Show a worked answer");
  click("Hear before correction");
  click("Hear the correction");
  click("Check my answer");
  expect(useGameStore.getState().activityProgress["4-triads"]!.tasks.major!.firstCorrect).toBe(
    false,
  );
});
