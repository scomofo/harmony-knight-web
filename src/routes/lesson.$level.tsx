import { createFileRoute } from "@tanstack/react-router";
import { LessonScreen } from "@/components/game/lesson-screen";

export const Route = createFileRoute("/lesson/$level")({
  component: LessonRoute,
});

function LessonRoute() {
  const { level } = Route.useParams();
  const parsed = Number.parseInt(level, 10);
  return <LessonScreen level={Number.isFinite(parsed) ? parsed : 0} />;
}
