import { activityForUnit } from "./activity-catalog.ts";
import type {
  ActivityProgress,
  ActivityTask,
  LessonActivity,
  RhythmTask,
  VoiceTask,
} from "./activities.ts";
import { KEYS, TONIC_MIDI, noteName, pitchClass } from "./music.ts";

export type PracticalReview = {
  round: number;
  progress: ActivityProgress;
  completedAt: string | null;
};
export type ConceptPractice = {
  attempts: number;
  independent: number;
  recent: boolean[];
  lastPractisedAt: string;
};
export function recordConcept(
  previous: ConceptPractice | undefined,
  independent: boolean,
  now = new Date(),
): ConceptPractice {
  return {
    attempts: (previous?.attempts ?? 0) + 1,
    independent: (previous?.independent ?? 0) + Number(independent),
    recent: [...(previous?.recent ?? []), independent].slice(-8),
    lastPractisedAt: now.toISOString(),
  };
}
export function conceptStatus(p?: ConceptPractice): string {
  if (!p?.attempts) return "Not practised yet";
  if (p.recent.filter(Boolean).length / p.recent.length < 0.8) return "Worth another practice";
  return p.recent.length < 3 ? "Building familiarity" : "Consistent recent practice";
}
const labels = (count: number) =>
  Array.from({ length: count }, (_, i) => `${Math.floor(i / 2) + 1}${i % 2 ? " &" : ""}`);

function rhythmReview(id: string, source: RhythmTask, round: number): RhythmTask {
  let cells = 8,
    stepBeats = 0.5,
    solution: number[][] = [[]],
    instruction = "",
    rows = ["Pattern"],
    pulse = false;
  if (id === "0-pulse") {
    cells = 3 + (round % 3);
    stepBeats = 1;
    solution = [Array.from({ length: cells }, (_, i) => i)];
    instruction = `Build ${cells} evenly spaced beats. Put an attack on every cell.`;
  } else if (id === "2-duration") {
    const patterns = [
      [0, 2, 4],
      [0, 4, 6],
      [0, 2, 3, 4, 6],
    ];
    solution = [patterns[round % 3]!];
    instruction = [
      "Build a quarter, a quarter, then a half note in 4/4.",
      "Build a half note, then two quarters in 4/4.",
      "Build a quarter, two eighths, then two quarters in 4/4.",
    ][round % 3]!;
  } else if (id === "2-dots") {
    solution = [round % 2 ? [0, 3, 4, 7] : [0, 1, 4, 5]];
    instruction =
      round % 2 === 0
        ? "Repeat an eighth followed by a dotted quarter, twice in 4/4."
        : "Repeat a dotted quarter followed by an eighth, twice in 4/4.";
  } else if (id === "2-syncopation") {
    const start = [1, 3, 5][round % 3]!;
    solution = [[start]];
    instruction = `Start on ${labels(8)[start]} and hold to the bar line. All earlier cells are rests; use just one attack.`;
  } else if (id === "8-polyrhythm") {
    const cycles = 2 - (round % 2);
    cells = 6 * cycles;
    stepBeats = 1 / 3;
    rows = round % 2 === 0 ? ["Two-part", "Three-part"] : ["Three-part", "Two-part"];
    solution = rows.map((row) =>
      Array.from({ length: cells }, (_, i) => i).filter(
        (i) => i % (row === "Two-part" ? 3 : 2) === 0,
      ),
    );
    instruction = `Build ${cycles} cycle${cycles === 1 ? "" : "s"} of 3:2. In each six cells, the three-part attacks every two cells and the two-part every three. Both begin together.`;
  } else {
    const groups =
      id === "2-meter" ? (round % 2 ? [2, 2, 2] : [3, 3]) : round % 2 ? [3, 2] : [3, 2, 2];
    cells = groups.reduce((a, b) => a + b);
    pulse = true;
    rows = ["Accents"];
    let start = 0;
    solution = [
      groups.map((n) => {
        const at = start;
        start += n;
        return at;
      }),
    ];
    instruction = `Group ${cells} subdivisions as ${groups.join(" + ")}. Accent the first cell in each group; the remaining cells stay quiet.`;
  }
  return {
    ...source,
    labels:
      stepBeats === 0.5 && !pulse
        ? labels(cells)
        : Array.from({ length: cells }, (_, i) => String(i + 1)),
    title: "A fresh rhythm",
    instruction,
    hint: instruction,
    explanation: `The attacks match. ${instruction}`,
    rows,
    stepBeats,
    subdivisionPulse: pulse,
    solution,
    initial: rows.map(() => []),
  };
}

