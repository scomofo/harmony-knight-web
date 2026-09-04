import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Volume2 } from "lucide-react";
import {
  playChord,
  playHit,
  playLevelUp,
  playMidi,
  playMidiSequence,
  playProgression,
  playTimbre,
  type Timbre,
} from "@/lib/game/audio";
import type { Exercise } from "@/lib/game/exercises";
import { gradeProgress, useGameStore } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { GameShell } from "./shell";
import { SessionSummary } from "./session-summary";
import { cn } from "@/lib/utils";

const DEFAULT_QUIZ_GOAL = 12;

/** Play an exercise the way its generator asked for. */
function playExercise(ex: Exercise) {
  const mode =
    ex.playback ?? (ex.notes.length > 2 ? "chord" : ex.notes.length === 2 ? "sequence" : "single");
  if (mode === "silent") return;
  if (mode === "progression") {
    const chords = ex.metadata?.chords as number[][] | undefined;
    if (chords) playProgression(chords, 0.8, 0.75);
    else playChord(ex.notes);
    return;
  }
  if (mode === "chord") {
    playChord(ex.notes);
    return;
  }
  if (mode === "sequence") {
    playMidiSequence(ex.notes, ex.notes.length > 4 ? 0.2 : 0.42, ex.notes.length > 4 ? 0.3 : 0.45);
    return;
  }
  const first = ex.notes[0];
  if (first == null) return;
  const timbre = ex.metadata?.timbre as Timbre | undefined;
  if (timbre) {
    playTimbre(first, timbre, 0.9);
    return;
  }
  const vol = typeof ex.metadata?.volume === "number" ? ex.metadata.volume : 1;
  playMidi(first, 0.7, vol);
}

