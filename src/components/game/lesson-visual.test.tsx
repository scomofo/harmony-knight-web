import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { useGameStore } from "@/lib/game/store";
import { LessonFigure } from "./lesson-visual";
import { LessonScreen } from "./lesson-screen";

it("shows the climbing-staff picture with letter names beside the lesson text", () => {
  useGameStore.getState().resetProgress();
  render(<LessonScreen level={1} unitId="1-staff" />);
  const figure = screen.getByRole("img", { name: /eight notes climbing/i });
  expect(figure.tagName).toBe("svg");
  expect(figure.textContent).toContain("E");
  expect(figure.textContent).toContain("A");
  expect(screen.getByText(/after G the alphabet starts again at A/i)).toBeTruthy();
  // The audio example still follows the picture.
  expect(screen.getByRole("button", { name: "Climbing the staff" })).toBeTruthy();
});

it("places notes higher on the staff as they climb, and adds ledger lines below it", () => {
  const { container } = render(
    <LessonFigure
      visual={{
        kind: "staff",
        clef: "treble",
        notes: [60, 64, 72],
        gaps: ["3rd", "6th"],
        caption: "Middle C, E and the C above.",
        alt: "Three notes",
      }}
    />,
  );
  const glyphs = Array.from(container.querySelectorAll("foreignObject")).map((el) =>
    Number(el.getAttribute("y")),
  );
  expect(glyphs[0]!).toBeGreaterThan(glyphs[1]!);
  expect(glyphs[1]!).toBeGreaterThan(glyphs[2]!);
  // Only middle C, below the bottom line, needs a ledger line: five staff lines plus one.
  expect(container.querySelectorAll("line").length).toBe(6);
  expect(container.textContent).toContain("3rd");
  expect(container.textContent).toContain("6th");
});

it("marks sharps on the staff and lights the chosen piano keys", () => {
  const { container, rerender } = render(
    <LessonFigure
      visual={{
        kind: "staff",
        clef: "treble",
        notes: [68],
        caption: "G sharp on the staff.",
        alt: "G sharp",
      }}
    />,
  );
  expect(container.textContent).toContain("♯");
  expect(container.textContent).toContain("G#");

  rerender(
    <LessonFigure
      visual={{
        kind: "keyboard",
        from: 60,
        to: 72,
        highlight: [60, 61],
        caption: "C and C sharp lit.",
        alt: "Keyboard from C to C",
      }}
    />,
  );
  const keys = container.querySelectorAll("rect");
  expect(keys.length).toBe(13);
  const litFills = Array.from(keys).filter((k) => k.getAttribute("fill")?.startsWith("#"));
  expect(litFills.length).toBe(2);
});

it("draws each note value with its beat count", () => {
  const { container } = render(
    <LessonFigure
      visual={{
        kind: "rhythm",
        values: ["whole", "dotted-quarter", "eighth"],
        caption: "Three note values.",
        alt: "Three note values",
      }}
    />,
  );
  expect(container.textContent).toContain("4 beats");
  expect(container.textContent).toContain("1½ beats");
  expect(container.textContent).toContain("½ beat");
  expect(container.querySelectorAll("path").length).toBe(1); // one eighth-note flag
  expect(container.querySelectorAll("circle").length).toBe(1); // one dot
});

it("stacks chords in one column, labels them, and spells flats on the natural above", () => {
  const { container } = render(
    <LessonFigure
      visual={{
        kind: "staff",
        clef: "treble",
        notes: [
          [60, 63, 67],
          [60, 62],
        ],
        labels: ["Cm", "2nd"],
        spell: "flat",
        caption: "A minor triad, then a second.",
        alt: "Two chords",
      }}
    />,
  );
  const glyphs = Array.from(container.querySelectorAll("foreignObject"));
  expect(glyphs.length).toBe(5);
  const xs = glyphs.slice(0, 3).map((el) => el.getAttribute("x"));
  expect(new Set(xs).size).toBe(1); // a stacked triad shares one column
  expect(container.textContent).toContain("♭");
  expect(container.textContent).not.toContain("♯");
  // A note one step above its neighbour is nudged right so the two do not overlap.
  expect(glyphs[3]!.getAttribute("x")).not.toBe(glyphs[4]!.getAttribute("x"));
  expect(container.textContent).toContain("Cm");
});

it("draws bars with a meter, rests, a tie, accents and counting", () => {
  const { container } = render(
    <LessonFigure
      visual={{
        kind: "measures",
        bars: [
          {
            meter: "4/4",
            events: [
              { value: "quarter", rest: true, count: "1" },
              { value: "eighth", rest: true, count: "2" },
              { value: "eighth", tie: true, accent: true, count: "&" },
              { value: "quarter", count: "(3)" },
              { value: "quarter", count: "4" },
            ],
          },
        ],
        caption: "A syncopated bar with two rests and a tie.",
        alt: "Syncopation bar",
      }}
    />,
  );
  expect(container.textContent).toContain("4/4");
  expect(container.querySelectorAll("[data-rest]").length).toBe(2);
  expect(container.querySelectorAll("[data-tie]").length).toBe(1);
  expect(container.querySelectorAll("[data-accent]").length).toBe(1);
  expect(container.textContent).toContain("(3)");
});

it("lights grid cells and circle-of-fifths keys", () => {
  const { container, rerender } = render(
    <LessonFigure
      visual={{
        kind: "grid",
        columns: 6,
        rows: [
          { label: "three", hits: [1, 3, 5] },
          { label: "two", hits: [1, 4] },
        ],
        caption: "Three against two on six cells.",
        alt: "Polyrhythm grid",
      }}
    />,
  );
  expect(container.querySelectorAll("[data-hit]").length).toBe(5);
  rerender(
    <LessonFigure
      visual={{
        kind: "circle",
        highlight: ["F", "C", "G"],
        caption: "C with its neighbours lit on the circle.",
        alt: "Circle of fifths",
      }}
    />,
  );
  expect(container.querySelectorAll("[data-key]").length).toBe(12);
  expect(container.querySelectorAll("[data-lit]").length).toBe(3);
});
