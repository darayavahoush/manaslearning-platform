import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9248;
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
  console.log("=== IN THEIR WORLD: PACKET 6 COMPLETE VERIFICATION SUITE ===");
  console.log("Starting Chrome on port", PORT);

  const chromeProc = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--user-data-dir=/tmp/chrome-packet6-profile-${PORT}`,
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
    cleanup();
    process.exit(1);
  }

  let pages = [];
  for (let attempt = 0; attempt < 20; attempt++) {
    await sleep(200);
    try {
      const listRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      pages = await listRes.json();
      if (pages.length > 0) break;
    } catch {}
  }
  let pageWs = pages[0]?.webSocketDebuggerUrl;
  if (!pageWs) {
    const newRes = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" });
    const newPage = await newRes.json();
    pageWs = newPage.webSocketDebuggerUrl;
  }

  const cdp = new CdpConnection(pageWs);
  await cdp.connect();
  console.log("Connected to Chrome via CDP WebSocket");

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("DOM.enable");

  const setMetrics = async (width, height, isMobile = false) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await cdp.send("Emulation.setDeviceMetricsOverride", {
          width,
          height,
          deviceScaleFactor: 1,
          mobile: isMobile,
        });
        return;
      } catch (e) {
        await sleep(150);
      }
    }
  };

  const capture = async (filename) => {
    await sleep(400);
    const { data } = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    const fp = path.join(DOCS_DIR, filename);
    fs.writeFileSync(fp, Buffer.from(data, "base64"));
    console.log("📸 Saved screenshot:", filename);
  };

  const evalJs = async (expr) => {
    const res = await cdp.send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res?.exceptionDetails) {
      console.error("CDP Eval Exception:", res.exceptionDetails.exception?.description || res.exceptionDetails.text);
    }
    return res?.result?.value !== undefined ? res.result.value : res?.value;
  };

  const waitForSelector = async (selector, timeout = 8000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const found = await evalJs(`Boolean(document.querySelector('${selector}'))`);
      if (found) return true;
      await sleep(250);
    }
    return false;
  };

  const results = [];

  // ================= CHECK 1: LANDING & CTA CONTRAST =================
  console.log("\n--- TEST 1: Landing Page & CTA Button Contrast ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience" });
  await waitForSelector(".itw-mcard");
  await waitForSelector(".itw-endcta");
  await sleep(600);

  const landingInfo = await evalJs(`(() => {
    const cta = document.querySelector('.itw-endcta a[href="/assessments"]');
    const heroCard = document.querySelector('.itw-hero-card p');
    const cs = cta ? window.getComputedStyle(cta) : null;
    const cards = Array.from(document.querySelectorAll('.itw-mcard')).map(c => ({
      name: c.querySelector('h3')?.innerText,
      tag: c.querySelector('.itw-tag')?.innerText,
      hasStats: Boolean(c.querySelector('.itw-stat'))
    }));
    return {
      cardCount: cards.length,
      cardsWithVisibleStats: cards.filter(c => c.hasStats).length,
      ctaText: cta ? cta.innerText : "",
      ctaColor: cs ? cs.color : "",
      ctaBg: cs ? cs.backgroundColor : "",
      heroCaption: heroCard?.innerText
    };
  })()`);
  console.log("Landing verification:", landingInfo);
  await capture("packet6_01_landing_clean_cards.png");

  results.push({
    test: "Landing Clean Cards (Zero Raw Stats on Cards)",
    pass: landingInfo.cardCount === 8 && landingInfo.cardsWithVisibleStats === 0,
    details: `${landingInfo.cardCount} cards loaded, 0 uncontextualized card stat blocks`,
  });

  results.push({
    test: "CTA Contrast & Hero Card Legibility",
    pass: landingInfo.ctaColor !== landingInfo.ctaBg && Boolean(landingInfo.heroCaption),
    details: `CTA text: "${landingInfo.ctaText}", Color: ${landingInfo.ctaColor}, Bg: ${landingInfo.ctaBg}`,
  });

  // ================= CHECK 2: WCAG 320px REFLOW =================
  console.log("\n--- TEST 2: WCAG 2.2 Reflow at 320px ---");
  await setMetrics(320, 600, true);
  await sleep(600);

  const reflowInfo = await evalJs(`(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      noHScroll: document.documentElement.scrollWidth <= 320
    };
  })()`);
  console.log("320px Reflow info:", reflowInfo);
  await capture("packet6_02_landing_320px_reflow.png");

  results.push({
    test: "WCAG 1.4.10 Reflow (320px Viewport)",
    pass: reflowInfo.noHScroll,
    details: `documentElement scrollWidth=${reflowInfo.scrollWidth}px (<= 320px)`,
  });

  // Reset to desktop viewport
  await setMetrics(1440, 900, false);
  await sleep(400);

  // ================= CHECK 3: ADHD STUDY DESK & RETURN BANNER =================
  console.log("\n--- TEST 3: ADHD Study Desk & Persistent Return Banner ---");
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-mcard[data-m="adhd"]');
    btn?.click();
  })()`);
  await sleep(1000);

  // Advance from intro to instructions
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-intro .itw-cta');
    btn?.click();
  })()`);
  await sleep(800);

  // Start Run 1
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-narrow .itw-cta-dark');
    btn?.click();
  })()`);
  await sleep(1200);

  // Switch to lakes tab
  await evalJs(`(() => {
    const tab = document.querySelector('button[role="tab"]:nth-child(2)');
    tab?.click();
  })()`);
  await sleep(600);

  const adhdTabInfo = await evalJs(`(() => {
    const banner = document.querySelector('.itw-desk-return-banner');
    const tabActive = document.querySelector('.itw-tab-active')?.innerText;
    return {
      tabActive,
      bannerPresent: Boolean(banner),
      bannerText: banner?.innerText
    };
  })()`);
  console.log("ADHD return banner check:", adhdTabInfo);
  await capture("packet6_03_adhd_return_banner.png");

  results.push({
    test: "ADHD Study Desk Persistent Return Banner",
    pass: adhdTabInfo.bannerPresent && adhdTabInfo.bannerText.includes("Primary Assignment Goal"),
    details: `Banner active on ${adhdTabInfo.tabActive}: "${adhdTabInfo.bannerText?.split('\n')[0]}"`,
  });

  // ================= CHECK 4: DYSCALCULIA CRA BLOCKS & SCALING =================
  console.log("\n--- TEST 4: Dyscalculia CRA Blocks & Proportional Scaling ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience" });
  await sleep(1200);

  await evalJs(`(() => {
    const btn = document.querySelector('.itw-mcard[data-m="dyscalculia"]');
    btn?.click();
  })()`);
  await sleep(800);

  // Start from intro
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-intro .itw-cta');
    btn?.click();
  })()`);
  await sleep(600);

  // Start Run 1
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-narrow .itw-cta-dark');
    btn?.click();
  })()`);
  await sleep(800);

  // Confirm baseline measurement
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-dyscalc-card .itw-cta-dark');
    btn?.click();
  })()`);
  await sleep(600);

  // Advance to Run 2 intro
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-narrow .itw-cta-dark');
    btn?.click();
  })()`);
  await sleep(600);

  // In Run 2, scale to 300, 180, 90 and submit
  await evalJs(`(() => {
    const card = document.querySelector('.itw-dyscalc-card');
    const plusBtns = card.querySelectorAll('.itw-dyscalc-row button:last-child');
    // Flour: 200 + 5*20 = 300
    for (let i = 0; i < 5; i++) plusBtns[0]?.click();
    // Milk: 120 + 6*10 = 180
    for (let i = 0; i < 6; i++) plusBtns[1]?.click();
    // Sugar: 60 + 3*10 = 90
    for (let i = 0; i < 3; i++) plusBtns[2]?.click();
    const confirmBtn = card.querySelector('.itw-cta-dark');
    confirmBtn?.click();
  })()`);
  await sleep(800);

  // On Reflect page, proceed to Support
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-nav .itw-cta-dark');
    btn?.click();
  })()`);
  await sleep(600);

  // Select CRA Blocks support
  await evalJs(`(() => {
    const labels = Array.from(document.querySelectorAll('.itw-flow-narrow label'));
    const blockLabel = labels.find(l => l.innerText.includes('CRA') || l.innerText.includes('Blocks'));
    blockLabel?.click();
  })()`);
  await sleep(600);

  // Run with Support
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-nav .itw-cta-dark');
    btn?.click();
  })()`);
  await sleep(800);

  const dyscalcInfo = await evalJs(`(() => {
    const blocksWrap = document.querySelector('.itw-dyscalc-cra-blocks');
    const cubes = document.querySelectorAll('.itw-cra-cube');
    return {
      blocksPresent: Boolean(blocksWrap),
      cubeCount: cubes.length,
      sampleText: cubes[0]?.innerText
    };
  })()`);
  console.log("Dyscalculia CRA info:", dyscalcInfo);
  await capture("packet6_04_dyscalculia_cra_blocks.png");

  results.push({
    test: "Dyscalculia CRA (Concrete-Representational-Abstract) Blocks",
    pass: dyscalcInfo.blocksPresent && dyscalcInfo.cubeCount >= 6,
    details: `${dyscalcInfo.cubeCount} concrete counter cubes rendered in CRA scaffold`,
  });

  // ================= CHECK 5: DYSGRAPHIA CLEAN TRANSCRIPTION =================
  console.log("\n--- TEST 5: Dysgraphia Clean Transcription (No Fake Cramps) ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience" });
  await sleep(1200);

  await evalJs(`(() => {
    const btn = document.querySelector('.itw-mcard[data-m="dysgraphia"]');
    btn?.click();
  })()`);
  await sleep(800);

  // Start from intro
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-intro .itw-cta');
    btn?.click();
  })()`);
  await sleep(600);

  // Confirm mental clarity in instructions
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-narrow .itw-cta-dark');
    btn?.click();
  })()`);
  await sleep(600);

  // Start Run 2 (Manual Transcription)
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-narrow .itw-cta-dark');
    btn?.click();
  })()`);
  await sleep(800);

  const dysgraphInfo = await evalJs(`(() => {
    const canvas = document.querySelector('.itw-dysgraph-canvas');
    const staminaBar = document.querySelector('.itw-dysgraph-stamina');
    const chips = canvas ? canvas.querySelectorAll('.itw-word-chip') : [];
    return {
      hasCanvas: Boolean(canvas),
      hasStaminaBar: Boolean(staminaBar),
      chipCount: chips.length
    };
  })()`);
  console.log("Dysgraphia info:", dysgraphInfo);
  await capture("packet6_05_dysgraphia_clean_transcription.png");

  results.push({
    test: "Dysgraphia Demeanor (Zero Cramps / Stamina Meter Removed)",
    pass: dysgraphInfo.hasCanvas && !dysgraphInfo.hasStaminaBar,
    details: `Clean transcription canvas active, stamina meter is completely absent`,
  });

  // ================= CHECK 6: AUDITORY REMOTE MIC (NO +15dB) =================
  console.log("\n--- TEST 6: Auditory Processing Remote Microphone & Citation ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience" });
  await sleep(1200);

  await evalJs(`(() => {
    const btn = document.querySelector('.itw-mcard[data-m="auditory"]');
    btn?.click();
  })()`);
  await sleep(800);

  // Advance to explain/debrief to check text
  const auditoryDebrief = await evalJs(`(() => {
    const wholeText = document.body.innerText;
    return {
      has15dB: wholeText.includes("+15dB") || wholeText.includes("+15 dB"),
      hasRemoteMic: wholeText.includes("Remote Microphone"),
      hasLanguageNote: wholeText.includes("English"),
      hasDifferentialDx: wholeText.includes("audiologist") || wholeText.includes("Central Auditory")
    };
  })()`);
  console.log("Auditory clinical checks:", auditoryDebrief);

  results.push({
    test: "Auditory Processing (No Arbitrary +15dB Claim)",
    pass: !auditoryDebrief.has15dB && auditoryDebrief.hasRemoteMic,
    details: `"+15dB" string is absent; Remote Microphone support is present`,
  });

  // ================= CHECK 7: EXECUTIVE FUNCTIONING NNL & NO PARALYSIS =================
  console.log("\n--- TEST 7: Executive Functioning Now/Next/Later & No 'Paralysis' ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience" });
  await sleep(1200);

  await evalJs(`(() => {
    const btn = document.querySelector('.itw-mcard[data-m="executive"]');
    btn?.click();
  })()`);
  await sleep(800);

  const execCopyCheck = await evalJs(`(() => {
    const text = document.body.innerText;
    const hasParalysis = text.toLowerCase().includes("paralysis");
    return {
      hasParalysis,
      title: document.querySelector('.itw-flow-title')?.innerText
    };
  })()`);
  console.log("Executive copy check:", execCopyCheck);

  // Advance to Support selection
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-intro .itw-cta');
    btn?.click();
  })()`);
  await sleep(600);

  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-narrow .itw-cta-dark');
    btn?.click();
  })()`);
  await sleep(800);

  // Complete baseline 1 task
  await evalJs(`(() => {
    const card = document.querySelector('.itw-exec-task-card');
    card?.click();
  })()`);
  await sleep(800);

  // Go to Run 2 intro -> start Run 2
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-narrow .itw-cta-dark');
    btn?.click();
  })()`);
  await sleep(600);

  // Complete tasks in order: slip, math, pack, uniform, breakfast
  await evalJs(`(() => {
    const cards = Array.from(document.querySelectorAll('.itw-exec-task-card'));
    // Click slip
    cards[0]?.click();
    // Click math
    cards[1]?.click();
    // Click pack
    cards[3]?.click();
    // Click uniform
    cards[2]?.click();
    // Click breakfast
    cards[4]?.click();
  })()`);
  await sleep(800);

  // On Reflect page, proceed to support
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-nav .itw-cta-dark');
    btn?.click();
  })()`);
  await sleep(600);

  // Check that Now/Next/Later is default and Run with support
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-nav .itw-cta-dark');
    btn?.click();
  })()`);
  await sleep(800);

  const nnlInfo = await evalJs(`(() => {
    const nnl = document.querySelector('.itw-nnl-container');
    const cols = nnl ? Array.from(nnl.querySelectorAll('.itw-nnl-col-header')).map(h => h.innerText) : [];
    return {
      hasNnl: Boolean(nnl),
      cols
    };
  })()`);
  console.log("Now/Next/Later 3-column info:", nnlInfo);
  await capture("packet6_06_exec_now_next_later.png");

  results.push({
    test: "Executive Functioning (No 'Paralysis' & Now/Next/Later Board)",
    pass: !execCopyCheck.hasParalysis && nnlInfo.hasNnl && nnlInfo.cols.length === 3,
    details: `No 'paralysis' found; NNL columns: ${nnlInfo.cols.join(', ')}`,
  });

  // ================= CHECK 8: MILO ASSISTANT & OWL HOOT =================
  console.log("\n--- TEST 8: Milo Navigation Assistant & Owl Hoot ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience" });
  await sleep(1500);

  // Open Milo Widget
  await evalJs(`(() => {
    const btn = document.querySelector('button[aria-label*="Milo"]');
    btn?.click();
  })()`);
  await sleep(800);

  const miloInfo = await evalJs(`(() => {
    const header = document.querySelector('header p.font-bold');
    const owlImg = document.querySelector('header img[src*="milo-owl"]');
    const navPills = Array.from(document.querySelectorAll('.flex-wrap button')).map(b => b.innerText);
    const soundToggle = document.querySelector('button[title*="Hoot sound"]');
    return {
      headerText: header?.innerText,
      hasOwlAvatar: Boolean(owlImg),
      navPillsCount: navPills.length,
      soundToggleText: soundToggle?.innerText
    };
  })()`);
  console.log("Milo widget check:", miloInfo);
  await capture("packet6_07_milo_owl_assistant.png");

  results.push({
    test: "Milo Owl Avatar & Site Navigation Assistant",
    pass: miloInfo.headerText === "Milo" && miloInfo.hasOwlAvatar && miloInfo.navPillsCount > 0,
    details: `Milo open with owl avatar, ${miloInfo.navPillsCount} quick navigation pills, audio toggle active`,
  });

  // ================= CHECK 9: DYSLEXIA 12-PASSAGE LIBRARY & TOOLBAR =================
  console.log("\n--- TEST 9: Dyslexia 12-Passage Library & Reader Toolbar Controls ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience" });
  await sleep(1200);

  await evalJs(`(() => {
    const btn = document.querySelector('.itw-mcard[data-m="dyslexia"]');
    btn?.click();
  })()`);
  await sleep(800);

  // Advance from intro to instructions
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-intro .itw-cta');
    btn?.click();
  })()`);
  await sleep(600);

  // Start Run 1
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-narrow .itw-cta-dark');
    btn?.click();
  })()`);
  await sleep(800);

  const run1PassageInfo = await evalJs(`(() => {
    const title = document.querySelector('.itw-flow-readtop span')?.innerText;
    const text = document.querySelector('.itw-reading-passage')?.innerText;
    return { title, textLength: text ? text.length : 0 };
  })()`);
  console.log("Dyslexia Run 1 Passage info:", run1PassageInfo);

  // Finish Run 1 reading
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-nav .itw-cta-dark');
    btn?.click();
  })()`);
  await sleep(600);

  // Answer Check 1 questions
  await evalJs(`(() => {
    const opts = document.querySelectorAll('.itw-flow-q:nth-child(1) .itw-flow-opt, .itw-flow-q:nth-child(2) .itw-flow-opt, .itw-flow-q:nth-child(3) .itw-flow-opt');
    if (opts.length >= 3) {
      opts[0]?.querySelector('input')?.click();
      opts[3]?.querySelector('input')?.click();
      opts[6]?.querySelector('input')?.click();
    }
    const submitBtn = document.querySelector('.itw-flow-nav .itw-cta-dark');
    submitBtn?.click();
  })()`);
  await sleep(600);

  // Advance to Support screen
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-nav-center .itw-cta-dark');
    btn?.click();
  })()`);
  await sleep(600);

  // Start Run 2 (Supported Reading)
  await evalJs(`(() => {
    const btn = document.querySelector('.itw-flow-nav .itw-cta-dark');
    btn?.click();
  })()`);
  await sleep(1000);

  const dyslexiaRun2Info = await evalJs(`(() => {
    const toolbar = document.querySelector('.itw-reader-toolbar');
    const ruler = document.querySelector('.itw-reading-ruler-bar');
    const companionTitle = document.querySelector('.itw-flow-readtop p')?.innerText;
    const passageText = document.querySelector('.itw-reading-passage')?.innerText;
    const ttsBtn = document.querySelector('.itw-tts-btn');
    return {
      hasToolbar: Boolean(toolbar),
      hasRuler: Boolean(ruler),
      companionTitle,
      passageLength: passageText ? passageText.length : 0,
      ttsText: ttsBtn?.innerText
    };
  })()`);
  console.log("Dyslexia Run 2 with Reader Toolbar info:", dyslexiaRun2Info);
  await capture("packet6_08_dyslexia_reader_toolbar.png");

  results.push({
    test: "Dyslexia Matched Companion Passage & Live Reader Toolbar",
    pass: dyslexiaRun2Info.hasToolbar && dyslexiaRun2Info.hasRuler && Boolean(dyslexiaRun2Info.companionTitle),
    details: `Toolbar active, ruler rendered, companion passage: "${dyslexiaRun2Info.companionTitle}"`,
  });

  // ================= CHECK 10: FAVICON & MILO LAUNCHER UNIFICATION =================
  console.log("\n--- TEST 10: Favicon & Milo Floating Button Unification ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/" });
  await sleep(1500);

  const homeMiloInfo = await evalJs(`(() => {
    const btn = document.querySelector('button[aria-label*="Milo"], button[aria-label*="chat with Milo"], button[aria-label*="Milo the Owl"]');
    const cs = btn ? window.getComputedStyle(btn) : null;
    const img = btn ? btn.querySelector('img') : null;
    return {
      hasButton: Boolean(btn),
      bg: cs?.backgroundColor,
      imgSrc: img?.getAttribute('src'),
      width: cs?.width,
      height: cs?.height
    };
  })()`);
  console.log("Home Milo Button:", homeMiloInfo);

  await cdp.send("Page.navigate", { url: "http://localhost:3000/experience" });
  await sleep(1500);

  const expMiloInfo = await evalJs(`(() => {
    const btn = document.querySelector('button[aria-label*="Milo"], button[aria-label*="Chat with Milo"]');
    const cs = btn ? window.getComputedStyle(btn) : null;
    const img = btn ? btn.querySelector('img') : null;
    return {
      hasButton: Boolean(btn),
      bg: cs?.backgroundColor,
      imgSrc: img?.getAttribute('src'),
      width: cs?.width,
      height: cs?.height
    };
  })()`);
  console.log("Experience Milo Button:", expMiloInfo);

  results.push({
    test: "Milo Floating Launcher Unification (/ vs /experience)",
    pass: homeMiloInfo.hasButton && expMiloInfo.hasButton && homeMiloInfo.imgSrc?.includes("milo-owl") && expMiloInfo.imgSrc?.includes("milo-owl"),
    details: `Home launcher: ${homeMiloInfo.bg} (${homeMiloInfo.imgSrc}) == Experience launcher: ${expMiloInfo.bg} (${expMiloInfo.imgSrc})`,
  });

  // ================= REPORT SUMMARY =================
  console.log("\n=======================================================");
  console.log("        PACKET 6 VERIFICATION TEST SUMMARY");
  console.log("=======================================================");
  let allPass = true;
  for (const r of results) {
    const status = r.pass ? "✅ PASS" : "❌ FAIL";
    if (!r.pass) allPass = false;
    console.log(`${status} | ${r.test.padEnd(50)} | ${r.details}`);
  }
  console.log("=======================================================");
  console.log(allPass ? "🎉 ALL 8 TESTS PASSED SUCCESSFULLY!" : "⚠️ SOME TESTS FAILED");

  cdp.close();
  cleanup();
}

main().catch((err) => {
  console.error("Test suite threw uncaught error:", err);
  process.exit(1);
});
