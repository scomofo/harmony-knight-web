import { Button } from "@/components/ui/button";
import { noteName } from "@/lib/game/music";
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
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[color-mix(in_oklab,var(--color-ink)_72%,transparent)] p-4 sm:items-center">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
          Session complete
        </p>
        <h2 className="mt-1 font-[var(--font-display)] text-2xl tracking-[-0.03em]">
          {title}
        </h2>
        {leveledUp ? (
          <p className="mt-2 text-sm text-[var(--color-harmony)]">
            Grade advanced to {newGrade}. The map opens a little further.
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
