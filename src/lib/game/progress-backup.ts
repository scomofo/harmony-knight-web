import { z } from "zod";
import { COURSE_UNITS, unitById } from "./course.ts";
import { activityForUnit } from "./activity-catalog.ts";
import { reviewActivity } from "./practical-review.ts";
import { evaluateActivity, type ActivityProgress, type LessonActivity } from "./activities.ts";
import { validCreation } from "./creations.ts";
import { useGameStore, type GameSave } from "./store.ts";

export const MAX_BACKUP_BYTES = 2_000_000;
const count = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const date = z.string().datetime({ offset: true });
const fraction = z.number().min(0).max(1);
const grade = z.number().int().min(0).max(10);
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,120}$/);
const rows = z.array(z.array(z.number().int().min(-1).max(127)).max(64)).max(8);
const task = z.object({
  draft: rows,
  checks: count,
  firstCorrect: z.boolean().nullable(),
  assisted: z.boolean(),
  solved: z.boolean(),
  feedback: z.object({ correct: z.boolean(), message: z.string().max(4000) }).optional(),
  hintLevel: z.number().int().min(0).max(3).optional(),
  beforeCorrection: rows.optional(),
});
const activity = z.object({ index: z.number().int().min(0).max(30), tasks: z.record(id, task) });
const creation = z.object({
  title: z.string().max(80),
  notes: z.array(z.number().int()).max(32),
  rhythm: rows,
  chords: z.array(z.string().max(12)).max(32),
  tempo: z.number().int().min(40).max(160),
  savedId: id.optional(),
});
const schema = z.object({
  onboardingDone: z.boolean(),
  confidence: fraction,
  currentStreak: count,
  bestStreak: count,
  totalNotesPlayed: count,
  totalCorrectNotes: count,
  recentAtGrade: z.array(z.boolean()).max(100),
  lessonsRead: z.array(grade).max(11),
  unitProgress: z.record(
    id,
    z.object({
      step: z.number().int().min(0).max(4),
      answers: z.partialRecord(z.enum(["0", "1"]), z.string().max(1000)),
      completedAt: date.nullable(),
      nextReviewAt: date.nullable(),
      intervalDays: z.number().int().min(0).max(30),
      reviewCount: count,
      reviewing: z.boolean(),
      assisted: z.boolean(),
    }),
  ),
  activityProgress: z.record(id, activity).default({}),
  practicalReviews: z
    .record(
      id,
      z.object({
        round: z.number().int().min(0).max(1_000_000),
        progress: activity,
        completedAt: date.nullable(),
      }),
    )
    .default({}),
  conceptPractice: z
    .record(
      id,
      z.object({
        attempts: count,
        independent: count,
        recent: z.array(z.boolean()).min(1).max(8),
        lastPractisedAt: date,
      }),
    )
    .default({}),
  creationDrafts: z.record(z.string().regex(/^(?:[0-9]|10)$/), creation).default({}),
  creations: z
    .array(creation.extend({ id, chapter: grade, updatedAt: date }))
    .max(200)
    .default([]),
  activeUnitId: id.nullable(),
  learningDays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(366),
  lastActiveAt: date,
  inBrokenBladeRecovery: z.boolean(),
  gradeLevel: grade,
  duelWins: count,
  duelIntroSeen: z.boolean(),
  harmonyPoints: count,
  weakNotesMidi: z.array(z.number().int().min(0).max(127)).max(128),
  questsDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  quests: z
    .array(
      z.object({
        id,
        title: z.string().max(200),
        mode: z.enum(["practice", "realtime", "duel", "recovery", "study"]),
        targetCount: count,
        progressCount: count,
        rewardHarmonyPoints: count,
        claimed: z.boolean(),
      }),
    )
    .max(50),
  mastery: z.record(
    id,
    z.object({
      topicId: id,
      attempts: count,
      correct: count,
      totalResponseMs: z.number().nonnegative(),
      bestConfidence: fraction,
      recentCorrect: z.array(z.boolean()).max(100),
    }),
  ),
  srItems: z.record(
    id,
    z.object({
      id,
      topic: z.string().max(100),
      gradeLevel: grade,
      easeFactor: z.number().min(1.3).max(1000),
      intervalDays: count,
      repetitions: count,
      nextReviewAt: date,
      lastReviewedAt: date.nullable(),
    }),
  ),
  heatmap: z.record(
    z.string().regex(/^\d{1,3}$/),
    z.object({
      attempts: count,
      correct: count,
      recentCorrect: z.array(z.boolean()).max(10).optional(),
    }),
  ),
  settings: z.object({
    focusMode: z.boolean(),
    highContrast: z.boolean(),
    reducedMotion: z.boolean(),
    sessionMinutes: z.number().int().min(1).max(60),
    masterVolume: fraction,
    muted: z.boolean(),
  }),
});

