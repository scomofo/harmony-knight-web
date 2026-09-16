import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { activityForUnit } from "@/lib/game/activity-catalog";
import { playTeachingPlan, stopTones } from "@/lib/game/audio";
import { useGameStore } from "@/lib/game/store";
import { LessonActivityPanel } from "./lesson-activity";
import { LessonScreen } from "./lesson-screen";

beforeEach(() => {
  useGameStore.getState().resetProgress();
  vi.clearAllMocks();
});
const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const activity = (id: string) =>
  render(<LessonActivityPanel unitId={id} activity={activityForUnit(id)!} />);

it("keeps a wrong chord visible, saves its correction, and hydrates the next task without duplicating credit", async () => {
  const view = activity("4-triads");
  for (const note of ["C4", "Eb4", "G4"]) click(note);
  click("Check my answer");
  expect(screen.getByText("Try adjusting your answer.")).toBeTruthy();
  click("Eb4");
  click("E4");
  click("Check my answer");
  click("Next task");
  click("C4");
  const saved = localStorage.getItem("harmony-knight-save")!;
  view.unmount();
  act(() => useGameStore.setState({ activityProgress: {} }));
  localStorage.setItem("harmony-knight-save", saved);
  await act(async () => {
    await useGameStore.persist.rehydrate();
  });
  activity("4-triads");
  expect(screen.getByRole("heading", { name: "C minor" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "C4" }).getAttribute("aria-pressed")).toBe("true");
  expect(useGameStore.getState().activityProgress["4-triads"]!.tasks.major!.firstCorrect).toBe(
    false,
  );
  expect(useGameStore.getState().harmonyPoints).toBe(0);
});

it("offers native keyboard-accessible rhythm toggles and plays both polyrhythm rows together", () => {
  activity("8-polyrhythm");
  for (const label of [
    "Three-part, 1",
    "Three-part, 3",
    "Three-part, 5",
    "Two-part, 1",
    "Two-part, 4",
  ])
    click(label);
  const cell = screen.getByRole("button", { name: "Two-part, 4" });
  const event = new KeyboardEvent("keydown", { code: "Space", bubbles: true, cancelable: true });
  cell.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
  click("Hear my answer");
  const events = vi.mocked(playTeachingPlan).mock.calls.at(-1)![0].events;
  expect(events).toHaveLength(5);
  expect(events.filter((e) => e.at === 0)).toHaveLength(2);
  click("Check my answer");
  expect(screen.getByText(/Activity complete/)).toBeTruthy();
  click("Stop sound");
  expect(stopTones).toHaveBeenCalled();
});

it("accepts an alternative valid voice-leading repair and reports the original parallel fifths", () => {
  activity("6-parallels");
  click("Check my answer");
  expect(screen.getByText(/Position 2: Both voices moved in parallel fifths/)).toBeTruthy();
  const notes = screen.getAllByRole("combobox");
  fireEvent.change(notes[0]!, { target: { value: "64" } });
  fireEvent.change(notes[1]!, { target: { value: "65" } });
  click("Check my answer");
  expect(screen.getByText(/Activity complete · 0 of 1/)).toBeTruthy();
});

it("plays a suspension with a tied preparation and stops audio when leaving the task", () => {
  const view = activity("9-suspensions");
  click("Show a worked answer");
  click("Hear my answer");
  expect(
    vi
      .mocked(playTeachingPlan)
      .mock.calls.at(-1)![0]
      .events.find((e) => e.notes[0] === 60)!.duration,
  ).toBeGreaterThan(1.4);
  click("Check my answer");
  expect(screen.getByText(/Activity complete · 0 of 1/)).toBeTruthy();
  click("Hear my answer");
  vi.mocked(stopTones).mockClear();
  view.unmount();
  expect(stopTones).toHaveBeenCalled();
});

it("keeps recall locked until the activity is checked, including when a worked answer is used", () => {
  render(<LessonScreen level={0} unitId="0-pulse" />);
  click("Try this idea");
  const proceed = screen.getByRole("button", { name: "Ready for two quick checks" });
  expect(proceed.hasAttribute("disabled")).toBe(true);
  click("Show a worked answer");
  expect(proceed.hasAttribute("disabled")).toBe(true);
  click("Check my answer");
  expect(proceed.hasAttribute("disabled")).toBe(false);
  expect(useGameStore.getState().unitProgress["0-pulse"]!.assisted).toBe(true);
  click("Ready for two quick checks");
  expect(screen.getByRole("heading", { name: "Recall 1 of 2" })).toBeTruthy();
});

it("supports silent completion and does not mark a worked answer as a first-check success", () => {
  useGameStore.getState().patchSettings({ muted: true });
  activity("8-borrowed");
  expect(screen.getByRole("button", { name: "Hear an example" }).hasAttribute("disabled")).toBe(
    true,
  );
  click("Show a worked answer");
  click("Check my answer");
  expect(screen.getByText(/Activity complete · 0 of 1/)).toBeTruthy();
  expect(useGameStore.getState().totalNotesPlayed).toBe(0);
  expect(useGameStore.getState().harmonyPoints).toBe(0);
});
