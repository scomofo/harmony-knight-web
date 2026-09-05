import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pause, Play, Volume2 } from "lucide-react";
import { playChosenNote, playLevelUp, playMidi, playSuccess } from "@/lib/game/audio";
import { figureNoteColor, figureNoteShape, noteName } from "@/lib/game/music";
import { PracticeQuestionEngine } from "@/lib/game/practice";
import { noteReviewPlan } from "@/lib/game/review";
import { BROKEN_BLADE_LENGTH } from "@/lib/game/curriculum";
import { useGameStore } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { ConfidenceSlider } from "./confidence-slider";
import { FigureNoteKey } from "./figurenote";
import { SessionSummary } from "./session-summary";
import { GameShell } from "./shell";
import { Staff } from "./staff";

function prepareSession(mode?: string) {
  const state = useGameStore.getState();
  const plan = noteReviewPlan(state.gradeLevel, state.heatmap, state.srItems);
  return {
    grade: state.gradeLevel,
    pool: plan.pool,
    targets: mode === "focus" ? plan.weak : mode === "review" ? plan.due : plan.pool,
    limit: state.settings.sessionMinutes * 60,
  };
}

export function PracticeScreen({ mode }: { mode?: string }) {
  const recovery = mode === "broken_blade";
  const focus = mode === "focus";
  const review = mode === "review";
  const finite = focus || review;
  const store = useGameStore();
  // Keep the pool stable through mistakes and grade changes; refresh it on restart.
  const [setup, setSetup] = useState(() => prepareSession(mode));
  const engineRef = useRef(new PracticeQuestionEngine());
  const questionStartRef = useRef(Date.now());
  const acceptingRef = useRef(false);
  const [target, setTarget] = useState<number | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [assisted, setAssisted] = useState(false);
  const [session, setSession] = useState({ total: 0, correct: 0, points: 0, completed: 0 });
  const [summary, setSummary] = useState(false);
  const [paused, setPaused] = useState(false);
  const [leveled, setLeveled] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const nextQuestion = useCallback(() => {
    const engine = engineRef.current;
    if (!engine.generateQuestion() || !engine.targetNote) return;
    setTarget(engine.targetNote.midi);
    setOptions(engine.answerOptions.map((n) => n.midi));
    setFeedback(null);
    setAssisted(engine.questionHadError);
    acceptingRef.current = true;
    questionStartRef.current = Date.now();
  }, []);

  useEffect(() => {
    const engine = new PracticeQuestionEngine();
    // Targets may be a single weak note; distractors still come from the full pool.
    engine.notePool = setup.pool.map((midi) => ({ midi }));
    engine.rebuildQueue(useGameStore.getState().ensureSRPool(setup.targets, setup.grade), finite);
    engineRef.current = engine;
    nextQuestion();
    return () => {
      acceptingRef.current = false;
    };
  }, [setup, finite, nextQuestion]);

  const endSession = useCallback(() => {
    acceptingRef.current = false;
    setSummary(true);
  }, []);

  useEffect(() => {
    if (recovery || paused || summary || setup.targets.length === 0) return;
    let lastTick = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === "visible") {
        setElapsed((seconds) => seconds + (now - lastTick) / 1000);
      }
      lastTick = now;
    }, 250);
    return () => window.clearInterval(id);
  }, [recovery, paused, summary, setup]);

  useEffect(() => {
    if (!recovery && elapsed >= setup.limit) endSession();
  }, [elapsed, setup.limit, recovery, endSession]);

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") {
        acceptingRef.current = false;
        setPaused(true);
      }
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, []);

  useEffect(() => {
    if (
      target == null ||
      feedback ||
      paused ||
      summary ||
      store.confidence >= 0.5 ||
      store.settings.muted
    )
      return;
    const id = window.setTimeout(() => playMidi(target, 0.7, 0.55), 180);
    return () => window.clearTimeout(id);
  }, [target, feedback, paused, summary, store.confidence, store.settings.muted]);

  const answer = (midi: number) => {
    if (!acceptingRef.current || paused || summary || target == null) return;
    acceptingRef.current = false;
    const result = engineRef.current.recordAnswer({ midi });
    const state = useGameStore.getState();
    if (result.updatedSRItem) state.updateSRItem(result.updatedSRItem);
    // Once the answer has been shown, corrections train memory but are not new evidence.
    const outcome = result.firstAttempt
      ? state.recordPractice({
          midi: target,
          correct: result.isCorrect,
          responseMs: Date.now() - questionStartRef.current,
          topicId: "note-reading-c4-b4",
        })
      : null;
    const completed = session.completed + Number(result.isCorrect);
    setFeedback(result.isCorrect ? "correct" : "wrong");
    setSession((s) => ({
      total: s.total + Number(result.firstAttempt),
      correct: s.correct + Number(result.firstAttempt && result.isCorrect),
      points: s.points + (outcome?.points ?? 0),
      completed,
    }));
    playChosenNote(midi, result.isCorrect, target);
    if (outcome?.fever && result.isCorrect) playSuccess();
    if (outcome?.leveledUp) {
      playLevelUp();
      setLeveled(outcome.newGrade);
    }
    if (recovery) state.finishRecoveryIfDone(completed);
  };

  const advance = () => {
    if (paused || summary) return;
    if (
      (recovery && session.completed >= BROKEN_BLADE_LENGTH) ||
      (finite && engineRef.current.isQueueExhausted)
    ) {
      endSession();
      return;
    }
    if (engineRef.current.isQueueExhausted) {
      engineRef.current.rebuildQueue(
        useGameStore.getState().ensureSRPool(setup.targets, setup.grade),
      );
    }
    nextQuestion();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paused || summary || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
      // Preserve Space/number behavior on the confidence slider and focused controls.
      const element = e.target instanceof Element ? e.target : null;
      if (
        element?.closest(
          "input, textarea, select, button, a, [contenteditable='true'], [role='slider']",
        )
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        if (target != null) playMidi(target);
        return;
      }
      const idx = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(e.code);
      if (idx >= 0 && options[idx] != null) {
        e.preventDefault();
        answer(options[idx]!);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const restart = () => {
    acceptingRef.current = false;
    setSession({ total: 0, correct: 0, points: 0, completed: 0 });
    setSummary(false);
    setPaused(false);
    setFeedback(null);
    setTarget(null);
    setLeveled(null);
    setElapsed(0);
    setSetup(prepareSession(mode));
  };

  const remaining = Math.max(0, Math.ceil(setup.limit - elapsed));
  const title = recovery
    ? "Broken Blade"
    : focus
      ? "Focus drill"
      : review
        ? "Due reviews"
        : "Practice";
  const roundDone =
    (finite && engineRef.current.isQueueExhausted) ||
    (recovery && session.completed >= BROKEN_BLADE_LENGTH);

  if (setup.targets.length === 0) {
    return (
      <GameShell title={title}>
        <div className="space-y-4 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-6">
          <h1 className="font-[var(--font-display)] text-2xl">
            {focus ? "No weak notes to review" : "You’re caught up"}
          </h1>
          <p className="text-[var(--color-muted)]">
            {focus
              ? "Practice a few notes to find what needs attention. Recent mistakes will appear here."
              : "No previously practised notes are due right now. You can still practise freely."}
          </p>
          <Button asChild>
            <Link to="/practice" search={{ mode: undefined }}>
              Free practice
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/">Back to the hall</Link>
          </Button>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title={title}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-muted)]">
          <span className="font-mono tabular-nums">
            {session.correct}/{session.total} first try
          </span>
          <span className="font-mono tabular-nums">
            {recovery
              ? "No timer"
              : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={summary}
            onClick={() => {
              acceptingRef.current = paused && feedback === null;
              questionStartRef.current = Date.now();
              setPaused(!paused);
            }}
          >
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            {paused ? "Resume" : "Pause"}
          </Button>
        </div>
        {finite || recovery ? (
          <p className="text-sm text-[var(--color-muted)]">
            {session.completed} of {recovery ? BROKEN_BLADE_LENGTH : setup.targets.length} notes
            reviewed · corrections don’t count toward accuracy.
          </p>
        ) : null}
        {paused ? (
          <div
            role="status"
            className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-8 text-center"
          >
            <h2 className="font-[var(--font-display)] text-2xl">Take your time</h2>
            <p className="mt-2 text-[var(--color-muted)]">
              Your session is paused. Resume when you’re ready.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] px-4 py-6">
              <p className="text-center text-sm text-[var(--color-muted)]">
                {assisted ? "Try that note again · unscored correction" : "What note is this?"}
              </p>
              {target != null ? (
                <Staff midi={target} confidence={store.confidence} revealName={feedback !== null} />
              ) : null}
              <div role="status" aria-live="polite" className="mt-3 text-center text-sm">
                {feedback === "wrong" && target != null ? (
                  <p className="text-[var(--color-ember)]">
                    This is {noteName(target)}. Listen and compare it with your answer, then try
                    again.
                  </p>
                ) : feedback === "correct" ? (
                  <p className="text-[var(--color-harmony)]">
                    {assisted
                      ? "That’s it. We’ll keep this note in your review list until it feels familiar."
                      : "Correct on the first try."}
                  </p>
                ) : null}
              </div>
              <div className="mt-3 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => target != null && playMidi(target)}
                >
                  <Volume2 className="size-4" />
                  Hear
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {options.map((midi, i) => (
                <FigureNoteKey
                  key={`${midi}-${i}`}
                  label={`${i + 1} · ${noteName(midi)}`}
                  color={figureNoteColor(midi)}
                  shape={figureNoteShape(midi)}
                  disabled={feedback !== null || summary}
                  selected={feedback !== null && midi === target}
                  onClick={() => answer(midi)}
                />
              ))}
            </div>
            {feedback ? (
              <Button onClick={advance}>
                {roundDone ? "See results" : feedback === "wrong" ? "Try again" : "Next note"}
              </Button>
            ) : (
              <p className="text-center text-sm text-[var(--color-subtle)]">
                Keys 1–4 answer · Space or tap the staff to hear the tone.
              </p>
            )}
            <ConfidenceSlider />
          </>
        )}
        <Button variant="outline" onClick={endSession}>
          End session
        </Button>
      </div>
      {summary ? (
        <SessionSummary
          title={
            recovery
              ? session.completed >= BROKEN_BLADE_LENGTH
                ? "Blade restored"
                : "Warm-up ended"
              : "Practice complete"
          }
          correct={session.correct}
          total={session.total}
          points={session.points}
          streak={store.currentStreak}
          accuracyLabel="First try"
          weakNotes={store.weakNotesMidi}
          leveledUp={leveled != null}
          newGrade={leveled ?? undefined}
          onAgain={restart}
        />
      ) : null}
    </GameShell>
  );
}
