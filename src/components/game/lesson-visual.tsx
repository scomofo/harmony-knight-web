import { RHYTHM_BEATS, type LessonVisual, type RhythmValue } from "@/lib/game/lessons";
import {
  figureNoteColor,
  figureNoteShape,
  noteLetter,
  pitchClass,
  staffStepsFromC4,
} from "@/lib/game/music";
import { FigureNoteGlyph } from "./figurenote";
import { KeySignature } from "./key-signature";

const PARCHMENT = "var(--color-parchment)";
const MUTED = "var(--color-muted)";

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

const LINE_GAP = 14;
const HALF = LINE_GAP / 2;
const LEFT = 24;
const NOTE_START = 84;
const GLYPH = 24;
/** Staff steps from C4 of each staff's bottom line: E4 for treble, G2 for bass. */
const BOTTOM_STEP = { treble: 2, bass: -10 } as const;

type StaffKind = "treble" | "bass";
type StaffVisual = Extract<LessonVisual, { kind: "staff" }>;

function ledgerSteps(steps: number, bottom: number): number[] {
  const lines: number[] = [];
  for (let s = bottom - 2; s >= steps; s -= 2) lines.push(s);
  for (let s = bottom + 10; s <= steps; s += 2) lines.push(s);
  return lines;
}

const isSharp = (midi: number) => [1, 3, 6, 8, 10].includes(pitchClass(midi));

export function StaffDiagram({ visual, width = 360 }: { visual: StaffVisual; width?: number }) {
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
    return bottomOf(kind) - (staffStepsFromC4(midi) - BOTTOM_STEP[kind]) * HALF;
  };
  // Letters go under the lowest note, so ledger-line notes never sit on top of them.
  const lowestY = Math.max(lastBottom, ...visual.notes.map(yFor));
  const labelY = Math.max(lastBottom + 2 * LINE_GAP, lowestY + GLYPH);
  const height = labelY + (visual.gaps ? LINE_GAP : 0) + 8;
  const span = width - LEFT - NOTE_START;
  const xFor = (index: number) =>
    visual.notes.length === 1
      ? NOTE_START + span / 2
      : NOTE_START + (span * index) / (visual.notes.length - 1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mx-auto block h-auto w-full max-w-[420px]"
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
      {visual.notes.map((midi, index) => {
        const kind = staffFor(midi);
        const x = xFor(index);
        const y = yFor(midi);
        const sharp = isSharp(midi);
        return (
          <g key={`${midi}-${index}`}>
            {ledgerSteps(staffStepsFromC4(midi), BOTTOM_STEP[kind]).map((s) => {
              const ly = bottomOf(kind) - (s - BOTTOM_STEP[kind]) * HALF;
              return (
                <line
                  key={s}
                  x1={x - 18}
                  x2={x + 18}
                  y1={ly}
                  y2={ly}
                  stroke={PARCHMENT}
                  strokeOpacity={0.8}
                  strokeWidth={1.2}
                />
              );
            })}
            {sharp ? (
              <text
                x={x - GLYPH / 2 - 4}
                y={y + 6}
                textAnchor="end"
                fill={PARCHMENT}
                fontSize="18"
                fontFamily="Georgia, serif"
              >
                ♯
              </text>
            ) : null}
            <foreignObject x={x - GLYPH / 2} y={y - GLYPH / 2} width={GLYPH} height={GLYPH}>
              <FigureNoteGlyph
                shape={figureNoteShape(midi)}
                color={figureNoteColor(midi)}
                size={GLYPH}
              />
            </foreignObject>
            <text
              x={x}
              y={labelY}
              textAnchor="middle"
              fill={PARCHMENT}
              fontSize="13"
              fontFamily="var(--font-mono)"
            >
              {noteLetter(midi)}
            </text>
            {visual.gaps?.[index] && index < visual.notes.length - 1 ? (
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

type KeyboardVisual = Extract<LessonVisual, { kind: "keyboard" }>;

const WHITE_W = 30;
const WHITE_H = 96;
const BLACK_W = 18;
const BLACK_H = 58;

export function KeyboardDiagram({ visual }: { visual: KeyboardVisual }) {
  const midis = Array.from({ length: visual.to - visual.from + 1 }, (_, i) => visual.from + i);
  const whites = midis.filter((m) => !isSharp(m));
  const blacks = midis.filter(isSharp);
  const lit = new Set(visual.highlight);
  const width = whites.length * WHITE_W + 2;
  const height = WHITE_H + 22;
  const whiteX = (midi: number) => whites.indexOf(midi) * WHITE_W + 1;
  // A black key sits astride the boundary after the white key below it.
  const blackX = (midi: number) => whiteX(midi - 1) + WHITE_W - BLACK_W / 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mx-auto block h-auto w-full max-w-[420px]"
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
            {noteLetter(midi)}
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
              {noteLetter(midi)}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

type RhythmVisual = Extract<LessonVisual, { kind: "rhythm" }>;

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

function NoteGlyph({ value, x, y }: { value: RhythmValue; x: number; y: number }) {
  const base = value.replace("dotted-", "") as "whole" | "half" | "quarter" | "eighth";
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

export function RhythmDiagram({ visual }: { visual: RhythmVisual }) {
  const slot = 104;
  const width = visual.values.length * slot + 16;
  const lineY = 58;
  return (
    <svg
      viewBox={`0 0 ${width} 112`}
      className="mx-auto block h-auto w-full max-w-[420px]"
      role="img"
      aria-label={visual.alt}
    >
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