/* ------------------------------------------------------------------ *
 * Generated practical review (Phase 2).
 *
 * Chord and voice tasks no longer ride the fixed 4-step transposition
 * cycle. Each round draws a fresh root/tonic for the source task from
 * the keys the course has taught and rebuilds the task's instruction,
 * solution and explanation around that root, the way rhythmReview
 * already builds fresh rhythm patterns. The draw is a pure function of
 * (unit, round, source task) seeded from the persisted round, so a
 * round survives refresh exactly as before and nothing new is stored.
 * A source task never draws the same root twice on consecutive visits.
 * Early exact-spelling tasks keep the audit-verified constraint —
 * octaves only, so their named spellings stay valid — with the octave
 * placement drawn the same seeded way.
 * ------------------------------------------------------------------ */

// FNV-1a + mulberry32: the same algorithm family as the rng helpers on
// the generated-recall branch; kept local so this branch stands alone.
function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The taught keys generation may draw from: the pool the app's own
 * verified generators already use — major keys with at most four
 * accidentals (keySignatureExercise's default cap; scaleExercise's cap
 * above grade 3). Db, F# and B majors are never drawn.
 */
const TAUGHT_KEYS = KEYS.filter((k) => k.isMajor && k.accidentals <= 4);
const TAUGHT_PCS = TAUGHT_KEYS.map((k) => pitchClass(TONIC_MIDI[k.tonic] ?? 60));

/** Seeded draw in [0, count); a source task's draw never repeats its previous visit's (`step` rounds earlier). */
function drawnIndex(
  unitId: string,
  round: number,
  sourceIndex: number,
  step: number,
  count: number,
): number {
  const raw = Math.floor(mulberry32(hashSeed(`${unitId}:${round}:${sourceIndex}`))() * count);
  if (count <= 1 || round < step) return raw;
  const previous = drawnIndex(unitId, round - step, sourceIndex, step, count);
  return raw === previous ? (raw + 1) % count : raw;
}

const CHORD_TEMPLATES: { suffix: string; intervals: number[] }[] = [
  { suffix: "", intervals: [0, 4, 7] },
  { suffix: "m", intervals: [0, 3, 7] },
  { suffix: "dim", intervals: [0, 3, 6] },
  { suffix: "aug", intervals: [0, 4, 8] },
  { suffix: "7", intervals: [0, 4, 7, 10] },
  { suffix: "maj7", intervals: [0, 4, 7, 11] },
  { suffix: "m7", intervals: [0, 3, 7, 10] },
  { suffix: "m7b5", intervals: [0, 3, 6, 10] },
  { suffix: "dim7", intervals: [0, 3, 6, 9] },
  { suffix: "maj9", intervals: [0, 2, 4, 7, 11] },
  { suffix: "9", intervals: [0, 2, 4, 7, 10] },
  { suffix: "m9", intervals: [0, 2, 3, 7, 10] },
  { suffix: "maj11", intervals: [0, 2, 4, 5, 7, 11] },
  { suffix: "13", intervals: [0, 2, 4, 7, 9, 10] },
  { suffix: "maj13", intervals: [0, 2, 4, 5, 7, 9, 11] },
  { suffix: "m11", intervals: [0, 2, 3, 5, 7, 10] },
];

/**
 * Identify a chord's root and quality from its notes by matching the
 * pitch-class set against stacked-thirds templates, lowest candidate
 * first (so root position wins, and an inversion resolves to its root).
 */
