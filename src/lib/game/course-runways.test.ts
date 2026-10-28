import { it } from "node:test";
import assert from "node:assert/strict";
import { COURSE_UNITS, unitById } from "./course.ts";

it("gives every advanced unit a concise runway to real, earlier prerequisite lessons", () => {
  for (const unit of COURSE_UNITS.filter((candidate) => candidate.level >= 6)) {
    assert.ok(unit.runway, `${unit.id}: missing prerequisite runway`);
    assert.ok(unit.runway!.note.length > 40, `${unit.id}: runway needs actionable guidance`);
    assert.ok(unit.runway!.unitIds.length > 0, `${unit.id}: runway has no destination`);
    for (const id of unit.runway!.unitIds) {
      const prerequisite = unitById(id);
      assert.ok(prerequisite, `${unit.id}: unknown prerequisite ${id}`);
      assert.ok(
        COURSE_UNITS.indexOf(prerequisite!) < COURSE_UNITS.indexOf(unit),
        `${unit.id}: ${id} is not an earlier lesson`,
      );
    }
  }
});
