import type { AppRoute } from "./curriculum.ts";
import { diatonicTriad, voiceNear } from "./music.ts";

export type LessonExample = {
  label: string;
  /** Notes to play. For "progression", each inner array is a chord. */
  notes: number[] | number[][];
  mode: "sequence" | "chord" | "progression" | "timbre";
  /** For mode "timbre": which colour. */
  timbre?: "Warm" | "Hollow" | "Bright" | "Reed";
};

export type LessonSection = {
  heading: string;
  body: string;
  example?: LessonExample;
};

export type CheckQuestion = {
  prompt: string;
  options: string[];
  answer: string;
  why: string;
};

export type Lesson = {
  level: number;
  intro: string;
  sections: LessonSection[];
  /** Three quick questions — passing them is not required, but it teaches. */
  check: CheckQuestion[];
  drill: { to: AppRoute; label: string; why: string };
};

const I = voiceNear(diatonicTriad(60, 0), 65);
const IV = voiceNear(diatonicTriad(60, 3), 65);
const V = voiceNear(diatonicTriad(60, 4), 65);
const vi = voiceNear(diatonicTriad(60, 5), 65);

export const LESSONS: Lesson[] = [
  {
    level: 0,
    intro:
      "Before notes have names, they have qualities you already hear: higher or lower, louder or softer, and the colour of the sound itself. This level trains the ear before the eye.",
    sections: [
      {
        heading: "Pitch: high and low",
        body: "Pitch is how fast the air vibrates. Faster is higher and sounds thinner; slower is lower and sounds heavier. Small children hear this instantly — you already can.",
        example: { label: "Low, then high", notes: [48, 72], mode: "sequence" },
      },
      {
        heading: "Dynamics: loud and soft",
        body: "Dynamics are volume. Musicians borrow Italian: forte (f) is loud, piano (p) is soft. The pitch does not change — only the energy does.",
        example: { label: "The same note, soft then loud", notes: [64, 64], mode: "sequence" },
      },
      {
        heading: "Timbre: the colour of sound",
        body: "Two instruments can play the same pitch at the same volume and still sound different. That difference is timbre. It comes from the overtones stacked above the note: few overtones sounds warm, many sounds bright.",
        example: { label: "A bright colour", notes: [64], mode: "timbre", timbre: "Bright" },
      },
    ],
    check: [
      {
        prompt: "A tone vibrates faster. It sounds…",
        options: ["Higher", "Lower", "Louder", "Warmer"],
        answer: "Higher",
        why: "Faster vibration is higher pitch. Volume and colour are separate.",
      },
      {
        prompt: "The marking p means…",
        options: ["Soft", "Loud", "Fast", "High"],
        answer: "Soft",
        why: "p is piano — soft. f is forte — loud.",
      },
      {
        prompt: "Two instruments play the same note. What makes them sound different?",
        options: ["Timbre", "Pitch", "Rhythm", "Key"],
        answer: "Timbre",
        why: "Timbre is the colour of a sound — the overtones above the note.",
      },
    ],
    drill: {
      to: "/sensory",
      label: "Listening drill",
      why: "Ten quick calls: higher or lower, loud or soft, which colour.",
    },
  },
  {
    level: 1,
    intro:
      "Figurenotes give every pitch a colour and a shape, so you can play before you can read. Then the staff fades in underneath, and three landmark notes anchor everything else.",
    sections: [
      {
        heading: "Colour is the note name",
        body: "C is red, D is orange, E is yellow, F is green, G is blue, A is amber, B is grey. The colour never changes across octaves — a high C is still red. Shape shows which octave you are in.",
        example: {
          label: "C D E F G — red to blue",
          notes: [60, 62, 64, 65, 67],
          mode: "sequence",
        },
      },
      {
        heading: "The staff: five lines, four spaces",
        body: "Notes sit on lines or in spaces. Moving up one position — line to space or space to line — is the next letter of the alphabet. After G comes A again.",
        example: {
          label: "Climbing the staff",
          notes: [64, 65, 67, 69, 71, 72, 74, 77],
          mode: "sequence",
        },
      },
      {
        heading: "Three landmarks",
        body: "Middle C sits between the two staves, on its own short line. Treble G is the note the treble clef curls around — the second line up. Bass F is the note between the two dots of the bass clef — the fourth line up. Find the landmark, then count steps.",
        example: { label: "Bass F, Middle C, Treble G", notes: [53, 60, 67], mode: "sequence" },
      },
    ],
    check: [
      {
        prompt: "Which colour is C in Figurenotes?",
        options: ["Red", "Blue", "Yellow", "Green"],
        answer: "Red",
        why: "C is red in every octave. G is blue, E is yellow, F is green.",
      },
      {
        prompt: "The treble clef curls around which line?",
        options: ["G — second line", "F — fourth line", "C — third line", "E — first line"],
        answer: "G — second line",
        why: "The treble clef is also called the G clef for this reason.",
      },
      {
        prompt: "The two dots of the bass clef surround…",
        options: ["F", "C", "G", "A"],
        answer: "F",
        why: "The bass clef is the F clef. Bass F is the fourth line up.",
      },
    ],
    drill: {
      to: "/practice",
      label: "Practice",
      why: "Read the staff. Colour first; the lines fade in as your confidence rises.",
    },
  },
  {
    level: 2,
    intro:
      "Rhythm is time, felt in the body. The Body Base-10 method maps note lengths to gestures so you count with your arms before you count with numbers.",
    sections: [
      {
        heading: "Note values",
        body: "A whole note lasts 4 beats — arms stretched wide. A half note lasts 2 — hands at the waist. A quarter note is 1 beat — a clap. An eighth note is half a beat — a finger tap, two per clap.",
        example: {
          label: "Whole, half, quarter, eighth",
          notes: [60, 60, 60, 60],
          mode: "sequence",
        },
      },
      {
        heading: "Time signatures",
        body: "The top number says how many beats fill a bar; the bottom says which note gets one beat. 4/4 is four quarter-note beats — a march or a pop song. 3/4 is three — a waltz. 2/4 is two — a quick march.",
      },
      {
        heading: "The dot",
        body: "A dot after a note adds half its value. A dotted half note is 2 + 1 = 3 beats, which fills a whole bar of 3/4. A dotted quarter is 1 + ½ = 1½ beats; pair it with an eighth to make a skipping long-short.",
      },
    ],
    check: [
      {
        prompt: "How many quarter notes fill a bar of 4/4?",
        options: ["4", "2", "3", "8"],
        answer: "4",
        why: "4/4 means four beats per bar and the quarter note gets the beat.",
      },
      {
        prompt: "A dotted half note lasts…",
        options: ["3 beats", "2 beats", "2½ beats", "4 beats"],
        answer: "3 beats",
        why: "The dot adds half the value: 2 + 1 = 3.",
      },
      {
        prompt: "Which meter is a waltz?",
        options: ["3/4", "4/4", "2/4", "6/8"],
        answer: "3/4",
        why: "ONE two three. Three quarter-note beats per bar.",
      },
    ],
    drill: {
      to: "/rhythm",
      label: "Rhythm",
      why: "Hear a pattern, name it, then tap it back and get scored on timing.",
    },
  },
  {
    level: 3,
    intro:
      "Every major scale is the same shape starting from a different note. The key signature at the start of a line tells you which notes are raised or lowered so that shape holds.",
    sections: [
      {
        heading: "The major scale pattern",
        body: "Whole, whole, half, whole, whole, whole, half. Start on C and you need no sharps or flats. Start anywhere else and some notes must shift to keep the pattern.",
        example: { label: "C major", notes: [60, 62, 64, 65, 67, 69, 71, 72], mode: "sequence" },
      },
      {
        heading: "Sharps and flats in order",
        body: "Sharps always appear in the order F C G D A E B. Flats reverse it: B E A D G C F. For sharp keys, the last sharp is one step below the tonic. For flat keys, the second-to-last flat names the key.",
        example: {
          label: "G major — one sharp, F#",
          notes: [67, 69, 71, 72, 74, 76, 78, 79],
          mode: "sequence",
        },
      },
      {
        heading: "The circle of fifths",
        body: "Step clockwise from C and each key gains a sharp: G, D, A, E. Step counter-clockwise and each gains a flat: F, Bb, Eb, Ab. Neighbours on the circle share almost all their notes — they are the closest keys to travel between.",
      },
    ],
    check: [
      {
        prompt: "Which key has one sharp?",
        options: ["G major", "D major", "F major", "A major"],
        answer: "G major",
        why: "G major has F#. The last sharp (F#) is one step below the tonic (G).",
      },
      {
        prompt: "Which key has two flats?",
        options: ["Bb major", "F major", "Eb major", "G major"],
        answer: "Bb major",
        why: "Bb and Eb. The second-to-last flat — Bb — names the key.",
      },
      {
        prompt: "The major scale pattern begins…",
        options: [
          "Whole, whole, half",
          "Half, whole, whole",
          "Whole, half, whole",
          "Half, half, whole",
        ],
        answer: "Whole, whole, half",
        why: "W W H W W W H. The half steps fall between degrees 3–4 and 7–8.",
      },
    ],
    drill: {
      to: "/circle",
      label: "Key signatures",
      why: "Read the signature on the staff and name the key. Then travel the circle.",
    },
  },
  {
    level: 4,
    intro:
      "An interval is the distance between two notes. Stack two intervals and you have a triad — the basic chord. Learn to hear them and harmony becomes a set of shapes.",
    sections: [
      {
        heading: "Intervals by number and quality",
        body: "Count letter names to get the number: C to E is a third, C to G a fifth. Count semitones for the quality: a major 3rd is 4 semitones, a minor 3rd is 3. Perfect intervals — unison, 4th, 5th, octave — sound open and hollow.",
        example: {
          label: "Major 3rd, then perfect 5th",
          notes: [60, 64, 60, 67],
          mode: "sequence",
        },
      },
      {
        heading: "Consonance and dissonance",
        body: "Thirds, sixths, fifths and octaves blend — they are consonant. Seconds, sevenths and the tritone rub — they are dissonant and want to move. Neither is good or bad; music needs both.",
        example: {
          label: "A blend, then a clash",
          notes: [
            [60, 64],
            [60, 61],
          ],
          mode: "progression",
        },
      },
      {
        heading: "Four triads",
        body: "Major: major 3rd + minor 3rd — bright. Minor: minor 3rd + major 3rd — darker. Diminished: two minor 3rds — squeezed and tense. Augmented: two major 3rds — stretched and floating.",
        example: {
          label: "Major, minor, diminished, augmented on C",
          notes: [
            [60, 64, 67],
            [60, 63, 67],
            [60, 63, 66],
            [60, 64, 68],
          ],
          mode: "progression",
        },
      },
    ],
    check: [
      {
        prompt: "How many semitones in a perfect 5th?",
        options: ["7", "5", "4", "12"],
        answer: "7",
        why: "C to G is seven semitones. Twinkle Twinkle opens with one.",
      },
      {
        prompt: "A minor triad is built from…",
        options: [
          "Minor 3rd + major 3rd",
          "Major 3rd + minor 3rd",
          "Two minor 3rds",
          "Two major 3rds",
        ],
        answer: "Minor 3rd + major 3rd",
        why: "3 semitones then 4. Lower the third of a major triad and it turns minor.",
      },
      {
        prompt: "Which interval is dissonant?",
        options: ["Minor 2nd", "Major 3rd", "Perfect 5th", "Octave"],
        answer: "Minor 2nd",
        why: "Seconds, sevenths and the tritone are dissonant — they want to resolve.",
      },
    ],
    drill: {
      to: "/interval",
      label: "Intervals",
      why: "Hear two notes, name the distance. Then move on to triads.",
    },
  },
  {
    level: 5,
    intro:
      "Chords built on each step of a scale get Roman numerals. Upper-case is major, lower-case is minor. Cadences are the punctuation — the way phrases stop.",
    sections: [
      {
        heading: "Roman numerals in a major key",
        body: "I, IV and V are major. ii, iii and vi are minor. vii° is diminished. I is home, V pulls back to home hardest because it holds the leading tone, and IV lifts gently away.",
        example: { label: "I — IV — V — I in C", notes: [I, IV, V, I], mode: "progression" },
      },
      {
        heading: "Perfect and plagal",
        body: "V to I is the perfect cadence — a full stop. IV to I is the plagal cadence — the church Amen, softer because there is no leading tone.",
        example: { label: "Perfect: V to I", notes: [V, I], mode: "progression" },
      },
      {
        heading: "Half and deceptive",
        body: "Stopping on V is a half cadence — a comma; the phrase is not finished. V to vi is the deceptive cadence — you expect home and get the relative minor instead.",
        example: { label: "Deceptive: V to vi", notes: [V, vi], mode: "progression" },
      },
    ],
    check: [
      {
        prompt: "Which numerals are major in a major key?",
        options: ["I, IV, V", "ii, iii, vi", "I, ii, iii", "IV, V, vii°"],
        answer: "I, IV, V",
        why: "The primary chords. ii, iii and vi are minor; vii° is diminished.",
      },
      {
        prompt: "IV to I is called…",
        options: ["Plagal", "Perfect", "Half", "Deceptive"],
        answer: "Plagal",
        why: "The Amen cadence. Gentle because IV has no leading tone.",
      },
      {
        prompt: "V to vi is called…",
        options: ["Deceptive", "Perfect", "Plagal", "Half"],
        answer: "Deceptive",
        why: "You expect I and hear the relative minor instead.",
      },
    ],
    drill: {
      to: "/cadence",
      label: "Cadences",
      why: "Hear a phrase end. Name the cadence or the chord.",
    },
  },
  {
    level: 6,
    intro:
      "Part-writing is how independent melodies move together. The duel is first-species counterpoint: one note of yours against one of the Sentinel's, judged by the old rules.",
    sections: [
      {
        heading: "Consonance on every beat",
        body: "In first species every pair of notes must blend: a third, sixth, fifth, octave or unison. Prefer thirds and sixths — imperfect consonances keep the line moving. Fifths and octaves are for the start and the end.",
        example: {
          label: "Thirds and sixths above C",
          notes: [
            [60, 64],
            [60, 69],
            [60, 67],
          ],
          mode: "progression",
        },
      },
      {
        heading: "No parallel fifths or octaves",
        body: "Two perfect fifths in a row, or two octaves in a row, make the voices sound like one. The rule against them is what keeps two lines two lines.",
        example: {
          label: "Parallel fifths — avoid",
          notes: [
            [60, 67],
            [62, 69],
          ],
          mode: "progression",
        },
      },
      {
        heading: "Keep the voices apart",
        body: "Your line stays above the cantus. Do not cross below it, and do not leap into a fifth or octave with both voices moving the same way — that is a hidden fifth.",
      },
    ],
    check: [
      {
        prompt: "Which intervals are favoured in the middle of a first-species line?",
        options: ["Thirds and sixths", "Fifths and octaves", "Seconds and sevenths", "Unisons"],
        answer: "Thirds and sixths",
        why: "Imperfect consonances blend and keep independence.",
      },
      {
        prompt: "Two perfect fifths in a row are…",
        options: ["Forbidden — parallel fifths", "Ideal", "A cadence", "A tritone"],
        answer: "Forbidden — parallel fifths",
        why: "They make two voices sound like one.",
      },
      {
        prompt: "Your line moving below the cantus is…",
        options: ["Voice crossing", "A plagal cadence", "A hidden octave", "Allowed"],
        answer: "Voice crossing",
        why: "In the duel your voice stays above the Sentinel's.",
      },
    ],
    drill: {
      to: "/duel",
      label: "Duel",
      why: "Answer above the Sentinel. The meter fills when you blend.",
    },
  },
  {
    level: 7,
    intro:
      "Modulation is changing key mid-piece. The smoothest route is through a pivot chord — a chord that belongs to both the old key and the new one.",
    sections: [
      {
        heading: "Closely related keys",
        body: "The keys one step either way on the circle of fifths, plus the relative minor of each, share six of seven notes with home. From C major that is G major, F major, A minor, E minor and D minor.",
        example: {
          label: "C major, then G major",
          notes: [
            [60, 64, 67],
            [67, 71, 74],
          ],
          mode: "progression",
        },
      },
      {
        heading: "The pivot chord",
        body: "Find a chord that exists in both keys. A minor is vi in C major and ii in G major. Land on it as vi, leave it as ii, then cadence in G — the ear follows without a jolt.",
        example: {
          label: "C: I — vi — (G: ii) — V — I",
          notes: [
            [60, 64, 67],
            [57, 60, 64],
            [62, 66, 69],
            [67, 71, 74],
          ],
          mode: "progression",
        },
      },
    ],
    check: [
      {
        prompt: "Which key is NOT closely related to C major?",
        options: ["E major", "G major", "F major", "A minor"],
        answer: "E major",
        why: "E major has four sharps — far around the circle. G, F and A minor are neighbours.",
      },
      {
        prompt: "A pivot chord is…",
        options: ["A chord in both keys", "Always V", "A diminished chord", "The tonic"],
        answer: "A chord in both keys",
        why: "It belongs to the old key and the new one, so the ear can reinterpret it.",
      },
      {
        prompt: "A minor is vi in C major. In G major it is…",
        options: ["ii", "vi", "IV", "V"],
        answer: "ii",
        why: "G A B C D E F#: A is the second degree, so A minor is ii.",
      },
    ],
    drill: {
      to: "/circle",
      label: "Related keys",
      why: "Name the neighbours of each key on the circle.",
    },
  },
  {
    level: 8,
    intro:
      "Add a fourth note to a triad and you have a seventh chord — richer, more tense. Add a beat to a bar and you have an odd meter. This level widens the palette.",
    sections: [
      {
        heading: "Seventh chords",
        body: "The dominant seventh — V7 — adds a minor seventh above the root and pulls toward I even harder than V. A major seventh sounds dreamy; a minor seventh, mellow.",
        example: {
          label: "V7 to I",
          notes: [
            [55, 59, 62, 65],
            [60, 64, 67],
          ],
          mode: "progression",
        },
      },
      {
        heading: "Chromatic colour",
        body: "Borrow a chord from the parallel minor, or slide a bass note by a semitone, and a plain progression gains shadow. The Neapolitan — a major chord on the flattened second — is a classic pre-dominant surprise.",
        example: {
          label: "Neapolitan (Db) to V to I",
          notes: [
            [61, 65, 68],
            [55, 59, 62],
            [60, 64, 67],
          ],
          mode: "progression",
        },
      },
      {
        heading: "Odd meters",
        body: "5/4 groups as 3 + 2 or 2 + 3. 7/8 as 2 + 2 + 3. Feel the long group as a stretched beat and the pulse stays steady even when the bars are uneven.",
      },
    ],
    check: [
      {
        prompt: "V7 adds which interval above the root?",
        options: ["Minor 7th", "Major 7th", "Major 6th", "Perfect 4th"],
        answer: "Minor 7th",
        why: "G B D F: the F is a minor seventh above G and resolves down to E.",
      },
      {
        prompt: "The Neapolitan chord is built on…",
        options: ["The flattened 2nd", "The 5th", "The raised 4th", "The 6th"],
        answer: "The flattened 2nd",
        why: "In C major that is a Db major chord, usually in first inversion.",
      },
      {
        prompt: "5/4 is commonly grouped as…",
        options: ["3 + 2", "4 + 4", "2 + 2 + 2", "1 + 4"],
        answer: "3 + 2",
        why: "Or 2 + 3. Take Five is 3 + 2.",
      },
    ],
    drill: {
      to: "/rhythm",
      label: "Rhythm",
      why: "Odd groupings and dotted skips. Then Strike to test it in time.",
    },
  },
  {
    level: 9,
    intro:
      "Species counterpoint is a ladder. First species is note against note; later species add passing tones, suspensions and free rhythm. Master the first rung and the rest follow.",
    sections: [
      {
        heading: "Shape the whole line",
        body: "A good counterpoint has one high point, mostly steps, a few leaps that are then filled in by steps the other way, and a final approach to the last note by step.",
      },
      {
        heading: "Begin and end on perfect consonances",
        body: "Open on a unison, fifth or octave. Close on a unison or octave, approaching from a sixth or a third so the last two notes converge.",
        example: {
          label: "Sixth to octave close",
          notes: [
            [62, 71],
            [60, 72],
          ],
          mode: "progression",
        },
      },
      {
        heading: "Ghost resolutions",
        body: "When you clash, the ghost shows the nearest consonant answer. Accepting it is not cheating — it is how you learn the shape of a resolution until you can hear it unaided.",
      },
    ],
    check: [
      {
        prompt: "A first-species line should mostly move by…",
        options: ["Steps", "Leaps", "Repeated notes", "Octaves"],
        answer: "Steps",
        why: "Steps make a singable line. Leaps are rare and get filled in afterwards.",
      },
      {
        prompt: "The final interval should be…",
        options: ["Unison or octave", "A third", "A sixth", "A tritone"],
        answer: "Unison or octave",
        why: "A perfect consonance closes the phrase.",
      },
      {
        prompt: "How many high points should a line have?",
        options: ["One", "None", "Two", "As many as possible"],
        answer: "One",
        why: "A single climax gives the line direction.",
      },
    ],
    drill: {
      to: "/duel",
      label: "Duel",
      why: "Longer cantus, chromatic tones, a higher bar to win.",
    },
  },
  {
    level: 10,
    intro:
      "A fugue takes one subject and passes it between voices, transposed and transformed. Modern music may abandon keys entirely and build from intervals and patterns instead. Both reward the detective's ear.",
    sections: [
      {
        heading: "Subject and answer",
        body: "The subject appears alone. The answer is the subject a fifth higher, entering while the first voice continues with a countersubject. Track the subject through every voice — it will be inverted, stretched and hidden.",
        example: {
          label: "Subject, then answer a fifth up",
          notes: [60, 62, 64, 60, 67, 69, 71, 67],
          mode: "sequence",
        },
      },
      {
        heading: "Post-tonal patterns",
        body: "Without a key, composers organise by interval. A whole-tone scale has only whole steps. A twelve-tone row uses every pitch once. Listen for the recurring interval, not the home note.",
        example: {
          label: "Whole-tone scale",
          notes: [60, 62, 64, 66, 68, 70, 72],
          mode: "sequence",
        },
      },
    ],
    check: [
      {
        prompt: "In a fugue, the answer is usually the subject…",
        options: ["A fifth higher", "Backwards", "In the same key", "An octave lower"],
        answer: "A fifth higher",
        why: "Subject in the tonic, answer in the dominant.",
      },
      {
        prompt: "A whole-tone scale contains…",
        options: ["Only whole steps", "Only half steps", "Alternating steps", "Twelve notes"],
        answer: "Only whole steps",
        why: "Six notes per octave, each a whole step apart. Debussy loved it.",
      },
      {
        prompt: "A twelve-tone row uses each pitch…",
        options: ["Once", "Twice", "Never", "In octaves"],
        answer: "Once",
        why: "All twelve pitch classes before any repeats.",
      },
    ],
    drill: {
      to: "/duel",
      label: "Duel",
      why: "The Sentinel's final phrase. Everything you know, in one line.",
    },
  },
];

export function lessonFor(level: number): Lesson {
  return LESSONS.find((l) => l.level === level) ?? LESSONS[0]!;
}
