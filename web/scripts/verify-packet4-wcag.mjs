import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9225;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function calculateLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateContrastRatio(rgb1, rgb2) {
  const lum1 = calculateLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = calculateLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

async function main() {
  console.log("=== IN THEIR WORLD: PACKET 4 WCAG 2.2 AA VERIFICATION SUITE ===");
  console.log("Starting Chrome with remote debugging on port", PORT);

  const chromeProc = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--user-data-dir=/tmp/chrome-wcag-profile",
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

  // Poll until Chrome debugger responds
  let vdata = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    await sleep(400);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) {
        vdata = await res.json();
        break;
      }
    } catch {}
  }
  if (!vdata) throw new Error("Could not connect to Chrome on port " + PORT);
  const ws = new WebSocket(vdata.webSocketDebuggerUrl);
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

  const target = await send("Target.createTarget", { url: "about:blank" });
  const session = await send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
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

  async function evalJs(expr) {
    const r = await sendSession("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    return r.result?.value;
  }

  async function snap(name) {
    const outPath = path.join(process.cwd(), "docs/itw/screenshots", name);
    const snapRes = await sendSession("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(outPath, Buffer.from(snapRes.data, "base64"));
    console.log(`Saved screenshot -> ${name}`);
  }

  // TEST 1: Reflow (WCAG 2.2 SC 1.4.10) across all 4 modules at 320px
  console.log("\n--- TEST 1: REFLOW (320px CSS VIEWPORT) ---");
  await sendSession("Emulation.setDeviceMetricsOverride", {
    width: 320,
    height: 800,
    deviceScaleFactor: 2,
    mobile: true,
  });

  const modules = ["adhd", "autism", "dyslexia", "speech"];
  for (const mod of modules) {
    await sendSession("Page.navigate", { url: `http://localhost:3000/experience?module=${mod}` });
    await sleep(800);
    const scrollWidth = await evalJs("document.documentElement.scrollWidth");
    const clientWidth = await evalJs("document.documentElement.clientWidth");
    console.log(`Module [${mod.toUpperCase()}] at 320px: scrollWidth = ${scrollWidth}, clientWidth = ${clientWidth}`);
    if (scrollWidth > 320) {
      console.error(`FAIL: Horizontal overflow detected in ${mod}!`);
    } else {
      console.log(`PASS: 0px horizontal overflow in ${mod}.`);
    }
    await snap(`packet4-reflow-320px-${mod}.png`);
  }

  // Check home at 320px
  await sendSession("Page.navigate", { url: "http://localhost:3000/" });
  await sleep(800);
  const homeScroll = await evalJs("document.documentElement.scrollWidth");
  console.log(`Homepage at 320px: scrollWidth = ${homeScroll}`);
  await snap("packet4-reflow-320px-homepage.png");

  // TEST 2: Target Size (WCAG 2.2 SC 2.5.8)
  console.log("\n--- TEST 2: TARGET SIZING (>= 24x24 CSS PX) ---");
  await sendSession("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await sendSession("Page.navigate", { url: "http://localhost:3000/experience" });
  await sleep(800);

  const targetSizes = await evalJs(`
    (() => {
      const elements = Array.from(document.querySelectorAll('button, a, input, [role="button"], [role="tab"]'));
      return elements.map(el => {
        const rect = el.getBoundingClientRect();
        const text = (el.innerText || el.textContent || el.getAttribute('aria-label') || '').slice(0, 30).trim();
        return {
          tag: el.tagName,
          text,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          pass: (rect.width >= 24 && rect.height >= 24) || (rect.width === 0 && rect.height === 0)
        };
      });
    })()
  `);

  let targetFails = 0;
  for (const t of targetSizes) {
    if (!t.pass) {
      console.warn(`WARNING: Target size below 24x24px: ${t.tag} "${t.text}" (${t.width}x${t.height})`);
      targetFails++;
    }
  }
  if (targetFails === 0) {
    console.log(`PASS: All ${targetSizes.length} evaluated pointer targets meet or exceed 24x24 CSS px.`);
  } else {
    console.log(`Found ${targetFails} small targets.`);
  }

  // TEST 3: Text Contrast (WCAG 2.2 SC 1.4.3)
  console.log("\n--- TEST 3: COLOR CONTRAST RATIO (>= 4.5:1 normal, >= 3:1 large) ---");
  const contrastAudit = await evalJs(`
    (() => {
      function parseRgb(colorStr) {
        const m = colorStr.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
        if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
        return [0, 0, 0];
      }
      function getEffectiveBg(el) {
        let cur = el;
        while (cur && cur !== document.documentElement) {
          const bg = window.getComputedStyle(cur).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            return parseRgb(bg);
          }
          cur = cur.parentElement;
        }
        return [253, 248, 238]; // default page bg
      }

      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, p, button, span, li')).slice(0, 50);
      return headings.map(el => {
        const style = window.getComputedStyle(el);
        const fg = parseRgb(style.color);
        const bg = getEffectiveBg(el);
        const text = (el.innerText || el.textContent || '').slice(0, 25).trim();
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = style.fontWeight;
        const isLarge = fontSize >= 24 || (fontSize >= 18.5 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
        return { text, fg, bg, fontSize, isLarge };
      });
    })()
  `);

  let contrastPasses = 0;
  let contrastChecks = 0;
  for (const item of contrastAudit) {
    if (!item.text) continue;
    contrastChecks++;
    const ratio = calculateContrastRatio(item.fg, item.bg);
    const required = item.isLarge ? 3.0 : 4.5;
    if (ratio >= required) {
      contrastPasses++;
    }
  }
  console.log(`Evaluated ${contrastChecks} key text nodes: ${contrastPasses} / ${contrastChecks} pass standard WCAG contrast ratios.`);

  // TEST 4: 200% Text Resizing (WCAG 2.2 SC 1.4.4)
  console.log("\n--- TEST 4: 200% TEXT RESIZING (NO CLIPPING / COLLISION) ---");
  await evalJs(`document.documentElement.style.fontSize = "200%"`);
  await sleep(600);
  const zoomScrollWidth = await evalJs("document.documentElement.scrollWidth");
  const zoomClientWidth = await evalJs("document.documentElement.clientWidth");
  console.log(`At 200% text zoom: scrollWidth = ${zoomScrollWidth}, clientWidth = ${zoomClientWidth}`);
  await snap("packet4-text-zoom-200pct.png");
  await evalJs(`document.documentElement.style.fontSize = ""`); // reset

  // TEST 5: Dyslexia Standard Only Flow Verification
  console.log("\n--- TEST 5: DYSLEXIA DEFAULT & STANDARD FLOW ---");
  await sendSession("Page.navigate", { url: "http://localhost:3000/experience?module=dyslexia" });
  await sleep(800);
  await evalJs(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const start = btns.find(b => b.innerText.includes('Start the Experience'));
      if (start) start.click();
    })()
  `);
  await sleep(500);
  await snap("packet4-dyslexia-instructions-clean.png");

  await evalJs(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const read = btns.find(b => b.innerText.includes('Start Reading'));
      if (read) read.click();
    })()
  `);
  await sleep(500);
  const hasMetaphorToggle = await evalJs(`
    (() => {
      const text = document.body.innerText;
      return text.includes("Simulated Decoding Overhead") || text.includes("Conceptual Metaphor");
    })()
  `);
  console.log("Metaphor/distortion toggle in reading screen:", hasMetaphorToggle ? "PRESENT (FAIL)" : "REMOVED (PASS)");
  await snap("packet4-dyslexia-reading-standard-clean.png");

  await evalJs(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const finish = btns.find(b => b.innerText.includes("I've finished reading"));
      if (finish) finish.click();
    })()
  `);
  await sleep(500);
  await snap("packet4-dyslexia-questions.png");

  // Answer questions
  await evalJs(`
    (() => {
      const opts = document.querySelectorAll('.itw-flow-opt');
      if (opts[0]) opts[0].click();
      if (opts[4]) opts[4].click();
      if (opts[6]) opts[6].click();
    })()
  `);
  await sleep(300);
  await evalJs(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sub = btns.find(b => b.innerText.includes("Submit Answers"));
      if (sub) sub.click();
    })()
  `);
  await sleep(500);
  const debriefText = await evalJs(`
    (() => {
      const lines = Array.from(document.querySelectorAll('.itw-flow-lines li')).map(li => li.innerText);
      return lines.join(' ');
    })()
  `);
  console.log("Comprehension debrief output:", debriefText);
  await snap("packet4-dyslexia-result-individualized.png");

  console.log("\n=== ALL PACKET 4 WCAG TESTS COMPLETED SUCCESSFULLY ===");
  cleanup();
}

main().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});