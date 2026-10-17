import { it } from "node:test";
import assert from "node:assert/strict";
import { studiesFor } from "./curriculum.ts";
import { generateCantusFirmus } from "./duel.ts";
import {
  harmonyExercise,
  intervalExerciseForGrade,
  keySignatureExercise,
  relatedKeyExercise,
  rhythmExercise,
  scaleExercise,
  sensoryExercise,
  triadExercise,
} from "./exercises.ts";
import {
  MIN_MIXED_STUDIES,
  createMixedSession,
  mixedStudiesFor,
  type MixedSession,
} from "./mixed-session.ts";
import { rngFor } from "./rng.ts";
import { sessionRng, todayKey } from "./study-session.ts";

const DAY = "2026-10-16";

function draw(session: MixedSession, n: number) {
  return Array.from({ length: n }, () => session.next());
}

/* ------------------------------------------------------------ rng core */

it("rngFor is deterministic per identity and stays in [0, 1)", () => {
  const a = rngFor("study", DAY, "intervals", 0);
  const b = rngFor("study", DAY, "intervals", 0);
  const seqA = Array.from({ length: 8 }, () => a());
  const seqB = Array.from({ length: 8 }, () => b());
  assert.deepEqual(seqA, seqB);
  for (const v of seqA) assert.ok(v >= 0 && v < 1, `value ${v} in range`);
  const other = rngFor("study", DAY, "intervals", 1);
  assert.notDeepEqual(
    Array.from({ length: 8 }, () => other()),
    seqA,
  );
});

it("sessionRng keys on day, topic, and session index", () => {
  const first = (rng: () => number) => Array.from({ length: 5 }, () => rng());
  const base = first(sessionRng("keys", 0, DAY));
  assert.deepEqual(first(sessionRng("keys", 0, DAY)), base);
  assert.notDeepEqual(first(sessionRng("keys", 0, "2026-10-17")), base);
  assert.notDeepEqual(first(sessionRng("keys", 1, DAY)), base);
  assert.notDeepEqual(first(sessionRng("scales", 0, DAY)), base);
  assert.match(todayKey(new Date(2026, 9, 16)), /^2026-10-16$/);
});

/* ------------------------------------------- seeded generator families */

it("every study generator is deterministic under a seeded rng", () => {
  const cases: [string, (rng: () => number) => unknown][] = [
    ["sensory", (rng) => sensoryExercise(rng)],
    ["intervals", (rng) => intervalExerciseForGrade(6, rng)],
    ["triads", (rng) => triadExercise(6, rng)],
    ["rhythm", (rng) => rhythmExercise(4, rng)],
    ["keys", (rng) => keySignatureExercise(4, rng)],
    ["scales", (rng) => scaleExercise(6, rng)],
    ["modulation", (rng) => relatedKeyExercise(rng)],
    ["harmony", (rng) => harmonyExercise(6, rng)],
  ];
  for (const [name, make] of cases) {
    assert.deepEqual(make(rngFor("family", name)), make(rngFor("family", name)), name);
    const distinct = new Set(
      Array.from({ length: 20 }, (_, i) => JSON.stringify(make(rngFor("family", name, i)))),
    );
    assert.ok(distinct.size > 1, `${name} varies across seeds`);
  }
});

it("generateCantusFirmus is deterministic under a seeded rng", () => {
  const a = generateCantusFirmus(5, { rng: rngFor("duel", 7) });
  const b = generateCantusFirmus(5, { rng: rngFor("duel", 7) });
  assert.deepEqual(a, b);
  assert.ok(a.length >= 6 && a.length <= 8, `length ${a.length} in the grade-5 band`);
  assert.equal(a[0]!.midi, a[a.length - 1]!.midi, "cantus starts and ends on the tonic");
});

/* -------------------------------------------------------------- gating */

