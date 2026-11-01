import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9243; // Isolated port
const DOCS_DIR = path.resolve(__dirname, "../docs/itw/screenshots/packet9_3");

if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

class CdpConnection {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(msg.error);
          else cb.resolve(msg.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
    }
  }
}

async function pollSelector(cdp, selector, maxWaitMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await cdp.send("Runtime.evaluate", {
      expression: `!!document.querySelector(${JSON.stringify(selector)})`,
      returnByValue: true,
    });
    if (res?.result?.value === true) return true;
    await sleep(400);
  }
  return false;
}

async function evalInPage(cdp, expression) {
  const trimmed = expression.trim();
  let code;
  if (trimmed.startsWith("(() =>") || trimmed.startsWith("(function") || trimmed.startsWith("({")) {
    code = trimmed;
  } else if (trimmed.includes("return ") || trimmed.includes("const ") || trimmed.includes("let ") || trimmed.includes(";") || trimmed.includes("\n")) {
    code = `(() => {\n${trimmed}\n})()`;
  } else {
    code = trimmed;
  }
  const res = await cdp.send("Runtime.evaluate", {
    expression: code,
    returnByValue: true,
  });
  if (res?.exceptionDetails) {
    console.error("  [Eval Exception]", res.exceptionDetails.exception?.description || res.exceptionDetails.text);
  }
  return res?.result?.value;
}

