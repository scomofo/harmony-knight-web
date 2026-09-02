import { createFileRoute } from "@tanstack/react-router";
import { HeatmapScreen } from "@/components/game/heatmap-screen";

export const Route = createFileRoute("/heatmap")({
  component: HeatmapScreen,
});
