import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CADENCES,
  KEYS,
  TONIC_MIDI,
  closelyRelatedKeys,
  diatonicTriad,
  keySignatureAccidentals,
  staffStepsFromC4,
  voiceNear,
  BASS_CLEF_STEP_OFFSET,
} from "./music.ts";
import {
  cadenceExercise,
  intervalExercise,
  intervalExerciseForGrade,
  keySignatureExercise,
  relatedKeyExercise,
  rhythmExercise,
  rhythmPatternsForGrade,
  romanNumeralExercise,
  scaleExercise,
  sensoryExercise,
  triadExercise,
} from "./exercises.ts";
import { onsetsMs, scoreTaps } from "./rhythm.ts";
import {
  CURRICULUM,
  GRADE_THRESHOLDS,
  isStudyUnlocked,
  studiesFor,
  topicCountsForGrade,
} from "./curriculum.ts";
import { LESSONS, lessonFor } from "./lessons.ts";
import { buildNotePool, PracticeQuestionEngine } from "./practice.ts";
import { noteReviewPlan, recordNoteAttempt, weakNotesFor } from "./review.ts";
import { newSRItem, type SRItem } from "./sr.ts";
import { gradeProgress, useGameStore } from "./store.ts";
import { playMidiSequence, setMasterGain, stopTones, unlockAudio } from "./audio.ts";
import { COURSE_UNITS, unitById, unitsForLevel } from "./course.ts";
import {
  advanceUnit,
  answerUnit,
  dueUnits,
  freshUnitProgress,
  localDayKey,
  nextUnit,
  weekDays,
} from "./learning.ts";

