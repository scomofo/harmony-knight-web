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
vi.mock("@/lib/game/audio", () => {
  const stop = vi.fn();
  return {
    playTeachingPlan: vi.fn((_plan, speed = 1) => {
      const start = Date.now();
      return { elapsed: () => ((Date.now() - start) / 1000) * speed, stop };
    }),
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
    stopTones: stop,
    setMasterGain: vi.fn(),
    unlockAudio: vi.fn(),
  };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  localStorage.clear();
});
