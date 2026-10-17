import { studiesFor, type AppRoute, type TopicId } from "./curriculum.ts";
import {
  harmonyExercise,
  intervalExerciseForGrade,
  keySignatureExercise,
  relatedKeyExercise,
  rhythmExercise,
  scaleExercise,
  sensoryExercise,
  triadExercise,
  type Exercise,
} from "./exercises.ts";
import { rngFor } from "./rng.ts";
import { todayKey } from "./study-session.ts";

/**
 * Mixed practice — the endless session (generated-practice Phase 3).
 *
 * The picker shape follows the original app's endless mode — choose a
 * family, deal a fresh item — but the pool is gated exactly the way the
 * Studies screens are gated today: a study enters the mix only when
 * `studiesFor(grade)` unlocks it, and every item is dealt by the same
 * grade-scoped generator the study's own screen uses. Nothing is served
 * from a locked study, ever; with fewer than two unlocked studies there
 * is no mix to make, and the factory returns null so the screen can say
 * so honestly instead of leaking a single-study (or worse, an
 * ahead-of-grade) session.
 *
 * Scope is an argument, not a lookup: today it carries the learner's
 * grade, and every generator below consumes scope — the same parameter
 * the adaptivity phase will later fill from performance evidence
 * (conceptPractice recency, heatmap) without touching this file's shape.
 */

export type MixedScope = {
  /** The learner's current grade level (0–10). */
  grade: number;
};

export type MixedStudy = {
  route: AppRoute;
  label: string;
  /** Curriculum level that unlocks this study. */
  level: number;
  /** Deal one item for this study, tagged with the topic it evidences. */
  make: (scope: MixedScope, rng: () => number) => { exercise: Exercise; topicId: TopicId };
};

/** A mixed session needs at least two studies to be a mix at all. */
export const MIN_MIXED_STUDIES = 2;

type RegistryEntry = {
  route: AppRoute;
  make: MixedStudy["make"];
};

/**
 * The generator-backed studies, in curriculum order. Only studies whose
 * own screens deal `Exercise`s from `exercises.ts` belong here — note
 * reading (/practice) runs on its own spaced-repetition queue, the duel
 * is a rule-engine surface, and realtime/heatmap/curriculum have no
 * exercise generator; they stay out of the mix by construction.
 */
const REGISTRY: RegistryEntry[] = [
  {
    route: "/sensory",
    make: (_scope, rng) => ({ exercise: sensoryExercise(rng), topicId: "sensory" }),
  },
  {
    route: "/rhythm",
    make: (scope, rng) => ({ exercise: rhythmExercise(scope.grade, rng), topicId: "rhythm" }),
  },
  {
    route: "/scale",
    make: (scope, rng) => ({ exercise: scaleExercise(scope.grade, rng), topicId: "scales" }),
  },
  {
    route: "/circle",
    // Mirrors circle-screen.tsx: at grade 7+ half the deals are the
    // closely-related-keys drill; before that, key signatures only.
    make: (scope, rng) =>
      scope.grade >= 7 && rng() < 0.5
        ? { exercise: relatedKeyExercise(rng), topicId: "modulation" }
        : {
            exercise: keySignatureExercise(scope.grade >= 7 ? 6 : 4, rng),
            topicId: "keys",
          },
  },
  {
    route: "/interval",
    make: (scope, rng) => ({
      exercise: intervalExerciseForGrade(scope.grade, rng),
      topicId: "intervals",
    }),
  },
  {
    route: "/triad",
    make: (scope, rng) => ({ exercise: triadExercise(scope.grade, rng), topicId: "triads" }),
  },
  {
    route: "/cadence",
    make: (scope, rng) => ({ exercise: harmonyExercise(scope.grade, rng), topicId: "harmony" }),
  },
];

const BY_ROUTE = new Map(REGISTRY.map((entry) => [entry.route, entry]));

/**
 * The studies the mixed session may draw from for this scope — the
 * `studiesFor` gate, restricted to generator-backed studies, in
 * curriculum order.
 */
export function mixedStudiesFor(scope: MixedScope): MixedStudy[] {
  const out: MixedStudy[] = [];
  for (const study of studiesFor(scope.grade)) {
    const entry = BY_ROUTE.get(study.to);
    if (entry) out.push({ route: study.to, label: study.label, level: study.level, make: entry.make });
  }
  return out;
}

export type MixedSession = {
  /** The gated pool this session draws from. */
  studies: MixedStudy[];
  /** How many items have been dealt so far. */
  draws: number;
  /**
   * Deal the next item. The whole session is a pure function of
   * (scope, day, sessionIndex): a refresh replays the same session from
   * the top, and no state is stored anywhere.
   */
  next: () => { exercise: Exercise; study: MixedStudy; topicId: TopicId };
};

/**
 * Build a mixed session, or null when the learner has unlocked fewer
 * than {@link MIN_MIXED_STUDIES} generator-backed studies — the honest
 * "not yet" state a fresh learner (grade 0–1: Listening only) gets.
 */
export function createMixedSession(
  scope: MixedScope,
  opts: { day?: string; sessionIndex?: number } = {},
): MixedSession | null {
  const studies = mixedStudiesFor(scope);
  if (studies.length < MIN_MIXED_STUDIES) return null;

  const day = opts.day ?? todayKey();
  const sessionIndex = opts.sessionIndex ?? 0;
  const master = rngFor("mixed", day, sessionIndex, scope.grade);

  // Shuffle-bag dealing: every study appears once per bag, so a session
  // covers the whole unlocked pool evenly and never clumps — a study can
  // repeat only across a bag boundary, never twice in a row.
  let bag: MixedStudy[] = [];
  let lastServed: MixedStudy | null = null;
  const refill = () => {
    bag = [...studies];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(master() * (i + 1));
      [bag[i], bag[j]] = [bag[j]!, bag[i]!];
    }
    if (bag.length > 1 && bag[0] === lastServed) {
      [bag[0], bag[1]] = [bag[1]!, bag[0]!];
    }
  };
  refill();

  let draws = 0;
  return {
    studies,
    get draws() {
      return draws;
    },
    next() {
      if (bag.length === 0) refill();
      const study = bag.shift()!;
      lastServed = study;
      // Each item's rng is seeded by its own draw index, so an item is
      // reproducible on its own and independent of dealing internals.
      const itemRng = rngFor("mixed-item", day, sessionIndex, draws);
      const { exercise, topicId } = study.make(scope, itemRng);
      exercise.metadata = { ...exercise.metadata, topicId, studyRoute: study.route };
      draws++;
      return { exercise, study, topicId };
    },
  };
}
