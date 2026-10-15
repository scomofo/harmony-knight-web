import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { counterpointQuality, validateMove, safePitches, suggestGhostResolution } from "./duel.ts";

describe("two-voice counterpoint judgments", () => {
  it("rejects fourths over the bass, including compound fourths", () => {
    for (const upper of [65, 77]) {
      assert.equal(counterpointQuality(upper - 60), "dissonance");
      assert.equal(
        validateMove({ cantusNote: { midi: 60 }, userNote: { midi: upper } }).isValid,
        false,
      );
    }
  });
  it("allows stationary repeated perfect intervals, but rejects moving parallels", () => {
    for (const interval of [7, 12, 19, 24]) {
      const previous = {
        previousCantusNote: { midi: 60 },
        previousUserNote: { midi: 60 + interval },
      };
      assert.equal(
        validateMove({ ...previous, cantusNote: { midi: 60 }, userNote: { midi: 60 + interval } })
          .isValid,
        true,
      );
      assert.equal(
        validateMove({ ...previous, cantusNote: { midi: 62 }, userNote: { midi: 62 + interval } })
          .isValid,
        false,
      );
    }
  });
  it("accepts a contrary stepwise sixth-to-octave cadence", () => {
    assert.equal(
      validateMove({
        previousCantusNote: { midi: 62 },
        previousUserNote: { midi: 71 },
        cantusNote: { midi: 60 },
        userNote: { midi: 72 },
      }).isValid,
      true,
    );
  });
  it("still rejects hidden fifths when the upper voice leaps into the fifth", () => {
    // Cantus steps C4 -> D4 while the upper voice leaps E4 -> A4 into the fifth.
    const result = validateMove({
      previousCantusNote: { midi: 60 },
      previousUserNote: { midi: 64 },
      cantusNote: { midi: 62 },
      userNote: { midi: 69 },
    });
    assert.ok(result.violations.includes("hiddenFifthsOrOctaves"));
    assert.equal(result.isValid, false);
  });
  it("allows similar motion into a fifth when the upper voice arrives by step", () => {
    // The taught exception: cantus leaps down C4 -> G3, upper voice steps
    // E4 -> D4 down into the fifth. Legal — no leap in the upper voice.
    const result = validateMove({
      previousCantusNote: { midi: 60 },
      previousUserNote: { midi: 64 },
      cantusNote: { midi: 55 },
      userNote: { midi: 62 },
    });
    assert.deepEqual(result.violations, []);
    assert.equal(result.isValid, true);
  });
  it("allows similar motion into an octave when both voices move by step", () => {
    // Cantus steps B3 -> C4, upper voice steps Bb4 -> C5 into the octave.
    const result = validateMove({
      previousCantusNote: { midi: 59 },
      previousUserNote: { midi: 70 },
      cantusNote: { midi: 60 },
      userNote: { midi: 72 },
    });
    assert.deepEqual(result.violations, []);
    assert.equal(result.isValid, true);
  });
  it("keeps safe keys and ghost corrections consistent with the validator", () => {
    for (const midi of [60, 62, 64, 65, 67, 69, 71, 72]) {
      const args = {
        cantusNote: { midi },
        previousCantusNote: { midi: 60 },
        previousUserNote: { midi: 67 },
      };
      for (const upper of safePitches({ ...args, fromMidi: 60, toMidi: 84 })) {
        assert.equal(validateMove({ ...args, userNote: { midi: upper } }).isValid, true);
        assert.notEqual((upper - midi) % 12, 5);
      }
      const ghost = suggestGhostResolution(args);
      assert.ok(ghost);
      assert.equal(validateMove({ ...args, userNote: ghost.suggestedNote }).isValid, true);
    }
  });
});
