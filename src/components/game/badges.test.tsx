import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { useGameStore } from "@/lib/game/store";
import { KnightBadges } from "./badges";

it("renders knight trophies and badges correctly", () => {
  useGameStore.getState().resetProgress();
  render(<KnightBadges />);
  expect(screen.getByText("Knight’s Trophies")).toBeTruthy();
  expect(screen.getByText("Harmony Apprentice")).toBeTruthy();
  expect(screen.getByText("Sentinel Slayer")).toBeTruthy();
  expect(screen.getByText("Master Composer")).toBeTruthy();
  expect(screen.getByText("0 of 8 unlocked")).toBeTruthy();
});
