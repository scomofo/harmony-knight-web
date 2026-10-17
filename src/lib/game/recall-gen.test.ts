import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CADENCES,
  CIRCLE_OF_FIFTHS,
  INTERVAL_NAMES,
  KEYS,
  MAJOR_SCALE,
  ROMAN_NUMERALS,
  TONIC_MIDI,
  classifyInterval,
  closelyRelatedKeys,
  diatonicTriad,
  keySignatureAccidentals,
  majorTriad,
  minorTriad,
} from "./music.ts";
import { RHYTHMS, intervalExerciseForGrade } from "./exercises.ts";
import { noteValueName } from "./rhythm.ts";
import { rngFor } from "./rng.ts";
import { COURSE_UNITS, unitById } from "./course.ts";
import {
  advanceUnit,
  answerUnit,
  freshUnitProgress,
  servedChecks,
  type UnitProgress,
} from "./learning.ts";
import { GENERATED_RECALL_UNITS, RECALL_REGISTRY, generateRecallPair } from "./recall-gen.ts";
import type { CheckQuestion } from "./lessons.ts";

/**
 * Phase 1 generated recall: the pair served at due review is generated from
 * the verified theory core, seeded by (unit, reviewCount). These tests
 * recompute every generated answer independently from music.ts (and the
 * exercise families' own data), pin the registry's coverage split, and pin
 * the scheduling contract against the served pair.
 */

const EXPECTED_GENERATING = [
  "0-dynamics",
  "0-pitch",
  "0-timbre",
  "2-dots",
  "2-duration",
  "2-meter",
  "3-circle",
  "3-major",
  "3-minor",
  "3-signatures",
  "4-intervals",
  "4-tension",
  "4-triads",
  "5-cadences",
  "5-function",
  "5-open-endings",
  "7-related",
];

const EXPECTED_FALLBACK = [
  "0-pulse",
  "1-alphabet",
  "1-landmarks",
  "1-staff",
  "1-steps",
  "10-development",
  "10-fugue",
  "10-modes",
  "10-post-tonal",
  "2-syncopation",
  "4-inversions",
  "5-melody",
  "6-decoration",
  "6-motion",
  "6-parallels",
  "6-voices",
  "7-pivot",
  "7-secondary",
  "7-tonicization",
  "8-borrowed",
  "8-extensions",
  "8-odd-meter",
  "8-polyrhythm",
  "8-sevenths",
  "9-close",
  "9-line",
  "9-moving-species",
  "9-suspensions",
];

/* ------------------------------------------- independent recompute helpers */

const NATURAL_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const LETTER_SEQ = ["C", "D", "E", "F", "G", "A", "B"];

function pcOfName(name: string): number {
  let pc = NATURAL_PC[name[0]!]!;
  if (name[1] === "#") pc += 1;
  if (name[1] === "b") pc -= 1;
  return ((pc % 12) + 12) % 12;
}

/** Letter-arithmetic spelling, re-derived test-side; "?" marks an impossible spelling. */
function spellExpected(fromLetter: string, steps: number, pc: number): string {
  const letter = LETTER_SEQ[(LETTER_SEQ.indexOf(fromLetter) + steps) % 7]!;
  const diff = (((pc - NATURAL_PC[letter]!) % 12) + 12) % 12;
  return letter + (diff === 0 ? "" : diff === 1 ? "#" : diff === 11 ? "b" : "?");
}

