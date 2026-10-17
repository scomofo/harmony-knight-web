import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { MixedScreen } from "./mixed-screen";
import { useGameStore } from "@/lib/game/store";

it("shows a fresh learner the honest locked state — no session, no questions", () => {
  useGameStore.getState().resetProgress();
  render(<MixedScreen />);
  expect(screen.getByText("Not enough studies to mix — yet.")).toBeTruthy();
  // The one unlocked study is named; nothing is dealt.
  expect(screen.getByText(/just/)).toBeTruthy();
  expect(screen.queryByText(/· question/)).toBeNull();
  expect(screen.queryByRole("button", { name: "End session" })).toBeNull();
});

it("deals an endless mixed session once studies are unlocked", () => {
  useGameStore.getState().resetProgress();
  useGameStore.setState({ gradeLevel: 4 });
  render(<MixedScreen />);
  // Endless: a running question count with no "of N" finish line.
  expect(screen.getByText(/0\/0 · question 1/)).toBeTruthy();
  expect(screen.queryByText(/of 12/)).toBeNull();
  const options = screen
    .getAllByRole("button")
    .filter((b) => /^[1-4]/.test(b.textContent?.trim() ?? ""));
  expect(options.length).toBeGreaterThanOrEqual(2);
  fireEvent.click(options[0]!);
  // Answered: feedback shows and Continue deals the next mixed question.
  expect(screen.getByText(/0\/1|1\/1/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByText(/· question 2/)).toBeTruthy();
});

it("names the emphasis when a topic's weight is raised — and only then", () => {
  useGameStore.getState().resetProgress();
  useGameStore.setState({
    gradeLevel: 7,
    mastery: {
      intervals: {
        topicId: "intervals",
        attempts: 10,
        correct: 3,
        totalResponseMs: 0,
        bestConfidence: 0,
        // Rate 0.3 over a full window: past the evidence gate, at the cap.
        recentCorrect: [true, false, false, true, false, false, false, true, false, false],
      },
    },
  });
  render(<MixedScreen />);
  expect(screen.getByText(/More intervals this session — they've been shaky lately/)).toBeTruthy();
});

it("shows no emphasis line when the evidence is strong or thin", () => {
  useGameStore.getState().resetProgress();
  useGameStore.setState({
    gradeLevel: 7,
    mastery: {
      intervals: {
        topicId: "intervals",
        attempts: 10,
        correct: 9,
        totalResponseMs: 0,
        bestConfidence: 0,
        recentCorrect: [true, true, false, true, true, true, true, true, true, true],
      },
      triads: {
        topicId: "triads",
        attempts: 2,
        correct: 0,
        totalResponseMs: 0,
        bestConfidence: 0,
        // Two misses is a bad afternoon, not evidence — below the gate.
        recentCorrect: [false, false],
      },
    },
  });
  render(<MixedScreen />);
  expect(screen.queryByText(/More .* this session/)).toBeNull();
});
