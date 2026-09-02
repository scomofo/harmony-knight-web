import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { playChosenNote, playLevelUp, playMidi, playSuccess } from "@/lib/game/audio";
import { figureNoteColor, figureNoteShape, noteName } from "@/lib/game/music";
import { buildNotePool, PracticeQuestionEngine } from "@/lib/game/practice";
import { BROKEN_BLADE_LENGTH } from "@/lib/game/curriculum";
import { useGameStore } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { ConfidenceSlider } from "./confidence-slider";
import { FigureNoteKey } from "./figurenote";
import { SessionSummary } from "./session-summary";
import { GameShell } from "./shell";
import { Staff } from "./staff";

export function PracticeScreen({
  mode,
}: {
  mode?: "broken_blade" | "focus" | string;
}) {
  const recovery = mode === "broken_blade";
  const focus = mode === "focus";
  const store = useGameStore();
  const engineRef = useRef(new PracticeQuestionEngine());
  const sessionStartRef = useRef(Date.now());
  const questionStartRef = useRef(Date.now());
  const [target, setTarget] = useState<number | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [locked, setLocked] = useState(false);
  const [session, setSession] = useState({ total: 0, correct: 0, points: 0 });
  const [summary, setSummary] = useState(false);
  const [leveled, setLeveled] = useState<{ grade: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const limit = recovery ? 99 : store.settings.sessionMinutes * 60;
  const goal = recovery ? BROKEN_BLADE_LENGTH : 0;

  const pool = useMemo(() => {
    if (focus && store.weakNotesMidi.length) return store.weakNotesMidi.map((midi) => ({ midi }));
    return buildNotePool(store.gradeLevel);
  }, [focus, store.gradeLevel, store.weakNotesMidi]);

  const nextQuestion = () => {
    const engine = engineRef.current;
    if (engine.isQueueExhausted) {
      const items = store.ensureSRPool(
        pool.map((n) => n.midi),
        store.gradeLevel,
      );
      engine.rebuildQueue(items);
    }
    if (!engine.generateQuestion() || !engine.targetNote) return;
    setTarget(engine.targetNote.midi);
    setOptions(engine.answerOptions.map((n) => n.midi));
    setFeedback(null);
    setLocked(false);
    questionStartRef.current = Date.now();
    if (store.confidence < 0.5 && !store.settings.muted) {
      window.setTimeout(() => playMidi(engine.targetNote!.midi, 0.7, 0.55), 180);
    }
  };

  useEffect(() => {
    const engine = engineRef.current;
    engine.notePool = pool;
    const items = store.ensureSRPool(
      pool.map((n) => n.midi),
      store.gradeLevel,
    );
    engine.rebuildQueue(items);
    nextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool]);

  useEffect(() => {
    if (recovery || summary) return;
    const id = window.setInterval(() => {
      const e = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      setElapsed(e);
      if (e >= limit) setSummary(true);
    }, 1000);
    return () => window.clearInterval(id);
  }, [limit, recovery, summary]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (target != null) playMidi(target);
        return;
      }
      const idx = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(e.code);
      if (idx >= 0 && options[idx] != null) answer(options[idx]!);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const answer = (midi: number) => {
    if (locked || target == null) return;
    const engine = engineRef.current;
    const result = engine.recordAnswer({ midi });
    if (result.updatedSRItem) store.updateSRItem(result.updatedSRItem);
    const outcome = store.recordPractice({
      midi: target,
      correct: result.isCorrect,
      responseMs: Date.now() - questionStartRef.current,
      topicId: "note-reading-c4-b4",
    });
    if (result.weakNotesMidi.length) {
      useGameStore.setState({ weakNotesMidi: result.weakNotesMidi });
    }
    setLocked(true);
    setFeedback(result.isCorrect ? "correct" : "wrong");
    setSession((s) => ({
      total: s.total + 1,
      correct: s.correct + (result.isCorrect ? 1 : 0),
      points: s.points + outcome.points,
    }));
    playChosenNote(midi, result.isCorrect, target);
    if (result.isCorrect) {
      if (outcome.fever) playSuccess();
      if (outcome.leveledUp) {
        playLevelUp();
        setLeveled({ grade: outcome.newGrade });
      }
    }
    window.setTimeout(() => {
      if (recovery && session.correct + (result.isCorrect ? 1 : 0) >= goal) {
        store.finishRecoveryIfDone(session.correct + (result.isCorrect ? 1 : 0));
        setSummary(true);
        return;
      }
      nextQuestion();
    }, 720);
  };

  const restart = () => {
    setSession({ total: 0, correct: 0, points: 0 });
    setSummary(false);
    setLeveled(null);
    sessionStartRef.current = Date.now();
    questionStartRef.current = Date.now();
    setElapsed(0);
    nextQuestion();
  };

  return (
    <GameShell title={recovery ? "Broken Blade" : focus ? "Focus drill" : "Practice"}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
          <span className="font-mono tabular-nums">
            {session.correct}/{session.total || 0}
          </span>
          <span className="font-mono tabular-nums">
            {recovery ? "No timer" : `${Math.max(0, limit - elapsed)}s`}
          </span>
          {store.currentStreak >= 10 ? (
            <span className="text-[var(--color-ember)]">Fever ×2</span>
          ) : (
            <span>Streak {store.currentStreak}</span>
          )}
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] px-4 py-6">
          <p className="text-center text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            What note is this?
          </p>
          {target != null ? (
            <Staff
              midi={target}
              confidence={store.confidence}
              revealName={feedback !== null}
            />
          ) : (
            <p className="py-10 text-center text-sm text-[var(--color-muted)]">Preparing the staff…</p>
          )}
          {feedback === "wrong" && target != null ? (
            <p className="text-center text-sm text-[var(--color-ember)]">
              That was {noteName(target)}.
            </p>
          ) : feedback === "correct" ? (
            <p className="text-center text-sm text-[var(--color-harmony)]">True.</p>
          ) : null}
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
              label={noteName(midi)}
              color={figureNoteColor(midi)}
              shape={figureNoteShape(midi)}
              disabled={locked}
              selected={feedback !== null && midi === target}
              onClick={() => answer(midi)}
            />
          ))}
        </div>
        <p className="text-center text-xs text-[var(--color-subtle)]">
          Keys 1–4 answer · Space or tap the staff to hear the tone.
        </p>
        <ConfidenceSlider />
        <Button variant="outline" onClick={() => setSummary(true)}>
          End session
        </Button>
      </div>
      {summary ? (
        <SessionSummary
          title={recovery ? "Blade restored" : "Practice complete"}
          correct={session.correct}
          total={session.total}
          points={session.points}
          streak={store.currentStreak}
          weakNotes={store.weakNotesMidi}
          leveledUp={Boolean(leveled)}
          newGrade={leveled?.grade}
          onAgain={restart}
        />
      ) : null}
    </GameShell>
  );
}
