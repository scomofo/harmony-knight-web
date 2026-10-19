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
 * grade, and every generator below consumes scope. Adaptivity Phase 1
 * fills the scope's other field — per-topic `weights`, derived by
 * `adapt.ts` from the persisted mastery records — and the shuffle-bag
 * below deals at most one extra slot per bag to the weakest weighted
 * study. The generators still see only the grade; weighting changes
 * how often a study is dealt, never what it can deal.
 */

export type MixedScope = {
  /** The learner's current grade level (0–10). */
  grade: number;
  /**
   * Per-topic emphasis weights from `adapt.ts` (adaptivity Phase 1).
   * Optional: absent, empty, or all-1 weights deal exactly as the
   * unweighted session always has (`NeutralWeightsIdentity`). A weight
   * above 1 can earn its study at most one extra slot per bag
   * (`ExtraSlotCap`); weights never add or remove a study
   * (`PoolsAreGiven`, `FullCoverageBag`).
   */
  weights?: Partial<Record<TopicId, number>>;
};

export type MixedStudy = {
  route: AppRoute;
  label: string;
  /** Curriculum level that unlocks this study. */
  level: number;
  /** The topics this study's items evidence (the circle study serves two). */
  topics: TopicId[];
  /** Deal one item for this study, tagged with the topic it evidences. */
  make: (scope: MixedScope, rng: () => number) => { exercise: Exercise; topicId: TopicId };
};

/** A mixed session needs at least two studies to be a mix at all. */
export const MIN_MIXED_STUDIES = 2;

type RegistryEntry = {
  route: AppRoute;
  topics: TopicId[];
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
    topics: ["sensory"],
    make: (_scope, rng) => ({ exercise: sensoryExercise(rng), topicId: "sensory" }),
  },
  {
    route: "/rhythm",
    topics: ["rhythm"],
    make: (scope, rng) => ({ exercise: rhythmExercise(scope.grade, rng), topicId: "rhythm" }),
  },
  {
    route: "/scale",
    topics: ["scales"],
    make: (scope, rng) => ({ exercise: scaleExercise(scope.grade, rng), topicId: "scales" }),
  },
  {
    route: "/circle",
    topics: ["keys", "modulation"],
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
    topics: ["intervals"],
    make: (scope, rng) => ({
      exercise: intervalExerciseForGrade(scope.grade, rng),
      topicId: "intervals",
    }),
  },
  {
    route: "/triad",
    topics: ["triads"],
    make: (scope, rng) => ({ exercise: triadExercise(scope.grade, rng), topicId: "triads" }),
  },
  {
    route: "/cadence",
    topics: ["harmony"],
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
    if (entry)
      out.push({
        route: study.to,
        label: study.label,
        level: study.level,
        topics: entry.topics,
        make: entry.make,
      });
  }
  return out;
}

/** A study's emphasis weight: the highest weight among the topics it evidences. */
export function studyWeight(
  study: MixedStudy,
  weights: Partial<Record<TopicId, number>> | undefined,
): number {
  if (!weights) return 1;
  let weight = 1;
  for (const topic of study.topics) weight = Math.max(weight, weights[topic] ?? 1);
  return weight;
}

export type MixedBoost = {
  study: MixedStudy;
  /** The topic whose weight earned the extra slot (what the screen names). */
  topicId: TopicId;
  weight: number;
};

/**
 * The one study a weighted bag emphasises, or null when every weight is
 * neutral. At most one study is ever boosted (`ExtraSlotCap`): the
 * highest weight wins, and ties break deterministically — first toward
 * the study earliest in curriculum (pool) order, and within a study
 * toward its earliest listed topic. A tie therefore never depends on
 * iteration order, the clock, or the session's rng.
 */
export function selectBoost(
  studies: MixedStudy[],
  weights: Partial<Record<TopicId, number>> | undefined,
): MixedBoost | null {
  if (!weights) return null;
  let best: MixedBoost | null = null;
  for (const study of studies) {
    for (const topicId of study.topics) {
      const weight = weights[topicId] ?? 1;
      if (weight > 1 && (best === null || weight > best.weight)) {
        best = { study, topicId, weight };
      }
    }
  }
  return best;
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

  // Adaptivity Phase 1: the boost is selected once, here, from the
  // weights the caller froze into the scope (`StableWithinEpisode`) —
  // a session in progress never re-weights, whatever the learner does
  // while it runs. Null boost → the dealing below is the original
  // shuffle-bag, untouched (`NeutralWeightsIdentity`).
  const boost = selectBoost(studies, scope.weights);

  // Shuffle-bag dealing: every study appears once per bag, so a session
  // covers the whole unlocked pool evenly and never clumps — a study can
  // repeat only across a bag boundary, never twice in a row. Weighting
  // is additive-only (`FullCoverageBag`): a boosted study gains exactly
  // one extra copy in each bag (`ExtraSlotCap`), inserted so its two
  // copies are never adjacent and never straddle a boundary — the
  // boosted study's longest run is two, like any boundary repeat.
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
    if (boost) {
      const extra = boost.study;
      // An insertion index is clean when neither neighbour is the
      // boosted study and, at the head of the bag, the study served
      // last from the previous bag isn't either.
      const clean: number[] = [];
      for (let i = 0; i <= bag.length; i++) {
        if (bag[i - 1] === extra || bag[i] === extra) continue;
        if (i === 0 && lastServed === extra) continue;
        clean.push(i);
      }
      // The only way no index is clean is a two-study pool whose other
      // study sits between the boosted study and the boundary on both
      // sides; appending then still caps the run at two.
      const at =
        clean.length > 0
          ? clean[Math.floor(master() * clean.length)]!
          : bag.length;
      bag.splice(at, 0, extra);
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
