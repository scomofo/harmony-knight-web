import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { playTeachingPlan, stopTones } from "@/lib/game/audio";
import { useGameStore } from "@/lib/game/store";
import { activityForUnit } from "@/lib/game/activity-catalog";
import { LessonActivityPanel } from "./lesson-activity";

beforeEach(() => {
  useGameStore.getState().resetProgress();
  vi.clearAllMocks();
});
it("slows the visual clock with the audio and cancels highlights when muted", () => {
  vi.useFakeTimers();
  render(<LessonActivityPanel unitId="0-pulse" activity={activityForUnit("0-pulse")!} />);
  fireEvent.click(screen.getByRole("button", { name: "Show a worked answer" }));
  fireEvent.change(screen.getByLabelText("Playback speed"), { target: { value: "0.5" } });
  fireEvent.click(screen.getByRole("button", { name: "Hear my answer" }));
  expect(vi.mocked(playTeachingPlan).mock.calls.at(-1)![1]).toBe(0.5);
  expect(screen.getByRole("button", { name: "Pattern, 1" }).getAttribute("aria-current")).toBe(
    "step",
  );
  act(() => vi.advanceTimersByTime(900));
  expect(screen.getByRole("button", { name: "Pattern, 1 &" }).getAttribute("aria-current")).toBe(
    "step",
  );
  act(() => useGameStore.getState().patchSettings({ muted: true }));
  expect(screen.queryByText(/Playing:/)).toBeNull();
  expect(stopTones).toHaveBeenCalled();
});
it("plays only the chosen voice and cancels it when the tab is hidden", () => {
  const visible = Object.getOwnPropertyDescriptor(document, "visibilityState");
  render(
    <LessonActivityPanel unitId="9-suspensions" activity={activityForUnit("9-suspensions")!} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Show a worked answer" }));
  fireEvent.change(screen.getByLabelText("Playback part"), { target: { value: "upper" } });
  fireEvent.click(screen.getByRole("button", { name: "Hear my answer" }));
  expect(
    vi
      .mocked(playTeachingPlan)
      .mock.calls.at(-1)![0]
      .events.map((e) => e.notes),
  ).toEqual([[60], [59]]);
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
  fireEvent(document, new Event("visibilitychange"));
  expect(screen.queryByText(/Playing:/)).toBeNull();
  if (visible) Object.defineProperty(document, "visibilityState", visible);
  else Reflect.deleteProperty(document, "visibilityState");
});
