import { createFileRoute } from "@tanstack/react-router";
import { QuizScreen } from "@/components/game/quiz-screen";
import { intervalExercise } from "@/lib/game/exercises";

export const Route = createFileRoute("/interval")({
  component: IntervalRoute,
});

function IntervalRoute() {
  return <QuizScreen title="Intervals" topicId="intervals" make={() => intervalExercise()} />;
}
