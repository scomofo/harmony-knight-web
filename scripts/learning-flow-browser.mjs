import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { unitById } from "../src/lib/game/course.ts";
import { activityForUnit } from "../src/lib/game/activity-catalog.ts";
import { freshUnitProgress, servedChecks } from "../src/lib/game/learning.ts";
import { checkedOutputPath, checkedUrl } from "./browser-guard.mjs";

const url = checkedUrl(process.argv[2] ?? "http://127.0.0.1:8086");
const out = checkedOutputPath(process.argv[3] ?? "/workspace/screenshots/harmony-learning-flow", [
  "/workspace/screenshots",
]);
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.HARMONY_BROWSER_PATH || undefined,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const button = (name) => page.getByRole("button", { name, exact: true });
const state = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("harmony-knight-save")).state);
const checkLayout = async () => {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const article = await page.locator("article").boundingBox();
  const guide = await page.getByLabel("Lesson guide", { exact: true }).boundingBox();
  assert.ok(guide.x >= article.x + article.width, "the desktop guide sits beside the task");
};
async function solve(activity, guided = false) {
  for (const [index, task] of activity.tasks.entries()) {
    if (guided) {
      await button("Show a worked answer").click();
    } else if (task.kind === "listening" || task.kind === "harmony-listening") {
      await button(task.options[task.solution[0][0]]).click();
    } else if (task.kind === "chord") {
      for (const note of task.solution[0]) {
        await button(task.choices.find((choice) => choice.midi === note).label).click();
      }
    } else {
      throw new Error(`This journey needs a visible-control solver for ${task.kind}`);
    }
    await button("Check my answer").click();
    if (index < activity.tasks.length - 1) await button("Next task").click();
  }
  await button("Ready for two quick checks").click();
}
async function recall(unit, progress, missLast = false) {
  for (const [index, check] of servedChecks(unit, progress).entries()) {
    const answer =
      missLast && index === 1
        ? check.options.find((option) => option !== check.answer)
        : check.answer;
    await button(answer).click();
    await button(index === 1 ? "Save and finish" : "Next check").click();
  }
  await page.getByRole("heading", { name: "A good place to pause." }).waitFor();
}
try {
  // Clean browser storage; no seeded completion or direct writes to the store.
  await page.goto(url);
  await button("Start my first 3-minute lesson").click();
  await page.getByRole("heading", { name: unitById("0-pitch").title }).waitFor();
  await checkLayout();
  await button("Try this idea").click();
  await solve(activityForUnit("0-pitch"));
  await recall(unitById("0-pitch"), freshUnitProgress(), true);
  await page.getByText("Ideas to revisit", { exact: true }).click();
  await page.screenshot({ path: join(out, "completion.png"), fullPage: true });
  const completed = await state();
  assert.equal(completed.harmonyPoints, 25);
  assert.equal(completed.unitProgress["0-pitch"].step, 4);

  await page.getByRole("link", { name: "Explore the learning path", exact: true }).click();
  const find = page.getByRole("searchbox", { name: "Find a lesson" });
  await find.fill("no-such-topic");
  await page.getByText(/No lessons match/).waitFor();
  await button("Clear lesson search").click();
  assert.equal(await find.evaluate((element) => document.activeElement === element), true);
  await find.fill("triad");
  await page.getByRole("status").waitFor();
  assert.equal((await state()).activeUnitId, "0-pitch");
  await page.screenshot({ path: join(out, "learning-path.png"), fullPage: true });
  await page.locator('a[href*="unit=4-triads"]').click();
  await button("Try this idea").click();
  await solve(activityForUnit("4-triads"), true);
  await recall(unitById("4-triads"), freshUnitProgress());
  await button("Try recall again").click();
  await page.getByRole("heading", { name: "Try a fresh example" }).waitFor();
  const originalVisual = unitById("4-triads").visual.alt;
  assert.equal(await page.getByRole("img", { name: originalVisual }).count(), 0);
  await button("D4").click();
  await page.reload();
  assert.equal(await button("D4").getAttribute("aria-pressed"), "true");
  await checkLayout();
  await page.screenshot({ path: join(out, "fresh-review.png"), fullPage: true });
  await page.getByText("Need the idea again?", { exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("img", { name: originalVisual }).waitFor();
  assert.equal((await state()).unitProgress["4-triads"].assisted, true);
  assert.equal(await button("D4").getAttribute("aria-pressed"), "true");
  await page.screenshot({ path: join(out, "supported-review.png"), fullPage: true });
  await page.getByText("Need the idea again?", { exact: true }).click();
  for (const name of ["F#4", "A4"]) await button(name).click();
  await button("Check my answer").click();
  await button("Ready for two quick checks").click();
  await recall(unitById("4-triads"), { ...freshUnitProgress(), reviewing: true });
  await page.reload();
  await page.getByText("2 of 2 before explanations", { exact: true }).waitFor();
  await page.getByText("0 of 1 first checks without help", { exact: true }).waitFor();
  const final = await state();
  assert.equal(final.harmonyPoints, 50, "early repeats earn no extra lesson points");
  assert.equal(final.unitProgress["4-triads"].completedReviewRound, 0);
  assert.equal(final.unitProgress["4-triads"].reviewCount, 0, "early repeats add no due credit");
  assert.equal(errors.length, 0, errors.join("\n"));
  const verdict = { passed: true, viewport: "1440x1000", seeded: false, pageErrors: errors };
  writeFileSync(join(out, "verdict.json"), JSON.stringify(verdict, null, 2));
  console.log(JSON.stringify(verdict));
} finally {
  await browser.close();
}
