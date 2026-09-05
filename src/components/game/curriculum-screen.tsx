import { Link } from "@tanstack/react-router";
import { BookOpen, Check, Lock } from "lucide-react";
import { CURRICULUM } from "@/lib/game/curriculum";
import { gradeProgress, useGameStore } from "@/lib/game/store";
import { GameShell } from "./shell";
import { cn } from "@/lib/utils";

export function CurriculumScreen() {
  const grade = useGameStore((s) => s.gradeLevel);
  const recentAtGrade = useGameStore((s) => s.recentAtGrade);
  const lessonsRead = useGameStore((s) => s.lessonsRead);
  const trial = gradeProgress({ gradeLevel: grade, recentAtGrade });

  return (
    <GameShell title="Curriculum Map">
      <p className="mb-6 text-sm text-[var(--color-muted)] text-pretty">
        Three phases. Eleven levels. Every level has a lesson you can read at any time and a drill
        that opens when you reach it. Advance by passing the grade trial in that level’s own drills.
      </p>
      <ol className="space-y-3">
        {CURRICULUM.map((level) => {
          const locked = level.level > grade;
          const current = level.level === grade;
          const read = lessonsRead.includes(level.level);
          return (
            <li
              key={level.level}
              className={cn(
                "rounded-[var(--radius-lg)] border p-4",
                current
                  ? "border-[var(--color-parchment)] bg-[var(--color-ink-2)]"
                  : locked
                    ? "border-[var(--color-border)] opacity-70"
                    : "border-[var(--color-border)] bg-[var(--color-ink-2)]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-harmony)]">
                    Level {level.level} · {level.phase}
                    {current ? " · current" : locked ? " · ahead" : " · open"}
                  </p>
                  <h2 className="mt-1 font-[var(--font-display)] text-xl tracking-[-0.02em]">
                    {level.title}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{level.subtitle}</p>
                </div>
                {locked ? (
                  <Lock className="mt-1 size-4 shrink-0 text-[var(--color-subtle)]" />
                ) : read ? (
                  <Check className="mt-1 size-4 shrink-0 text-[var(--color-harmony)]" />
                ) : null}
              </div>
              <ul className="mt-3 space-y-1">
                {level.objectives.map((o) => (
                  <li key={o} className="text-sm text-[var(--color-subtle)]">
                    · {o}
                  </li>
                ))}
              </ul>
              {current && !trial.maxed ? (
                <div className="mt-3">
                  <div className="flex items-baseline justify-between text-xs text-[var(--color-muted)]">
                    <span>Grade trial</span>
                    <span className="font-mono tabular-nums">
                      {trial.answered}/{trial.needed} · need{" "}
                      {Math.round(trial.neededAccuracy * 100)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-ink-3)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-ember)]"
                      style={{ width: `${(trial.answered / trial.needed) * 100}%` }}
                    />
                  </div>
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/lesson/$level"
                  params={{ level: String(level.level) }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] px-3 text-sm hover:bg-[var(--color-ink-3)]"
                >
                  <BookOpen className="size-4" />
                  {read ? "Re-read lesson" : "Read lesson"}
                </Link>
                {!locked ? (
                  <Link
                    to={level.route}
                    className="inline-flex min-h-10 items-center rounded-[var(--radius-md)] bg-[var(--color-parchment)] px-3 text-sm font-medium text-[var(--color-ink)] hover:opacity-90"
                  >
                    {level.drillLabel} →
                  </Link>
                ) : (
                  <span className="inline-flex min-h-10 items-center px-1 text-sm text-[var(--color-subtle)]">
                    Drill opens at grade {level.level}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </GameShell>
  );
}
