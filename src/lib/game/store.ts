import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  BROKEN_BLADE_LENGTH,
  FEVER_THRESHOLD,
  GRADE_THRESHOLDS,
  MAX_GRADE,
  levelFor,
  topicCountsForGrade,
  type AppRoute,
} from "./curriculum.ts";
import { newSRItem, type SRItem } from "./sr.ts";
import { recordNoteAttempt, weakNotesFor, type NoteHistory } from "./review.ts";

export type QuestMode = "practice" | "realtime" | "duel" | "recovery" | "study";

export type Quest = {
  id: string;
  title: string;
  mode: QuestMode;
  targetCount: number;
  progressCount: number;
  rewardHarmonyPoints: number;
  claimed: boolean;
};

export type SkillMastery = {
  topicId: string;
  attempts: number;
  correct: number;
  totalResponseMs: number;
  bestConfidence: number;
  recentCorrect: boolean[];
};

export type Settings = {
  highContrast: boolean;
  reducedMotion: boolean;
  sessionMinutes: number;
  masterVolume: number;
  muted: boolean;
};

export type HeatCell = NoteHistory;

type GameState = {
  hydrated: boolean;
  onboardingDone: boolean;
  confidence: number;
  currentStreak: number;
  bestStreak: number;
  totalNotesPlayed: number;
  totalCorrectNotes: number;
  /** Rolling window of recent answers on this grade's own topics. */
  recentAtGrade: boolean[];
  lessonsRead: number[];
  lastActiveAt: string;
  inBrokenBladeRecovery: boolean;
  gradeLevel: number;
  duelWins: number;
  duelIntroSeen: boolean;
  harmonyPoints: number;
  weakNotesMidi: number[];
  questsDay: string;
  quests: Quest[];
  mastery: Record<string, SkillMastery>;
  srItems: Record<string, SRItem>;
  heatmap: Record<number, HeatCell>;
  settings: Settings;
  hydrateDay: () => void;
  completeOnboarding: () => void;
  markDuelIntroSeen: () => void;
  markLessonRead: (level: number) => void;
  setConfidence: (value: number) => void;
  patchSettings: (patch: Partial<Settings>) => void;
  updateSRItem: (item: SRItem) => void;
  ensureSRPool: (midis: number[], grade: number) => SRItem[];
  recordPractice: (args: {
    midi: number;
    correct: boolean;
    responseMs: number;
    topicId: string;
    /** Only note-reading should colour the pitch heatmap. */
    trackHeat?: boolean;
  }) => { points: number; fever: boolean; leveledUp: boolean; newGrade: number };
  finishRecoveryIfDone: (sessionCorrect: number) => void;
  recordRealtime: (hit: boolean) => GradeOutcome;
  recordDuel: (valid: boolean, points: number) => GradeOutcome;
  winDuel: () => void;
  claimQuest: (id: string) => void;
  recordHeat: (midi: number, correct: boolean) => void;
  resetProgress: () => void;
};

export type GradeOutcome = { leveledUp: boolean; newGrade: number };

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function defaultQuests(grade = 0): Quest[] {
  const level = levelFor(grade);
  const study: Quest[] =
    level.route === "/practice" || level.route === "/realtime" || level.route === "/duel"
      ? []
      : [
          {
            id: "daily-study-8",
            title: `Study: 8 answers in ${level.drillLabel}`,
            mode: "study",
            targetCount: 8,
            progressCount: 0,
            rewardHarmonyPoints: 25,
            claimed: false,
          },
        ];
  return [
    ...study,
    {
      id: "daily-read-5",
      title: "Read 5 notes",
      mode: "practice",
      targetCount: 5,
      progressCount: 0,
      rewardHarmonyPoints: 20,
      claimed: false,
    },
    {
      id: "daily-hit-6",
      title: "Strike 6 notes",
      mode: "realtime",
      targetCount: 6,
      progressCount: 0,
      rewardHarmonyPoints: 20,
      claimed: false,
    },
    {
      id: "daily-duel-1",
      title: "Blend 3 tones in a duel",
      mode: "duel",
      targetCount: 3,
      progressCount: 0,
      rewardHarmonyPoints: 25,
      claimed: false,
    },
  ];
}

