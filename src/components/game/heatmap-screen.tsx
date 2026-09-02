import { playMidi } from "@/lib/game/audio";
import { FIGURENOTE_COLORS, NOTE_NAMES } from "@/lib/game/music";
import { useGameStore } from "@/lib/game/store";
import { GameShell } from "./shell";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

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
    <GameShell title="Note heatmap">
      <p className="mb-5 text-sm text-[var(--color-muted)] text-pretty">
        Pitch-class accuracy across every session. Cool steel is sure. Ember still slips. Tap a pitch to hear it.
      </p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {cells.map((c) => {
          const heat = c.acc == null ? 0.12 : 0.2 + c.acc * 0.8;
          return (
            <button
              key={c.pc}
              type="button"
              onClick={() => playMidi(60 + c.pc)}
              aria-label={`Play ${c.name}`}
              className="aspect-square rounded-[var(--radius-md)] border border-[var(--color-border)] p-2 text-left transition-transform duration-[var(--motion-quick)] active:scale-[0.97] hover:border-[var(--color-border-strong)]"
              style={{
                background: `color-mix(in oklab, ${FIGURENOTE_COLORS[c.pc]} ${Math.round(heat * 55)}%, var(--color-ink-2))`,
              }}
            >
              <p className="font-mono text-sm">{c.name}</p>
              <p className="mt-2 font-mono text-xs tabular-nums text-[var(--color-parchment)]">
                {c.acc == null ? "—" : `${Math.round(c.acc * 100)}%`}
              </p>
              <p className="text-[10px] text-[var(--color-subtle)]">{c.attempts} tries</p>
            </button>
          );
        })}
      </div>
      <Button className="mt-6 w-full" asChild>
        <Link to="/practice" search={{ mode: "focus" }}>
          Drill weak notes
        </Link>
      </Button>
    </GameShell>
  );
}
