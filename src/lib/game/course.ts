import {
  lessonFor,
  type CheckQuestion,
  type LessonExample,
  type LessonSection,
} from "./lessons.ts";

export type CourseUnit = {
  id: string;
  level: number;
  title: string;
  minutes: number;
  goal: string;
  body: string;
  example?: LessonExample;
  tryIt: string;
  checks: CheckQuestion[];
};

function q(prompt: string, answer: string, distractors: string[], why: string): CheckQuestion {
  const options = [answer, ...distractors];
  // Stable order across reloads, without teaching that the first option is always right.
  const shift = Array.from(prompt).reduce((sum, c) => sum + c.charCodeAt(0), 0) % options.length;
  return { prompt, answer, why, options: [...options.slice(shift), ...options.slice(0, shift)] };
}

const check = (level: number, index: number) => {
  const question = lessonFor(level).check[index]!;
  return q(
    question.prompt,
    question.answer,
    question.options.filter((a) => a !== question.answer),
    question.why,
  );
};

function unit(
  level: number,
  slug: string,
  source: number | LessonSection,
  goal: string,
  tryIt: string,
  checks: CheckQuestion[],
): CourseUnit {
  const section = typeof source === "number" ? lessonFor(level).sections[source]! : source;
  return {
    id: `${level}-${slug}`,
    level,
    title: section.heading,
    minutes: level < 6 ? 3 : 5,
    goal,
    body: section.body,
    example: section.example,
    tryIt,
    checks,
  };
}

