import { createFileRoute } from "@tanstack/react-router";
import { QuizScreen } from "@/components/game/quiz-screen";
import { scaleExercise } from "@/lib/game/exercises";
import { useGameStore } from "@/lib/game/store";

export const Route = createFileRoute("/scale")({
  component: ScaleRoute,
});

function ScaleRoute() {
  const grade = useGameStore((s) => s.gradeLevel);
  return (
    <QuizScreen
      title="Scales"
      topicId="scales"
      make={() => scaleExercise(grade)}
      intro="Every major scale is the same shape from a different start. Listen for the first note."
      lessonLevel={3}
    />
  );
}
