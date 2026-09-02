import { createFileRoute } from "@tanstack/react-router";
import { OnboardingScreen } from "@/components/game/onboarding-screen";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingScreen,
});