/** Stable ids are persisted. New teaching can be added without renumbering existing progress. */
export const COURSE_UNITS: CourseUnit[] = [
  unit(
    0,
    "pitch",
    0,
    "Tell pitch apart from volume.",
    "Hum any comfortable note, then a higher one. Keep both equally quiet. If humming is uncomfortable, imagine the two sounds or replay the example. You are changing pitch, not volume.",
    [
      check(0, 0),
      q(
        "A low note gets louder. Has its pitch necessarily changed?",
        "No",
        ["Yes, it became higher", "Yes, it became lower"],
        "Loudness and pitch are separate qualities. A low note can be quiet or loud.",
      ),
    ],
  ),
  unit(
    0,
    "dynamics",
    1,
    "Recognise soft and loud without changing the note.",
    "Say a comfortable 'ah' softly, then a little louder, keeping the same pitch. In the example the second E is louder. Keep your device at a comfortable volume; louder is not better.",
    [
      check(0, 1),
      q(
        "Which marking asks for a louder sound than p?",
        "f",
        ["A higher note", "A faster tempo"],
        "f stands for forte. It changes dynamics, not pitch or speed.",
      ),
    ],
  ),
  unit(
    0,
    "timbre",
    2,
    "Notice the character of a sound.",
    "Imagine a piano and a trumpet playing the same note. Describe the difference in your own words: sharp, rounded, buzzy, breathy. There is no required mood or colour association.",
    [
      check(0, 2),
      q(
        "A piano and trumpet play equally loud A notes. What can still differ?",
        "Their sound character",
        ["They must be in different keys", "Their note names must differ"],
        "Timbre distinguishes instruments even at the same pitch and loudness.",
      ),
    ],
  ),
  unit(
    0,
    "pulse",
    {
      heading: "Find a steady pulse",
      body: "The beat is a regular pulse you can tap along to. Tempo is its speed, often written as beats per minute (BPM). At 60 BPM there is one beat each second; at 120 there are two. Rhythm is the pattern of sounds and silences placed around that beat. You can keep a steady beat while a melody uses a changing rhythm.",
      example: { label: "Four evenly spaced notes", mode: "sequence", notes: [60, 60, 60, 60] },
    },
    "Separate the steady beat from the rhythm played over it.",
    "Tap four evenly spaced beats on a table. Keep tapping while saying 'tea, coffee, tea, coffee': tea has one syllable and coffee has two. Your pulse stays steady while the syllable rhythm changes.",
    [
      q(
        "What does BPM measure?",
        "Tempo",
        ["Pitch", "Volume"],
        "Beats per minute measures how fast the pulse moves.",
      ),
      q(
        "A melody changes rhythm. Must its beat speed change?",
        "No, the pulse can stay steady",
        ["Yes, every note speeds up", "Yes, every rest slows it down"],
        "Rhythms can divide and span an unchanged beat.",
      ),
    ],
  ),

  unit(
    1,
    "alphabet",
    0,
    "Use the seven note letters and recognise an octave.",
    "Say C D E F G A B C. Notice where the alphabet wraps. Now choose a comfortable note and imagine a much higher note with the same name: it belongs to another octave.",
    [
      q(
        "Which note letter comes after G?",
        "A",
        ["H", "C"],
        "Music repeats A through G; there is no H in this naming system.",
      ),
      q(
        "Two C notes are an octave apart. What stays the same?",
        "Their letter name",
        ["Their exact pitch", "Their staff position"],
        "Octaves have different pitches but share a note name.",
      ),
    ],
  ),
  unit(
    1,
    "staff",
    1,
    "Count adjacent lines and spaces.",
    "Draw five horizontal lines. Place a note on the bottom line of a treble staff: E. Move to the next space (F), then the next line (G). Count both lines and spaces, not just lines.",
    [
      q(
        "How many lines does one staff have?",
        "Five",
        ["Four", "Seven"],
        "Five lines create four spaces between them.",
      ),
      q(
        "A note moves up from treble E on the bottom line to the next space. It is…",
        "F",
        ["G", "D"],
        "Each adjacent staff position moves one letter: E, F, G.",
      ),
    ],
  ),
  unit(
    1,
    "landmarks",
    2,
    "Find Middle C, treble G and bass F.",
    "Draw the second line from the bottom of a treble staff and label it G. The space just above is A, the space below is F. Use a known landmark as an anchor instead of memorising every position at once.",
    [check(1, 1), check(1, 2)],
  ),
  unit(
    1,
    "steps",
    {
      heading: "Half steps, sharps and flats",
      body: "A half step (semitone) moves to the next piano key, black or white. A whole step is two half steps. A sharp (#) raises a note by a semitone; a flat (b) lowers it; a natural cancels an accidental. E–F and B–C are already half steps: there is no black key between them. C# and Db sound the same on an equal-tempered piano, but their spelling tells you their musical job.",
      example: {
        label: "C–C# (half step), C–D (whole step)",
        notes: [60, 61, 60, 62],
        mode: "sequence",
      },
    },
    "Measure the smallest keyboard step.",
    "Imagine all piano keys in a row. Count from C to D: C to C#, then C# to D. That is two semitones. Now compare E to F: just one. You do not need an instrument to count the pattern.",
    [
      q(
        "E to F is how many semitones?",
        "One",
        ["Two", "Three"],
        "E and F are neighbouring white keys with no black key between.",
      ),
      q(
        "What does a flat do?",
        "Lowers a note by a semitone",
        ["Makes it quieter", "Lowers it by an octave"],
        "Accidentals change pitch. Dynamics change volume.",
      ),
    ],
  ),

  unit(
    2,
    "duration",
    0,
    "Fit note lengths into a steady pulse.",
    "Count 1 2 3 4 steadily. Hold a sound through all four counts (whole note), then through two counts (half note), then one (quarter note). In 4/4, two eighth notes share one beat.",
    [
      check(2, 0),
      q(
        "In 4/4, two eighth notes together last…",
        "One quarter-note beat",
        ["Two beats", "Four beats"],
        "Each eighth lasts half a quarter-note beat.",
      ),
    ],
  ),
  unit(
    2,
    "meter",
    1,
    "Hear groups of beats and distinguish 3/4 from 6/8.",
    "Tap ONE two three twice for 3/4. Then say ONE-and-a TWO-and-a for 6/8. Both can contain six eighth notes, but 3/4 groups them as 2+2+2 and 6/8 as 3+3.",
    [
      check(2, 2),
      q(
        "6/8 is usually felt as…",
        "Two dotted-quarter beats",
        ["Six equally strong quarter beats", "Three half-note beats"],
        "Six eighth notes form two groups of three, each group a dotted quarter.",
      ),
    ],
  ),
  unit(
    2,
    "dots",
    2,
    "Calculate dotted durations and keep the pulse during silence.",
    "Count 1-and-2-and. Sustain on 1 through '2', then make a short sound on the last 'and': dotted quarter plus eighth. Repeat, replacing the last sound with silence. A rest has duration even though you make no sound.",
    [
      check(2, 1),
      q(
        "A dotted quarter plus an eighth totals how many quarter-note beats?",
        "Two",
        ["One", "Three"],
        "1½ plus ½ is 2. Keep counting during any rest.",
      ),
    ],
  ),
  unit(
    2,
    "syncopation",
    {
      heading: "Rests, ties and syncopation",
      body: "Rests reserve silence for a written duration; keep the beat moving underneath. A tie joins two notes of the same pitch into one held sound, so you do not attack the second note. Syncopation shifts emphasis away from expected strong beats, often by starting on an offbeat and holding across the next beat. A tie changes duration, not pitch; a slur groups different notes into a smooth phrase.",
    },
    "Keep time through rests and an offbeat entry.",
    "Count 1-and-2-and-3-and-4-and. Say 'da' only on the 'and' after 2 and hold it across 3. Tap the numbered beats quietly. If that feels busy, do the counting first and add the sound on a second pass.",
    [
      q(
        "Two quarter notes of the same pitch are tied. How many attacks?",
        "One",
        ["Two", "Four"],
        "A tie sustains one sound for the combined duration.",
      ),
      q(
        "During a rest, the underlying beat…",
        "Continues",
        ["Stops", "Must get slower"],
        "Silence occupies time; it does not pause the meter.",
      ),
    ],
  ),

  unit(
    3,
    "major",
    0,
    "Build a major scale from whole and half steps.",
    "Write C D E F G A B C. Mark the close neighbours E–F and B–C. Then start on G: G A B C D E F# G. F# preserves the same step pattern.",
    [
      check(3, 2),
      q(
        "Where are the half steps in a major scale?",
        "3–4 and 7–8",
        ["1–2 and 5–6", "Every adjacent pair"],
        "The pattern W W H W W W H puts half steps after degrees 3 and 7.",
      ),
    ],
  ),
  unit(
    3,
    "signatures",
    1,
    "Use a key signature without guessing the tonic.",
    "Write F#, then C#: these are the first two sharps. A semitone above the last one gives D major. Its relative minor, B minor, uses the same signature, so listen for the home note before deciding the key.",
    [check(3, 0), check(3, 1)],
  ),
  unit(
    3,
    "circle",
    2,
    "Find neighbouring major keys on the circle.",
    "Write F — C — G — D. Moving right adds a sharp; moving left adds a flat. Choose C, then name its two neighbours. The circle describes key relationships, not which pitch comes next in a melody.",
    [
      q(
        "Which major keys sit beside C on the circle?",
        "F and G",
        ["B and D", "E and A"],
        "F has one flat, G one sharp; both differ from C by one signature note.",
      ),
      q(
        "Moving clockwise from G gives…",
        "D major",
        ["F major", "C minor"],
        "A fifth above G is D, the next major key in the sharp direction.",
      ),
    ],
  ),
  unit(
    3,
    "minor",
    {
      heading: "Three forms of minor",
      body: "A natural minor is A B C D E F G A: it shares C major's notes but makes A home. This is relative minor. Parallel minor keeps the tonic instead: C major and C minor. Harmonic minor raises natural minor's seventh (G# in A minor) to pull toward the tonic. Classical melodic minor raises the sixth and seventh ascending (F#, G#), usually returning to natural minor descending. In jazz, melodic minor commonly keeps the raised notes in both directions.",
      example: {
        label: "A harmonic minor: hear G# lead to A",
        notes: [57, 59, 60, 62, 64, 65, 68, 69],
        mode: "sequence",
      },
    },
    "Distinguish relative minor, parallel minor and the raised leading tone.",
    "Write A B C D E F G A. Circle G and raise it to G# for harmonic minor. Hum or imagine the final G#–A half step. Say why C major is relative to A minor, while A major is parallel.",
    [
      q(
        "What changes from A natural minor to A harmonic minor?",
        "G becomes G#",
        ["C becomes C#", "Every note is raised"],
        "Raise degree 7 to create the leading tone.",
      ),
      q(
        "Which is the parallel minor of C major?",
        "C minor",
        ["A minor", "E minor"],
        "Parallel keys share a tonic. Relative keys share a key signature.",
      ),
    ],
  ),

  unit(
    4,
    "intervals",
    0,
    "Name an interval using letters and semitones.",
    "Count C–D–E as three letters, including both ends. C–E is a third with four semitones; C–Eb is still a third but has three. C–D# sounds like C–Eb on a piano but is spelled as an augmented second.",
    [
      check(4, 0),
      q(
        "C to Eb is a…",
        "Minor third",
        ["Major third", "Perfect fourth"],
        "C–D–E spans three letters; three semitones makes the third minor.",
      ),
    ],
  ),
  unit(
    4,
    "tension",
    1,
    "Describe tension as a musical relationship.",
    "Replay the two sounds and describe what you notice. Try saying 'stable' and 'needs motion', but your reaction can differ. Consonance depends on style and context: a fourth above the bass is treated as dissonant in traditional two-part counterpoint.",
    [
      check(4, 2),
      q(
        "Is dissonance always a mistake?",
        "No, it can create useful tension",
        ["Yes, in every style", "Only loud notes are dissonant"],
        "Composers choose tension and release. Rules depend on the style being studied.",
      ),
    ],
  ),
  unit(
    4,
    "triads",
    2,
    "Build the four triad qualities.",
    "Write C E G. Lower E to Eb for minor; lower G as well for diminished (C Eb Gb). Return to C E G and raise G to G# for augmented. Only the changed note needs your attention each time.",
    [
      check(4, 1),
      q(
        "Which notes spell C diminished?",
        "C Eb Gb",
        ["C E G", "C E G#"],
        "Two minor thirds give C–Eb–Gb: 0, 3, 6 semitones above C.",
      ),
    ],
  ),
  unit(
    4,
    "inversions",
    {
      heading: "Chord inversions and slash symbols",
      body: "The root names the chord; the bass is the lowest sounding note. They need not match. C major is C E G in any order. With C lowest it is root position; with E lowest, first inversion; with G lowest, second inversion. C/E means a C chord with E in the bass, not an E chord. In classical analysis the triad figures are 5/3 (often omitted), 6 or 6/3, and 6/4. Choose inversions to give the bass a smoother line.",
      example: {
        label: "C major: root position, first, second inversion",
        notes: [
          [60, 64, 67],
          [52, 55, 60],
          [55, 60, 64],
        ],
        mode: "progression",
      },
    },
    "Name a chord independently of its lowest note.",
    "Write C E G, then E G C, then G C E, with each list ordered low to high. Circle the bass in each. All remain C major. Try describing the change without saying that the root moved.",
    [
      q(
        "C/E is which inversion of C major?",
        "First inversion",
        ["Root position", "Second inversion"],
        "E is the chord's third and sits in the bass.",
      ),
      q(
        "Which fact determines a chord's inversion?",
        "Which chord member is in the bass",
        ["Which note is loudest", "Which note is written first in its name"],
        "Bass position determines inversion; the chord root keeps its identity.",
      ),
    ],
  ),

  unit(
    5,
    "function",
    0,
    "Translate chord names into jobs within a key.",
    "Write C — F — G — C, then label I — IV — V — I. Move the same jobs to G major: G — C — D — G. Roman numerals let you recognise a progression even when its pitch level changes.",
    [
      check(5, 0),
      q(
        "In G major, which chord is V?",
        "D major",
        ["G major", "C major"],
        "Count G A B C D: D is degree 5; the diatonic V chord is D F# A.",
      ),
    ],
  ),
  unit(
    5,
    "cadences",
    1,
    "Recognise authentic and plagal phrase endings.",
    "Hear G–C, then imagine F–C. Both can end a phrase, with a different pull. For a perfect authentic cadence in C, put G then C in the bass and finish with C in the top voice.",
    [
      check(5, 1),
      q(
        "For a perfect authentic cadence, V and I must be…",
        "In root position, with tonic on top of I",
        ["Both minor", "Any inversions with any top note"],
        "The specific PAC label requires root-position V–I and scale degree 1 in the soprano at the end.",
      ),
    ],
  ),
  unit(
    5,
    "open-endings",
    2,
    "Hear an unfinished phrase and an unexpected ending.",
    "Listen to G–Am in C major. Sing or imagine the C chord you expected. Now stop a phrase on G: that is a half cadence. 'Half' describes the open ending, not a chord played at half volume.",
    [
      check(5, 2),
      q(
        "A phrase in C major ends on G major. Its cadence is…",
        "Half",
        ["Plagal", "Perfect authentic"],
        "A phrase ending on V is a half cadence.",
      ),
    ],
  ),
  unit(
    5,
    "melody",
    {
      heading: "Turn a progression into a phrase",
      body: "A melody can target chord tones on important beats and connect them with other scale notes. Over C–Am–F–G, try E–E–F–D: each note belongs to the chord underneath it. A motif is a small recognisable idea; repeating or varying its rhythm helps a phrase feel connected. To create a response, repeat your opening rhythm and change the final note. Chord tones are useful anchors, not the only allowed notes.",
      example: {
        label: "C–Am–F–G: a progression to sing over",
        notes: [
          [48, 60, 64, 67],
          [45, 57, 60, 64],
          [41, 53, 57, 60],
          [43, 55, 59, 62],
        ],
        mode: "progression",
      },
    },
    "Make a tiny melody from harmony you understand.",
    "Hum or write E E F D over C Am F G, one note per chord. Add a final C chord and finish on C. Keep this five-note sketch: later you can compare a borrowed chord or change its meter.",
    [
      q("Which is a chord tone of A minor?", "E", ["F#", "Bb"], "A minor contains A C E."),
      q(
        "What is a motif?",
        "A small recognisable musical idea",
        ["A required key change", "A volume marking"],
        "A motif can be melodic, rhythmic, or both, and can return in varied forms.",
      ),
    ],
  ),

  unit(
    6,
    "voices",
    0,
    "Keep independent parts consonant in first species.",
    "Write bass notes C D E. Above them place E F G: three successive thirds. Trace each line separately, then consider the pairs. First species uses one note against each note of a slower given line, the cantus firmus.",
    [
      check(6, 0),
      q(
        "First species means…",
        "One note against each cantus note",
        ["Four chords on every beat", "Any rhythm without restrictions"],
        "The first species simplifies rhythm so you can focus on vertical intervals and melodic motion.",
      ),
    ],
  ),
  unit(
    6,
    "parallels",
    1,
    "Spot moving parallel perfect intervals.",
    "Compare C–G followed by D–A: both parts rise and both intervals are fifths. Change the second upper note to F. You now move from a fifth to a third, avoiding that parallel fifth.",
    [
      q(
        "C–G moves to D–A with both voices rising. This is…",
        "Parallel fifths",
        ["Contrary motion", "A repeated stationary chord"],
        "Both pairs are perfect fifths and both voices move up.",
      ),
      q(
        "Why avoid parallel fifths in traditional part-writing?",
        "To preserve the independence of the voices",
        ["Because fifths are always out of tune", "Because all ascending melodies are wrong"],
        "It is a style-specific voice-leading principle, not a rule against fifths in every musical style.",
      ),
    ],
  ),
  unit(
    6,
    "motion",
    {
      heading: "Motion and four-part writing",
      body: "Contrary motion means two voices travel in opposite directions. Oblique motion means one stays while the other moves. Similar motion means both move the same way; parallel motion also preserves interval size. SATB names soprano, alto, tenor and bass. In traditional chorale writing, keep each part in a comfortable range, retain useful common tones, and move the inner voices smoothly. Check each pair for unwanted parallels. These constraints describe a style; the game's duel practises only two voices.",
      example: {
        label: "Contrary motion: C–G to D–F",
        notes: [
          [60, 67],
          [62, 65],
        ],
        mode: "progression",
      },
    },
    "Recognise voice motion before attempting a full score.",
    "Draw two arrows: bass C rises to D while upper G falls to F. Label this contrary motion. For an SATB sketch, list each part on a separate line before looking at the complete chord.",
    [
      q(
        "One voice stays on C while another moves E to F. This is…",
        "Oblique motion",
        ["Parallel motion", "Contrary motion"],
        "One part holds; the other moves.",
      ),
      q(
        "What does the A in SATB mean?",
        "Alto",
        ["Accent", "Augmented"],
        "SATB stands for soprano, alto, tenor and bass.",
      ),
    ],
  ),
  unit(
    6,
    "decoration",
    {
      heading: "Passing notes, neighbours and suspensions",
      body: "A passing note connects two chord tones by step, usually in the same direction: C–D–E over C major uses D as a passing note. A neighbour leaves a chord tone by step and returns: E–F–E. A suspension holds a prepared note while the harmony changes, creating tension that usually resolves down by step. Label a non-chord tone by its preparation, beat position and resolution, not just by its pitch name.",
    },
    "Explain how a melody uses notes outside its chord.",
    "Over a held C chord, sing or write E F E, then C D E. Circle F in the first and D in the second. Call F a neighbour and D a passing note. Both use stepwise movement for different jobs.",
    [
      q(
        "E–F–E over a C chord uses F as a…",
        "Neighbour note",
        ["Passing note", "New tonic"],
        "It leaves E by step and returns to E.",
      ),
      q(
        "What happens first in a prepared suspension?",
        "A consonant note is held into a changed harmony",
        ["An unprepared leap into any dissonance", "The music stops completely"],
        "Preparation comes before the held dissonance and its resolution.",
      ),
    ],
  ),

  unit(
    7,
    "related",
    0,
    "Find a nearby key and its relationship to home.",
    "Write C major in the centre of a page. Place G and F beside it, A minor underneath, then E minor under G and D minor under F. Compare each key signature with C's.",
    [
      check(7, 0),
      q(
        "How many pitch classes do C major and A natural minor share?",
        "All seven",
        ["Only one", "Six"],
        "Relative major and natural minor share a collection but have different tonics.",
      ),
    ],
  ),
  unit(
    7,
    "pivot",
    1,
    "Give one chord a job in two keys.",
    "Label C–Am–D–G. Under Am write vi in C, then ii in G. D major contains F#, which helps establish G. There is one Am pivot chord, not a second extra chord when its numeral changes.",
    [check(7, 1), check(7, 2)],
  ),
  unit(
    7,
    "tonicization",
    {
      heading: "A visit or a new home?",
      body: "Tonicization briefly makes a chord sound like a local tonic. Modulation establishes a new key over a passage. One unusual chord is not enough evidence by itself: listen for a cadence and continued emphasis in the destination key. C–Am–D7–G can lead into G major; D7–G followed immediately by a strong return to C may instead be a brief tonicization. Context decides the analysis.",
      example: {
        label: "C–Am–D7–G–G",
        notes: [
          [60, 64, 67],
          [57, 60, 64],
          [50, 54, 57, 60],
          [55, 59, 62],
          [55, 59, 62],
        ],
        mode: "progression",
      },
    },
    "Use musical context to decide whether the key has changed.",
    "Imagine two endings after D7–G: stay on G and continue a phrase there, or return immediately to C. Write 'new home' by the first and 'brief visit' by the second. Listen beyond the chromatic chord.",
    [
      q(
        "Which is stronger evidence for modulation?",
        "A cadence and sustained emphasis in the new key",
        ["Any single sharp", "A louder chord"],
        "An established tonic over a passage is more convincing than one altered note.",
      ),
      q(
        "A short emphasis on a chord without establishing a new key is…",
        "Tonicization",
        ["Syncopation", "Inversion"],
        "Tonicization is a local tonic effect within the larger key.",
      ),
    ],
  ),
  unit(
    7,
    "secondary",
    {
      heading: "Secondary dominants",
      body: "A secondary dominant temporarily aims at a chord other than the main tonic. V/V means 'five of five'. In C, V is G; G's dominant is D major or D7, so D7 is V7/V. Its F# pulls upward to G, while the seventh C tends downward to B. Follow the slash right to left: first find the target, then its dominant. A secondary dominant need not cause a full modulation.",
      example: {
        label: "D7–G–C: V7/V–V–I",
        notes: [
          [50, 54, 57, 60],
          [55, 59, 62],
          [48, 60, 64, 67],
        ],
        mode: "progression",
      },
    },
    "Explain a chromatic chord by where it leads.",
    "In C major, circle G as the target. Count G A B C D: D is its fifth. Add F# and A to make D major, or also C for D7. Label the result V/V or V7/V.",
    [
      q(
        "In C major, V/V is…",
        "D major",
        ["C major", "F minor"],
        "The target V is G; the dominant of G is D.",
      ),
      q(
        "Why does D7 contain F# when used in C major?",
        "F# is the leading tone of its target G",
        ["Every seventh chord needs F#", "C major's signature includes F#"],
        "The altered third of D7 points a half step upward to G.",
      ),
    ],
  ),

  unit(
    8,
    "sevenths",
    {
      heading: "Seventh chords and extensions",
      body: "A seventh chord stacks one more third above a triad. On C, Cmaj7 is C E G B (0,4,7,11 semitones); C7 is C E G Bb (0,4,7,10); Cm7 is C Eb G Bb (0,3,7,10); Cm7b5 is C Eb Gb Bb (0,3,6,10). The symbol '7' alone means a major triad plus a minor seventh, not a major seventh. Ninths, elevenths and thirteenths extend the stack; voicings often omit some members. In tonal V7–I, the chordal seventh normally resolves down by step.",
      example: {
        label: "Cmaj7, C7, Cm7, Cm7b5",
        notes: [
          [60, 64, 67, 71],
          [60, 64, 67, 70],
          [60, 63, 67, 70],
          [60, 63, 66, 70],
        ],
        mode: "progression",
      },
    },
    "Read common seventh-chord symbols accurately.",
    "Write C E G B. Lower B to Bb: Cmaj7 becomes C7. Lower E to Eb too: Cm7. Lower G to Gb: Cm7b5. Compare just one changing note at a time.",
    [
      check(8, 0),
      q(
        "Which notes spell Cmaj7?",
        "C E G B",
        ["C E G Bb", "C Eb G Bb"],
        "The maj7 symbol specifies a major seventh, B, above C.",
      ),
    ],
  ),
  unit(
    8,
    "borrowed",
    {
      heading: "Borrowed chords and chromatic colour",
      body: "Modal mixture borrows from the parallel key: C major can borrow iv, F minor (F Ab C), from C minor. The tonic stays C; borrowing does not automatically mean modulation. The Neapolitan is a major triad on the flattened second degree: Db F Ab in C, often in first inversion with F in the bass and used before V. Name the altered notes and their destination before trying to label a whole passage.",
      example: {
        label: "C–Fm–C: hear the borrowed Ab",
        notes: [
          [60, 64, 67],
          [53, 56, 60],
          [52, 55, 60],
        ],
        mode: "progression",
      },
    },
    "Use a borrowed chord while keeping the same tonic.",
    "Return to your C–Am–F–G phrase. Replace F major with F minor by lowering A to Ab. Keep everything else the same and compare. Describe the effect in your own words rather than choosing a required emotion.",
    [
      check(8, 1),
      q(
        "F minor used as iv in C major is borrowed from…",
        "C minor",
        ["A minor", "G major"],
        "Modal mixture borrows from the parallel minor, which shares tonic C.",
      ),
    ],
  ),
  unit(
    8,
    "odd-meter",
    2,
    "Group an uneven meter into manageable pulses.",
    "Count 1 2 3, 1 2 for 5/4. Then try 1 2, 1 2 3. Keep quarter notes equally spaced; only accents change. For 7/8, count 1 2, 1 2, 1 2 3 at a steady eighth-note rate.",
    [
      check(8, 2),
      q(
        "A 2+2+3 grouping of eighth notes fills…",
        "7/8",
        ["6/8", "5/4"],
        "There are seven eighth notes: two plus two plus three.",
      ),
    ],
  ),
  unit(
    8,
    "polyrhythm",
    {
      heading: "Three against two",
      body: "A 3:2 polyrhythm fits three evenly spaced attacks in one part against two in another, over the same time span. Use six small subdivisions as a shared grid: the three-part attacks on 1, 3, 5; the two-part attacks on 1, 4. Both restart together on the next 1. This differs from changing meter or merely alternating groups. Start slowly and learn each part separately before combining them.",
    },
    "Locate both parts of a 3:2 pattern on one grid.",
    "Write 1 2 3 4 5 6. Circle 1,3,5 for one hand; underline 1,4 for the other. Tap each alone, then combine only if comfortable. The grid is your reference; no speed target is required.",
    [
      q(
        "On a six-part grid, the two-part of 3:2 attacks on…",
        "1 and 4",
        ["1, 3 and 5", "Every subdivision"],
        "Two equally spaced attacks sit three subdivisions apart.",
      ),
      q(
        "In 3:2, the two parts…",
        "Fit the same overall time span",
        ["Use unrelated lengths of time", "Must use different key signatures"],
        "Three pulses and two pulses divide one shared span.",
      ),
    ],
  ),

  unit(
    9,
    "line",
    0,
    "Shape an independent melody with direction.",
    "Sketch C D E G F E D C. Circle the single highest note. G returns downward by step after the leap. Sing or imagine the line; then inspect its intervals against a cantus separately.",
    [check(9, 0), check(9, 2)],
  ),
  unit(
    9,
    "close",
    1,
    "Close a two-part line with contrary stepwise motion.",
    "Write D in the lower voice and B above it. Move the lower D down to C and upper B up to C: a major sixth expands to an octave. Both parts move by step in opposite directions.",
    [
      check(9, 1),
      q(
        "D–B moves to C–C, one octave apart. The motion is…",
        "Contrary",
        ["Parallel", "Oblique"],
        "The lower voice falls while the upper rises.",
      ),
    ],
  ),
  unit(
    9,
    "moving-species",
    {
      heading: "Second and third species",
      body: "Second species places two notes against each cantus note; third species normally places four. In a basic second-species exercise, the strong beat is consonant. A weak-beat dissonance can be a passing note approached and left by step in the same direction. Third species allows more melodic activity, with specific controlled dissonances. More notes do not remove the need for a singable line or careful vertical intervals. The duel remains a first-species exercise; these written tasks extend beyond it.",
    },
    "Control a passing dissonance instead of avoiding all tension.",
    "Over a held C, write upper E–F–G. E and G are consonant with C; F is a passing fourth above the bass. Put F on a weak subdivision, approach from E by step and leave to G by step.",
    [
      q(
        "Second species normally uses how many notes per cantus note?",
        "Two",
        ["One", "Four"],
        "First is 1:1, second is 2:1, third is usually 4:1.",
      ),
      q(
        "In basic second species, a dissonant weak-beat passing note should…",
        "Be approached and left by step in the same direction",
        ["Leap in and hold indefinitely", "Replace every strong-beat consonance"],
        "Stepwise passing motion connects consonances while controlling the dissonance.",
      ),
    ],
  ),
  unit(
    9,
    "suspensions",
    {
      heading: "Fourth and fifth species",
      body: "Fourth species focuses on syncopation and prepared suspensions. For a 4–3 suspension, prepare an upper note as a consonance, hold it as the bass changes so it becomes a fourth, then resolve down by step to a third. The numbers describe intervals above the bass. Fifth species, or florid counterpoint, combines the earlier rhythmic types. It still controls dissonance through preparation and resolution; it is not a free-for-all.",
      example: {
        label: "Preparation, 4th, resolution to 3rd",
        notes: [
          [53, 60],
          [55, 60],
          [55, 59],
        ],
        mode: "progression",
      },
    },
    "Explain preparation, suspension and resolution.",
    "Write bass F–G–G, upper C–C–B. Tie the first two upper Cs on paper. C starts as a fifth above F, is held as a fourth above G, then resolves to B, a third. Playback rearticulates the held note to expose the intervals; your written tie sustains it.",
    [
      q(
        "In a 4–3 suspension, the upper voice normally resolves…",
        "Down by step",
        ["Up an octave", "By repeating forever"],
        "The fourth above the bass resolves downward to a consonant third.",
      ),
      q(
        "Fifth species combines…",
        "Rhythmic types from earlier species",
        ["Five simultaneous keys", "Only repeated whole notes"],
        "Florid counterpoint mixes earlier techniques while preserving voice-leading control.",
      ),
    ],
  ),

  unit(
    10,
    "fugue",
    0,
    "Track a subject, an answer and a countersubject.",
    "Use C D E C as a tiny subject. Transpose every note up seven semitones: G A B G. This is a real answer. Write the subject's rhythm beside both versions so you can recognise it when a new voice enters.",
    [
      check(10, 0),
      q(
        "A real answer preserves…",
        "The subject's interval pattern exactly",
        ["Only the volume", "Only its first note"],
        "Exact transposition gives a real answer; a tonal answer adjusts intervals for the key relationship.",
      ),
    ],
  ),
  unit(
    10,
    "development",
    {
      heading: "Develop a subject and hear form",
      body: "After the opening entries of a fugue, episodes often develop fragments and move between keys. Stretto overlaps subject entries: a new one begins before the previous one finishes. Melodic inversion reverses interval direction; augmentation lengthens note values; diminution shortens them. Outside fugue, label returning sections to hear form: ABA returns to its opening after contrast; verse–chorus songs organise returns differently. Analyse audible recurrence before choosing a formal label.",
    },
    "Recognise a musical idea after transformation.",
    "Write C D E C. Reverse the directions of its exact intervals around C to get C Bb Ab C. That is melodic inversion, unlike a chord inversion which changes the bass. Then double every duration for augmentation.",
    [
      q(
        "A new subject entry starts before the previous one finishes. This is…",
        "Stretto",
        ["A rest", "A key signature"],
        "Stretto overlaps entries of the subject.",
      ),
      q(
        "Doubling every note duration is…",
        "Augmentation",
        ["Diminution", "Chord inversion"],
        "Augmentation stretches durations while retaining the recognisable idea.",
      ),
    ],
  ),
  unit(
    10,
    "modes",
    {
      heading: "Modes and a deliberate tonic",
      body: "A mode is a scale pattern with a tonal centre, not just a major scale started at another point. D Dorian is D E F G A B C D: compared with D natural minor, its sixth is raised (B, not Bb). G Mixolydian is G A B C D E F G: compared with G major, its seventh is lowered. Both share C major's white notes, but phrases and bass emphasis establish a different home. A static bass or repeated tonic can make that centre audible.",
      example: {
        label: "D Dorian, returning to D",
        notes: [62, 64, 65, 67, 69, 71, 72, 74, 69, 65, 62],
        mode: "sequence",
      },
    },
    "Hear a mode as a scale with its own home note.",
    "Write a four-note phrase ending on D, using F and B somewhere in it. Imagine a D bass underneath. F gives the minor third; B supplies Dorian's characteristic raised sixth. Compare with Bb if you want natural minor.",
    [
      q(
        "Compared with natural minor, Dorian has a…",
        "Raised sixth",
        ["Lowered tonic", "Raised third"],
        "D Dorian has B natural instead of D natural minor's Bb.",
      ),
      q(
        "Compared with major, Mixolydian has a…",
        "Lowered seventh",
        ["Raised seventh", "Lowered fifth"],
        "G Mixolydian contains F natural instead of G major's F#.",
      ),
    ],
  ),
  unit(
    10,
    "post-tonal",
    1,
    "Transform a pitch-class pattern and make a short study.",
    "Use C=0, C#=1, through B=11. Take [0,1,4]. Transpose it up two semitones: [2,3,6]. Reverse its order for retrograde: [4,1,0]. Make a four-bar sketch that repeats this three-note idea with one change; describe the pattern you used. This is a composition prompt, not an automatically assessed score.",
    [
      check(10, 1),
      q(
        "Transposing pitch classes [0,1,4] up 2 gives…",
        "[2,3,6]",
        ["[0,2,8]", "[4,1,0]"],
        "Add 2 to each value, reducing modulo 12 when needed. Reversing order instead is retrograde.",
      ),
    ],
  ),
];

export function unitsForLevel(level: number): CourseUnit[] {
  return COURSE_UNITS.filter((u) => u.level === level);
}

export function unitById(id: string | null | undefined): CourseUnit | undefined {
  return COURSE_UNITS.find((u) => u.id === id);
}
