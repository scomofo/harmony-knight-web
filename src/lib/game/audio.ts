import { midiToFreq } from "./music.ts";

type Bus = {
  ctx: AudioContext;
  master: GainNode;
  sfx: GainNode;
  music: GainNode;
};

let bus: Bus | null = null;

function getCtx(): AudioContext {
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new AC({ latencyHint: "interactive" });
}

export function unlockAudio() {
  if (!bus) {
    const ctx = getCtx();
    const master = ctx.createGain();
    const sfx = ctx.createGain();
    const music = ctx.createGain();
    sfx.gain.value = 0.85;
    music.gain.value = 0.35;
    master.gain.value = 0.8;
    sfx.connect(master);
    music.connect(master);
    master.connect(ctx.destination);
    bus = { ctx, master, sfx, music };
  }
  if (bus.ctx.state === "suspended") {
    void bus.ctx.resume();
  }
  return bus;
}

export function setMasterGain(value: number) {
  if (!bus) return;
  const v = Math.max(0, Math.min(1, value));
  bus.master.gain.setTargetAtTime(v * v, bus.ctx.currentTime, 0.03);
}

export function resumeAudio() {
  if (bus && bus.ctx.state === "suspended") void bus.ctx.resume();
}

function playTone(
  dest: GainNode,
  ctx: AudioContext,
  freq: number,
  duration: number,
  when: number,
  type: OscillatorType,
  gain = 0.18,
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = Math.min(4200, freq * 8);
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(filter);
  filter.connect(g);
  g.connect(dest);
  const t = when;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.018);
  g.gain.exponentialRampToValueAtTime(gain * 0.55, t + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.02);
  osc.onended = () => {
    osc.disconnect();
    filter.disconnect();
    g.disconnect();
  };
}

function layeredNote(freq: number, duration: number, when: number, volume: number) {
  if (!bus) return;
  const { ctx, sfx } = bus;
  playTone(sfx, ctx, freq, duration, when, "triangle", 0.16 * volume);
  playTone(sfx, ctx, freq * 2, duration * 0.7, when, "sine", 0.05 * volume);
  playTone(sfx, ctx, freq * 3, duration * 0.4, when, "sine", 0.025 * volume);
}

/** Play the actual pitch for a MIDI note — never a generic beep. */
export function playMidi(midi: number, duration = 0.55, volume = 1) {
  const b = unlockAudio();
  layeredNote(midiToFreq(midi), duration, b.ctx.currentTime, volume);
}

export function playMidiSequence(midis: number[], gap = 0.32, duration = 0.4) {
  const b = unlockAudio();
  midis.forEach((midi, i) => {
    layeredNote(midiToFreq(midi), duration, b.ctx.currentTime + i * gap, 1);
  });
}

export function playChord(midis: number[], duration = 0.9, volume = 0.85) {
  const b = unlockAudio();
  const t = b.ctx.currentTime;
  midis.forEach((midi) => layeredNote(midiToFreq(midi), duration, t, volume));
}

/**
 * Hear the note you chose. If it was wrong, the true pitch follows
 * so the ear can compare — still pitches, never a UI beep.
 */
export function playChosenNote(midi: number, correct: boolean, targetMidi?: number) {
  const b = unlockAudio();
  const t = b.ctx.currentTime;
  if (correct || targetMidi == null || targetMidi === midi) {
    layeredNote(midiToFreq(midi), correct ? 0.7 : 0.45, t, correct ? 1 : 0.8);
    return;
  }
  layeredNote(midiToFreq(midi), 0.32, t, 0.75);
  layeredNote(midiToFreq(targetMidi), 0.7, t + 0.42, 1);
}

