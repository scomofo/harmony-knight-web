import { Link } from "@tanstack/react-router";
import { useId, useRef, useState } from "react";
import { Check, ArrowRight, Search, X } from "lucide-react";
import { CURRICULUM } from "@/lib/game/curriculum";
import { COURSE_UNITS, unitsForLevel } from "@/lib/game/course";
import { nextUnit } from "@/lib/game/learning";
import { useGameStore } from "@/lib/game/store";
import { GameShell } from "./shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { conceptStatus } from "@/lib/game/practical-review";
import { CHAPTER_CREATIONS } from "@/lib/game/creations";

export function CurriculumScreen() {
  const progress = useGameStore((s) => s.unitProgress);
  const active = useGameStore((s) => s.activeUnitId);
  const legacyRead = useGameStore((s) => s.lessonsRead);
  const concepts = useGameStore((s) => s.conceptPractice);
  const revisit = useGameStore((s) => s.revisitUnit);
  const next = nextUnit(progress, active);
  const completed = COURSE_UNITS.filter((u) => progress[u.id]?.completedAt).length;
  const [query, setQuery] = useState("");
  const searchId = useId();
  const searchInput = useRef<HTMLInputElement>(null);
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const chapterNumber = /\bchapter\s+(\d+)\b/i.exec(query)?.[1];
  const chapters = CURRICULUM.map((level) => ({
    level,
    units: unitsForLevel(level.level).filter((unit) => {
      if (chapterNumber && level.level + 1 !== Number(chapterNumber)) return false;
      const text =
        `${unit.title} ${unit.goal} ${level.title} ${level.subtitle} chapter ${level.level + 1}`.toLocaleLowerCase();
      return terms.every((term) => text.includes(term));
    }),
  })).filter(({ units }) => units.length > 0);
  const matches = chapters.reduce((total, chapter) => total + chapter.units.length, 0);
  return (
    <GameShell title="Learning path">
      <header className="mb-6 space-y-3">
        <h2 className="font-[var(--font-display)] text-3xl">
          From your first note to your own ideas.
        </h2>
        <p className="text-base leading-relaxed text-[var(--color-muted)]">
          {COURSE_UNITS.length} short lessons across 11 chapters. Start at the beginning or explore
          a topic. Every lesson has teaching, a practical task and two recall questions.
        </p>
        <p className="text-sm text-[var(--color-harmony)]">
          {completed} of {COURSE_UNITS.length} completed · all lessons open
        </p>
        {next ? (
          <Button asChild className="h-auto min-h-11 whitespace-normal py-3 text-left">
            <Link
              to="/lesson/$level"
              params={{ level: String(next.level) }}
              search={{ unit: next.id }}
            >
              Continue: {next.title}
              <ArrowRight className="size-4 shrink-0" />
            </Link>
          </Button>
        ) : null}
      </header>
      <section className="mb-6 space-y-4" aria-label="Find a lesson">
        <div
          role="search"
          className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-4"
        >
          <label htmlFor={searchId} className="block text-sm font-medium">
            Find a lesson
          </label>
          <div className="mt-2 flex items-center gap-3">
            <Search aria-hidden="true" className="size-5 shrink-0 text-[var(--color-muted)]" />
            <input
              id={searchId}
              ref={searchInput}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try rhythm, triads, or changing key"
              className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-ink)] px-3 text-base [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Clear lesson search"
                onClick={() => {
                  setQuery("");
                  searchInput.current?.focus();
                }}
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
          {terms.length > 0 ? (
            <p role="status" className="mt-3 text-sm text-[var(--color-muted)]">
              {matches} {matches === 1 ? "lesson" : "lessons"} found. Your saved place stays the
              same.
            </p>
          ) : null}
        </div>
        {terms.length === 0 ? (
          <nav aria-label="Jump to a chapter" className="flex flex-wrap gap-2">
            {CURRICULUM.map((level) => (
              <a
                key={level.level}
                href={`#chapter-${level.level + 1}`}
                aria-label={`Chapter ${level.level + 1}: ${level.title}`}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-sm",
                  next?.level === level.level
                    ? "border-[var(--color-harmony)] text-[var(--color-parchment)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-border-strong)]",
                )}
              >
                <span className="font-mono text-xs">{level.level + 1}</span> {level.subtitle}
              </a>
            ))}
          </nav>
        ) : null}
        {matches === 0 ? (
          <p className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-5 text-base text-[var(--color-muted)]">
            No lessons match “{query.trim()}”. Try a broader idea such as pitch, rhythm or chords,
            or clear the search to explore every chapter.
          </p>
        ) : null}
      </section>
      <ol className="space-y-4">
        {chapters.map(({ level, units }) => {
          const chapterUnits = unitsForLevel(level.level);
          const count = chapterUnits.filter((u) => progress[u.id]?.completedAt).length;
          const current = next?.level === level.level;
          return (
            <li
              key={level.level}
              id={`chapter-${level.level + 1}`}
              tabIndex={-1}
              className={cn(
                "scroll-mt-24 rounded-[var(--radius-xl)] border bg-[var(--color-ink-2)] p-5",
                current ? "border-[var(--color-harmony)]" : "border-[var(--color-border)]",
              )}
            >
              <p className="text-sm text-[var(--color-harmony)]">
                Chapter {level.level + 1} · {level.phase} · {count}/{chapterUnits.length} completed
              </p>
              <h3 className="mt-2 font-[var(--font-display)] text-2xl">{level.title}</h3>
              <p className="mt-1 text-sm font-medium text-[var(--color-parchment)]">
                {level.subtitle}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
                {level.chapterIntro}
              </p>
              {legacyRead.includes(level.level) && count === 0 ? (
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  Your earlier overview is saved as read. These focused lessons add practice and
                  recall.
                </p>
              ) : null}
              <ol className="mt-4 divide-y divide-[var(--color-border)]">
                {units.map((u) => (
                  <li key={u.id}>
                    <Link
                      to="/lesson/$level"
                      params={{ level: String(level.level) }}
                      search={{ unit: u.id }}
                      aria-current={u.id === next?.id ? "step" : undefined}
                      className="flex min-h-14 items-start gap-3 py-3"
                    >
                      <span className="mt-1 w-6 shrink-0 text-sm text-[var(--color-harmony)]">
                        {progress[u.id]?.completedAt ? (
                          <Check aria-label="Completed" className="size-4" />
                        ) : (
                          chapterUnits.indexOf(u) + 1
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-base">{u.title}</span>
                        {progress[u.id] && progress[u.id]!.step < 4 ? (
                          <span className="mt-1 block text-xs font-medium text-[var(--color-harmony)]">
                            {progress[u.id]!.reviewing ? "Review in progress" : "In progress"} ·{" "}
                            {
                              ["Learn", "Try it", "Recall 1 of 2", "Recall 2 of 2"][
                                progress[u.id]!.step
                              ]
                            }
                          </span>
                        ) : null}
                        <span className="mt-1 block text-sm leading-relaxed text-[var(--color-muted)]">
                          {u.goal}
                        </span>
                      </span>
                      <span className="mt-1 shrink-0 text-sm text-[var(--color-muted)]">
                        {u.minutes} min
                      </span>
                    </Link>
                    {concepts[u.id] ? (
                      <div className="mb-3 ml-9 text-sm text-[var(--color-muted)]">
                        <p>
                          {conceptStatus(concepts[u.id])} ·{" "}
                          {concepts[u.id]!.recent.filter(Boolean).length}/
                          {concepts[u.id]!.recent.length} recent first checks without help
                        </p>
                        {progress[u.id]?.completedAt ? (
                          <Button asChild variant="ghost" className="mt-1">
                            <Link
                              to="/lesson/$level"
                              params={{ level: String(u.level) }}
                              search={{ unit: u.id }}
                              onClick={() => revisit(u.id, true)}
                            >
                              Practise a fresh example
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
              <Button
                asChild
                variant="outline"
                className="mt-4 h-auto min-h-11 whitespace-normal py-3 text-left"
              >
                <Link to="/create/$chapter" params={{ chapter: String(level.level) }}>
                  Create: {CHAPTER_CREATIONS[level.level]!.title}
                </Link>
              </Button>
              {level.nextBridge ? (
                <p className="mt-4 border-t border-[var(--color-border)] pt-4 text-sm leading-relaxed text-[var(--color-muted)]">
                  <span className="font-medium text-[var(--color-parchment)]">
                    Where this leads:{" "}
                  </span>
                  {level.nextBridge}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-6 text-sm leading-relaxed text-[var(--color-muted)]">
        The path keeps circling between listening, naming, building and creating. Revisit earlier
        chapters whenever a later idea feels crowded; musicians do that constantly.
      </p>
    </GameShell>
  );
}
