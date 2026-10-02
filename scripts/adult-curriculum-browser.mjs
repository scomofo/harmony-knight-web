import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
const kind = process.argv[2];
const url = process.argv[3];
if (!["spark", "harmony"].includes(kind) || !url)
  throw new Error("Usage: node scripts/adult-curriculum-browser.mjs spark|harmony URL");
const env = { ...process.env, AGENT_BROWSER_SESSION: `adult-curriculum-${kind}` };
const run = (...args) =>
  execFileSync(process.env.AGENT_BROWSER_BIN ?? "agent-browser", args, { env, encoding: "utf8" });
const click = (name) => run("find", "role", "button", "click", "--name", name, "--exact");
const inspect = (code) => run("eval", code);
mkdirSync("/workspace/screenshots", { recursive: true });
try {
  run("open", url);
  run("snapshot", "-i");
  if (kind === "spark") {
    inspect(
      `localStorage.setItem("sparksuite.learning.v1",JSON.stringify({version:1,records:{"guitar-first-sound":{step:2,reviews:0,completedOn:"2026-01-01",reviewOn:"2026-01-02"}},active:{guitar:"guitar-first-sound"},pace:"lesson",profiles:{},skippedSetup:{},milestones:{},focus:{}}))`,
    );
    run("open", url + "/learn");
    run("snapshot", "-i");
    run("find", "role", "radio", "check", "--name", "The pitch stays E", "--exact");
    inspect(
      `if(![...document.querySelectorAll("button")].find(b=>b.textContent.includes("Wrap up this lesson")).disabled)throw new Error("wrong answer can finish")`,
    );
    run("find", "role", "radio", "check", "--name", "The pitch rises from E to F", "--exact");
    run("reload");
    inspect(
      `if(![...document.querySelectorAll('input[type="radio"]')].some(r=>r.checked&&r.closest("label").textContent.includes("The pitch rises from E to F")))throw new Error("answer not restored")`,
    );
    click("Wrap up this lesson");
    inspect(
      `const r=JSON.parse(localStorage.getItem("sparksuite.learning.v1")).records["guitar-first-sound"];if(!r.assisted||r.reviews!==0||r.completedOn!=="2026-01-01")throw new Error("review credit changed")`,
    );
    run("open", url + "/learn");
  } else {
    run("open", url + "/lesson/4?unit=4-triads");
    inspect(
      `if(![...document.querySelectorAll('[role="img"]')].some(f=>f.textContent.includes("♯")))throw new Error("augmented spelling missing")`,
    );
    run("open", url + "/lesson/1?unit=1-staff");
    click("Try this idea");
    run("wait", '[aria-label="Read upward by steps"]');
    run("open", url + "/scale");
    inspect(
      `if(!/The starting note is [A-G]/.test(document.body.textContent))throw new Error("tonic missing")`,
    );
    run("open", url + "/lesson/0?unit=0-pulse");
  }
  run("snapshot", "-i");
  run("find", "text", "Two-minute option · A pulse with room to breathe", "click");
  click("Try");
  run(
    "find",
    "role",
    "textbox",
    "fill",
    "--name",
    "Phrase observation",
    "I kept the final beat silent.",
  );
  click("Save and pause");
  run("reload");
  run("find", "text", "Two-minute option · A pulse with room to breathe", "click");
  assert.match(
    run("get", "value", 'textarea[aria-label="Phrase observation"]'),
    /I kept the final beat silent/,
  );
  click("Hear four bars");
  click("Stop phrase");
  click("Practise just bar 2");
  click("Slow it down · 72 bpm");
  click("Hear bar 2");
  run("find", "text", "Two-minute option · A pulse with room to breathe", "click");
  run("find", "text", "Two-minute option · A pulse with room to breathe", "click");
  inspect(
    `if([...document.querySelectorAll("button")].some(b=>b.textContent==="Stop phrase"))throw new Error("collapse did not stop")`,
  );
  run("screenshot", `/workspace/screenshots/${kind}-adult-phrase.png`, "--full");
  console.log(run("errors"));
  console.log(JSON.stringify({ kind, passed: true }));
} finally {
  run("close");
}