export function playClick(accent = false) {
  const b = unlockAudio();
  const { ctx, sfx } = b;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = accent ? 1400 : 900;
  osc.connect(g);
  g.connect(sfx);
  const t = ctx.currentTime;
  g.gain.setValueAtTime(accent ? 0.12 : 0.07, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  osc.start(t);
  osc.stop(t + 0.07);
}

export function playHit(kind: "perfect" | "great" | "good" | "miss" | "correct" | "wrong") {
  const b = unlockAudio();
  const t = b.ctx.currentTime;
  if (kind === "miss" || kind === "wrong") {
    playTone(b.sfx, b.ctx, 140, 0.22, t, "sawtooth", 0.08);
    playTone(b.sfx, b.ctx, 110, 0.28, t + 0.02, "triangle", 0.06);
    return;
  }
  const freq = kind === "perfect" || kind === "correct" ? 880 : kind === "great" ? 740 : 620;
  playTone(b.sfx, b.ctx, freq, 0.14, t, "sine", 0.12);
  playTone(b.sfx, b.ctx, freq * 1.5, 0.1, t, "triangle", 0.05);
}

export type Timbre = "Warm" | "Hollow" | "Bright" | "Reed";

/**
 * Four clearly different colours of the same pitch, for the sensory level.
 * Warm = soft triangle, Hollow = square with a closed filter (clarinet-like),
 * Bright = sawtooth with an open filter, Reed = two detuned pulses.
 */
export function playTimbre(midi: number, timbre: Timbre, duration = 0.9, volume = 1) {
  const b = unlockAudio();
  const { ctx, sfx } = b;
  const freq = midiToFreq(midi);
  const t = ctx.currentTime;
  const voice = (
    type: OscillatorType,
    detune: number,
    cutoff: number,
    gain: number,
    freqMul = 1,
  ) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    filter.Q.value = timbre === "Hollow" ? 6 : 0.7;
    osc.type = type;
    osc.frequency.value = freq * freqMul;
    osc.detune.value = detune;
    osc.connect(filter);
    filter.connect(g);
    g.connect(sfx);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain * volume, t + (timbre === "Bright" ? 0.01 : 0.06));
    g.gain.exponentialRampToValueAtTime(gain * volume * 0.6, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.02);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      g.disconnect();
    };
  };
  switch (timbre) {
    case "Warm":
      voice("triangle", 0, freq * 3, 0.2);
      voice("sine", 0, freq * 2, 0.06, 2);
      break;
    case "Hollow":
      voice("square", 0, freq * 2.2, 0.1);
      break;
    case "Bright":
      voice("sawtooth", 0, Math.min(9000, freq * 14), 0.09);
      voice("sawtooth", 7, Math.min(9000, freq * 14), 0.05);
      break;
    case "Reed":
      voice("square", -9, freq * 6, 0.07);
      voice("sawtooth", 9, freq * 5, 0.06);
      voice("sine", 0, freq * 2, 0.04, 3);
      break;
  }
}

/** Play a chord progression, one chord after another. */
export function playProgression(chords: number[][], gap = 0.75, duration = 0.7, volume = 0.8) {
  const b = unlockAudio();
  const t = b.ctx.currentTime;
  chords.forEach((chord, i) => {
    chord.forEach((midi) => layeredNote(midiToFreq(midi), duration, t + i * gap, volume));
  });
}

/** A short click pattern for rhythm playback: accented first beat. */
export function playRhythmPattern(beats: number[], bpm = 88, midi = 60) {
  const b = unlockAudio();
  const beatSec = 60 / bpm;
  let offset = 0;
  const { ctx, sfx } = b;
  beats.forEach((beat, i) => {
    const when = ctx.currentTime + offset;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = i === 0 ? 1400 : 900;
    osc.connect(g);
    g.connect(sfx);
    g.gain.setValueAtTime(i === 0 ? 0.12 : 0.07, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
    osc.start(when);
    osc.stop(when + 0.07);
    layeredNote(midiToFreq(midi), Math.min(0.35, beat * beatSec), when, 0.7);
    offset += beat * beatSec;
  });
  return offset;
}

export function playSuccess() {
  playMidiSequence([64, 67, 72], 0.12, 0.28);
}

export function playLevelUp() {
  playMidiSequence([60, 64, 67, 72, 76], 0.14, 0.32);
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", () => unlockAudio(), { once: true });
  window.addEventListener("keydown", () => unlockAudio(), { once: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") resumeAudio();
  });
}