describe("focused curriculum and saved learning", () => {
  const unit = COURSE_UNITS[0]!;
  const now = new Date("2026-09-05T12:00:00Z");
  function finish(correct = true) {
    let p = freshUnitProgress();
    p = advanceUnit(unit, p, now);
    p = advanceUnit(unit, p, now);
    for (const q of unit.checks) {
      p = answerUnit(unit, p, correct ? q.answer : q.options.find((a) => a !== q.answer)!);
      p = advanceUnit(unit, p, now);
    }
    return p;
  }

  it("provides 44 complete lessons with 88 unambiguous checks across all 11 chapters", () => {
    assert.equal(COURSE_UNITS.length, 44);
    assert.equal(new Set(COURSE_UNITS.map((u) => u.id)).size, 44);
    assert.equal(COURSE_UNITS.flatMap((u) => u.checks).length, 88);
    for (const level of CURRICULUM) assert.equal(unitsForLevel(level.level).length, 4);
    for (const u of COURSE_UNITS) {
      assert.ok(u.body.length > 120 && u.tryIt.length > 70 && u.goal.length > 10, u.id);
      for (const q of u.checks) {
        assert.equal(q.options.filter((a) => a === q.answer).length, 1, q.prompt);
        assert.equal(new Set(q.options).size, q.options.length, q.prompt);
        assert.ok(q.why.length > 20, q.prompt);
      }
      if (u.example) {
        const notes = u.example.notes.flat();
        assert.ok(
          notes.every((n) => Number.isInteger(n) && n >= 0 && n <= 127),
          u.id,
        );
        if (u.example.volumes) assert.equal(u.example.volumes.length, notes.length);
      }
    }
  });

  it("keeps half-step and seventh-chord audio faithful to their teaching", () => {
    assert.deepEqual(unitById("1-steps")!.example!.notes, [60, 61, 60, 62]);
    assert.deepEqual(unitById("8-sevenths")!.example!.notes, [
      [60, 64, 67, 71],
      [60, 64, 67, 70],
      [60, 63, 67, 70],
      [60, 63, 66, 70],
    ]);
    const dynamics = unitById("0-dynamics")!.example!;
    assert.deepEqual(dynamics.notes, [64, 64]);
    assert.ok(dynamics.volumes![0]! < dynamics.volumes![1]!);
  });

  it("requires both answered checks and preserves the original answer after a reveal", () => {
    let p = freshUnitProgress();
    assert.equal(answerUnit(unit, p, unit.checks[0]!.answer), p);
    p = advanceUnit(unit, advanceUnit(unit, p, now), now);
    assert.equal(advanceUnit(unit, p, now), p);
    assert.equal(answerUnit(unit, p, "invented answer"), p);
    const wrong = unit.checks[0]!.options.find((a) => a !== unit.checks[0]!.answer)!;
    p = answerUnit(unit, p, wrong);
    assert.equal(answerUnit(unit, p, unit.checks[0]!.answer).answers[0], wrong);
    p = advanceUnit(unit, p, now);
    assert.equal(p.completedAt, null);
    assert.equal(advanceUnit(unit, p, now), p);
    assert.equal(finish(false).step, 4, "Corrections are learning, not a permanent lock");
  });

  it("schedules only learned lessons and advances due independent recall from 1 to 3 to 7 days", () => {
    let p = finish();
    const progress = { [unit.id]: p };
    assert.equal(dueUnits(progress, now).length, 0);
    assert.equal(dueUnits(progress, new Date(p.nextReviewAt!))[0]?.id, unit.id);
    for (const expected of [3, 7]) {
      const reviewAt = new Date(p.nextReviewAt!);
      p = { ...p, step: 2, answers: {}, reviewing: true };
      for (const q of unit.checks) {
        p = answerUnit(unit, p, q.answer);
        p = advanceUnit(unit, p, reviewAt);
      }
      assert.equal(p.intervalDays, expected);
    }
    assert.equal(p.reviewCount, 2);
  });

  it("shortens due assisted reviews and gives no extra scheduling credit for early repeats", () => {
    const completed = finish();
    let repeat = {
      ...completed,
      step: 3,
      answers: { 0: unit.checks[0]!.answer, 1: unit.checks[1]!.answer },
      reviewing: true,
    };
    const early = advanceUnit(unit, repeat, now);
    assert.equal(early.nextReviewAt, completed.nextReviewAt);
    assert.equal(early.reviewCount, 0);
    const assisted = advanceUnit(
      unit,
      { ...repeat, intervalDays: 7, assisted: true },
      new Date(completed.nextReviewAt!),
    );
    assert.equal(assisted.intervalDays, 1);
    const wrong = advanceUnit(
      unit,
      {
        ...repeat,
        intervalDays: 7,
        answers: {
          ...repeat.answers,
          1: unit.checks[1]!.options.find((a) => a !== unit.checks[1]!.answer)!,
        },
      },
      new Date(completed.nextReviewAt!),
    );
    assert.equal(wrong.intervalDays, 1);
  });

  it("resumes an unfinished advanced lesson and handles completion of the entire path", () => {
    const advanced = COURSE_UNITS.at(-1)!;
    assert.equal(nextUnit({ [advanced.id]: freshUnitProgress() }, advanced.id)?.id, advanced.id);
    assert.equal(nextUnit({}, "removed-id")?.id, unit.id);
    const fugue = unitById("10-fugue")!;
    assert.equal(nextUnit({ [fugue.id]: finish() }, fugue.id)?.id, "10-development");
    const completed = Object.fromEntries(COURSE_UNITS.map((u) => [u.id, finish()]));
    assert.equal(nextUnit(completed), undefined);
  });

  it("awards completion once, preserves checkpoints, and keeps learning separate from grade trials", () => {
    useGameStore.getState().resetProgress();
    useGameStore.setState({ gradeLevel: 7, lessonsRead: [1, 2], recentAtGrade: [true, false] });
    const s = useGameStore.getState();
    s.openUnit(unit.id);
    s.advanceLearningUnit(unit.id);
    s.advanceLearningUnit(unit.id);
    s.answerLearningUnit(unit.id, unit.checks[0]!.answer);
    s.openUnit(unit.id);
    assert.equal(useGameStore.getState().unitProgress[unit.id]!.answers[0], unit.checks[0]!.answer);
    s.advanceLearningUnit(unit.id);
    s.answerLearningUnit(unit.id, unit.checks[1]!.answer);
    s.advanceLearningUnit(unit.id);
    s.advanceLearningUnit(unit.id);
    assert.equal(useGameStore.getState().harmonyPoints, 25);
    s.revisitUnit(unit.id, true);
    for (const q of unit.checks) {
      s.answerLearningUnit(unit.id, q.answer);
      s.advanceLearningUnit(unit.id);
    }
    const saved = useGameStore.getState();
    assert.equal(saved.harmonyPoints, 25);
    assert.equal(saved.gradeLevel, 7);
    assert.deepEqual(saved.recentAtGrade, [true, false]);
    assert.deepEqual(saved.lessonsRead, [1, 2]);
    assert.equal(saved.learningDays.length, 1);
  });

  it("merges old saves without losing existing grades, history or settings", () => {
    useGameStore.getState().resetProgress();
    const current = useGameStore.getState();
    const merge = useGameStore.persist.getOptions().merge!;
    const legacy = {
      gradeLevel: 8,
      harmonyPoints: 321,
      lessonsRead: [0, 1],
      settings: { muted: true, sessionMinutes: 12 },
      heatmap: { 60: { attempts: 5, correct: 4 } },
    };
    const merged = merge(JSON.parse(JSON.stringify(legacy)), current);
    assert.equal(merged.gradeLevel, 8);
    assert.equal(merged.harmonyPoints, 321);
    assert.deepEqual(merged.lessonsRead, [0, 1]);
    assert.equal(merged.settings.muted, true);
    assert.equal(merged.settings.sessionMinutes, 12);
    assert.equal(merged.settings.focusMode, true);
    assert.equal(merged.heatmap[60]!.correct, 4);
    assert.deepEqual(merged.unitProgress, {});
    assert.equal(typeof merged.openUnit, "function");
    const modern = merge(
      JSON.parse(
        JSON.stringify({
          unitProgress: {
            [unit.id]: { ...freshUnitProgress(), step: 2, answers: { 0: unit.checks[0]!.answer } },
          },
          activeUnitId: unit.id,
        }),
      ),
      current,
    );
    assert.equal(modern.unitProgress[unit.id]!.step, 2);
    assert.equal(modern.unitProgress[unit.id]!.answers[0], unit.checks[0]!.answer);
    assert.equal(modern.activeUnitId, unit.id);
  });

  it("welcomes returning learners without a recovery debt or changed earned progress", () => {
    useGameStore.getState().resetProgress();
    useGameStore.setState({
      currentStreak: 12,
      harmonyPoints: 90,
      lastActiveAt: "2020-01-01T00:00:00Z",
      inBrokenBladeRecovery: true,
    });
    useGameStore.getState().hydrateDay();
    assert.equal(useGameStore.getState().inBrokenBladeRecovery, false);
    assert.equal(useGameStore.getState().currentStreak, 12);
    assert.equal(useGameStore.getState().harmonyPoints, 90);
  });

  it("uses local calendar days and a Monday-based week across month boundaries", () => {
    const sunday = new Date(2026, 2, 1, 12);
    assert.equal(localDayKey(sunday), "2026-03-01");
    assert.deepEqual(
      weekDays(sunday).map((d) => d.key),
      [
        "2026-02-23",
        "2026-02-24",
        "2026-02-25",
        "2026-02-26",
        "2026-02-27",
        "2026-02-28",
        "2026-03-01",
      ],
    );
  });
});

