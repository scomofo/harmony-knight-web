import { createFileRoute } from "@tanstack/react-router";
import { QuizScreen } from "@/components/game/quiz-screen";
import { harmonyExercise } from "@/lib/game/exercises";
import { useGameStore } from "@/lib/game/store";

export const Route = createFileRoute("/cadence")({
  component: CadenceRoute,
});

function CadenceRoute() {
  const grade = useGameStore((s) => s.gradeLevel);
  return (
    <QuizScreen
      title="Cadences"
      topicId="harmony"
      make={() => harmonyExercise(grade)}
      intro="Every phrase starts from I so your ear has a home. Name the chord, or name how the phrase closes."
      lessonLevel={5}
    />
  );
}
