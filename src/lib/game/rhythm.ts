export const RHYTHM_BPM = 88;
export const BEAT_MS = 60_000 / RHYTHM_BPM;
/** A tap within this fraction of a beat counts as on time. */
export const TAP_TOLERANCE = 0.2;

export function noteValueName(beat: number): string {
  if (beat === 4) return "whole";
  if (beat === 3) return "dotted half";
  if (beat === 2) return "half";
  if (beat === 1.5) return "dotted quarter";
  if (beat === 1) return "quarter";
  if (beat === 0.5) return "eighth";
  return `${beat} beats`;
}

export type TapScore = {
  hits: number;
  expected: number;
  meanErrorMs: number;
  passed: boolean;
};

/** Onset times (ms from the downbeat) for a list of beat lengths. */
export function onsetsMs(beats: number[], beatMs = BEAT_MS): number[] {
  const out: number[] = [];
  let t = 0;
  for (const b of beats) {
    out.push(t);
    t += b * beatMs;
  }
  return out;
}

/**
 * Match taps (ms from the downbeat) against expected onsets. Each onset takes
 * the nearest unused tap inside the tolerance window; extra taps cost a hit.
 */
export function scoreTaps(beats: number[], tapsMs: number[], beatMs = BEAT_MS): TapScore {
  const onsets = onsetsMs(beats, beatMs);
  const window = TAP_TOLERANCE * beatMs;
  const used = new Set<number>();
  let hits = 0;
  let errorSum = 0;
  for (const onset of onsets) {
    let best = -1;
    let bestErr = Infinity;
    tapsMs.forEach((tap, i) => {
      if (used.has(i)) return;
      const err = Math.abs(tap - onset);
      if (err < bestErr) {
        bestErr = err;
        best = i;
      }
    });
    if (best >= 0 && bestErr <= window) {
      used.add(best);
      hits += 1;
      errorSum += bestErr;
    }
  }
  const extra = Math.max(0, tapsMs.length - onsets.length);
  const effective = Math.max(0, hits - extra);
  return {
    hits: effective,
    expected: onsets.length,
    meanErrorMs: hits ? errorSum / hits : 0,
    passed: onsets.length > 0 && effective / onsets.length >= 0.75,
  };
}
