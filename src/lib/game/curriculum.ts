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
  /** Learner-facing chapter framing: what this chapter adds to the journey. */
  chapterIntro: string;
  /** Learner-facing bridge into the next chapter. Omitted for the final chapter. */
  nextBridge?: string;
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
    title: "Start with Sound",
    subtitle: "Hear first. Name it later.",
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
    chapterIntro:
      "Before notation, chords or scales, music is simply something you can hear. This chapter gives names to distinctions your ears already make: high and low, soft and loud, different sound colours, and a steady pulse.",
    nextBridge:
      "Once you can notice sound directly, the next step is learning how musicians put those sounds on a page without turning reading into memorization.",
    route: "/sensory",
    drillLabel: "Listening",
    topics: ["sensory", "note-reading-c4-b4"],
    unlocks: [{ to: "/sensory", label: "Listening" }],
  },
  {
    level: 1,
    title: "Find Your Way Around the Staff",
    subtitle: "Turn sound into a readable map.",
    phase: "foundation",
    objectives: [
      "Figurenotes color and shape mapping",
      "Landmark notes: Middle C, Treble G, Bass F",
      "Simple melodies with full scaffolding",
    ],
    adhdTriggers: ["Play immediately from color", "Staff fades in as confidence rises"],
    narrativeTheme: "First Light — learning the language of color and sound.",
    chapterIntro:
      "Now the sounds get landmarks. You will learn the seven note names, use a few dependable staff anchors, and navigate by steps instead of trying to memorize every note at once.",
    nextBridge:
      "Once pitches have places, music needs motion through time. The next chapter moves from where a note is to when it happens and how long it lasts.",
    route: "/practice",
    drillLabel: "Practice",
    topics: ["note-reading-c4-b4"],
    unlocks: [],
  },
  {
    level: 2,
    title: "Feel Time Before You Count It",
    subtitle: "Build rhythm from a steady pulse.",
    phase: "foundation",
    objectives: [
      "Whole, half, quarter, and eighth notes",
      "Time signatures 4/4, 3/4, 2/4",
      "Dot notation",
    ],
    adhdTriggers: ["Kinesthetic tapping", "30-second micro-goals"],
    narrativeTheme: "The Pulse — feeling the heartbeat of music.",
    chapterIntro:
      "Rhythm becomes much easier when the body understands it before the terminology arrives. You will keep a pulse, divide it, group it, leave measured silence and lean away from the beat with syncopation.",
    nextBridge:
      "With pitch and rhythm under your hands, you are ready to hear why some notes feel like home and how a whole key grows from one repeating interval pattern.",
    route: "/rhythm",
    drillLabel: "Rhythm",
    topics: ["rhythm"],
    unlocks: [{ to: "/rhythm", label: "Rhythm" }],
  },
  {
    level: 3,
    title: "Find Home in a Key",
    subtitle: "Scales, signatures and nearby keys.",
    phase: "foundation",
    objectives: [
      "Major scale construction",
      "Key signatures up to 4 sharps and flats",
      "Circle of Fifths as a world map",
    ],
    adhdTriggers: ["Each key is a new region", "Quick-win identification"],
    narrativeTheme: "The Map — from the Plains of C Major to distant keys.",
    chapterIntro:
      "A scale is more than an exercise: it is a map of available notes and musical gravity. You will build major and minor patterns, read signatures and use the circle of fifths as a map of nearby tonal neighbourhoods.",
    nextBridge:
      "Keys tell you which notes belong together. Next, you will measure the distance between those notes and stack those distances into the chords that harmony is built from.",
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
    title: "Measure Distance. Build Chords.",
    subtitle: "Turn note relationships into harmony.",
    phase: "foundation",
    objectives: ["Intervals from unison to octave", "Major, minor, augmented, diminished triads"],
    adhdTriggers: ["Ear-training with instant replay", "Puzzle-piece triad assembly"],
    narrativeTheme: "The Forge — crafting harmonic building blocks.",
    chapterIntro:
      "Intervals give you a measuring tape; triads turn those measurements into harmony. You will hear tension, build chord qualities and use inversions to keep the same harmony while the bass moves more naturally.",
    nextBridge:
      "Once you can build chords, the important question changes from 'what chord is this?' to 'what job is this chord doing, and where does it want to go?'",
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
    title: "Make Chords Go Somewhere",
    subtitle: "Function, expectation and arrival.",
    phase: "intermediate",
    objectives: ["Roman numerals I, IV, V, vi", "Perfect, plagal, half, deceptive cadences"],
    adhdTriggers: ["Hear and choose the cadence", "Color-coded functions"],
    narrativeTheme: "The Grammar — speaking in harmonic sentences.",
    chapterIntro:
      "Harmony starts to behave like language here. Roman numerals describe chord jobs, cadences create different kinds of punctuation, and melodies learn when to rest on the harmony and when to move through it.",
    nextBridge:
      "So far, one chord or melody has carried most of the attention. Next, several voices have to move at once without losing their individual shape.",
    route: "/cadence",
    drillLabel: "Cadences",
    topics: ["harmony"],
    unlocks: [{ to: "/cadence", label: "Cadences" }],
  },
  {
    level: 6,
    title: "Let More Than One Voice Speak",
    subtitle: "Voice-leading without losing the melody.",
    phase: "intermediate",
    objectives: [
      "Independent voices and SATB",
      "Parallel 5ths/8ves detection",
      "Passing notes, neighbours and suspensions",
    ],
    adhdTriggers: ["Ghost notes suggest fixes", "Partial credit for naming the error"],
    narrativeTheme: "The Council — four voices learning to speak as one.",
    chapterIntro:
      "Part-writing is the craft of making several believable melodies coexist. You will hear why some parallel motions make voices fuse together, practise contrary motion and use passing tones and suspensions to add life between chord tones.",
    nextBridge:
      "Once voices can move smoothly inside one key, harmony can begin to travel. The next chapter asks how music makes a different note feel like home.",
    route: "/duel",
    drillLabel: "Duel",
    topics: ["duel", "harmony"],
    unlocks: [],
  },
  {
    level: 7,
    title: "Move the Sense of Home",
    subtitle: "Travel between keys without losing the listener.",
    phase: "intermediate",
    objectives: [
      "Pivot chord modulation",
      "Closely related keys",
      "Tonicization and secondary dominants",
    ],
    adhdTriggers: ["Portal mechanics between keys"],
    narrativeTheme: "The Gateway — traveling between tonal worlds.",
    chapterIntro:
      "Changing key is not just adding an accidental. You will hear the difference between a brief tonicization and a genuine new home, use shared pivot chords and create extra pull with secondary dominants.",
    nextBridge:
      "With tonal travel under control, the palette can get richer: sevenths, borrowed harmony and rhythms that divide time in less familiar ways.",
    route: "/circle",
    drillLabel: "Related keys",
    topics: ["modulation", "keys"],
    unlocks: [],
  },
  {
    level: 8,
    title: "Add Colour, Weight and Rhythmic Tension",
    subtitle: "Sevenths, borrowed colour and layered time.",
    phase: "intermediate",
    objectives: ["Seventh chords and chromatic colour", "Odd meters and polyrhythms"],
    adhdTriggers: ["Isolate one voice at a time"],
    narrativeTheme: "The Orchestra — commanding the full harmonic army.",
    chapterIntro:
      "This chapter widens the palette. Seventh chords add colour and direction, borrowed chords bend the key without abandoning it, and odd meter and polyrhythm show that musical tension can live in time as well as pitch.",
    nextBridge:
      "Richer harmony is only half the story. Next, the focus narrows back to melody—two independent lines whose relationship creates the harmony moment by moment.",
    route: "/rhythm",
    drillLabel: "Rhythm",
    topics: ["rhythm", "realtime", "harmony"],
    unlocks: [],
  },
  {
    level: 9,
    title: "Make Independent Lines Belong Together",
    subtitle: "Control motion, tension and release.",
    phase: "advanced",
    objectives: [
      "First-species line and cadence",
      "Second and third species",
      "Suspensions and florid counterpoint",
    ],
    adhdTriggers: ["Wait-mode duel, no timers", "Harmony Meter as the win condition"],
    narrativeTheme: "The Duel — sparring with the Discord Sentinel.",
    chapterIntro:
      "Counterpoint treats each voice as a melody worth hearing on its own. Species exercises slow the problem down so you can shape lines, control dissonance and hear exactly how independence and harmony support each other.",
    nextBridge:
      "Once you can follow independent voices, the final chapter asks you to recognize an idea even when it changes voice, direction, speed, tonal centre or pitch-class form.",
    route: "/duel",
    drillLabel: "Duel",
    topics: ["duel"],
    unlocks: [],
  },
  {
    level: 10,
    title: "Recognize Ideas as They Transform",
    subtitle: "Follow themes beyond ordinary major and minor.",
    phase: "advanced",
    objectives: [
      "Fugal subjects, answers and development",
      "Modes and musical form",
      "Pitch-class transformations",
    ],
    adhdTriggers: ["Detective work across voices"],
    narrativeTheme: "The Masterwork — composing your harmonic legacy.",
    chapterIntro:
      "The final chapter is about musical identity. You will track a fugue subject through new voices, hear ideas transformed by inversion and rhythmic change, establish modal centres and use pitch-class tools when ordinary key labels stop being enough.",
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
