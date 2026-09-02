export type ChartNote = {
  id: number;
  time: number;
  midi: number;
  lane: number;
  duration: number;
  hit?: "perfect" | "great" | "good" | "miss";
};

export type Chart = {
  title: string;
  bpm: number;
  durationSeconds: number;
  notes: ChartNote[];
};

export const LANE_MIDIS = [60, 64, 67, 72] as const;
export const LANE_LABELS = ["C4", "E4", "G4", "C5"] as const;
export const HIT_WINDOW = 0.22;

export function buildTrainingChart(noteCount = 16, spacing = 0.68): Chart {
  const notes: ChartNote[] = [];
  let last = 0;
  for (let i = 0; i < noteCount; i++) {
    let lane: number;
    if (i < 4) {
      lane = i;
    } else {
      lane = Math.floor(Math.random() * 4);
      if (lane === last) {
        lane = (lane + 1 + Math.floor(Math.random() * 3)) % 4;
      }
    }
    last = lane;
    notes.push({
      id: i,
      time: 1.55 + i * spacing,
      duration: 0,
      midi: LANE_MIDIS[lane]!,
      lane,
    });
  }
  return {
    title: "Strike Training",
    bpm: 108,
    durationSeconds: 1.55 + noteCount * spacing + 1.4,
    notes,
  };
}

export type HitWindow = "perfect" | "great" | "good" | "miss";

export function rateHit(delta: number): HitWindow {
  const abs = Math.abs(delta);
  if (abs <= 0.05) return "perfect";
  if (abs <= 0.1) return "great";
  if (abs <= 0.16) return "good";
  return "miss";
}

export function scoreFor(hit: HitWindow): number {
  if (hit === "perfect") return 100;
  if (hit === "great") return 70;
  if (hit === "good") return 40;
  return 0;
}
