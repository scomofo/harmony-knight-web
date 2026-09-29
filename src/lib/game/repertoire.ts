import type { LessonExample } from "./lessons.ts";

export type RepertoireMoment = {
  name: string;
  note: string;
  example: LessonExample;
};

/**
 * Tiny original "house repertoire" that returns as the learner gains new tools.
 * The notes are deliberately simple: recognition matters more than novelty.
 */
export const REPERTOIRE: Record<string, RepertoireMoment> = {
  "1-staff": {
    name: "Lantern Call",
    note: "Meet this four-note idea as a staff-reading shape: C–D–E–C. It will return later when intervals, melody and fugue give you more ways to describe the same notes.",
    example: {
      label: "Lantern Call · C–D–E–C",
      mode: "sequence",
      notes: [60, 62, 64, 60],
      sequence: { gap: 0.52, duration: 0.46, noteLabels: ["C", "D", "E", "C"] },
    },
  },
  "3-major": {
    name: "Lantern Call",
    note: "You already know these notes. Now hear them as scale degrees 1–2–3–1 in C major rather than four isolated letter names.",
    example: {
      label: "Lantern Call · degrees 1–2–3–1",
      mode: "sequence",
      notes: [60, 62, 64, 60],
    },
  },
  "4-intervals": {
    name: "Lantern Call",
    note: "The same call can now be measured: up a major second, up another major second, then down a major third.",
    example: {
      label: "Lantern Call · hear the interval shape",
      mode: "sequence",
      notes: [60, 62, 64, 60],
    },
  },
  "5-melody": {
    name: "Lantern Call",
    note: "Now the call becomes melodic material. C and E sit comfortably inside C major harmony; D can act as motion between them.",
    example: {
      label: "Lantern Call · melody over home",
      mode: "progression",
      notes: [[48, 60], [48, 62], [48, 64], [48, 60]],
    },
  },
  "10-fugue": {
    name: "Lantern Call",
    note: "The old four-note call is finally treated as a subject. Its answer begins a fifth higher: G–A–B–G.",
    example: {
      label: "Lantern Call · subject, then answer",
      mode: "sequence",
      notes: [60, 62, 64, 60, 67, 69, 71, 67],
      sequence: { gap: 0.46, duration: 0.4 },
    },
  },
  "10-development": {
    name: "Lantern Call",
    note: "Turn the familiar contour upside down. C–D–E–C becomes C–Bb–Ab–C when each interval reverses direction around C.",
    example: {
      label: "Lantern Call · original, then inversion",
      mode: "sequence",
      notes: [60, 62, 64, 60, 60, 58, 56, 60],
      sequence: { gap: 0.46, duration: 0.4 },
    },
  },

  "4-triads": {
    name: "Homeward Loop",
    note: "This simple C–Am–F–G loop will keep coming back. For now, hear each chord as a triad with its own quality.",
    example: {
      label: "Homeward Loop · C–Am–F–G",
      mode: "progression",
      notes: [[48, 52, 55], [45, 48, 52], [53, 57, 60], [55, 59, 62]],
    },
  },
  "5-function": {
    name: "Homeward Loop",
    note: "The same loop now has jobs: I–vi–IV–V. Roman numerals explain why the pattern still feels related if you move it to another key.",
    example: {
      label: "Homeward Loop · I–vi–IV–V",
      mode: "progression",
      notes: [[48, 52, 55], [45, 48, 52], [53, 57, 60], [55, 59, 62]],
    },
  },
  "5-cadences": {
    name: "Homeward Loop",
    note: "Add one more C after the loop and its final G gains a destination. That V–I arrival is the cadence hiding inside the pattern.",
    example: {
      label: "Homeward Loop · now let V arrive on I",
      mode: "progression",
      notes: [[48, 52, 55], [45, 48, 52], [53, 57, 60], [55, 59, 62], [48, 52, 55]],
    },
  },
  "7-pivot": {
    name: "Homeward Loop",
    note: "Change the third chord from F to D7 and the familiar loop opens a doorway to G. The ear hears a recognizable path taking a new turn.",
    example: {
      label: "Homeward Loop · turn toward G",
      mode: "progression",
      notes: [[48, 52, 55], [45, 48, 52], [50, 54, 57, 60], [55, 59, 62]],
    },
  },
  "8-sevenths": {
    name: "Homeward Loop",
    note: "Keep the roots and enrich the colour: Cmaj7–Am7–Fmaj7–G7. The harmonic route is familiar even though every chord carries an extra note.",
    example: {
      label: "Homeward Loop · seventh-chord colour",
      mode: "progression",
      notes: [
        [48, 52, 55, 59],
        [45, 48, 52, 55],
        [53, 57, 60, 64],
        [55, 59, 62, 65],
      ],
    },
  },
  "8-borrowed": {
    name: "Homeward Loop",
    note: "Borrow one note from C minor: F becomes Fm. The loop stays recognizable while Ab changes the colour of the trip home.",
    example: {
      label: "Homeward Loop · borrowed iv",
      mode: "progression",
      notes: [[48, 52, 55], [45, 48, 52], [53, 56, 60], [55, 59, 62], [48, 52, 55]],
    },
  },

  "6-motion": {
    name: "Crossing Lines",
    note: "Hear two small lines move in opposite directions. This miniature will return when counterpoint asks you to treat each voice as a melody, not chord filler.",
    example: {
      label: "Crossing Lines · contrary motion",
      mode: "progression",
      notes: [[48, 72], [50, 71], [52, 67]],
    },
  },
  "9-line": {
    name: "Crossing Lines",
    note: "The upper voice you once treated as part-writing is now judged as melody in its own right. Listen for its contour before thinking about vertical intervals.",
    example: {
      label: "Crossing Lines · hear the upper line alone",
      mode: "sequence",
      notes: [72, 71, 67, 69, 67, 64, 62, 60],
    },
  },
  "9-close": {
    name: "Crossing Lines",
    note: "The two voices finally converge on a cadence: the bass steps down while the upper voice steps up into the octave.",
    example: {
      label: "Crossing Lines · contrary-motion close",
      mode: "progression",
      notes: [[62, 71], [60, 72]],
    },
  },
};

export function repertoireForUnit(unitId: string): RepertoireMoment | undefined {
  return REPERTOIRE[unitId];
}
