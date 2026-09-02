import { createFileRoute } from "@tanstack/react-router";
import { CurriculumScreen } from "@/components/game/curriculum-screen";

export const Route = createFileRoute("/curriculum")({
  component: CurriculumScreen,
});
