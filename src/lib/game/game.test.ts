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
import { buildNotePool } from "./practice.ts";
import { gradeProgress, useGameStore } from "./store.ts";

const repeat = (n: number, fn: () => void) => {
  for (let i = 0; i < n; i++) fn();
};

describe("music theory helpers", () => {
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
