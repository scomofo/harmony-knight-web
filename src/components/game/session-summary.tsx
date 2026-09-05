import { Button } from "@/components/ui/button";
import { levelFor } from "@/lib/game/curriculum";
import { noteName } from "@/lib/game/music";
import { gradeProgress, useGameStore } from "@/lib/game/store";
import { Link } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

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
  accuracyLabel = "Accuracy",
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
  accuracyLabel?: string;
}) {
  const acc = total ? Math.round((correct / total) * 100) : 0;
  const gradeLevel = useGameStore((s) => s.gradeLevel);
  const recentAtGrade = useGameStore((s) => s.recentAtGrade);
  const highContrast = useGameStore((s) => s.settings.highContrast);
  const trial = gradeProgress({ gradeLevel, recentAtGrade });
  const next = levelFor(gradeLevel + 1);
  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[color-mix(in_oklab,var(--color-ink)_72%,transparent)]" />
        <Dialog.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-6 text-[var(--color-parchment)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
            highContrast && "high-contrast",
          )}
        >
          <Dialog.Description className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            Session complete
          </Dialog.Description>
          <Dialog.Title className="mt-1 font-[var(--font-display)] text-2xl tracking-[-0.03em]">
            {title}
          </Dialog.Title>
          {leveledUp ? (
            <p className="mt-2 text-sm text-[var(--color-harmony)]">
              Grade advanced to {newGrade}: {levelFor(newGrade ?? gradeLevel).title}. Read its
              lesson in the hall.
            </p>
          ) : null}
          <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-[var(--radius-md)] bg-[var(--color-ink-3)] p-3">
              <dt className="text-xs uppercase tracking-[0.12em] text-[var(--color-subtle)]">
                {accuracyLabel}
              </dt>
              <dd className="mt-1 font-mono text-xl tabular-nums">{total ? `${acc}%` : "—"}</dd>
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
            <div className="mt-4 text-sm text-[var(--color-muted)]">
              Needs work: {weakNotes.map(noteName).join(", ")}
              <Button variant="outline" className="mt-3 w-full" asChild>
                <Link to="/practice" search={{ mode: "focus" }} onClick={onAgain}>
                  Practise these notes
                </Link>
              </Button>
            </div>
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
