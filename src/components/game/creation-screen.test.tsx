import { act, fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { CreationScreen } from "./creation-screen";
import { useGameStore } from "@/lib/game/store";
import { playTeachingPlan } from "@/lib/game/audio";

it("saves a learner's melody, restores it, and plays the saved pitches", async () => {
  useGameStore.getState().resetProgress();
  vi.clearAllMocks();
  const view = render(<CreationScreen chapter={0} />);
  fireEvent.change(screen.getByLabelText("Piece name"), { target: { value: "My first call" } });
  fireEvent.change(screen.getByLabelText("Creation note 2"), { target: { value: "72" } });
  fireEvent.click(screen.getByRole("button", { name: "Save piece" }));
  const saved = localStorage.getItem("harmony-knight-save")!;
  view.unmount();
  act(() => useGameStore.setState({ creations: [], creationDrafts: {} }));
  localStorage.setItem("harmony-knight-save", saved);
  await act(async () => {
    await useGameStore.persist.rehydrate();
  });
  render(<CreationScreen chapter={0} />);
  fireEvent.click(screen.getByRole("button", { name: "Play My first call" }));
  expect(vi.mocked(playTeachingPlan).mock.calls.at(-1)![0].events[1]!.notes).toEqual([72]);
  expect(useGameStore.getState().harmonyPoints).toBe(0);
});