export function QuizScreen({
  title,
  topicId,
  make,
  play,
  intro,
  visual,
  goal = DEFAULT_QUIZ_GOAL,
  lessonLevel,
  onExit,
}: {
  title: string;
  topicId: string;
  make: () => Exercise;
  play?: (ex: Exercise) => void;
  /** One line of framing above the question. */
  intro?: string;
  /** Optional picture for the question — a key signature, a staff. */
  visual?: (ex: Exercise, revealed: boolean) => ReactNode;
  /** Questions per session. The summary appears when reached. */
  goal?: number;
  /** Curriculum level whose lesson explains this drill. */
  lessonLevel?: number;
  onExit?: () => void;
}) {
  const store = useGameStore();
  const [ex, setEx] = useState<Exercise>(() => make());
  const [picked, setPicked] = useState<string | null>(null);
  const [session, setSession] = useState({ total: 0, correct: 0, points: 0, streak: 0 });
  const [summary, setSummary] = useState(false);
  const [leveled, setLeveled] = useState<number | null>(null);
  const askedAt = useRef(Date.now());
  const progress = gradeProgress(store);

  const hear = (exercise = ex) => {
    if (play) play(exercise);
    else playExercise(exercise);
  };

  useEffect(() => {
    askedAt.current = Date.now();
    const t = window.setTimeout(() => hear(ex), 200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex]);

  const choose = (option: string) => {
    if (picked || summary) return;
    const correct = option === ex.correctAnswer;
    setPicked(option);
    playHit(correct ? "correct" : "wrong");
    const outcome = store.recordPractice({
      midi: ex.notes[0] ?? 60,
      correct,
      responseMs: Date.now() - askedAt.current,
      topicId,
      trackHeat: false,
    });
    if (outcome.leveledUp) {
      playLevelUp();
      setLeveled(outcome.newGrade);
    }
    const next = {
      total: session.total + 1,
      correct: session.correct + (correct ? 1 : 0),
      points: session.points + outcome.points,
      streak: correct ? session.streak + 1 : 0,
    };
    setSession(next);
    // Give the explanation time to be read; longer when wrong.
    window.setTimeout(
      () => {
        if (next.total >= goal) {
          setSummary(true);
          return;
        }
        setPicked(null);
        setEx(make());
      },
      correct ? 1400 : 2600,
    );
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (summary) return;
      if (e.code === "Space") {
        e.preventDefault();
        hear();
        return;
      }
      const idx = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(e.code);
      if (idx >= 0 && ex.options[idx] != null) choose(ex.options[idx]!);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const again = () => {
    setSummary(false);
    setLeveled(null);
    setSession({ total: 0, correct: 0, points: 0, streak: 0 });
    setPicked(null);
    setEx(make());
  };

  const revealed = picked != null;
  const wasRight = revealed && picked === ex.correctAnswer;

  return (
    <GameShell title={title}>
      <div className="flex flex-col gap-5">
        {intro ? (
          <p className="text-sm text-[var(--color-muted)] text-pretty">
            {intro}
            {lessonLevel != null ? (
              <>
                {" "}
                <Link
                  to="/lesson/$level"
                  params={{ level: String(lessonLevel) }}
                  className="inline-flex items-center gap-1 text-[var(--color-parchment)] underline-offset-2 hover:underline"
                >
                  <BookOpen className="size-3.5" />
                  Read the lesson
                </Link>
              </>
            ) : null}
          </p>
        ) : null}

        <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
          <span className="font-mono tabular-nums">
            {session.correct}/{session.total} · question {Math.min(session.total + 1, goal)} of{" "}
            {goal}
          </span>
          {session.streak >= 3 ? (
            <span className="text-[var(--color-ember)]">Streak {session.streak}</span>
          ) : !progress.maxed ? (
            <span className="font-mono tabular-nums">
              Grade trial {progress.answered}/{progress.needed}
            </span>
          ) : null}
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-[var(--color-ink-3)]">
          <div
            className="h-full rounded-full bg-[var(--color-harmony)] transition-[width] duration-[var(--motion-fast)]"
            style={{ width: `${(session.total / goal) * 100}%` }}
          />
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            {ex.playback === "silent" ? "Read" : "Listen"}
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-2xl tracking-[-0.03em] text-balance">
            {ex.prompt}
          </h2>
          {visual ? <div className="mt-4 flex justify-center">{visual(ex, revealed)}</div> : null}
          {revealed ? (
            <div
              className={cn(
                "mt-4 rounded-[var(--radius-md)] border p-3 text-sm",
                wasRight
                  ? "border-[var(--color-harmony)] text-[var(--color-parchment)]"
                  : "border-[var(--color-ember)] text-[var(--color-parchment)]",
              )}
            >
              <p className={wasRight ? "text-[var(--color-harmony)]" : "text-[var(--color-ember)]"}>
                {wasRight ? "True." : `It was ${ex.correctAnswer}.`}
              </p>
              {ex.explain ? <p className="mt-1 text-[var(--color-muted)]">{ex.explain}</p> : null}
            </div>
          ) : ex.hint ? (
            <p className="mt-3 text-sm text-[var(--color-muted)]">{ex.hint}</p>
          ) : null}
          {ex.playback !== "silent" ? (
            <Button variant="ghost" size="sm" className="mt-4" onClick={() => hear()}>
              <Volume2 className="size-4" />
              Hear again
            </Button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ex.options.map((opt, i) => {
            const state = !revealed
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
                disabled={revealed}
                onClick={() => choose(opt)}
                className={cn(
                  "flex min-h-14 items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-left text-sm transition-colors",
                  state === "right" &&
                    "border-[var(--color-harmony)] bg-[color-mix(in_oklab,var(--color-harmony)_18%,transparent)]",
                  state === "wrong" &&
                    "border-[var(--color-ember)] bg-[color-mix(in_oklab,var(--color-ember)_16%,transparent)]",
                  state === "idle" &&
                    "border-[var(--color-border)] bg-[var(--color-ink-2)] hover:border-[var(--color-border-strong)]",
                  revealed && state === "idle" && "opacity-50",
                )}
              >
                <span className="font-mono text-xs text-[var(--color-subtle)]">{i + 1}</span>
                {opt}
              </button>
            );
          })}
        </div>
        <p className="text-center text-xs text-[var(--color-subtle)]">
          Keys 1–4 answer · Space hears it again.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            if (session.total === 0 && onExit) onExit();
            else setSummary(true);
          }}
        >
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
          leveledUp={leveled != null}
          newGrade={leveled ?? undefined}
          onAgain={again}
        />
      ) : null}
    </GameShell>
  );
}
