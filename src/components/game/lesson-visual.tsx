import {
  RHYTHM_BEATS,
  type LessonVisual,
  type RhythmEvent,
  type RhythmValue,
} from "@/lib/game/lessons";
import {
  CIRCLE_OF_FIFTHS,
  NOTE_NAMES,
  figureNoteColor,
  figureNoteShape,
  pitchClass,
  staffStepsFromC4,
} from "@/lib/game/music";
import { FigureNoteGlyph } from "./figurenote";
import { KeySignature } from "./key-signature";

const PARCHMENT = "var(--color-parchment)";
const MUTED = "var(--color-muted)";
const HARMONY = "var(--color-harmony)";
const SVG_CLASS = "mx-auto block h-auto w-full max-w-[420px]";

/** A still picture for lesson text. Picks the drawing by the visual's kind. */
export function LessonFigure({ visual }: { visual: LessonVisual }) {
  return (
    <figure className="mt-5">
      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-ink)] px-2 py-1">
        {visual.kind === "staff" ? (
          <StaffDiagram visual={visual} />
        ) : visual.kind === "keyboard" ? (
          <KeyboardDiagram visual={visual} />
        ) : visual.kind === "rhythm" ? (
          <RhythmDiagram visual={visual} />
        ) : visual.kind === "measures" ? (
          <MeasuresDiagram visual={visual} />
        ) : visual.kind === "grid" ? (
          <GridDiagram visual={visual} />
        ) : visual.kind === "circle" ? (
          <CircleDiagram visual={visual} />
        ) : (
          <div role="img" aria-label={visual.alt}>
            <KeySignature tonic={visual.tonic} showName />
          </div>
        )}
      </div>
      <figcaption className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
        {visual.caption}
      </figcaption>
    </figure>
  );
}

/* ----------------------------- staff ----------------------------- */

const LINE_GAP = 14;
const HALF = LINE_GAP / 2;
const LEFT = 24;
const NOTE_START = 84;
const GLYPH = 24;
const CHORD_GLYPH = 16;
/** Staff steps from C4 of each staff's bottom line: E4 for treble, G2 for bass. */
const BOTTOM_STEP = { treble: 2, bass: -10 } as const;

type StaffKind = "treble" | "bass";
type StaffVisual = Extract<LessonVisual, { kind: "staff" }>;
type Spell = "sharp" | "flat";

function ledgerSteps(steps: number, bottom: number): number[] {
  const lines: number[] = [];
  for (let s = bottom - 2; s >= steps; s -= 2) lines.push(s);
  for (let s = bottom + 10; s <= steps; s += 2) lines.push(s);
  return lines;
}

const isBlack = (midi: number) => [1, 3, 6, 8, 10].includes(pitchClass(midi));

/** A flat sits on the staff position of the natural above it; a sharp on the one below. */
const stepsFor = (midi: number, spell: Spell) =>
  spell === "flat" && isBlack(midi) ? staffStepsFromC4(midi + 1) : staffStepsFromC4(midi);

const letterFor = (midi: number, spell: Spell) =>
  spell === "flat" && isBlack(midi)
    ? `${NOTE_NAMES[pitchClass(midi + 1)]}b`
    : NOTE_NAMES[pitchClass(midi)];

