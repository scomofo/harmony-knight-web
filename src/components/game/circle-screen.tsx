import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { playChord, playMidiSequence } from "@/lib/game/audio";
import {
  CIRCLE_OF_FIFTHS,
  KEYS,
  MAJOR_SCALE,
  TONIC_MIDI,
  closelyRelatedKeys,
  majorTriad,
  minorTriad,
} from "@/lib/game/music";
import { keySignatureExercise, relatedKeyExercise, type Exercise } from "@/lib/game/exercises";
import { useGameStore } from "@/lib/game/store";
import { KeySignature } from "./key-signature";
import { QuizScreen } from "./quiz-screen";
import { GameShell } from "./shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CircleScreen() {
  const grade = useGameStore((s) => s.gradeLevel);
  const [mode, setMode] = useState<"map" | "quiz">("map");
  const [active, setActive] = useState("C");
  const modulation = grade >= 7;

  if (mode === "quiz") {
    const make = (): Exercise => {
      if (modulation && Math.random() < 0.5) return relatedKeyExercise();
      return keySignatureExercise(grade >= 7 ? 6 : 4);
    };
    return (
      <QuizScreen
        title={modulation ? "Keys & neighbours" : "Key signatures"}
        topicId={modulation ? "modulation" : "keys"}
        make={make}
        intro={
          modulation
            ? "Read the signature, or name a closely related key — one step around the circle."
            : "Read the sharps or flats on the staff, or count them, and name the major key."
        }
        lessonLevel={modulation ? 7 : 3}
        visual={(ex) =>
          ex.metadata?.showStaff ? <KeySignature tonic={String(ex.metadata?.tonic ?? "C")} /> : null
        }
        onExit={() => setMode("map")}
      />
    );
  }

  const key = KEYS.find((k) => k.tonic === active && k.isMajor);
  const tonic = TONIC_MIDI[active] ?? 60;
  const neighbours = closelyRelatedKeys(active);

  return (
    <GameShell title="Circle of Fifths">
      <p className="mb-4 text-sm text-[var(--color-muted)] text-pretty">
        Each region is a key. Tap to hear its tonic triad and see its signature. Travel clockwise to
        add sharps; counter-clockwise to add flats.{" "}
        <Link
          to="/lesson/$level"
          params={{ level: "3" }}
          className="inline-flex items-center gap-1 text-[var(--color-parchment)] underline-offset-2 hover:underline"
        >
          <BookOpen className="size-3.5" />
          Lesson
        </Link>
      </p>
      <div className="relative mx-auto aspect-square w-full max-w-md">
        {CIRCLE_OF_FIFTHS.map((name, i) => {
          const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const r = 42;
          const x = 50 + r * Math.cos(angle);
          const y = 50 + r * Math.sin(angle);
          const on = name === active;
          const near = neighbours.includes(name);
          return (
            <button
              key={name}
              type="button"
              onClick={() => {
                setActive(name);
                playChord(majorTriad(TONIC_MIDI[name] ?? 60));
              }}
              className={cn(
                "absolute flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                on
                  ? "border-[var(--color-parchment)] bg-[var(--color-parchment)] text-[var(--color-ink)]"
                  : near
                    ? "border-[var(--color-harmony)] bg-[var(--color-ink-2)] text-[var(--color-parchment)]"
                    : "border-[var(--color-border)] bg-[var(--color-ink-2)] text-[var(--color-parchment)]",
              )}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {name}
            </button>
          );
        })}
        <div className="absolute left-1/2 top-1/2 w-44 -translate-x-1/2 -translate-y-1/2 text-center">
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

      <div className="mt-6 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-4">
        <div className="flex flex-col items-center">
          <KeySignature tonic={active} />
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              playMidiSequence(
                MAJOR_SCALE.map((s) => tonic + s),
                0.2,
                0.3,
              )
            }
          >
            Hear the scale
          </Button>
          <Button variant="secondary" size="sm" onClick={() => playChord(majorTriad(tonic))}>
            Tonic triad
          </Button>
          <Button variant="secondary" size="sm" onClick={() => playChord(minorTriad(tonic - 3))}>
            Relative minor
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-[var(--color-muted)]">
          Neighbours: {neighbours.join(" and ")} major — one accidental away.
        </p>
      </div>

      <Button className="mt-6 w-full" onClick={() => setMode("quiz")}>
        {modulation ? "Quiz keys & neighbours" : "Quiz key signatures"}
      </Button>
    </GameShell>
  );
}
