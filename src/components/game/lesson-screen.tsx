import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Check, Home, RotateCcw, Volume2, Square } from "lucide-react";
import {
  playChord,
  playMidiSequence,
  playProgression,
  playTimbre,
  stopTones,
} from "@/lib/game/audio";
import { levelFor } from "@/lib/game/curriculum";
import { unitsForLevel, type CourseUnit } from "@/lib/game/course";
import { freshUnitProgress, nextUnit } from "@/lib/game/learning";
import { type LessonExample } from "@/lib/game/lessons";
import { useGameStore } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { GameShell } from "./shell";
import { cn } from "@/lib/utils";

export function LessonScreen({ level, unitId }: { level: number; unitId?: string }) {
  const units = unitsForLevel(level);
  const progress = useGameStore((s) => s.unitProgress);
  const [fallbackId] = useState(
    () => (units.find((u) => !progress[u.id]?.completedAt) ?? units[0])?.id,
  );
  const unit = units.find((u) => u.id === (unitId ?? fallbackId)) ?? units[0];
  if (!unit)
    return (
      <GameShell title="Lesson not found">
        <p>Choose a chapter from the learning path.</p>
        <Button asChild className="mt-4">
          <Link to="/curriculum">Learning path</Link>
        </Button>
      </GameShell>
    );
  return <FocusedLesson key={unit.id} unit={unit} />;
}

