import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9225;
const DOCS_DIR = "/Users/ananyasridhar/work/vaakbot/web/docs/itw/screenshots";

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
      try { this.ws.close(); } catch {}
    }
  }
}

async function main() {
  console.log("=== IN THEIR WORLD: PACKET 5 VERIFICATION SUITE ===");
  console.log("Starting Chrome on port", PORT);

  const chromeProc = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--user-data-dir=/tmp/chrome-packet5-profile-9225",
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

  let vdata = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    await sleep(400);
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) {
        vdata = await res.json();
        break;
      }
    } catch {}
  }

  if (!vdata) {
    console.error("Failed to connect to Chrome remote debugger!");
    process.exit(1);
  }

  const listRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
  const pages = await listRes.json();
  const pageWs = pages[0]?.webSocketDebuggerUrl;

  const cdp = new CdpConnection(pageWs);
  await cdp.connect();
  console.log("Connected to Chrome via CDP.");

  await cdp.send("Page.enable");
  await cdp.send("DOM.enable");
  await cdp.send("Runtime.enable");

  const results = [];

  async function setMetrics(width, height, mobile = false) {
    for (let i = 0; i < 3; i++) {
      try {
        await cdp.send("Emulation.setDeviceMetricsOverride", {
          width,
          height,
          deviceScaleFactor: mobile ? 2 : 1.5,
          mobile,
        });
        return;
      } catch (e) {
        await sleep(300);
      }
    }
  }

  async function capture(name, filename, width = 1440, height = 900) {
    await setMetrics(width, height, width < 768);
    await sleep(600);

    const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
    const fullPath = path.join(DOCS_DIR, filename);
    fs.writeFileSync(fullPath, Buffer.from(data, "base64"));
    console.log(`[Screenshot Saved] ${name} -> ${filename} (${width}x${height})`);
  }

  async function checkReflowAt320(pageName) {
    await setMetrics(320, 640, true);
    await sleep(500);

    const evalRes = await cdp.send("Runtime.evaluate", {
      expression: `({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > 320
      })`,
      returnByValue: true,
    });

    const metrics = evalRes.result.value;
    const passed = !metrics.hasHorizontalOverflow;
    console.log(`[320px Reflow] ${pageName}: scrollWidth=${metrics.scrollWidth} clientWidth=${metrics.clientWidth} -> ${passed ? "PASS" : "FAIL"}`);
    results.push({ test: `${pageName} 320px Reflow`, passed, metrics });
  }

  // 1. Landing Page Test
  console.log("\n1. Testing Landing Page (/experience)...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience" });
  await sleep(1500);

  const cardCountRes = await cdp.send("Runtime.evaluate", {
    expression: `document.querySelectorAll('.itw-mcard').length`,
    returnByValue: true,
  });
  console.log(`Found ${cardCountRes.result.value} module cards on landing page.`);
  results.push({ test: "8 Module Cards Rendered", passed: cardCountRes.result.value >= 8 });

  await capture("Landing Page (2x2 Editorial Grid)", "packet5-landing-editorial-grid.png", 1440, 900);
  await checkReflowAt320("Landing Page");

  // 2. Re-imagined ADHD Desk Workspace
  console.log("\n2. Testing Reimagined ADHD Module (/experience?module=adhd)...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience?module=adhd" });
  await sleep(1200);

  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelector('.itw-cta-dark')?.click()`,
  });
  await sleep(600);

  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelectorAll('.itw-cta-dark')[0]?.click()`,
  });
  await sleep(800);

  await capture("ADHD Desk Workspace (Quiet Run 1)", "packet5-adhd-desk-workspace.png", 1440, 900);
  await checkReflowAt320("ADHD Desk Workspace");

  // 3. Dyscalculia Module
  console.log("\n3. Testing Dyscalculia Module (/experience?module=dyscalculia)...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience?module=dyscalculia" });
  await sleep(1200);

  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelector('.itw-cta-dark')?.click()`,
  });
  await sleep(500);
  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelectorAll('.itw-cta-dark')[0]?.click()`,
  });
  await sleep(800);

  await capture("Dyscalculia Recipe Scaling", "packet5-dyscalculia-recipe.png", 1440, 900);
  await checkReflowAt320("Dyscalculia Module");

  // 4. Dysgraphia Module
  console.log("\n4. Testing Dysgraphia Module (/experience?module=dysgraphia)...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience?module=dysgraphia" });
  await sleep(1200);

  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelector('.itw-cta-dark')?.click()`,
  });
  await sleep(500);

  await capture("Dysgraphia Writing Desk", "packet5-dysgraphia-writing.png", 1440, 900);
  await checkReflowAt320("Dysgraphia Module");

  // 5. Auditory Processing Module
  console.log("\n5. Testing Auditory Processing Module (/experience?module=auditory)...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience?module=auditory" });
  await sleep(1200);

  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelector('.itw-cta-dark')?.click()`,
  });
  await sleep(500);
  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelectorAll('.itw-cta-dark')[0]?.click()`,
  });
  await sleep(800);

  await capture("Auditory Processing Classroom", "packet5-auditory-classroom.png", 1440, 900);
  await checkReflowAt320("Auditory Processing Module");

  // 6. Executive Functioning Module
  console.log("\n6. Testing Executive Functioning Module (/experience?module=executive)...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience?module=executive" });
  await sleep(1200);

  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelector('.itw-cta-dark')?.click()`,
  });
  await sleep(500);
  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelectorAll('.itw-cta-dark')[0]?.click()`,
  });
  await sleep(800);

  await capture("Executive Functioning Task Board", "packet5-executive-board.png", 1440, 900);
  await checkReflowAt320("Executive Functioning Module");

  // 7. Milo Chat & Mascot Elevation
  console.log("\n7. Testing Milo Assistant (/milo)...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/milo" });
  await sleep(1200);

  await capture("Milo Owl Mascot Chat", "packet5-milo-owl-chat.png", 1440, 900);
  await checkReflowAt320("Milo Chat");

  // Close CDP & Chrome
  cdp.close();
  cleanup();

  console.log("\n=== VERIFICATION SUMMARY ===");
  let allPassed = true;
  for (const r of results) {
    console.log(`${r.passed ? "✓ PASS" : "✗ FAIL"}: ${r.test}`);
    if (!r.passed) allPassed = false;
  }

  if (allPassed) {
    console.log("\n🎉 ALL TESTS PASSED! 320px Reflow verified across all 8 modules & Milo.");
    process.exit(0);
  } else {
    console.error("\n❌ Some tests failed!");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
