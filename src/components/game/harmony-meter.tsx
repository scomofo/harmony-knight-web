export function HarmonyMeter({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="w-full">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
          Harmony meter
        </span>
        <span className="font-mono text-xs tabular-nums text-[var(--color-parchment)]">
          {Math.round(pct * 100)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-ink-3)]">
        <div
          className="h-full rounded-full bg-[var(--color-harmony)] transition-[width] duration-[var(--motion-fast)] ease-[var(--ease-out)]"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}
