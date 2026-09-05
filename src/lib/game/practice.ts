import { shuffle } from "./music.ts";
import { buildSessionQueue, scheduleItem, type SRItem, type SRResponse } from "./sr.ts";

export type PracticeNote = { midi: number };

/** Landmark notes from the Level 1 lesson: Bass F, Middle C, Treble G. */
export const LANDMARKS = { bassF: 53, middleC: 60, trebleG: 67 } as const;

/**
 * Which notes a grade reads. Level 0 is the C–E–G the sensory level uses;
 * Level 1 adds the rest of the treble octave plus Bass F as a landmark;
 * Level 3 adds the bass-clef notes just below middle C; later grades add
 * the full chromatic octave above.
 */
export function buildNotePool(gradeLevel: number): PracticeNote[] {
  if (gradeLevel === 0) return [{ midi: 60 }, { midi: 64 }, { midi: 67 }];
  if (gradeLevel <= 2) {
    return [LANDMARKS.bassF, 60, 62, 64, 65, 67, 69, 71].map((midi) => ({ midi }));
  }
  if (gradeLevel <= 4) {
    return [53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72].map((midi) => ({ midi }));
  }
  return [53, 55, 57, 59, ...Array.from({ length: 13 }, (_, i) => 60 + i)].map((midi) => ({
    midi,
  }));
}

export class PracticeQuestionEngine {
  notePool: PracticeNote[] = [];
  targetNote: PracticeNote | null = null;
  answerOptions: PracticeNote[] = [];
  questionHadError = false;
  private srQueue: SRItem[] = [];
  private srQueueIndex = 0;
  private questionIndex = -1;
  private noteHistory = new Map<number, boolean[]>();

  get isQueueExhausted() {
    return this.srQueueIndex >= this.srQueue.length;
  }

  rebuildQueue(itemsForPool: SRItem[], allSelected = false) {
    this.srQueue = allSelected ? shuffle(itemsForPool) : buildSessionQueue(itemsForPool);
    this.srQueueIndex = 0;
    this.questionIndex = -1;
    this.targetNote = null;
  }

  generateQuestion(): boolean {
    if (this.notePool.length === 0 || this.isQueueExhausted) return false;
    // Retrying the same note keeps its error history and answer positions.
    if (this.questionIndex === this.srQueueIndex) return true;
    this.questionIndex = this.srQueueIndex;
    this.questionHadError = false;

    const srItem = this.srQueue[this.srQueueIndex]!;
    const targetMidi = Number.parseInt(srItem.id.replace("note_", ""), 10);
    this.targetNote = this.notePool.find((n) => n.midi === targetMidi) ?? this.notePool[0]!;

    // Prefer distractors near the target so the drill trains reading, not guessing.
    const others = this.notePool.filter((n) => n.midi !== this.targetNote!.midi);
    const near = shuffle(others.filter((n) => Math.abs(n.midi - this.targetNote!.midi) <= 7));
    const far = shuffle(others.filter((n) => Math.abs(n.midi - this.targetNote!.midi) > 7));
    const distractors = [...near, ...far].slice(0, 3);

    this.answerOptions = shuffle([this.targetNote, ...distractors]);
    return true;
  }

  recordAnswer(selected: PracticeNote): {
    isCorrect: boolean;
    firstAttempt: boolean;
    updatedSRItem: SRItem | null;
    weakNotesMidi: number[];
  } {
    const target = this.targetNote;
    if (!target || this.questionIndex !== this.srQueueIndex || this.isQueueExhausted) {
      return {
        isCorrect: false,
        firstAttempt: false,
        updatedSRItem: null,
        weakNotesMidi: this.computeWeakNotes(),
      };
    }
    const isCorrect = target != null && selected.midi === target.midi;
    const firstAttempt = !this.questionHadError;

    if (target && firstAttempt) {
      const hist = this.noteHistory.get(target.midi) ?? [];
      hist.push(isCorrect);
      this.noteHistory.set(target.midi, hist);
    }

    let updatedSRItem: SRItem | null = null;
    if (this.srQueue.length && this.srQueueIndex < this.srQueue.length) {
      const current = this.srQueue[this.srQueueIndex]!;
      const response: SRResponse = isCorrect ? (this.questionHadError ? "hard" : "good") : "again";
      updatedSRItem = !firstAttempt && !isCorrect ? current : scheduleItem(current, response);
      // A correction must build on the failed attempt, not the original schedule.
      this.srQueue[this.srQueueIndex] = updatedSRItem;
      if (isCorrect) this.srQueueIndex += 1;
    }
    if (!isCorrect) this.questionHadError = true;

    return { isCorrect, firstAttempt, updatedSRItem, weakNotesMidi: this.computeWeakNotes() };
  }

  private computeWeakNotes(): number[] {
    const weak: number[] = [];
    for (const [midi, hist] of this.noteHistory) {
      if (hist.length >= 3) {
        const missRate = hist.filter((b) => !b).length / hist.length;
        if (missRate > 0.5) weak.push(midi);
      }
    }
    return weak;
  }
}
