export type CurriculumPhase = "foundation" | "intermediate" | "advanced";

export type AppRoute =
  | "/practice"
  | "/realtime"
  | "/duel"
  | "/curriculum"
  | "/circle"
  | "/rhythm"
  | "/scale"
  | "/interval"
  | "/triad"
  | "/cadence"
  | "/sensory"
  | "/heatmap";

/** Topic ids reported through recordPractice / recordDuel / recordRealtime. */
export type TopicId =
  | "sensory"
  | "note-reading-c4-b4"
  | "rhythm"
  | "keys"
  | "scales"
  | "intervals"
  | "triads"
  | "harmony"
  | "modulation"
  | "duel"
  | "realtime";

export type CurriculumLevel = {
  level: number;
  title: string;
  subtitle: string;
  phase: CurriculumPhase;
  objectives: string[];
  adhdTriggers: string[];
  narrativeTheme: string;
  /** The main drill for this level. */
  route: AppRoute;
  drillLabel: string;
  /** Topics whose answers count toward the grade trial for this level. */
  topics: TopicId[];
  /** Study screens that open once this level is reached. */
  unlocks: { to: AppRoute; label: string }[];
};

export const CURRICULUM: CurriculumLevel[] = [
  {
    level: 0,
    title: "The Sensory Entry Point",
    subtitle: "Sound Before Sight",
    phase: "foundation",
    objectives: [
      "High vs. low pitch discrimination",
      "Loud vs. soft dynamics awareness",
      "Timbre recognition",
    ],
    adhdTriggers: [
      "Immediate audio on every tap",
      "No reading required",
      "Sessions capped at 3 minutes",
    ],
    narrativeTheme: "Awakening — the Composer-Knight discovers sound.",
    route: "/sensory",
    drillLabel: "Listening",
    topics: ["sensory", "note-reading-c4-b4"],
    unlocks: [{ to: "/sensory", label: "Listening" }],
  },
  {
    level: 1,
    title: "The Color-Coded Staff",
    subtitle: "Figurenotes & Landmark Notes",
    phase: "foundation",
    objectives: [
      "Figurenotes color and shape mapping",
      "Landmark notes: Middle C, Treble G, Bass F",
      "Simple melodies with full scaffolding",
    ],
    adhdTriggers: ["Play immediately from color", "Staff fades in as confidence rises"],
    narrativeTheme: "First Light — learning the language of color and sound.",
    route: "/practice",
    drillLabel: "Practice",
    topics: ["note-reading-c4-b4"],
    unlocks: [],
  },
  {
    level: 2,
    title: "Rhythm & The Body",
    subtitle: "Body Base-10 Method",
    phase: "foundation",
    objectives: [
      "Whole, half, quarter, and eighth notes",
      "Time signatures 4/4, 3/4, 2/4",
      "Dot notation",
    ],
    adhdTriggers: ["Kinesthetic tapping", "30-second micro-goals"],
    narrativeTheme: "The Pulse — feeling the heartbeat of music.",
    route: "/rhythm",
    drillLabel: "Rhythm",
    topics: ["rhythm"],
    unlocks: [{ to: "/rhythm", label: "Rhythm" }],
  },
  {
    level: 3,
    title: "Scales & Key Signatures",
    subtitle: "The Map of the Musical World",
    phase: "foundation",
    objectives: [
      "Major scale construction",
      "Key signatures up to 4 sharps and flats",
      "Circle of Fifths as a world map",
    ],
    adhdTriggers: ["Each key is a new region", "Quick-win identification"],
    narrativeTheme: "The Map — from the Plains of C Major to distant keys.",
    route: "/circle",
    drillLabel: "Key signatures",
    topics: ["keys", "scales"],
    unlocks: [
      { to: "/scale", label: "Scales" },
      { to: "/circle", label: "Circle of Fifths" },
    ],
  },
  {
    level: 4,
    title: "Intervals & Triads",
    subtitle: "The Gliph System",
    phase: "foundation",
    objectives: ["Intervals from unison to octave", "Major, minor, augmented, diminished triads"],
    adhdTriggers: ["Ear-training with instant replay", "Puzzle-piece triad assembly"],
    narrativeTheme: "The Forge — crafting harmonic building blocks.",
    route: "/interval",
    drillLabel: "Intervals",
    topics: ["intervals", "triads"],
    unlocks: [
      { to: "/interval", label: "Intervals" },
      { to: "/triad", label: "Triads" },
    ],
  },
  {
    level: 5,
    title: "Harmony Foundations",
    subtitle: "Cadences as Musical Punctuation",
    phase: "intermediate",
    objectives: ["Roman numerals I, IV, V, vi", "Perfect, plagal, half, deceptive cadences"],
    adhdTriggers: ["Hear and choose the cadence", "Color-coded functions"],
    narrativeTheme: "The Grammar — speaking in harmonic sentences.",
    route: "/cadence",
    drillLabel: "Cadences",
    topics: ["harmony"],
    unlocks: [{ to: "/cadence", label: "Cadences" }],
  },
  {
    level: 6,
    title: "Part-Writing & Score Analysis",
    subtitle: "The Four Voices",
    phase: "intermediate",
    objectives: ["Voice leading against a cantus", "Parallel 5ths/8ves detection"],
    adhdTriggers: ["Ghost notes suggest fixes", "Partial credit for naming the error"],
    narrativeTheme: "The Council — four voices learning to speak as one.",
    route: "/duel",
    drillLabel: "Duel",
    topics: ["duel", "harmony"],
    unlocks: [],
  },
  {
    level: 7,
    title: "Modulation & Pivot Chords",
    subtitle: "The Gateway",
    phase: "intermediate",
    objectives: ["Pivot chord modulation", "Closely related keys"],
    adhdTriggers: ["Portal mechanics between keys"],
    narrativeTheme: "The Gateway — traveling between tonal worlds.",
    route: "/circle",
    drillLabel: "Related keys",
    topics: ["modulation", "keys"],
    unlocks: [],
  },
  {
    level: 8,
    title: "Advanced Harmony",
    subtitle: "The Full Score",
    phase: "intermediate",
    objectives: ["Seventh chords and chromatic colour", "Odd meters and polyrhythms"],
    adhdTriggers: ["Isolate one voice at a time"],
    narrativeTheme: "The Orchestra — commanding the full harmonic army.",
    route: "/rhythm",
    drillLabel: "Rhythm",
    topics: ["rhythm", "realtime", "harmony"],
    unlocks: [],
  },
  {
    level: 9,
    title: "Advanced Counterpoint",
    subtitle: "Species Counterpoint Skill Tree",
    phase: "advanced",
    objectives: ["First species note-against-note", "Ghost resolutions"],
    adhdTriggers: ["Wait-mode duel, no timers", "Harmony Meter as the win condition"],
    narrativeTheme: "The Duel — sparring with the Discord Sentinel.",
    route: "/duel",
    drillLabel: "Duel",
    topics: ["duel"],
    unlocks: [],
  },
  {
    level: 10,
    title: "Fugue, Analysis & Modernism",
    subtitle: "The Masterwork",
    phase: "advanced",
    objectives: ["Fugal subject tracking", "Post-tonal pattern puzzles"],
    adhdTriggers: ["Detective work across voices"],
    narrativeTheme: "The Masterwork — composing your harmonic legacy.",
    route: "/duel",
    drillLabel: "Duel",
    topics: ["duel", "intervals", "harmony"],
    unlocks: [],
  },
];

