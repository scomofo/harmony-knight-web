import { useEffect, useId, useRef } from "react";
import { ArrowRight, RotateCcw, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  activityComplete,
  taskProgress,
  type ActivityTask,
  type LessonActivity,
} from "@/lib/game/activities";
import {
  playChord,
  playMidiSequence,
  playOnsetGrid,
  playProgression,
  playVoicePhrase,
  stopTones,
} from "@/lib/game/audio";
import { noteName } from "@/lib/game/music";
import { useGameStore } from "@/lib/game/store";
import { cn } from "@/lib/utils";

function hear(task: ActivityTask, draft: number[][]) {
  stopTones();
  if (task.kind === "rhythm") {
    playOnsetGrid(draft, task.labels.length, task.stepBeats, task.subdivisionPulse);
  } else if (task.kind === "chord") {
    if (task.context) playProgression([...task.context, draft[0]!]);
    else playChord(draft[0]!);
  } else if (task.rule === "exact" || task.rule === "line") {
    playMidiSequence(draft[0]!, 0.55, 0.5);
  } else if (task.chords) {
    playProgression(task.chords.map((chord, i) => [...chord, draft[0]![i]!]));
  } else {
    playVoicePhrase(
      task.bass,
      draft[0]!,
      task.rule === "passing" ? 0.4 : 0.75,
      task.rule === "suspension",
    );
  }
}

export function LessonActivityPanel({
  unitId,
  activity,
}: {
  unitId: string;
  activity: LessonActivity;
}) {
  const saved = useGameStore((s) => s.activityProgress[unitId]);
  const update = useGameStore((s) => s.updateLearningActivity);
  const muted = useGameStore((s) => s.settings.muted);
  const index = saved?.index ?? 0;
  const task = activity.tasks[index]!;
  const progress = taskProgress(task, saved?.tasks[task.id]);
  const complete = activityComplete(activity, saved);
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const selected = progress.draft[0]!;
  const hasNotes = progress.draft.some((row) => row.length > 0);
  const solvedCount = activity.tasks.filter((t) => saved?.tasks[t.id]?.solved).length;
  const firstCorrect = activity.tasks.filter((t) => saved?.tasks[t.id]?.firstCorrect).length;

  useEffect(() => {
    heading.current?.focus();
    return () => stopTones();
  }, [index, unitId]);

  const edit = (draft: number[][]) => {
    stopTones();
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
                onClick={() =>
                  edit([
                    selected.includes(choice.midi)
                      ? selected.filter((n) => n !== choice.midi)
                      : [...selected, choice.midi].sort((a, b) => a - b),
                  ])
                }
                className={cn(
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
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
              >
                <label htmlFor={`${id}-${i}`} className="block min-h-10 text-sm">
                  {i + 1}. {position}
                </label>
                <select
                  id={`${id}-${i}`}
                  aria-label={`Upper note ${i + 1}: ${position}`}
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
        <Button
          variant="secondary"
          disabled={muted || !hasNotes}
          onClick={() => hear(task, progress.draft)}
        >
          <Volume2 className="size-4" />
          Hear my answer
        </Button>
        <Button variant="ghost" disabled={muted} onClick={() => hear(task, task.solution)}>
          <Volume2 className="size-4" />
          Hear an example
        </Button>
        <Button variant="ghost" onClick={stopTones}>
          <Square className="size-4" />
          Stop sound
        </Button>
      </div>
      {muted ? (
        <p className="text-sm text-[var(--color-muted)]">
          Sound is muted in settings. All checks work without audio.
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
          A worked answer has been shown. Check it and listen for the connection; this is guided
          practice.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!progress.solved ? (
          <>
            <Button
              onClick={() => {
                stopTones();
                update(unitId, { type: "check" });
              }}
              disabled={Boolean(progress.feedback)}
            >
              Check my answer
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                stopTones();
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
              stopTones();
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
