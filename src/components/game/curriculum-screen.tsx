import { Link } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";
import { CURRICULUM } from "@/lib/game/curriculum";
import { COURSE_UNITS, unitsForLevel } from "@/lib/game/course";
import { nextUnit } from "@/lib/game/learning";
import { useGameStore } from "@/lib/game/store";
import { GameShell } from "./shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CurriculumScreen() {
  const progress = useGameStore((s) => s.unitProgress);
  const active = useGameStore((s) => s.activeUnitId);
  const legacyRead = useGameStore((s) => s.lessonsRead);
  const next = nextUnit(progress, active);
  const completed = COURSE_UNITS.filter((u) => progress[u.id]?.completedAt).length;
  return (
    <GameShell title="Learning path">
      <header className="mb-6 space-y-3">
        <h2 className="font-[var(--font-display)] text-3xl">
          From your first note to your own ideas.
        </h2>
        <p className="text-base leading-relaxed text-[var(--color-muted)]">
          {COURSE_UNITS.length} short lessons across 11 chapters. Start at the beginning or explore
          a topic. Every lesson has teaching, a practical task and two recall questions.
        </p>
        <p className="text-sm text-[var(--color-harmony)]">
          {completed} of {COURSE_UNITS.length} completed · all lessons open
        </p>
        {next ? (
          <Button asChild className="h-auto min-h-11 whitespace-normal py-3 text-left">
            <Link
              to="/lesson/$level"
              params={{ level: String(next.level) }}
              search={{ unit: next.id }}
            >
              Continue: {next.title}
              <ArrowRight className="size-4 shrink-0" />
            </Link>
          </Button>
        ) : null}
      </header>
      <ol className="space-y-4">
        {CURRICULUM.map((level) => {
          const units = unitsForLevel(level.level);
          const count = units.filter((u) => progress[u.id]?.completedAt).length;
          const current = next?.level === level.level;
          return (
            <li
              key={level.level}
              className={cn(
                "rounded-[var(--radius-xl)] border bg-[var(--color-ink-2)] p-5",
                current ? "border-[var(--color-harmony)]" : "border-[var(--color-border)]",
              )}
            >
              <p className="text-sm text-[var(--color-harmony)]">
                Chapter {level.level + 1} · {level.phase} · {count}/{units.length} completed
              </p>
              <h3 className="mt-2 font-[var(--font-display)] text-2xl">{level.title}</h3>
              {legacyRead.includes(level.level) && count === 0 ? (
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  Your earlier overview is saved as read. These focused lessons add practice and
                  recall.
                </p>
              ) : null}
              <ol className="mt-4 divide-y divide-[var(--color-border)]">
                {units.map((u, i) => (
                  <li key={u.id}>
                    <Link
                      to="/lesson/$level"
                      params={{ level: String(level.level) }}
                      search={{ unit: u.id }}
                      aria-current={u.id === next?.id ? "step" : undefined}
                      className="flex min-h-14 items-start gap-3 py-3"
                    >
                      <span className="mt-1 w-6 shrink-0 text-sm text-[var(--color-harmony)]">
                        {progress[u.id]?.completedAt ? (
                          <Check aria-label="Completed" className="size-4" />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base">{u.title}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-[var(--color-muted)]">
                          {u.goal}
                        </span>
                      </span>
                      <span className="mt-1 shrink-0 text-sm text-[var(--color-muted)]">
                        {u.minutes} min
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </li>
          );
        })}
      </ol>
      <p className="mt-6 text-sm leading-relaxed text-[var(--color-muted)]">
        Explore foundations through advanced concepts in Western music theory. Return to the
        creative tasks to turn each idea into music of your own.
      </p>
    </GameShell>
  );
}
