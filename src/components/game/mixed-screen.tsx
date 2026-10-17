import { useRef } from "react";
import { Link } from "@tanstack/react-router";
import { playRhythmPattern } from "@/lib/game/audio";
import { topicPlainName, topicWeights } from "@/lib/game/adapt";
import {
  createMixedSession,
  mixedStudiesFor,
  selectBoost,
  type MixedBoost,
  type MixedSession,
} from "@/lib/game/mixed-session";
import { RHYTHM_BPM } from "@/lib/game/rhythm";
import { useGameStore } from "@/lib/game/store";
import { todayKey } from "@/lib/game/study-session";
import type { Exercise } from "@/lib/game/exercises";
import { Button } from "@/components/ui/button";
import { KeySignature } from "./key-signature";
import { playExercise, QuizScreen } from "./quiz-screen";
import { GameShell } from "./shell";

/**
 * Mixed practice — one endless session dealing from every study the
 * learner has unlocked (generated-practice Phase 3). The session is
 * created once per visit from (grade, day): a refresh replays the same
 * mix from the top, and the pool is whatever `studiesFor` had unlocked
 * when the visit began. Below two unlocked studies there is no mix —
 * the screen says exactly that, and names what is unlocked so far.
 *
 * Adaptivity Phase 1: the weights are computed once, from the mastery
 * records as they stand when the visit begins, and frozen into the
 * session alongside it — answers given during the session never
 * re-weight it mid-flight. When a weight is actually raised, the intro
 * says so in one plain line naming the topic; at neutral there is no
 * line and the session is the unweighted one.
 */
export function MixedScreen() {
  const grade = useGameStore((s) => s.gradeLevel);
  const mastery = useGameStore((s) => s.mastery);
  const setupRef = useRef<{ session: MixedSession | null; boost: MixedBoost | null } | undefined>(
    undefined,
  );
  if (setupRef.current === undefined) {
    const weights = topicWeights(mastery);
    const session = createMixedSession({ grade, weights }, { day: todayKey(), sessionIndex: 0 });
    setupRef.current = {
      session,
      boost: session ? selectBoost(session.studies, weights) : null,
    };
  }
  const session = setupRef.current.session;
  const boost = setupRef.current.boost;

  if (!session) {
    const unlocked = mixedStudiesFor({ grade });
    return (
      <GameShell title="Mixed practice">
        <div className="flex flex-col gap-5">
          <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-ink-2)] p-6">
            <h2 className="font-[var(--font-display)] text-2xl tracking-[-0.03em]">
              Not enough studies to mix — yet.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
              Mixed practice shuffles every study you have unlocked into one endless session.
              {unlocked.length === 1 ? (
                <>
                  {" "}
                  So far that is just <strong>{unlocked[0]!.label}</strong> — and one study is
                  not a mix. Your next study unlocks as your grade rises, and this room opens
                  the moment two are yours.
                </>
              ) : (
                <> Your next study unlocks as your grade rises, and this room opens the moment two are yours.</>
              )}
            </p>
            <Button asChild className="mt-5" variant="secondary">
              <Link to="/curriculum">See the learning path</Link>
            </Button>
          </div>
        </div>
      </GameShell>
    );
  }

  const play = (ex: Exercise) => {
    if (ex.type === "rhythm") {
      const beats = (ex.metadata?.beats as number[] | undefined) ?? [1, 1, 1, 1];
      playRhythmPattern(beats, RHYTHM_BPM);
      return;
    }
    playExercise(ex);
  };

  return (
    <QuizScreen
      title="Mixed practice"
      topicId={(ex) => String(ex.metadata?.topicId ?? "sensory")}
      make={() => session.next().exercise}
      play={play}
      endless
      intro={
        "Every study you have unlocked, shuffled into one session. No finish line — end whenever you are done." +
        (boost
          ? ` More ${topicPlainName(boost.topicId)} this session — they've been shaky lately.`
          : "")
      }
      visual={(ex) =>
        ex.type === "key" && ex.metadata?.showStaff ? (
          <KeySignature tonic={String(ex.metadata?.tonic ?? "C")} />
        ) : null
      }
    />
  );
}
