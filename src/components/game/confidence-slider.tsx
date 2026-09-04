import { useGameStore } from "@/lib/game/store";

export function ConfidenceSlider() {
  const confidence = useGameStore((s) => s.confidence);
  const setConfidence = useGameStore((s) => s.setConfidence);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">Confidence</p>
        <p className="text-xs text-[var(--color-muted)]">
          {confidence < 0.35 ? "Figurenotes" : confidence < 0.75 ? "Transition" : "Maestro"}
        </p>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(confidence * 100)}
        onChange={(e) => setConfidence(Number(e.target.value) / 100)}
        aria-label="Confidence scaffolding"
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--color-ink-3)] accent-[var(--color-harmony)]"
      />
      <div className="mt-2 flex justify-between text-[11px] text-[var(--color-subtle)]">
        <span>Color & shape</span>
        <span>Standard notation</span>
      </div>
    </div>
  );
}
