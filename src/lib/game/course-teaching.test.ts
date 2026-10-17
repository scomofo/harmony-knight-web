/**
 * Teaching-text drift guard.
 *
 * Two copies of every lesson's text exist by design: HUMANIZED_TEACHING in
 * course.ts is the body learners are actually taught; the section bodies in
 * lessons.ts survive as the optional "reference" refresher. The failure mode
 * this guards is silent: a unit shipping with NO humanized body would fall
 * back to teaching the reference text (unit() does `?? section.body`), and
 * nobody would notice — the lesson would just quietly read thinner.
 *
 * So the guard is about presence and wiring, not equality (the two copies
 * are SUPPOSED to differ):
 *  - every unit has a humanized entry, and every entry belongs to a unit;
 *  - every unit's taught body IS its humanized entry;
 *  - every unit still carries its reference copy, distinct from the body,
 *    so the refresher keeps working.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { COURSE_UNITS, HUMANIZED_TEACHING } from "./course.ts";

describe("teaching text: live copy vs reference copy", () => {
  it("every unit has a humanized teaching entry, with no orphan entries", () => {
    const unitIds = new Set(COURSE_UNITS.map((u) => u.id));
    for (const unit of COURSE_UNITS) {
      const entry = HUMANIZED_TEACHING[unit.id];
      assert.ok(
        typeof entry === "string" && entry.length > 0,
        `unit ${unit.id} has no HUMANIZED_TEACHING entry — it would silently teach the lessons.ts reference text`,
      );
    }
    for (const key of Object.keys(HUMANIZED_TEACHING)) {
      assert.ok(
        unitIds.has(key),
        `HUMANIZED_TEACHING entry "${key}" matches no unit — renamed or removed unit?`,
      );
    }
  });

  it("each unit's taught body is its humanized entry, not the reference text", () => {
    for (const unit of COURSE_UNITS) {
      assert.equal(
        unit.body,
        HUMANIZED_TEACHING[unit.id],
        `unit ${unit.id}: body is not the HUMANIZED_TEACHING text`,
      );
    }
  });

  it("each unit keeps its lessons.ts reference copy, distinct from the taught body", () => {
    for (const unit of COURSE_UNITS) {
      assert.ok(
        typeof unit.reference === "string" && unit.reference.length > 0,
        `unit ${unit.id}: reference refresher is missing`,
      );
      assert.notEqual(
        unit.reference,
        unit.body,
        `unit ${unit.id}: reference and taught body are identical — one of the two copies is dead`,
      );
    }
  });
});
