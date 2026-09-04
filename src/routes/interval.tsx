import { createFileRoute } from "@tanstack/react-router";
import { QuizScreen } from "@/components/game/quiz-screen";
import { intervalExerciseForGrade } from "@/lib/game/exercises";
import { useGameStore } from "@/lib/game/store";

export const Route = createFileRoute("/interval")({
  component: IntervalRoute,
});

function IntervalRoute() {
  const grade = useGameStore((s) => s.gradeLevel);
  return (
    <QuizScreen
      title="Intervals"
      topicId="intervals"
      make={() => intervalExerciseForGrade(grade)}
      intro={
        grade <= 4
          ? "Five intervals to start: 2nd, 3rd, 4th, 5th, octave. Hear two notes, name the distance."
          : grade <= 6
            ? "Rising and falling. Minor and major thirds join the set."
            : "Rising, falling, and sounded together. Every interval to the octave."
      }
      lessonLevel={4}
    />
  );
}
