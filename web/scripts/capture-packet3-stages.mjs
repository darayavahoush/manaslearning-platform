import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9224;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("Starting Chrome with remote debugging on port", PORT);
  const chromeProc = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1440,900",
  ]);

  let closed = false;
  const cleanup = () => {
    if (!closed) {
      closed = true;
      try { chromeProc.kill("SIGTERM"); } catch {}
    }
  };
  process.on("exit", cleanup);
  process.on("SIGINT", cleanup);

  await sleep(1500);

  // Get WebSocket debugger URL
  const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
  const vdata = await res.json();
  const wsUrl = vdata.webSocketDebuggerUrl;
  console.log("Connected to browser at", wsUrl);

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => ws.onopen = resolve);

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(JSON.stringify(data.error)));
      else resolve(data.result);
    }
  };

  function send(method, params = {}) {
    const id = msgId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Create target page
  const target = await send("Target.createTarget", { url: "about:blank" });
  const targetId = target.targetId;
  const session = await send("Target.attachToTarget", { targetId, flatten: true });
  const sessionId = session.sessionId;

  function sendSession(method, params = {}) {
    const id = msgId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }

  await sendSession("Page.enable");
  await sendSession("DOM.enable");
  await sendSession("Runtime.enable");

  async function snap(name) {
    const outPath = path.join(process.cwd(), "docs/itw/screenshots", name);
    const snapRes = await sendSession("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(outPath, Buffer.from(snapRes.data, "base64"));
    console.log(`Saved screenshot -> ${name}`);
  }

  async function evalJs(expr) {
    const res = await sendSession("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    return res.result?.value;
  }

  async function clickByText(text) {
    return evalJs(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button, a, label'));
        const el = btns.find(b => (b.innerText || b.textContent || '').includes(${JSON.stringify(text)}));
        if (el) { el.click(); return true; }
        return false;
      })()
    `);
  }

  // 1. Dyslexia standard view & metaphor view
  console.log("Navigating to Dyslexia...");
  await sendSession("Page.navigate", { url: "http://localhost:3000/experience?module=dyslexia" });
  await sleep(1000);
  await clickByText("Start the Experience →");
  await sleep(500);
  await snap("packet3-dyslexia-instructions.png");

  await clickByText("Start Reading →");
  await sleep(600);
  await snap("packet3-dyslexia-run1-standard.png");

  await clickByText("Optional: Simulated Decoding Overhead");
  await sleep(600);
  await snap("packet3-dyslexia-run1-metaphor.png");

  await clickByText("I've finished reading →");
  await sleep(500);
  await snap("packet3-dyslexia-comprehension-check.png");

  // Pick comprehension answers
  await evalJs(`
    (() => {
      const opts = document.querySelectorAll('.itw-flow-opt');
      if (opts[0]) opts[0].click();
      if (opts[4]) opts[4].click();
      if (opts[6]) opts[6].click();
    })()
  `);
  await sleep(300);
  await clickByText("Submit Answers →");
  await sleep(500);
  await snap("packet3-dyslexia-result-debrief.png");

  await clickByText("Try a Supportive Accommodation →");
  await sleep(500);
  await snap("packet3-dyslexia-support-selection.png");

  await clickByText("Run with Support →");
  await sleep(600);
  await snap("packet3-dyslexia-run2-supported.png");

  await clickByText("Continue to Takeaways →");
  await sleep(600);
  await snap("packet3-dyslexia-explain-sld-data.png");

  // 2. Speech Module Fast vs Supported Untimed
  console.log("Navigating to Speech...");
  await sendSession("Page.navigate", { url: "http://localhost:3000/experience?module=speech" });
  await sleep(1000);
  await clickByText("Begin Experience →");
  await sleep(500);
  await snap("packet3-speech-instructions.png");

  await clickByText("Start Run 1: Fast Pacing →");
  await sleep(600);
  await snap("packet3-speech-run1-fast-window.png");

  // Type answer
  await evalJs(`
    (() => {
      const inp = document.querySelector('.itw-textin');
      if (inp) {
        inp.value = "We visited a park and saw wild birds.";
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()
  `);
  await sleep(300);
  await clickByText("Share Response");
  await sleep(800);
  await snap("packet3-speech-run1-delivering.png");

  // Wait for turn to finish
  await sleep(2500);
  // Type second answer
  await evalJs(`
    (() => {
      const inp = document.querySelector('.itw-textin');
      if (inp) {
        inp.value = "Listening to acoustic music and sketching.";
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()
  `);
  await sleep(200);
  await clickByText("Share Response");
  await sleep(3500);

  // Now on Reflect page
  await snap("packet3-speech-reflect-debrief.png");

  await clickByText("Try a Supportive Accommodation →");
  await sleep(500);
  await snap("packet3-speech-support-selection.png");

  await clickByText("Run with Support →");
  await sleep(600);
  await snap("packet3-speech-run2-supported-untimed.png");

  // 3. 320px Reflow Verification
  console.log("Testing 320px reflow...");
  await sendSession("Emulation.setDeviceMetricsOverride", {
    width: 320,
    height: 800,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(400);

  const scrollWidthDyslexia = await evalJs("document.documentElement.scrollWidth");
  console.log("Dyslexia 320px scrollWidth:", scrollWidthDyslexia);
  await snap("packet3-reflow-320px-dyslexia-flow.png");

  await sendSession("Page.navigate", { url: "http://localhost:3000/experience?module=speech" });
  await sleep(800);
  const scrollWidthSpeech = await evalJs("document.documentElement.scrollWidth");
  console.log("Speech 320px scrollWidth:", scrollWidthSpeech);
  await snap("packet3-reflow-320px-speech-flow.png");

  await sendSession("Page.navigate", { url: "http://localhost:3000/" });
  await sleep(800);
  const scrollWidthHome = await evalJs("document.documentElement.scrollWidth");
  console.log("Home 320px scrollWidth:", scrollWidthHome);
  await snap("packet3-reflow-320px-home-verified.png");

  console.log("Verification captures complete!");
  cleanup();
}

main().catch((err) => {
  console.error("Capture script error:", err);
  process.exit(1);
});
