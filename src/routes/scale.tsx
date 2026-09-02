import { createFileRoute } from "@tanstack/react-router";
import { QuizScreen } from "@/components/game/quiz-screen";
import { playMidiSequence } from "@/lib/game/audio";
import { scaleExercise } from "@/lib/game/exercises";

export const Route = createFileRoute("/scale")({
  component: ScaleRoute,
});

function ScaleRoute() {
  return (
    <QuizScreen
      title="Scales"
      topicId="scales"
      make={scaleExercise}
      play={(ex) => playMidiSequence(ex.notes, 0.18, 0.28)}
    />
  );
}
