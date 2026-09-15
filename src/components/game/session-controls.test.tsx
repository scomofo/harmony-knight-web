import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useGameStore } from "@/lib/game/store";
import { BEAT_MS } from "@/lib/game/rhythm";
import * as exercises from "@/lib/game/exercises";
import { QuizScreen } from "./quiz-screen";
import { RhythmScreen } from "./rhythm-screen";
import { DuelScreen } from "./duel-screen";
import { RealtimeScreen } from "./realtime-screen";

const tick = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));

beforeEach(() => {
  vi.useFakeTimers();
  useGameStore.getState().resetProgress();
  vi.spyOn(exercises, "rhythmExercise").mockReturnValue({
    type: "rhythm",
    prompt: "Which rhythm?",
    notes: [60],
    correctAnswer: "Whole note",
    options: ["Whole note", "Two half notes"],
    metadata: { beats: [4], meter: "4/4" },
    playback: "silent",
    explain: "One long note fills the bar.",
  });
});

const quiz = () =>
  render(
    <QuizScreen
      title="Listening"
      topicId="sensory"
      goal={1}
      make={() => ({
        type: "pitch",
        prompt: "Which sound?",
        notes: [],
        playback: "silent",
        correctAnswer: "Higher",
        options: ["Higher", "Lower"],
        explain: "The second tone has a higher pitch.",
      })}
    />,
  );

describe("learner-controlled quiz feedback", () => {
  it("keeps corrections visible until Continue and cannot close a restarted session with an old timer", () => {
    quiz();
    click(/2Lower/);
    tick(60000);
    expect(screen.getByText("The second tone has a higher pitch.")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    click("End session");
    click("Train again");
    tick(60000);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: /1Higher/ }).hasAttribute("disabled")).toBe(false);
  });
  it("does not intercept Space on a focused button or accept answers while paused", () => {
    quiz();
    const button = screen.getByRole("button", { name: /1Higher/ });
    const key = new KeyboardEvent("keydown", { code: "Space", bubbles: true, cancelable: true });
    button.dispatchEvent(key);
    expect(key.defaultPrevented).toBe(false);
    click("Pause");
    fireEvent.keyDown(window, { code: "Digit1" });
    expect(useGameStore.getState().totalNotesPlayed).toBe(0);
    click("Resume");
    click(/1Higher/);
    click("Finish session");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
  it("excludes paused time while preserving time spent thinking before the pause", () => {
    quiz();
    tick(1000);
    click("Pause");
    tick(10000);
    click("Resume");
    tick(2000);
    click(/1Higher/);
    expect(useGameStore.getState().mastery.sensory!.totalResponseMs).toBe(3000);
  });
});

function perfectTap(label = "Tap it back") {
  click(label);
  tick(4 * BEAT_MS);
  fireEvent.pointerDown(screen.getByRole("button", { name: /Tap the pattern/ }));
  tick(5 * BEAT_MS);
}

describe("rhythm session accounting", () => {
  it("awards first-run credit once and reports only points actually saved", () => {
    useGameStore.setState({ gradeLevel: 2 });
    render(<RhythmScreen />);
    perfectTap();
    const first = useGameStore.getState();
    expect(first.totalNotesPlayed).toBe(1);
    perfectTap("Tap again");
    expect(useGameStore.getState().totalNotesPlayed).toBe(1);
    expect(useGameStore.getState().harmonyPoints).toBe(first.harmonyPoints);
    expect(useGameStore.getState().recentAtGrade).toEqual([true]);
    click("End");
    expect(within(screen.getByRole("dialog")).getByText(`+${first.harmonyPoints}`)).toBeTruthy();
  });
  it("cancels count-in and scoring on End; keyboard cannot alter a completed session", () => {
    render(<RhythmScreen />);
    click("Tap it back");
    tick(4 * BEAT_MS);
    click("End");
    tick(30000);
    fireEvent.keyDown(window, { code: "Digit1" });
    expect(useGameStore.getState().totalNotesPlayed).toBe(0);
    expect(
      within(screen.getByRole("dialog")).getByText(
        "0 of 0 answered true. Short sessions, often — that is the path.",
      ),
    ).toBeTruthy();
  });
  it("pauses an interrupted run without a mistake and lets it start again", () => {
    render(<RhythmScreen />);
    click("Tap it back");
    tick(BEAT_MS);
    click("Pause");
    tick(30000);
    expect(useGameStore.getState().totalNotesPlayed).toBe(0);
    click("Resume");
    perfectTap();
    expect(useGameStore.getState().totalCorrectNotes).toBe(1);
  });
});

it("duel corrections never become first-try accuracy or fresh grade credit", () => {
  useGameStore.setState({ gradeLevel: 6, duelIntroSeen: true });
  render(<DuelScreen />);
  for (const [wrong, correct] of [
    ["C#4", "E4"],
    ["F4", "G4"],
    ["G#4", "B4"],
    ["C#4", "E4"],
  ]) {
    for (const name of [wrong, correct]) {
      const key = screen
        .getAllByRole("button", { name })
        .find((el) => el.getAttribute("aria-label") === name)!;
      fireEvent.click(key);
    }
  }
  expect(within(screen.getByRole("dialog")).getByText("0%")).toBeTruthy();
  expect(useGameStore.getState().recentAtGrade).toEqual([false, false, false, false]);
  expect(useGameStore.getState().harmonyPoints).toBe(40); // phrase completion only
});

it("Strike resumes the same run and preserves earned session points", () => {
  const context = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    context as unknown as CanvasRenderingContext2D,
  );
  render(<RealtimeScreen />);
  click("Start run");
  tick(1552);
  fireEvent.keyDown(window, { code: "KeyD" });
  expect(useGameStore.getState().harmonyPoints).toBe(8);
  click("Pause run");
  tick(10000);
  click("Resume run");
  tick(672);
  fireEvent.keyDown(window, { code: "KeyF" });
  click("End run");
  expect(within(screen.getByRole("dialog")).getByText("+16")).toBeTruthy();
  const points = useGameStore.getState().harmonyPoints;
  tick(30000);
  expect(useGameStore.getState().harmonyPoints).toBe(points);
});

it("ending a duel reports only attempted turns and blocks further answers", () => {
  render(<DuelScreen />);
  click("C#4");
  click("End phrase");
  expect(
    within(screen.getByRole("dialog")).getByText(
      "0 of 1 answered true. Short sessions, often — that is the path.",
    ),
  ).toBeTruthy();
  const points = useGameStore.getState().harmonyPoints;
  fireEvent.keyDown(window, { code: "KeyD" });
  expect(useGameStore.getState().harmonyPoints).toBe(points);
});
