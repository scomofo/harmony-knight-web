import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { playTeachingPlan, stopTones } from "@/lib/game/audio";
import { useGameStore } from "@/lib/game/store";
import { LessonScreen } from "./lesson-screen";

beforeEach(() => {
  useGameStore.getState().resetProgress();
  useGameStore.getState().patchSettings({ muted: false });
  vi.clearAllMocks();
});

const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

it("lets a learner isolate both pitches and compare them without overlapping notes", () => {
  vi.useFakeTimers();
  render(<LessonScreen level={0} unitId="0-pitch" />);
  expect(playTeachingPlan).not.toHaveBeenCalled();

  click("Hear lower");
  expect(vi.mocked(playTeachingPlan).mock.calls.at(-1)![0].events[0]).toMatchObject({
    notes: [60],
    duration: 0.75,
    volume: 1,
  });
  vi.mocked(stopTones).mockClear();
  click("Hear higher");
  expect(vi.mocked(playTeachingPlan).mock.calls.at(-1)![0].events[0]).toMatchObject({
    notes: [72],
    duration: 0.75,
    volume: 1,
  });
  expect(stopTones).toHaveBeenCalledTimes(1);
  expect(vi.mocked(stopTones).mock.invocationCallOrder[0]).toBeLessThan(
    vi.mocked(playTeachingPlan).mock.invocationCallOrder.at(-1)!,
  );

  act(() => vi.advanceTimersByTime(800));
  click("Compare lower, then higher");
  const events = vi.mocked(playTeachingPlan).mock.calls.at(-1)![0].events;
  expect(events.map((e) => e.notes)).toEqual([[60], [72]]);
  expect(events[1]!.at - events[0]!.duration).toBeGreaterThanOrEqual(0.25);
  expect(events[0]!.duration).toBeGreaterThanOrEqual(0.7);
  act(() => vi.advanceTimersByTime(1500));
  expect(screen.getByRole("button", { name: "Stop example" })).toBeTruthy();
  act(() => vi.advanceTimersByTime(400));
  expect(screen.getByRole("button", { name: "Compare lower, then higher" })).toBeTruthy();
});

it("cancels the pitch pair on stop or leaving the step and opens the listening exercise", () => {
  vi.useFakeTimers();
  const view = render(<LessonScreen level={0} unitId="0-pitch" />);
  click("Compare lower, then higher");
  vi.mocked(stopTones).mockClear();
  click("Stop example");
  expect(stopTones).toHaveBeenCalledTimes(1);
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.getByRole("button", { name: "Compare lower, then higher" })).toBeTruthy();
  expect(playTeachingPlan).toHaveBeenCalledTimes(1);

  click("Compare lower, then higher");
  vi.mocked(stopTones).mockClear();
  click("Try this idea");
  expect(stopTones).toHaveBeenCalled();
  expect(screen.getByText("Is the second note higher, lower, or the same pitch?")).toBeTruthy();
  click("Hear the sounds");
  vi.mocked(stopTones).mockClear();
  view.unmount();
  expect(stopTones).toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(2000));
  expect(playTeachingPlan).toHaveBeenCalledTimes(3);
});

it("keeps all pitch playback muted while preserving the written comparison", () => {
  useGameStore.getState().patchSettings({ muted: true });
  render(<LessonScreen level={0} unitId="0-pitch" />);
  for (const name of ["Compare lower, then higher", "Hear lower", "Hear higher"]) {
    expect(screen.getByRole("button", { name }).hasAttribute("disabled")).toBe(true);
    click(name);
  }
  expect(playTeachingPlan).not.toHaveBeenCalled();
  expect(screen.getByText(/plays a lower note, pauses, then plays a higher note/)).toBeTruthy();
  click("Try this idea");
  expect(screen.getByRole("button", { name: "Ready for two quick checks" })).toBeTruthy();
});
