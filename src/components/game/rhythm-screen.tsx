import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Volume2 } from "lucide-react";
import { playClick, playHit, playLevelUp, playRhythmPattern } from "@/lib/game/audio";
import { rhythmExercise, RHYTHMS, type Exercise } from "@/lib/game/exercises";
import { BEAT_MS, RHYTHM_BPM, noteValueName, scoreTaps, type TapScore } from "@/lib/game/rhythm";
import { gradeProgress, useGameStore } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { GameShell } from "./shell";
import { SessionSummary } from "./session-summary";
import { cn } from "@/lib/utils";

const BPM = RHYTHM_BPM;
const GOAL = 10;

type TapPhase = "idle" | "countin" | "tapping" | "scored";

export function RhythmScreen() {
  const store = useGameStore();
  const grade = store.gradeLevel;
  const [ex, setEx] = useState<Exercise>(() => rhythmExercise(grade));
  const [picked, setPicked] = useState<string | null>(null);
  const [phase, setPhase] = useState<TapPhase>("idle");
  const [count, setCount] = useState(0);
  const [taps, setTaps] = useState<number[]>([]);
  const [tapScore, setTapScore] = useState<TapScore | null>(null);
  const origin = useRef(0);
  const timers = useRef<number[]>([]);
  const [session, setSession] = useState({ total: 0, correct: 0, points: 0 });
  const [summary, setSummary] = useState(false);
  const [leveled, setLeveled] = useState<number | null>(null);
  const beats = (ex.metadata?.beats as number[] | undefined) ?? [1, 1, 1, 1];
  const meter = (ex.metadata?.meter as string | undefined) ?? "4/4";
  const totalBeats = beats.reduce((a, b) => a + b, 0);
  const progress = gradeProgress(store);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    const id = window.setTimeout(() => playRhythmPattern(beats, BPM), 250);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.correctAnswer]);

  useEffect(() => () => clearTimers(), []);

  const record = (correct: boolean, why: "name" | "tap") => {
    const outcome = store.recordPractice({
      midi: 60,
      correct,
      responseMs: 900,
      topicId: "rhythm",
      trackHeat: false,
    });
    if (outcome.leveledUp) {
      playLevelUp();
      setLeveled(outcome.newGrade);
    }
    setSession((s) => ({
      total: s.total + 1,
      correct: s.correct + (correct ? 1 : 0),
      points: s.points + outcome.points + (why === "tap" && correct ? 5 : 0),
    }));
  };

  const nextExercise = () => {
    clearTimers();
    setPicked(null);
    setTaps([]);
    setTapScore(null);
    setPhase("idle");
    setEx(rhythmExercise(grade));
  };

  const choose = (option: string) => {
    if (picked) return;
    const correct = option === ex.correctAnswer;
    setPicked(option);
    playHit(correct ? "correct" : "wrong");
    record(correct, "name");
  };

  const startTapBack = () => {
    clearTimers();
    setTaps([]);
    setTapScore(null);
    setPhase("countin");
    const beatsIn = meter === "3/4" ? 3 : 4;
    for (let i = 0; i < beatsIn; i++) {
      timers.current.push(
        window.setTimeout(() => {
          playClick(i === 0);
          setCount(beatsIn - i);
        }, i * BEAT_MS),
      );
    }
    timers.current.push(
      window.setTimeout(() => {
        origin.current = performance.now();
        setPhase("tapping");
        setCount(0);
        playClick(true);
      }, beatsIn * BEAT_MS),
    );
  };

  // Finish scoring once the bar plus a beat of grace has elapsed.
  useEffect(() => {
    if (phase !== "tapping") return;
    const id = window.setTimeout(() => finishTapping(), (totalBeats + 1) * BEAT_MS);
    timers.current.push(id);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const tapsRef = useRef<number[]>([]);
  tapsRef.current = taps;

  const finishTapping = () => {
    if (phase !== "tapping") return;
    const score = scoreTaps(beats, tapsRef.current);
    setTapScore(score);
    setPhase("scored");
    playHit(score.passed ? "correct" : "wrong");
    record(score.passed, "tap");
  };

  const onTap = () => {
    if (phase !== "tapping") return;
    playClick(taps.length === 0);
    const next = [...taps, performance.now() - origin.current];
    setTaps(next);
    tapsRef.current = next;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (phase === "tapping") onTap();
        else if (phase === "idle" || phase === "scored") playRhythmPattern(beats, BPM);
        return;
      }
      const idx = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(e.code);
      if (idx >= 0 && ex.options[idx] != null && phase !== "tapping") choose(ex.options[idx]!);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (session.total >= GOAL && !summary) {
      const t = window.setTimeout(() => setSummary(true), 900);
      return () => window.clearTimeout(t);
    }
  }, [session.total, summary]);

  const stepDone = picked != null;
  const tapDone = phase === "scored";
  const bothDone = stepDone && tapDone;

  return (
    <GameShell title="Rhythm">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-[var(--color-muted)] text-pretty">
          Body Base-10: a whole note is arms wide, a half is hands to the waist, a quarter is a
          clap, an eighth a finger tap. Hear the bar, name it, then tap it back.{" "}
          <Link
            to="/lesson/$level"
            params={{ level: "2" }}
            className="inline-flex items-center gap-1 text-[var(--color-parchment)] underline-offset-2 hover:underline"
          >
            <BookOpen className="size-3.5" />
            Read the lesson
          </Link>
        </p>

        <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
          <span className="font-mono tabular-nums">
            {session.correct}/{session.total} · bar{" "}
            {Math.min(Math.floor(session.total / 2) + 1, GOAL / 2)} of {GOAL / 2}
          </span>
          {!progress.maxed ? (
            <span className="font-mono tabular-nums">
              Grade trial {progress.answered}/{progress.needed}
            </span>
          ) : null}
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
              One bar · {meter} · {BPM} bpm
            </p>
            <p className="font-mono text-xs tabular-nums text-[var(--color-subtle)]">
              {totalBeats} beats
            </p>
          </div>
          <div className="mt-3 flex h-20 items-end gap-1">
            {beats.map((b, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-end gap-1"
                style={{ flexGrow: b, flexBasis: 0 }}
              >
                <div
                  className={cn(
                    "w-full rounded-sm bg-[var(--color-harmony)]",
                    phase === "scored" && tapScore && "opacity-90",
                  )}
                  style={{ height: `${18 + b * 10}px`, opacity: stepDone ? 0.9 : 0.55 }}
                />
                {stepDone ? (
                  <span className="text-[10px] text-[var(--color-subtle)]">{noteValueName(b)}</span>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => playRhythmPattern(beats, BPM)}>
              <Volume2 className="size-4" />
              Hear the bar
            </Button>
            <Button
              variant={stepDone && !tapDone ? "default" : "outline"}
              size="sm"
              disabled={phase === "countin" || phase === "tapping"}
              onClick={startTapBack}
            >
              {tapDone ? "Tap again" : "Tap it back"}
            </Button>
          </div>
        </div>

        {phase === "countin" || phase === "tapping" ? (
          <button
            type="button"
            onPointerDown={onTap}
            className={cn(
              "flex min-h-32 select-none flex-col items-center justify-center rounded-[var(--radius-xl)] border text-center transition-colors",
              phase === "tapping"
                ? "border-[var(--color-harmony)] bg-[color-mix(in_oklab,var(--color-harmony)_14%,var(--color-ink-3))]"
                : "border-[var(--color-border-strong)] bg-[var(--color-ink-3)]",
            )}
          >
            {phase === "countin" ? (
              <>
                <span className="font-[var(--font-display)] text-4xl tabular-nums">{count}</span>
                <span className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                  Count-in
                </span>
              </>
            ) : (
              <>
                <span className="font-[var(--font-display)] text-2xl">Tap the pattern</span>
                <span className="mt-1 font-mono text-xs tabular-nums text-[var(--color-muted)]">
                  {taps.length}/{beats.length} · Space works too
                </span>
              </>
            )}
          </button>
        ) : null}

        {tapScore ? (
          <div
            className={cn(
              "rounded-[var(--radius-md)] border p-3 text-sm",
              tapScore.passed ? "border-[var(--color-harmony)]" : "border-[var(--color-ember)]",
            )}
          >
            <p
              className={
                tapScore.passed ? "text-[var(--color-harmony)]" : "text-[var(--color-ember)]"
              }
            >
              {tapScore.passed ? "In time." : "Not quite in time."} {tapScore.hits}/
              {tapScore.expected} onsets landed
              {tapScore.hits ? ` · ${Math.round(tapScore.meanErrorMs)} ms off on average` : ""}.
            </p>
            <p className="mt-1 text-[var(--color-muted)]">
              {tapScore.passed
                ? "Your body knows this bar. Steady pulse, then subdivide."
                : "Listen once more and count the pulse aloud before you tap."}
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ex.options.map((opt, i) => {
            const pattern = RHYTHMS.find((r) => r.name === opt);
            const state = !stepDone
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
                disabled={stepDone || phase === "tapping"}
                onClick={() => choose(opt)}
                className={cn(
                  "min-h-14 rounded-[var(--radius-md)] border px-4 py-2 text-left text-sm transition-colors",
                  state === "right" &&
                    "border-[var(--color-harmony)] bg-[color-mix(in_oklab,var(--color-harmony)_18%,transparent)]",
                  state === "wrong" &&
                    "border-[var(--color-ember)] bg-[color-mix(in_oklab,var(--color-ember)_16%,transparent)]",
                  state === "idle" && "border-[var(--color-border)] bg-[var(--color-ink-2)]",
                  stepDone && state === "idle" && "opacity-50",
                )}
              >
                <span className="mr-2 font-mono text-xs text-[var(--color-subtle)]">{i + 1}</span>
                {opt}
                <span className="mt-1 block text-[11px] text-[var(--color-subtle)]">
                  {pattern?.meter} · {pattern?.beats.join(" + ")}
                </span>
              </button>
            );
          })}
        </div>

        {stepDone && ex.explain ? (
          <p className="text-sm text-[var(--color-muted)]">
            {picked === ex.correctAnswer ? "True. " : `It was ${ex.correctAnswer}. `}
            {ex.explain}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button className="flex-1" onClick={nextExercise} disabled={!stepDone}>
            {bothDone ? "Next bar" : stepDone ? "Skip tapping · next bar" : "Name it first"}
          </Button>
          <Button variant="outline" onClick={() => setSummary(true)}>
            End
          </Button>
        </div>
      </div>
      {summary ? (
        <SessionSummary
          title="Rhythm complete"
          correct={session.correct}
          total={session.total}
          points={session.points}
          streak={store.currentStreak}
          leveledUp={leveled != null}
          newGrade={leveled ?? undefined}
          onAgain={() => {
            setSummary(false);
            setLeveled(null);
            setSession({ total: 0, correct: 0, points: 0 });
            nextExercise();
          }}
        />
      ) : null}
    </GameShell>
  );
}
