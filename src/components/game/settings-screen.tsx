import { setMasterGain } from "@/lib/game/audio";
import { useGameStore } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { GameShell } from "./shell";

export function SettingsScreen() {
  const settings = useGameStore((s) => s.settings);
  const patch = useGameStore((s) => s.patchSettings);
  const reset = useGameStore((s) => s.resetProgress);
  const grade = useGameStore((s) => s.gradeLevel);

  return (
    <GameShell title="Settings">
      <div className="space-y-6">
        <Toggle
          label="High contrast"
          hint="Stronger borders, less wash."
          checked={settings.highContrast}
          onChange={(v) => patch({ highContrast: v })}
        />
        <Toggle
          label="Reduce motion"
          hint="Quieter strike-lane animation."
          checked={settings.reducedMotion}
          onChange={(v) => patch({ reducedMotion: v })}
        />
        <Toggle
          label="Mute"
          hint="Silence tones until you unmute."
          checked={settings.muted}
          onChange={(v) => {
            patch({ muted: v });
            setMasterGain(v ? 0 : settings.masterVolume);
          }}
        />
        <label className="block">
          <span className="text-sm">Volume</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.masterVolume * 100)}
            onChange={(e) => {
              const v = Number(e.target.value) / 100;
              patch({ masterVolume: v, muted: false });
              setMasterGain(v);
            }}
            className="mt-2 h-2 w-full appearance-none rounded-full bg-[var(--color-ink-3)] accent-[var(--color-harmony)]"
          />
        </label>
        <label className="block">
          <span className="text-sm">Session length · {settings.sessionMinutes} min</span>
          <input
            type="range"
            min={3}
            max={15}
            value={settings.sessionMinutes}
            onChange={(e) => patch({ sessionMinutes: Number(e.target.value) })}
            className="mt-2 h-2 w-full appearance-none rounded-full bg-[var(--color-ink-3)] accent-[var(--color-harmony)]"
          />
        </label>
        <p className="text-sm text-[var(--color-muted)]">Current grade: {grade}</p>
        <Button
          variant="outline"
          onClick={() => {
            if (confirm("Reset all local progress?")) reset();
          }}
        >
          Reset progress
        </Button>
      </div>
    </GameShell>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-ink-2)] px-4 py-3 text-left"
    >
      <span>
        <span className="block text-sm">{label}</span>
        <span className="block text-xs text-[var(--color-muted)]">{hint}</span>
      </span>
      <span
        className="relative h-6 w-11 rounded-full"
        style={{ background: checked ? "var(--color-harmony)" : "var(--color-ink-3)" }}
      >
        <span
          className="absolute top-0.5 size-5 rounded-full bg-[var(--color-parchment)] transition-transform duration-[var(--motion-quick)]"
          style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
        />
      </span>
    </button>
  );
}
