import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FigureNoteGlyph } from "./figurenote";
import { KnightCrest } from "./crest";
import { Button } from "@/components/ui/button";
import { FIGURENOTE_COLORS, figureNoteShape, noteName } from "@/lib/game/music";
import { useGameStore } from "@/lib/game/store";
import { unlockAudio, playMidi, playMidiSequence } from "@/lib/game/audio";

const PAGES = [
  {
    title: "You are the Harmony Knight",
    subtitle: "A quest to master the language of music.",
    body: "From first sound to Grade 8 analysis. Short sessions. You set the scaffolding. Nothing is timed unless you ask.",
  },
  {
    title: "Your confidence slider",
    subtitle: "Always in your control.",
    body: "Slide left for color, shape, and a quiet ghost tone. Slide right to read standard notation alone. It never locks.",
  },
  {
    title: "Colors are your guide",
    subtitle: "Figurenotes make music visible.",
    body: "C is a red circle. D is an orange square. G is a blue circle. Tap a shape to hear its pitch. As confidence rises, color fades into the staff.",
  },
  {
    title: "Learn by playing",
    subtitle: "No pressure. No punishment.",
    body: "Every level opens with a short lesson you can hear as well as read. Practice waits. Strike trains timing. Duel: pick a higher note that blends — safe keys glow, and a ghost helps if you clash. Miss a few days? A five-note warm-up restores the blade.",
  },
  {
    title: "Ready to begin?",
    subtitle: "The hall is open.",
    body: "",
  },
];

export function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const complete = useGameStore((s) => s.completeOnboarding);
  const navigate = useNavigate();
  const current = PAGES[page]!;

  const finish = () => {
    unlockAudio();
    playMidiSequence([60, 64, 67, 72], 0.16, 0.3);
    complete();
    void navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-ink)] px-6 py-8 text-[var(--color-parchment)]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={finish}
            className="inline-flex min-h-11 items-center px-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-parchment)]"
          >
            Skip
          </button>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {page === 2 ? (
            <div className="mb-8 flex items-end gap-3">
              {[60, 62, 64, 65, 67].map((midi) => (
                <button
                  key={midi}
                  type="button"
                  onClick={() => {
                    unlockAudio();
                    playMidi(midi);
                  }}
                  aria-label={`Play ${noteName(midi)}`}
                  className="flex min-h-11 min-w-11 flex-col items-center justify-center rounded-[var(--radius-sm)] transition-transform duration-[var(--motion-quick)] active:scale-[0.94]"
                >
                  <FigureNoteGlyph
                    shape={figureNoteShape(midi)}
                    color={FIGURENOTE_COLORS[midi % 12]!}
                    size={36}
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="mb-8">
              <KnightCrest size={104} />
            </div>
          )}
          <h1 className="font-[var(--font-display)] text-3xl leading-tight tracking-[-0.03em] text-balance">
            {current.title}
          </h1>
          <p className="mt-3 text-[var(--color-harmony)]">{current.subtitle}</p>
          {current.body ? (
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[var(--color-muted)] text-pretty">
              {current.body}
            </p>
          ) : null}
        </div>
        <div className="flex justify-center gap-1.5 pb-6">
          {PAGES.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-[width,background-color] duration-[var(--motion-fast)]"
              style={{
                width: i === page ? 22 : 8,
                background: i === page ? "var(--color-parchment)" : "var(--color-ink-3)",
              }}
            />
          ))}
        </div>
        <Button
          size="xl"
          onClick={() => {
            unlockAudio();
            if (page === PAGES.length - 1) finish();
            else setPage((p) => p + 1);
          }}
        >
          {page === PAGES.length - 1 ? "Begin your quest" : "Next"}
        </Button>
      </div>
    </div>
  );
}
