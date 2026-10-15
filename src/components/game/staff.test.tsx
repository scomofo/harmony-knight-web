import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Staff } from "./staff";
import { BASS_CLEF_STEP_OFFSET, staffStepsFromC4 } from "@/lib/game/music";

// Default Staff geometry (width 280): lines span x 24..256, ledger lines are
// the short strokes centred on the note at x 132..176.
const NOTE_X = 280 * 0.55;
const LINE_GAP = 14;
const E4_Y = 36 + 4 * LINE_GAP; // bottom staff line (step 2)

type RenderedStaff = {
  ledgerYs: number[];
  staffLineOpacity: number | null;
  ledgerOpacity: number | null;
  noteY: number;
};

function renderStaff(midi: number, clef: "treble" | "bass", confidence = 1): RenderedStaff {
  const { container, unmount } = render(<Staff midi={midi} confidence={confidence} clef={clef} />);
  const lines = Array.from(container.querySelectorAll("line"));
  const isLedger = (el: SVGLineElement) => Number(el.getAttribute("x1")) === NOTE_X - 22;
  const ledger = lines.filter(isLedger);
  const staffLines = lines.filter((el) => !isLedger(el));
  const head = container.querySelector('g[transform*="rotate(-18)"]');
  const match = head?.getAttribute("transform")?.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/);
  const out: RenderedStaff = {
    ledgerYs: ledger.map((el) => Number(el.getAttribute("y1"))).sort((a, b) => a - b),
    staffLineOpacity: staffLines.length
      ? Number(staffLines[0]!.getAttribute("stroke-opacity"))
      : null,
    ledgerOpacity: ledger.length ? Number(ledger[0]!.getAttribute("stroke-opacity")) : null,
    noteY: match ? Number(match[2]) : Number.NaN,
  };
  unmount();
  return out;
}

/** Every line position (even step) between the staff edge and the note. */
function expectedLedgerYs(steps: number): number[] {
  const ys: number[] = [];
  for (let s = -24; s <= 32; s += 2) {
    if ((s <= 0 && s >= steps) || (s >= 12 && s <= steps)) {
      ys.push(E4_Y - (s - 2) * (LINE_GAP / 2));
    }
  }
  return ys.sort((a, b) => a - b);
}

describe("interactive Staff geometry", () => {
  it("places the notehead and the exact ledger-line set for MIDI 41-84 in both clefs", () => {
    for (const clef of ["treble", "bass"] as const) {
      for (let midi = 41; midi <= 84; midi++) {
        const steps =
          staffStepsFromC4(midi) + (clef === "bass" ? BASS_CLEF_STEP_OFFSET : 0);
        const { ledgerYs, noteY } = renderStaff(midi, clef);
        expect(noteY, `${clef} ${midi} notehead`).toBeCloseTo(
          E4_Y - (steps - 2) * (LINE_GAP / 2),
          5,
        );
        expect(ledgerYs, `${clef} ${midi} ledger`).toEqual(expectedLedgerYs(steps));
      }
    }
  });

  it("draws no stray ledger line for the space notes D4 and G5 (treble) or B3 (bass)", () => {
    expect(renderStaff(62, "treble").ledgerYs).toEqual([]);
    expect(renderStaff(79, "treble").ledgerYs).toEqual([]);
    expect(renderStaff(59, "bass").ledgerYs).toEqual([]);
    // …and a matching line through middle C and the C two octaves up.
    expect(renderStaff(60, "treble").ledgerYs).toEqual([E4_Y + LINE_GAP]);
    expect(renderStaff(84, "treble").ledgerYs).toEqual([
      E4_Y - 6 * LINE_GAP,
      E4_Y - 5 * LINE_GAP,
    ]);
  });

  it("keeps ledger lines on the staff's confidence fade", () => {
    // Beginner state: the staff itself is gone, so no ledger line may float.
    const dark = renderStaff(60, "treble", 0);
    expect(dark.ledgerYs).toEqual([]);
    expect(dark.staffLineOpacity).toBeNull();
    // Mid-confidence: ledger lines share the staff lines' opacity exactly.
    const mid = renderStaff(60, "treble", 0.5);
    expect(mid.ledgerYs).toEqual([E4_Y + LINE_GAP]);
    expect(mid.ledgerOpacity).not.toBeNull();
    expect(mid.ledgerOpacity).toBeCloseTo(mid.staffLineOpacity!, 5);
  });
});
