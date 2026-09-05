import { createFileRoute } from "@tanstack/react-router";
import { QuizScreen } from "@/components/game/quiz-screen";
import { sensoryExercise } from "@/lib/game/exercises";

export const Route = createFileRoute("/sensory")({
  component: SensoryRoute,
});

function SensoryRoute() {
  return (
    <QuizScreen
      title="Listening"
      topicId="sensory"
      make={sensoryExercise}
      intro="Sound before sight. Higher or lower, loud or soft, which colour. Every tap answers with a tone."
      goal={10}
    />
  );
}
