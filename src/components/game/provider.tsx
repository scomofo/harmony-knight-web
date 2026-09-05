import { useEffect, useState, type ReactNode } from "react";
import { setMasterGain, unlockAudio } from "@/lib/game/audio";
import { useGameStore } from "@/lib/game/store";
import { KnightCrest } from "./crest";

export function GameProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const persistApi = useGameStore.persist;
    const finish = () => {
      useGameStore.getState().hydrateDay();
      const { settings } = useGameStore.getState();
      if (settings.muted) setMasterGain(0);
      else setMasterGain(settings.masterVolume);
      setReady(true);
    };
    if (persistApi.hasHydrated()) {
      finish();
      return;
    }
    const unsub = persistApi.onFinishHydration(finish);
    void persistApi.rehydrate();
    return () => unsub();
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") unlockAudio();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-[var(--color-ink)] text-[var(--color-parchment)]">
        <KnightCrest size={96} />
        <p className="font-[var(--font-display)] text-2xl tracking-[-0.03em]">Harmony Knight</p>
        <p className="text-sm text-[var(--color-muted)]">Opening the hall…</p>
      </div>
    );
  }

  return children;
}