const repeat = (n: number, fn: () => void) => {
  for (let i = 0; i < n; i++) fn();
};

describe("teaching audio", () => {
  it("honours mute before the first tone, varies example dynamics, and cancels queued notes", () => {
    const oscillators: { stops: (number | undefined)[]; startAt: number }[] = [];
    const envelopes: number[][] = [];
    const param = () => ({
      value: 0,
      setValueAtTime() {},
      exponentialRampToValueAtTime() {},
      setTargetAtTime(value: number) {
        this.value = value;
      },
    });
    class TestAudioContext {
      state = "running";
      currentTime = 0;
      destination = {};
      createGain() {
        const ramps: number[] = [];
        envelopes.push(ramps);
        return {
          gain: {
            ...param(),
            exponentialRampToValueAtTime(value: number) {
              ramps.push(value);
            },
          },
          connect() {},
          disconnect() {},
        };
      }
      createOscillator() {
        const record = { stops: [] as (number | undefined)[], startAt: 0 };
        oscillators.push(record);
        return {
          frequency: param(),
          connect() {},
          disconnect() {},
          type: "triangle",
          onended: null,
          start(time: number) {
            record.startAt = time;
          },
          stop(time?: number) {
            record.stops.push(time);
          },
        };
      }
      createBiquadFilter() {
        return { frequency: param(), connect() {}, disconnect() {}, type: "lowpass" };
      }
    }
    const original = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      value: { AudioContext: TestAudioContext },
      configurable: true,
    });
    try {
      setMasterGain(0);
      const bus = unlockAudio();
      assert.equal(bus.master.gain.value, 0);
      setMasterGain(0.5);
      assert.equal(bus.master.gain.value, 0.25);
      playMidiSequence([64, 64], 0.42, 0.5, [0.25, 0.85]);
      // Three master buses, then three layered oscillators per note.
      assert.ok(envelopes[3]![0]! < envelopes[6]![0]!, "Second note must have the larger envelope");
      assert.ok(oscillators.some((o) => o.startAt > 0));
      stopTones();
      assert.ok(
        oscillators.every((o) => o.stops.at(-1) === undefined),
        "All queued tones should stop immediately",
      );
      const stopped = oscillators.map((o) => o.stops.length);
      stopTones();
      assert.deepEqual(
        oscillators.map((o) => o.stops.length),
        stopped,
        "Stopping is idempotent",
      );
    } finally {
      if (original) Object.defineProperty(globalThis, "window", original);
      else Reflect.deleteProperty(globalThis, "window");
    }
  });
});

