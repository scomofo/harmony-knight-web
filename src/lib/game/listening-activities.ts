import type { LessonActivity, ListeningSound, ListeningTask } from "./activities.ts";

function listen(
  id: string,
  skill: ListeningTask["skill"],
  sounds: ListeningSound[],
  answer: number,
  explanation: string,
): ListeningTask {
  const options =
    skill === "pitch"
      ? ["Higher", "Lower", "Same pitch"]
      : skill === "dynamics"
        ? ["Louder", "Softer", "Same loudness"]
        : ["Warm", "Hollow", "Bright", "Reed"];
  return {
    id,
    kind: "listening",
    skill,
    title: skill === "timbre" ? "Match the sound colour" : "Compare the two sounds",
    instruction:
      skill === "pitch"
        ? "Listen twice if you need to. Does the second note sit higher, lower, or in exactly the same place?"
        : skill === "dynamics"
          ? "Ignore pitch this time—it stays the same. Does the second note feel louder, softer, or equally loud? Keep your device at a comfortable volume."
          : "Hear the mystery sound first, then try the labelled references one at a time. Which one has the closest sound character?",
    sounds,
    options,
    solution: [[answer]],
    initial: [[]],
    explanation,
    writtenClue: explanation,
    hint:
      skill === "pitch"
        ? "Follow the sound with an imaginary hand: did it move up, move down, or stay level? Ignore loudness."
        : skill === "dynamics"
          ? "Picture the same note being played with more or less energy. Compare only that change."
          : "Replay the mystery, then one reference. Do not rush the label—listen for texture, edge, buzz or roundness. Pitch and volume already match.",
    references:
      skill === "timbre"
        ? options.map((label) => ({
            label,
            sound: { midi: sounds[0]!.midi, timbre: label as ListeningSound["timbre"] },
          }))
        : undefined,
  };
}

export const LISTENING_ACTIVITIES: Record<string, LessonActivity> = {
  "0-pitch": {
    title: "Hear pitch change",
    tasks: [
      listen(
        "up",
        "pitch",
        [{ midi: 60 }, { midi: 69 }],
        0,
        "The second note is higher: A4 follows C4. The volume setting stays the same.",
      ),
      listen(
        "down",
        "pitch",
        [{ midi: 72 }, { midi: 64 }],
        1,
        "The second note is lower: E4 follows C5.",
      ),
      listen(
        "same",
        "pitch",
        [{ midi: 67 }, { midi: 67 }],
        2,
        "Both sounds are G4. There are two attacks, but the pitch stays the same.",
      ),
    ],
  },
  "0-dynamics": {
    title: "Hear loudness change",
    tasks: [
      listen(
        "softer",
        "dynamics",
        [
          { midi: 64, volume: 0.8 },
          { midi: 64, volume: 0.25 },
        ],
        1,
        "The second E4 is softer. Its pitch stays the same.",
      ),
      listen(
        "louder",
        "dynamics",
        [
          { midi: 67, volume: 0.25 },
          { midi: 67, volume: 0.8 },
        ],
        0,
        "The second G4 is louder. Its pitch stays the same.",
      ),
      listen(
        "equal",
        "dynamics",
        [
          { midi: 65, volume: 0.5 },
          { midi: 65, volume: 0.5 },
        ],
        2,
        "Both F4 notes use the same loudness setting.",
      ),
    ],
  },
  "0-timbre": {
    title: "Explore sound colour",
    tasks: [
      listen(
        "hollow",
        "timbre",
        [{ midi: 64, timbre: "Hollow" }],
        1,
        "The mystery sound matches Hollow: a woody, hollow sound.",
      ),
      listen(
        "bright",
        "timbre",
        [{ midi: 64, timbre: "Bright" }],
        2,
        "The mystery sound matches Bright: a buzzy sound with a sharp edge.",
      ),
      listen(
        "warm",
        "timbre",
        [{ midi: 67, timbre: "Warm" }],
        0,
        "The mystery sound matches Warm: a rounded, gentle sound.",
      ),
      listen(
        "reed",
        "timbre",
        [{ midi: 67, timbre: "Reed" }],
        3,
        "The mystery sound matches Reed: a wavering, reedy sound.",
      ),
    ],
  },
};
