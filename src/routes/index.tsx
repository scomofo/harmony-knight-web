import { createFileRoute } from "@tanstack/react-router";
import { HomeScreen } from "@/components/game/home-screen";
import { OnboardingScreen } from "@/components/game/onboarding-screen";
import { useGameStore } from "@/lib/game/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const done = useGameStore((s) => s.onboardingDone);
  if (!done) return <OnboardingScreen />;
  return <HomeScreen />;
}
