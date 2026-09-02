import { createFileRoute } from "@tanstack/react-router";
import { PracticeScreen } from "@/components/game/practice-screen";

export const Route = createFileRoute("/practice")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: typeof search.mode === "string" ? search.mode : undefined,
  }),
  component: PracticeRoute,
});

function PracticeRoute() {
  const { mode } = Route.useSearch();
  return <PracticeScreen mode={mode} />;
}
