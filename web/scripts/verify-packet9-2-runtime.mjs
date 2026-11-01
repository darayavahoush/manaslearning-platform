import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9242;
const DOCS_DIR = path.resolve(__dirname, "../docs/itw/screenshots/packet9_2");

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
  console.log("=== IN THEIR WORLD: PACKET 9.2 GENUINE RUNTIME BROWSER VERIFICATION ===");
  console.log(`Starting headless Chrome on port ${PORT}...`);

  const tmpUserDir = `/tmp/chrome-packet92-runtime-${Date.now()}`;
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

  async function capture(filename, width = 1440, height = 900) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: false,
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
  console.log("--- SUITE 1: Speech & Language Interactive Studio Runtime ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience?module=speech" });
  
  const studioReady = await pollSelector(cdp, ".itw-studio-wrap", 15000);
  record("Studio Component Hydration", studioReady, "Found .itw-studio-wrap");

  if (studioReady) {
    // Helper to get turn text at given 0-based index
    const getTurnText = async (idx) => {
      return await evalInPage(cdp, `
        const turns = Array.from(document.querySelectorAll('.itw-studio-wrap div[style*="flex-direction: column; gap: 12px"] > div, .itw-studio-wrap div[style*="flex-direction: column"][style*="gap: 12px"] > div'));
        return turns[${idx}] ? turns[${idx}].innerText : '';
      `);
    };

    // 1. Initial State: Stuttering scenario, give_time + no_finish active
    const initialTurnText = await getTurnText(2);
    const initialPatient = initialTurnText.toLowerCase().includes("waits quietly and attentively");
    record("Initial Dynamic Dialogue Turn 3 (Patient Pacing)", initialPatient, initialTurnText.slice(0, 50));

    // 2. Toggle Practice 1: Disable "Allow Unhurried Time" (give_time)
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

    // 3. Toggle Practice 2: Disable "Never Finish Sentences" (no_finish)
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

    // 4. Toggle Practice 1 Back ON (give_time ON, no_finish OFF)
    await evalInPage(cdp, `
      const btns = Array.from(document.querySelectorAll('.itw-studio-wrap button'));
      const pacingBtn = btns.find(b => b.textContent.includes('Allow Unhurried Time'));
      if (pacingBtn) pacingBtn.click();
    `);
    await sleep(300);

    const toggle3TurnText = await getTurnText(2);
    const toggle3Changed = toggle3TurnText.toLowerCase().includes("classmate (jumping in)");
    record("Dialogue Reactive Change on Re-enabling Pacing Alone", toggle3Changed, toggle3TurnText.slice(0, 45));

    // 5. Toggle Practice 2 Back ON (Both ON again)
    await evalInPage(cdp, `
      const btns = Array.from(document.querySelectorAll('.itw-studio-wrap button'));
      const finishBtn = btns.find(b => b.textContent.includes('Never Finish Sentences'));
      if (finishBtn) finishBtn.click();
    `);
    await sleep(300);

    const toggle4TurnText = await getTurnText(2);
    record("Dialogue Returns to Patient Pacing on Re-enabling Both", toggle4TurnText.toLowerCase().includes("waits quietly and attentively"));

    await capture("01_speech_dialogue_reactive.png");

    // 6. AAC Voice Output Independence & Synthesis Verification
    console.log("  Testing Scenario B: AAC Device & Independent Voice Output...");
    await evalInPage(cdp, `
      const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
      const bTab = tabs.find(t => t.textContent.includes('Scenario B'));
      if (bTab) bTab.click();
    `);
    await sleep(500);

    // Install Web Speech API spy on window and SpeechSynthesis prototype
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

    // Click 2 AAC tiles: "Sand Layer" and "Clean Water"
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
    await sleep(350);

    // Click explicit "Play Message" button
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

    // Click explicit "Stop Message" button
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
    record("Accessible Status Announcement for Stop", stopAnnouncement.includes("Speech output stopped") || stopAnnouncement.includes("stopped"));

    // Click explicit "Clear Message" button
    await evalInPage(cdp, `
      const buttons = Array.from(document.querySelectorAll('.itw-studio-wrap button'));
      const clearBtn = buttons.find(b => b.textContent.includes('Clear Message'));
      if (clearBtn) clearBtn.click();
    `);
    await sleep(250);

    const clearAnnouncement = await evalInPage(cdp, `
      document.querySelector('[aria-live="polite"]')?.innerText || ''
    `);
    record("AAC Clear Message Resets State", clearAnnouncement.includes("AAC message cleared"));

    // Scenario switch cleanup: verify speech is cancelled
    await evalInPage(cdp, `
      window.__speechCancelled = false;
      const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
      const cTab = tabs.find(t => t.textContent.includes('Scenario C'));
      if (cTab) cTab.click();
    `);
    await sleep(400);

    const switchCleanup = await evalInPage(cdp, `window.__speechCancelled === true`);
    record("SpeechSynthesis Cancelled on Scenario Switch", switchCleanup);

    // 7. Scenario C: Check Natural Pacing Phrasing (No rigid 1.5s / 6s / 1s)
    const scenarioCText = await getTurnText(1);
    const hasNoRigidTimers = !scenarioCText.includes("6 seconds") && !scenarioCText.includes("1.5 seconds") && !scenarioCText.includes("1 second");
    const hasNaturalPause = scenarioCText.includes("unhurried pause");
    record("Scenario C Uses Natural Pacing Phrasing (No Rigid Seconds)", hasNoRigidTimers && hasNaturalPause, scenarioCText.slice(0, 60));

    await capture("02_speech_aac_voice_output.png");
  }

  // ============================================================================
  // SUITE 2: DYSCALCULIA THE QUANTITY KITCHEN
  // ============================================================================
  console.log("\n--- SUITE 2: Dyscalculia The Quantity Kitchen Runtime ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience?module=dyscalculia" });

  const kitchenReady = await pollSelector(cdp, ".itw-kitchen-wrap", 15000);
  record("The Quantity Kitchen Hydration", kitchenReady, "Found .itw-kitchen-wrap");

  if (kitchenReady) {
    // 1. Initial Lemons Value
    const initialLemons = await evalInPage(cdp, `
      document.querySelector('button[aria-label="Increase Fresh Lemons"]')?.previousElementSibling?.innerText || ''
    `);
    record("Initial Lemons Value is Base Recipe (2)", initialLemons.trim() === "2", `Value: ${initialLemons}`);

    // 2. Adjust Lemons Quantity with + stepper
    await evalInPage(cdp, `
      document.querySelector('button[aria-label="Increase Fresh Lemons"]')?.click();
    `);
    await sleep(250);

    const incrementedLemons = await evalInPage(cdp, `
      document.querySelector('button[aria-label="Increase Fresh Lemons"]')?.previousElementSibling?.innerText || ''
    `);
    record("Lemons Increments Live to 3", incrementedLemons.trim() === "3", `Value: ${incrementedLemons}`);

    // Click + again to reach target 4
    await evalInPage(cdp, `
      document.querySelector('button[aria-label="Increase Fresh Lemons"]')?.click();
    `);
    await sleep(250);

    const targetLemons = await evalInPage(cdp, `
      document.querySelector('button[aria-label="Increase Fresh Lemons"]')?.previousElementSibling?.innerText || ''
    `);
    record("Lemons Reaches Doubled Target 4", targetLemons.trim() === "4", `Value: ${targetLemons}`);

    // Click - to test decrement
    await evalInPage(cdp, `
      document.querySelector('button[aria-label="Decrease Fresh Lemons"]')?.click();
    `);
    await sleep(250);

    const decrementedLemons = await evalInPage(cdp, `
      document.querySelector('button[aria-label="Increase Fresh Lemons"]')?.previousElementSibling?.innerText || ''
    `);
    record("Lemons Decrements Live to 3", decrementedLemons.trim() === "3", `Value: ${decrementedLemons}`);

    // Return to target 4
    await evalInPage(cdp, `
      document.querySelector('button[aria-label="Increase Fresh Lemons"]')?.click();
    `);
    await sleep(250);

    // 3. Switch Representation Modes: Grouped -> Bar Chart -> Numeric
    // Check initial viewMode is "grouped"
    const groupedBtnAria = await evalInPage(cdp, `
      const btns = Array.from(document.querySelectorAll('.itw-kitchen-wrap button'));
      const gBtn = btns.find(b => b.textContent.includes('Grouped Visual Sets'));
      return gBtn?.getAttribute('aria-pressed');
    `);
    record("Grouped View Initially Selected with aria-pressed=true", groupedBtnAria === "true");

    // Switch to Bar Chart View
    await evalInPage(cdp, `
      const btns = Array.from(document.querySelectorAll('.itw-kitchen-wrap button'));
      const bBtn = btns.find(b => b.textContent.includes('Proportional Ratio Strip'));
      if (bBtn) bBtn.click();
    `);
    await sleep(300);

    const barBtnAria = await evalInPage(cdp, `
      const btns = Array.from(document.querySelectorAll('.itw-kitchen-wrap button'));
      const bBtn = btns.find(b => b.textContent.includes('Proportional Ratio Strip'));
      return bBtn?.getAttribute('aria-pressed');
    `);
    const barLemonsRetained = await evalInPage(cdp, `
      document.querySelector('button[aria-label="Increase Fresh Lemons"]')?.previousElementSibling?.innerText || ''
    `);
    record("Bar Chart View Selected with aria-pressed=true", barBtnAria === "true");
    record("Quantity Retained Across Grouped -> Bar Transition", barLemonsRetained.trim() === "4", `Lemons=${barLemonsRetained}`);

    // Switch to Numeric Scaling Breakdown View
    await evalInPage(cdp, `
      const btns = Array.from(document.querySelectorAll('.itw-kitchen-wrap button'));
      const nBtn = btns.find(b => b.textContent.includes('Pure Numeric'));
      if (nBtn) nBtn.click();
    `);
    await sleep(300);

    const numBtnAria = await evalInPage(cdp, `
      const btns = Array.from(document.querySelectorAll('.itw-kitchen-wrap button'));
      const nBtn = btns.find(b => b.textContent.includes('Pure Numeric'));
      return nBtn?.getAttribute('aria-pressed');
    `);
    const numericCardContent = await evalInPage(cdp, `
      document.querySelector('.itw-kitchen-wrap')?.innerText || ''
    `);

    const hasBase = numericCardContent.toLowerCase().includes("base recipe (2 servings)");
    const hasMultiplier = numericCardContent.toLowerCase().includes("scaling multiplier");
    const hasTarget = numericCardContent.toLowerCase().includes("target (4 servings)");
    const hasDifference = numericCardContent.toLowerCase().includes("difference") || numericCardContent.toLowerCase().includes("target matched");

    record("Numeric View Selected with aria-pressed=true", numBtnAria === "true");
    record("Numeric View Displays Base, Multiplier, Target & Difference", hasBase && hasMultiplier && hasTarget && hasDifference, "All 4 metrics present");

    await capture("03_dyscalculia_steppers_and_views.png");
  }

  // ============================================================================
  // SUITE 3: EXECUTIVE FUNCTIONING THE PROJECT PLANNING DESK
  // ============================================================================
  console.log("\n--- SUITE 3: Executive Functioning The Project Planning Desk Runtime ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience?module=executive" });

  const execReady = await pollSelector(cdp, ".itw-planning-desk", 15000);
  record("The Project Planning Desk Hydration", execReady, "Found .itw-planning-desk");

  if (execReady) {
    // 1. Initial Task Distribution: Task 2 in NOW column
    const initialNowCard = await evalInPage(cdp, `
      document.querySelector('.itw-planning-desk')?.innerText || ''
    `);
    record("Task 2 Initially in NOW Column", initialNowCard.includes("Find Two Reliable Sources"));

    // 2. Move Task 2 to NEXT
    await evalInPage(cdp, `
      const moveBtn = document.querySelector('.itw-planning-desk button[title*="Next column"]');
      if (moveBtn) moveBtn.click();
    `);
    await sleep(300);

    const task2InNext = await evalInPage(cdp, `
      const deskText = document.querySelector('.itw-planning-desk')?.innerText || '';
      return deskText.includes("No task currently in NOW") && deskText.includes("Find Two Reliable Sources");
    `);
    record("Task 2 Moves from NOW to NEXT", task2InNext);

    // 3. Move Task 2 back to NOW
    await evalInPage(cdp, `
      const btns = Array.from(document.querySelectorAll('.itw-planning-desk button'));
      const moveNowBtn = btns.find(b => b.textContent.includes('Move to NOW'));
      if (moveNowBtn) moveNowBtn.click();
    `);
    await sleep(300);

    const task2BackInNow = await evalInPage(cdp, `
      const deskText = document.querySelector('.itw-planning-desk')?.innerText || '';
      return !deskText.includes("No task currently in NOW") && deskText.includes("Find Two Reliable Sources");
    `);
    record("Task 2 Moves Back from NEXT to NOW", task2BackInNow);

    // 4. Move Task 2 to LATER
    await evalInPage(cdp, `
      const moveLaterBtn = document.querySelector('.itw-planning-desk button[title*="Later column"]');
      if (moveLaterBtn) moveLaterBtn.click();
    `);
    await sleep(300);

    const task2InLater = await evalInPage(cdp, `
      const deskText = document.querySelector('.itw-planning-desk')?.innerText || '';
      return deskText.includes("No task currently in NOW") && deskText.includes("Find Two Reliable Sources");
    `);
    record("Task 2 Moves from NOW to LATER", task2InLater);

    // 5. Move Task 2 from LATER back to NOW
    await evalInPage(cdp, `
      const btns = Array.from(document.querySelectorAll('.itw-planning-desk button'));
      const moveNowBtn = btns.find(b => b.textContent.includes('Move to NOW'));
      if (moveNowBtn) moveNowBtn.click();
    `);
    await sleep(300);

    const task2NowRestored = await evalInPage(cdp, `
      const deskText = document.querySelector('.itw-planning-desk')?.innerText || '';
      return !deskText.includes("No task currently in NOW") && deskText.includes("Find Two Reliable Sources");
    `);
    record("Task 2 Moves from LATER back to NOW", task2NowRestored);

    // 6. Mark Task 2 Complete (both Task 1 and Task 2 completed -> 2 of 5 Completed)
    await evalInPage(cdp, `
      const btns = Array.from(document.querySelectorAll('.itw-planning-desk button'));
      const completeBtn = btns.find(b => b.textContent.includes('Mark Done'));
      if (completeBtn) completeBtn.click();
    `);
    await sleep(300);

    const completionCountText = await evalInPage(cdp, `
      document.body.innerText.includes("2 of 5 Completed")
    `);
    record("Task 2 Marked Complete (2 of 5 Completed)", completionCountText);

    await capture("04_executive_task_movement.png");

    // 7. Edit All Three Next-Action Reminder Fields using native setter for React controlled inputs
    console.log("  Testing Next-Action Reminder (Externalized Working Memory Anchor)...");
    await evalInPage(cdp, `
      const inputs = document.querySelectorAll('.itw-planning-desk input[type="text"]');
      const setVal = (el, val) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };

      if (inputs.length >= 3) {
        setVal(inputs[0], "Reviewed lake ecology literature");
        setVal(inputs[1], "Extract dissolved oxygen stats");
        setVal(inputs[2], "Wetland survey PDF bookmark");
      }
    `);
    await sleep(250);

    const reminderValues = await evalInPage(cdp, `
      Array.from(document.querySelectorAll('.itw-planning-desk input[type="text"]')).map(i => i.value)
    `);
    const reminderEdited = reminderValues[0] === "Reviewed lake ecology literature" &&
                           reminderValues[1] === "Extract dissolved oxygen stats" &&
                           reminderValues[2] === "Wetland survey PDF bookmark";
    record("All 3 Next-Action Fields Editable Live", reminderEdited, reminderValues.join(" | "));

    // 8. Select Change-of-Plan Option
    console.log("  Testing Change-of-Plan Adaptive Scenario...");
    const triggerClicked = await evalInPage(cdp, `
      const btns = Array.from(document.querySelectorAll('.itw-planning-desk button'));
      const triggerBtn = btns.find(b => b.textContent.includes('Change-of-Plan Scenario'));
      if (triggerBtn) {
        triggerBtn.click();
        return true;
      }
      return false;
    `);
    await sleep(500);

    const strategyClicked = await evalInPage(cdp, `
      const btns = Array.from(document.querySelectorAll('button'));
      const strategyBtn = btns.find(b => b.textContent.includes('Find an Alternate Source'));
      if (strategyBtn) {
        strategyBtn.click();
        return true;
      }
      return false;
    `);
    await sleep(500);

    const updatedNextStep = await evalInPage(cdp, `
      const inputs = document.querySelectorAll('.itw-planning-desk input[type="text"]');
      return inputs[1]?.value || '';
    `);
    const planUpdated = updatedNextStep.toLowerCase().includes("wetland archive") || updatedNextStep.toLowerCase().includes("bellandur");
    record("Change-of-Plan Strategy Updates Next-Action Reminder", planUpdated && strategyClicked, `updated="${updatedNextStep}", trig=${triggerClicked}, strat=${strategyClicked}`);

    // 9. Perspective Switch: In-Module State Retention
    console.log("  Testing Perspective Switch In-Module State Retention...");
    // Switch to Workflow Map
    await evalInPage(cdp, `
      const btns = Array.from(document.querySelectorAll('.itw-planning-desk button'));
      const mapBtn = btns.find(b => b.textContent.includes('Visual Workflow Map'));
      if (mapBtn) mapBtn.click();
    `);
    await sleep(500);

    const workflowMapVisible = await evalInPage(cdp, `
      const text = (document.querySelector('.itw-planning-desk')?.innerText || '').toLowerCase();
      return text.includes("logical presentation roadmap") ||
             text.includes("visible task dependencies") ||
             text.includes("precedents");
    `);
    record("Perspective Switches to Workflow Map", workflowMapVisible);

    // Switch back to Horizon View
    await evalInPage(cdp, `
      const btns = Array.from(document.querySelectorAll('.itw-planning-desk button'));
      const horizonBtn = btns.find(b => b.textContent.includes('Now / Next / Later Board'));
      if (horizonBtn) horizonBtn.click();
    `);
    await sleep(350);

    const stateRetained = await evalInPage(cdp, `
      document.body.innerText.includes("2 of 5 Completed")
    `);
    record("Task State Retained Across Perspective Transitions", stateRetained);

    await capture("05_executive_change_of_plan.png");
  }

  // ============================================================================
  // SUITE 4: RESPONSIVE VIEWPORT & 320PX OVERFLOW
  // ============================================================================
  console.log("\n--- SUITE 4: Responsive Viewport & Semantic Accessibility ---");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 320,
    height: 640,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await sleep(500);

  const overflowRes = await evalInPage(cdp, `({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > 320
  })`);
  record("320px Viewport No Horizontal Overflow", !overflowRes?.hasHorizontalOverflow, `scrollWidth=${overflowRes?.scrollWidth}`);

  // Clean up CDP & Chrome
  cdp.close();
  cleanup();

  // Summary
  console.log("\n=== RUNTIME VERIFICATION SUMMARY ===");
  let passedCount = 0;
  let failedCount = 0;

  for (const r of results) {
    if (r.passed) passedCount++;
    else failedCount++;
  }

  console.log(`TOTAL RUNTIME CHECKS: ${results.length}`);
  console.log(`PASSED: ${passedCount}`);
  console.log(`FAILED: ${failedCount}`);
  console.log("=====================================\n");

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log("🎉 ALL PACKET 9.2 RUNTIME CHECKS PASSED!\n");
    process.exit(0);
  }
}

run().catch((err) => {
  console.error("Runtime test execution failed:", err);
  process.exit(1);
});
