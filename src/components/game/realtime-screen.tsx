import { useCallback, useRef, useState } from "react";
import { playSuccess } from "@/lib/game/audio";
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
  const [done, setDone] = useState(false);
  const [hud, setHud] = useState({ score: 0, combo: 0, last: "" });
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
      onHud();
      recordRealtime(rating !== "miss");
    },
    [onHud, recordRealtime],
  );

  const onComplete = useCallback(() => {
    setRunning(false);
    setDone(true);
    const s = statsRef.current;
    if (s.hits >= 8) playSuccess();
  }, []);

  const start = () => {
    setChart(buildTrainingChart(16, 0.68));
    setDone(false);
    setRunning(true);
    setHud({ score: 0, combo: 0, last: "" });
    statsRef.current = { score: 0, combo: 0, hits: 0, misses: 0, last: null };
  };

  return (
    <GameShell title="Strike Training">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--color-muted)] text-pretty">
          Four named lanes — C4, E4, G4, C5. The first four notes teach the lanes; then they mix. Tap as they cross the steel line. Keys D F J K or 1–4.
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
        <Button size="lg" onClick={() => (running ? setRunning(false) : start())}>
          {running ? "Pause run" : done ? "Run again" : "Start run"}
        </Button>
      </div>
      {done ? (
        <SessionSummary
          title="Run complete"
          correct={statsRef.current.hits}
          total={statsRef.current.hits + statsRef.current.misses}
          points={Math.round(statsRef.current.score / 10)}
          streak={streak}
          onAgain={start}
        />
      ) : null}
    </GameShell>
  );
}
