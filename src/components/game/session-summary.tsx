import { Button } from "@/components/ui/button";
import { levelFor } from "@/lib/game/curriculum";
import { noteName } from "@/lib/game/music";
import { gradeProgress, useGameStore } from "@/lib/game/store";
import { Link } from "@tanstack/react-router";

export function SessionSummary({
  title,
  correct,
  total,
  points,
  streak,
  weakNotes,
  leveledUp,
  newGrade,
  onAgain,
}: {
  title: string;
  correct: number;
  total: number;
  points: number;
  streak: number;
  weakNotes?: number[];
  leveledUp?: boolean;
  newGrade?: number;
  onAgain: () => void;
}) {
  const acc = total ? Math.round((correct / total) * 100) : 0;
  const gradeLevel = useGameStore((s) => s.gradeLevel);
  const recentAtGrade = useGameStore((s) => s.recentAtGrade);
  const trial = gradeProgress({ gradeLevel, recentAtGrade });
  const next = levelFor(gradeLevel + 1);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[color-mix(in_oklab,var(--color-ink)_72%,transparent)] p-4 sm:items-center">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
          Session complete
        </p>
        <h2 className="mt-1 font-[var(--font-display)] text-2xl tracking-[-0.03em]">{title}</h2>
        {leveledUp ? (
          <p className="mt-2 text-sm text-[var(--color-harmony)]">
            Grade advanced to {newGrade}: {levelFor(newGrade ?? gradeLevel).title}. Read its lesson
            in the hall.
          </p>
        ) : null}
        <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-[var(--radius-md)] bg-[var(--color-ink-3)] p-3">
            <dt className="text-xs uppercase tracking-[0.12em] text-[var(--color-subtle)]">
              Accuracy
            </dt>
            <dd className="mt-1 font-mono text-xl tabular-nums">{acc}%</dd>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--color-ink-3)] p-3">
            <dt className="text-xs uppercase tracking-[0.12em] text-[var(--color-subtle)]">
              Points
            </dt>
            <dd className="mt-1 font-mono text-xl tabular-nums">+{points}</dd>
          </div>
          <div className="rounded-[var(--radius-md)] bg-[var(--color-ink-3)] p-3">
            <dt className="text-xs uppercase tracking-[0.12em] text-[var(--color-subtle)]">
              Streak
            </dt>
            <dd className="mt-1 font-mono text-xl tabular-nums">{streak}</dd>
          </div>
        </dl>
        {weakNotes && weakNotes.length > 0 ? (
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            Needs work: {weakNotes.map(noteName).join(", ")}
          </p>
        ) : (
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            {correct} of {total} answered true. Short sessions, often — that is the path.
          </p>
        )}
        {!leveledUp && !trial.maxed ? (
          <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-ink-3)] p-3">
            <div className="flex items-baseline justify-between text-xs text-[var(--color-muted)]">
              <span className="uppercase tracking-[0.12em]">Grade {trial.grade} trial</span>
              <span className="font-mono tabular-nums">
                {trial.answered}/{trial.needed}
                {trial.answered > 0 ? ` · ${Math.round(trial.accuracy * 100)}%` : ""}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-ink)]">
              <div
                className="h-full rounded-full bg-[var(--color-ember)]"
                style={{ width: `${(trial.answered / trial.needed) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              {trial.answered === 0
                ? `Answers in this level’s own drills count toward Level ${next.level}.`
                : `${Math.round(trial.neededAccuracy * 100)}% right across your last ${trial.needed} opens Level ${next.level}.`}
            </p>
          </div>
        ) : null}
        <div className="mt-6 flex gap-2">
          <Button className="flex-1" onClick={onAgain}>
            Train again
          </Button>
          <Button variant="secondary" className="flex-1" asChild>
            <Link to="/">Hall</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