function chordRoot(
  notes: number[],
): { rootMidi: number; rootPc: number; suffix: string } | undefined {
  const pcs = [...new Set(notes.map(pitchClass))].sort((a, b) => a - b);
  for (const candidate of [...new Set(notes)].sort((a, b) => a - b)) {
    const rootPc = pitchClass(candidate);
    const rel = pcs.map((p) => pitchClass(p - rootPc)).sort((a, b) => a - b);
    const match = CHORD_TEMPLATES.find(
      (t) => t.intervals.length === rel.length && t.intervals.every((v, i) => v === rel[i]),
    );
    if (match) return { rootMidi: candidate, rootPc, suffix: match.suffix };
  }
  return undefined;
}

const LETTERS: string[] = ["C", "D", "E", "F", "G", "A", "B"];
const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const MAJOR_OFFSETS = [0, 2, 4, 5, 7, 9, 11];
const NATURAL_MINOR_OFFSETS = [0, 2, 3, 5, 7, 8, 10];
const DORIAN_OFFSETS = [0, 2, 3, 5, 7, 9, 10];

/** Spell `midi` as a degree of the scale on `tonicLetter`/`tonicPc`; undefined when it is not a scale note. */
function spellInScale(
  midi: number,
  tonicLetter: string,
  tonicPc: number,
  offsets: readonly number[],
): string | undefined {
  const degree = offsets.indexOf(pitchClass(midi - tonicPc));
  if (degree < 0) return undefined;
  const letter = LETTERS[(LETTERS.indexOf(tonicLetter) + degree) % 7]!;
  const octave = Math.round((midi - LETTER_PC[letter]!) / 12) - 1;
  const accidental = midi - ((octave + 1) * 12 + LETTER_PC[letter]!);
  if (accidental < -1 || accidental > 1) return undefined;
  return `${letter}${accidental === 1 ? "#" : accidental === -1 ? "b" : ""}${octave}`;
}

type TaughtKey = (typeof KEYS)[number];
const keyLetter = (key: TaughtKey) => key.tonic.replace(/[^A-G]/g, "");
const keyPc = (key: TaughtKey) => pitchClass(TONIC_MIDI[key.tonic] ?? 60);

/**
 * Best spelling for `midi` in a drawn key: its major scale first, then
 * its parallel natural minor (where borrowed chords live), then the
 * app's sharp default. Flat keys therefore name Eb as Eb, never D#.
 */
function spellInKey(midi: number, key: TaughtKey): string {
  return (
    spellInScale(midi, keyLetter(key), keyPc(key), MAJOR_OFFSETS) ??
    spellInScale(midi, keyLetter(key), keyPc(key), NATURAL_MINOR_OFFSETS) ??
    noteName(midi)
  );
}

function spellDorian(midi: number, key: TaughtKey): string {
  return spellInScale(midi, keyLetter(key), keyPc(key), DORIAN_OFFSETS) ?? noteName(midi);
}

