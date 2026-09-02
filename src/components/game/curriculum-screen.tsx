import { Link } from "@tanstack/react-router";
import { CURRICULUM } from "@/lib/game/curriculum";
import { useGameStore } from "@/lib/game/store";
import { GameShell } from "./shell";
import { cn } from "@/lib/utils";

export function CurriculumScreen() {
  const grade = useGameStore((s) => s.gradeLevel);
  return (
    <GameShell title="Curriculum Map">
      <p className="mb-6 text-sm text-[var(--color-muted)] text-pretty">
        Three phases. Eleven levels. Unlock by training — not by skipping the hall.
      </p>
      <ol className="space-y-3">
        {CURRICULUM.map((level) => {
          const locked = level.level > grade;
          const current = level.level === grade;
          return (
            <li key={level.level}>
              <Link
                to={locked ? "/curriculum" : level.route}
                className={cn(
                  "block rounded-[var(--radius-lg)] border p-4",
                  current
                    ? "border-[var(--color-parchment)] bg-[var(--color-ink-2)]"
                    : locked
                      ? "border-[var(--color-border)] opacity-45"
                      : "border-[var(--color-border)] bg-[var(--color-ink-2)] hover:border-[var(--color-border-strong)]",
                )}
              >
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-harmony)]">
                  Level {level.level} · {level.phase}
                  {current ? " · current" : locked ? " · locked" : " · open"}
                </p>
                <h2 className="mt-1 font-[var(--font-display)] text-xl tracking-[-0.02em]">
                  {level.title}
                </h2>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{level.subtitle}</p>
                <p className="mt-2 text-sm text-[var(--color-subtle)]">{level.narrativeTheme}</p>
              </Link>
            </li>
          );
        })}
      </ol>
    </GameShell>
  );
}
