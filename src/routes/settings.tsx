import { createFileRoute } from "@tanstack/react-router";
import { SettingsScreen } from "@/components/game/settings-screen";

export const Route = createFileRoute("/settings")({
  component: SettingsScreen,
});
