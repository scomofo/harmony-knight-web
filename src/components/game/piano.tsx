import { figureNoteColor, noteName, pitchClass } from "@/lib/game/music";
import { cn } from "@/lib/utils";

const WHITE = [0, 2, 4, 5, 7, 9, 11];
const BLACK = [1, 3, 6, 8, 10];

export function MiniPiano({
  fromMidi = 60,
  toMidi = 76,
  onPlay,
  highlighted,
  disabled,
  safeMidis,
  hintMidi,
  dimUnsafe = false,
}: {
  fromMidi?: number;
  toMidi?: number;
  onPlay: (midi: number) => void;
  highlighted?: number | null;
  disabled?: boolean;
  safeMidis?: number[];
  hintMidi?: number | null;
  dimUnsafe?: boolean;
}) {
  const whites: number[] = [];
  const blacks: { midi: number; index: number }[] = [];
  for (let m = fromMidi; m <= toMidi; m++) {
    const pc = pitchClass(m);
    if (WHITE.includes(pc)) whites.push(m);
  }
  whites.forEach((midi, i) => {
    const next = midi + 1;
    if (next <= toMidi && BLACK.includes(pitchClass(next))) {
      blacks.push({ midi: next, index: i });
    }
  });
  const safe = new Set(safeMidis ?? []);

  return (
    <div className="relative mx-auto w-full max-w-xl select-none" style={{ height: 112 }}>
      <div className="absolute inset-0 flex">
        {whites.map((midi) => {
          const active = highlighted === midi;
          const hinted = hintMidi === midi;
          const isSafe = safe.has(midi);
          return (
            <button
              key={midi}
              type="button"
              disabled={disabled}
              aria-label={noteName(midi)}
              onClick={() => onPlay(midi)}
              className={cn(
                "relative h-full flex-1 border border-[var(--color-ink)] first:rounded-l-[var(--radius-sm)] last:rounded-r-[var(--radius-sm)]",
                active || hinted
                  ? "bg-[var(--color-harmony)]"
                  : isSafe
                    ? "bg-[color-mix(in_oklab,var(--color-harmony)_34%,var(--color-parchment))]"
                    : "bg-[var(--color-parchment)] hover:opacity-90",
                dimUnsafe && !isSafe && !active && "opacity-40",
              )}
            >
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-xs tabular-nums text-[var(--color-ink)] opacity-70">
                {noteName(midi)}
              </span>
            </button>
          );
        })}
      </div>
      {blacks.map(({ midi, index }) => {
        const widthPct = 100 / whites.length;
        const left = (index + 1) * widthPct - widthPct * 0.32;
        const active = highlighted === midi;
        const hinted = hintMidi === midi;
        const isSafe = safe.has(midi);
        return (
          <button
            key={midi}
            type="button"
            disabled={disabled}
            aria-label={noteName(midi)}
            onClick={() => onPlay(midi)}
            className={cn(
              "absolute top-0 z-10 h-[62%] rounded-b-[var(--radius-xs)]",
              dimUnsafe && !isSafe && !active && "opacity-40",
            )}
            style={{
              left: `${left}%`,
              width: `${widthPct * 0.64}%`,
              background:
                active || hinted
                  ? figureNoteColor(midi)
                  : isSafe
                    ? "color-mix(in oklab, var(--color-harmony) 55%, var(--color-ink-2))"
                    : "var(--color-ink-2)",
            }}
          />
        );
      })}
    </div>
  );
}
