import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { HomeScreen } from "./home-screen";
import { COURSE_UNITS } from "@/lib/game/course";
import { freshUnitProgress, type UnitProgress } from "@/lib/game/learning";
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

function completeAllUnits(nextReviewAt: string | null = null): Record<string, UnitProgress> {
  return Object.fromEntries(
    COURSE_UNITS.map((u) => [
      u.id,
      { ...freshUnitProgress(), step: 4, completedAt: new Date().toISOString(), nextReviewAt },
    ]),
  ) as Record<string, UnitProgress>;
}

it("shows the completion state, not a next lesson, when the course is finished", () => {
  useGameStore.getState().resetProgress();
  useGameStore.setState({ unitProgress: completeAllUnits() });
  render(<HomeScreen />);
  const card = within(screen.getByLabelText("Course complete"));
  expect(card.getByRole("heading", { name: "You finished the learning path." })).toBeTruthy();
  expect(card.getByRole("link", { name: /Practise your notes/ })).toBeTruthy();
  expect(card.getByRole("link", { name: /Revisit the learning path/ })).toBeTruthy();
  expect(screen.queryByLabelText("Your next lesson")).toBeNull();
  expect(
    screen.getByText(`${COURSE_UNITS.length} of ${COURSE_UNITS.length} lessons completed`),
  ).toBeTruthy();
});

it("surfaces a due recall alongside the completion state", () => {
  useGameStore.getState().resetProgress();
  const yesterday = new Date(Date.now() - 864e5).toISOString();
  useGameStore.setState({ unitProgress: completeAllUnits(yesterday) });
  render(<HomeScreen />);
  expect(screen.getByLabelText("Course complete")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Recall this idea/ })).toBeTruthy();
});
