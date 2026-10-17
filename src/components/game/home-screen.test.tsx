import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { HomeScreen } from "./home-screen";
import { COURSE_UNITS } from "@/lib/game/course";
import { freshUnitProgress } from "@/lib/game/learning";
import { useGameStore } from "@/lib/game/store";

it("recommends the first unfinished lesson to a new learner", () => {
  useGameStore.getState().resetProgress();
  render(<HomeScreen />);
  const next = COURSE_UNITS[0]!;
  const card = within(screen.getByLabelText("Your next lesson"));
  expect(card.getByRole("heading", { name: next.title })).toBeTruthy();
  expect(card.getByText(next.goal)).toBeTruthy();
  expect(card.getByRole("link", { name: /Start my first lesson/ })).toBeTruthy();
});

it("moves the recommendation on once the first lesson is completed", () => {
  useGameStore.getState().resetProgress();
  const first = COURSE_UNITS[0]!;
  useGameStore.setState({
    unitProgress: {
      [first.id]: {
        ...freshUnitProgress(),
        step: 4,
        completedAt: new Date().toISOString(),
      },
    },
  });
  render(<HomeScreen />);
  const next = COURSE_UNITS[1]!;
  const card = within(screen.getByLabelText("Your next lesson"));
  expect(card.getByRole("heading", { name: next.title })).toBeTruthy();
  expect(card.getByRole("link", { name: /Start this lesson/ })).toBeTruthy();
  expect(screen.getByText(`1 of ${COURSE_UNITS.length} lessons completed`)).toBeTruthy();
});
