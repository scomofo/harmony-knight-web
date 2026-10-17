import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { PracticeScreen } from "./practice-screen";
import { noteName } from "@/lib/game/music";
import { buildNotePool } from "@/lib/game/practice";
import { useGameStore } from "@/lib/game/store";

/** Answer buttons are labelled "1 · C", "2 · E", … — pull the note name off. */
function optionButtons() {
  return screen
    .getAllByRole("button")
    .filter((b) => /^\d+ · /.test(b.textContent ?? ""))
    .map((b) => ({ button: b, name: (b.textContent ?? "").replace(/^\d+ · /, "").trim() }));
}

it("serves a note from the learner's grade pool, reveals it after an answer, and accepts the correction", () => {
  useGameStore.getState().resetProgress();
  const grade = useGameStore.getState().gradeLevel;
  const poolNames = new Set(buildNotePool(grade).map((n) => noteName(n.midi)));
  render(<PracticeScreen />);
  expect(screen.getByText("What note is this?")).toBeTruthy();

  const options = optionButtons();
  expect(options.length).toBeGreaterThanOrEqual(2);
  for (const o of options) {
    expect(poolNames.has(o.name)).toBe(true);
  }

  fireEvent.click(options[0]!.button);
  if (screen.queryByText("Correct on the first try.")) {
    return; // First pick was the target — served, answered, graded.
  }
  // A wrong pick reveals the served note's name; the correction must be that note.
  const reveal = screen.getByText(/This is .+\. Listen and compare/);
  const targetName = /This is (.+?)\./.exec(reveal.textContent ?? "")![1]!;
  expect(poolNames.has(targetName)).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  const correction = optionButtons().find((o) => o.name === targetName)!;
  fireEvent.click(correction.button);
  expect(
    screen.getByText(/That’s it\. We’ll keep this note in your review list/),
  ).toBeTruthy();
});
