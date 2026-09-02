import { shuffle } from "./music";
import { buildSessionQueue, scheduleItem, type SRItem, type SRResponse } from "./sr";

export type PracticeNote = { midi: number };

export function buildNotePool(gradeLevel: number): PracticeNote[] {
  if (gradeLevel === 0) return [{ midi: 60 }, { midi: 64 }, { midi: 67 }];
  if (gradeLevel <= 2) {
    return [60, 62, 64, 65, 67, 69, 71].map((midi) => ({ midi }));
  }
  if (gradeLevel <= 4) {
    return [57, 59, 60, 62, 64, 65, 67, 69, 71, 72].map((midi) => ({ midi }));
  }
  return Array.from({ length: 13 }, (_, i) => ({ midi: 60 + i }));
}

export class PracticeQuestionEngine {
  notePool: PracticeNote[] = [];
  targetNote: PracticeNote | null = null;
  answerOptions: PracticeNote[] = [];
  questionHadError = false;
  private srQueue: SRItem[] = [];
  private srQueueIndex = 0;
  private noteHistory = new Map<number, boolean[]>();

  get isQueueExhausted() {
    return this.srQueueIndex >= this.srQueue.length;
  }

  rebuildQueue(itemsForPool: SRItem[]) {
    this.srQueue = buildSessionQueue(itemsForPool);
    this.srQueueIndex = 0;
  }

  generateQuestion(): boolean {
    this.questionHadError = false;
    if (this.notePool.length === 0 || this.srQueue.length === 0) return false;

    const srItem = this.srQueue[this.srQueueIndex]!;
    const targetMidi = Number.parseInt(srItem.id.replace("note_", ""), 10);
    this.targetNote =
      this.notePool.find((n) => n.midi === targetMidi) ?? this.notePool[0]!;

    const distractors = shuffle(
      this.notePool.filter((n) => n.midi !== this.targetNote!.midi),
    ).slice(0, 3);

    this.answerOptions = shuffle([this.targetNote, ...distractors]);
    return true;
  }

  recordAnswer(selected: PracticeNote): {
    isCorrect: boolean;
    updatedSRItem: SRItem | null;
    weakNotesMidi: number[];
  } {
    const target = this.targetNote;
    const isCorrect = target != null && selected.midi === target.midi;

    if (target) {
      const hist = this.noteHistory.get(target.midi) ?? [];
      hist.push(isCorrect);
      this.noteHistory.set(target.midi, hist);
    }

    let updatedSRItem: SRItem | null = null;
    if (this.srQueue.length && this.srQueueIndex < this.srQueue.length) {
      const current = this.srQueue[this.srQueueIndex]!;
      const response: SRResponse = isCorrect
        ? this.questionHadError
          ? "hard"
          : "good"
        : "again";
      updatedSRItem = scheduleItem(current, response);
      if (isCorrect) this.srQueueIndex += 1;
    }
    if (!isCorrect) this.questionHadError = true;

    return { isCorrect, updatedSRItem, weakNotesMidi: this.computeWeakNotes() };
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