describe("music theory helpers", () => {
  it("places sharps on their natural note's staff step", () => {
    for (const natural of [60, 62, 65, 67, 69]) {
      assert.equal(staffStepsFromC4(natural + 1), staffStepsFromC4(natural));
    }
  });
  it("writes key signatures in the conventional order", () => {
    const d = KEYS.find((k) => k.name === "D Major")!;
    assert.deepEqual(keySignatureAccidentals(d), ["F#", "C#"]);
    const eb = KEYS.find((k) => k.name === "Eb Major")!;
    assert.deepEqual(keySignatureAccidentals(eb), ["Bb", "Eb", "Ab"]);
    assert.deepEqual(keySignatureAccidentals(KEYS[0]!), []);
  });

  it("finds closely related keys one step around the circle", () => {
    assert.deepEqual(closelyRelatedKeys("C").sort(), ["F", "G"]);
    assert.deepEqual(closelyRelatedKeys("F").sort(), ["Bb", "C"]);
  });

  it("builds diatonic triads with the right qualities in C major", () => {
    assert.deepEqual(diatonicTriad(60, 0), [60, 64, 67]); // I major
    assert.deepEqual(diatonicTriad(60, 1), [62, 65, 69]); // ii minor
    assert.deepEqual(diatonicTriad(60, 4), [67, 71, 74]); // V major
    assert.deepEqual(diatonicTriad(60, 6), [71, 74, 77]); // vii° diminished
  });

  it("keeps voiced chords within a fifth of the centre", () => {
    for (const midi of voiceNear([67, 71, 74], 65)) {
      assert.ok(Math.abs(midi - 65) <= 7, `${midi} too far from centre`);
    }
  });

  it("places bass-clef notes on the same lines as treble once offset", () => {
    // G2 is the bottom line of the bass staff, E4 the bottom line of treble.
    assert.equal(staffStepsFromC4(43) + BASS_CLEF_STEP_OFFSET, staffStepsFromC4(64));
    // F3 (Bass F) is the fourth line: same as D5 on the treble staff.
    assert.equal(staffStepsFromC4(53) + BASS_CLEF_STEP_OFFSET, staffStepsFromC4(74));
  });
});

