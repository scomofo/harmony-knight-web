import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { QuizScreen } from "./quiz-screen";
import type { Exercise } from "@/lib/game/exercises";
import { useGameStore } from "@/lib/game/store";

const EXERCISE: Exercise = {
  type: "interval-name",
  prompt: "Which interval is C up to E?",
  notes: [60, 64],
  correctAnswer: "Major third",
  options: ["Major third", "Minor third", "Perfect fourth"],
  playback: "sequence",
  explain: "C to E spans four semitones: a major third.",
};

it("grades a picked answer and updates the session score", () => {
  useGameStore.getState().resetProgress();
  render(
    <QuizScreen title="Intervals" topicId="interval" make={() => EXERCISE} goal={5} />,
  );
  expect(screen.getByText(EXERCISE.prompt)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: /Major third/ }));
  expect(screen.getByText("True.")).toBeTruthy();
  expect(screen.getByText(/1\/1 · question/)).toBeTruthy();
});

it("marks a wrong pick with the correct answer", () => {
  useGameStore.getState().resetProgress();
  render(
    <QuizScreen title="Intervals" topicId="interval" make={() => EXERCISE} goal={5} />,
  );
  fireEvent.click(screen.getByRole("button", { name: /Minor third/ }));
  expect(screen.getByText("It was Major third.")).toBeTruthy();
  expect(screen.getByText(/0\/1 · question/)).toBeTruthy();
});
