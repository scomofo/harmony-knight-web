/**
 * Deterministic randomness for generated practice. Items are identified by
 * derivation, not storage: the same seed parts always produce the same
 * stream, so a generated question set is stable across refresh and identical
 * for every caller that holds the same state (see recall-gen.ts).
 */

/** mulberry32: a small, well-known seeded PRNG (public-domain algorithm). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a string hash, folded with any numeric parts, as a uint32 seed. */
export function hashSeed(...parts: (string | number)[]): number {
  let h = 0x811c9dc5;
  const text = parts.join(":");
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A seeded rng stream for the given identity parts. */
export function rngFor(...parts: (string | number)[]): () => number {
  return mulberry32(hashSeed(...parts));
}
