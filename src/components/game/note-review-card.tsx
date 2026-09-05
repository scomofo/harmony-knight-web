import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { noteName } from "@/lib/game/music";
import { noteReviewPlan } from "@/lib/game/review";
import { useGameStore } from "@/lib/game/store";

export function NoteReviewCard() {
  const state = useGameStore();
  const plan = noteReviewPlan(state.gradeLevel, state.heatmap, state.srItems);
  const caughtUp = plan.weak.length === 0 && plan.due.length === 0;
  return (
    <section
      aria-label="Note review"
      className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-5"
    >
      <h2 className="font-[var(--font-display)] text-xl">Your note review</h2>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        {[
          ["Need work", plan.weak.length],
          ["Due now", plan.due.length],
          ["Not tried", plan.unseen.length],
        ].map(([label, count]) => (
          <div key={label}>
            <dt className="text-[var(--color-muted)]">{label}</dt>
            <dd className="mt-1 font-mono text-2xl tabular-nums">{count}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-[var(--color-muted)]">
        {plan.weak.length
          ? `Focus on ${plan.weak.map(noteName).join(", ")}. Recent first-try answers decide which notes need work.`
          : plan.due.length
            ? "These notes are ready to revisit. A short review helps keep them familiar."
            : plan.unseen.length
              ? "Start with a few notes. Your first-try answers will build a personal review list."
              : "Your note reviews are up to date. Continue your level’s lesson or practise freely."}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {plan.weak.length > 0 ? (
          <Button asChild>
            <Link to="/practice" search={{ mode: "focus" }}>
              Practise weak notes
            </Link>
          </Button>
        ) : null}
        {plan.due.length > 0 ? (
          <Button variant={plan.weak.length ? "secondary" : "default"} asChild>
            <Link to="/practice" search={{ mode: "review" }}>
              Review {plan.due.length} due {plan.due.length === 1 ? "note" : "notes"}
            </Link>
          </Button>
        ) : null}
        {caughtUp ? (
          <Button variant="secondary" asChild>
            <Link to="/practice" search={{ mode: undefined }}>
              Free practice
            </Link>
          </Button>
        ) : null}
      </div>
      {plan.weak.some((midi) => plan.due.includes(midi)) ? (
        <p className="mt-3 text-sm text-[var(--color-subtle)]">
          Some notes need work and are also due.
        </p>
      ) : null}
    </section>
  );
}
