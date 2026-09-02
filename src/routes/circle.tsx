import { createFileRoute } from "@tanstack/react-router";
import { CircleScreen } from "@/components/game/circle-screen";

export const Route = createFileRoute("/circle")({
  component: CircleScreen,
});