it("the mixed pool is exactly the unlocked, generator-backed studies", () => {
  for (let grade = 0; grade <= 10; grade++) {
    const unlocked = studiesFor(grade);
    for (const study of mixedStudiesFor({ grade })) {
      assert.ok(
        unlocked.some((u) => u.to === study.route),
        `grade ${grade}: ${study.route} is unlocked`,
      );
      assert.ok(study.level <= grade, `grade ${grade}: ${study.route} level ${study.level} <= grade`);
    }
  }
  assert.deepEqual(
    mixedStudiesFor({ grade: 2 }).map((s) => s.route),
    ["/sensory", "/rhythm"],
  );
  assert.deepEqual(
    mixedStudiesFor({ grade: 10 }).map((s) => s.route),
    ["/sensory", "/rhythm", "/scale", "/circle", "/interval", "/triad", "/cadence"],
  );
});

it("a fresh learner gets no session — the locked state, not a leak", () => {
  // Grade 0–1 unlock Listening only: below MIN_MIXED_STUDIES the factory
  // refuses, so nothing at all can be served, let alone advanced material.
  for (const grade of [0, 1]) {
    assert.ok(mixedStudiesFor({ grade }).length < MIN_MIXED_STUDIES);
    assert.equal(createMixedSession({ grade }, { day: DAY, sessionIndex: 0 }), null);
  }
});

it("sessions never serve material from a locked study", () => {
  for (let grade = 2; grade <= 10; grade++) {
    const session = createMixedSession({ grade }, { day: DAY, sessionIndex: 0 });
    assert.ok(session, `grade ${grade} opens a session`);
    const allowed = new Set(studiesFor(grade).map((s) => s.to));
    for (const { exercise, study, topicId } of draw(session, 40)) {
      assert.ok(allowed.has(study.route), `grade ${grade}: ${study.route} unlocked`);
      assert.ok(study.level <= grade, `grade ${grade}: ${study.route} not ahead of grade`);
      assert.equal(exercise.metadata?.topicId, topicId);
      assert.equal(exercise.metadata?.studyRoute, study.route);
      assert.ok(exercise.options.includes(exercise.correctAnswer), "answer is among options");
    }
  }
  // The lowest open grade serves only Listening + Rhythm material.
  const first = createMixedSession({ grade: 2 }, { day: DAY, sessionIndex: 0 })!;
  const types = new Set(draw(first, 40).map((d) => d.exercise.type));
  assert.deepEqual([...types].sort(), ["dynamics", "pitch", "rhythm", "timbre"]);
});

/* ------------------------------------------- determinism and variety */

it("a mixed session is a pure function of (grade, day, session index)", () => {
  const a = createMixedSession({ grade: 7 }, { day: DAY, sessionIndex: 0 })!;
  const b = createMixedSession({ grade: 7 }, { day: DAY, sessionIndex: 0 })!;
  const seqA = draw(a, 60).map((d) => JSON.stringify(d.exercise));
  const seqB = draw(b, 60).map((d) => JSON.stringify(d.exercise));
  assert.deepEqual(seqA, seqB);
  const c = createMixedSession({ grade: 7 }, { day: DAY, sessionIndex: 1 })!;
  const seqC = draw(c, 60).map((d) => JSON.stringify(d.exercise));
  assert.notDeepEqual(seqC, seqA);
});

it("dealing is even and non-clumping across a long session", () => {
  const session = createMixedSession({ grade: 10 }, { day: DAY, sessionIndex: 0 })!;
  const served = draw(session, 210);
  const counts = new Map<string, number>();
  let run = 1;
  let maxRun = 1;
  for (let i = 0; i < served.length; i++) {
    const route = served[i]!.study.route;
    counts.set(route, (counts.get(route) ?? 0) + 1);
    if (i > 0) {
      run = served[i - 1]!.study.route === route ? run + 1 : 1;
      maxRun = Math.max(maxRun, run);
    }
  }
  assert.equal(counts.size, 7, "every unlocked study appears");
  for (const [route, count] of counts) {
    assert.ok(count >= 25, `${route} dealt ${count} times in 210 (bag-even)`);
  }
  assert.ok(maxRun <= 2, `longest same-study run is ${maxRun}, never a clump`);
  const distinct = new Set(served.map((d) => JSON.stringify(d.exercise)));
  assert.ok(distinct.size >= 120, `${distinct.size} distinct exercises in 210 deals`);
});

