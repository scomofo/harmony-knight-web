import { it } from "node:test";
import assert from "node:assert/strict";
import { LESSON_ACTIVITIES, activityForUnit } from "./activity-catalog.ts";
import { evaluateActivity } from "./activities.ts";
import { reviewActivity, conceptStatus } from "./practical-review.ts";
import { KEYS, TONIC_MIDI, noteName, pitchClass } from "./music.ts";
import { useGameStore } from "./store.ts";
import { unitById } from "./course.ts";
import { freshUnitProgress, servedChecks } from "./learning.ts";

it("authors valid fresh practical reviews for every interactive concept and keeps rounds stable", () => {
  for (const id of Object.keys(LESSON_ACTIVITIES))
    for (let round = 0; round < 8; round++) {
      const activity = reviewActivity(id, round)!;
      const task = activity.tasks[0]!;
      assert.equal(evaluateActivity(task, task.solution).correct, true, `${id}/${round}`);
      assert.deepEqual(reviewActivity(id, round), activity);
      assert.notDeepEqual(reviewActivity(id, round + 1), activity, `${id}: fresh next round`);
    }
});
it("keeps practical review evidence separate, resumes partial work, and never earns repeat XP", () => {
  useGameStore.getState().resetProgress();
  const id = "4-triads",
    s = useGameStore.getState();
  useGameStore.setState({
    unitProgress: {
      [id]: {
        ...freshUnitProgress(),
        step: 4,
        completedAt: "2026-01-01T00:00:00Z",
        nextReviewAt: "2026-01-02T00:00:00Z",
        intervalDays: 3,
      },
    },
  });
  s.revisitUnit(id, true);
  assert.equal(useGameStore.getState().unitProgress[id]!.step, 1);
  const a = reviewActivity(id, 0)!;
  s.updateLearningActivity(id, { type: "check" });
  s.revisitUnit(id, true);
  assert.equal(useGameStore.getState().practicalReviews[id]!.round, 0);
  s.updateLearningActivity(id, { type: "edit", draft: a.tasks[0]!.solution });
  s.updateLearningActivity(id, { type: "check" });
  assert.equal(useGameStore.getState().conceptPractice[id]!.attempts, 1);
  assert.equal(
    conceptStatus(useGameStore.getState().conceptPractice[id]),
    "Worth another practice",
  );
  s.advanceLearningUnit(id);
  for (const q of servedChecks(unitById(id)!, useGameStore.getState().unitProgress[id]!)) {
    s.answerLearningUnit(id, q.answer);
    s.advanceLearningUnit(id);
  }
  assert.equal(
    useGameStore.getState().unitProgress[id]!.intervalDays,
    1,
    "a corrected practical review stays due soon",
  );
  assert.equal(useGameStore.getState().harmonyPoints, 0);
  assert.deepEqual(
    useGameStore.getState().activityProgress,
    {},
    "original activities are untouched",
  );
  assert.ok(useGameStore.getState().practicalReviews[id]!.completedAt);
  s.revisitUnit(id, true);
  assert.equal(useGameStore.getState().practicalReviews[id]!.round, 1);
});

it("provides a valid bounded activity for every course unit", async () => {
  const { COURSE_UNITS } = await import("./course.ts");
  for (const unit of COURSE_UNITS) {
    const activity = activityForUnit(unit.id);
    assert.ok(activity, unit.id);
    for (const task of activity.tasks)
      assert.ok(evaluateActivity(task, task.solution).correct, unit.id);
  }
});
it("requires both intervals and triads without removing study access", () => {
  useGameStore.getState().resetProgress();
  useGameStore.setState({ gradeLevel: 4 });
  const answer = (topicId: string) =>
    useGameStore
      .getState()
      .recordPractice({ midi: 60, correct: true, responseMs: 500, topicId, trackHeat: false });
  for (let i = 0; i < 20; i++) answer("intervals");
  assert.equal(useGameStore.getState().gradeLevel, 4);
  for (let i = 0; i < 3; i++) answer("triads");
  assert.equal(useGameStore.getState().gradeLevel, 5);
});

