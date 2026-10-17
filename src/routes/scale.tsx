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
      make={(rng) => scaleExercise(grade, rng)}
      seedKey="scales"
      intro="Every major scale is the same shape from a different start. The starting note is supplied; listen for the pattern."
      lessonLevel={3}
    />
  );
}