export function StaffDiagram({ visual, width = 360 }: { visual: StaffVisual; width?: number }) {
  const spell: Spell = visual.spell ?? "sharp";
  const columns = visual.notes.map((n) => (Array.isArray(n) ? n : [n]));
  const staves: StaffKind[] = visual.clef === "grand" ? ["treble", "bass"] : [visual.clef];
  const staffTop = 30;
  // Grand staff: leave room between the staves so middle C's ledger line sits alone.
  const staffGap = 7 * LINE_GAP;
  const topOf = (kind: StaffKind) =>
    staffTop + (visual.clef === "grand" && kind === "bass" ? 4 * LINE_GAP + staffGap : 0);
  const bottomOf = (kind: StaffKind) => topOf(kind) + 4 * LINE_GAP;
  const lastBottom = bottomOf(staves[staves.length - 1]!);
  const staffFor = (midi: number): StaffKind =>
    visual.clef === "grand" ? (midi >= 60 ? "treble" : "bass") : visual.clef;
  const yFor = (midi: number) => {
    const kind = staffFor(midi);
    return bottomOf(kind) - (stepsFor(midi, spell) - BOTTOM_STEP[kind]) * HALF;
  };
  // Letters go under the lowest note, so ledger-line notes never sit on top of them.
  const lowestY = Math.max(lastBottom, ...columns.flat().map(yFor));
  const labelY = Math.max(lastBottom + 2 * LINE_GAP, lowestY + GLYPH);
  const height = labelY + (visual.gaps ? LINE_GAP : 0) + 8;
  // Leave room under the last column for a longer label such as a chord symbol.
  const right = visual.labels ? LEFT + 16 : LEFT;
  const span = width - right - NOTE_START;
  const xFor = (index: number) =>
    columns.length === 1
      ? NOTE_START + span / 2
      : NOTE_START + (span * index) / (columns.length - 1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={SVG_CLASS}
      role="img"
      aria-label={visual.alt}
    >
      {staves.map((kind) => (
        <g key={kind}>
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1={LEFT}
              x2={width - LEFT}
              y1={topOf(kind) + i * LINE_GAP}
              y2={topOf(kind) + i * LINE_GAP}
              stroke={PARCHMENT}
              strokeOpacity={0.7}
              strokeWidth={1.2}
            />
          ))}
          <text
            x={28}
            y={topOf(kind) + (kind === "treble" ? 3.35 : 3.05) * LINE_GAP}
            fill={PARCHMENT}
            fillOpacity={0.85}
            fontSize={kind === "treble" ? 44 : 40}
            fontFamily="Georgia, serif"
          >
            {kind === "treble" ? "𝄞" : "𝄢"}
          </text>
        </g>
      ))}
      {columns.map((chord, index) => {
        const x = xFor(index);
        const glyph = chord.length > 1 ? CHORD_GLYPH : GLYPH;
        const sorted = [...chord].sort((a, b) => a - b);
        const label = visual.labels?.[index] ?? sorted.map((m) => letterFor(m, spell)).join(" ");
        return (
          <g key={index}>
            {sorted.map((midi, i) => {
              const kind = staffFor(midi);
              const y = yFor(midi);
              // A note a step above its neighbour is written to the right, as in print.
              const crowded =
                i > 0 && stepsFor(midi, spell) - stepsFor(sorted[i - 1]!, spell) === 1;
              const nx = crowded ? x + glyph * 0.8 : x;
              const accidental = isBlack(midi) ? (spell === "flat" ? "♭" : "♯") : null;
              return (
                <g key={`${midi}-${i}`}>
                  {ledgerSteps(stepsFor(midi, spell), BOTTOM_STEP[kind]).map((s) => {
                    const ly = bottomOf(kind) - (s - BOTTOM_STEP[kind]) * HALF;
                    return (
                      <line
                        key={s}
                        x1={x - 18}
                        x2={x + 18 + (crowded ? glyph * 0.8 : 0)}
                        y1={ly}
                        y2={ly}
                        stroke={PARCHMENT}
                        strokeOpacity={0.8}
                        strokeWidth={1.2}
                      />
                    );
                  })}
                  {accidental ? (
                    <text
                      x={nx - glyph / 2 - 3}
                      y={y + 6}
                      textAnchor="end"
                      fill={PARCHMENT}
                      fontSize="18"
                      fontFamily="Georgia, serif"
                    >
                      {accidental}
                    </text>
                  ) : null}
                  <foreignObject x={nx - glyph / 2} y={y - glyph / 2} width={glyph} height={glyph}>
                    <FigureNoteGlyph
                      shape={figureNoteShape(midi)}
                      color={figureNoteColor(midi)}
                      size={glyph}
                    />
                  </foreignObject>
                </g>
              );
            })}
            <text
              x={x}
              y={labelY}
              textAnchor="middle"
              fill={PARCHMENT}
              fontSize={label.length > 6 ? 10 : 13}
              fontFamily="var(--font-mono)"
            >
              {label}
            </text>
            {visual.gaps?.[index] && index < columns.length - 1 ? (
              <text
                x={(x + xFor(index + 1)) / 2}
                y={labelY + LINE_GAP}
                textAnchor="middle"
                fill={MUTED}
                fontSize="11"
                fontFamily="var(--font-mono)"
              >
                {visual.gaps[index]}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/* ---------------------------- keyboard --------------------------- */

type KeyboardVisual = Extract<LessonVisual, { kind: "keyboard" }>;

const WHITE_W = 30;
const WHITE_H = 96;
const BLACK_W = 18;
const BLACK_H = 58;

export function KeyboardDiagram({ visual }: { visual: KeyboardVisual }) {
  const midis = Array.from({ length: visual.to - visual.from + 1 }, (_, i) => visual.from + i);
  const whites = midis.filter((m) => !isBlack(m));
  const blacks = midis.filter(isBlack);
  const lit = new Set(visual.highlight);
  const width = whites.length * WHITE_W + 2;
  const height = WHITE_H + 22;
  const whiteX = (midi: number) => whites.indexOf(midi) * WHITE_W + 1;
  // A black key sits astride the boundary after the white key below it.
  const blackX = (midi: number) => whiteX(midi - 1) + WHITE_W - BLACK_W / 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={SVG_CLASS}
      role="img"
      aria-label={visual.alt}
    >
      {whites.map((midi) => (
        <g key={midi}>
          <rect
            x={whiteX(midi)}
            y={1}
            width={WHITE_W}
            height={WHITE_H}
            rx={3}
            fill={lit.has(midi) ? figureNoteColor(midi) : PARCHMENT}
            fillOpacity={lit.has(midi) ? 0.9 : 0.85}
            stroke="var(--color-ink)"
            strokeWidth={1.5}
          />
          <text
            x={whiteX(midi) + WHITE_W / 2}
            y={WHITE_H + 16}
            textAnchor="middle"
            fill={lit.has(midi) ? PARCHMENT : MUTED}
            fontSize="12"
            fontFamily="var(--font-mono)"
          >
            {NOTE_NAMES[pitchClass(midi)]}
          </text>
        </g>
      ))}
      {blacks.map((midi) => (
        <g key={midi}>
          <rect
            x={blackX(midi)}
            y={1}
            width={BLACK_W}
            height={BLACK_H}
            rx={2}
            fill={lit.has(midi) ? figureNoteColor(midi) : "var(--color-ink)"}
            stroke={PARCHMENT}
            strokeOpacity={0.6}
            strokeWidth={1}
          />
          {lit.has(midi) ? (
            <text
              x={blackX(midi) + BLACK_W / 2}
              y={BLACK_H - 8}
              textAnchor="middle"
              fill={PARCHMENT}
              fontSize="10"
              fontFamily="var(--font-mono)"
            >
              {NOTE_NAMES[pitchClass(midi)]}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

/* ----------------------------- rhythm ---------------------------- */

type RhythmVisual = Extract<LessonVisual, { kind: "rhythm" }>;
type MeasuresVisual = Extract<LessonVisual, { kind: "measures" }>;

const RHYTHM_NAMES: Record<RhythmValue, string> = {
  whole: "whole",
  half: "half",
  quarter: "quarter",
  eighth: "eighth",
  "dotted-half": "dotted half",
  "dotted-quarter": "dotted quarter",
};

const beatsLabel = (beats: number) =>
  `${beats === 0.5 ? "½" : beats % 1 === 0.5 ? `${Math.floor(beats)}½` : beats} ${beats === 1 ? "beat" : "beats"}`;

type BaseValue = "whole" | "half" | "quarter" | "eighth";
const baseOf = (value: RhythmValue) => value.replace("dotted-", "") as BaseValue;

function NoteGlyph({ value, x, y }: { value: RhythmValue; x: number; y: number }) {
  const base = baseOf(value);
  const hollow = base === "whole" || base === "half";
  const stem = base !== "whole";
  const dotted = value.startsWith("dotted");
  return (
    <g transform={`translate(${x}, ${y})`}>
      <ellipse
        rx={base === "whole" ? 11 : 9}
        ry={base === "whole" ? 7 : 6.5}
        transform={base === "whole" ? undefined : "rotate(-20)"}
        fill={hollow ? "none" : PARCHMENT}
        stroke={PARCHMENT}
        strokeWidth={hollow ? 2.5 : 1}
      />
      {stem ? <rect x={8} y={-34} width={2} height={34} fill={PARCHMENT} /> : null}
      {base === "eighth" ? (
        <path
          d="M10 -34 C 16 -26, 24 -22, 16 -6"
          stroke={PARCHMENT}
          strokeWidth={2.5}
          fill="none"
        />
      ) : null}
      {dotted ? <circle cx={16} cy={-2} r={2.4} fill={PARCHMENT} /> : null}
    </g>
  );
}

/** Rest glyphs: a block hanging below or sitting on the line, a zigzag, or a flagged stroke. */
function RestGlyph({ value, x, y }: { value: RhythmValue; x: number; y: number }) {
  const base = baseOf(value);
  const dotted = value.startsWith("dotted");
  return (
    <g transform={`translate(${x}, ${y})`} data-rest={base}>
      {base === "whole" ? (
        <rect x={-9} y={0} width={18} height={6} fill={PARCHMENT} />
      ) : base === "half" ? (
        <rect x={-9} y={-6} width={18} height={6} fill={PARCHMENT} />
      ) : base === "quarter" ? (
        <path
          d="M-3 -20 L5 -10 L-2 -3 L5 6 C-2 4 -6 8 -1 14 C-8 10 -8 2 -2 2 L-6 -8 L2 -16 Z"
          fill={PARCHMENT}
        />
      ) : (
        <g>
          <path d="M4 -14 L-3 10" stroke={PARCHMENT} strokeWidth={2} />
          <circle cx={-3} cy={-12} r={3} fill={PARCHMENT} />
          <path d="M-3 -12 C 0 -7, 3 -8, 4 -14" stroke={PARCHMENT} strokeWidth={2} fill="none" />
        </g>
      )}
      {dotted ? <circle cx={13} cy={-2} r={2.4} fill={PARCHMENT} /> : null}
    </g>
  );
}

export function RhythmDiagram({ visual }: { visual: RhythmVisual }) {
  const slot = 104;
  const width = visual.values.length * slot + 16;
  const lineY = 58;
  return (
    <svg viewBox={`0 0 ${width} 112`} className={SVG_CLASS} role="img" aria-label={visual.alt}>
      <line
        x1={8}
        x2={width - 8}
        y1={lineY}
        y2={lineY}
        stroke={PARCHMENT}
        strokeOpacity={0.5}
        strokeWidth={1.2}
      />
      {visual.values.map((value, index) => {
        const x = 8 + slot * index + slot / 2;
        return (
          <g key={`${value}-${index}`}>
            <NoteGlyph value={value} x={x} y={lineY} />
            <text
              x={x}
              y={lineY + 26}
              textAnchor="middle"
              fill={PARCHMENT}
              fontSize="12"
              fontFamily="var(--font-mono)"
            >
              {RHYTHM_NAMES[value]}
            </text>
            <text
              x={x}
              y={lineY + 42}
              textAnchor="middle"
              fill={MUTED}
              fontSize="11"
              fontFamily="var(--font-mono)"
            >
              {beatsLabel(RHYTHM_BEATS[value])}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Bars laid out so that each event takes width in proportion to its length. */
export function MeasuresDiagram({ visual }: { visual: MeasuresVisual }) {
  const perBeat = 40;
  const meterW = 30;
  const pad = 12;
  const lineY = 56;
  const height = 104;
  // Each event takes width in proportion to its length, but never less than a glyph needs.
  const eventW = (e: RhythmEvent) => Math.max(RHYTHM_BEATS[e.value] * perBeat, 26);
  const barWidth = (events: RhythmEvent[], meter?: string) =>
    (meter ? meterW : 0) + pad + events.reduce((sum, e) => sum + eventW(e), 0);
  // A short single bar is padded rather than stretched to the figure's full width.
  const width = Math.max(
    visual.bars.reduce((sum, b) => sum + barWidth(b.events, b.meter), 0) + 12,
    320,
  );

  let cursor = 6;
  const bars = visual.bars.map((bar) => {
    const start = cursor;
    let x = start + (bar.meter ? meterW : 0) + pad / 2;
    const events = bar.events.map((event) => {
      const w = eventW(event);
      const cx = x + Math.min(w / 2, perBeat / 2);
      x += w;
      return { event, cx };
    });
    cursor += barWidth(bar.events, bar.meter);
    return { bar, start, end: cursor, events };
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={SVG_CLASS}
      role="img"
      aria-label={visual.alt}
    >
      <line
        x1={6}
        x2={width - 6}
        y1={lineY}
        y2={lineY}
        stroke={PARCHMENT}
        strokeOpacity={0.5}
        strokeWidth={1.2}
      />
      {bars.map(({ bar, start, end, events }, b) => (
        <g key={b}>
          <line
            x1={start}
            x2={start}
            y1={lineY - 22}
            y2={lineY + 22}
            stroke={PARCHMENT}
            strokeWidth={1.5}
          />
          {b === bars.length - 1 ? (
            <line
              x1={end}
              x2={end}
              y1={lineY - 22}
              y2={lineY + 22}
              stroke={PARCHMENT}
              strokeWidth={3}
            />
          ) : null}
          {bar.meter ? (
            <text
              x={start + 4 + meterW / 2}
              y={lineY + 5}
              textAnchor="middle"
              fill={PARCHMENT}
              fontSize="15"
              fontFamily="var(--font-mono)"
              fontWeight="bold"
            >
              {bar.meter}
            </text>
          ) : null}
          {events.map(({ event, cx }, i) => (
            <g key={i}>
              {event.rest ? (
                <RestGlyph value={event.value} x={cx} y={lineY} />
              ) : (
                <NoteGlyph value={event.value} x={cx} y={lineY} />
              )}
              {event.tie && i < events.length - 1 ? (
                <path
                  d={`M${cx + 4} ${lineY + 9} Q ${(cx + events[i + 1]!.cx) / 2} ${lineY + 24}, ${events[i + 1]!.cx - 4} ${lineY + 9}`}
                  stroke={HARMONY}
                  strokeWidth={2}
                  fill="none"
                  data-tie=""
                />
              ) : null}
              {event.accent ? (
                <text
                  x={cx}
                  y={lineY - 40}
                  textAnchor="middle"
                  fill={HARMONY}
                  fontSize="16"
                  fontWeight="bold"
                  data-accent=""
                >
                  &gt;
                </text>
              ) : null}
              {event.count ? (
                <text
                  x={cx}
                  y={lineY + 40}
                  textAnchor="middle"
                  fill={event.rest ? MUTED : PARCHMENT}
                  fontSize="12"
                  fontFamily="var(--font-mono)"
                >
                  {event.count}
                </text>
              ) : null}
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

/* ------------------------------ grid ----------------------------- */

type GridVisual = Extract<LessonVisual, { kind: "grid" }>;

export function GridDiagram({ visual }: { visual: GridVisual }) {
  const cell = 40;
  const labelW = 70;
  const rowH = 40;
  const width = labelW + visual.columns * cell + 8;
  const height = 24 + visual.rows.length * rowH;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={SVG_CLASS}
      role="img"
      aria-label={visual.alt}
    >
      {Array.from({ length: visual.columns }, (_, c) => (
        <text
          key={c}
          x={labelW + c * cell + cell / 2}
          y={14}
          textAnchor="middle"
          fill={MUTED}
          fontSize="11"
          fontFamily="var(--font-mono)"
        >
          {c + 1}
        </text>
      ))}
      {visual.rows.map((row, r) => {
        const y = 24 + r * rowH + rowH / 2;
        return (
          <g key={row.label}>
            <text
              x={labelW - 8}
              y={y + 4}
              textAnchor="end"
              fill={PARCHMENT}
              fontSize="12"
              fontFamily="var(--font-mono)"
            >
              {row.label}
            </text>
            {Array.from({ length: visual.columns }, (_, c) => {
              const hit = row.hits.includes(c + 1);
              return (
                <g key={c}>
                  <rect
                    x={labelW + c * cell + 2}
                    y={y - rowH / 2 + 2}
                    width={cell - 4}
                    height={rowH - 4}
                    rx={4}
                    fill={PARCHMENT}
                    fillOpacity={0.06}
                    stroke={PARCHMENT}
                    strokeOpacity={0.2}
                  />
                  {hit ? (
                    <circle
                      cx={labelW + c * cell + cell / 2}
                      cy={y}
                      r={9}
                      fill={HARMONY}
                      data-hit=""
                    />
                  ) : null}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ----------------------------- circle ---------------------------- */

type CircleVisual = Extract<LessonVisual, { kind: "circle" }>;

export function CircleDiagram({ visual }: { visual: CircleVisual }) {
  const size = 260;
  const c = size / 2;
  const r = 100;
  const lit = new Set(visual.highlight);
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto block h-auto w-full max-w-[280px]"
      role="img"
      aria-label={visual.alt}
    >
      <circle
        cx={c}
        cy={c}
        r={r}
        fill="none"
        stroke={PARCHMENT}
        strokeOpacity={0.35}
        strokeWidth={1.2}
      />
      {CIRCLE_OF_FIFTHS.map((tonic, i) => {
        const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x = c + Math.cos(angle) * r;
        const y = c + Math.sin(angle) * r;
        const on = lit.has(tonic);
        return (
          <g key={tonic} data-key={tonic} data-lit={on ? "" : undefined}>
            <circle
              cx={x}
              cy={y}
              r={17}
              fill={on ? HARMONY : "var(--color-ink)"}
              stroke={on ? HARMONY : PARCHMENT}
              strokeOpacity={on ? 1 : 0.5}
              strokeWidth={1.5}
            />
            <text
              x={x}
              y={y + 5}
              textAnchor="middle"
              fill={on ? "var(--color-ink)" : PARCHMENT}
              fontSize="14"
              fontWeight={on ? "bold" : "normal"}
              fontFamily="var(--font-mono)"
            >
              {tonic}
            </text>
          </g>
        );
      })}
      <text
        x={c}
        y={c - 6}
        textAnchor="middle"
        fill={MUTED}
        fontSize="11"
        fontFamily="var(--font-mono)"
      >
        clockwise: + sharp
      </text>
      <text
        x={c}
        y={c + 12}
        textAnchor="middle"
        fill={MUTED}
        fontSize="11"
        fontFamily="var(--font-mono)"
      >
        anticlockwise: + flat
      </text>
    </svg>
  );
}
