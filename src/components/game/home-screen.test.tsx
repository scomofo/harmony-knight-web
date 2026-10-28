import { fireEvent, render, screen, within } from "@testing-library/react";
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

it("describes practical review workload and triages a returning queue without changing schedules", () => {
  useGameStore.getState().resetProgress();
  const old = new Date(Date.now() - 3 * 864e5).toISOString();
  const unitProgress = completeAllUnits(old);
  unitProgress[COURSE_UNITS[1]!.id]!.nextReviewAt = new Date(Date.now() - 4 * 864e5).toISOString();
  const before = structuredClone(unitProgress);
  useGameStore.setState({ unitProgress, lastActiveAt: old });
  render(<HomeScreen />);
  const due = screen.getByLabelText("Due for review");
  expect(within(due).getByText(/Start with 1 of 45 due reviews/)).toBeTruthy();
  expect(within(due).getAllByRole("link", { name: /Review this idea/ })).toHaveLength(1);
  expect(within(due).getByRole("heading", { name: COURSE_UNITS[1]!.title })).toBeTruthy();
  expect(
    within(due).getByText("Fresh practical tasks + 2 recall questions · Untimed; stop anytime."),
  ).toBeTruthy();
  fireEvent.click(within(due).getByRole("button", { name: "Show all 45 due reviews" }));
  expect(within(due).getAllByRole("link", { name: /Review this idea/ })).toHaveLength(45);
  expect(useGameStore.getState().unitProgress).toEqual(before);
});

it("surfaces a due recall alongside the completion state", () => {
  useGameStore.getState().resetProgress();
  const yesterday = new Date(Date.now() - 864e5).toISOString();
  useGameStore.setState({ unitProgress: completeAllUnits(yesterday) });
  render(<HomeScreen />);
  expect(screen.getByLabelText("Course complete")).toBeTruthy();
  expect(screen.getAllByRole("link", { name: /Review this idea/ }).length).toBeGreaterThan(0);
});
