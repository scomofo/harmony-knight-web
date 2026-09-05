import { buildNotePool } from "./practice.ts";
import type { SRItem } from "./sr.ts";

export type NoteHistory = {
  attempts: number;
  correct: number;
  /** First attempts only; optional so existing saves remain readable. */
  recentCorrect?: boolean[];
};

export function recordNoteAttempt(history: NoteHistory | undefined, correct: boolean): NoteHistory {
  return {
    attempts: (history?.attempts ?? 0) + 1,
    correct: (history?.correct ?? 0) + Number(correct),
    recentCorrect: [...(history?.recentCorrect ?? []), correct].slice(-10),
  };
}

export function noteAccuracy(history: NoteHistory): number {
  const recent = history.recentCorrect;
  return recent?.length
    ? recent.filter(Boolean).length / recent.length
    : history.attempts > 0
      ? history.correct / history.attempts
      : 0;
}

/** A fresh miss needs review; consistent first-try success clears it again. */
export function weakNotesFor(heatmap: Record<number, NoteHistory>): number[] {
  return Object.entries(heatmap)
    .filter(([, h]) => {
      const recent = h.recentCorrect;
      if (recent?.length) return recent.at(-1) === false || noteAccuracy(h) < 0.8;
      return h.attempts >= 3 && noteAccuracy(h) < 0.8;
    })
    .sort(([, a], [, b]) => noteAccuracy(a) - noteAccuracy(b))
    .map(([midi]) => Number(midi));
}

export function noteReviewPlan(
  grade: number,
  heatmap: Record<number, NoteHistory>,
  srItems: Record<string, SRItem>,
  now = new Date(),
) {
  const pool = buildNotePool(grade).map((n) => n.midi);
  const weak = weakNotesFor(heatmap).filter((midi) => pool.includes(midi));
  const due = pool.filter((midi) => {
    const item = srItems[`note_${midi}`];
    return item?.lastReviewedAt != null && new Date(item.nextReviewAt) <= now;
  });
  const unseen = pool.filter((midi) => !srItems[`note_${midi}`]?.lastReviewedAt);
  return { pool, weak, due, unseen };
}
