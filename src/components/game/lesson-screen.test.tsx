import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { LessonScreen } from "./lesson-screen";
import { unitById, HUMANIZED_TEACHING } from "@/lib/game/course";
import { useGameStore } from "@/lib/game/store";
import { freshUnitProgress } from "@/lib/game/learning";

it("teaches the unit's live (humanized) body at Learn; the reference stays in the refresher", () => {
  useGameStore.getState().resetProgress();
  const unit = unitById("1-staff")!;
  render(<LessonScreen level={unit.level} unitId={unit.id} />);
  expect(screen.getByText(unit.title)).toBeTruthy();
  // The taught paragraph is the HUMANIZED_TEACHING override verbatim.
  expect(screen.getByText(HUMANIZED_TEACHING[unit.id]!)).toBeTruthy();
  // The lessons.ts copy is present only as the collapsed reference refresher.
  const refresher = screen.getByText("Definitions and worked detail").closest("details")!;
  expect(within(refresher).getByText(unit.reference!)).toBeTruthy();
});

it("keeps independent security visible as text on the completion screen", () => {
  useGameStore.getState().resetProgress();
  const unit = unitById("4-triads")!;
  useGameStore.setState({
    unitProgress: {
      [unit.id]: {
        ...freshUnitProgress(),
        step: 4,
        completedAt: "2026-01-01T00:00:00Z",
        securedAt: "2026-01-03T00:00:00Z",
        secureReviewRound: 0,
      },
    },
  });
  render(<LessonScreen level={unit.level} unitId={unit.id} />);
  expect(screen.getByLabelText("Learning status: Secure independently")).toBeTruthy();
  expect(screen.getByText(/That independent evidence stays saved/)).toBeTruthy();
  expect(screen.getByRole("button", { name: /Practise another fresh example/ })).toBeTruthy();
});