function FocusedLesson({ unit }: { unit: CourseUnit }) {
  const saved = useGameStore((s) => s.unitProgress[unit.id]);
  const allProgress = useGameStore((s) => s.unitProgress);
  const open = useGameStore((s) => s.openUnit);
  const answer = useGameStore((s) => s.answerLearningUnit);
  const advance = useGameStore((s) => s.advanceLearningUnit);
  const revisit = useGameStore((s) => s.revisitUnit);
  const markHintUsed = useGameStore((s) => s.useLearningHint);
  const p = saved ?? freshUnitProgress();
  const heading = useRef<HTMLHeadingElement>(null);
  const units = unitsForLevel(unit.level);
  const position = units.findIndex((u) => u.id === unit.id) + 1;
  const questionIndex = p.step - 2;
  const question = unit.checks[questionIndex];
  const picked = p.answers[questionIndex];
  const next = nextUnit(allProgress, unit.id);
  const done = p.step === 4;
  const correct = unit.checks.filter((q, i) => p.answers[i] === q.answer).length;

  useEffect(() => {
    open(unit.id);
  }, [open, unit.id]);
  useEffect(() => {
    heading.current?.focus();
    stopTones();
  }, [p.step]);
  useEffect(() => () => stopTones(), []);

  return (
    <GameShell title="Your learning session" backTo="/">
      <article className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-muted)]">
          <Link to="/curriculum" className="inline-flex min-h-11 items-center gap-2">
            <BookOpen className="size-4" />
            Chapter {unit.level + 1} · lesson {position} of {units.length}
          </Link>
          <span>{p.reviewing ? "Recall practice" : `About ${unit.minutes} min`} · untimed</span>
        </div>
        <div>
          <div className="flex justify-between gap-2 text-sm" aria-label="Lesson steps">
            {["Learn", "Try it", "Recall", "Done"].map((label, i) => {
              const current = done ? 3 : p.step >= 2 ? 2 : p.step;
              return (
                <span
                  key={label}
                  aria-current={i === current ? "step" : undefined}
                  className={cn(
                    "border-b-2 pb-2 flex-1",
                    i <= current
                      ? "border-[var(--color-harmony)] text-[var(--color-parchment)]"
                      : "border-[var(--color-border)] text-[var(--color-muted)]",
                  )}
                >
                  {label}
                </span>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            Your place is saved on this device. You can stop at any step.
          </p>
        </div>
        <header>
          <p className="text-sm text-[var(--color-harmony)]">{levelFor(unit.level).subtitle}</p>
          <h2
            ref={heading}
            tabIndex={-1}
            className="mt-2 font-[var(--font-display)] text-3xl leading-tight tracking-[-0.03em] outline-none"
          >
            {done
              ? "A good place to pause."
              : p.step === 1
                ? "Make it musical"
                : p.step >= 2
                  ? `Recall ${questionIndex + 1} of ${unit.checks.length}`
                  : unit.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-muted)]">{unit.goal}</p>
        </header>

        {p.step === 0 ? (
          <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-5 sm:p-6">
            <p className="text-base leading-8">{unit.body}</p>
            {unit.example ? <ExampleAudio example={unit.example} /> : null}
            <Button className="mt-6 w-full sm:w-auto" onClick={() => advance(unit.id)}>
              Try this idea <ArrowRight className="size-4" />
            </Button>
          </section>
        ) : null}

        {p.step === 1 ? (
          <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-5 sm:p-6">
            <p className="text-base leading-8">{unit.tryIt}</p>
            {unit.example ? <ExampleAudio example={unit.example} /> : null}
            <p className="mt-4 text-sm text-[var(--color-muted)]">
              Try it aloud, on paper, or in your head. This activity is self-guided.
            </p>
            <Button className="mt-6 w-full sm:w-auto" onClick={() => advance(unit.id)}>
              Ready for two quick checks <ArrowRight className="size-4" />
            </Button>
          </section>
        ) : null}

        {question ? (
          <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-5 sm:p-6">
            <h3 className="text-lg font-medium leading-relaxed">{question.prompt}</h3>
            <div className="mt-4 grid gap-3">
              {question.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={picked !== undefined}
                  onClick={() => answer(unit.id, option)}
                  className={cn(
                    "min-h-12 rounded-[var(--radius-md)] border p-3 text-left text-base leading-relaxed",
                    picked !== undefined && option === question.answer
                      ? "border-[var(--color-harmony)] bg-[var(--color-ink-3)]"
                      : "border-[var(--color-border-strong)]",
                    picked === option &&
                      picked !== question.answer &&
                      "border-[var(--color-ember)]",
                    picked === undefined && "hover:bg-[var(--color-ink-3)]",
                  )}
                >
                  {option}
                  {picked !== undefined && option === question.answer ? (
                    <span className="ml-2 text-sm text-[var(--color-harmony)]">
                      ✓ Correct answer
                    </span>
                  ) : picked === option ? (
                    <span className="ml-2 text-sm text-[var(--color-ember)]">Your answer</span>
                  ) : null}
                </button>
              ))}
            </div>
            {picked !== undefined ? (
              <div role="status" className="mt-5 space-y-3">
                <p className="font-medium">
                  {picked === question.answer ? "You’ve got it." : "Here’s the connection."}
                </p>
                <p className="text-base leading-relaxed text-[var(--color-muted)]">
                  {question.why}
                </p>
                <Button className="w-full sm:w-auto" onClick={() => advance(unit.id)}>
                  {questionIndex === unit.checks.length - 1 ? "Save and finish" : "Next check"}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--color-muted)]">
                Take your time. Each answer comes with an explanation.
              </p>
            )}
          </section>
        ) : null}

        {done ? (
          <section className="rounded-[var(--radius-xl)] border border-[var(--color-harmony)] bg-[var(--color-ink-2)] p-5 sm:p-6">
            <div className="flex items-center gap-2 text-[var(--color-harmony)]">
              <Check className="size-5" />
              <span>Lesson completed · {unit.title}</span>
            </div>
            <p className="mt-4 text-base leading-relaxed">
              {p.assisted
                ? "You worked through the ideas with a refresher. Try the next recall without help when you feel ready."
                : correct === unit.checks.length
                  ? "Both ideas recalled correctly."
                  : `${correct} of ${unit.checks.length} recalled before the explanation. You worked through the corrections; that counts as learning.`}
            </p>
            <p className="mt-3 text-base leading-relaxed text-[var(--color-muted)]">
              {p.nextReviewAt
                ? `A short recall will be ready ${new Date(p.nextReviewAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}.`
                : "You can revisit this lesson whenever you like."}{" "}
              Your learning stays with you between visits.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/">
                <Home className="size-4" />
                Finish for now
              </Link>
            </Button>
            {next ? (
              <Button
                asChild
                variant="secondary"
                className="mt-3 h-auto min-h-11 w-full whitespace-normal py-3 text-left"
              >
                <Link
                  to="/lesson/$level"
                  params={{ level: String(next.level) }}
                  search={{ unit: next.id }}
                >
                  Another idea: {next.title}
                  <ArrowRight className="size-4 shrink-0" />
                </Link>
              </Button>
            ) : (
              <p className="mt-4">
                You have explored every lesson. Revisit the practical tasks, and use the drills to
                keep building fluency.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => revisit(unit.id)}>
                <BookOpen className="size-4" />
                Read again
              </Button>
              <Button variant="ghost" onClick={() => revisit(unit.id, true)}>
                <RotateCcw className="size-4" />
                Try recall again
              </Button>
            </div>
          </section>
        ) : null}

        {p.step >= 2 && !done ? (
          <details
            key={p.reviewing ? "review" : "lesson"}
            onToggle={(e) => {
              if (e.currentTarget.open) markHintUsed(unit.id);
            }}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
          >
            <summary className="cursor-pointer text-sm">Need the idea again?</summary>
            <p className="mt-3 text-base leading-8">{unit.body}</p>
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              Reading this is welcome. Use the next scheduled recall to try without help.
            </p>
          </details>
        ) : null}
        {!done ? (
          <Button variant="ghost" asChild>
            <Link to="/">
              <Home className="size-4" />
              Save my place and leave
            </Link>
          </Button>
        ) : null}
      </article>
    </GameShell>
  );
}