describe("exercise generators", () => {
  it("always includes the correct answer among the options", () => {
    const makers = [
      () => sensoryExercise(),
      () => intervalExercise(),
      () => intervalExerciseForGrade(3),
      () => intervalExerciseForGrade(8),
      () => triadExercise(4),
      () => triadExercise(6),
      () => rhythmExercise(2),
      () => rhythmExercise(8),
      () => keySignatureExercise(4),
      () => scaleExercise(3),
      () => scaleExercise(6),
      () => romanNumeralExercise(5),
      () => romanNumeralExercise(8),
      () => cadenceExercise(),
      () => relatedKeyExercise(),
    ];
    for (const make of makers) {
      repeat(40, () => {
        const ex = make();
        assert.ok(ex.options.includes(ex.correctAnswer), `${ex.type}: ${ex.correctAnswer} missing`);
        assert.equal(new Set(ex.options).size, ex.options.length, `${ex.type}: duplicate options`);
        assert.ok(ex.options.length >= 2 && ex.options.length <= 4);
        assert.ok(ex.explain && ex.explain.length > 10, `${ex.type}: no explanation`);
      });
    }
  });

  it("plays the scale that matches the answer", () => {
    repeat(60, () => {
      const ex = scaleExercise(4);
      if (ex.correctAnswer === "Major" || ex.correctAnswer === "Natural minor") return;
      const key = KEYS.find((k) => k.name === ex.correctAnswer)!;
      assert.equal(
        ex.notes[0],
        TONIC_MIDI[key.tonic],
        `${ex.correctAnswer} started on ${ex.notes[0]}`,
      );
      assert.equal(ex.notes.length, 8);
    });
  });

  it("plays the interval it names, in the direction it says", () => {
    repeat(60, () => {
      const ex = intervalExerciseForGrade(9);
      const [a, b] = ex.notes as [number, number];
      const semis = ex.metadata?.semitones as number;
      assert.equal(Math.abs(b - a), semis);
      if (ex.metadata?.direction === "descending") assert.ok(a > b);
      if (ex.metadata?.direction === "ascending") assert.ok(a < b);
    });
  });

  it("restricts early interval drills to the beginner set", () => {
    repeat(40, () => {
      const semis = intervalExerciseForGrade(2).metadata?.semitones as number;
      assert.ok([2, 4, 5, 7, 12].includes(semis));
    });
  });

  it("builds cadences from the degrees it names", () => {
    repeat(20, () => {
      const ex = cadenceExercise();
      const cadence = CADENCES.find((c) => c.name === ex.correctAnswer)!;
      const chords = ex.metadata?.chords as number[][];
      // I for orientation, then the two cadence chords.
      assert.equal(chords.length, 3);
      const last = chords[2]!.map((m) => m % 12).sort();
      const expected = diatonicTriad(60, cadence.degrees[1])
        .map((m) => m % 12)
        .sort();
      assert.deepEqual(last, expected);
    });
  });

  it("keeps triads to major and minor until grade 5", () => {
    repeat(40, () => assert.ok(["Major", "Minor"].includes(triadExercise(4).correctAnswer)));
  });

  it("grows the rhythm pool with grade", () => {
    assert.ok(rhythmPatternsForGrade(2).every((r) => r.meter === "4/4"));
    assert.ok(rhythmPatternsForGrade(8).some((r) => r.meter === "3/4"));
    assert.ok(rhythmPatternsForGrade(8).length > rhythmPatternsForGrade(2).length);
  });

  it("names a key's real neighbour", () => {
    repeat(20, () => {
      const ex = relatedKeyExercise();
      const home = ex.metadata?.tonic as string;
      const answer = ex.correctAnswer.replace(" major", "");
      assert.ok(closelyRelatedKeys(home).includes(answer));
    });
  });
});

