import type { TeachingPlan, TeachingEvent } from "./teaching-playback.ts";
import { noteName } from "./music.ts";

export const CREATION_CHORDS: Record<string, number[]> = {
  C: [60, 64, 67],
  Cm: [60, 63, 67],
  Dm: [62, 65, 69],
  D: [62, 66, 69],
  Em: [64, 67, 71],
  F: [60, 65, 69],
  G: [59, 62, 67],
  Am: [60, 64, 69],
  Cmaj7: [60, 64, 67, 71],
  Fmaj7: [60, 64, 65, 69],
  G7: [59, 62, 65, 67],
  Am7: [60, 64, 67, 69],
};
export type CreationTemplate = {
  title: string;
  prompt: string;
  kind: "melody" | "rhythm" | "chords" | "duet";
  steps: number;
  palette: number[];
  chordOptions?: string[];
  bass?: number[];
};
const scale = [60, 62, 64, 65, 67, 69, 71, 72];
export const CHAPTER_CREATIONS: CreationTemplate[] = [
  {
    title: "A call and response",
    prompt:
      "Make four sounds using lower, middle and higher notes. Try a rising call followed by a falling reply.",
    kind: "melody",
    steps: 4,
    palette: [60, 64, 67, 72],
  },
  {
    title: "A musical postcard",
    prompt:
      "Choose four notes by name. Play your postcard, then change one note and hear what changes.",
    kind: "melody",
    steps: 4,
    palette: scale,
  },
  {
    title: "Your own groove",
    prompt:
      "Build one bar of 4/4 on two rows. Each cell is an eighth note. Try a steady low part and a playful high part.",
    kind: "rhythm",
    steps: 8,
    palette: [],
  },
  {
    title: "A melody with a home",
    prompt:
      "Make a phrase from C major. Try finishing on C, then on a different note. Which ending feels settled to you?",
    kind: "melody",
    steps: 8,
    palette: scale,
  },
  {
    title: "A palette of chords",
    prompt:
      "Choose four chords. Compare C major with C minor, then make a sequence whose sound you like.",
    kind: "chords",
    steps: 4,
    palette: [],
    chordOptions: ["C", "Cm", "F", "G", "Am", "Dm"],
  },
  {
    title: "Give your phrase an ending",
    prompt:
      "Choose a melody and its chords. Try G–C for an authentic ending, F–C for a plagal ending, or G–Am for a surprise.",
    kind: "melody",
    steps: 8,
    palette: scale,
    chordOptions: ["C", "F", "G", "Am", "Dm"],
  },
  {
    title: "Two lines in conversation",
    prompt:
      "Write an upper line above this bass. Try moving in the opposite direction. Hear the voices alone and together.",
    kind: "duet",
    steps: 4,
    palette: [64, 65, 67, 69, 71, 72, 74, 76],
    bass: [60, 62, 64, 60],
  },
  {
    title: "Travel to a new key",
    prompt:
      "Start near C and try ending in G. D major includes F#, which can help point toward G. Explore the route by listening.",
    kind: "chords",
    steps: 4,
    palette: [],
    chordOptions: ["C", "Dm", "F", "G", "Am", "D", "Em"],
  },
  {
    title: "A groove with colour",
    prompt:
      "Build a rhythm, then hear it over different seventh chords. Keep the groove and change just the chord colour.",
    kind: "rhythm",
    steps: 8,
    palette: [],
    chordOptions: ["Cmaj7", "Fmaj7", "G7", "Am7"],
  },
  {
    title: "A tiny duet",
    prompt:
      "Shape a four-note upper voice over the bass. Try a stepwise approach to an octave at the end. Compare a few endings.",
    kind: "duet",
    steps: 4,
    palette: [64, 65, 67, 69, 71, 72, 74, 76],
    bass: [60, 64, 62, 60],
  },
  {
    title: "Theme and answer",
    prompt:
      "Create a four-note theme in positions 1–4. Write an answer in 5–8, or use the fifth-up button and adjust its result.",
    kind: "melody",
    steps: 8,
    palette: Array.from({ length: 25 }, (_, i) => 60 + i),
  },
];
export type CreationDraft = {
  title: string;
  notes: number[];
  rhythm: number[][];
  chords: string[];
  tempo: number;
  savedId?: string;
};
export type SavedCreation = CreationDraft & { id: string; chapter: number; updatedAt: string };
export function freshCreation(chapter: number): CreationDraft {
  const t = CHAPTER_CREATIONS[chapter]!;
  return {
    title: t.title,
    notes: t.palette.length
      ? Array.from({ length: t.steps }, (_, i) => t.palette[i % Math.min(4, t.palette.length)]!)
      : [],
    rhythm:
      t.kind === "rhythm"
        ? [
            [0, 2, 4, 6],
            [2, 6],
          ]
        : [],
    chords: t.chordOptions
      ? Array.from({ length: t.kind === "rhythm" ? 1 : t.steps }, () => t.chordOptions![0]!)
      : [],
    tempo: 88,
  };
}
export function validCreation(chapter: number, value: unknown): value is CreationDraft {
  const t = CHAPTER_CREATIONS[chapter];
  if (!t || !value || typeof value !== "object") return false;
  const d = value as CreationDraft;
  return (
    typeof d.title === "string" &&
    d.title.length <= 80 &&
    Number.isInteger(d.tempo) &&
    d.tempo >= 40 &&
    d.tempo <= 160 &&
    (d.savedId === undefined ||
      (typeof d.savedId === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(d.savedId))) &&
    Array.isArray(d.notes) &&
    d.notes.length === (t.palette.length ? t.steps : 0) &&
    d.notes.every((n) => n === -1 || t.palette.includes(n)) &&
    Array.isArray(d.rhythm) &&
    d.rhythm.length === (t.kind === "rhythm" ? 2 : 0) &&
    d.rhythm.every(
      (row) =>
        Array.isArray(row) &&
        row.length <= t.steps &&
        new Set(row).size === row.length &&
        row.every((n) => Number.isInteger(n) && n >= 0 && n < t.steps),
    ) &&
    Array.isArray(d.chords) &&
    d.chords.length === (t.chordOptions ? (t.kind === "rhythm" ? 1 : t.steps) : 0) &&
    d.chords.every((id) => t.chordOptions!.includes(id))
  );
}
export function hasCreationSound(chapter: number, draft: CreationDraft): boolean {
  return CHAPTER_CREATIONS[chapter]?.kind === "rhythm"
    ? draft.rhythm.some((r) => r.length > 0)
    : draft.notes.some((n) => n >= 0) || draft.chords.length > 0;
}
export function creationPlan(
  chapter: number,
  draft: CreationDraft,
  part: "together" | "upper" | "bass" = "together",
): TeachingPlan {
  const t = CHAPTER_CREATIONS[chapter]!;
  const gap = (60 / draft.tempo) * (t.kind === "rhythm" ? 0.5 : 1);
  const events: TeachingEvent[] = [];
  if (t.kind === "rhythm") {
    draft.rhythm.forEach((row, r) =>
      row.forEach((i) =>
        events.push({ at: i * gap, duration: 0.13, notes: [r ? 76 : 55], volume: 0.7 }),
      ),
    );
    if (draft.chords[0])
      events.push({
        at: 0,
        duration: gap * t.steps - 0.03,
        notes: CREATION_CHORDS[draft.chords[0]]!,
        volume: 0.25,
      });
  } else
    for (let i = 0; i < t.steps; i++) {
      const notes: number[] = [];
      if (draft.notes[i] !== undefined && draft.notes[i]! >= 0 && part !== "bass")
        notes.push(draft.notes[i]!);
      if (t.bass && part !== "upper") notes.push(t.bass[i]!);
      if (draft.chords[i] && part !== "upper") notes.push(...CREATION_CHORDS[draft.chords[i]!]!);
      events.push({ at: i * gap, duration: gap * 0.9, notes, volume: 0.6 });
    }
  return {
    events,
    duration: t.steps * gap,
    steps: Array.from({ length: t.steps }, (_, i) => ({
      at: i * gap,
      duration: gap,
      label:
        t.kind === "rhythm"
          ? `${Math.floor(i / 2) + 1}${i % 2 ? " &" : ""}`
          : `${i + 1}. ${draft.chords[i] ?? (draft.notes[i] === -1 ? "Rest" : draft.notes[i] !== undefined ? noteName(draft.notes[i]!) : "")}`,
      notes: events.filter((e) => e.at === i * gap).flatMap((e) => e.notes),
    })),
  };
}
