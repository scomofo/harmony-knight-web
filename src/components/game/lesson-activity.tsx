import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, RotateCcw, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  activityComplete,
  taskProgress,
  type ActivityTask,
  type LessonActivity,
} from "@/lib/game/activities";
import { activityPlan, soundPlan, type PlaybackPart } from "@/lib/game/teaching-playback";
import { PlaybackOptions, useTeachingPlayer } from "./teaching-player";
import { noteName } from "@/lib/game/music";
import { useGameStore } from "@/lib/game/store";
import { cn } from "@/lib/utils";
import { activityHint } from "@/lib/game/activity-hints";

export function LessonActivityPanel({
  unitId,
  activity,
}: {
  unitId: string;
  activity: LessonActivity;
}) {
  const saved = useGameStore((s) =>
    s.unitProgress[unitId]?.reviewing && s.practicalReviews[unitId]
      ? s.practicalReviews[unitId]!.progress
      : s.activityProgress[unitId],
  );
  const update = useGameStore((s) => s.updateLearningActivity);
  const muted = useGameStore((s) => s.settings.muted);
  const index = saved?.index ?? 0;
  const task = activity.tasks[index]!;
  const progress = taskProgress(task, saved?.tasks[task.id]);
  const complete = activityComplete(activity, saved);
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const selected = progress.draft[0]!;
  const player = useTeachingPlayer();
  const [part, setPart] = useState<PlaybackPart>("together");
  const playingNotes = player.state?.plan.steps[player.state.index]?.notes ?? [];
  const hear = (draft: number[][], label: string) =>
    player.play(activityPlan(task, draft, part), label);
  const hasNotes = progress.draft.some((row) => row.length > 0);
  const hint = activityHint(task, progress.draft, progress.hintLevel ?? 0);
  const focused = (row: number, index?: number, midi?: number) =>
    (progress.hintLevel ?? 0) >= 2 &&
    hint.focus.some(
      (f) => f.row === row && (index !== undefined ? f.index === index : f.midi === midi),
    );
  const solvedCount = activity.tasks.filter((t) => saved?.tasks[t.id]?.solved).length;
  const firstCorrect = activity.tasks.filter((t) => saved?.tasks[t.id]?.firstCorrect).length;

  useEffect(() => {
    heading.current?.focus();
    return () => player.stop();
  }, [index, unitId, player.stop]);

  const edit = (draft: number[][]) => {
    player.stop();
    update(unitId, { type: "edit", draft });
  };

  return (
    <div className="space-y-5" role="region" aria-label={activity.title}>
      <div>
        <p className="text-sm text-[var(--color-harmony)]">
          {activity.title} · task {index + 1} of {activity.tasks.length}
        </p>
        <h3 ref={heading} tabIndex={-1} className="mt-2 text-xl font-medium outline-none">
          {task.title}
        </h3>
        <p className="mt-3 text-base leading-relaxed">{task.instruction}</p>
      </div>

      {task.kind === "listening" ? (
        <div className="space-y-4">
          <Button
            variant="secondary"
            disabled={muted}
            onClick={() => hear(progress.draft, "The sounds")}
          >
            <Volume2 className="size-4" /> Hear the sounds
          </Button>
          {task.references ? (
            <div role="group" aria-label="Sound colour references" className="flex flex-wrap gap-2">
              {task.references.map(({ label, sound }) => (
                <Button
                  key={label}
                  variant="outline"
                  disabled={muted}
                  onClick={() => {
                    player.play(soundPlan([sound]), `${label} reference`);
                  }}
                >
                  Hear {label}
                </Button>
              ))}
            </div>
          ) : null}
          <fieldset disabled={progress.solved} className="flex flex-wrap gap-3">
            <legend className="mb-2 text-sm">Your answer</legend>
            {task.options.map((option, i) => (
              <Button
                key={option}
                variant={selected[0] === i ? "default" : "outline"}
                aria-pressed={selected[0] === i}
                onClick={() => edit([[i]])}
              >
                {option}
              </Button>
            ))}
          </fieldset>
          <Button
            variant="ghost"
            disabled={progress.solved}
            onClick={() => update(unitId, { type: "reveal" })}
          >
            Use a written clue (guided)
          </Button>
          {progress.assisted ? <p className="text-sm">{task.writtenClue}</p> : null}
        </div>
      ) : null}

      {task.kind === "chord" ? (
        <fieldset disabled={progress.solved} className="space-y-3">
          <legend className="mb-3 text-sm text-[var(--color-muted)]">
            Choose notes. Octave 4 starts at Middle C; the lowest selected note is the bass.
          </legend>
          <div className="flex flex-wrap gap-2">
            {task.choices.map((choice) => (
              <button
                key={choice.midi}
                type="button"
                aria-pressed={selected.includes(choice.midi)}
                aria-current={playingNotes.includes(choice.midi) ? "true" : undefined}
                aria-describedby={focused(0, undefined, choice.midi) ? `${id}-hint` : undefined}
                onClick={() =>
                  edit([
                    selected.includes(choice.midi)
                      ? selected.filter((n) => n !== choice.midi)
                      : [...selected, choice.midi].sort((a, b) => a - b),
                  ])
                }
                className={cn(
                  playingNotes.includes(choice.midi) && "ring-2 ring-[var(--color-harmony)]",
                  focused(0, undefined, choice.midi) &&
                    "border-[var(--color-ember)] ring-2 ring-[var(--color-ember)]",
                  "min-h-12 min-w-14 rounded-[var(--radius-md)] border px-3 text-base",
                  selected.includes(choice.midi)
                    ? "border-[var(--color-harmony)] bg-[var(--color-ink-3)]"
                    : "border-[var(--color-border-strong)] hover:bg-[var(--color-ink-3)]",
                )}
              >
                {choice.label}
              </button>
            ))}
          </div>
          <p className="text-sm">
            Low to high:{" "}
            {selected.length
              ? [...selected]
                  .sort((a, b) => a - b)
                  .map((n) => task.choices.find((c) => c.midi === n)?.label)
                  .join(" · ")
              : "No notes selected"}
          </p>
        </fieldset>
      ) : null}

      {task.kind === "rhythm" ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-muted)]">
            {task.subdivisionPulse
              ? "Mark the accented subdivisions. Quiet ticks fill the rest."
              : "Each filled cell starts a sound. Empty cells before an attack are silent; after an attack they sustain it until the next attack or bar line."}{" "}
            This grid is untimed. Use Tab and Space or click to toggle.
          </p>
          {task.rows.map((row, r) => (
            <fieldset key={row} disabled={progress.solved} className="min-w-0">
              <legend className="mb-2 text-sm font-medium">{row}</legend>
              <div className="overflow-x-auto pb-2">
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${task.labels.length}, minmax(44px, 1fr))`,
                  }}
                >
                  {task.labels.map((label, column) => {
                    const active = progress.draft[r]!.includes(column);
                    return (
                      <button
                        key={column}
                        type="button"
                        aria-label={`${row}, ${label}`}
                        aria-pressed={active}
                        aria-current={player.state?.index === column ? "step" : undefined}
                        aria-describedby={focused(r, column) ? `${id}-hint` : undefined}
                        onClick={() =>
                          edit(
                            progress.draft.map((attacks, at) =>
                              at !== r
                                ? attacks
                                : active
                                  ? attacks.filter((n) => n !== column)
                                  : [...attacks, column].sort((a, b) => a - b),
                            ),
                          )
                        }
                        className={cn(
                          player.state?.index === column && "ring-2 ring-[var(--color-harmony)]",
                          focused(r, column) &&
                            "border-[var(--color-ember)] ring-2 ring-[var(--color-ember)]",
                          "min-h-16 rounded-[var(--radius-md)] border text-sm",
                          active
                            ? "border-[var(--color-harmony)] bg-[var(--color-ink-3)]"
                            : "border-[var(--color-border-strong)] hover:bg-[var(--color-ink-3)]",
                        )}
                      >
                        <span className="block">{label}</span>
                        <span aria-hidden="true" className="mt-1 block text-lg">
                          {active ? "●" : "○"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </fieldset>
          ))}
        </div>
      ) : null}

      {task.kind === "voice" ? (
        <fieldset disabled={progress.solved}>
          <legend className="mb-3 text-sm text-[var(--color-muted)]">
            Choose a note for each position, then hear and check your phrase.
          </legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {task.positions.map((position, i) => (
              <div
                key={i}
                aria-current={player.state?.index === i ? "step" : undefined}
                className={cn(
                  "rounded-[var(--radius-md)] border border-[var(--color-border)] p-3",
                  player.state?.index === i && "ring-2 ring-[var(--color-harmony)]",
                  focused(0, i) && "ring-2 ring-[var(--color-ember)]",
                )}
              >
                <label htmlFor={`${id}-${i}`} className="block min-h-10 text-sm">
                  {i + 1}. {position}
                </label>
                <select
                  id={`${id}-${i}`}
                  aria-label={`Upper note ${i + 1}: ${position}`}
                  aria-describedby={focused(0, i) ? `${id}-hint` : undefined}
                  value={selected[i]}
                  onChange={(e) =>
                    edit([selected.map((n, at) => (at === i ? Number(e.target.value) : n))])
                  }
                  className="mt-2 min-h-11 w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-ink-2)] px-2 text-base"
                >
                  {task.choices.map((choice) => (
                    <option key={choice.midi} value={choice.midi}>
                      {choice.label}
                    </option>
                  ))}
                </select>
                {task.rule !== "line" ? (
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    {task.rule === "exact" ? "Reference" : "Bass"}: {noteName(task.bass[i]!)}
                  </p>
                ) : null}
                {task.chords ? (
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {task.chords[i]!.map((n) => noteName(n)).join(" · ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {task.kind !== "listening" ? (
          <>
            <Button
              variant="secondary"
              disabled={muted || !hasNotes}
              onClick={() => hear(progress.draft, "Your answer")}
            >
              <Volume2 className="size-4" />
              Hear my answer
            </Button>
            <Button variant="ghost" disabled={muted} onClick={() => hear(task.solution, "Example")}>
              <Volume2 className="size-4" />
              Hear an example
            </Button>
          </>
        ) : null}
      </div>
      {task.kind === "voice" && !["line", "exact"].includes(task.rule) ? (
        <label className="block text-sm">
          Hear parts separately{" "}
          <select
            aria-label="Playback part"
            value={part}
            onChange={(e) => {
              player.stop();
              setPart(e.target.value as PlaybackPart);
            }}
            className="min-h-11 rounded border border-[var(--color-border-strong)] bg-[var(--color-ink-2)] px-2"
          >
            <option value="together">Together</option>
            <option value="upper">Upper voice</option>
            <option value="bass">Bass / accompaniment</option>
          </select>
        </label>
      ) : null}
      <PlaybackOptions player={player} hideNotes={task.kind === "listening"} />
      {muted ? (
        <p className="text-sm text-[var(--color-muted)]">
          {task.kind === "listening"
            ? "Sound is muted. Use a written clue to continue as guided practice."
            : "Sound is muted in settings. All checks work without audio."}
        </p>
      ) : null}

      {progress.feedback ? (
        <div
          role="status"
          className={cn(
            "rounded-[var(--radius-md)] border p-4",
            progress.feedback.correct
              ? "border-[var(--color-harmony)]"
              : "border-[var(--color-ember)]",
          )}
        >
          <p className="font-medium">
            {progress.feedback.correct ? "That works." : "Try adjusting your answer."}
          </p>
          <p className="mt-2 text-base leading-relaxed">{progress.feedback.message}</p>
        </div>
      ) : null}
      {progress.assisted ? (
        <p className="text-sm text-[var(--color-muted)]">
          Help was used. This attempt is guided practice; a fresh review can check independent
          recall.
        </p>
      ) : null}
      {(progress.hintLevel ?? 0) > 0 ? (
        <p
          id={`${id}-hint`}
          role="status"
          className="rounded border border-[var(--color-ember)] p-3 text-sm"
        >
          {(progress.hintLevel ?? 0) >= 3 ? `One worked answer: ${task.explanation}` : hint.text}
        </p>
      ) : null}
      {progress.beforeCorrection?.some((r) => r.length > 0) && task.kind !== "listening" ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={muted}
            onClick={() => hear(progress.beforeCorrection!, "Before the correction")}
          >
            Hear before correction
          </Button>
          <Button
            variant="outline"
            disabled={muted}
            onClick={() => hear(task.solution, "Worked correction")}
          >
            Hear the correction
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!progress.solved ? (
          <>
            <Button
              variant="outline"
              disabled={(progress.hintLevel ?? 0) >= 2}
              onClick={() => update(unitId, { type: "hint" })}
            >
              {(progress.hintLevel ?? 0) === 0 ? "Give me a clue" : "Show where to look"}
            </Button>
            <Button
              onClick={() => {
                player.stop();
                update(unitId, { type: "check" });
              }}
              disabled={Boolean(progress.feedback)}
            >
              Check my answer
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                player.stop();
                update(unitId, { type: "reveal" });
              }}
            >
              Show a worked answer
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            onClick={() => {
              player.stop();
              update(unitId, { type: "retry" });
            }}
          >
            <RotateCcw className="size-4" />
            Try this task again
          </Button>
        )}
        {index > 0 ? (
          <Button variant="ghost" onClick={() => update(unitId, { type: "previous" })}>
            Previous task
          </Button>
        ) : null}
        {index < activity.tasks.length - 1 ? (
          <Button disabled={!progress.solved} onClick={() => update(unitId, { type: "next" })}>
            Next task <ArrowRight className="size-4" />
          </Button>
        ) : null}
      </div>
      <p className="text-sm text-[var(--color-muted)]">
        {solvedCount} of {activity.tasks.length} tasks completed. Drafts, checks and feedback are
        saved on this device. Corrections do not earn extra points or change your first-check
        result.
      </p>
      {complete ? (
        <p role="status" className="font-medium text-[var(--color-harmony)]">
          Activity complete · {firstCorrect} of {activity.tasks.length} correct on the first check
          without a worked answer. Ready for recall.
        </p>
      ) : null}
    </div>
  );
}
