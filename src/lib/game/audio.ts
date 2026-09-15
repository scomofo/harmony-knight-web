import { midiToFreq } from "./music.ts";

type Bus = {
  ctx: AudioContext;
  master: GainNode;
  sfx: GainNode;
  music: GainNode;
};

let bus: Bus | null = null;
let masterGain = 0.8;
const activeTones = new Set<OscillatorNode>();

/** Cancel current and scheduled teaching tones when a learner stops or leaves. */
export function stopTones() {
  for (const osc of activeTones) osc.stop();
  activeTones.clear();
}

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
    master.gain.value = masterGain * masterGain;
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
  masterGain = Math.max(0, Math.min(1, value));
  if (!bus) return;
  const v = masterGain;
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
  activeTones.add(osc);
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
    activeTones.delete(osc);
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

export function playMidiSequence(midis: number[], gap = 0.32, duration = 0.4, volumes?: number[]) {
  const b = unlockAudio();
  midis.forEach((midi, i) => {
    layeredNote(
      midiToFreq(midi),
      duration,
      b.ctx.currentTime + i * gap,
      Math.max(0.001, Math.min(1, volumes?.[i] ?? 1)),
    );
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

function clickAt(ctx: AudioContext, dest: GainNode, when: number, accent = false) {
  const osc = ctx.createOscillator();
  activeTones.add(osc);
  const g = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = accent ? 1400 : 900;
  osc.connect(g);
  g.connect(dest);
  const t = when;
  g.gain.setValueAtTime(accent ? 0.12 : 0.07, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  osc.start(t);
  osc.stop(t + 0.07);
  osc.onended = () => {
    activeTones.delete(osc);
    osc.disconnect();
    g.disconnect();
  };
}

export function playClick(accent = false) {
  const { ctx, sfx } = unlockAudio();
  clickAt(ctx, sfx, ctx.currentTime, accent);
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
    activeTones.add(osc);
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
      activeTones.delete(osc);
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
    clickAt(ctx, sfx, when, i === 0);
    layeredNote(midiToFreq(midi), Math.min(0.35, beat * beatSec), when, 0.7);
    offset += beat * beatSec;
  });
  return offset;
}

/** Attack maps sustain to the next attack or bar line. An accent map adds a quiet subdivision pulse. */
export function playOnsetGrid(
  rows: number[][],
  columns: number,
  stepBeats: number,
  subdivisionPulse = false,
  bpm = 72,
) {
  const { ctx, sfx } = unlockAudio();
  const stepSeconds = (60 / bpm) * stepBeats;
  const start = ctx.currentTime;
  if (subdivisionPulse) {
    for (let i = 0; i < columns; i++)
      clickAt(
        ctx,
        sfx,
        start + i * stepSeconds,
        rows.some((row) => row.includes(i)),
      );
    return;
  }
  rows.forEach((row, r) => {
    const attacks = [...row].sort((a, b) => a - b);
    attacks.forEach((column, i) => {
      const duration = ((attacks[i + 1] ?? columns) - column) * stepSeconds - 0.02;
      layeredNote(midiToFreq(r ? 55 : 67), duration, start + column * stepSeconds, 0.65);
    });
  });
}

/** Repeated bass pitches are held; an explicit suspension also ties the first two upper notes. */
export function playVoicePhrase(
  bass: number[],
  upper: number[],
  gap = 0.75,
  tiePreparation = false,
) {
  const { ctx } = unlockAudio();
  const start = ctx.currentTime;
  const line = (notes: number[], lower: boolean) => {
    for (let i = 0; i < notes.length; i++) {
      let end = i + 1;
      if (lower) while (end < notes.length && notes[end] === notes[i]) end++;
      else if (tiePreparation && i === 0 && notes[0] === notes[1]) end = 2;
      layeredNote(
        midiToFreq(notes[i]!),
        gap * (end - i) - 0.03,
        start + i * gap,
        lower ? 0.55 : 0.8,
      );
      i = end - 1;
    }
  };
  line(bass, true);
  line(upper, false);
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
    else stopTones();
  });
}
