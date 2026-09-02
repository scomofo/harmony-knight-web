import { createFileRoute } from "@tanstack/react-router";
import { DuelScreen } from "@/components/game/duel-screen";

export const Route = createFileRoute("/duel")({
  component: DuelScreen,
});