const BEATS_BY_NAME = new Map([4, 3, 2, 1.5, 1, 0.5].map((v) => [noteValueName(v), v]));
function beatsOfValueName(name: string): number {
  const beats = BEATS_BY_NAME.get(name);
  assert.ok(beats !== undefined, `unknown note value name: ${name}`);
  return beats;
}
function beatsLabelExpected(beats: number): string {
  if (beats === 0.5) return "Half a beat";
  if (beats === 1) return "1 beat";
  return `${beats} beats`;
}
function keyByTonic(tonic: string) {
  const key = KEYS.find((k) => k.isMajor && k.tonic === tonic);
  assert.ok(key, `no major key for tonic ${tonic}`);
  return key;
}
function semitonesByName(name: string): number {
  const entry = Object.entries(INTERVAL_NAMES).find(
    ([, n]) => n.toLowerCase() === name.toLowerCase(),
  );
  assert.ok(entry, `unknown interval name: ${name}`);
  return Number(entry[0]);
}
/** Chord name for a scale degree, recomputed from diatonicTriad + spelling. */
function chordNameExpected(tonic: string, degree: number): string {
  const key = keyByTonic(tonic);
  const rootMidi = diatonicTriad(TONIC_MIDI[key.tonic]!, degree)[0]!;
  const rootPc = ((rootMidi % 12) + 12) % 12;
  const root = spellExpected(key.tonic[0]!, degree, rootPc);
  return `${root} ${degree === 5 ? "minor" : "major"}`;
}
const shortCadence = (fullName: string) => fullName.replace(/ \(.+\)$/, "");

/**
 * Recompute a generated check's answer from its prompt alone, using only
 * music.ts and the exercise families' published data. Any prompt shape this
 * function does not recognise fails the test, so a new form cannot ship
 * unverified.
 */
