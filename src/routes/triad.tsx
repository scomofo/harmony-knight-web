import { createFileRoute } from "@tanstack/react-router";
import { QuizScreen } from "@/components/game/quiz-screen";
import { triadExercise } from "@/lib/game/exercises";
import { useGameStore } from "@/lib/game/store";

export const Route = createFileRoute("/triad")({
  component: TriadRoute,
});

function TriadRoute() {
  const grade = useGameStore((s) => s.gradeLevel);
  return (
    <QuizScreen
      title="Triads"
      topicId="triads"
      make={() => triadExercise(grade)}
      intro={
        grade <= 4
          ? "Major or minor. The third decides: bright or dark."
          : "Four qualities. Listen for the fifth — squeezed is diminished, stretched is augmented."
      }
      lessonLevel={4}
    />
  );
}