function safeKeys(value: unknown, depth = 0): void {
  if (depth > 30) throw new Error("This file contains unsupported nested data.");
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (["__proto__", "prototype", "constructor"].includes(key))
      throw new Error("This file contains unsupported data.");
    safeKeys(child, depth + 1);
  }
}
function validActivity(activity: LessonActivity | undefined, progress: ActivityProgress) {
  if (!activity || !activity.tasks[progress.index]) return false;
  for (const [id, p] of Object.entries(progress.tasks)) {
    const task = activity.tasks.find((t) => t.id === id);
    if (!task) return false;
    for (const draft of [p.draft, ...(p.beforeCorrection ? [p.beforeCorrection] : [])]) {
      if (task.kind === "rhythm") {
        if (
          draft.length !== task.rows.length ||
          draft.some(
            (r) => new Set(r).size !== r.length || r.some((n) => n < 0 || n >= task.labels.length),
          )
        )
          return false;
      } else if (task.kind === "listening") {
        if (
          draft.length !== 1 ||
          draft[0]!.length > 1 ||
          draft[0]!.some((n) => n < 0 || n >= task.options.length)
        )
          return false;
      } else if (
        draft.length !== 1 ||
        (task.kind === "voice" && draft[0]!.length !== task.positions.length) ||
        (new Set(draft[0]).size !== draft[0]!.length && task.kind === "chord") ||
        draft[0]!.some((n) => !task.choices.some((c) => c.midi === n))
      )
        return false;
    }
    if (p.solved && !evaluateActivity(task, p.draft).correct) return false;
    if (p.firstCorrect === true && p.checks === 0) return false;
  }
  return true;
}
function validateData(input: unknown): GameSave {
  safeKeys(input);
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    throw new Error(
      "This backup has missing or invalid progress fields. Nothing has been changed.",
    );
  const data = parsed.data as GameSave;
  const fail = () => {
    throw new Error(
      "This backup contains incompatible lesson, review or music data. Nothing has been changed.",
    );
  };
  if (
    data.totalCorrectNotes > data.totalNotesPlayed ||
    new Set(data.creations.map((c) => c.id)).size !== data.creations.length
  )
    fail();
  if (data.activeUnitId && !unitById(data.activeUnitId)) fail();
  for (const [id, p] of Object.entries(data.unitProgress)) {
    const unit = unitById(id);
    if (
      !unit ||
      Object.entries(p.answers).some(
        ([i, answer]) => !unit.checks[Number(i)]?.options.includes(answer),
      )
    )
      fail();
  }
  for (const [id, p] of Object.entries(data.activityProgress))
    if (!validActivity(activityForUnit(id), p)) fail();
  for (const [id, p] of Object.entries(data.practicalReviews))
    if (!validActivity(reviewActivity(id, p.round), p.progress)) fail();
  for (const [id, p] of Object.entries(data.conceptPractice))
    if (!unitById(id) || p.independent > p.attempts || p.recent.length > p.attempts) fail();
  for (const [chapter, draft] of Object.entries(data.creationDrafts))
    if (!validCreation(Number(chapter), draft)) fail();
  for (const piece of data.creations) if (!validCreation(piece.chapter, piece)) fail();
  for (const [midi, p] of Object.entries(data.heatmap))
    if (Number(midi) > 127 || p.correct > p.attempts) fail();
  for (const p of Object.values(data.mastery)) if (p.correct > p.attempts) fail();
  for (const p of data.quests) if (p.progressCount > p.targetCount) fail();
  return data;
}
export type ProgressBackup = {
  format: "harmony-knight-progress";
  version: 1;
  exportedAt: string;
  data: GameSave;
};
export function makeProgressBackup(state: unknown = useGameStore.getState()): string {
  const backup: ProgressBackup = {
    format: "harmony-knight-progress",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: validateData(state),
  };
  return JSON.stringify(backup, null, 2);
}
export function readProgressBackup(text: string): ProgressBackup {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES)
    throw new Error("Choose a Harmony Knight backup smaller than 2 MB.");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("This file is not valid JSON. Choose an exported Harmony Knight backup.");
  }
  safeKeys(value);
  const parsed = z
    .object({
      format: z.literal("harmony-knight-progress"),
      version: z.literal(1),
      exportedAt: date,
      data: z.unknown(),
    })
    .strict()
    .safeParse(value);
  if (!parsed.success) throw new Error("This is not a supported Harmony Knight progress backup.");
  return { ...parsed.data, data: validateData(parsed.data.data) };
}
export function backupSummary(backup: ProgressBackup) {
  return {
    lessons: COURSE_UNITS.filter((u) => backup.data.unitProgress[u.id]?.completedAt).length,
    pieces: backup.data.creations.length,
    points: backup.data.harmonyPoints,
  };
}
/** Write successfully before changing the in-memory store; quota errors leave the current session intact. */
export function restoreProgressBackup(
  backup: ProgressBackup,
  storage: Pick<Storage, "setItem"> = localStorage,
) {
  const data = validateData(backup.data);
  storage.setItem("harmony-knight-save", JSON.stringify({ state: data, version: 0 }));
  useGameStore.setState({ ...data, hydrated: true });
}
