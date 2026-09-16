import { createFileRoute } from "@tanstack/react-router";
import { CreationScreen } from "@/components/game/creation-screen";

export const Route = createFileRoute("/create/$chapter")({ component: ChapterCreation });
function ChapterCreation() {
  const { chapter } = Route.useParams();
  return <CreationScreen chapter={/^\d+$/.test(chapter) ? Number(chapter) : -1} />;
}
