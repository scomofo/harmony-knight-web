import { it } from "node:test";
import assert from "node:assert/strict";
import { lessonFor } from "./lessons.ts";

it("separates the pitch comparison, cancels scheduled audio, and holds a suspension's prepared note", async () => {
  const param = () => ({
    value: 0,
    setValueAtTime() {},
    exponentialRampToValueAtTime() {},
    setTargetAtTime() {},
  });
  const node = () => ({ connect() {}, disconnect() {} });
  const oscillators: {
    startAt: number;
    stops: number[];
    frequency: { value: number };
    type: string;
  }[] = [];
  class AudioContextStub {
    currentTime = 10;
    state = "running";
    destination = node();
    createGain() {
      return { ...node(), gain: param() };
    }
    createBiquadFilter() {
      return { ...node(), frequency: param(), Q: param(), type: "lowpass" };
    }
    createOscillator() {
      const osc = {
        ...node(),
        frequency: param(),
        detune: param(),
        type: "sine",
        startAt: -1,
        stops: [] as number[],
        start(when: number) {
          this.startAt = when;
        },
        stop(when = 0) {
          this.stops.push(when);
        },
        onended: null,
      };
      oscillators.push(osc);
      return osc;
    }
  }
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { AudioContext: AudioContextStub, addEventListener() {} },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { addEventListener() {} },
  });
  try {
    const {
      playMidiSequence,
      playRhythmPattern,
      playClick,
      playOnsetGrid,
      playVoicePhrase,
      stopTones,
    } = await import("./audio.ts");
    const pitch = lessonFor(0).sections[0]!.example!;
    playMidiSequence(
      pitch.notes as number[],
      pitch.sequence?.gap,
      pitch.sequence?.duration,
      pitch.volumes,
    );
    const fundamentals = oscillators.filter((osc) => osc.type === "triangle");
    assert.equal(fundamentals.length, 2, "both pitches are scheduled");
    assert.ok(Math.abs(fundamentals[0]!.frequency.value - 261.625565) < 0.001);
    assert.ok(Math.abs(fundamentals[1]!.frequency.value - 523.251131) < 0.001);
    assert.ok(
      fundamentals[1]!.startAt - fundamentals[0]!.stops[0]! >= 0.25,
      "the lower note ends with a clear silent gap before the higher note",
    );
    stopTones();
    assert.ok(oscillators.every((osc) => osc.stops.at(-1) === 0));
    oscillators.length = 0;

    playRhythmPattern([1, 1, 1]);
    playClick(true);
    assert.ok(oscillators.some((osc) => osc.startAt > 10));
    stopTones();
    assert.ok(
      oscillators.every((osc) => osc.stops.at(-1) === 0),
      "including square-wave clicks scheduled in the future",
    );
    const calls = oscillators.map((osc) => osc.stops.length);
    stopTones();
    assert.deepEqual(
      oscillators.map((osc) => osc.stops.length),
      calls,
      "Stop is idempotent",
    );

    oscillators.length = 0;
    playOnsetGrid(
      [
        [0, 2, 4],
        [0, 3],
      ],
      6,
      1 / 3,
    );
    assert.equal(oscillators.length, 15, "five attacks, with three harmonics each");
    stopTones();
    assert.ok(oscillators.every((osc) => osc.stops.at(-1) === 0));

    oscillators.length = 0;
    playVoicePhrase([53, 55, 55], [60, 60, 59], 0.75, true);
    const prepared = oscillators.filter(
      (osc) => osc.type === "triangle" && Math.abs(osc.frequency.value - 261.625565) < 0.001,
    );
    assert.equal(prepared.length, 1, "the upper C is not rearticulated over the bass change");
    assert.equal(prepared[0]!.startAt, 10);
    assert.ok(prepared[0]!.stops[0]! > 11.4, "the preparation lasts through the suspension");
    stopTones();
  } finally {
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "document");
  }
});
