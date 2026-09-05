import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Volume2 } from "lucide-react";
import { KnightCrest } from "./crest";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/game/store";
import { playMidi } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

export function OnboardingScreen() {
  const complete = useGameStore((s) => s.completeOnboarding);
  const settings = useGameStore((s) => s.settings);
  const navigate = useNavigate();
  const [audioError, setAudioError] = useState(false);
  const finish = (firstLesson: boolean) => {
    complete();
    if (firstLesson)
      void navigate({ to: "/lesson/$level", params: { level: "0" }, search: { unit: "0-pitch" } });
    else void navigate({ to: "/" });
  };
  return (
    <div
      className={cn(
        "flex min-h-dvh items-center bg-[var(--color-ink)] px-5 py-8 text-[var(--color-parchment)]",
        settings.highContrast && "high-contrast",
        settings.reducedMotion && "reduce-motion",
      )}
    >
      <main className="mx-auto w-full max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <KnightCrest size={56} />
          <span className="font-[var(--font-display)] text-2xl">Harmony Knight</span>
        </div>
        <div>
          <p className="text-sm text-[var(--color-harmony)]">A little music. A clear next step.</p>
          <h1 className="mt-3 font-[var(--font-display)] text-4xl leading-tight">
            Music theory starts with a sound.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-muted)]">
            Begin with no prior knowledge and explore your way to harmony, counterpoint and
            composition. Short lessons save your place as you go.
          </p>
        </div>
        <section className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-5">
          <h2 className="text-lg font-medium">Try two notes, if you like</h2>
          <p className="mt-2 text-base text-[var(--color-muted)]">
            Same kind of sound, different pitches.
          </p>
          <div className="mt-4 flex gap-3">
            {[
              { label: "Low C", midi: 48 },
              { label: "High C", midi: 72 },
            ].map((n) => (
              <Button
                key={n.midi}
                variant="secondary"
                disabled={settings.muted}
                onClick={() => {
                  try {
                    playMidi(n.midi);
                  } catch {
                    setAudioError(true);
                  }
                }}
              >
                <Volume2 className="size-4" />
                {n.label}
              </Button>
            ))}
          </div>
          {audioError ? (
            <p role="status" className="mt-3 text-sm">
              Audio is unavailable here. You can still use the written lessons.
            </p>
          ) : null}
        </section>
        <p className="text-base leading-relaxed text-[var(--color-muted)]">
          One idea, one practical task, two recall questions. No lesson timer. Come back whenever
          you’re ready.
        </p>
        <div className="space-y-3">
          <Button size="xl" className="w-full" onClick={() => finish(true)}>
            Start my first 3-minute lesson
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => finish(false)}>
            I’d like to explore the home screen
          </Button>
        </div>
      </main>
    </div>
  );
}
