import { useCallback, useEffect, useRef, useState } from "react";
import { playTeachingPlan } from "@/lib/game/audio";
import { activeTeachingStep, type TeachingPlan } from "@/lib/game/teaching-playback";
import { useGameStore } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function useTeachingPlayer() {
  const muted = useGameStore((s) => s.settings.muted);
  const [speed, setSpeed] = useState(1);
  const [state, setState] = useState<{ plan: TeachingPlan; index: number; label: string } | null>(
    null,
  );
  const [error, setError] = useState(false);
  const handle = useRef<ReturnType<typeof playTeachingPlan> | null>(null);
  const frame = useRef<number | null>(null);
  const stop = useCallback(() => {
    handle.current?.stop();
    handle.current = null;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setState(null);
  }, []);
  useEffect(() => {
    const hidden = () => {
      if (document.visibilityState === "hidden") stop();
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      stop();
    };
  }, [stop]);
  useEffect(() => {
    if (muted) stop();
  }, [muted, stop]);
  const play = (plan: TeachingPlan, label: string) => {
    stop();
    setError(false);
    if (muted) return;
    try {
      const playback = playTeachingPlan(plan, speed);
      handle.current = playback;
      setState({ plan, index: activeTeachingStep(plan, 0), label });
      const tick = () => {
        if (handle.current !== playback) return;
        const elapsed = playback.elapsed();
        if (elapsed >= plan.duration) {
          stop();
          return;
        }
        const index = activeTeachingStep(plan, elapsed);
        setState((old) => (old && old.index !== index ? { ...old, index } : old));
        frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    } catch {
      stop();
      setError(true);
    }
  };
  return {
    play,
    stop,
    state,
    error,
    speed,
    muted,
    setSpeed: (value: number) => {
      stop();
      setSpeed(value);
    },
  };
}
export type TeachingPlayer = ReturnType<typeof useTeachingPlayer>;

export function PlaybackOptions({
  player,
  hideNotes = false,
}: {
  player: TeachingPlayer;
  hideNotes?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          Playback speed{" "}
          <select
            aria-label="Playback speed"
            value={player.speed}
            onChange={(e) => player.setSpeed(Number(e.target.value))}
            className="min-h-11 rounded border border-[var(--color-border-strong)] bg-[var(--color-ink-2)] px-2"
          >
            <option value={1}>Normal</option>
            <option value={0.75}>Slower · ¾ speed</option>
            <option value={0.5}>Slowest · ½ speed</option>
          </select>
        </label>
        <Button variant="ghost" onClick={player.stop} disabled={!player.state}>
          Stop sound
        </Button>
      </div>
      {player.state ? (
        <div>
          <p role="status" className="text-sm text-[var(--color-muted)]">
            Playing: {player.state.label}
          </p>
          <div className="mt-2 flex flex-wrap gap-2" aria-label="Playback positions">
            {player.state.plan.steps.map((step, i) => (
              <span
                key={i}
                aria-current={i === player.state!.index ? "step" : undefined}
                className={cn(
                  "rounded border px-3 py-2 text-sm",
                  i === player.state!.index
                    ? "border-[var(--color-harmony)] bg-[var(--color-ink-3)]"
                    : "border-[var(--color-border)]",
                )}
              >
                {hideNotes ? `Sound ${i + 1}` : step.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {player.error ? (
        <p role="status">
          Audio could not start. Try again, or continue with the written guidance.
        </p>
      ) : null}
    </div>
  );
}