/* --------------------------------------- adaptivity Phase 1: weighting */

import { selectBoost, studyWeight } from "./mixed-session.ts";
import type { TopicId } from "./curriculum.ts";

type Weights = Partial<Record<TopicId, number>>;

function studyCounts(session: MixedSession, n: number) {
  const counts = new Map<string, number>();
  for (const { study } of draw(session, n)) {
    counts.set(study.route, (counts.get(study.route) ?? 0) + 1);
  }
  return counts;
}

it("NeutralWeightsIdentity: neutral weights deal the unweighted session, item for item", () => {
  const neutral: Weights = {
    sensory: 1,
    rhythm: 1,
    scales: 1,
    keys: 1,
    intervals: 1,
    triads: 1,
    harmony: 1,
    modulation: 1,
  };
  for (const [grade, sessionIndex] of [
    [2, 0],
    [7, 0],
    [10, 3],
  ] as const) {
    const plain = createMixedSession({ grade }, { day: DAY, sessionIndex })!;
    const empty = createMixedSession({ grade, weights: {} }, { day: DAY, sessionIndex })!;
    const weighted = createMixedSession({ grade, weights: neutral }, { day: DAY, sessionIndex })!;
    const seq = (s: MixedSession) => draw(s, 60).map((d) => JSON.stringify(d.exercise));
    const plainSeq = seq(plain);
    assert.deepEqual(seq(weighted), plainSeq, `grade ${grade} index ${sessionIndex}`);
    assert.deepEqual(seq(empty), plainSeq, `grade ${grade} index ${sessionIndex} (empty)`);
  }
});

it("ExtraSlotCap + FullCoverageBag: one extra slot per bag, nobody loses theirs", () => {
  // Grade 10 pool is 7 studies; a weighted bag is 8. 80 draws = 10 bags.
  const session = createMixedSession(
    { grade: 10, weights: { intervals: 2 } },
    { day: DAY, sessionIndex: 0 },
  )!;
  const counts = studyCounts(session, 80);
  assert.equal(counts.get("/interval"), 20, "boosted study: exactly 2 per bag");
  for (const route of ["/sensory", "/rhythm", "/scale", "/circle", "/triad", "/cadence"]) {
    assert.equal(counts.get(route), 10, `${route}: its guaranteed slot, every bag`);
  }
  // A weight barely above neutral earns the same single extra slot —
  // the weight selects, the cap sizes.
  const gentle = createMixedSession(
    { grade: 10, weights: { intervals: 1.25 } },
    { day: DAY, sessionIndex: 0 },
  )!;
  assert.equal(studyCounts(gentle, 80).get("/interval"), 20);
});

it("ExtraSlotCap holds with several weak topics — one boost, chosen by weight then pool order", () => {
  // Two topics at the maximum weight: only one extra slot exists, and
  // the tie breaks toward the study earliest in curriculum order
  // (Intervals sits before Triads in the pool) — deterministically.
  const tied = createMixedSession(
    { grade: 10, weights: { intervals: 2, triads: 2 } },
    { day: DAY, sessionIndex: 0 },
  )!;
  const tiedCounts = studyCounts(tied, 80);
  assert.equal(tiedCounts.get("/interval"), 20);
  assert.equal(tiedCounts.get("/triad"), 10);
  // A strictly heavier topic beats an earlier lighter one.
  const heavier = createMixedSession(
    { grade: 10, weights: { intervals: 1.5, triads: 2 } },
    { day: DAY, sessionIndex: 0 },
  )!;
  const heavierCounts = studyCounts(heavier, 80);
  assert.equal(heavierCounts.get("/triad"), 20);
  assert.equal(heavierCounts.get("/interval"), 10);
});

