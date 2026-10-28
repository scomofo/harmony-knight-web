export type TransferPrompt = {
  prompt: string;
  alternative: string;
  rubric: string[];
  reflectionPrompt: string;
};

/** Optional, unscored transfer beyond the app; none of these prompts certifies performance skill. */
export const CHAPTER_TRANSFER: TransferPrompt[] = [
  {
    prompt: "Hum or play your four-note call and reply once at a comfortable volume.",
    alternative:
      "Without an instrument or voice, tap four positions on a table while silently imagining the contour.",
    rubric: ["Keep the call and reply distinct.", "Notice whether the pitch shape feels related."],
    reflectionPrompt: "What made the reply sound connected to the call?",
  },
  {
    prompt: "Play, sing or point through your Lantern Call remix, then compare it with C–D–E–C.",
    alternative:
      "Write the four note names and draw an arrow between each pair to show its contour.",
    rubric: ["Keep one recognizable part of the original.", "Identify one deliberate change."],
    reflectionPrompt: "Which change altered the character most, and why?",
  },
  {
    prompt: "Tap your two-row groove once on two surfaces, keeping the eighth-note grid steady.",
    alternative:
      "Speak the grid numbers aloud and mark where each low and high hit belongs on paper.",
    rubric: ["Keep the shared grid steady.", "Make the two rows distinguishable."],
    reflectionPrompt: "Which row carries the pulse, and which adds contrast?",
  },
  {
    prompt: "Play or sing your eight-note phrase twice: once ending on C and once on another note.",
    alternative:
      "Notate the two endings and explain which written note makes C feel more like home.",
    rubric: ["Keep the opening the same in both versions.", "Compare only the ending."],
    reflectionPrompt: "Which ending felt more settled, and what did you hear?",
  },
  {
    prompt:
      "Play your chord loop on an available instrument, or use the app audio while pointing to each chord change.",
    alternative:
      "Write the chord roots in order and describe where the harmony feels stable or unsettled.",
    rubric: ["Keep the loop order clear.", "Listen for the effect of the chord you replaced."],
    reflectionPrompt: "What changed when you substituted one chord?",
  },
  {
    prompt:
      "Play or sing your melody over one of the available endings, then stop after one complete phrase.",
    alternative: "Speak the melody's note names while marking the final cadence on paper.",
    rubric: [
      "Keep the cadence audible or visible.",
      "Notice whether the ending feels strong, soft or surprising.",
    ],
    reflectionPrompt: "Why did you choose this ending for the phrase?",
  },
  {
    prompt: "Play the upper line and bass separately if possible, then combine them once.",
    alternative:
      "Use two fingers to trace each line on paper while listening to the parts separately in the app.",
    rubric: ["Follow each line on its own.", "Notice where the lines move in opposite directions."],
    reflectionPrompt: "Where did the two lines feel most independent?",
  },
  {
    prompt:
      "Play your chord route and pause briefly on the chord that makes G feel like a new centre.",
    alternative: "Notate the route and circle the D–G motion, then explain it without playing.",
    rubric: [
      "Keep the original key audible at the start.",
      "Identify the moment the new centre emerges.",
    ],
    reflectionPrompt: "What made G begin to feel like home?",
  },
  {
    prompt:
      "Tap your groove while cycling through the chord colours in the app; stop after one full cycle.",
    alternative:
      "Keep a spoken pulse and name each chord colour on the beat without playing an instrument.",
    rubric: ["Keep the pulse consistent.", "Notice the colour change without changing the groove."],
    reflectionPrompt: "Which chord colour changed the mood most?",
  },
  {
    prompt:
      "Play or sing both parts, then perform only the final contrary-motion approach to the octave.",
    alternative: "Trace the two final lines on paper and mark each step toward the closing octave.",
    rubric: ["Keep both lines melodic.", "Make the closing motion and final octave clear."],
    reflectionPrompt: "How did the contrary motion affect the sense of closure?",
  },
  {
    prompt:
      "Play or sing the first four notes and your transformed answer once, keeping the original nearby for comparison.",
    alternative:
      "Write both four-note groups and annotate whether you moved, reversed or reshaped the idea.",
    rubric: [
      "Keep one recognizable feature of the subject.",
      "Make one transformation easy to name.",
    ],
    reflectionPrompt: "Which feature kept the answer connected to the subject?",
  },
];
