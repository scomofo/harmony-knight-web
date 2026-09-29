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
    title: "Remix Lantern Call",
    prompt:
      "Start from the idea of Lantern Call: C–D–E–C. Keep the contour, change one note, or invent a reply. Hear how much can change while the four-note shape still feels related.",
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
    title: "Give Lantern Call a home",
    prompt:
      "Use Lantern Call or invent a nearby four-note idea inside C major, then extend it to eight notes. Try ending on C, then somewhere else. Which version makes C feel most like home?",
    kind: "melody",
    steps: 8,
    palette: scale,
  },
  {
    title: "Rebuild Homeward Loop",
    prompt:
      "Start with Homeward Loop: C–Am–F–G. Then replace one chord and listen to what the change does. Keep the roots, change a quality, or make the route your own.",
    kind: "chords",
    steps: 4,
    palette: [],
    chordOptions: ["C", "Cm", "F", "G", "Am", "Dm"],
  },
  {
    title: "Change Homeward Loop’s ending",
    prompt:
      "Use Homeward Loop as your starting point. Give it a strong G–C arrival, a softer F–C close, or let G surprise the ear by moving to Am. Put a melody above the version you prefer.",
    kind: "melody",
    steps: 8,
    palette: scale,
    chordOptions: ["C", "F", "G", "Am", "Dm"],
  },
  {
    title: "Write your own Crossing Lines",
    prompt:
      "Build on the idea of Crossing Lines: let one voice rise while the other falls, then let them trade roles. Hear the upper line alone, the bass alone, and both together.",
    kind: "duet",
    steps: 4,
    palette: [64, 65, 67, 69, 71, 72, 74, 76],
    bass: [60, 62, 64, 60],
  },
  {
    title: "Send Homeward Loop somewhere new",
    prompt:
      "Begin with the world of Homeward Loop in C, then make G feel like the new home. D major can introduce F# and point toward G. Listen for the moment the familiar loop starts living somewhere else.",
    kind: "chords",
    steps: 4,
    palette: [],
    chordOptions: ["C", "Dm", "F", "G", "Am", "D", "Em"],
  },
  {
    title: "Recolour Homeward Loop",
    prompt:
      "Keep a groove steady while you cycle through richer versions of familiar harmony: Cmaj7, Am7, Fmaj7 and G7. Change the chord colour without losing the underlying pulse.",
    kind: "rhythm",
    steps: 8,
    palette: [],
    chordOptions: ["Cmaj7", "Fmaj7", "G7", "Am7"],
  },
  {
    title: "Finish Crossing Lines",
    prompt:
      "Treat both parts as melodies. Shape the upper voice so it answers the bass, then try a contrary stepwise approach into the final octave—the closing gesture from Crossing Lines.",
    kind: "duet",
    steps: 4,
    palette: [64, 65, 67, 69, 71, 72, 74, 76],
    bass: [60, 64, 62, 60],
  },
  {
    title: "Transform Lantern Call",
    prompt:
      "Use Lantern Call (C–D–E–C) or invent a four-note cousin in positions 1–4. Answer it in 5–8, then experiment with moving, reversing or reshaping the idea while keeping it recognizable.",
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