it("keeps named keys and minor-third spelling intact in early recall rounds", () => {
  for (let round = 0; round < 8; round++) {
    const interval = reviewActivity("4-intervals", round)!.tasks[0]!;
    assert.equal(interval.kind, "voice");
    if (interval.kind !== "voice") throw new Error("voice expected");
    assert.match(interval.instruction, /C-?\d · Eb-?\d/);
    assert.equal(interval.solution[0]![1]! - interval.solution[0]![0]!, 3);
    const major = reviewActivity("3-major", round)!.tasks[0]!;
    assert.match(major.title, /C major/);
    assert.equal(major.solution[0]![0]! % 12, 0);
  }
});

/* ------------------------------------------------------------------ *
 * Phase 2 property tests: generated practical review.
 * Everything below recomputes its expectations from the served task
 * and the verified core data (music.ts), never from generator
 * internals — the same discipline as the Phase 1 recall tests.
 * ------------------------------------------------------------------ */

const TAUGHT_KEYS = KEYS.filter((k) => k.isMajor && k.accidentals <= 4);
const TAUGHT_PCS = new Set(TAUGHT_KEYS.map((k) => pitchClass(TONIC_MIDI[k.tonic]!)));
const keyForPc = (pc: number) => TAUGHT_KEYS.find((k) => pitchClass(TONIC_MIDI[k.tonic]!) === pc);

const ROOT_TEMPLATES: [string, number[]][] = [
  ["", [0, 4, 7]],
  ["m", [0, 3, 7]],
  ["dim", [0, 3, 6]],
  ["aug", [0, 4, 8]],
  ["7", [0, 4, 7, 10]],
  ["maj7", [0, 4, 7, 11]],
  ["m7", [0, 3, 7, 10]],
  ["m7b5", [0, 3, 6, 10]],
  ["dim7", [0, 3, 6, 9]],
  ["maj9", [0, 2, 4, 7, 11]],
  ["9", [0, 2, 4, 7, 10]],
  ["m9", [0, 2, 3, 7, 10]],
];
function rootOf(notes: number[]) {
  const pcs = [...new Set(notes.map(pitchClass))].sort((a, b) => a - b);
  for (const candidate of [...new Set(notes)].sort((a, b) => a - b)) {
    const rootPc = pitchClass(candidate);
    const rel = pcs.map((p) => pitchClass(p - rootPc)).sort((a, b) => a - b);
    const match = ROOT_TEMPLATES.find(
      ([, iv]) => iv.length === rel.length && iv.every((v, i) => v === rel[i]),
    );
    if (match) return { rootMidi: candidate, rootPc, suffix: match[0] };
  }
  return undefined;
}

const SPELL_LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const SPELL_LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const DORIAN_SCALE = [0, 2, 3, 5, 7, 9, 10];
/** Independent speller: name `midi` as a degree of the scale on the named tonic. */
function spell(midi: number, tonicName: string, offsets: number[]): string | undefined {
  const tonicPc = pitchClass(TONIC_MIDI[tonicName]!);
  const degree = offsets.indexOf(pitchClass(midi - tonicPc));
  if (degree < 0) return undefined;
  const letter = SPELL_LETTERS[(SPELL_LETTERS.indexOf(tonicName[0]!) + degree) % 7]!;
  const octave = Math.round((midi - SPELL_LETTER_PC[letter]!) / 12) - 1;
  const accidental = midi - ((octave + 1) * 12 + SPELL_LETTER_PC[letter]!);
  if (accidental < -1 || accidental > 1) return undefined;
  return `${letter}${accidental === 1 ? "#" : accidental === -1 ? "b" : ""}${octave}`;
}

const levelOf = (id: string) => Number(id.split("-")[0]);

