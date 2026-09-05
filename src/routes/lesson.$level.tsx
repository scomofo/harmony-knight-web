import { createFileRoute } from "@tanstack/react-router";
import { LessonScreen } from "@/components/game/lesson-screen";

export const Route = createFileRoute("/lesson/$level")({
  validateSearch: (search: Record<string, unknown>): { unit?: string } => ({
    unit: typeof search.unit === "string" ? search.unit : undefined,
  }),
  component: LessonRoute,
});

function LessonRoute() {
  const { level } = Route.useParams();
  const { unit } = Route.useSearch();
  const parsed = Number(level);
  return <LessonScreen key={level} level={Number.isInteger(parsed) ? parsed : -1} unitId={unit} />;
}
