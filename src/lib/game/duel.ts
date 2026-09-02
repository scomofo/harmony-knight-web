import {
  classifyInterval,
  intervalName,
  type IntervalQuality,
} from "./music";

export type DuelNote = { midi: number; isGhost?: boolean };

export type CounterpointViolation =
  | "parallelFifths"
  | "parallelOctaves"
  | "hiddenFifthsOrOctaves"
  | "voiceCrossing";

export type DuelMoveResult = {
  quality: IntervalQuality;
  violations: CounterpointViolation[];
  isValid: boolean;
};

export type GhostResolution = {
  suggestedNote: DuelNote;
  reason: string;
};

export type TurnResult = {
  cantusNote: DuelNote;
  userNote: DuelNote;
  quality: IntervalQuality;
  wasDissonanceResolved: boolean;
};

const C_MAJOR = [60, 62, 64, 65, 67, 69, 71, 72];
const A_MINOR = [57, 59, 60, 62, 64, 65, 67, 69];

function randInt(max: number) {
  return Math.floor(Math.random() * max);
}

export function generateCantusFirmus(
  gradeLevel = 0,
  opts?: { firstDuel?: boolean },
): DuelNote[] {
  // First meeting: the same C–E–G they already know from practice.
  if (opts?.firstDuel || gradeLevel === 0) {
    if (opts?.firstDuel) {
      return [60, 64, 67, 60].map((midi) => ({ midi }));
    }
    const notes: DuelNote[] = [{ midi: 60 }];
    let idx = 0;
    for (let i = 1; i < 3; i++) {
      const step = Math.random() < 0.5 ? -1 : 1;
      idx = Math.max(0, Math.min(4, idx + step));
      notes.push({ midi: C_MAJOR[idx]! });
    }
    notes.push({ midi: 60 });
    return notes;
  }

  const length =
    gradeLevel <= 2 ? 4 + randInt(3) : gradeLevel <= 5 ? 6 + randInt(3) : 8 + randInt(5);
  const scale =
    gradeLevel <= 2
      ? C_MAJOR
      : gradeLevel <= 5
        ? Math.random() < 0.5
          ? C_MAJOR
          : A_MINOR
        : Array.from({ length: 13 }, (_, i) => 60 + i);

  const notes: DuelNote[] = [];
  let idx = 0;
  notes.push({ midi: scale[0]! });
  for (let i = 1; i < length - 1; i++) {
    const maxStep = gradeLevel < 3 ? 2 : 3;
    let step = randInt(maxStep * 2 + 1) - maxStep;
    if (step === 0) step = Math.random() < 0.5 ? -1 : 1;
    idx = Math.max(0, Math.min(scale.length - 1, idx + step));
    notes.push({ midi: scale[idx]! });
  }
  notes.push({ midi: scale[0]! });
  return notes;
}

export function validateMove(args: {
  cantusNote: DuelNote;
  userNote: DuelNote;
  previousCantusNote?: DuelNote | null;
  previousUserNote?: DuelNote | null;
}): DuelMoveResult {
  const { cantusNote, userNote, previousCantusNote, previousUserNote } = args;
  const quality = classifyInterval(userNote.midi - cantusNote.midi);
  const violations: CounterpointViolation[] = [];

  if (previousCantusNote && previousUserNote) {
    const prevInterval = Math.abs(previousUserNote.midi - previousCantusNote.midi) % 12;
    const currInterval = Math.abs(userNote.midi - cantusNote.midi) % 12;
    if ((prevInterval === 7 && currInterval === 7) || (prevInterval === 0 && currInterval === 0)) {
      violations.push(currInterval === 7 ? "parallelFifths" : "parallelOctaves");
    }
    const cantusDir = cantusNote.midi - previousCantusNote.midi;
    const userDir = userNote.midi - previousUserNote.midi;
    if (
      Math.sign(cantusDir) === Math.sign(userDir) &&
      Math.sign(cantusDir) !== 0 &&
      (currInterval === 7 || currInterval === 0) &&
      prevInterval !== currInterval
    ) {
      violations.push("hiddenFifthsOrOctaves");
    }
  }

  if (userNote.midi < cantusNote.midi) violations.push("voiceCrossing");

  return {
    quality,
    violations,
    isValid: violations.length === 0 && quality !== "dissonance",
  };
}

export function safePitches(args: {
  cantusNote: DuelNote;
  previousCantusNote?: DuelNote | null;
  previousUserNote?: DuelNote | null;
  fromMidi: number;
  toMidi: number;
}): number[] {
  const out: number[] = [];
  for (let midi = args.fromMidi; midi <= args.toMidi; midi++) {
    const result = validateMove({
      cantusNote: args.cantusNote,
      userNote: { midi },
      previousCantusNote: args.previousCantusNote,
      previousUserNote: args.previousUserNote,
    });
    if (result.isValid) out.push(midi);
  }
  return out;
}

export function suggestGhostResolution(args: {
  cantusNote: DuelNote;
  previousCantusNote?: DuelNote | null;
  previousUserNote?: DuelNote | null;
}): GhostResolution | null {
  const preferred = [4, 3, 9, 8, 7, 12];
  const diatonic = new Set([0, 2, 4, 5, 7, 9, 11]);
  const tryCandidate = (interval: number) => {
    const candidate: DuelNote = { midi: args.cantusNote.midi + interval, isGhost: true };
    const result = validateMove({
      cantusNote: args.cantusNote,
      userNote: candidate,
      previousCantusNote: args.previousCantusNote,
      previousUserNote: args.previousUserNote,
    });
    if (!result.isValid) return null;
    const name = intervalName(interval).toLowerCase();
    const reason =
      interval === 3 || interval === 4
        ? `Try skipping one white key — ${name}s blend.`
        : interval === 7 || interval === 12
          ? `A ${name} above is solid and open.`
          : `A ${name} above also blends.`;
    return { suggestedNote: candidate, reason };
  };

  for (const interval of preferred) {
    const midi = args.cantusNote.midi + interval;
    if (!diatonic.has(((midi % 12) + 12) % 12)) continue;
    const hit = tryCandidate(interval);
    if (hit) return hit;
  }
  for (const interval of preferred) {
    const hit = tryCandidate(interval);
    if (hit) return hit;
  }
  return null;
}

export function harmonyMeterDelta(
  result: DuelMoveResult,
  dissonanceResolved = false,
): number {
  if (dissonanceResolved) return 0.18;
  if (result.quality === "perfectConsonance") return 0.1;
  if (result.quality === "imperfectConsonance") return 0.14;
  return -0.04;
}

export function plainMoveMessage(semitones: number, quality: IntervalQuality): string {
  const abs = Math.abs(semitones);
  if (abs === 3 || abs === 4) return "A third — that blends.";
  if (abs === 8 || abs === 9) return "A sixth — that blends.";
  if (abs === 7) return "A fifth — solid and open.";
  if (abs === 12) return "An octave — solid.";
  if (abs === 5) return "A fourth — stable.";
  if (abs === 0) return "Unison — same pitch.";
  return `${intervalName(abs)} · ${quality === "imperfectConsonance" ? "blends" : "stable"}`;
}

export function violationLabel(v: CounterpointViolation): string {
  switch (v) {
    case "parallelFifths":
      return "Two fifths in a row — pick a closer interval.";
    case "parallelOctaves":
      return "Two octaves in a row — pick a closer interval.";
    case "hiddenFifthsOrOctaves":
      return "Both voices leapt to a fifth or octave. Try a step instead.";
    case "voiceCrossing":
      return "Too low — stay to the right of their note.";
  }
}