it("selectBoost names the driving topic and stays null at neutral", () => {
  const studies = mixedStudiesFor({ grade: 10 });
  assert.equal(selectBoost(studies, undefined), null);
  assert.equal(selectBoost(studies, {}), null);
  assert.equal(selectBoost(studies, { intervals: 1 }), null);
  const byModulation = selectBoost(studies, { modulation: 2, keys: 1.5 });
  assert.equal(byModulation?.study.route, "/circle");
  assert.equal(byModulation?.topicId, "modulation");
  const circle = studies.find((s) => s.route === "/circle")!;
  assert.equal(studyWeight(circle, { keys: 1.5 }), 1.5);
  assert.equal(studyWeight(circle, { modulation: 2 }), 2);
  assert.equal(studyWeight(circle, undefined), 1);
});

it("PoolsAreGiven: weights reweight the pool the gate produced — nothing more", () => {
  const allWeak: Weights = {
    sensory: 2,
    rhythm: 2,
    scales: 2,
    keys: 2,
    intervals: 2,
    triads: 2,
    harmony: 2,
    modulation: 2,
  };
  for (let grade = 2; grade <= 10; grade++) {
    const session = createMixedSession({ grade, weights: allWeak }, { day: DAY, sessionIndex: 0 })!;
    const pool = new Set(mixedStudiesFor({ grade }).map((s) => s.route));
    for (const { study } of draw(session, 60)) {
      assert.ok(pool.has(study.route), `grade ${grade}: ${study.route} is in the gated pool`);
    }
  }
  // Weighting a locked study cannot pull it into a low-grade pool…
  const low = createMixedSession(
    { grade: 2, weights: { triads: 2 } },
    { day: DAY, sessionIndex: 0 },
  )!;
  assert.deepEqual(
    [...studyCounts(low, 40).keys()].sort(),
    ["/rhythm", "/sensory"],
  );
  // …and weights cannot open a session the gate keeps closed.
  assert.equal(createMixedSession({ grade: 1, weights: allWeak }, { day: DAY, sessionIndex: 0 }), null);
});

it("StableWithinEpisode: the boost is frozen at creation, whatever changes later", () => {
  const weights: Weights = { intervals: 2 };
  const session = createMixedSession({ grade: 10, weights }, { day: DAY, sessionIndex: 0 })!;
  // Mutating the weights record after creation — as answering questions
  // would mutate the save — must not re-weight the running session.
  weights.intervals = 1;
  weights.triads = 2;
  const counts = studyCounts(session, 80);
  assert.equal(counts.get("/interval"), 20, "the original boost still deals");
  assert.equal(counts.get("/triad"), 10, "the later change does not");
  // A fresh session from an identical weights object replays exactly.
  const replay = createMixedSession(
    { grade: 10, weights: { intervals: 2 } },
    { day: DAY, sessionIndex: 0 },
  )!;
  const again = createMixedSession(
    { grade: 10, weights: { intervals: 2 } },
    { day: DAY, sessionIndex: 0 },
  )!;
  assert.deepEqual(
    draw(replay, 60).map((d) => JSON.stringify(d.exercise)),
    draw(again, 60).map((d) => JSON.stringify(d.exercise)),
  );
});

it("a weighted session stays varied and never clumps past a run of two", () => {
  const session = createMixedSession(
    { grade: 10, weights: { intervals: 2 } },
    { day: DAY, sessionIndex: 0 },
  )!;
  const served = draw(session, 210);
  const counts = new Map<string, number>();
  let run = 1;
  let maxRun = 1;
  for (let i = 0; i < served.length; i++) {
    const route = served[i]!.study.route;
    counts.set(route, (counts.get(route) ?? 0) + 1);
    if (i > 0) {
      run = served[i - 1]!.study.route === route ? run + 1 : 1;
      maxRun = Math.max(maxRun, run);
    }
  }
  assert.equal(counts.size, 7, "every unlocked study still appears");
  for (const [route, count] of counts) {
    assert.ok(count >= 25, `${route} dealt ${count} times in 210 (floor holds under weighting)`);
  }
  assert.ok(maxRun <= 2, `longest same-study run is ${maxRun} with a boost active`);
});
