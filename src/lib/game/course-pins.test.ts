/**
 * Positional-coupling pins for course.ts -> lessons.ts.
 *
 * Units pull their section and recall checks out of lessons.ts BY ARRAY
 * INDEX (lessonFor(level).sections[i], lessonFor(level).check[j]). Nothing
 * type-checks an index, so inserting a section or a check mid-chapter would
 * silently re-point every later unit in that level at the wrong content —
 * and the re-pointed unit would still render plausible text.
 *
 * This table pins, for every unit, the resolved section heading (the unit
 * title) and the resolved recall-check prompts, as verified against the
 * curriculum audit. If a lessons.ts edit re-points a unit, this test fails
 * and names the unit. If a re-pointing is INTENTIONAL, update the pin for
 * that unit in the same commit — the failure is the review prompt.
 *
 * The coupling itself is unchanged; this test is the guard, not the cure.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { COURSE_UNITS } from "./course.ts";

type UnitPin = { id: string; title: string; checks: string[] };

const PINS: UnitPin[] = [
  {
    id: "0-pitch",
    title: "Pitch: high and low",
    checks: [
      "A tone vibrates faster. It sounds…",
      "A low note gets louder. Has its pitch necessarily changed?",
    ],
  },
  {
    id: "0-dynamics",
    title: "Dynamics: loud and soft",
    checks: [
      "The marking p means…",
      "Which marking asks for a louder sound than p?",
    ],
  },
  {
    id: "0-timbre",
    title: "Timbre: the colour of sound",
    checks: [
      "Two instruments play the same note. What makes them sound different?",
      "A piano and trumpet play equally loud A notes. What can still differ?",
    ],
  },
  {
    id: "0-pulse",
    title: "Find a steady pulse",
    checks: [
      "What does BPM measure?",
      "A melody changes rhythm. Must its beat speed change?",
    ],
  },
  {
    id: "1-alphabet",
    title: "Colour is the note name",
    checks: [
      "Which note letter comes after G?",
      "Two C notes are an octave apart. What stays the same?",
    ],
  },
  {
    id: "1-staff",
    title: "The staff: five lines, four spaces",
    checks: [
      "How many lines does one staff have?",
      "A note moves up from treble E on the bottom line to the next space. It is…",
    ],
  },
  {
    id: "1-landmarks",
    title: "Three landmarks",
    checks: [
      "The treble clef curls around which line?",
      "The two dots of the bass clef surround…",
    ],
  },
  {
    id: "1-steps",
    title: "Half steps, sharps and flats",
    checks: [
      "E to F is how many semitones?",
      "What does a flat do?",
    ],
  },
  {
    id: "2-duration",
    title: "Note values",
    checks: [
      "How many quarter notes fill a bar of 4/4?",
      "In 4/4, two eighth notes together last…",
    ],
  },
  {
    id: "2-meter",
    title: "Time signatures",
    checks: [
      "Which meter is a waltz?",
      "6/8 is usually felt as…",
    ],
  },
  {
    id: "2-dots",
    title: "The dot",
    checks: [
      "A dotted half note lasts…",
      "A dotted quarter plus an eighth totals how many quarter-note beats?",
    ],
  },
  {
    id: "2-syncopation",
    title: "Rests, ties and syncopation",
    checks: [
      "Two quarter notes of the same pitch are tied. How many attacks?",
      "During a rest, the underlying beat…",
    ],
  },
  {
    id: "3-major",
    title: "The major scale pattern",
    checks: [
      "The major scale pattern begins…",
      "Where are the half steps in a major scale?",
    ],
  },
  {
    id: "3-signatures",
    title: "Sharps and flats in order",
    checks: [
      "Which key has one sharp?",
      "Which key has two flats?",
    ],
  },
  {
    id: "3-circle",
    title: "The circle of fifths",
    checks: [
      "Which major keys sit beside C on the circle?",
      "Moving clockwise from G gives…",
    ],
  },
  {
    id: "3-minor",
    title: "Three forms of minor",
    checks: [
      "What changes from A natural minor to A harmonic minor?",
      "Which is the parallel minor of C major?",
    ],
  },
  {
    id: "4-intervals",
    title: "Intervals by number and quality",
    checks: [
      "How many semitones in a perfect 5th?",
      "C to Eb is a…",
    ],
  },
  {
    id: "4-tension",
    title: "Consonance and dissonance",
    checks: [
      "Which interval is dissonant?",
      "Is dissonance always a mistake?",
    ],
  },
  {
    id: "4-triads",
    title: "Four triads",
    checks: [
      "A minor triad is built from…",
      "Which notes spell C diminished?",
    ],
  },
  {
    id: "4-inversions",
    title: "Chord inversions and slash symbols",
    checks: [
      "C/E is which inversion of C major?",
      "Which fact determines a chord's inversion?",
    ],
  },
  {
    id: "5-function",
    title: "Roman numerals in a major key",
    checks: [
      "Which numerals are major in a major key?",
      "In G major, which chord is V?",
    ],
  },
  {
    id: "5-cadences",
    title: "Perfect and plagal",
    checks: [
      "IV to I is called…",
      "For a perfect authentic cadence, V and I must be…",
    ],
  },
  {
    id: "5-open-endings",
    title: "Half and deceptive",
    checks: [
      "V to vi is called…",
      "A phrase in C major ends on G major. Its cadence is…",
    ],
  },
  {
    id: "5-melody",
    title: "Turn a progression into a phrase",
    checks: [
      "Which is a chord tone of A minor?",
      "What is a motif?",
    ],
  },
  {
    id: "6-voices",
    title: "Consonance on every beat",
    checks: [
      "Which intervals are favoured in the middle of a first-species line?",
      "First species means…",
    ],
  },
  {
    id: "6-parallels",
    title: "No parallel fifths or octaves",
    checks: [
      "C–G moves to D–A with both voices rising. This is…",
      "Why avoid parallel fifths in traditional part-writing?",
    ],
  },
  {
    id: "6-motion",
    title: "Motion and four-part writing",
    checks: [
      "One voice stays on C while another moves E to F. This is…",
      "What does the A in SATB mean?",
    ],
  },
  {
    id: "6-decoration",
    title: "Passing notes, neighbours and suspensions",
    checks: [
      "E–F–E over a C chord uses F as a…",
      "What happens first in a prepared suspension?",
    ],
  },
  {
    id: "7-related",
    title: "Closely related keys",
    checks: [
      "Which key is NOT closely related to C major?",
      "How many pitch classes do C major and A natural minor share?",
    ],
  },
  {
    id: "7-pivot",
    title: "The pivot chord",
    checks: [
      "A pivot chord is…",
      "A minor is vi in C major. In G major it is…",
    ],
  },
  {
    id: "7-tonicization",
    title: "A visit or a new home?",
    checks: [
      "Which is stronger evidence for modulation?",
      "A short emphasis on a chord without establishing a new key is…",
    ],
  },
  {
    id: "7-secondary",
    title: "Secondary dominants",
    checks: [
      "In C major, V/V is…",
      "Why does D7 contain F# when used in C major?",
    ],
  },
  {
    id: "8-sevenths",
    title: "Seventh chords and extensions",
    checks: [
      "V7 adds which interval above the root?",
      "Which notes spell Cmaj7?",
    ],
  },
  {
    id: "8-extensions",
    title: "Extensions: 9ths, 11ths, 13ths",
    checks: [
      "The 9th of a C major chord is…",
      "Extensions change a chord's…",
    ],
  },
  {
    id: "8-borrowed",
    title: "Borrowed chords and chromatic colour",
    checks: [
      "The Neapolitan chord is built on…",
      "F minor used as iv in C major is borrowed from…",
    ],
  },
  {
    id: "8-odd-meter",
    title: "Odd meters",
    checks: [
      "5/4 is commonly grouped as…",
      "A 2+2+3 grouping of eighth notes fills…",
    ],
  },
  {
    id: "8-polyrhythm",
    title: "Three against two",
    checks: [
      "On a six-part grid, the two-part of 3:2 attacks on…",
      "In 3:2, the two parts…",
    ],
  },
  {
    id: "9-line",
    title: "Shape the whole line",
    checks: [
      "A first-species line should mostly move by…",
      "How many high points should a line have?",
    ],
  },
  {
    id: "9-close",
    title: "Begin and end on perfect consonances",
    checks: [
      "The final interval should be…",
      "D–B moves to C–C, one octave apart. The motion is…",
    ],
  },
  {
    id: "9-moving-species",
    title: "Second and third species",
    checks: [
      "Second species normally uses how many notes per cantus note?",
      "In basic second species, a dissonant weak-beat passing note should…",
    ],
  },
  {
    id: "9-suspensions",
    title: "Fourth and fifth species",
    checks: [
      "In a 4–3 suspension, the upper voice normally resolves…",
      "Fifth species combines…",
    ],
  },
  {
    id: "10-fugue",
    title: "Subject and answer",
    checks: [
      "In a fugue, the answer is usually the subject…",
      "A real answer preserves…",
    ],
  },
  {
    id: "10-development",
    title: "Develop a subject and hear form",
    checks: [
      "A new subject entry starts before the previous one finishes. This is…",
      "Doubling every note duration is…",
    ],
  },
  {
    id: "10-modes",
    title: "Modes and a deliberate tonic",
    checks: [
      "Compared with natural minor, Dorian has a…",
      "Compared with major, Mixolydian has a…",
    ],
  },
  {
    id: "10-post-tonal",
    title: "Post-tonal patterns",
    checks: [
      "A whole-tone scale contains…",
      "Transposing pitch classes [0,1,4] up 2 gives…",
    ],
  },
];

describe("course positional pins", () => {
  it("pins every unit — no unit added or dropped without a pin update", () => {
    assert.equal(COURSE_UNITS.length, PINS.length);
    assert.deepEqual(
      COURSE_UNITS.map((u) => u.id),
      PINS.map((p) => p.id),
    );
  });

  it("each unit still resolves to its pinned section heading and check prompts", () => {
    for (const pin of PINS) {
      const unit = COURSE_UNITS.find((u) => u.id === pin.id)!;
      assert.equal(
        unit.title,
        pin.title,
        `unit ${pin.id}: resolved section heading drifted (positional re-point?)`,
      );
      assert.deepEqual(
        unit.checks.map((c) => c.prompt),
        pin.checks,
        `unit ${pin.id}: resolved recall checks drifted (positional re-point?)`,
      );
    }
  });
});