function ExampleAudio({ example }: { example: LessonExample }) {
  const muted = useGameStore((s) => s.settings.muted);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      stopTones();
    },
    [],
  );
  const stop = () => {
    stopTones();
    setPlaying(false);
    if (timer.current) clearTimeout(timer.current);
  };
  const play = () => {
    stop();
    setError(false);
    try {
      const notes = example.notes as number[];
      if (example.mode === "timbre") playTimbre(notes[0] ?? 64, example.timbre ?? "Warm", 1.1);
      else if (example.mode === "progression")
        playProgression(example.notes as number[][], 0.85, 0.8);
      else if (example.mode === "chord") playChord(notes);
      else
        playMidiSequence(
          notes,
          notes.length > 5 ? 0.24 : 0.42,
          notes.length > 5 ? 0.32 : 0.5,
          example.volumes,
        );
      setPlaying(true);
      const seconds =
        example.mode === "timbre"
          ? 1.2
          : example.mode === "chord"
            ? 1
            : example.mode === "progression"
              ? example.notes.length * 0.85
              : notes.length * (notes.length > 5 ? 0.24 : 0.42) + 0.5;
      timer.current = setTimeout(() => setPlaying(false), seconds * 1000);
    } catch {
      setError(true);
    }
  };
  return (
    <div className="mt-5">
      <Button
        variant="secondary"
        className="h-auto min-h-11 whitespace-normal py-3 text-left"
        onClick={playing ? stop : play}
        disabled={muted && !playing}
      >
        {playing ? <Square className="size-4 shrink-0" /> : <Volume2 className="size-4 shrink-0" />}
        {playing ? "Stop example" : example.label}
      </Button>
      {muted ? (
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Sound is muted.{" "}
          <Link to="/settings" className="underline">
            Change sound settings
          </Link>
          , or use the written example.
        </p>
      ) : null}
      {error ? (
        <p role="status" className="mt-2 text-sm">
          Audio isn’t available here. The written example still works.
        </p>
      ) : null}
    </div>
  );
}
