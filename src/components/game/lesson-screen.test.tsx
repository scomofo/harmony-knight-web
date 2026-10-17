import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { LessonScreen } from "./lesson-screen";
import { unitById, HUMANIZED_TEACHING } from "@/lib/game/course";
import { useGameStore } from "@/lib/game/store";

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
