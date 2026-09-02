import { useEffect, useRef } from "react";
import {
  HIT_WINDOW,
  LANE_LABELS,
  LANE_MIDIS,
  rateHit,
  scoreFor,
  type Chart,
  type ChartNote,
  type HitWindow,
} from "@/lib/game/realtime";
import { figureNoteColor } from "@/lib/game/music";
import { playMidi } from "@/lib/game/audio";

export type HighwayStats = {
  score: number;
  combo: number;
  hits: number;
  misses: number;
  last: HitWindow | null;
};

const HIT_Y = 0.82;
const TRAVEL = 1.55;

export function NoteHighway({
  chart,
  running,
  reducedMotion,
  onHit,
  onComplete,
  onHud,
  statsRef,
}: {
  chart: Chart;
  running: boolean;
  reducedMotion: boolean;
  onHit: (note: ChartNote, rating: HitWindow) => void;
  onComplete: () => void;
  onHud?: () => void;
  statsRef: React.MutableRefObject<HighwayStats>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const notesRef = useRef<ChartNote[]>(chart.notes.map((n) => ({ ...n })));
  const runningRef = useRef(running);
  const completedRef = useRef(false);
  const flashRef = useRef<{ lane: number; t: number; kind: HitWindow } | null>(null);

  runningRef.current = running;

  useEffect(() => {
    notesRef.current = chart.notes.map((n) => ({ ...n }));
    timeRef.current = 0;
    completedRef.current = false;
    statsRef.current = { score: 0, combo: 0, hits: 0, misses: 0, last: null };
  }, [chart, statsRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const raw = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (runningRef.current) timeRef.current += raw;
      const t = timeRef.current;

      if (runningRef.current && !completedRef.current) {
        for (const n of notesRef.current) {
          if (n.hit) continue;
          if (t - n.time > HIT_WINDOW) {
            n.hit = "miss";
            statsRef.current.misses += 1;
            statsRef.current.combo = 0;
            statsRef.current.last = "miss";
            flashRef.current = { lane: n.lane, t, kind: "miss" };
            onHit(n, "miss");
            onHud?.();
          }
        }
      }

      draw(ctx, canvas, t, notesRef.current, reducedMotion, flashRef.current);
      if (runningRef.current && !completedRef.current && t > chart.durationSeconds) {
        completedRef.current = true;
        for (const n of notesRef.current) {
          if (!n.hit) {
            n.hit = "miss";
            statsRef.current.misses += 1;
            statsRef.current.combo = 0;
            statsRef.current.last = "miss";
            onHit(n, "miss");
          }
        }
        onComplete();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [chart.durationSeconds, onComplete, onHit, reducedMotion, statsRef]);

  const tapLane = (lane: number) => {
    if (!runningRef.current) return;
    const t = timeRef.current;
    let best: ChartNote | null = null;
    let bestDelta = 99;
    for (const n of notesRef.current) {
      if (n.lane !== lane || n.hit) continue;
      const delta = n.time - t;
      if (Math.abs(delta) < Math.abs(bestDelta)) {
        best = n;
        bestDelta = delta;
      }
    }
    if (!best || Math.abs(bestDelta) > HIT_WINDOW) {
      statsRef.current.combo = 0;
      statsRef.current.last = "miss";
      playMidi(LANE_MIDIS[lane]!, 0.28, 0.75);
      flashRef.current = { lane, t: timeRef.current, kind: "miss" };
      onHud?.();
      return;
    }
    const rating = rateHit(bestDelta);
    best.hit = rating;
    flashRef.current = { lane, t: timeRef.current, kind: rating };
    playMidi(best.midi, 0.42, 1);
    const s = statsRef.current;
    if (rating === "miss") {
      s.combo = 0;
      s.misses += 1;
    } else {
      s.combo += 1;
      s.hits += 1;
      s.score += scoreFor(rating) * (1 + Math.min(8, s.combo) * 0.05);
    }
    s.last = rating;
    onHit(best, rating);
    onHud?.();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, number> = {
        Digit1: 0,
        Digit2: 1,
        Digit3: 2,
        Digit4: 3,
        KeyD: 0,
        KeyF: 1,
        KeyJ: 2,
        KeyK: 3,
      };
      if (map[e.code] != null) {
        e.preventDefault();
        tapLane(map[e.code]!);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        className="h-96 w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-ink)] touch-none"
      />
      <div className="grid grid-cols-4 gap-2">
        {LANE_LABELS.map((label, i) => (
          <button
            key={label}
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              tapLane(i);
            }}
            className="flex min-h-14 flex-col items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-ink-2)] text-sm font-medium"
            style={{ boxShadow: `inset 0 -3px 0 ${figureNoteColor(LANE_MIDIS[i]!)}` }}
          >
            <span className="font-mono tabular-nums">{label}</span>
            <span className="text-xs uppercase tracking-[0.14em] text-[var(--color-subtle)]">
              {["D", "F", "J", "K"][i]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function draw(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  t: number,
  notes: ChartNote[],
  reduced: boolean,
  flash: { lane: number; t: number; kind: HitWindow } | null,
) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const lanes = 4;
  const pad = 18;
  const laneW = (w - pad * 2) / lanes;
  const hitY = h * HIT_Y;

  for (let i = 0; i < lanes; i++) {
    const x = pad + i * laneW;
    ctx.fillStyle = i % 2 === 0 ? "rgba(232,228,220,0.03)" : "rgba(232,228,220,0.015)";
    ctx.fillRect(x, 12, laneW, h - 24);
    ctx.strokeStyle = figureNoteColor(LANE_MIDIS[i]!);
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(x + laneW / 2, 16);
    ctx.lineTo(x + laneW / 2, h - 16);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = "rgba(232,228,220,0.85)";
  ctx.fillRect(pad, hitY - 1.5, w - pad * 2, 3);
  ctx.fillStyle = "rgba(111,158,175,0.25)";
  ctx.fillRect(pad, hitY - 10, w - pad * 2, 20);

  if (flash && t - flash.t < 0.18) {
    const x = pad + flash.lane * laneW;
    ctx.fillStyle =
      flash.kind === "miss" ? "rgba(180,70,50,0.22)" : "rgba(111,158,175,0.28)";
    ctx.fillRect(x, hitY - 28, laneW, 56);
  }

  for (const n of notes) {
    if (n.hit && n.hit !== "miss") continue;
    const y = hitY - ((n.time - t) / TRAVEL) * (h * 0.72);
    if (y < -30 || y > h + 30) continue;
    const x = pad + n.lane * laneW + laneW / 2;
    const color = figureNoteColor(n.midi);
    const alpha = n.hit === "miss" ? 0.25 : 1;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    const size = reduced ? 14 : 16;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(11,14,18,0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
