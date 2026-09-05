import { KEYS, TREBLE_FLAT_STEPS, TREBLE_SHARP_STEPS } from "@/lib/game/music";

/**
 * A treble staff showing the key signature for a major key — the sharps or
 * flats in the order they are written, at their conventional heights.
 */
export function KeySignature({
  tonic,
  width = 240,
  height = 120,
  showName = false,
}: {
  tonic: string;
  width?: number;
  height?: number;
  showName?: boolean;
}) {
  const key = KEYS.find((k) => k.tonic === tonic && k.isMajor);
  const count = key?.accidentals ?? 0;
  const kind = key?.kind ?? "none";
  const lineGap = 12;
  const staffTop = 28;
  const e4Y = staffTop + 4 * lineGap;
  const yFor = (steps: number) => e4Y - (steps - 2) * (lineGap / 2);
  const steps = kind === "sharp" ? TREBLE_SHARP_STEPS : TREBLE_FLAT_STEPS;
  const glyph = kind === "sharp" ? "♯" : "♭";

  return (
    <div className="flex flex-col items-center">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={
          key
            ? kind === "none"
              ? "Key signature with no sharps or flats"
              : `Key signature with ${count} ${kind}${count === 1 ? "" : "s"}`
            : "Key signature"
        }
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1={16}
            x2={width - 16}
            y1={staffTop + i * lineGap}
            y2={staffTop + i * lineGap}
            stroke="var(--color-parchment)"
            strokeOpacity={0.7}
            strokeWidth={1.2}
          />
        ))}
        <text
          x={20}
          y={staffTop + 3.35 * lineGap}
          fill="var(--color-parchment)"
          fontSize="38"
          fontFamily="Georgia, serif"
        >
          𝄞
        </text>
        {Array.from({ length: count }, (_, i) => (
          <text
            key={i}
            x={62 + i * 15}
            y={yFor(steps[i]!) + (kind === "sharp" ? 5 : 3)}
            fill="var(--color-parchment)"
            fontSize={kind === "sharp" ? 20 : 22}
            fontFamily="Georgia, serif"
            textAnchor="middle"
          >
            {glyph}
          </text>
        ))}
        {count === 0 ? (
          <text
            x={80}
            y={staffTop + 2.3 * lineGap}
            fill="var(--color-muted)"
            fontSize="11"
            fontFamily="var(--font-mono)"
          >
            no sharps · no flats
          </text>
        ) : null}
      </svg>
      {showName && key ? (
        <p className="mt-1 font-mono text-sm text-[var(--color-parchment)]">{key.name}</p>
      ) : null}
    </div>
  );
}