describe("rhythm tap scoring", () => {
  const beats = [1, 1, 1, 1];
  it("scores a perfect performance", () => {
    const s = scoreTaps(beats, onsetsMs(beats));
    assert.equal(s.hits, 4);
    assert.ok(s.passed);
    assert.equal(s.meanErrorMs, 0);
  });
  it("tolerates small timing errors and reports them", () => {
    const s = scoreTaps(
      beats,
      onsetsMs(beats).map((t, i) => t + (i % 2 ? 60 : -60)),
    );
    assert.equal(s.hits, 4);
    assert.ok(s.passed);
    assert.ok(Math.abs(s.meanErrorMs - 60) < 1e-6);
  });
  it("fails when the pulse is too fast", () => {
    const s = scoreTaps(beats, onsetsMs(beats, 400));
    assert.ok(!s.passed);
  });
  it("penalises extra taps", () => {
    const s = scoreTaps(beats, [...onsetsMs(beats), 100, 200, 300]);
    assert.equal(s.hits, 1);
    assert.ok(!s.passed);
  });
  it("passes three of four", () => {
    const s = scoreTaps(beats, onsetsMs(beats).slice(0, 3));
    assert.equal(s.hits, 3);
    assert.ok(s.passed);
  });
  it("handles dotted rhythms", () => {
    const dotted = [1.5, 0.5, 1.5, 0.5];
    assert.ok(scoreTaps(dotted, onsetsMs(dotted)).passed);
  });
});

describe("curriculum", () => {
  it("has a lesson, drill and threshold for every level", () => {
    for (const level of CURRICULUM) {
      const lesson = lessonFor(level.level);
      assert.equal(lesson.level, level.level);
      assert.ok(lesson.sections.length >= 2);
      assert.equal(lesson.check.length, 3);
      for (const q of lesson.check) {
        assert.ok(q.options.includes(q.answer), `${level.level}: ${q.prompt}`);
      }
      assert.ok(level.topics.length > 0);
      if (level.level < CURRICULUM.length - 1) assert.ok(GRADE_THRESHOLDS[level.level]);
    }
    assert.equal(LESSONS.length, CURRICULUM.length);
  });

  it("gates grade progress on each level's own topics", () => {
    assert.ok(topicCountsForGrade("sensory", 0));
    assert.ok(topicCountsForGrade("note-reading-c4-b4", 1));
    assert.ok(!topicCountsForGrade("note-reading-c4-b4", 2));
    assert.ok(topicCountsForGrade("rhythm", 2));
    assert.ok(topicCountsForGrade("harmony", 5));
    assert.ok(topicCountsForGrade("duel", 9));
  });

  it("unlocks studies in curriculum order", () => {
    assert.ok(!isStudyUnlocked("/rhythm", 1));
    assert.ok(isStudyUnlocked("/rhythm", 2));
    assert.ok(!isStudyUnlocked("/cadence", 4));
    assert.ok(isStudyUnlocked("/cadence", 5));
    assert.deepEqual(
      studiesFor(4).map((s) => s.to),
      ["/sensory", "/rhythm", "/scale", "/circle", "/interval", "/triad"],
    );
  });

  it("adds landmarks and the bass staff to the reading pool", () => {
    assert.deepEqual(
      buildNotePool(0).map((n) => n.midi),
      [60, 64, 67],
    );
    assert.ok(
      buildNotePool(1).some((n) => n.midi === 53),
      "Bass F at level 1",
    );
    assert.ok(buildNotePool(3).filter((n) => n.midi < 60).length >= 4);
  });
});

