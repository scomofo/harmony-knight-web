import { createFileRoute } from "@tanstack/react-router";
import { RhythmScreen } from "@/components/game/rhythm-screen";

export const Route = createFileRoute("/rhythm")({
  component: RhythmScreen,
});
