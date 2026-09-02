import { createFileRoute } from "@tanstack/react-router";
import { RealtimeScreen } from "@/components/game/realtime-screen";

export const Route = createFileRoute("/realtime")({
  component: RealtimeScreen,
});
