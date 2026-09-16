import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { useGameStore } from "@/lib/game/store";
import { playTeachingPlan } from "@/lib/game/audio";
import { LessonScreen } from "./lesson-screen";

const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
beforeEach(() => {
  useGameStore.getState().resetProgress();
  vi.clearAllMocks();
});

it("checks listening choices, saves a correction, and gates recall until every comparison is complete", async () => {
  const view = render(<LessonScreen level={0} unitId="0-pitch" />);
  click("Try this idea");
  click("Hear the sounds");
  expect(
    vi
      .mocked(playTeachingPlan)
      .mock.calls.at(-1)![0]
      .events.map((e) => e.notes),
  ).toEqual([[60], [69]]);
  click("Lower");
  click("Check my answer");
  expect(screen.getByText("Try adjusting your answer.")).toBeTruthy();
  click("Higher");
  click("Check my answer");
  click("Next task");
  click("Lower");
  const saved = localStorage.getItem("harmony-knight-save")!;
  view.unmount();
  act(() => useGameStore.setState({ activityProgress: {} }));
  localStorage.setItem("harmony-knight-save", saved);
  await act(async () => {
    await useGameStore.persist.rehydrate();
  });
  render(<LessonScreen level={0} unitId="0-pitch" />);
  expect(screen.getByRole("button", { name: "Lower" }).getAttribute("aria-pressed")).toBe("true");
  expect(
    screen.getByRole("button", { name: "Ready for two quick checks" }).hasAttribute("disabled"),
  ).toBe(true);
  click("Check my answer");
  click("Next task");
  click("Same pitch");
  click("Check my answer");
  expect(useGameStore.getState().activityProgress["0-pitch"]!.tasks.up!.firstCorrect).toBe(false);
  click("Ready for two quick checks");
  expect(screen.getByRole("heading", { name: "Recall 1 of 2" })).toBeTruthy();
});

it("offers reference timbres and permits muted guided completion without independent listening credit", () => {
  render(<LessonScreen level={0} unitId="0-timbre" />);
  click("Try this idea");
  click("Hear Warm");
  expect(vi.mocked(playTeachingPlan).mock.calls.at(-1)![0].events[0]).toMatchObject({
    notes: [64],
    timbre: "Warm",
  });
  act(() => useGameStore.getState().patchSettings({ muted: true }));
  expect(screen.getByRole("button", { name: "Hear the sounds" }).hasAttribute("disabled")).toBe(
    true,
  );
  click("Use a written clue (guided)");
  click("Check my answer");
  const state = useGameStore.getState();
  expect(state.activityProgress["0-timbre"]!.tasks.hollow!.firstCorrect).toBe(false);
  expect(state.unitProgress["0-timbre"]!.assisted).toBe(true);
});