/** Deterministic rounds survive refresh; generation never changes a task's harmonic rules. */
export function reviewActivity(unitId: string, round: number): LessonActivity | undefined {
  const original = activityForUnit(unitId);
  if (!original) return;
  const sourceIndex = round % original.tasks.length;
  const source = original.tasks[sourceIndex]!;
  // Early exact tasks name a key or interval spelling. Move octaves only so
  // the named concept and its authored accidentals remain valid.
  const earlyExact =
    source.kind === "voice" && source.rule === "exact" && Number(unitId.split("-")[0]) < 5;

  // This round's transposition. Listening and harmony-listening keep the
  // established cycle and rhythm ignores it (rhythmReview generates its
  // own patterns). Chord and voice tasks draw a root from the taught
  // keys; early exact tasks draw an octave placement instead.
  let shift = [2, 5, -2, 7][round % 4]!;
  let drawnKey: TaughtKey | undefined;
  if (earlyExact) {
    const OCTAVE_SHIFTS = [0, 12, -12, 24];
    shift =
      OCTAVE_SHIFTS[
        drawnIndex(unitId, round, sourceIndex, original.tasks.length, OCTAVE_SHIFTS.length)
      ]!;
  } else if (source.kind === "chord" || source.kind === "voice") {
    const anchorPc =
      source.kind === "chord"
        ? (chordRoot(source.solution[0]!)?.rootPc ?? pitchClass(source.solution[0]![0]!))
        : pitchClass(source.tonic ?? source.bass[0]!);
    const drawn = drawnIndex(unitId, round, sourceIndex, original.tasks.length, TAUGHT_KEYS.length);
    drawnKey = TAUGHT_KEYS[drawn]!;
    const drawnPc = TAUGHT_PCS[drawn]!;
    // Land the anchor on the drawn pitch class, staying within a tritone
    // of the authored register — the same band the old cycle used.
    shift = (((drawnPc - anchorPc + 6) % 12) + 12) % 12 - 6;
  }
  const spelled = (midi: number) => {
    const choice =
      source.kind === "voice" ? source.choices.find((c) => c.midi + shift === midi) : undefined;
    return earlyExact && choice
      ? choice.label.replace(/-?\d+$/, String(Math.floor(midi / 12) - 1))
      : noteName(midi);
  };
  // Choice labels for generated tasks spell inside the drawn key.
  // Late exact tasks keep the sharp default (their content is pitch
  // patterns, where the app spells chromatically).
  const keyLabels =
    drawnKey !== undefined &&
    (source.kind === "chord" || (source.kind === "voice" && source.rule !== "exact"));
  const labelFor = (midi: number) =>
    earlyExact ? spelled(midi) : keyLabels ? spellInKey(midi, drawnKey!) : noteName(midi);
  let task: ActivityTask;
  if (source.kind === "harmony-listening") {
    const move = (notes: number[]) => notes.map((n) => n + shift);
    task = {
      ...source,
      clips: source.clips.map((clip) => ({
        ...clip,
        chords: clip.chords.map(move),
      })),
      explanation: source.explanation,
      writtenClue: source.writtenClue,
    };
  } else if (source.kind === "listening") {
    const sounds = source.sounds.map((s) => ({ ...s, midi: s.midi + shift }));
    const answer = source.options[source.solution[0]![0]!]!;
    const clue =
      source.skill === "pitch"
        ? `The second sound is ${answer.toLowerCase()}. First: ${noteName(sounds[0]!.midi)}; second: ${noteName(sounds[1]!.midi)}.`
        : source.skill === "dynamics"
          ? `The second sound is ${answer.toLowerCase()}; both notes have the same pitch.`
          : `The mystery sound matches ${answer}.`;
    task = {
      ...source,
      sounds,
      explanation: clue,
      writtenClue: clue,
      references: source.references?.map((r) => ({
        ...r,
        sound: { ...r.sound, midi: r.sound.midi + shift },
      })),
    };
  } else if (source.kind === "rhythm") task = rhythmReview(unitId, source, round);
  else {
    const move = (notes: number[]) => notes.map((n) => n + shift);
    const base = {
      ...source,
      choices: source.choices.map((c) => ({
        midi: c.midi + shift,
        label: labelFor(c.midi + shift),
      })),
      solution: source.solution.map(move),
      initial: source.initial.map(move),
    };
    if (source.kind === "chord") {
      const root = chordRoot(source.solution[0]!);
      const newRootMidi = (root?.rootMidi ?? source.solution[0]![0]!) + shift;
      const rootLabel = drawnKey ? spellInKey(newRootMidi, drawnKey) : noteName(newRootMidi);
      const chordName = root && drawnKey ? `${drawnKey.tonic}${root.suffix}` : undefined;
      // The reference voicing is spelled the way the authored task spelled
      // it (its palette labels), so a Neapolitan still reads Db, not C#.
      const reference = source
        .solution[0]!.map(
          (n) => source.choices.find((c) => c.midi === n)?.label ?? noteName(n),
        )
        .join(" · ");
      const moved = base.solution[0]!.map((n) => labelFor(n)).join(" · ");
      task = {
        ...base,
        kind: "chord",
        context: source.context?.map(move),
        title: chordName ? `Transfer to ${chordName}: ${source.title}` : `Transfer: ${source.title}`,
        instruction: chordName
          ? `Reference voicing, low to high: ${reference}. Rebuild it as ${chordName} — root on ${rootLabel}, with the same bass position and spacing.${source.context ? " The accompaniment has moved with it." : ""}`
          : `Reference voicing, low to high: ${reference}. Rebuild it with the same chord quality and bass position, starting from ${rootLabel}.${source.context ? " The accompaniment has moved with it." : ""}`,
        hint: `Move every note by the same number of semitones; preserve the distances between notes. The root is now ${rootLabel}.`,
        explanation: `The same voicing on ${rootLabel}${chordName ? ` (${chordName})` : ""}: ${moved}.`,
      };
    } else {
      const tonic = (source.tonic ?? (source.rule === "dorian" ? 62 : 60)) + shift;
      const name = (midi: number) => (drawnKey ? spellInKey(midi, drawnKey) : noteName(midi));
      const directions: Record<VoiceTask["rule"], string> = {
        consonant:
          "Choose consonances above the bass. Repair moving parallel fifths or octaves and avoid similar motion into a perfect interval.",
        contrary:
          "Make the upper voice move opposite to the bass at every change, using consonances.",
        cadence: "Close with contrary steps into an octave above the final bass.",
        passing:
          "Connect two consonances with a weak dissonance, approached and left by step in the same direction.",
        suspension:
          "Prepare a consonance, hold it as a fourth over the changing bass, then resolve down by step to a third.",
        chordTones: "Choose a melody note belonging to each chord shown below it.",
        line: `Begin and end on ${name(tonic)}. Use one unique highest note. Keep leaps within a fifth and recover each leap by step in the opposite direction.`,
        dorian: `Include ${drawnKey ? spellDorian(tonic + 3, drawnKey) : noteName(tonic + 3)} and ${drawnKey ? spellDorian(tonic + 9, drawnKey) : noteName(tonic + 9)}, and finish on ${drawnKey ? spellDorian(tonic, drawnKey) : noteName(tonic)} to show the Dorian colour.`,
        exact:
          unitId === "10-development"
            ? `Invert the reference around ${name(tonic)}: turn each upward distance into the same downward distance.`
            : Number(unitId.split("-")[0]) < 5
              ? `Rebuild these pitches in order: ${base.solution[0]!.map(spelled).join(" · ")}. Compare the spacing with the original.`
              : "Transpose the reference up a perfect fifth (seven semitones).",
      };
      // Position labels that name notes are regenerated from the moved
      // bass: the melody task's labels name its chords, the development
      // task names the reference's first note, and the fugue task names
      // each subject note (its "+ 7" answer offset is shift-invariant).
      const positions = source.positions.map((label, i) => {
        if (source.rule === "chordTones" && source.chords?.[i] && drawnKey) {
          const moved = chordRoot(source.chords[i]!.map((n) => n + shift));
          if (moved)
            return `${spellInKey(moved.rootMidi, drawnKey).replace(/-?\d+$/, "")}${moved.suffix}`;
        }
        if (source.bass[i] === undefined) return label;
        if (/^Start on [A-G][#b]?-?\d+$/.test(label))
          return `Start on ${name(source.bass[i]! + shift)}`;
        const cell = /^[A-G][#b]?-?\d+( \+ \d+)$/.exec(label);
        if (cell) return `${noteName(source.bass[i]! + shift)}${cell[1]}`;
        return label;
      });
      task = {
        ...base,
        kind: "voice",
        rule: source.rule,
        bass: move(source.bass),
        positions,
        chords: source.chords?.map(move),
        tonic,
        title: `Fresh phrase: ${source.title}`,
        instruction: directions[source.rule],
        hint: directions[source.rule],
        explanation: `This phrase satisfies the task. ${directions[source.rule]}`,
      };
    }
  }
  task = { ...task, id: `review-${round}`, initial: task.initial.map((r) => [...r]) };
  return { title: "Practical recall · a fresh example", tasks: [task] };
}
