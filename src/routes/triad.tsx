import { createFileRoute } from "@tanstack/react-router";
import { QuizScreen } from "@/components/game/quiz-screen";
import { triadExercise } from "@/lib/game/exercises";

export const Route = createFileRoute("/triad")({
  component: TriadRoute,
});

function TriadRoute() {
  return <QuizScreen title="Triads" topicId="triads" make={triadExercise} />;
}
