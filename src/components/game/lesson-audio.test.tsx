import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { playMidi, playMidiSequence, stopTones } from "@/lib/game/audio";
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
  expect(playMidi).not.toHaveBeenCalled();
  expect(playMidiSequence).not.toHaveBeenCalled();

  click("Hear lower");
  expect(playMidi).toHaveBeenLastCalledWith(60, 0.75, 1);
  vi.mocked(stopTones).mockClear();
  click("Hear higher");
  expect(playMidi).toHaveBeenLastCalledWith(72, 0.75, 1);
  expect(stopTones).toHaveBeenCalledTimes(1);
  expect(vi.mocked(stopTones).mock.invocationCallOrder[0]).toBeLessThan(
    vi.mocked(playMidi).mock.invocationCallOrder.at(-1)!,
  );

  act(() => vi.advanceTimersByTime(800));
  click("Compare lower, then higher");
  const [notes, gap, duration] = vi.mocked(playMidiSequence).mock.calls.at(-1)!;
  expect(notes).toEqual([60, 72]);
  expect(gap! - duration!).toBeGreaterThanOrEqual(0.25);
  expect(duration).toBeGreaterThanOrEqual(0.7);
  act(() => vi.advanceTimersByTime(1500));
  expect(screen.getByRole("button", { name: "Stop example" })).toBeTruthy();
  act(() => vi.advanceTimersByTime(400));
  expect(screen.getByRole("button", { name: "Compare lower, then higher" })).toBeTruthy();
});

it("cancels the pitch pair on stop or leaving the step and keeps individual replay in Try it", () => {
  vi.useFakeTimers();
  const view = render(<LessonScreen level={0} unitId="0-pitch" />);
  click("Compare lower, then higher");
  vi.mocked(stopTones).mockClear();
  click("Stop example");
  expect(stopTones).toHaveBeenCalledTimes(1);
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.getByRole("button", { name: "Compare lower, then higher" })).toBeTruthy();
  expect(playMidiSequence).toHaveBeenCalledTimes(1);

  click("Compare lower, then higher");
  vi.mocked(stopTones).mockClear();
  click("Try this idea");
  expect(stopTones).toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Compare lower, then higher" })).toBeTruthy();
  click("Hear higher");
  expect(playMidi).toHaveBeenLastCalledWith(72, 0.75, 1);
  vi.mocked(stopTones).mockClear();
  view.unmount();
  expect(stopTones).toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(2000));
  expect(playMidiSequence).toHaveBeenCalledTimes(2);
  expect(playMidi).toHaveBeenCalledTimes(1);
});

it("keeps all pitch playback muted while preserving the written comparison", () => {
  useGameStore.getState().patchSettings({ muted: true });
  render(<LessonScreen level={0} unitId="0-pitch" />);
  for (const name of ["Compare lower, then higher", "Hear lower", "Hear higher"]) {
    expect(screen.getByRole("button", { name }).hasAttribute("disabled")).toBe(true);
    click(name);
  }
  expect(playMidi).not.toHaveBeenCalled();
  expect(playMidiSequence).not.toHaveBeenCalled();
  expect(screen.getByText(/plays a lower note, pauses, then plays a higher note/)).toBeTruthy();
  click("Try this idea");
  expect(screen.getByRole("button", { name: "Ready for two quick checks" })).toBeTruthy();
});
