import { useState } from "react";
import { playChord } from "@/lib/game/audio";
import {
  CIRCLE_OF_FIFTHS,
  KEYS,
  TONIC_MIDI,
  majorTriad,
} from "@/lib/game/music";
import { keySignatureExercise } from "@/lib/game/exercises";
import { QuizScreen } from "./quiz-screen";
import { GameShell } from "./shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CircleScreen() {
  const [mode, setMode] = useState<"map" | "quiz">("map");
  const [active, setActive] = useState("C");

  if (mode === "quiz") {
    return (
      <div>
        <QuizScreen title="Key signatures" topicId="keys" make={keySignatureExercise} />
        <div className="fixed bottom-20 left-1/2 z-10 -translate-x-1/2">
          <Button variant="secondary" size="sm" onClick={() => setMode("map")}>
            Back to map
          </Button>
        </div>
      </div>
    );
  }

  const key = KEYS.find((k) => k.tonic === active && k.isMajor);

  return (
    <GameShell title="Circle of Fifths">
      <p className="mb-4 text-sm text-[var(--color-muted)] text-pretty">
        Each region is a key. Tap to hear its tonic triad. Travel clockwise to add sharps.
      </p>
      <div className="relative mx-auto aspect-square w-full max-w-md">
        {CIRCLE_OF_FIFTHS.map((name, i) => {
          const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const r = 42;
          const x = 50 + r * Math.cos(angle);
          const y = 50 + r * Math.sin(angle);
          const on = name === active;
          return (
            <button
              key={name}
              type="button"
              onClick={() => {
                setActive(name);
                const tonic = TONIC_MIDI[name] ?? 60;
                playChord(majorTriad(tonic));
              }}
              className={cn(
                "absolute flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-sm font-medium",
                on
                  ? "border-[var(--color-parchment)] bg-[var(--color-parchment)] text-[var(--color-ink)]"
                  : "border-[var(--color-border)] bg-[var(--color-ink-2)] text-[var(--color-parchment)]",
              )}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {name}
            </button>
          );
        })}
        <div className="absolute left-1/2 top-1/2 w-40 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="font-[var(--font-display)] text-xl tracking-[-0.03em]">
            {key?.name ?? active}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {key?.kind === "none"
              ? "Natural"
              : `${key?.accidentals} ${key?.kind}${key && key.accidentals === 1 ? "" : "s"}`}
            {key ? ` · relative ${key.relative}` : ""}
          </p>
        </div>
      </div>
      <Button className="mt-8 w-full" onClick={() => setMode("quiz")}>
        Quiz key signatures
      </Button>
    </GameShell>
  );
}
