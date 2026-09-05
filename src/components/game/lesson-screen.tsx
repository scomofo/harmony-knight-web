import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Volume2 } from "lucide-react";
import { playChord, playMidiSequence, playProgression, playTimbre } from "@/lib/game/audio";
import { CURRICULUM, levelFor } from "@/lib/game/curriculum";
import { lessonFor, type LessonExample } from "@/lib/game/lessons";
import { useGameStore } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { GameShell } from "./shell";
import { cn } from "@/lib/utils";

function playExample(ex: LessonExample) {
  if (ex.mode === "timbre") {
    playTimbre((ex.notes as number[])[0] ?? 64, ex.timbre ?? "Warm", 1.1);
    return;
  }
  if (ex.mode === "progression") {
    playProgression(ex.notes as number[][], 0.85, 0.8);
    return;
  }
  if (ex.mode === "chord") {
    playChord(ex.notes as number[]);
    return;
  }
  const notes = ex.notes as number[];
  playMidiSequence(notes, notes.length > 5 ? 0.24 : 0.42, notes.length > 5 ? 0.32 : 0.5);
}

export function LessonScreen({ level }: { level: number }) {
  const grade = useGameStore((s) => s.gradeLevel);
  const lessonsRead = useGameStore((s) => s.lessonsRead);
  const markLessonRead = useGameStore((s) => s.markLessonRead);
  const cur = levelFor(level);
  const lesson = lessonFor(level);
  const locked = level > grade;
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const answered = Object.keys(answers).length;
  const correctCount = lesson.check.filter((q, i) => answers[i] === q.answer).length;
  const checkDone = answered >= lesson.check.length;
  const alreadyRead = lessonsRead.includes(level);
  const next = CURRICULUM.find((l) => l.level === level + 1);
  const prev = CURRICULUM.find((l) => l.level === level - 1);

  const finish = () => {
    if (!alreadyRead) markLessonRead(level);
  };

  return (
    <GameShell title={`Level ${level} · Lesson`} backTo="/curriculum">
      <article className="flex flex-col gap-6">
        <header>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-harmony)]">
            {cur.phase} · {cur.subtitle}
          </p>
          <h2 className="mt-1 font-[var(--font-display)] text-3xl leading-tight tracking-[-0.03em] text-balance">
            {cur.title}
          </h2>
          <p className="mt-3 text-[var(--color-muted)] text-pretty">{lesson.intro}</p>
          {locked ? (
            <p className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-ink-2)] px-3 py-2 text-sm text-[var(--color-muted)]">
              You are at grade {grade}. Read ahead freely — the drill unlocks when you arrive.
            </p>
          ) : null}
        </header>

        <section>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
            You will learn
          </p>
          <ul className="space-y-1.5">
            {cur.objectives.map((o) => (
              <li key={o} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-[var(--color-harmony)]" />
                {o}
              </li>
            ))}
          </ul>
        </section>

        {lesson.sections.map((s) => (
          <section
            key={s.heading}
            className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-5"
          >
            <h3 className="font-[var(--font-display)] text-xl tracking-[-0.02em]">{s.heading}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)] text-pretty">
              {s.body}
            </p>
            {s.example ? (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => playExample(s.example!)}
              >
                <Volume2 className="size-4" />
                {s.example.label}
              </Button>
            ) : null}
          </section>
        ))}

        <section className="rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-ink-2)] p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-harmony)]">
            Quick check · {correctCount}/{lesson.check.length}
          </p>
          <div className="mt-3 space-y-5">
            {lesson.check.map((q, i) => {
              const picked = answers[i];
              return (
                <div key={q.prompt}>
                  <p className="text-sm font-medium">{q.prompt}</p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {q.options.map((opt) => {
                      const state =
                        picked == null
                          ? "idle"
                          : opt === q.answer
                            ? "right"
                            : opt === picked
                              ? "wrong"
                              : "idle";
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={picked != null}
                          onClick={() => setAnswers((a) => ({ ...a, [i]: opt }))}
                          className={cn(
                            "min-h-11 rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm transition-colors",
                            state === "right" &&
                              "border-[var(--color-harmony)] bg-[color-mix(in_oklab,var(--color-harmony)_18%,transparent)]",
                            state === "wrong" &&
                              "border-[var(--color-ember)] bg-[color-mix(in_oklab,var(--color-ember)_16%,transparent)]",
                            state === "idle" &&
                              "border-[var(--color-border)] bg-[var(--color-ink)] hover:border-[var(--color-border-strong)]",
                            picked != null && state === "idle" && "opacity-50",
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {picked != null ? (
                    <p className="mt-2 text-sm text-[var(--color-muted)]">{q.why}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-parchment)] p-5 text-[var(--color-ink)]">
          <p className="text-xs uppercase tracking-[0.16em] opacity-70">Now train it</p>
          <h3 className="mt-1 font-[var(--font-display)] text-2xl tracking-[-0.03em]">
            {lesson.drill.label}
          </h3>
          <p className="mt-1 text-sm opacity-75">{lesson.drill.why}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild onClick={finish} disabled={locked}>
              <Link to={lesson.drill.to} search={{}}>
                {locked ? `Unlocks at grade ${level}` : "Start drill"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            {!alreadyRead && (checkDone || locked) ? (
              <Button
                variant="outline"
                className="border-[var(--color-ink)]/30 text-[var(--color-ink)] hover:bg-[var(--color-ink)]/5"
                onClick={finish}
              >
                Mark as read
              </Button>
            ) : alreadyRead ? (
              <span className="inline-flex items-center gap-1 text-sm opacity-70">
                <Check className="size-4" /> Read
              </span>
            ) : null}
          </div>
        </section>

        <nav className="flex justify-between text-sm">
          {prev ? (
            <Link
              to="/lesson/$level"
              params={{ level: String(prev.level) }}
              className="text-[var(--color-muted)] hover:text-[var(--color-parchment)]"
            >
              ← Level {prev.level}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to="/lesson/$level"
              params={{ level: String(next.level) }}
              className="text-[var(--color-muted)] hover:text-[var(--color-parchment)]"
            >
              Level {next.level} →
            </Link>
          ) : null}
        </nav>
      </article>
    </GameShell>
  );
}