describe("grade trial in the store", () => {
  const reset = () => useGameStore.getState().resetProgress();

  it("advances from level 0 after ten good listening answers", () => {
    reset();
    let leveled = false;
    for (let i = 0; i < 10; i++) {
      const out = useGameStore.getState().recordPractice({
        midi: 60,
        correct: true,
        responseMs: 500,
        topicId: "sensory",
        trackHeat: false,
      });
      leveled ||= out.leveledUp;
    }
    assert.ok(leveled);
    assert.equal(useGameStore.getState().gradeLevel, 1);
    assert.deepEqual(useGameStore.getState().recentAtGrade, []);
  });

  it("ignores answers on topics outside the current level", () => {
    reset();
    for (let i = 0; i < 30; i++) {
      useGameStore.getState().recordPractice({
        midi: 60,
        correct: true,
        responseMs: 500,
        topicId: "intervals",
        trackHeat: false,
      });
    }
    assert.equal(useGameStore.getState().gradeLevel, 0);
    assert.equal(gradeProgress(useGameStore.getState()).answered, 0);
  });

  it("judges a rolling window so a rough start is recoverable", () => {
    reset();
    const answer = (correct: boolean) =>
      useGameStore.getState().recordPractice({
        midi: 60,
        correct,
        responseMs: 500,
        topicId: "sensory",
        trackHeat: false,
      });
    for (let i = 0; i < 6; i++) answer(false);
    for (let i = 0; i < 9; i++) answer(true);
    // Window of 10: 1 wrong + 9 right = 90% ≥ 80%.
    assert.equal(useGameStore.getState().gradeLevel, 1);
  });

  it("counts duel moves toward the counterpoint grades", () => {
    reset();
    useGameStore.setState({ gradeLevel: 9, recentAtGrade: [] });
    let out = { leveledUp: false, newGrade: 9 };
    for (let i = 0; i < 40; i++) out = useGameStore.getState().recordDuel(true, 10);
    assert.ok(out.leveledUp);
    assert.equal(useGameStore.getState().gradeLevel, 10);
    assert.ok(gradeProgress(useGameStore.getState()).maxed);
  });

  it("does not colour the heatmap from theory quizzes", () => {
    reset();
    useGameStore.getState().recordPractice({
      midi: 64,
      correct: true,
      responseMs: 500,
      topicId: "intervals",
      trackHeat: false,
    });
    assert.equal(useGameStore.getState().heatmap[64], undefined);
    useGameStore.getState().recordPractice({
      midi: 64,
      correct: true,
      responseMs: 500,
      topicId: "note-reading-c4-b4",
    });
    assert.equal(useGameStore.getState().heatmap[64]?.attempts, 1);
  });
});

// Regressions for saved review history and first-attempt practice scoring.
describe("personal note review", () => {
  it("adds a fresh mistake and clears it after consistent independent success", () => {
    let history = recordNoteAttempt(undefined, false);
    assert.deepEqual(weakNotesFor({ 60: history }), [60]);
    for (let i = 0; i < 3; i++) history = recordNoteAttempt(history, true);
    assert.deepEqual(weakNotesFor({ 60: history }), [60]);
    history = recordNoteAttempt(history, true);
    assert.deepEqual(weakNotesFor({ 60: history }), []);
    for (let i = 0; i < 20; i++) history = recordNoteAttempt(history, true);
    assert.equal(history.recentCorrect?.length, 10);
    assert.equal(history.attempts, 25);
    assert.equal(history.correct, 24);
  });

  it("uses existing heatmap saves and rebuilds weak notes on hydration", () => {
    useGameStore.getState().resetProgress();
    useGameStore.setState({
      heatmap: JSON.parse(
        JSON.stringify({ 60: { attempts: 5, correct: 2 }, 64: { attempts: 10, correct: 9 } }),
      ),
      weakNotesMidi: [99],
    });
    useGameStore.getState().hydrateDay();
    assert.deepEqual(useGameStore.getState().weakNotesMidi, [60]);
    assert.equal(useGameStore.getState().heatmap[60]?.attempts, 5);
  });

  it("persists per-note recent results while excluding study answers", () => {
    useGameStore.getState().resetProgress();
    const state = useGameStore.getState();
    state.recordPractice({
      midi: 60,
      correct: false,
      responseMs: 300,
      topicId: "note-reading-c4-b4",
    });
    state.recordPractice({ midi: 60, correct: true, responseMs: 300, topicId: "intervals" });
    const saved = JSON.parse(JSON.stringify(useGameStore.getState().heatmap));
    assert.deepEqual(saved[60], { attempts: 1, correct: 0, recentCorrect: [false] });
    assert.deepEqual(weakNotesFor(saved), [60]);
    state.resetProgress();
    assert.deepEqual(useGameStore.getState().heatmap, {});
    assert.deepEqual(useGameStore.getState().weakNotesMidi, []);
  });

  it("separates due, new, and future notes and limits review to the unlocked pool", () => {
    const now = new Date("2026-09-05T12:00:00Z");
    const reviewed = (midi: number, next: string, repetitions = 1): SRItem => ({
      ...newSRItem(`note_${midi}`, "note-reading", 0),
      repetitions,
      lastReviewedAt: "2026-09-04T12:00:00Z",
      nextReviewAt: next,
    });
    const items = {
      note_60: reviewed(60, now.toISOString(), 0), // A failed review is due, not new.
      note_64: reviewed(64, "2026-09-06T12:00:00Z"),
      note_67: newSRItem("note_67", "note-reading", 0),
      note_53: reviewed(53, "2026-09-01T12:00:00Z"),
    };
    const plan = noteReviewPlan(
      0,
      { 60: recordNoteAttempt(undefined, false), 53: recordNoteAttempt(undefined, false) },
      items,
      now,
    );
    assert.deepEqual(plan.due, [60]);
    assert.deepEqual(plan.unseen, [67]);
    assert.deepEqual(plan.weak, [60]);
    assert.deepEqual(
      noteReviewPlan(
        0,
        {},
        { note_60: items.note_64, note_64: items.note_64, note_67: items.note_64 },
        now,
      ).due,
      [],
    );
  });
});

