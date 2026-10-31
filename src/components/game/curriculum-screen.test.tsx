import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { CurriculumScreen } from "./curriculum-screen";
import { COURSE_UNITS, unitsForLevel } from "@/lib/game/course";
import { CURRICULUM } from "@/lib/game/curriculum";
import { freshUnitProgress } from "@/lib/game/learning";
import { useGameStore } from "@/lib/game/store";

it("finds lessons by chapter and topic without moving the saved checkpoint", () => {
  useGameStore.getState().resetProgress();
  const unit = COURSE_UNITS.find((u) => u.id === "4-triads")!;
  useGameStore.setState({
    activeUnitId: unit.id,
    unitProgress: { [unit.id]: { ...freshUnitProgress(), step: 2 } },
  });
  const saved = localStorage.getItem("harmony-knight-save");
  render(<CurriculumScreen />);
  expect(screen.getByText("In progress · Recall 1 of 2")).toBeTruthy();
  expect(screen.getByLabelText("Jump to a chapter").querySelectorAll("a")).toHaveLength(
    CURRICULUM.length,
  );
  fireEvent.change(screen.getByRole("searchbox", { name: "Find a lesson" }), {
    target: { value: "cHaPtEr 9" },
  });
  expect(screen.getByRole("status").textContent).toContain(
    `${unitsForLevel(8).length} lessons found`,
  );
  expect(screen.queryByText(COURSE_UNITS[0]!.title)).toBeNull();
  expect(screen.getByText(unitsForLevel(8)[0]!.title)).toBeTruthy();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "chapter 1" } });
  expect(screen.getByRole("status").textContent).toContain(
    `${unitsForLevel(0).length} lessons found`,
  );
  expect(screen.queryByText(unitsForLevel(10)[0]!.title)).toBeNull();
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "triad" } });
  expect(screen.getByText(unit.title)).toBeTruthy();
  expect(localStorage.getItem("harmony-knight-save")).toBe(saved);
  fireEvent.click(screen.getByRole("button", { name: "Clear lesson search" }));
  expect(document.activeElement).toBe(screen.getByRole("searchbox"));
  expect(screen.getByText(COURSE_UNITS[0]!.title)).toBeTruthy();
  expect(screen.getByText("In progress · Recall 1 of 2")).toBeTruthy();
});

it("explains an empty search and keeps the resume action available", () => {
  useGameStore.getState().resetProgress();
  render(<CurriculumScreen />);
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: "no-such-topic" } });
  expect(screen.getByText(/No lessons match/)).toBeTruthy();
  expect(screen.getByRole("link", { name: /Continue:/ })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Clear lesson search" }));
  expect(screen.getByLabelText("Jump to a chapter")).toBeTruthy();
});
