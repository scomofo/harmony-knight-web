import { playMidi } from "@/lib/game/audio";
import {
  BASS_CLEF_STEP_OFFSET,
  figureNoteColor,
  figureNoteShape,
  noteName,
  staffStepsFromC4,
} from "@/lib/game/music";
import { FigureNoteGlyph } from "./figurenote";

export type Clef = "treble" | "bass" | "auto";

type StaffProps = {
  midi: number;
  confidence: number;
  revealName?: boolean;
  ghost?: boolean;
  width?: number;
  height?: number;
  /** "auto" draws notes below middle C on a bass staff. */
  clef?: Clef;
};

function clefFor(midi: number, clef: Clef = "auto"): "treble" | "bass" {
  if (clef !== "auto") return clef;
  return midi < 60 ? "bass" : "treble";
}

export function Staff({
  midi,
  confidence,
  revealName = false,
  ghost = false,
  width = 280,
  height = 168,
  clef = "auto",
}: StaffProps) {
  const staffOpacity = Math.max(0, Math.min(1, (confidence - 0.28) / 0.72));
  const colorAmount = Math.max(0, 1 - confidence);
  const shape = figureNoteShape(midi);
  const color = figureNoteColor(midi);
  const faded = confidence >= 0.85;
  const activeClef = clefFor(midi, clef);
  // Treble: E4 (bottom line) is 2 steps above C4, top line F5 is 10.
  // Bass: G2 is the bottom line, 12 steps lower — so shift the note up by 12.
  const steps = staffStepsFromC4(midi) + (activeClef === "bass" ? BASS_CLEF_STEP_OFFSET : 0);
  const lineGap = 14;
  const staffTop = 36;
  const e4Y = staffTop + 4 * lineGap;
  const noteY = e4Y - (steps - 2) * (lineGap / 2);
  const noteX = width * 0.55;
  const glyphSize = 26 + (1 - confidence) * 10;

  const lines = [0, 1, 2, 3, 4];
  const ledger: number[] = [];
  if (steps < 2) ledger.push(e4Y + lineGap);
  if (steps > 10) ledger.push(staffTop - lineGap);

  return (
    <div className="relative flex flex-col items-center">
      <button
        type="button"
        onClick={() => playMidi(midi)}
        className="rounded-[var(--radius-md)] transition-transform duration-[var(--motion-quick)] active:scale-[0.99]"
        aria-label={revealName ? `Play ${noteName(midi)}` : "Play this note"}
      >
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          {staffOpacity > 0.02
            ? lines.map((i) => (
                <line
                  key={i}
                  x1={24}
                  x2={width - 24}
                  y1={staffTop + i * lineGap}
                  y2={staffTop + i * lineGap}
                  stroke="var(--color-parchment)"
                  strokeOpacity={0.22 + staffOpacity * 0.55}
                  strokeWidth={1.2}
                />
              ))
            : null}
          {staffOpacity > 0.15 ? (
            activeClef === "treble" ? (
              <text
                x={28}
                y={staffTop + 3.35 * lineGap}
                fill="var(--color-parchment)"
                fillOpacity={staffOpacity * 0.85}
                fontSize="44"
                fontFamily="Georgia, serif"
              >
                𝄞
              </text>
            ) : (
              <text
                x={28}
                y={staffTop + 3.05 * lineGap}
                fill="var(--color-parchment)"
                fillOpacity={staffOpacity * 0.85}
                fontSize="40"
                fontFamily="Georgia, serif"
              >
                𝄢
              </text>
            )
          ) : null}
          {staffOpacity > 0.15 && activeClef === "bass" ? (
            <text
              x={width - 26}
              y={staffTop - 8}
              fill="var(--color-muted)"
              fillOpacity={staffOpacity}
              fontSize="10"
              fontFamily="var(--font-mono)"
              textAnchor="end"
            >
              bass clef
            </text>
          ) : null}
          {ledger.map((y) => (
            <line
              key={y}
              x1={noteX - 22}
              x2={noteX + 22}
              y1={y}
              y2={y}
              stroke="var(--color-parchment)"
              strokeOpacity={0.45 + staffOpacity * 0.4}
              strokeWidth={1.2}
            />
          ))}
          {ghost ? (
            <ellipse
              cx={noteX}
              cy={noteY}
              rx={16}
              ry={11}
              fill="none"
              stroke="var(--color-harmony)"
              strokeDasharray="4 3"
              strokeWidth={1.5}
            />
          ) : null}
          {confidence < 0.92 ? (
            <foreignObject
              x={noteX - glyphSize / 2}
              y={noteY - glyphSize / 2}
              width={glyphSize}
              height={glyphSize}
            >
              <FigureNoteGlyph shape={shape} color={color} faded={faded} size={glyphSize} />
            </foreignObject>
          ) : (
            <g transform={`translate(${noteX}, ${noteY}) rotate(-18)`}>
              <ellipse rx="11" ry="8" fill="var(--color-parchment)" />
              <rect x="10" y="-32" width="2" height="34" fill="var(--color-parchment)" />
            </g>
          )}
        </svg>
      </button>
      {revealName ? (
        <p className="mt-1 font-mono text-sm tabular-nums text-[var(--color-parchment)]">
          {noteName(midi)}
        </p>
      ) : (
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {colorAmount > 0.6 ? "Tap the note to hear it" : "Tap the note · then name it"}
        </p>
      )}
    </div>
  );
}
