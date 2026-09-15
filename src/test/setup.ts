import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { createElement, type ReactNode } from "react";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    onClick,
    ...props
  }: {
    to: string;
    children: ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => createElement("a", { href: to, onClick, "aria-label": props["aria-label"] }, children),
}));
vi.mock("@/lib/game/audio", () => ({
  playChord: vi.fn(),
  playClick: vi.fn(),
  playHit: vi.fn(),
  playLevelUp: vi.fn(),
  playMidi: vi.fn(),
  playMidiSequence: vi.fn(),
  playProgression: vi.fn(),
  playRhythmPattern: vi.fn(),
  playSuccess: vi.fn(),
  playTimbre: vi.fn(),
  playOnsetGrid: vi.fn(),
  playVoicePhrase: vi.fn(),
  stopTones: vi.fn(),
  setMasterGain: vi.fn(),
  unlockAudio: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
});