function emptyMastery(topicId: string): SkillMastery {
  return {
    topicId,
    attempts: 0,
    correct: 0,
    totalResponseMs: 0,
    bestConfidence: 0,
    recentCorrect: [],
  };
}

/**
 * Judge the rolling window of answers on this grade's topics. Returns the new
 * window and whether the knight advanced.
 */
function judgeGrade(
  s: { gradeLevel: number; recentAtGrade: boolean[] },
  topicId: string,
  correct: boolean,
): { recentAtGrade: boolean[]; gradeLevel: number; leveledUp: boolean } {
  if (!topicCountsForGrade(topicId, s.gradeLevel)) {
    return { recentAtGrade: s.recentAtGrade, gradeLevel: s.gradeLevel, leveledUp: false };
  }
  const threshold = GRADE_THRESHOLDS[s.gradeLevel];
  const window = threshold?.minSessionAttempts ?? 20;
  const recent = [...(s.recentAtGrade ?? []), correct].slice(-window);
  if (
    threshold &&
    s.gradeLevel < MAX_GRADE &&
    recent.length >= threshold.minSessionAttempts &&
    recent.filter(Boolean).length / recent.length >= threshold.minSessionAccuracy
  ) {
    return { recentAtGrade: [], gradeLevel: s.gradeLevel + 1, leveledUp: true };
  }
  return { recentAtGrade: recent, gradeLevel: s.gradeLevel, leveledUp: false };
}

function bumpQuest(quests: Quest[], mode: QuestMode, amount = 1): Quest[] {
  return quests.map((q) =>
    q.mode === mode && !q.claimed
      ? { ...q, progressCount: Math.min(q.targetCount, q.progressCount + amount) }
      : q,
  );
}