it("generates valid, deterministic reviews on taught roots across rounds 0-23", () => {
  for (const id of Object.keys(LESSON_ACTIVITIES)) {
    const len = activityForUnit(id)!.tasks.length;
    for (let round = 0; round < 24; round++) {
      const activity = reviewActivity(id, round)!;
      const task = activity.tasks[0]!;
      assert.equal(evaluateActivity(task, task.solution).correct, true, `${id}/${round} solution`);
      assert.deepEqual(reviewActivity(id, round), activity, `${id}/${round} deterministic`);
      assert.notDeepEqual(reviewActivity(id, round + 1), activity, `${id}/${round} fresh next`);
      const source = activityForUnit(id)!.tasks[round % len]!;
      const earlyExact =
        source.kind === "voice" && source.rule === "exact" && levelOf(id) < 5;
      if (task.kind === "chord") {
        const root = rootOf(task.solution[0]!);
        assert.ok(root, `${id}/${round}: chord root identified`);
        assert.ok(
          TAUGHT_PCS.has(root!.rootPc),
          `${id}/${round}: root pc ${root!.rootPc} is a taught key`,
        );
        const next = reviewActivity(id, round + len)!.tasks[0]!;
        if (next.kind === "chord")
          assert.notEqual(
            rootOf(next.solution[0]!)?.rootPc,
            root!.rootPc,
            `${id}/${round}: root rotates between visits`,
          );
      }
      if (task.kind === "voice" && !earlyExact) {
        assert.ok(
          TAUGHT_PCS.has(pitchClass(task.bass[0]!)),
          `${id}/${round}: bass starts on a taught key`,
        );
        const next = reviewActivity(id, round + len)!.tasks[0]!;
        if (next.kind === "voice")
          assert.notEqual(
            pitchClass(next.bass[0]!),
            pitchClass(task.bass[0]!),
            `${id}/${round}: tonic rotates between visits`,
          );
      }
    }
  }
});

it("breaks the old four-step cycle: single-task units serve many distinct roots", () => {
  const chordRoots = new Set<number>();
  for (let round = 0; round < 18; round++) {
    const task = reviewActivity("5-open-endings", round)!.tasks[0]!;
    if (task.kind === "chord") chordRoots.add(rootOf(task.solution[0]!)!.rootPc);
  }
  assert.ok(chordRoots.size >= 6, `5-open-endings served ${chordRoots.size} distinct roots`);
  const lineTonics = new Set<number>();
  for (let round = 0; round < 18; round++) {
    const task = reviewActivity("9-line", round)!.tasks[0]!;
    if (task.kind === "voice") lineTonics.add(task.tonic!);
  }
  assert.ok(lineTonics.size >= 6, `9-line served ${lineTonics.size} distinct tonics`);
  const dorianTonics = new Set<number>();
  for (let round = 0; round < 18; round++) {
    const task = reviewActivity("10-modes", round)!.tasks[0]!;
    if (task.kind === "voice") dorianTonics.add(task.tonic!);
  }
  assert.ok(dorianTonics.size >= 6, `10-modes served ${dorianTonics.size} distinct tonics`);
});

it("rejects wrong answers to generated tasks", () => {
  for (const id of ["4-triads", "5-function", "7-secondary", "8-sevenths"])
    for (let round = 0; round < 12; round++) {
      const task = reviewActivity(id, round)!.tasks[0]!;
      if (task.kind !== "chord") continue;
      const solution = task.solution[0]!;
      const outsider = task.choices.find((c) => !solution.includes(c.midi));
      assert.ok(outsider, `${id}/${round}: a palette note outside the chord exists`);
      const wrong = [...solution.slice(0, -1), outsider!.midi];
      assert.equal(evaluateActivity(task, [wrong]).correct, false, `${id}/${round} wrong chord`);
    }
  for (const id of [
    "5-melody",
    "6-parallels",
    "9-line",
    "10-modes",
    "10-post-tonal",
    "10-fugue",
    "10-development",
  ])
    for (let round = 0; round < 8; round++) {
      const task = reviewActivity(id, round)!.tasks[0]!;
      assert.equal(
        evaluateActivity(task, task.initial).correct,
        false,
        `${id}/${round}: the starting draft is not a solution`,
      );
    }
});

