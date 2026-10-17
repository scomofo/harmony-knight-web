import { createFileRoute } from "@tanstack/react-router";
import { MixedScreen } from "@/components/game/mixed-screen";

export const Route = createFileRoute("/mixed")({
  component: MixedRoute,
});

function MixedRoute() {
  return <MixedScreen />;
}
