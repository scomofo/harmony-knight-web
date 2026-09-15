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