it("spells generated tonics, roots and chord names in the drawn key", () => {
  for (const id of ["9-line", "10-modes"])
    for (let round = 0; round < 24; round++) {
      const task = reviewActivity(id, round)!.tasks[0]!;
      if (task.kind !== "voice") continue;
      const key = keyForPc(pitchClass(task.bass[0]!))!;
      const offsets = id === "10-modes" ? DORIAN_SCALE : MAJOR_SCALE;
      const tonicLabel = spell(task.tonic!, key.tonic, offsets)!;
      assert.ok(
        task.instruction.includes(tonicLabel),
        `${id}/${round}: instruction names ${tonicLabel}`,
      );
      if (id === "10-modes") {
        assert.ok(
          task.instruction.includes(spell(task.tonic! + 3, key.tonic, DORIAN_SCALE)!),
          `${id}/${round}: dorian third spelled in key`,
        );
        assert.ok(
          task.instruction.includes(spell(task.tonic! + 9, key.tonic, DORIAN_SCALE)!),
          `${id}/${round}: dorian sixth spelled in key`,
        );
      }
    }
  for (const id of Object.keys(LESSON_ACTIVITIES))
    for (let round = 0; round < 12; round++) {
      const task = reviewActivity(id, round)!.tasks[0]!;
      if (task.kind !== "chord") continue;
      const root = rootOf(task.solution[0]!)!;
      const key = keyForPc(root.rootPc)!;
      const label = spell(root.rootMidi, key.tonic, MAJOR_SCALE)!;
      assert.ok(
        task.instruction.includes(`root on ${label}`),
        `${id}/${round}: instruction names root ${label}`,
      );
      assert.ok(
        task.title.includes(`${key.tonic}${root.suffix}`),
        `${id}/${round}: title names ${key.tonic}${root.suffix}`,
      );
    }
});

it("keeps early exact spellings intact at every drawn octave (rounds 0-15)", () => {
  for (const id of ["1-steps", "3-major", "4-intervals"]) {
    const authored = activityForUnit(id)!.tasks[0]!;
    const placements = new Set<number>();
    for (let round = 0; round < 16; round++) {
      const task = reviewActivity(id, round)!.tasks[0]!;
      if (task.kind !== "voice") continue;
      assert.deepEqual(
        task.solution[0]!.map(pitchClass),
        authored.solution[0]!.map(pitchClass),
        `${id}/${round}: pitch classes unchanged (octaves only)`,
      );
      placements.add(task.solution[0]![0]!);
      if (id === "4-intervals") assert.match(task.instruction, /C-?\d · Eb-?\d/);
      if (id === "3-major") {
        assert.match(task.title, /C major/);
        assert.equal(task.solution[0]![0]! % 12, 0);
      }
    }
    assert.ok(placements.size >= 3, `${id}: octave placements vary (${placements.size})`);
  }
});

it("names the melody task's chords in its positions after transposition", () => {
  for (let round = 0; round < 12; round++) {
    const task = reviewActivity("5-melody", round)!.tasks[0]!;
    if (task.kind !== "voice" || !task.chords) continue;
    const key = keyForPc(pitchClass(task.bass[0]!))!;
    task.chords.forEach((chord, i) => {
      const root = rootOf(chord)!;
      const expected = `${spell(root.rootMidi, key.tonic, MAJOR_SCALE)!.replace(/-?\d+$/, "")}${root.suffix}`;
      assert.equal(task.positions[i], expected, `round ${round} position ${i}`);
    });
  }
});

it("keeps fugue and development position labels on the moved reference", () => {
  for (let round = 0; round < 12; round++) {
    const fugue = reviewActivity("10-fugue", round)!.tasks[0]!;
    if (fugue.kind === "voice")
      fugue.positions.forEach((p, i) =>
        assert.equal(p, `${noteName(fugue.bass[i]!)} + 7`, `fugue round ${round} position ${i}`),
      );
    const dev = reviewActivity("10-development", round)!.tasks[0]!;
    if (dev.kind === "voice") {
      const key = keyForPc(pitchClass(dev.bass[0]!))!;
      assert.equal(
        dev.positions[0],
        `Start on ${spell(dev.bass[0]!, key.tonic, MAJOR_SCALE)}`,
        `development round ${round} start label`,
      );
    }
  }
});
