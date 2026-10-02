import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { playTeachingPlan } from "@/lib/game/audio";
import { useGameStore } from "@/lib/game/store";
function playPhrase(onsets: number[], beat: number, beats: number) {
  return playTeachingPlan({
    events: onsets.map((onset) => ({ at: onset * beat, duration: 0.16, notes: [60] })),
    steps: [],
    duration: beats * beat,
  });
}

const BARS = ["1 · 2 · 3 · 4", "1 · 2 & · 3 · 4", "1 · 2 · 3 · 4", "1 · 2 & · 3 · rest"];
const ONSETS = [
  [0, 1, 2, 3],
  [0, 1, 1.5, 2, 3],
  [0, 1, 2, 3],
  [0, 1, 1.5, 2],
];
const ACTIONS: Record<string, string> = {
  guitar: "Use one comfortable open string, or one familiar chord. Keep the same sound throughout.",
  piano: "Use one comfortable key with one finger. Keep the same note throughout.",
  ukulele: "Use one comfortable open string, or one familiar chord.",
  bass: "Use one comfortable open string. Let the final beat stay silent.",
  drums: "Use one pad or the snare. Tap quietly and keep the same sound throughout.",
  vocals: "Speak 'ta' or sing one comfortable note. Breathe during the final rest.",
  mandolin: "Use one comfortable open string. Small pick movements are enough.",
  banjo: "Use one comfortable open string. No roll pattern is needed.",
  violin: "Use one comfortable open string, plucked or with short bow strokes.",
  lapsteel: "Pick one comfortable open string. No bar movement is needed.",
};

/** The same four-bar study appears in both apps; saves stay local to each app. */
export function SharedPhrase({ instrument = "theory" }: { instrument?: string }) {
  const storageKey = `shared-phrase-v1:${instrument}`;
  const [stage, setStage] = useState(0);
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const [playing, setPlaying] = useState(false);
  const [slow, setSlow] = useState(false);
  const [oneBar, setOneBar] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const playback = useRef<{ stop: () => void } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const muted = useGameStore((s) => s.settings.muted);
  const stop = () => {
    playback.current?.stop();
    playback.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPlaying(false);
  };
  useEffect(() => {
    setStage(0);
    setNote("");
    setNotice("");
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Number.isInteger(saved.stage) && saved.stage >= 0 && saved.stage <= 2)
          setStage(saved.stage);
        if (typeof saved.note === "string") setNote(saved.note.slice(0, 240));
      }
    } catch {
      setNotice("Saving is unavailable. Keep this tab open to keep your place.");
    }
  }, [storageKey]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      stop();
    };
  }, []);
  useEffect(() => {
    if (muted) stop();
  }, [muted]);
  const save = (next: number) => {
    stop();
    setStage(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ stage: next, note }));
      setNotice("Saved on this device. This is a good place to stop.");
    } catch {
      setNotice("Could not save. Keep this tab open, or copy your note before leaving.");
    }
  };
  const hear = () => {
    stop();
    if (muted) {
      setNotice("Sound is muted. Use the written count or change your sound settings.");
      return;
    }
    const beat = 60 / (slow ? 48 : 72);
    const bars = oneBar ? [ONSETS[1]] : ONSETS;
    const onsets = bars.flatMap((bar, index) => bar.map((offset) => index * 4 + offset));
    try {
      playback.current = playPhrase(onsets, beat, bars.length * 4);
      if (!playback.current) throw new Error("Audio unavailable");
      setPlaying(true);
      setNotice("");
      timer.current = setTimeout(stop, bars.length * 4 * beat * 1000 + 100);
    } catch {
      setNotice("Audio is unavailable. Tap the written count instead.");
    }
  };
  return (
    <details
      onToggle={(event) => {
        if (!event.currentTarget.open) stop();
      }}
      className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-5"
    >
      <summary className="min-h-11 cursor-pointer font-medium">
        Two-minute option · A pulse with room to breathe
      </summary>
      <div className="mt-4 space-y-4">
        <p className="text-sm">
          One four-bar phrase, in 4/4. Untimed: listening alone is a complete small session. This
          study also appears in SparkSuite.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Phrase session steps">
          {["Hear", "Try", "Use"].map((label, index) => (
            <Button
              key={label}
              variant={stage === index ? "default" : "outline"}
              onClick={() => save(index)}
              aria-pressed={stage === index}
            >
              {label}
            </Button>
          ))}
        </div>
        <p>
          {stage === 0
            ? "Keep a steady beat. Notice the two quicker taps on beat 2 in bars 2 and 4, then the silent final beat."
            : stage === 1
              ? (ACTIONS[instrument] ??
                "Tap the phrase on a table, or speak 'ta'. Keep the beat steady underneath the quicker taps.")
              : "Try once with the count hidden. Keep help available. Notice whether the final rest stayed the length of one beat."}
        </p>
        {showGuide ? (
          <ol className="grid gap-2 sm:grid-cols-2" aria-label="Four-bar count">
            {BARS.map((bar, index) => (
              <li key={index} className="rounded border p-3 text-sm">
                Bar {index + 1}: {bar}
              </li>
            ))}
          </ol>
        ) : null}
        <p className="text-sm">
          Each number is one beat; & is halfway to the next beat. Dots separate beats. Start right
          on beat 1; there is no count-in. The audio uses one repeated note to demonstrate timing.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={playing ? stop : hear} disabled={muted && !playing}>
            {playing ? "Stop phrase" : oneBar ? "Hear bar 2" : "Hear four bars"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              stop();
              setSlow(!slow);
            }}
            aria-pressed={slow}
          >
            Slow it down{slow ? " · 48 bpm" : " · 72 bpm"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              stop();
              setOneBar(!oneBar);
            }}
            aria-pressed={oneBar}
          >
            {oneBar ? "Use all four bars" : "Practise just bar 2"}
          </Button>
          <Button variant="ghost" onClick={() => setShowGuide(!showGuide)}>
            {showGuide ? "Hide count" : "Show count"}
          </Button>
        </div>
        {muted ? <p className="text-sm">Sound is muted. The written count is available.</p> : null}
        <label className="block text-sm">
          One observation (optional)
          <textarea
            aria-label="Phrase observation"
            maxLength={240}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setNotice("Unsaved note · choose Save and pause before leaving.");
            }}
            placeholder="For example: I kept the last beat silent."
            className="mt-2 min-h-20 w-full rounded border bg-transparent p-3"
          />
        </label>
        <Button variant="outline" onClick={() => save(stage)}>
          Save and pause
        </Button>
        {notice ? (
          <p role="status" className="text-sm">
            {notice}
          </p>
        ) : null}
        <p className="text-sm">
          Your practice note and selected step stay on this device in this app. This saves a plan,
          not an audio recording or a skill score.
        </p>
      </div>
    </details>
  );
}