describe("practice corrections", () => {
  function focusedEngine(item = newSRItem("note_60", "note-reading", 1)) {
    const engine = new PracticeQuestionEngine();
    engine.notePool = buildNotePool(1);
    engine.rebuildQueue([item], true);
    assert.ok(engine.generateQuestion());
    return engine;
  }

  it("keeps real distractors when only one weak note is targeted", () => {
    const engine = focusedEngine();
    assert.equal(engine.targetNote?.midi, 60);
    assert.equal(engine.answerOptions.length, 4);
    assert.equal(new Set(engine.answerOptions.map((n) => n.midi)).size, 4);
  });

  it("keeps mistake penalties and treats retries as assisted", () => {
    const engine = focusedEngine({
      ...newSRItem("note_60", "note-reading", 1),
      repetitions: 4,
      intervalDays: 30,
    });
    const options = engine.answerOptions;
    const missed = engine.recordAnswer({ midi: 64 });
    assert.equal(missed.firstAttempt, true);
    assert.equal(missed.updatedSRItem?.repetitions, 0);
    assert.equal(missed.updatedSRItem?.easeFactor, 2.3);
    assert.ok(engine.generateQuestion());
    assert.equal(engine.questionHadError, true);
    assert.deepEqual(engine.answerOptions, options);
    const repeatedMiss = engine.recordAnswer({ midi: 64 });
    assert.equal(repeatedMiss.firstAttempt, false);
    assert.equal(repeatedMiss.updatedSRItem?.easeFactor, 2.3);
    engine.generateQuestion();
    const correction = engine.recordAnswer({ midi: 60 });
    assert.equal(correction.isCorrect, true);
    assert.equal(correction.firstAttempt, false);
    assert.equal(correction.updatedSRItem?.intervalDays, 1);
    assert.equal(correction.updatedSRItem?.repetitions, 1);
    assert.ok((correction.updatedSRItem?.easeFactor ?? 3) < 2.3);
    assert.equal(engine.isQueueExhausted, true);
    assert.equal(engine.generateQuestion(), false);
    assert.equal(engine.recordAnswer({ midi: 60 }).updatedSRItem, null);
  });

  it("starts a new independent attempt in the next round", () => {
    const engine = focusedEngine();
    engine.recordAnswer({ midi: 64 });
    engine.generateQuestion();
    const corrected = engine.recordAnswer({ midi: 60 }).updatedSRItem!;
    engine.rebuildQueue([corrected], true);
    engine.generateQuestion();
    assert.equal(engine.questionHadError, false);
    const fresh = engine.recordAnswer({ midi: 60 });
    assert.equal(fresh.firstAttempt, true);
    assert.equal(fresh.updatedSRItem?.intervalDays, 3);
  });

  it("does not generate a question for an empty review list", () => {
    const engine = new PracticeQuestionEngine();
    engine.notePool = buildNotePool(0);
    engine.rebuildQueue([], true);
    assert.equal(engine.generateQuestion(), false);
  });
});
