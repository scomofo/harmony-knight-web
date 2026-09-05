import { playMidi } from "@/lib/game/audio";
import { FIGURENOTE_COLORS, NOTE_NAMES } from "@/lib/game/music";
import { useGameStore } from "@/lib/game/store";
import { GameShell } from "./shell";
import { NoteReviewCard } from "./note-review-card";

export function HeatmapScreen() {
  const heatmap = useGameStore((s) => s.heatmap);
  const cells = NOTE_NAMES.map((name, pc) => {
    const entries = Object.entries(heatmap).filter(([midi]) => Number(midi) % 12 === pc);
    const attempts = entries.reduce((a, [, v]) => a + v.attempts, 0);
    const correct = entries.reduce((a, [, v]) => a + v.correct, 0);
    const acc = attempts ? correct / attempts : null;
    return { name, pc, attempts, acc };
  });

  return (
    <GameShell title="Note progress">
      <NoteReviewCard />
      <h2 className="mt-6 font-[var(--font-display)] text-xl">Lifetime pitch accuracy</h2>
      <p className="my-4 text-sm text-[var(--color-muted)] text-pretty">
        Note-reading answers grouped across octaves. New sessions count first tries only; older
        saves keep their original totals. Tap a pitch to hear it.
      </p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {cells.map((c) => {
          const heat = c.acc == null ? 0.12 : 0.2 + c.acc * 0.8;
          return (
            <button
              key={c.pc}
              type="button"
              onClick={() => playMidi(60 + c.pc)}
              aria-label={`${c.name}: ${c.acc == null ? "not tried" : `${Math.round(c.acc * 100)} percent from ${c.attempts} tries`}. Play note.`}
              className="aspect-square rounded-[var(--radius-md)] border border-[var(--color-border)] p-2 text-left transition-transform duration-[var(--motion-quick)] active:scale-[0.97] hover:border-[var(--color-border-strong)]"
              style={{
                background: `color-mix(in oklab, ${FIGURENOTE_COLORS[c.pc]} ${Math.round(heat * 55)}%, var(--color-ink-2))`,
              }}
            >
              <p className="font-mono text-sm">{c.name}</p>
              <p className="mt-2 font-mono text-xs tabular-nums text-[var(--color-parchment)]">
                {c.acc == null ? "—" : `${Math.round(c.acc * 100)}%`}
              </p>
              <p className="text-xs text-[var(--color-subtle)]">{c.attempts} tries</p>
            </button>
          );
        })}
      </div>
    </GameShell>
  );
}
