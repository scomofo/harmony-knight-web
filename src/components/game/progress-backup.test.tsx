import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { ProgressBackupPanel } from "./progress-backup";
import { makeProgressBackup } from "@/lib/game/progress-backup";
import { useGameStore } from "@/lib/game/store";

beforeEach(() => {
  useGameStore.getState().resetProgress();
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(() => "blob:backup"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
});
async function choose(text: string) {
  const file = new File([text], "progress.json", { type: "application/json" });
  Object.defineProperty(file, "text", { value: async () => text });
  fireEvent.change(screen.getByLabelText("Import progress file"), { target: { files: [file] } });
  await screen.findByRole("button", { name: "Replace current progress" });
}
it("previews imports, allows cancellation, then backs up current data before an explicit replacement", async () => {
  useGameStore.setState({ harmonyPoints: 9 });
  const text = makeProgressBackup();
  useGameStore.setState({ harmonyPoints: 23 });
  render(<ProgressBackupPanel />);
  await choose(text);
  expect(screen.getByText(/9 harmony points/)).toBeTruthy();
  expect(useGameStore.getState().harmonyPoints).toBe(23);
  fireEvent.click(screen.getByRole("button", { name: "Cancel import" }));
  expect(useGameStore.getState().harmonyPoints).toBe(23);
  await choose(text);
  vi.mocked(URL.createObjectURL).mockImplementation(() => {
    expect(useGameStore.getState().harmonyPoints).toBe(23);
    return "blob:before-import";
  });
  fireEvent.click(screen.getByRole("button", { name: "Replace current progress" }));
  expect(URL.createObjectURL).toHaveBeenCalled();
  expect(useGameStore.getState().harmonyPoints).toBe(9);
  expect(screen.getByText(/Progress restored/)).toBeTruthy();
});
it("rejects an invalid file without offering replacement", async () => {
  render(<ProgressBackupPanel />);
  const file = new File(["broken"], "broken.json");
  Object.defineProperty(file, "text", { value: async () => "broken" });
  fireEvent.change(screen.getByLabelText("Import progress file"), { target: { files: [file] } });
  await screen.findByText(/not valid JSON/);
  expect(screen.queryByRole("button", { name: "Replace current progress" })).toBeNull();
});
