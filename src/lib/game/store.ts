import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { BROKEN_BLADE_LENGTH, FEVER_THRESHOLD, GRADE_THRESHOLDS } from "./curriculum";
import { newSRItem, type SRItem } from "./sr";

export type QuestMode = "practice" | "realtime" | "duel" | "recovery";

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

export type HeatCell = { attempts: number; correct: number };

type GameState = {
  hydrated: boolean;
  onboardingDone: boolean;
  confidence: number;
  currentStreak: number;
  bestStreak: number;
  totalNotesPlayed: number;
  totalCorrectNotes: number;
  attemptsAtGrade: number;
  correctAtGrade: number;
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
  setConfidence: (value: number) => void;
  patchSettings: (patch: Partial<Settings>) => void;
  updateSRItem: (item: SRItem) => void;
  ensureSRPool: (midis: number[], grade: number) => SRItem[];
  recordPractice: (args: {
    midi: number;
    correct: boolean;
    responseMs: number;
    topicId: string;
  }) => { points: number; fever: boolean; leveledUp: boolean; newGrade: number };
  finishRecoveryIfDone: (sessionCorrect: number) => void;
  recordRealtime: (hit: boolean) => void;
  recordDuel: (valid: boolean, points: number) => void;
  winDuel: () => void;
  claimQuest: (id: string) => void;
  recordHeat: (midi: number, correct: boolean) => void;
  resetProgress: () => void;
};

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function defaultQuests(): Quest[] {
  return [
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
  attemptsAtGrade: 0,
  correctAtGrade: 0,
  lastActiveAt: new Date().toISOString(),
  inBrokenBladeRecovery: false,
  gradeLevel: 0,
  duelWins: 0,
  duelIntroSeen: false,
  harmonyPoints: 0,
  weakNotesMidi: [] as number[],
  questsDay: dayKey(),
  quests: defaultQuests(),
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
        const broken =
          get().currentStreak > 0 && hours >= 48
            ? true
            : get().inBrokenBladeRecovery;
        const today = dayKey(now);
        set({
          hydrated: true,
          inBrokenBladeRecovery: broken,
          quests: get().questsDay === today ? get().quests : defaultQuests(),
          questsDay: today,
        });
      },
      completeOnboarding: () => set({ onboardingDone: true }),
      markDuelIntroSeen: () => set({ duelIntroSeen: true }),
      setConfidence: (value) => set({ confidence: Math.max(0, Math.min(1, value)) }),
      patchSettings: (patch) =>
        set({ settings: { ...get().settings, ...patch } }),
      updateSRItem: (item) =>
        set({ srItems: { ...get().srItems, [item.id]: item } }),
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
      recordPractice: ({ midi, correct, responseMs, topicId }) => {
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
        const attemptsAtGrade = (s.attemptsAtGrade ?? 0) + 1;
        const correctAtGrade = (s.correctAtGrade ?? 0) + (correct ? 1 : 0);

        let gradeLevel = s.gradeLevel;
        let leveledUp = false;
        const threshold = GRADE_THRESHOLDS[s.gradeLevel];
        if (
          threshold &&
          attemptsAtGrade >= threshold.minSessionAttempts &&
          correctAtGrade / attemptsAtGrade >= threshold.minSessionAccuracy &&
          s.gradeLevel < 10
        ) {
          gradeLevel = s.gradeLevel + 1;
          leveledUp = true;
        }

        set({
          currentStreak: streak,
          bestStreak: Math.max(s.bestStreak, streak),
          totalNotesPlayed: totalNotes,
          totalCorrectNotes: totalCorrect,
          attemptsAtGrade: leveledUp ? 0 : attemptsAtGrade,
          correctAtGrade: leveledUp ? 0 : correctAtGrade,
          lastActiveAt: new Date().toISOString(),
          harmonyPoints: s.harmonyPoints + points,
          mastery: { ...s.mastery, [topicId]: nextMastery },
          heatmap: {
            ...s.heatmap,
            [midi]: {
              attempts: heat.attempts + 1,
              correct: heat.correct + (correct ? 1 : 0),
            },
          },
          quests: correct
            ? bumpQuest(s.quests, s.inBrokenBladeRecovery ? "recovery" : "practice")
            : s.quests,
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
        set({
          lastActiveAt: new Date().toISOString(),
          currentStreak: hit ? s.currentStreak + 1 : 0,
          bestStreak: hit ? Math.max(s.bestStreak, s.currentStreak + 1) : s.bestStreak,
          harmonyPoints: s.harmonyPoints + (hit ? 8 : 0),
          quests: hit ? bumpQuest(s.quests, "realtime") : s.quests,
        });
      },
      recordDuel: (valid, points) => {
        const s = get();
        set({
          lastActiveAt: new Date().toISOString(),
          harmonyPoints: s.harmonyPoints + points,
          quests: valid ? bumpQuest(s.quests, "duel") : s.quests,
        });
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
          quests: defaultQuests(),
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

export function questRoute(mode: QuestMode): "/practice" | "/realtime" | "/duel" {
  if (mode === "duel") return "/duel";
  if (mode === "realtime") return "/realtime";
  return "/practice";
}
