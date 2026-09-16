import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  CHAPTER_CREATIONS,
  CREATION_CHORDS,
  creationPlan,
  freshCreation,
  hasCreationSound,
  type CreationDraft,
} from "@/lib/game/creations";
import { noteName } from "@/lib/game/music";
import { useGameStore } from "@/lib/game/store";
import { cn } from "@/lib/utils";
import { GameShell } from "./shell";
import { PlaybackOptions, useTeachingPlayer } from "./teaching-player";

export function CreationScreen({ chapter }: { chapter: number }) {
  const template = CHAPTER_CREATIONS[chapter];
  if (!template)
    return (
      <GameShell title="Choose a chapter">
        <Link to="/curriculum">Learning path</Link>
      </GameShell>
    );
  return <Composer key={chapter} chapter={chapter} />;
}
function Composer({ chapter }: { chapter: number }) {
  const template = CHAPTER_CREATIONS[chapter]!;
  const savedDraft = useGameStore((s) => s.creationDrafts[chapter]);
  const pieces = useGameStore((s) => s.creations);
  const draft = savedDraft ?? freshCreation(chapter);
  const update = useGameStore((s) => s.editCreation);
  const save = useGameStore((s) => s.saveCreation);
  const load = useGameStore((s) => s.loadCreation);
  const newPiece = useGameStore((s) => s.newCreation);
  const player = useTeachingPlayer();
  const [part, setPart] = useState<"together" | "upper" | "bass">("together");
  const [message, setMessage] = useState("");
  const [playingDraft, setPlayingDraft] = useState(false);
  const activePosition = playingDraft ? player.state?.index : undefined;
  useEffect(() => {
    if (!savedDraft) update(chapter, freshCreation(chapter));
  }, [chapter, savedDraft, update]);
  const edit = (patch: Partial<CreationDraft>) => {
    player.stop();
    update(chapter, patch);
    setMessage("");
  };
  return (
    <GameShell title="Make your own music" backTo="/curriculum">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-3">
          <p className="text-sm text-[var(--color-harmony)]">
            Chapter {chapter + 1} · creative practice
          </p>
          <h2 className="font-[var(--font-display)] text-3xl">{template.title}</h2>
          <p className="leading-relaxed text-[var(--color-muted)]">{template.prompt}</p>
          <p className="text-sm">
            There is no single right answer. Your draft saves as you edit; save a named piece to
            keep it in your collection.
          </p>
        </header>
        <label className="block text-sm">
          Name your piece
          <input
            aria-label="Piece name"
            maxLength={80}
            value={draft.title}
            onChange={(e) => edit({ title: e.target.value })}
            className="mt-2 min-h-11 w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-ink-2)] px-3"
          />
        </label>
        <label className="block text-sm">
          Tempo · {draft.tempo} BPM
          <input
            aria-label="Creation tempo"
            type="range"
            min={40}
            max={160}
            step={1}
            value={draft.tempo}
            onChange={(e) => edit({ tempo: Number(e.target.value) })}
            className="mt-2 w-full accent-[var(--color-harmony)]"
          />
        </label>
        {template.kind === "rhythm" ? (
          <div className="space-y-4">
            {draft.rhythm.map((row, r) => (
              <fieldset key={r}>
                <legend className="mb-2 text-sm">{r ? "High hits" : "Low hits"}</legend>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {Array.from({ length: template.steps }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`${r ? "High" : "Low"} hit, ${Math.floor(i / 2) + 1}${i % 2 ? " &" : ""}`}
                      aria-pressed={row.includes(i)}
                      aria-current={activePosition === i ? "step" : undefined}
                      onClick={() =>
                        edit({
                          rhythm: draft.rhythm.map((rr, j) =>
                            r === j
                              ? rr.includes(i)
                                ? rr.filter((n) => n !== i)
                                : [...rr, i].sort((a, b) => a - b)
                              : rr,
                          ),
                        })
                      }
                      className={cn(
                        "min-h-14 rounded border text-sm",
                        row.includes(i)
                          ? "border-[var(--color-harmony)] bg-[var(--color-ink-3)]"
                          : "border-[var(--color-border)]",
                        activePosition === i && "ring-2 ring-[var(--color-harmony)]",
                      )}
                    >
                      {Math.floor(i / 2) + 1}
                      {i % 2 ? " &" : ""}
                      <span className="block" aria-hidden="true">
                        {row.includes(i) ? "●" : "○"}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {draft.notes.map((midi, i) => (
            <label
              key={i}
              className={cn(
                "rounded border border-[var(--color-border)] p-3 text-sm",
                activePosition === i && "ring-2 ring-[var(--color-harmony)]",
              )}
            >
              Note {i + 1}
              <select
                aria-label={`Creation note ${i + 1}`}
                value={midi}
                onChange={(e) =>
                  edit({ notes: draft.notes.map((n, j) => (i === j ? Number(e.target.value) : n)) })
                }
                className="mt-2 min-h-11 w-full rounded bg-[var(--color-ink-2)] px-2"
              >
                <option value={-1}>Rest</option>
                {template.palette.map((n) => (
                  <option key={n} value={n}>
                    {noteName(n)}
                  </option>
                ))}
              </select>
              {template.bass ? (
                <span className="mt-2 block text-[var(--color-muted)]">
                  Bass: {noteName(template.bass[i]!)}
                </span>
              ) : null}
            </label>
          ))}
          {draft.chords.map((chord, i) => (
            <label
              key={`chord-${i}`}
              className="rounded border border-[var(--color-border)] p-3 text-sm"
            >
              {draft.chords.length === 1 ? "Chord colour" : `Chord ${i + 1}`}
              <select
                aria-label={`Creation chord ${i + 1}`}
                value={chord}
                onChange={(e) =>
                  edit({ chords: draft.chords.map((c, j) => (i === j ? e.target.value : c)) })
                }
                className="mt-2 min-h-11 w-full rounded bg-[var(--color-ink-2)] px-2"
              >
                {template.chordOptions?.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <span className="mt-2 block text-xs text-[var(--color-muted)]">
                {CREATION_CHORDS[chord]!.map((n) => noteName(n)).join(" · ")}
              </span>
            </label>
          ))}
        </div>
        {chapter === 10 ? (
          <Button
            variant="outline"
            className="h-auto min-h-11 whitespace-normal py-3 text-left"
            onClick={() =>
              edit({
                notes: [
                  ...draft.notes.slice(0, 4),
                  ...draft.notes.slice(0, 4).map((n) => (n < 0 ? -1 : n + 7 <= 84 ? n + 7 : n - 5)),
                ],
              })
            }
          >
            Answer the theme a fifth higher (fold high notes down an octave)
          </Button>
        ) : null}
        {template.kind === "duet" ? (
          <label className="block text-sm">
            Playback part{" "}
            <select
              aria-label="Creation playback part"
              value={part}
              onChange={(e) => {
                player.stop();
                setPart(e.target.value as typeof part);
              }}
              className="min-h-11 rounded bg-[var(--color-ink-2)] px-2"
            >
              <option value="together">Together</option>
              <option value="upper">Upper voice</option>
              <option value="bass">Bass</option>
            </select>
          </label>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={player.muted || !hasCreationSound(chapter, draft)}
            onClick={() => {
              setPlayingDraft(true);
              player.play(creationPlan(chapter, draft, part), draft.title || template.title);
            }}
          >
            Hear my piece
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              player.stop();
              setMessage(
                save(chapter)
                  ? "Saved in your collection on this device."
                  : pieces.length >= 200
                    ? "Your collection holds 200 pieces. Update an existing piece to save changes."
                    : "Add a note or hit before saving your piece.",
              );
            }}
          >
            Save piece
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              player.stop();
              if (save(chapter)) {
                newPiece(chapter);
                setMessage("Previous piece saved. A new draft is ready.");
              } else setMessage("Save a sounding piece before starting another.");
            }}
          >
            Save and start another
          </Button>
        </div>
        <PlaybackOptions player={player} />
        {player.muted ? (
          <p className="text-sm">Sound is muted in Settings. You can keep composing and saving.</p>
        ) : null}
        {message ? <p role="status">{message}</p> : null}
        <section className="space-y-3 border-t border-[var(--color-border)] pt-5">
          <h3 className="text-xl">Your saved music</h3>
          {pieces.length ? (
            <ul className="space-y-3">
              {[...pieces].reverse().map((piece) => (
                <li key={piece.id} className="rounded border border-[var(--color-border)] p-3">
                  <p className="break-words font-medium">{piece.title}</p>
                  <p className="text-sm text-[var(--color-muted)]">
                    Chapter {piece.chapter + 1} · {piece.tempo} BPM
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="h-auto min-h-11 max-w-full whitespace-normal break-words py-3 text-left"
                      disabled={player.muted}
                      onClick={() => {
                        setPlayingDraft(false);
                        player.play(creationPlan(piece.chapter, piece), piece.title);
                      }}
                    >
                      Play {piece.title}
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      className="h-auto min-h-11 max-w-full whitespace-normal break-words py-3 text-left"
                    >
                      <Link
                        to="/create/$chapter"
                        params={{ chapter: String(piece.chapter) }}
                        onClick={(event) => {
                          player.stop();
                          if (!save(chapter)) {
                            event.preventDefault();
                            setMessage(
                              "Add a note or hit and save this draft before switching pieces.",
                            );
                            return;
                          }
                          load(piece.id);
                        }}
                      >
                        Edit {piece.title}
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">
              Your first saved piece will appear here.
            </p>
          )}
        </section>
        <Button asChild variant="outline">
          <Link to="/curriculum">Back to the learning path</Link>
        </Button>
      </div>
    </GameShell>
  );
}
