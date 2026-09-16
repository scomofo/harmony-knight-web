import { evaluateActivity, type ActivityTask } from "./activities.ts";

export type HintFocus = { row: number; index?: number; midi?: number };
export function activityHint(
  task: ActivityTask,
  draft: number[][],
  level: number,
): { text: string; focus: HintFocus[] } {
  if (level < 2)
    return {
      focus: [],
      text:
        task.kind === "listening"
          ? task.hint
          : task.kind === "chord"
            ? "Check the number of notes, the distances between them, and which note is lowest."
            : task.kind === "rhythm"
              ? "Count each small subdivision. A held note needs one attack, even when it lasts several cells."
              : "Look at one change at a time. Compare the upper note with its bass, then compare the direction of both voices.",
    };
  if (evaluateActivity(task, draft).correct)
    return { text: "This answer satisfies the task. Check it when you are ready.", focus: [] };
  if (task.kind === "listening") return { text: task.writtenClue, focus: [] };
  if (task.kind === "rhythm") {
    for (let row = 0; row < task.rows.length; row++) {
      const index = task.labels.findIndex(
        (_, i) => Boolean(draft[row]?.includes(i)) !== task.solution[row]!.includes(i),
      );
      if (index >= 0)
        return {
          text: `${task.rows[row]}, ${task.labels[index]}: ${task.solution[row]!.includes(index) ? "add an attack" : "let the existing sound continue without a new attack"}.`,
          focus: [{ row, index }],
        };
    }
  }
  if (task.kind === "chord") {
    const extra = draft[0]?.find((n) => !task.solution[0]!.includes(n));
    const missing = task.solution[0]!.find((n) => !draft[0]?.includes(n));
    const name = (n: number) => task.choices.find((c) => c.midi === n)?.label ?? String(n);
    return {
      text:
        extra !== undefined && missing !== undefined
          ? `Compare ${name(extra)} with ${name(missing)} in the highlighted notes.`
          : extra !== undefined
            ? `Try removing ${name(extra)}.`
            : missing !== undefined
              ? `The chord needs ${name(missing)}.`
              : task.hint,
      focus: [extra, missing]
        .filter((n): n is number => n !== undefined)
        .map((midi) => ({ row: 0, midi })),
    };
  }
  if (task.kind === "voice") {
    const feedback = evaluateActivity(task, draft);
    const match = /[Pp]osition (\d+)/.exec(feedback.message);
    const index = match
      ? Number(match[1]) - 1
      : task.rule === "exact"
        ? draft[0]!.findIndex((n, i) => n !== task.solution[0]![i])
        : -1;
    return {
      text: feedback.message,
      focus:
        index >= 0 ? [{ row: 0, index }] : task.positions.map((_, index) => ({ row: 0, index })),
    };
  }
  return { text: task.hint, focus: [] };
}