function verifyGenerated(id: string, q: CheckQuestion): void {
  const p = q.prompt;
  let m: RegExpMatchArray | null;
  switch (id) {
    case "0-pitch":
      if ((m = p.match(/vibrates (faster|slower)/)))
        assert.equal(q.answer, m[1] === "faster" ? "Higher" : "Lower", p);
      else if ((m = p.match(/slides (up|down)/)))
        assert.equal(q.answer, m[1] === "up" ? "More quickly" : "More slowly", p);
      else if (p.includes("What happens to its pitch?"))
        assert.equal(q.answer, "It stays the same", p);
      else assert.fail(`unverified 0-pitch prompt: ${p}`);
      break;
    case "0-dynamics":
      if ((m = p.match(/The marking (p|f) means/)))
        assert.equal(q.answer, m[1] === "p" ? "Softly" : "Loudly", p);
      else if ((m = p.match(/asks for the (louder|softer) sound/)))
        assert.equal(q.answer, m[1] === "louder" ? "f (forte)" : "p (piano)", p);
      else if (p.includes("played again marked"))
        assert.equal(q.answer, "Only the loudness", p);
      else assert.fail(`unverified 0-dynamics prompt: ${p}`);
      break;
    case "0-timbre":
      if (p.includes("play the same note at the same loudness"))
        assert.ok(q.answer.startsWith("Their timbre"), p);
      else if (p.includes("quality of a sound that lets you"))
        assert.equal(q.answer, "Tell two instruments apart on the same note", p);
      else assert.fail(`unverified 0-timbre prompt: ${p}`);
      break;
    case "2-duration":
      if ((m = p.match(/a (.+) note lasts for how many/)))
        assert.equal(q.answer, beatsLabelExpected(beatsOfValueName(m[1]!)), p);
      else if ((m = p.match(/How many (.+) notes fill one bar/)))
        assert.equal(q.answer, String(4 / beatsOfValueName(m[1]!)), p);
      else if ((m = p.match(/Two (.+) notes in a row/)))
        assert.equal(q.answer, beatsLabelExpected(2 * beatsOfValueName(m[1]!)), p);
      else assert.fail(`unverified 2-duration prompt: ${p}`);
      break;
    case "2-dots":
      if ((m = p.match(/A dotted (.+) note lasts/)))
        assert.equal(q.answer, beatsLabelExpected(beatsOfValueName(m[1]!) * 1.5), p);
      else if (p.startsWith("A dot written after a note"))
        assert.equal(q.answer, "Adds half of the note's own length", p);
      else if ((m = p.match(/A (.+) note plus a (.+) note adds up/)))
        assert.equal(
          q.answer,
          beatsLabelExpected(beatsOfValueName(m[1]!) + beatsOfValueName(m[2]!)),
          p,
        );
      else assert.fail(`unverified 2-dots prompt: ${p}`);
      break;
    case "2-meter":
      if ((m = p.match(/One full bar goes: (.+)\. Which meter/))) {
        const desc = m[1]!;
        const counted = desc.match(/^(\d+) (.+) notes$/);
        const total = counted
          ? Number(counted[1]) * beatsOfValueName(counted[2]!)
          : desc.split(", ").reduce((sum, tok) => sum + beatsOfValueName(tok.replace(/ note$/, "")), 0);
        assert.equal(q.answer, { 2: "2/4", 3: "3/4", 4: "4/4" }[total as 2 | 3 | 4], p);
        // The described bar must be one of the family's own patterns.
        assert.ok(
          RHYTHMS.some(
            (r) => r.meter === q.answer && r.beats.reduce((a, b) => a + b, 0) === total,
          ),
          p,
        );
      } else if ((m = p.match(/^(\d\/\d) is usually felt as/))) {
        const feels: Record<string, string> = {
          // 6 eighths = 2 beats of a dotted quarter (1.5 quarter-beats each).
          "6/8": "Two dotted-quarter beats",
          "3/4": "Three quarter-note beats",
          "2/4": "Two quarter-note beats",
          "4/4": "Four quarter-note beats",
        };
        assert.equal((6 * beatsOfValueName("eighth")) / beatsOfValueName("dotted quarter"), 2);
        assert.equal(q.answer, feels[m[1]!], p);
      } else if (p.startsWith("A waltz")) {
        assert.ok(RHYTHMS.filter((r) => /waltz/i.test(r.name)).every((r) => r.meter === "3/4"));
        assert.equal(q.answer, "3/4", p);
      } else assert.fail(`unverified 2-meter prompt: ${p}`);
      break;
    case "3-major":
      if ((m = p.match(/between the (\d)\w+ and (\d)\w+ notes/))) {
        const gap = MAJOR_SCALE[Number(m[2]) - 1]! - MAJOR_SCALE[Number(m[1]) - 1]!;
        assert.equal(q.answer, gap === 1 ? "Half step" : "Whole step", p);
      } else if ((m = p.match(/In (\S+) major, the (\d)\w+ note of the scale is/))) {
        const key = keyByTonic(m[1]!);
        assert.ok(key.accidentals <= 2, `scope: ${p}`);
        const degree = Number(m[2]);
        const pc = (((TONIC_MIDI[key.tonic]! + MAJOR_SCALE[degree - 1]!) % 12) + 12) % 12;
        assert.equal(q.answer, spellExpected(key.tonic[0]!, degree - 1, pc), p);
        assert.equal(pcOfName(q.answer), pc, p);
      } else assert.fail(`unverified 3-major prompt: ${p}`);
      break;
    case "3-signatures":
      if ((m = p.match(/Which major key has (\d+) (sharp|flat)/))) {
        const key = KEYS.find(
          (k) => k.isMajor && k.accidentals === Number(m![1]) && k.kind === m![2],
        )!;
        assert.ok(key.accidentals <= 4, `scope: ${p}`);
        assert.equal(q.answer, `${key.tonic} major`, p);
      } else if ((m = p.match(/key signature of (\S+) major\?/))) {
        const key = keyByTonic(m[1]!);
        assert.ok(key.accidentals <= 4, `scope: ${p}`);
        assert.equal(
          q.answer,
          key.kind === "none"
            ? "None"
            : `${key.accidentals} ${key.kind}${key.accidentals === 1 ? "" : "s"}`,
          p,
        );
      } else if ((m = p.match(/key signature of (\S+) major contains, in order/))) {
        const key = keyByTonic(m[1]!);
        assert.equal(q.answer, keySignatureAccidentals(key).join(", "), p);
      } else assert.fail(`unverified 3-signatures prompt: ${p}`);
      break;
    case "3-circle":
      if ((m = p.match(/sit beside (\S+) on the circle/))) {
        const i = CIRCLE_OF_FIFTHS.indexOf(m[1]!);
        assert.ok(i >= 0 && keyByTonic(m[1]!).accidentals <= 4, `scope: ${p}`);
        const at = (o: number) => CIRCLE_OF_FIFTHS[(i + o + 12) % 12]!;
        assert.equal(q.answer, `${at(-1)} and ${at(1)}`, p);
      } else if ((m = p.match(/Moving (clockwise|anticlockwise).*from (\S+) major/))) {
        const i = CIRCLE_OF_FIFTHS.indexOf(m[2]!);
        const next = CIRCLE_OF_FIFTHS[(i + (m[1] === "clockwise" ? 1 : 11)) % 12]!;
        assert.equal(q.answer, `${next} major`, p);
      } else assert.fail(`unverified 3-circle prompt: ${p}`);
      break;
    case "3-minor":
      if ((m = p.match(/In (\S+) minor \(natural minor\), which note is raised/))) {
        const major = KEYS.find((k) => k.relative === `${m![1]} Minor`)!;
        const tonicPc = (((TONIC_MIDI[major.tonic]! - 3) % 12) + 12) % 12;
        assert.equal(pcOfName(q.answer), (tonicPc + 11) % 12, p);
        assert.equal(q.answer[0], LETTER_SEQ[(LETTER_SEQ.indexOf(m[1]!) + 6) % 7], p);
      } else if ((m = p.match(/The (parallel|relative) minor of (\S+) major is/))) {
        const key = keyByTonic(m[2]!);
        assert.equal(
          q.answer,
          m[1] === "parallel"
            ? `${key.tonic} minor`
            : key.relative.replace(/ Minor$/, " minor"),
          p,
        );
      } else if (p.startsWith("Melodic minor"))
        assert.equal(q.answer, "The 6th and the 7th", p);
      else assert.fail(`unverified 3-minor prompt: ${p}`);
      break;
    case "4-intervals": {
      const ALLOWED = [2, 4, 5, 7, 12];
      if (p === "How many semitones are in an octave?") assert.equal(q.answer, "12", p);
      else if ((m = p.match(/How many semitones are in a (.+)\?/))) {
        const semis = semitonesByName(m[1]!);
        assert.ok(ALLOWED.includes(semis), `scope: ${p}`);
        assert.equal(q.answer, String(semis), p);
      } else if ((m = p.match(/^(\S) up to (\S+) is a/))) {
        let semis = (pcOfName(m[2]!) - NATURAL_PC[m[1]!]! + 12) % 12;
        if (semis === 0) semis = 12;
        assert.ok(ALLOWED.includes(semis), `scope: ${p}`);
        assert.equal(q.answer, INTERVAL_NAMES[semis], p);
      } else if ((m = p.match(/An interval of (\d+) semitones is a/))) {
        assert.ok(ALLOWED.includes(Number(m[1])), `scope: ${p}`);
        assert.equal(q.answer, INTERVAL_NAMES[Number(m[1])], p);
      } else assert.fail(`unverified 4-intervals prompt: ${p}`);
      break;
    }
    case "4-tension": {
      const LABELS: Record<string, string> = {
        perfectConsonance: "A perfect consonance",
        imperfectConsonance: "An imperfect consonance",
        dissonance: "A dissonance",
      };
      if ((m = p.match(/Which of these intervals is (dissonant|a perfect consonance|an imperfect consonance)\?/))) {
        const cls =
          m[1] === "dissonant"
            ? "dissonance"
            : m[1] === "a perfect consonance"
              ? "perfectConsonance"
              : "imperfectConsonance";
        assert.equal(classifyInterval(semitonesByName(q.answer)), cls, p);
        for (const option of q.options)
          if (option !== q.answer)
            assert.notEqual(classifyInterval(semitonesByName(option)), cls, p);
      } else if ((m = p.match(/The (.+) is classed as/))) {
        assert.equal(q.answer, LABELS[classifyInterval(semitonesByName(m[1]!))]!, p);
      } else assert.fail(`unverified 4-tension prompt: ${p}`);
      break;
    }
    case "4-triads": {
      const stepsOf = (names: string[]) => {
        const rootPc = pcOfName(names[0]!);
        return names.map((n) => (pcOfName(n) - rootPc + 12) % 12);
      };
      const qualityOfSteps = (steps: number[]) =>
        steps.join() === majorTriad(60).map((x) => x - 60).join()
          ? "Major"
          : steps.join() === minorTriad(60).map((x) => x - 60).join()
            ? "Minor"
            : "Other";
      if ((m = p.match(/Which notes spell a (\S) (major|minor) triad/))) {
        const wanted = m[2] === "major" ? "Major" : "Minor";
        assert.equal(qualityOfSteps(stepsOf(q.answer.split(" "))), wanted, p);
        assert.equal(q.answer.split(" ")[0], m[1], p);
        for (const option of q.options)
          if (option !== q.answer)
            assert.notEqual(qualityOfSteps(stepsOf(option.split(" "))), wanted, p);
      } else if ((m = p.match(/A (major|minor) triad is built by stacking/))) {
        const triad = m[1] === "major" ? majorTriad(60) : minorTriad(60);
        const thirdName = (gap: number) => (gap === 4 ? "major 3rd" : "minor 3rd");
        assert.equal(
          q.answer,
          `A ${thirdName(triad[1]! - triad[0]!)}, then a ${thirdName(triad[2]! - triad[1]!)}`,
          p,
        );
      } else if ((m = p.match(/The notes (.+) spell a/))) {
        const names = m[1]!.split(", ");
        assert.equal(q.answer, `${qualityOfSteps(stepsOf(names))} triad`, p);
        assert.notEqual(qualityOfSteps(stepsOf(names)), "Other", p);
      } else assert.fail(`unverified 4-triads prompt: ${p}`);
      break;
    }
    case "5-function":
      if ((m = p.match(/In (\S+) major, which chord is (\S+)\?/))) {
        const degree = ROMAN_NUMERALS.indexOf(m[2]! as (typeof ROMAN_NUMERALS)[number]);
        assert.ok([0, 3, 4, 5].includes(degree), `scope: ${p}`);
        assert.ok(keyByTonic(m[1]!).accidentals <= 2, `scope: ${p}`);
        assert.equal(q.answer, chordNameExpected(m[1]!, degree), p);
      } else if ((m = p.match(/In (\S+) major, (\S+ \w+) is…/))) {
        const degree = [0, 3, 4, 5].find((d) => chordNameExpected(m![1]!, d) === m![2]);
        assert.ok(degree !== undefined, p);
        assert.equal(q.answer, ROMAN_NUMERALS[degree], p);
      } else if ((m = p.match(/Which Roman numerals are (major|minor|diminished) chords/))) {
        const groups: Record<string, string[]> = { major: [], minor: [], diminished: [] };
        for (const numeral of ROMAN_NUMERALS) {
          if (numeral.includes("°")) groups.diminished!.push(numeral);
          else if (numeral === numeral.toUpperCase()) groups.major!.push(numeral);
          else groups.minor!.push(numeral);
        }
        const list = groups[m[1]!]!;
        assert.equal(
          q.answer,
          list.length === 1 ? `${list[0]} only` : `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`,
          p,
        );
      } else assert.fail(`unverified 5-function prompt: ${p}`);
      break;
    case "5-cadences":
    case "5-open-endings": {
      const allowed = id === "5-cadences" ? ["Perfect", "Plagal"] : ["Half", "Deceptive"];
      const cadenceOf = (short: string) => CADENCES.find((c) => shortCadence(c.name) === short)!;
      if ((m = p.match(/A phrase ending (\S+)–(\S+) is which cadence\?/))) {
        const degrees = [
          ROMAN_NUMERALS.indexOf(m[1]! as (typeof ROMAN_NUMERALS)[number]),
          ROMAN_NUMERALS.indexOf(m[2]! as (typeof ROMAN_NUMERALS)[number]),
        ];
        const cadence = CADENCES.find(
          (c) => c.degrees[0] === degrees[0] && c.degrees[1] === degrees[1],
        )!;
        assert.ok(allowed.includes(shortCadence(cadence.name)), `scope: ${p}`);
        assert.equal(q.answer, shortCadence(cadence.name), p);
      } else if ((m = p.match(/A (perfect|plagal|half|deceptive) cadence moves…/))) {
        const cadence = cadenceOf(m[1]![0]!.toUpperCase() + m[1]!.slice(1));
        assert.ok(allowed.includes(shortCadence(cadence.name)), `scope: ${p}`);
        assert.equal(
          q.answer,
          `From ${ROMAN_NUMERALS[cadence.degrees[0]!]} to ${ROMAN_NUMERALS[cadence.degrees[1]!]}`,
          p,
        );
      } else if (p.startsWith("Which cadence")) {
        const keyword = p.includes("full stop")
          ? "full stop"
          : p.includes("Amen")
            ? "Amen"
            : p.includes("comma")
              ? "comma"
              : "relative minor";
        const cadence = CADENCES.find((c) => c.feel.includes(keyword))!;
        assert.ok(allowed.includes(shortCadence(cadence.name)), `scope: ${p}`);
        assert.equal(q.answer, shortCadence(cadence.name), p);
      } else if ((m = p.match(/A phrase in (\S+) major ends on (\S+ \w+), the dominant chord/))) {
        assert.equal(id, "5-open-endings", p);
        assert.equal(m[2], chordNameExpected(m[1]!, 4), p);
        assert.equal(q.answer, "Half", p);
      } else if ((m = p.match(/A phrase in (\S+) major moves from (\S+ \w+) \(V\) to (\S+ \w+) \(vi\)/))) {
        assert.equal(id, "5-open-endings", p);
        assert.equal(m[2], chordNameExpected(m[1]!, 4), p);
        assert.equal(m[3], chordNameExpected(m[1]!, 5), p);
        assert.equal(q.answer, "Deceptive", p);
      } else assert.fail(`unverified ${id} prompt: ${p}`);
      break;
    }
    case "7-related": {
      const HOME_POOL = CIRCLE_OF_FIFTHS.slice(0, 6).concat(CIRCLE_OF_FIFTHS.slice(10));
      if ((m = p.match(/close neighbour of (\S+) major\?/))) {
        assert.ok(HOME_POOL.includes(m[1]!), `scope: ${p}`);
        const family = closelyRelatedKeys(m[1]!);
        assert.ok(family.includes(q.answer), p);
        for (const option of q.options)
          if (option !== q.answer) assert.ok(!family.includes(option), p);
      } else if ((m = p.match(/NOT closely related to (\S+) major\?/))) {
        assert.ok(HOME_POOL.includes(m[1]!), `scope: ${p}`);
        const family = closelyRelatedKeys(m[1]!);
        assert.ok(!family.includes(q.answer) && q.answer !== `${m[1]} major`, p);
        for (const option of q.options)
          if (option !== q.answer) assert.ok(family.includes(option), p);
      } else if ((m = p.match(/How many keys are closely related to (\S+) major/))) {
        assert.ok(HOME_POOL.includes(m[1]!), `scope: ${p}`);
        assert.equal(closelyRelatedKeys(m[1]!).length, 5, p);
        assert.equal(q.answer, "Five", p);
      } else assert.fail(`unverified 7-related prompt: ${p}`);
      break;
    }
    default:
      assert.fail(`no verifier for unit ${id}`);
  }
}

