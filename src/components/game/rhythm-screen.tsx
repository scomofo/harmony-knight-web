import { useEffect, useRef, useState } from "react";
import { playClick, playHit, playMidi } from "@/lib/game/audio";
import { rhythmExercise, RHYTHMS, type Exercise } from "@/lib/game/exercises";
import { useGameStore } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { GameShell } from "./shell";
import { SessionSummary } from "./session-summary";
import { cn } from "@/lib/utils";

function playPattern(beats: number[], bpm = 88) {
  const beatMs = 60_000 / bpm;
  let t = 0;
  beats.forEach((b, i) => {
    window.setTimeout(() => {
      playClick(i === 0);
      playMidi(60, Math.min(0.35, (b * beatMs) / 1000), 0.7);
    }, t);
    t += b * beatMs;
  });
}

export function RhythmScreen() {
  const store = useGameStore();
  const [ex, setEx] = useState<Exercise>(() => rhythmExercise());
  const [picked, setPicked] = useState<string | null>(null);
  const [tapping, setTapping] = useState(false);
  const [taps, setTaps] = useState<number[]>([]);
  const origin = useRef(0);
  const [session, setSession] = useState({ total: 0, correct: 0, points: 0 });
  const [summary, setSummary] = useState(false);
  const beats = (ex.metadata?.beats as number[] | undefined) ?? [1, 1, 1, 1];

  useEffect(() => {
    const id = window.setTimeout(() => playPattern(beats), 250);
    return () => window.clearTimeout(id);
  }, [ex.correctAnswer]);

  const choose = (option: string) => {
    if (picked) return;
    const correct = option === ex.correctAnswer;
    setPicked(option);
    playHit(correct ? "correct" : "wrong");
    const outcome = store.recordPractice({
      midi: 60,
      correct,
      responseMs: 900,
      topicId: "rhythm",
    });
    setSession((s) => ({
      total: s.total + 1,
      correct: s.correct + (correct ? 1 : 0),
      points: s.points + outcome.points,
    }));
    window.setTimeout(() => {
      setPicked(null);
      setTaps([]);
      setEx(rhythmExercise());
    }, 900);
  };

  return (
    <GameShell title="Rhythm">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-[var(--color-muted)] text-pretty">
          Body Base-10: whole notes feel wide, halves at the waist, quarters as a clap. Hear the pattern, then name it.
        </p>
        <div className="flex h-16 items-end gap-1 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-3">
          {beats.map((b, i) => (
            <div
              key={i}
              className="rounded-sm bg-[var(--color-harmony)]"
              style={{ width: `${b * 28}px`, height: `${18 + b * 10}px`, opacity: 0.85 }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => playPattern(beats)}>
            Hear pattern
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setTapping(true);
              setTaps([]);
              origin.current = performance.now();
            }}
          >
            Tap along
          </Button>
        </div>
        {tapping ? (
          <button
            type="button"
            onPointerDown={() => {
              playClick(taps.length === 0);
              setTaps((prev) => [...prev, performance.now() - origin.current]);
            }}
            className="flex min-h-24 items-center justify-center rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[var(--color-ink-3)] text-sm"
          >
            Tap the pulse
          </button>
        ) : null}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ex.options.map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={Boolean(picked)}
              onClick={() => choose(opt)}
              className={cn(
                "min-h-14 rounded-[var(--radius-md)] border px-4 text-left text-sm",
                picked === ex.correctAnswer && opt === ex.correctAnswer
                  ? "border-[var(--color-harmony)]"
                  : picked && opt === picked && opt !== ex.correctAnswer
                    ? "border-[var(--color-ember)]"
                    : "border-[var(--color-border)] bg-[var(--color-ink-2)]",
              )}
            >
              {opt}
              <span className="mt-1 block text-[11px] text-[var(--color-subtle)]">
                {RHYTHMS.find((r) => r.name === opt)?.beats.join(" + ")} beats
              </span>
            </button>
          ))}
        </div>
        <Button variant="outline" onClick={() => setSummary(true)}>
          End session
        </Button>
      </div>
      {summary ? (
        <SessionSummary
          title="Rhythm complete"
          correct={session.correct}
          total={session.total}
          points={session.points}
          streak={store.currentStreak}
          onAgain={() => {
            setSummary(false);
            setSession({ total: 0, correct: 0, points: 0 });
            setEx(rhythmExercise());
          }}
        />
      ) : null}
    </GameShell>
  );
}
