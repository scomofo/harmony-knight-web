import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SharedPhrase } from "../shared-phrase";
import { useGameStore } from "@/lib/game/store";

const audio = vi.hoisted(() => ({ stop: vi.fn(), play: vi.fn() }));
vi.mock("@/lib/game/audio", () => ({
  playTeachingPlan: audio.play,
}));
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  audio.play.mockReturnValue({ stop: audio.stop });
  useGameStore.setState({ settings: { ...useGameStore.getState().settings, muted: false } });
});
afterEach(cleanup);
it("restores the saved step and note, with separate instrument slots", () => {
  const view = render(<SharedPhrase instrument="piano" />);
  fireEvent.click(screen.getByRole("button", { name: "Try", hidden: true }));
  fireEvent.change(screen.getByLabelText("Phrase observation"), {
    target: { value: "Final beat stayed silent." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save and pause", hidden: true }));
  view.unmount();
  const restored = render(<SharedPhrase instrument="piano" />);
  expect((screen.getByLabelText("Phrase observation") as HTMLTextAreaElement).value).toBe(
    "Final beat stayed silent.",
  );
  expect(
    screen.getByRole("button", { name: "Try", hidden: true }).getAttribute("aria-pressed"),
  ).toBe("true");
  restored.unmount();
  render(<SharedPhrase instrument="guitar" />);
  expect((screen.getByLabelText("Phrase observation") as HTMLTextAreaElement).value).toBe("");
});
it("schedules the same four bars, narrows to bar two, and stops on collapse", () => {
  const { container } = render(<SharedPhrase />);
  fireEvent.click(screen.getByRole("button", { name: "Hear four bars", hidden: true }));
  const plan = audio.play.mock.calls[0]![0];
  expect(plan.events.map((e: { at: number }) => e.at)).toEqual(
    [0, 1, 2, 3, 4, 5, 5.5, 6, 7, 8, 9, 10, 11, 12, 13, 13.5, 14].map((n) => n * (60 / 72)),
  );
  expect(plan.duration).toBeCloseTo((16 * 60) / 72);
  fireEvent.click(screen.getByRole("button", { name: "Practise just bar 2", hidden: true }));
  expect(audio.stop).toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Slow it down · 72 bpm", hidden: true }));
  fireEvent.click(screen.getByRole("button", { name: "Hear bar 2", hidden: true }));
  expect(audio.play.mock.calls.at(-1)![0].events).toHaveLength(5);
  expect(audio.play.mock.calls.at(-1)![0].duration).toBe(5);
  const details = container.querySelector("details")!;
  fireEvent(details, new Event("toggle"));
  expect(screen.getByRole("button", { name: "Hear bar 2", hidden: true })).toBeTruthy();
});
it("reports failed saving and respects mute", () => {
  useGameStore.setState({ settings: { ...useGameStore.getState().settings, muted: true } });
  render(<SharedPhrase />);
  expect(
    (screen.getByRole("button", { name: "Hear four bars", hidden: true }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  fireEvent.click(screen.getByRole("button", { name: "Save and pause", hidden: true }));
  expect(screen.getByRole("status", { hidden: true }).textContent).toContain("Could not save");
});