export const MAX_GRADE = CURRICULUM.length - 1;

export function levelFor(grade: number): CurriculumLevel {
  return CURRICULUM.find((l) => l.level === grade) ?? CURRICULUM[0]!;
}

/** Every study unlocked at or below this grade, in curriculum order. */
export function studiesFor(grade: number): { to: AppRoute; label: string; level: number }[] {
  return CURRICULUM.filter((l) => l.level <= grade).flatMap((l) =>
    l.unlocks.map((u) => ({ ...u, level: l.level })),
  );
}

export function isStudyUnlocked(route: AppRoute, grade: number): boolean {
  return CURRICULUM.some((l) => l.level <= grade && l.unlocks.some((u) => u.to === route));
}

/** Does an answer on this topic count toward advancing out of this grade? */
export function topicCountsForGrade(topicId: string, grade: number): boolean {
  return levelFor(grade).topics.includes(topicId as TopicId);
}

export type GradeThreshold = {
  /** Size of the rolling window of recent answers that is judged. */
  minSessionAttempts: number;
  minSessionAccuracy: number;
};

export const GRADE_THRESHOLDS: Record<number, GradeThreshold> = {
  0: { minSessionAttempts: 10, minSessionAccuracy: 0.8 },
  1: { minSessionAttempts: 20, minSessionAccuracy: 0.85 },
  2: { minSessionAttempts: 20, minSessionAccuracy: 0.85 },
  3: { minSessionAttempts: 20, minSessionAccuracy: 0.85 },
  4: { minSessionAttempts: 20, minSessionAccuracy: 0.85 },
  5: { minSessionAttempts: 30, minSessionAccuracy: 0.9 },
  6: { minSessionAttempts: 30, minSessionAccuracy: 0.9 },
  7: { minSessionAttempts: 30, minSessionAccuracy: 0.9 },
  8: { minSessionAttempts: 40, minSessionAccuracy: 0.9 },
  9: { minSessionAttempts: 40, minSessionAccuracy: 0.92 },
};

export const BROKEN_BLADE_LENGTH = 5;
export const FEVER_THRESHOLD = 10;