const initial = {
  hydrated: false,
  onboardingDone: false,
  confidence: 0.15,
  currentStreak: 0,
  bestStreak: 0,
  totalNotesPlayed: 0,
  totalCorrectNotes: 0,
  recentAtGrade: [] as boolean[],
  lessonsRead: [] as number[],
  lastActiveAt: new Date().toISOString(),
  inBrokenBladeRecovery: false,
  gradeLevel: 0,
  duelWins: 0,
  duelIntroSeen: false,
  harmonyPoints: 0,
  weakNotesMidi: [] as number[],
  questsDay: dayKey(),
  quests: defaultQuests(0),
  mastery: {} as Record<string, SkillMastery>,
  srItems: {} as Record<string, SRItem>,
  heatmap: {} as Record<number, HeatCell>,
  settings: {
    highContrast: false,
    reducedMotion: false,
    sessionMinutes: 12,
    masterVolume: 0.8,
    muted: false,
  } satisfies Settings,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initial,
      hydrateDay: () => {
        const now = new Date();
        const last = new Date(get().lastActiveAt);
        const hours = (now.getTime() - last.getTime()) / 36e5;
        const broken = get().currentStreak > 0 && hours >= 48 ? true : get().inBrokenBladeRecovery;
        const today = dayKey(now);
        set({
          hydrated: true,
          inBrokenBladeRecovery: broken,
          quests: get().questsDay === today ? get().quests : defaultQuests(get().gradeLevel),
          questsDay: today,
          weakNotesMidi: weakNotesFor(get().heatmap),
        });
      },
      completeOnboarding: () => set({ onboardingDone: true }),
      markDuelIntroSeen: () => set({ duelIntroSeen: true }),
      markLessonRead: (level) =>
        set({
          lessonsRead: get().lessonsRead.includes(level)
            ? get().lessonsRead
            : [...get().lessonsRead, level],
        }),
      setConfidence: (value) => set({ confidence: Math.max(0, Math.min(1, value)) }),
      patchSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      updateSRItem: (item) => set({ srItems: { ...get().srItems, [item.id]: item } }),
      ensureSRPool: (midis, grade) => {
        const items = { ...get().srItems };
        const result: SRItem[] = [];
        for (const midi of midis) {
          const id = `note_${midi}`;
          items[id] ??= newSRItem(id, "note-reading", grade);
          result.push(items[id]!);
        }
        set({ srItems: items });
        return result;
      },
      recordPractice: ({ midi, correct, responseMs, topicId, trackHeat = true }) => {
        const s = get();
        const streak = correct ? s.currentStreak + 1 : 0;
        const fever = streak >= FEVER_THRESHOLD;
        const points = correct ? Math.round(10 * (fever ? 2 : 1)) : 0;
        const mastery = s.mastery[topicId] ?? emptyMastery(topicId);
        const recent = [...mastery.recentCorrect, correct].slice(-10);
        const nextMastery: SkillMastery = {
          ...mastery,
          attempts: mastery.attempts + 1,
          correct: mastery.correct + (correct ? 1 : 0),
          totalResponseMs: mastery.totalResponseMs + responseMs,
          bestConfidence: Math.max(mastery.bestConfidence, s.confidence),
          recentCorrect: recent,
        };
        const heat = s.heatmap[midi] ?? { attempts: 0, correct: 0 };
        const totalNotes = s.totalNotesPlayed + 1;
        const totalCorrect = s.totalCorrectNotes + (correct ? 1 : 0);
        const { recentAtGrade, gradeLevel, leveledUp } = judgeGrade(s, topicId, correct);
        const isNoteReading = topicId === "note-reading-c4-b4";
        const heatmap =
          trackHeat && isNoteReading
            ? { ...s.heatmap, [midi]: recordNoteAttempt(heat, correct) }
            : s.heatmap;
        const questMode: QuestMode = s.inBrokenBladeRecovery
          ? "recovery"
          : isNoteReading
            ? "practice"
            : "study";

        set({
          currentStreak: streak,
          bestStreak: Math.max(s.bestStreak, streak),
          totalNotesPlayed: totalNotes,
          totalCorrectNotes: totalCorrect,
          recentAtGrade,
          lastActiveAt: new Date().toISOString(),
          harmonyPoints: s.harmonyPoints + points,
          mastery: { ...s.mastery, [topicId]: nextMastery },
          heatmap,
          weakNotesMidi: weakNotesFor(heatmap),
          quests: correct ? bumpQuest(s.quests, questMode) : s.quests,
          gradeLevel,
        });
        return { points, fever, leveledUp, newGrade: gradeLevel };
      },
      finishRecoveryIfDone: (sessionCorrect) => {
        if (!get().inBrokenBladeRecovery) return;
        if (sessionCorrect >= BROKEN_BLADE_LENGTH) {
          set({ inBrokenBladeRecovery: false, currentStreak: 1 });
        }
      },
      recordRealtime: (hit) => {
        const s = get();
        const judged = judgeGrade(s, "realtime", hit);
        set({
          lastActiveAt: new Date().toISOString(),
          currentStreak: hit ? s.currentStreak + 1 : 0,
          bestStreak: hit ? Math.max(s.bestStreak, s.currentStreak + 1) : s.bestStreak,
          harmonyPoints: s.harmonyPoints + (hit ? 8 : 0),
          quests: hit ? bumpQuest(s.quests, "realtime") : s.quests,
          recentAtGrade: judged.recentAtGrade,
          gradeLevel: judged.gradeLevel,
        });
        return { leveledUp: judged.leveledUp, newGrade: judged.gradeLevel };
      },
      recordDuel: (valid, points) => {
        const s = get();
        const judged = judgeGrade(s, "duel", valid);
        set({
          lastActiveAt: new Date().toISOString(),
          harmonyPoints: s.harmonyPoints + points,
          quests: valid ? bumpQuest(s.quests, "duel") : s.quests,
          recentAtGrade: judged.recentAtGrade,
          gradeLevel: judged.gradeLevel,
        });
        return { leveledUp: judged.leveledUp, newGrade: judged.gradeLevel };
      },
      winDuel: () =>
        set({
          duelWins: get().duelWins + 1,
          harmonyPoints: get().harmonyPoints + 40,
        }),
      claimQuest: (id) => {
        const quests = get().quests.map((q) => {
          if (q.id !== id || q.claimed || q.progressCount < q.targetCount) return q;
          return { ...q, claimed: true };
        });
        const claimed = get().quests.find((q) => q.id === id);
        const already = claimed?.claimed;
        const complete = claimed && claimed.progressCount >= claimed.targetCount;
        set({
          quests,
          harmonyPoints:
            !already && complete
              ? get().harmonyPoints + (claimed.rewardHarmonyPoints ?? 0)
              : get().harmonyPoints,
        });
      },
      recordHeat: (midi, correct) => {
        const heat = get().heatmap[midi] ?? { attempts: 0, correct: 0 };
        set({
          heatmap: {
            ...get().heatmap,
            [midi]: {
              attempts: heat.attempts + 1,
              correct: heat.correct + (correct ? 1 : 0),
            },
          },
        });
      },
      resetProgress: () =>
        set({
          ...initial,
          hydrated: true,
          onboardingDone: true,
          lastActiveAt: new Date().toISOString(),
          questsDay: dayKey(),
          quests: defaultQuests(0),
        }),
    }),
    {
      name: "harmony-knight-save",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
          : localStorage,
      ),
      skipHydration: true,
      partialize: (s) => {
        const {
          hydrateDay,
          completeOnboarding,
          markDuelIntroSeen,
          markLessonRead,
          setConfidence,
          patchSettings,
          updateSRItem,
          ensureSRPool,
          recordPractice,
          finishRecoveryIfDone,
          recordRealtime,
          recordDuel,
          winDuel,
          claimQuest,
          recordHeat,
          resetProgress,
          hydrated,
          ...rest
        } = s;
        void hydrateDay;
        void completeOnboarding;
        void markDuelIntroSeen;
        void markLessonRead;
        void setConfidence;
        void patchSettings;
        void updateSRItem;
        void ensureSRPool;
        void recordPractice;
        void finishRecoveryIfDone;
        void recordRealtime;
        void recordDuel;
        void winDuel;
        void claimQuest;
        void recordHeat;
        void resetProgress;
        void hydrated;
        return rest;
      },
    },
  ),
);