/* ------------------------------------------------------------ the tests */

describe("generated recall (Phase 1)", () => {
  it("registry coverage matches the decided split: 17 units generate, 28 stay authored", () => {
    assert.deepEqual(GENERATED_RECALL_UNITS, EXPECTED_GENERATING);
    const fallback = COURSE_UNITS.map((u) => u.id)
      .filter((id) => !GENERATED_RECALL_UNITS.includes(id))
      .sort();
    assert.deepEqual(fallback, EXPECTED_FALLBACK);
    assert.equal(COURSE_UNITS.length, 45);
    for (const entry of Object.values(RECALL_REGISTRY)) {
      assert.ok(entry.forms.length >= 2, "every generating unit needs at least two forms");
      assert.ok(entry.family.length > 0 && entry.scope.length > 0);
    }
  });

  it("every generated answer recomputes independently from the theory core", () => {
    for (const id of EXPECTED_GENERATING) {
      for (let round = 0; round < 25; round++) {
        const pair = generateRecallPair(id, round)!;
        assert.equal(pair.length, 2, `${id} round ${round}`);
        assert.notEqual(pair[0]!.prompt, pair[1]!.prompt, `${id} round ${round}: distinct checks`);
        for (const q of pair) {
          assert.ok(q.options.includes(q.answer), `${id}: answer is an option`);
          assert.equal(new Set(q.options).size, q.options.length, `${id}: options unique`);
          assert.ok(q.options.length >= 2 && q.options.length <= 4, `${id}: option count`);
          assert.ok(q.why.length > 0, `${id}: explanation present`);
          verifyGenerated(id, q);
        }
      }
    }
  });

  it("pairs are deterministic in (unit, round) and rotate between rounds", () => {
    for (const id of EXPECTED_GENERATING) {
      const seen = new Set<string>();
      let previous: string | undefined;
      for (let round = 0; round < 21; round++) {
        const pair = generateRecallPair(id, round)!;
        assert.deepEqual(generateRecallPair(id, round), pair, `${id} round ${round}: stable`);
        const key = JSON.stringify(pair);
        assert.notEqual(key, previous, `${id} round ${round}: never repeats the previous pair`);
        previous = key;
        seen.add(key);
      }
      assert.ok(seen.size >= 8, `${id}: fresh volume across rounds (saw ${seen.size})`);
    }
  });

  it("first pass and non-review revisits serve the authored pair for every unit", () => {
    for (const unit of COURSE_UNITS) {
      assert.equal(servedChecks(unit, freshUnitProgress()), unit.checks, unit.id);
      const done: UnitProgress = {
        ...freshUnitProgress(),
        step: 4,
        completedAt: "2026-01-01T00:00:00Z",
        nextReviewAt: "2026-01-02T00:00:00Z",
        intervalDays: 1,
      };
      assert.equal(servedChecks(unit, done), unit.checks, `${unit.id}: completed, not reviewing`);
    }
  });

  it("fallback units serve the authored pair even during review", () => {
    for (const id of EXPECTED_FALLBACK) {
      const unit = unitById(id)!;
      const reviewing: UnitProgress = {
        ...freshUnitProgress(),
        step: 2,
        completedAt: "2026-01-01T00:00:00Z",
        reviewing: true,
        reviewCount: 3,
      };
      assert.equal(generateRecallPair(id, 3), undefined, id);
      assert.equal(servedChecks(unit, reviewing), unit.checks, id);
    }
  });

  it("the served pair is stable mid-review, answers included", () => {
    const unit = unitById("4-intervals")!;
    const base: UnitProgress = {
      ...freshUnitProgress(),
      step: 2,
      completedAt: "2026-01-01T00:00:00Z",
      nextReviewAt: "2026-01-02T00:00:00Z",
      intervalDays: 1,
      reviewing: true,
      reviewCount: 2,
    };
    const before = servedChecks(unit, base);
    const answered = answerUnit(unit, base, before[0]!.answer);
    assert.equal(answered.answers[0], before[0]!.answer);
    assert.deepEqual(servedChecks(unit, answered), before, "refresh mid-review changes nothing");
  });

  it("scheduling against the served pair matches the authored contract", () => {
    const now = new Date("2026-01-10T12:00:00Z");
    for (const id of ["0-pitch", "5-function", "7-related", "6-voices"]) {
      const unit = unitById(id)!;
      // First pass: authored, interval 1.
      let p: UnitProgress = { ...freshUnitProgress(), step: 2 };
      for (const q of unit.checks) {
        p = answerUnit(unit, p, q.answer);
        p = advanceUnit(unit, p, now);
      }
      assert.equal(p.intervalDays, 1, `${id}: first pass`);
      assert.equal(p.reviewCount, 0, `${id}: first pass does not count as a review`);
      // Two due reviews answered correctly against the served pair: 1 → 3 → 7.
      for (const expected of [3, 7]) {
        const dueAt = new Date(p.nextReviewAt!);
        p = { ...p, step: 2, answers: {}, reviewing: true };
        for (const q of servedChecks(unit, p)) {
          p = answerUnit(unit, p, q.answer);
          p = advanceUnit(unit, p, dueAt);
        }
        assert.equal(p.intervalDays, expected, `${id}: due correct review`);
      }
      assert.equal(p.reviewCount, 2, `${id}: two due reviews counted`);
      // A due review with one served answer wrong drops back to 1 day.
      const dueAt = new Date(p.nextReviewAt!);
      p = { ...p, step: 2, answers: {}, reviewing: true };
      const served = servedChecks(unit, p);
      const wrong = served[1]!.options.find((o) => o !== served[1]!.answer)!;
      p = answerUnit(unit, p, served[0]!.answer);
      p = advanceUnit(unit, p, dueAt);
      p = answerUnit(unit, p, wrong);
      p = advanceUnit(unit, p, dueAt);
      assert.equal(p.intervalDays, 1, `${id}: wrong answer resets the interval`);
      assert.equal(p.reviewCount, 3, `${id}: the failed review still counts`);
    }
  });

  it("answer validation follows the served pair, not the authored pair, during review", () => {
    const unit = unitById("0-pitch")!;
    const reviewing: UnitProgress = {
      ...freshUnitProgress(),
      step: 2,
      completedAt: "2026-01-01T00:00:00Z",
      reviewing: true,
      reviewCount: 0,
    };
    // An authored answer no generated form offers ("No", from the authored
    // loudness check) must be refused while the generated pair is served.
    const served = servedChecks(unit, reviewing);
    const probe = unit.checks
      .map((q) => q.answer)
      .find((a) => !served.some((q) => q.options.includes(a)));
    assert.ok(probe, "an authored-only probe answer exists");
    assert.equal(answerUnit(unit, reviewing, probe), reviewing, "authored-only answer refused");
    assert.equal(answerUnit(unit, reviewing, served[0]!.answer).answers[0], served[0]!.answer);
    // advanceUnit also refuses to complete on answers the served pair never offered.
    const forged: UnitProgress = { ...reviewing, step: 3, answers: { 0: probe, 1: probe } };
    assert.equal(advanceUnit(unit, forged, new Date("2026-01-10T12:00:00Z")).step, 3);
  });

  it("seeded exercise families are reproducible under an explicit rng", () => {
    const a = intervalExerciseForGrade(4, rngFor("audit", 1));
    const b = intervalExerciseForGrade(4, rngFor("audit", 1));
    assert.deepEqual(a, b);
    assert.ok([2, 4, 5, 7, 12].includes(semitonesByName(a.correctAnswer)));
  });
});