async function run() {
  console.log("=== IN THEIR WORLD: PACKET 9.3 HARDENED RUNTIME BROWSER VERIFICATION ===");
  console.log(`Starting headless Chrome on port ${PORT}...`);

  const tmpUserDir = `/tmp/chrome-packet93-runtime-${Date.now()}`;
  const chromeProcess = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--user-data-dir=${tmpUserDir}`,
    "--window-size=1440,900",
  ]);

  let cdp = null;
  const results = [];

  function record(testName, passed, details = "") {
    results.push({ testName, passed, details });
    if (passed) {
      console.log(`  ✓ PASS: ${testName} ${details ? `(${details})` : ""}`);
    } else {
      console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ""}`);
    }
  }

  async function capture(filename, width = 1440, height = 900, mobile = false) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 2,
      mobile,
    });
    await sleep(400);
    const screenshot = await cdp.send("Page.captureScreenshot", { format: "png" });
    const filePath = path.join(DOCS_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(screenshot.data, "base64"));
    console.log(`  📸 Screenshot saved: ${path.relative(process.cwd(), filePath)}`);
  }

  const cleanup = () => {
    try {
      if (cdp) cdp.close();
    } catch (_) {}
    try {
      chromeProcess.kill("SIGTERM");
    } catch (_) {}
    try {
      fs.rmSync(tmpUserDir, { recursive: true, force: true });
    } catch (_) {}
  };

  process.on("exit", cleanup);
  process.on("SIGINT", () => { cleanup(); process.exit(1); });

  // Connect CDP
  let connected = false;
  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await sleep(400);
    try {
      const resp = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const pages = await resp.json();
      const page = pages.find((p) => p.type === "page") || pages[0];
      if (page?.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        connected = true;
        break;
      }
    } catch (_) {}
  }

  if (!connected || !wsUrl) {
    console.error("Failed to connect to Chrome over CDP.");
    cleanup();
    process.exit(1);
  }

  cdp = new CdpConnection(wsUrl);
  await cdp.connect();
  console.log("Connected to Chrome via CDP.\n");

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  // ============================================================================
  // SUITE 1: SPEECH & LANGUAGE COMMUNICATION ACCESS STUDIO
  // ============================================================================
  console.log("--- SUITE 1: Speech & Language Interactive Studio ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience?module=speech" });

  const studioReady = await pollSelector(cdp, ".itw-studio-wrap", 15000);
  record("Studio Component Hydration", studioReady, "Found .itw-studio-wrap");

  if (!studioReady) {
    console.error("FATAL: Speech & Language Studio failed to hydrate.");
    cleanup();
    process.exit(1);
  }

  const getTurnText = async (idx) => {
    return await evalInPage(cdp, `
      const turns = Array.from(document.querySelectorAll('.itw-studio-wrap div[style*="flex-direction: column; gap: 12px"] > div, .itw-studio-wrap div[style*="flex-direction: column"][style*="gap: 12px"] > div'));
      return turns[${idx}] ? turns[${idx}].innerText : '';
    `);
  };

  // 1. Initial State: Patient Pacing
  const initialTurnText = await getTurnText(2);
  const initialPatient = initialTurnText.toLowerCase().includes("waits quietly and attentively");
  record("Initial Dynamic Dialogue Turn 3 (Patient Pacing)", initialPatient, initialTurnText.slice(0, 50));

  // 2. Toggle Practice 1: Disable "Allow Unhurried Time"
  const pacingBtnExists = await evalInPage(cdp, `
    !!Array.from(document.querySelectorAll('.itw-studio-wrap button')).find(b => b.textContent.includes('Allow Unhurried Time'))
  `);
  record("Control Exists: 'Allow Unhurried Time' Button", pacingBtnExists);

  await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('.itw-studio-wrap button'));
    const pacingBtn = btns.find(b => b.textContent.includes('Allow Unhurried Time'));
    if (pacingBtn) pacingBtn.click();
  `);
  await sleep(300);

  const toggle1TurnText = await getTurnText(2);
  const toggle1Aria = await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('.itw-studio-wrap button'));
    const pacingBtn = btns.find(b => b.textContent.includes('Allow Unhurried Time'));
    return pacingBtn?.getAttribute('aria-pressed');
  `);
  const toggle1Changed = toggle1TurnText.toLowerCase().includes("teacher (pacing pressure)") && toggle1Aria === "false";
  record("Dialogue Reactive Change on Toggle 1 (Pacing Off)", toggle1Changed, `aria-pressed=${toggle1Aria}`);

  // 3. Toggle Practice 2: Disable "Never Finish Sentences"
  const finishBtnExists = await evalInPage(cdp, `
    !!Array.from(document.querySelectorAll('.itw-studio-wrap button')).find(b => b.textContent.includes('Never Finish Sentences'))
  `);
  record("Control Exists: 'Never Finish Sentences' Button", finishBtnExists);

  await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('.itw-studio-wrap button'));
    const finishBtn = btns.find(b => b.textContent.includes('Never Finish Sentences'));
    if (finishBtn) finishBtn.click();
  `);
  await sleep(300);

  const toggle2TurnText = await getTurnText(2);
  const toggle2Aria = await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('.itw-studio-wrap button'));
    const finishBtn = btns.find(b => b.textContent.includes('Never Finish Sentences'));
    return finishBtn?.getAttribute('aria-pressed');
  `);
  const toggle2Changed = toggle2TurnText.toLowerCase().includes("classmate (interruption & guessing)") && toggle2Aria === "false";
  record("Dialogue Reactive Change on Toggle 2 (Both Off)", toggle2Changed, `aria-pressed=${toggle2Aria}`);

  // 4. Toggle Practice 1 Back ON
  await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('.itw-studio-wrap button'));
    const pacingBtn = btns.find(b => b.textContent.includes('Allow Unhurried Time'));
    if (pacingBtn) pacingBtn.click();
  `);
  await sleep(300);

  const toggle3TurnText = await getTurnText(2);
  const toggle3Changed = toggle3TurnText.toLowerCase().includes("classmate (jumping in)");
  record("Dialogue Reactive Change on Re-enabling Pacing Alone", toggle3Changed, toggle3TurnText.slice(0, 45));

  // 5. Toggle Practice 2 Back ON
  await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('.itw-studio-wrap button'));
    const finishBtn = btns.find(b => b.textContent.includes('Never Finish Sentences'));
    if (finishBtn) finishBtn.click();
  `);
  await sleep(300);

  const toggle4TurnText = await getTurnText(2);
  record("Dialogue Returns to Patient Pacing on Re-enabling Both", toggle4TurnText.toLowerCase().includes("waits quietly and attentively"));

  // 6. AAC Scenario B & Speech Output Verification
  console.log("  Testing Scenario B: AAC Device & Independent Voice Output...");
  await evalInPage(cdp, `
    const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
    const bTab = tabs.find(t => t.textContent.includes('Scenario B'));
    if (bTab) bTab.click();
  `);
  await sleep(500);

  // Install Web Speech API spy
  await evalInPage(cdp, `
    window.__speechLog = [];
    window.__speechCancelled = false;
    const customSpeak = function(u) {
      window.__speechLog.push(u.text);
      if (typeof u.onstart === 'function') {
        setTimeout(() => u.onstart(), 15);
      }
    };
    const customCancel = function() {
      window.__speechCancelled = true;
    };

    if (window.SpeechSynthesis && window.SpeechSynthesis.prototype) {
      window.SpeechSynthesis.prototype.speak = customSpeak;
      window.SpeechSynthesis.prototype.cancel = customCancel;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.speak = customSpeak;
      window.speechSynthesis.cancel = customCancel;
    }
  `);

  // Verify AAC tile existence before clicking
  const sandTileExists = await evalInPage(cdp, `
    !!Array.from(document.querySelectorAll('.itw-studio-wrap button')).find(b => b.textContent.includes('Sand Layer'))
  `);
  const cleanTileExists = await evalInPage(cdp, `
    !!Array.from(document.querySelectorAll('.itw-studio-wrap button')).find(b => b.textContent.includes('Clean Water'))
  `);
  record("Control Exists: AAC Tiles 'Sand Layer' & 'Clean Water'", sandTileExists && cleanTileExists);

  await evalInPage(cdp, `
    const buttons = Array.from(document.querySelectorAll('.itw-studio-wrap button'));
    const sandBtn = buttons.find(b => b.textContent.includes('Sand Layer'));
    if (sandBtn) sandBtn.click();
  `);
  await sleep(250);

  await evalInPage(cdp, `
    const buttons = Array.from(document.querySelectorAll('.itw-studio-wrap button'));
    const cleanBtn = buttons.find(b => b.textContent.includes('Clean Water'));
    if (cleanBtn) cleanBtn.click();
  `);
  await sleep(250);

  const playBtnExists = await evalInPage(cdp, `
    !!Array.from(document.querySelectorAll('.itw-studio-wrap button')).find(b => b.textContent.includes('Play Message'))
  `);
  record("Control Exists: 'Play Message' Button", playBtnExists);

  await evalInPage(cdp, `
    const buttons = Array.from(document.querySelectorAll('.itw-studio-wrap button'));
    const playBtn = buttons.find(b => b.textContent.includes('Play Message'));
    if (playBtn) playBtn.click();
  `);
  await sleep(350);

  const speechLog = await evalInPage(cdp, `window.__speechLog || []`);
  const liveAnnouncement = await evalInPage(cdp, `
    document.querySelector('[aria-live="polite"]')?.innerText || ''
  `);

  const aacPlayed = speechLog.length >= 1 && speechLog[0].includes("Sand Layer") && speechLog[0].includes("Clean Water");
  record("AAC Explicit Speech Output Invoked (Global Sound OFF)", aacPlayed, `Utterance: "${speechLog[0] || 'none'}"`);
  record("Accessible Status Announcement for Play", liveAnnouncement.includes("Playing message") || liveAnnouncement.includes("Sand Layer"), `aria-live: "${liveAnnouncement}"`);

  // Stop button
  await evalInPage(cdp, `
    const buttons = Array.from(document.querySelectorAll('.itw-studio-wrap button'));
    const stopBtn = buttons.find(b => b.textContent.includes('Stop Message'));
    if (stopBtn) stopBtn.click();
  `);
  await sleep(250);

  const speechCancelled = await evalInPage(cdp, `window.__speechCancelled === true`);
  const stopAnnouncement = await evalInPage(cdp, `
    document.querySelector('[aria-live="polite"]')?.innerText || ''
  `);
  record("AAC Explicit Stop Invokes speechSynthesis.cancel", speechCancelled);
  record("Accessible Status Announcement for Stop", stopAnnouncement.toLowerCase().includes("speech output stopped") || stopAnnouncement.toLowerCase().includes("stopped"));

  // Clear button
  await evalInPage(cdp, `
    const buttons = Array.from(document.querySelectorAll('.itw-studio-wrap button'));
    const clearBtn = buttons.find(b => b.textContent.includes('Clear Message'));
    if (clearBtn) clearBtn.click();
  `);
  await sleep(250);

  const clearAnnouncement = await evalInPage(cdp, `
    document.querySelector('[aria-live="polite"]')?.innerText || ''
  `);
  record("AAC Clear Message Resets State", clearAnnouncement.toLowerCase().includes("aac message cleared"));

  // Scenario switch cancellation
  await evalInPage(cdp, `
    window.__speechCancelled = false;
    const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
    const cTab = tabs.find(t => t.textContent.includes('Scenario C'));
    if (cTab) cTab.click();
  `);
  await sleep(500);

  const switchCleanup = await evalInPage(cdp, `window.__speechCancelled === true`);
  record("SpeechSynthesis Cancelled on Scenario Switch", switchCleanup);

  // Scenario C natural phrasing check
  const scenarioCText = await getTurnText(1);
  const hasNoRigidTimers = !scenarioCText.includes("6 seconds") && !scenarioCText.includes("1.5 seconds") && !scenarioCText.includes("1 second");
  const hasNaturalPause = scenarioCText.toLowerCase().includes("unhurried pause");
  record("Scenario C Uses Natural Pacing Phrasing (No Rigid Seconds)", hasNoRigidTimers && hasNaturalPause, scenarioCText.slice(0, 60));

  await capture("01_speech_dialogue_and_aac.png");

  // ============================================================================
  // SUITE 2: DYSCALCULIA THE QUANTITY KITCHEN
  // ============================================================================
  console.log("\n--- SUITE 2: Dyscalculia The Quantity Kitchen ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience?module=dyscalculia" });

  const kitchenReady = await pollSelector(cdp, ".itw-kitchen-wrap", 15000);
  record("The Quantity Kitchen Hydration", kitchenReady, "Found .itw-kitchen-wrap");

  if (!kitchenReady) {
    console.error("FATAL: Quantity Kitchen failed to hydrate.");
    cleanup();
    process.exit(1);
  }

  // Helper to get Lemons quantity and difference
  const getLemonsVal = async () => {
    const val = await evalInPage(cdp, `
      document.querySelector('button[aria-label="Increase Fresh Lemons"]')?.previousElementSibling?.innerText || ''
    `);
    return parseInt(val.trim(), 10);
  };

  // 1. Initial lemons value is 2
  const initialLemonsVal = await getLemonsVal();
  record("Check 1: Initial Lemons Value is 2", initialLemonsVal === 2, `Val: ${initialLemonsVal}`);

  // 2. Increment produces 3
  await evalInPage(cdp, `document.querySelector('button[aria-label="Increase Fresh Lemons"]')?.click();`);
  await sleep(250);
  const step2Val = await getLemonsVal();
  record("Check 2: Increment Produces 3", step2Val === 3, `Val: ${step2Val}`);

  // 3. Increment produces target 4
  await evalInPage(cdp, `document.querySelector('button[aria-label="Increase Fresh Lemons"]')?.click();`);
  await sleep(250);
  const step3Val = await getLemonsVal();
  record("Check 3: Increment Produces Target 4", step3Val === 4, `Val: ${step3Val}`);

  // Switch to numeric view to check difference dynamics
  await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('.itw-kitchen-wrap button'));
    const nBtn = btns.find(b => b.textContent.includes('Pure Numeric'));
    if (nBtn) nBtn.click();
  `);
  await sleep(300);

  // 4. Decrement returns to 3
  await evalInPage(cdp, `document.querySelector('button[aria-label="Decrease Fresh Lemons"]')?.click();`);
  await sleep(250);
  const step4Val = await getLemonsVal();
  record("Check 4: Decrement Returns to 3", step4Val === 3, `Val: ${step4Val}`);

  // 5. Numeric difference dynamically updates to -1 (needs 1 more)
  const diffAt3 = await evalInPage(cdp, `
    const cards = Array.from(document.querySelectorAll('.itw-kitchen-wrap div'));
    const diffRow = cards.find(d => d.innerText.includes('Difference:') && d.innerText.includes('needs'));
    return diffRow ? diffRow.innerText.replace(/\\s+/g, ' ') : '';
  `);
  const diffAt3Matches = diffAt3.includes("-1") && diffAt3.includes("needs 1 more");
  record("Check 5: Dynamic Numeric Difference at 3 is -1 (needs 1 more)", diffAt3Matches, diffAt3);

  // 6. Increment returns to 4
  await evalInPage(cdp, `document.querySelector('button[aria-label="Increase Fresh Lemons"]')?.click();`);
  await sleep(250);
  const step6Val = await getLemonsVal();
  record("Check 6: Increment Returns to Target 4", step6Val === 4, `Val: ${step6Val}`);

  // 7. Numeric difference becomes 0 (Target matched!)
  const diffAt4 = await evalInPage(cdp, `
    const cards = Array.from(document.querySelectorAll('.itw-kitchen-wrap div'));
    const diffRow = cards.find(d => d.innerText.includes('Difference:') && d.innerText.includes('Target matched!'));
    return diffRow ? diffRow.innerText.replace(/\\s+/g, ' ') : '';
  `);
  const diffAt4Matches = diffAt4.includes("0 (Target matched!)");
  record("Check 7: Dynamic Numeric Difference at 4 is 0 (Target matched!)", diffAt4Matches, diffAt4);

  // 8. Grouped view retains quantity 4 & has aria-pressed
  await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('.itw-kitchen-wrap button'));
    const gBtn = btns.find(b => b.textContent.includes('Grouped Visual Sets'));
    if (gBtn) gBtn.click();
  `);
  await sleep(300);
  const groupedVal = await getLemonsVal();
  const groupedAria = await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('.itw-kitchen-wrap button'));
    const gBtn = btns.find(b => b.textContent.includes('Grouped Visual Sets'));
    const bBtn = btns.find(b => b.textContent.includes('Proportional Ratio Strip'));
    const nBtn = btns.find(b => b.textContent.includes('Pure Numeric'));
    return {
      grouped: gBtn?.getAttribute('aria-pressed'),
      bar: bBtn?.getAttribute('aria-pressed'),
      numeric: nBtn?.getAttribute('aria-pressed')
    };
  `);
  record("Check 8: Grouped View Retains Quantity 4", groupedVal === 4);
  record("Check 8b: Grouped View Button aria-pressed Correct", groupedAria?.grouped === "true" && groupedAria?.bar === "false" && groupedAria?.numeric === "false");

  // 9. Bar view retains quantity 4 & has aria-pressed
  await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('.itw-kitchen-wrap button'));
    const bBtn = btns.find(b => b.textContent.includes('Proportional Ratio Strip'));
    if (bBtn) bBtn.click();
  `);
  await sleep(300);
  const barVal = await getLemonsVal();
  const barAria = await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('.itw-kitchen-wrap button'));
    const gBtn = btns.find(b => b.textContent.includes('Grouped Visual Sets'));
    const bBtn = btns.find(b => b.textContent.includes('Proportional Ratio Strip'));
    const nBtn = btns.find(b => b.textContent.includes('Pure Numeric'));
    return {
      grouped: gBtn?.getAttribute('aria-pressed'),
      bar: bBtn?.getAttribute('aria-pressed'),
      numeric: nBtn?.getAttribute('aria-pressed')
    };
  `);
  record("Check 9: Bar View Retains Quantity 4", barVal === 4);
  record("Check 9b: Bar View Button aria-pressed Correct", barAria?.grouped === "false" && barAria?.bar === "true" && barAria?.numeric === "false");

  // 10. Numeric view retains quantity 4 & has aria-pressed
  await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('.itw-kitchen-wrap button'));
    const nBtn = btns.find(b => b.textContent.includes('Pure Numeric'));
    if (nBtn) nBtn.click();
  `);
  await sleep(300);
  const numericVal = await getLemonsVal();
  const numericAria = await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('.itw-kitchen-wrap button'));
    const gBtn = btns.find(b => b.textContent.includes('Grouped Visual Sets'));
    const bBtn = btns.find(b => b.textContent.includes('Proportional Ratio Strip'));
    const nBtn = btns.find(b => b.textContent.includes('Pure Numeric'));
    return {
      grouped: gBtn?.getAttribute('aria-pressed'),
      bar: bBtn?.getAttribute('aria-pressed'),
      numeric: nBtn?.getAttribute('aria-pressed')
    };
  `);
  record("Check 10: Numeric View Retains Quantity 4", numericVal === 4);
  record("Check 10b: Numeric View Button aria-pressed Correct", numericAria?.grouped === "false" && numericAria?.bar === "false" && numericAria?.numeric === "true");

  await capture("02_dyscalculia_steppers_and_views.png");

  // ============================================================================
  // SUITE 3: EXECUTIVE FUNCTIONING THE PROJECT PLANNING DESK
  // ============================================================================
  console.log("\n--- SUITE 3: Executive Functioning The Project Planning Desk ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience?module=executive" });

  const execReady = await pollSelector(cdp, ".itw-planning-desk", 15000);
  record("The Project Planning Desk Hydration", execReady, "Found .itw-planning-desk");

  if (!execReady) {
    console.error("FATAL: Project Planning Desk failed to hydrate.");
    cleanup();
    process.exit(1);
  }

  // 1. Task 2 starts in NOW: verified via data-status-column="now" and data-task-id="sources"
  const task2StartsInNow = await evalInPage(cdp, `
    !!document.querySelector('[data-status-column="now"] [data-task-id="sources"]')
  `);
  record("Check 1: Task 2 Initially in NOW Column (data-status-column='now')", task2StartsInNow);

  // 2. Task 2 moves to NEXT
  await evalInPage(cdp, `
    const moveBtn = document.querySelector('[data-task-id="sources"] button[title*="Next column"]');
    if (moveBtn) moveBtn.click();
  `);
  await sleep(300);

  const task2InNext = await evalInPage(cdp, `
    const inNext = !!document.querySelector('[data-status-column="next"] [data-task-id="sources"]');
    const notInNow = !document.querySelector('[data-status-column="now"] [data-task-id="sources"]');
    return inNext && notInNow;
  `);
  record("Check 2: Task 2 Moves from NOW to NEXT Container", task2InNext);

  // 3. Task 2 returns to NOW
  await evalInPage(cdp, `
    const taskCard = document.querySelector('[data-task-id="sources"]');
    const moveNowBtn = Array.from(taskCard?.querySelectorAll('button') || []).find(b => b.textContent.includes('Move to NOW'));
    if (moveNowBtn) moveNowBtn.click();
  `);
  await sleep(300);

  const task2BackInNow = await evalInPage(cdp, `
    !!document.querySelector('[data-status-column="now"] [data-task-id="sources"]')
  `);
  record("Check 3: Task 2 Moves Back from NEXT to NOW Container", task2BackInNow);

  // 4. Task 2 moves to LATER
  await evalInPage(cdp, `
    const moveLaterBtn = document.querySelector('[data-task-id="sources"] button[title*="Later column"]');
    if (moveLaterBtn) moveLaterBtn.click();
  `);
  await sleep(300);

  const task2InLater = await evalInPage(cdp, `
    const inLater = !!document.querySelector('[data-status-column="later"] [data-task-id="sources"]');
    const notInNow = !document.querySelector('[data-status-column="now"] [data-task-id="sources"]');
    return inLater && notInNow;
  `);
  record("Check 4: Task 2 Moves from NOW to LATER Container", task2InLater);

  // 5. Task 2 returns to NOW
  await evalInPage(cdp, `
    const taskCard = document.querySelector('[data-status-column="later"] [data-task-id="sources"]');
    const moveNextBtn = Array.from(taskCard?.querySelectorAll('button') || []).find(b => b.textContent.includes('Next'));
    if (moveNextBtn) moveNextBtn.click();
  `);
  await sleep(300);
  await evalInPage(cdp, `
    const taskCard = document.querySelector('[data-status-column="next"] [data-task-id="sources"]');
    const moveNowBtn = Array.from(taskCard?.querySelectorAll('button') || []).find(b => b.textContent.includes('Move to NOW'));
    if (moveNowBtn) moveNowBtn.click();
  `);
  await sleep(300);

  const task2NowRestored = await evalInPage(cdp, `
    !!document.querySelector('[data-status-column="now"] [data-task-id="sources"]')
  `);
  record("Check 5: Task 2 Moves Back from LATER to NOW Container", task2NowRestored);

  // 6. Mark Task 2 Complete
  await evalInPage(cdp, `
    const taskCard = document.querySelector('[data-status-column="now"] [data-task-id="sources"]');
    const doneBtn = Array.from(taskCard?.querySelectorAll('button') || []).find(b => b.textContent.includes('Mark Done'));
    if (doneBtn) doneBtn.click();
  `);
  await sleep(300);

  // 7. Completion count updates correctly ("2 of 5 Completed")
  const completionText = await evalInPage(cdp, `
    document.querySelector('.itw-planning-desk')?.innerText.includes("2 of 5 Completed")
  `);
  record("Check 6 & 7: Task 2 Marked Done -> '2 of 5 Completed'", completionText);

  // 8. Edit all three reminder fields
  await evalInPage(cdp, `
    const inputs = document.querySelectorAll('.itw-planning-desk input[type="text"]');
    const setVal = (el, val) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };
    if (inputs.length >= 3) {
      setVal(inputs[0], "Reviewed wetland ecology notes");
      setVal(inputs[1], "Extract oxygen data from civic archive");
      setVal(inputs[2], "Download water study summary PDF");
    }
  `);
  await sleep(250);

  const reminderVals = await evalInPage(cdp, `
    Array.from(document.querySelectorAll('.itw-planning-desk input[type="text"]')).map(i => i.value)
  `);
  const reminderAcceptsEdits = reminderVals[0] === "Reviewed wetland ecology notes" &&
                              reminderVals[1] === "Extract oxygen data from civic archive" &&
                              reminderVals[2] === "Download water study summary PDF";
  record("Check 8: All 3 Next-Action Fields Accept Live Edits", reminderAcceptsEdits);

  // 9. Change-of-Plan opens
  await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('.itw-planning-desk button'));
    const triggerBtn = btns.find(b => b.textContent.includes('Change-of-Plan Scenario'));
    if (triggerBtn) triggerBtn.click();
  `);
  await sleep(400);

  const modalOpened = await evalInPage(cdp, `
    document.body.innerText.includes("The source you planned to use is unavailable")
  `);
  record("Check 9: Change-of-Plan Scenario Modal Opens", modalOpened);

  // 10. Choosing alternate source updates intended field
  await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('button'));
    const altSourceBtn = btns.find(b => b.textContent.includes('Find an Alternate Source'));
    if (altSourceBtn) altSourceBtn.click();
  `);
  await sleep(400);

  const updatedStepVal = await evalInPage(cdp, `
    const inputs = document.querySelectorAll('.itw-planning-desk input[type="text"]');
    return inputs[1]?.value || '';
  `);
  const planAdjusted = updatedStepVal.toLowerCase().includes("wetland archive") || updatedStepVal.toLowerCase().includes("bellandur");
  record("Check 10: Alternate Source Option Updates Intended Next-Step Field", planAdjusted, updatedStepVal);

  // 11. Perspective switch preserves in-module state
  await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('.itw-planning-desk button'));
    const mapBtn = btns.find(b => b.textContent.includes('Visual Workflow Map'));
    if (mapBtn) mapBtn.click();
  `);
  await sleep(350);

  const workflowMapActive = await evalInPage(cdp, `
    const text = document.querySelector('.itw-planning-desk')?.innerText.toLowerCase() || '';
    return text.includes("logical presentation roadmap") || text.includes("visible task dependencies");
  `);
  record("Check 11a: Perspective Switches to Workflow Map", workflowMapActive);

  // Switch back to Horizon board
  await evalInPage(cdp, `
    const btns = Array.from(document.querySelectorAll('.itw-planning-desk button'));
    const horizonBtn = btns.find(b => b.textContent.includes('Now / Next / Later Board'));
    if (horizonBtn) horizonBtn.click();
  `);
  await sleep(350);

  const statePreserved = await evalInPage(cdp, `
    document.querySelector('.itw-planning-desk')?.innerText.includes("2 of 5 Completed")
  `);
  record("Check 11b: Task State Preserved Across Perspective Switches While Mounted", statePreserved);

  await capture("03_executive_planning_desk.png");

  // ============================================================================
  // SUITE 4: INDIVIDUAL 320PX RESPONSIVE OVERFLOW & CONTROL CLIPPING CHECKS
  // ============================================================================
  console.log("\n--- SUITE 4: Individual 320px Viewport Responsive Geometry ---");

  // 1. Speech & Language 320px
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience?module=speech" });
  await pollSelector(cdp, ".itw-studio-wrap", 15000);
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 320,
    height: 640,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(500);

  const speech320 = await evalInPage(cdp, `({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    hasOverflow: document.documentElement.scrollWidth > 320,
    containerInViewport: !!document.querySelector('.itw-studio-wrap'),
    controlsVisible: !!document.querySelector('.itw-studio-wrap button')
  })`);
  record("320px Viewport: Speech & Language No Overflow & Controls Visible", !speech320.hasOverflow && speech320.controlsVisible, `scrollWidth=${speech320.scrollWidth}`);
  await capture("04_responsive_320px_speech.png", 320, 640, true);

  // 2. Dyscalculia 320px
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience?module=dyscalculia" });
  await pollSelector(cdp, ".itw-kitchen-wrap", 15000);
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 320,
    height: 640,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(500);

  const dyscalc320 = await evalInPage(cdp, `({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    hasOverflow: document.documentElement.scrollWidth > 320,
    containerInViewport: !!document.querySelector('.itw-kitchen-wrap'),
    steppersVisible: !!document.querySelector('button[aria-label="Increase Fresh Lemons"]')
  })`);
  record("320px Viewport: Dyscalculia No Overflow & Steppers Visible", !dyscalc320.hasOverflow && dyscalc320.steppersVisible, `scrollWidth=${dyscalc320.scrollWidth}`);
  await capture("05_responsive_320px_dyscalculia.png", 320, 640, true);

  // 3. Executive Functioning 320px
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience?module=executive" });
  await pollSelector(cdp, ".itw-planning-desk", 15000);
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 320,
    height: 640,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(500);

  const exec320 = await evalInPage(cdp, `({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    hasOverflow: document.documentElement.scrollWidth > 320,
    containerInViewport: !!document.querySelector('.itw-planning-desk'),
    columnsVisible: !!document.querySelector('[data-status-column="now"]')
  })`);
  record("320px Viewport: Executive Functioning No Overflow & Columns Visible", !exec320.hasOverflow && exec320.columnsVisible, `scrollWidth=${exec320.scrollWidth}`);
  await capture("06_responsive_320px_executive.png", 320, 640, true);

  // Clean up CDP & Chrome
  cdp.close();
  cleanup();

  // Summary
  console.log("\n=== PACKET 9.3 RUNTIME VERIFICATION SUMMARY ===");
  let passedCount = 0;
  let failedCount = 0;

  for (const r of results) {
    if (r.passed) passedCount++;
    else failedCount++;
  }

  console.log(`TOTAL RUNTIME CHECKS: ${results.length}`);
  console.log(`PASSED: ${passedCount}`);
  console.log(`FAILED: ${failedCount}`);
  console.log("===============================================\n");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log("🎉 ALL PACKET 9.3 HARDENED RUNTIME CHECKS PASSED!\n");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("Runtime test execution failed:", err);
  process.exit(1);
});
