import { useMemo, useState } from "react";
import { playChord, playLevelUp, playMidi, playSuccess } from "@/lib/game/audio";
import {
  generateCantusFirmus,
  harmonyMeterDelta,
  plainMoveMessage,
  safePitches,
  suggestGhostResolution,
  validateMove,
  violationLabel,
  type DuelNote,
  type GhostResolution,
  type TurnResult,
} from "@/lib/game/duel";
import { noteName } from "@/lib/game/music";
import { useGameStore } from "@/lib/game/store";
import { Button } from "@/components/ui/button";
import { HarmonyMeter } from "./harmony-meter";
import { MiniPiano } from "./piano";
import { SessionSummary } from "./session-summary";
import { GameShell } from "./shell";
import { Staff } from "./staff";

export function DuelScreen() {
  const store = useGameStore();
  const beginner = store.gradeLevel <= 1;
  const firstDuel = store.duelWins === 0;
  const fromMidi = 60;
  const toMidi = beginner ? 76 : 79;
  const startMeter = beginner ? 0.4 : 0.2;
  const winAt = beginner ? 0.5 : 0.7;

  const [cantus, setCantus] = useState(() => generateCantusFirmus(store.gradeLevel, { firstDuel }));
  const [user, setUser] = useState<DuelNote[]>([]);
  const [history, setHistory] = useState<TurnResult[]>([]);
  const [meter, setMeter] = useState(startMeter);
  const [ghost, setGhost] = useState<GhostResolution | null>(null);
  const [message, setMessage] = useState(
    beginner
      ? "The Sentinel sings the lower note. Answer with a glowing key above it."
      : "Place a tone above the cantus. Thirds and sixths are favored.",
  );
  const [complete, setComplete] = useState(false);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [validCount, setValidCount] = useState(0);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [leveled, setLeveled] = useState<number | null>(null);

  const turn = user.length;
  const current = cantus[turn] ?? null;
  const prevC = turn > 0 ? cantus[turn - 1] : null;
  const prevU = turn > 0 ? user[turn - 1] : null;

  const safe = useMemo(
    () =>
      current
        ? safePitches({
            cantusNote: current,
            previousCantusNote: prevC,
            previousUserNote: prevU,
            fromMidi,
            toMidi,
          })
        : [],
    [current, prevC, prevU, fromMidi, toMidi],
  );

  const hint = useMemo(
    () =>
      current
        ? suggestGhostResolution({
            cantusNote: current,
            previousCantusNote: prevC,
            previousUserNote: prevU,
          })
        : null,
    [current, prevC, prevU],
  );

  const start = () => {
    const next = generateCantusFirmus(store.gradeLevel, {
      firstDuel: store.duelWins === 0,
    });
    setCantus(next);
    setUser([]);
    setHistory([]);
    setMeter(startMeter);
    setGhost(null);
    setComplete(false);
    setSessionPoints(0);
    setValidCount(0);
    setHighlight(null);
    setLeveled(null);
    setMessage(
      beginner
        ? "New phrase. Stay above them. Glowing keys blend."
        : "A new cantus. Stay above it. Prefer thirds and sixths.",
    );
    playMidi(next[0]!.midi, 0.5);
  };

  const playMove = (midi: number) => {
    if (!current || complete) return;
    setHighlight(midi);
    const candidate = { midi };
    const result = validateMove({
      cantusNote: current,
      userNote: candidate,
      previousCantusNote: prevC,
      previousUserNote: prevU,
    });
    playChord([current.midi, midi], 0.7);

    if (!result.isValid) {
      const g = suggestGhostResolution({
        cantusNote: current,
        previousCantusNote: prevC,
        previousUserNote: prevU,
      });
      setGhost(g);
      const why =
        result.violations.length > 0
          ? result.violations.map(violationLabel).join(" · ")
          : "That clashes. Try a glowing key — skip one white key for a third.";
      setMessage(why);
      store.recordDuel(false, 0);
      return;
    }

    const acceptedGhost = Boolean(ghost && midi === ghost.suggestedNote.midi);
    const delta = harmonyMeterDelta(result, acceptedGhost);
    const nextMeter = Math.max(0, Math.min(1, meter + delta));
    const pts = Math.round(
      (result.quality === "imperfectConsonance" ? 16 : 12) * (acceptedGhost ? 1.15 : 1),
    );
    const nextUser = [...user, candidate];
    const nextHistory: TurnResult[] = [
      ...history,
      {
        cantusNote: current,
        userNote: candidate,
        quality: result.quality,
        wasDissonanceResolved: acceptedGhost,
      },
    ];
    setUser(nextUser);
    setHistory(nextHistory);
    setMeter(nextMeter);
    setGhost(null);
    setValidCount((n) => n + 1);
    setSessionPoints((p) => p + pts);
    const judged = store.recordDuel(true, pts);
    if (judged.leveledUp) {
      playLevelUp();
      setLeveled(judged.newGrade);
    }
    setMessage(
      `${plainMoveMessage(midi - current.midi, result.quality)}${
        acceptedGhost ? " Ghost accepted." : ""
      }`,
    );

    if (nextUser.length >= cantus.length) {
      setComplete(true);
      if (nextMeter >= winAt) {
        store.winDuel();
        playSuccess();
        setMessage("The Sentinel yields. Harmony holds.");
      } else {
        setMessage("Phrase complete. Blend a few more next time and the meter will fill.");
      }
    }
  };

  const acceptGhost = () => {
    if (ghost) playMove(ghost.suggestedNote.midi);
  };

  const phrase = useMemo(
    () =>
      cantus.map((n, i) => ({
        cantus: n.midi,
        user: user[i]?.midi,
      })),
    [cantus, user],
  );

  return (
    <GameShell title="Counterpoint Duel">
      <div className="flex flex-col gap-5">
        {!store.duelIntroSeen ? (
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-strong)] bg-[var(--color-ink-2)] p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-harmony)]">
              First duel
            </p>
            <h2 className="mt-1 font-[var(--font-display)] text-2xl tracking-[-0.03em]">
              Answer above the Sentinel
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
              <li>They sing the lower note. You pick a higher key that blends.</li>
              <li>Glowing keys are safe. Skip one white key for a third — the sweetest blend.</li>
              <li>No clock. If you clash, a ghost will show a good choice. Tap it.</li>
            </ul>
            <Button className="mt-4" onClick={() => store.markDuelIntroSeen()}>
              I’m ready
            </Button>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-muted)] text-pretty">
            {beginner
              ? "Stay above their note. Glowing keys blend. There is no clock."
              : "First Species against the Discord Sentinel. Wait-mode — there is no clock. Stay above the cantus."}
          </p>
        )}
        <HarmonyMeter value={meter} />
        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Turn {Math.min(turn + 1, cantus.length)} / {cantus.length}
            {current ? ` · they sing ${noteName(current.midi)}` : ""}
          </p>
          {current ? (
            <Staff midi={current.midi} confidence={0.55} revealName ghost={Boolean(ghost)} />
          ) : (
            <p className="py-8 text-center text-sm text-[var(--color-muted)]">Phrase complete.</p>
          )}
          <p className="mt-2 text-sm text-[var(--color-parchment)]">{message}</p>
          {ghost ? (
            <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-ink-3)] p-3">
              <p className="text-sm text-[var(--color-harmony)]">
                Ghost · {noteName(ghost.suggestedNote.midi)}
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{ghost.reason}</p>
              <Button size="sm" className="mt-3" onClick={acceptGhost}>
                Place {noteName(ghost.suggestedNote.midi)}
              </Button>
            </div>
          ) : beginner && hint && current ? (
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Hint: {noteName(hint.suggestedNote.midi)} glows strongest.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {phrase.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => playChord(p.user != null ? [p.cantus, p.user] : [p.cantus], 0.7)}
              className="rounded-full border border-[var(--color-border)] px-2 py-1 font-mono text-xs tabular-nums text-[var(--color-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-parchment)]"
            >
              {noteName(p.cantus)}
              {p.user != null ? ` / ${noteName(p.user)}` : ""}
            </button>
          ))}
        </div>
        <MiniPiano
          fromMidi={fromMidi}
          toMidi={toMidi}
          onPlay={playMove}
          highlighted={highlight}
          disabled={complete}
          safeMidis={safe}
          hintMidi={ghost?.suggestedNote.midi ?? hint?.suggestedNote.midi ?? null}
          dimUnsafe={beginner}
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={start}>
            New phrase
          </Button>
          {current ? (
            <Button variant="ghost" onClick={() => playMidi(current.midi)}>
              Hear them
            </Button>
          ) : null}
        </div>
      </div>
      {complete ? (
        <SessionSummary
          title={meter >= winAt ? "Duel won" : "Phrase complete"}
          correct={validCount}
          total={cantus.length}
          points={sessionPoints}
          streak={store.currentStreak}
          leveledUp={leveled != null}
          newGrade={leveled ?? undefined}
          onAgain={start}
        />
      ) : null}
    </GameShell>
  );
}
