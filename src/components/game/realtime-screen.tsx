import { useCallback, useEffect, useRef, useState } from "react";
import { playLevelUp, playSuccess, stopTones } from "@/lib/game/audio";
import { buildTrainingChart, type ChartNote, type HitWindow } from "@/lib/game/realtime";
import { useGameStore } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { NoteHighway, type HighwayStats } from "./highway";
import { SessionSummary } from "./session-summary";
import { GameShell } from "./shell";

export function RealtimeScreen() {
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);
  const streak = useGameStore((s) => s.currentStreak);
  const recordRealtime = useGameStore((s) => s.recordRealtime);
  const [chart, setChart] = useState(() => buildTrainingChart());
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [hud, setHud] = useState({ score: 0, combo: 0, last: "" });
  const [leveled, setLeveled] = useState<number | null>(null);
  const active = useRef(false);
  const statsRef = useRef<HighwayStats>({
    score: 0,
    combo: 0,
    hits: 0,
    misses: 0,
    last: null,
  });

  const onHud = useCallback(() => {
    const s = statsRef.current;
    setHud({
      score: Math.round(s.score),
      combo: s.combo,
      last: s.last ?? "",
    });
  }, []);

  const onHit = useCallback(
    (_note: ChartNote, rating: HitWindow) => {
      if (!active.current) return;
      onHud();
      const judged = recordRealtime(rating !== "miss");
      if (judged.leveledUp) {
        playLevelUp();
        setLeveled(judged.newGrade);
      }
    },
    [onHud, recordRealtime],
  );

  const onComplete = useCallback(() => {
    if (!active.current) return;
    active.current = false;
    setRunning(false);
    setDone(true);
    const s = statsRef.current;
    if (s.hits >= 8) playSuccess();
  }, []);

  const start = () => {
    stopTones();
    setChart(buildTrainingChart(16, 0.68));
    setDone(false);
    setLeveled(null);
    setRunning(true);
    setStarted(true);
    active.current = true;
    setHud({ score: 0, combo: 0, last: "" });
    statsRef.current = { score: 0, combo: 0, hits: 0, misses: 0, last: null };
  };

  const pause = useCallback(() => {
    active.current = false;
    setRunning(false);
    stopTones();
  }, []);

  useEffect(() => {
    const hide = () => {
      if (document.visibilityState === "hidden") pause();
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      stopTones();
    };
  }, [pause]);

  return (
    <GameShell title="Strike Training">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--color-muted)] text-pretty">
          Four named lanes — C4, E4, G4, C5. The first four notes teach the lanes; then they mix.
          Tap as they cross the steel line. Keys D F J K or 1–4.
        </p>
        <div className="flex items-center justify-between font-mono text-sm tabular-nums">
          <span>{hud.score}</span>
          <span className="text-[var(--color-harmony)]">
            {hud.combo > 1 ? `×${hud.combo}` : "combo"}
          </span>
          <span className="uppercase tracking-[0.12em] text-[var(--color-muted)]">
            {hud.last || "ready"}
          </span>
        </div>
        <NoteHighway
          chart={chart}
          running={running}
          reducedMotion={reducedMotion}
          onHit={onHit}
          onComplete={onComplete}
          onHud={onHud}
          statsRef={statsRef}
        />
        <Button
          size="lg"
          onClick={() => {
            if (running) pause();
            else if (started && !done) {
              active.current = true;
              setRunning(true);
            } else start();
          }}
        >
          {running ? "Pause run" : started && !done ? "Resume run" : "Start run"}
        </Button>
        {started && !done ? (
          <Button
            variant="outline"
            onClick={() => {
              pause();
              setDone(true);
            }}
          >
            End run
          </Button>
        ) : null}
      </div>
      {done ? (
        <SessionSummary
          title="Run complete"
          correct={statsRef.current.hits}
          total={statsRef.current.hits + statsRef.current.misses}
          points={statsRef.current.hits * 8}
          streak={streak}
          leveledUp={leveled != null}
          newGrade={leveled ?? undefined}
          onAgain={start}
        />
      ) : null}
    </GameShell>
  );
}
