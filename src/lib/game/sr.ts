export type SRResponse = "again" | "hard" | "good" | "easy";

export type SRItem = {
  id: string;
  topic: string;
  gradeLevel: number;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string;
  lastReviewedAt: string | null;
};

export function newSRItem(id: string, topic: string, gradeLevel: number): SRItem {
  return {
    id,
    topic,
    gradeLevel,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    nextReviewAt: new Date().toISOString(),
    lastReviewedAt: null,
  };
}

export function scheduleItem(item: SRItem, response: SRResponse, now = new Date()): SRItem {
  let easeFactor = item.easeFactor;
  let repetitions = item.repetitions;
  let intervalDays = item.intervalDays;

  switch (response) {
    case "again":
      repetitions = 0;
      intervalDays = 0;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      break;
    case "hard":
      repetitions = item.repetitions + 1;
      intervalDays = Math.max(1, Math.round(item.intervalDays * 1.2));
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      break;
    case "good":
      repetitions = item.repetitions + 1;
      if (item.repetitions === 0) intervalDays = 1;
      else if (item.repetitions === 1) intervalDays = 3;
      else intervalDays = Math.round(item.intervalDays * easeFactor);
      break;
    case "easy":
      repetitions = item.repetitions + 1;
      if (item.repetitions === 0) intervalDays = 4;
      else intervalDays = Math.round(item.intervalDays * easeFactor * 1.3);
      easeFactor += 0.15;
      break;
  }

  const next =
    response === "again" ? now : new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    ...item,
    easeFactor,
    intervalDays,
    repetitions,
    nextReviewAt: next.toISOString(),
    lastReviewedAt: now.toISOString(),
  };
}

export function buildSessionQueue(
  allItems: SRItem[],
  opts: { maxNewItemsPerSession?: number; warmUpCount?: number; now?: Date } = {},
): SRItem[] {
  const maxNew = opts.maxNewItemsPerSession ?? 20;
  const warmUpCount = opts.warmUpCount ?? 3;
  const now = opts.now ?? new Date();

  const dueItems = allItems
    .filter((i) => i.repetitions > 0 && new Date(i.nextReviewAt) <= now)
    .sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt));

  const newItems = allItems.filter((i) => i.repetitions === 0).slice(0, maxNew);

  const queue: SRItem[] = [];
  const warmUps = dueItems.slice(0, warmUpCount);
  queue.push(...warmUps);
  const remaining = dueItems.slice(warmUpCount);

  let reviewIdx = 0;
  let newIdx = 0;
  while (reviewIdx < remaining.length || newIdx < newItems.length) {
    for (let i = 0; i < 3 && reviewIdx < remaining.length; i++) {
      queue.push(remaining[reviewIdx++]!);
    }
    if (newIdx < newItems.length) queue.push(newItems[newIdx++]!);
  }

  if (queue.length === 0) {
    return [...allItems].sort(() => Math.random() - 0.5);
  }
  return queue;
}
