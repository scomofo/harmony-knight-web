import { useEffect, useState } from "react";
import { Volume2 } from "lucide-react";
import { playChord, playHit, playMidi, playMidiSequence } from "@/lib/game/audio";
import type { Exercise } from "@/lib/game/exercises";
import { useGameStore } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { GameShell } from "./shell";
import { SessionSummary } from "./session-summary";
import { cn } from "@/lib/utils";

export function QuizScreen({
  title,
  topicId,
  make,
  play,
}: {
  title: string;
  topicId: string;
  make: () => Exercise;
  play?: (ex: Exercise) => void;
}) {
  const store = useGameStore();
  const [ex, setEx] = useState<Exercise>(() => make());
  const [picked, setPicked] = useState<string | null>(null);
  const [session, setSession] = useState({ total: 0, correct: 0, points: 0 });
  const [summary, setSummary] = useState(false);

  const hear = (exercise = ex) => {
    if (play) {
      play(exercise);
      return;
    }
    if (exercise.notes.length > 2) playChord(exercise.notes);
    else if (exercise.notes.length === 2) playMidiSequence(exercise.notes, 0.42, 0.45);
    else if (exercise.notes[0] != null) {
      const vol = typeof exercise.metadata?.volume === "number" ? exercise.metadata.volume : 1;
      playMidi(exercise.notes[0], 0.7, vol);
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => hear(ex), 200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.prompt, ex.correctAnswer]);

  const choose = (option: string) => {
    if (picked) return;
    const correct = option === ex.correctAnswer;
    setPicked(option);
    playHit(correct ? "correct" : "wrong");
    const outcome = store.recordPractice({
      midi: ex.notes[0] ?? 60,
      correct,
      responseMs: 800,
      topicId,
    });
    setSession((s) => ({
      total: s.total + 1,
      correct: s.correct + (correct ? 1 : 0),
      points: s.points + outcome.points,
    }));
    window.setTimeout(() => {
      setPicked(null);
      setEx(make());
    }, 850);
  };

  return (
    <GameShell title={title}>
      <div className="flex flex-col gap-5">
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">Listen</p>
          <h2 className="mt-2 font-[var(--font-display)] text-2xl tracking-[-0.03em] text-balance">
            {ex.prompt}
          </h2>
          {picked ? (
            <p className="mt-3 text-sm text-[var(--color-harmony)]">
              {picked === ex.correctAnswer ? "True." : `It was ${ex.correctAnswer}.`}
            </p>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              The answer stays hidden until you choose.
            </p>
          )}
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => hear()}>
            <Volume2 className="size-4" />
            Hear again
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ex.options.map((opt) => {
            const state =
              picked == null
                ? "idle"
                : opt === ex.correctAnswer
                  ? "right"
                  : opt === picked
                    ? "wrong"
                    : "idle";
            return (
              <button
                key={opt}
                type="button"
                disabled={Boolean(picked)}
                onClick={() => choose(opt)}
                className={cn(
                  "min-h-14 rounded-[var(--radius-md)] border px-4 py-3 text-left text-sm transition-colors",
                  state === "right" && "border-[var(--color-harmony)] bg-[color-mix(in_oklab,var(--color-harmony)_18%,transparent)]",
                  state === "wrong" && "border-[var(--color-ember)] bg-[color-mix(in_oklab,var(--color-ember)_16%,transparent)]",
                  state === "idle" && "border-[var(--color-border)] bg-[var(--color-ink-2)] hover:border-[var(--color-border-strong)]",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
        <p className="text-center font-mono text-xs tabular-nums text-[var(--color-muted)]">
          {session.correct}/{session.total}
        </p>
        <Button variant="outline" onClick={() => setSummary(true)}>
          End session
        </Button>
      </div>
      {summary ? (
        <SessionSummary
          title={`${title} complete`}
          correct={session.correct}
          total={session.total}
          points={session.points}
          streak={store.currentStreak}
          onAgain={() => {
            setSummary(false);
            setSession({ total: 0, correct: 0, points: 0 });
            setEx(make());
          }}
        />
      ) : null}
    </GameShell>
  );
}