export function masteryStars(m?: SkillMastery): number {
  if (!m || m.recentCorrect.length === 0) return 0;
  const recent = m.recentCorrect.filter(Boolean).length / m.recentCorrect.length;
  if (recent >= 0.8 && m.bestConfidence >= 0.8) return 3;
  if (recent >= 0.8 && m.bestConfidence >= 0.6) return 2;
  if (recent >= 0.8) return 1;
  return 0;
}

export function questRoute(mode: QuestMode, grade = 0): AppRoute {
  if (mode === "duel") return "/duel";
  if (mode === "realtime") return "/realtime";
  if (mode === "study") return levelFor(grade).route;
  return "/practice";
}

export type GradeProgress = {
  grade: number;
  answered: number;
  needed: number;
  accuracy: number;
  neededAccuracy: number;
  /** Correct answers still required if every remaining answer is right. */
  remaining: number;
  maxed: boolean;
};

/** How close the knight is to the next grade, for the hall and summaries. */
export function gradeProgress(s: { gradeLevel: number; recentAtGrade: boolean[] }): GradeProgress {
  const threshold = GRADE_THRESHOLDS[s.gradeLevel];
  const recent = s.recentAtGrade ?? [];
  if (!threshold || s.gradeLevel >= MAX_GRADE) {
    return {
      grade: s.gradeLevel,
      answered: recent.length,
      needed: 0,
      accuracy: 1,
      neededAccuracy: 1,
      remaining: 0,
      maxed: true,
    };
  }
  const correct = recent.filter(Boolean).length;
  const needed = threshold.minSessionAttempts;
  const accuracy = recent.length ? correct / recent.length : 0;
  const remaining = Math.max(0, Math.ceil(needed * threshold.minSessionAccuracy) - correct);
  return {
    grade: s.gradeLevel,
    answered: recent.length,
    needed,
    accuracy,
    neededAccuracy: threshold.minSessionAccuracy,
    remaining,
    maxed: false,
  };
}
