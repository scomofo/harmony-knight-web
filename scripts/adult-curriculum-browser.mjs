import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
const kind = process.argv[2];
const url = process.argv[3];
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  reducedMotion: "reduce",
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
mkdirSync("/workspace/screenshots", { recursive: true });
try {
  if (kind === "spark") {
    await page.addInitScript(() => {
      if (!localStorage.getItem("sparksuite.learning.v1"))
        localStorage.setItem(
          "sparksuite.learning.v1",
          JSON.stringify({
            version: 1,
            records: {
              "guitar-first-sound": {
                step: 2,
                reviews: 0,
                completedOn: "2026-01-01",
                reviewOn: "2026-01-02",
              },
            },
            active: { guitar: "guitar-first-sound" },
            pace: "lesson",
            profiles: {},
            skippedSetup: {},
            milestones: {},
            focus: {},
          }),
        );
    });
    await page.goto(url, { waitUntil: "networkidle" });
    const skip = page.getByRole("button", { name: "Skip setup", exact: true });
    if (await skip.count()) await skip.click();
    await page.goto(url + "/learn", { waitUntil: "networkidle" });
    await page
      .getByText("What changes when you fret the low E string at fret 1?", { exact: true })
      .waitFor();
    await page.getByRole("radio", { name: "The pitch stays E", exact: true }).check();
    const finish = page.getByRole("button", { name: "Wrap up this lesson", exact: true });
    assert.equal(await finish.isDisabled(), true);
    await page.getByRole("radio", { name: "The pitch rises from E to F", exact: true }).check();
    await page.getByText(/Useful correction/).waitFor();
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(
      await page
        .getByRole("radio", { name: "The pitch rises from E to F", exact: true })
        .isChecked(),
      true,
    );
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: "/workspace/screenshots/spark-adult-recall.png",
      fullPage: true,
    });
    await finish.click();
    const record = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("sparksuite.learning.v1")).records["guitar-first-sound"],
    );
    assert.equal(record.assisted, true);
    assert.equal(record.reviews, 0);
    assert.equal(record.completedOn, "2026-01-01");
  } else {
    await page.goto(url + "/lesson/4?unit=4-triads", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Try this idea/ }).waitFor();
    const figure = page.getByRole("img", { name: /Four three-note chords/ });
    assert.match(await figure.textContent(), /♯/);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: "/workspace/screenshots/harmony-adult-triads.png",
      fullPage: true,
    });
    await page.goto(url + "/lesson/1?unit=1-staff", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Try this idea/ }).click();
    await page.getByRole("region", { name: "Read upward by steps", exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: "/workspace/screenshots/harmony-adult-staff.png",
      fullPage: true,
    });
    await page.goto(url + "/scale", { waitUntil: "networkidle" });
    await page.getByText(/The starting note is [A-G]/).waitFor();
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ kind, passed: true, runtimeErrors: errors }));
} finally {
  await browser.close();
}
