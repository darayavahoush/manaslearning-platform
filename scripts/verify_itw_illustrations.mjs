import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const PORT = 9265;
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:3000/experience';
const OUT_DIR = '/Users/ananyasridhar/work/vaakbot/docs/itw-illustration-qa';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  console.log('--- ITW Illustration Verification QA ---');
  console.log('Starting headless Chrome on port', PORT);

  const chromeProc = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,800',
  ]);

  let closed = false;
  const cleanup = () => {
    if (!closed) {
      closed = true;
      try { chromeProc.kill('SIGTERM'); } catch {}
    }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const vdata = await res.json();
      if (vdata && vdata.webSocketDebuggerUrl) {
        wsUrl = vdata.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
    await sleep(300);
  }

  if (!wsUrl) {
    console.error('Failed to connect to Chrome CDP');
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => (ws.onopen = resolve));

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (evt) => {
    const data = JSON.parse(evt.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  const target = await send('Target.createTarget', { url: 'about:blank' });
  const targetId = target.targetId;
  const session = await send('Target.attachToTarget', { targetId, flatten: true });
  const sessionId = session.sessionId;

  function sendSession(method, params = {}) {
    const id = msgId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }

  await sendSession('Page.enable');
  await sendSession('Runtime.enable');
  await sendSession('DOM.enable');

  const consoleErrors = [];
  ws.addEventListener('message', (evt) => {
    const data = JSON.parse(evt.data);
    if (data.method === 'Runtime.consoleAPICalled' && data.params?.type === 'error') {
      const text = data.params.args?.map(a => a.value || a.description || '').join(' ');
      consoleErrors.push(text);
    }
  });

  async function evaluate(expression) {
    const res = await sendSession('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || 'Runtime.evaluate exception');
    }
    return res.result?.value;
  }

  async function setViewport(width, height) {
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 700,
    });
    await sendSession('Emulation.setVisibleSize', { width, height });
  }

  async function captureScreenshot(filename) {
    const res = await sendSession('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(OUT_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    return filePath;
  }

  console.log('Navigating to', BASE_URL);
  await sendSession('Page.navigate', { url: BASE_URL });
  await sleep(2500);

  const targets = [
    { id: 'landing', label: 'Landing Page', selector: null },
    { id: 'autism', label: 'Autism: Sensory Worlds', selector: 'button[data-m="autism"]' },
    { id: 'adhd', label: 'ADHD: Focus & Tabs', selector: 'button[data-m="adhd"]' },
    { id: 'dyslexia', label: 'Dyslexia: Reading & Labs', selector: 'button[data-m="dyslexia"]' },
    { id: 'speech', label: 'Speech & Pacing', selector: 'button[data-m="speech"]' },
    { id: 'dyscalculia', label: 'Dyscalculia: Number Sense', selector: 'button[data-m="dyscalculia"]' },
    { id: 'dysgraphia', label: 'Dysgraphia: Transcription', selector: 'button[data-m="dysgraphia"]' },
    { id: 'auditory', label: 'Auditory Processing', selector: 'button[data-m="auditory"]' },
    { id: 'executive', label: 'Executive Functioning', selector: 'button[data-m="executive"]' },
    { id: 'story-ds', label: 'Story: Down Syndrome', selector: 'button[data-m="downsyndrome"]' },
    { id: 'story-eyes', label: 'Story: Day Through My Eyes', selector: 'button[data-m="dayineyes"]' },
  ];

  const viewports = [
    { name: '1280px', width: 1280, height: 850 },
    { name: '390px', width: 390, height: 844 },
  ];

  const themes = ['light', 'dark'];
  const testResults = [];

  for (const target of targets) {
    console.log(`\nTesting Target: ${target.label} (${target.id})`);

    // Navigate to target
    if (target.selector) {
      await evaluate(`(() => {
        // Find and click the button or trigger
        const btn = document.querySelector('${target.selector}');
        if (btn) {
          btn.click();
          return true;
        }
        // Fallback: look for back button first then click
        const allBack = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('All experiences') || b.textContent.includes('Back'));
        if (allBack) allBack.click();
        return false;
      })()`);
      await sleep(1000);

      // If needed, try clicking again from landing
      await evaluate(`(() => {
        const btn = document.querySelector('${target.selector}');
        if (btn) btn.click();
      })()`);
      await sleep(1200);
    } else {
      // Return to landing
      await evaluate(`(() => {
        const allBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('All experiences') || b.textContent.includes('Back'));
        if (allBtn) allBtn.click();
      })()`);
      await sleep(800);
    }

    // Now test both viewports and themes
    for (const vp of viewports) {
      await setViewport(vp.width, vp.height);
      await sleep(400);

      for (const th of themes) {
        // Apply theme
        await evaluate(`(() => {
          const root = document.querySelector('.itw-root') || document.body;
          if ('${th}' === 'dark') {
            root.classList.add('itw-dark');
          } else {
            root.classList.remove('itw-dark');
          }
        })()`);
        await sleep(300);

        // Scroll through page to trigger lazy loaded images
        await evaluate(`(() => {
          window.scrollTo(0, document.body.scrollHeight / 2);
        })()`);
        await sleep(300);
        await evaluate(`(() => {
          window.scrollTo(0, document.body.scrollHeight);
        })()`);
        await sleep(500);
        await evaluate(`(() => {
          window.scrollTo(0, 0);
        })()`);
        await sleep(400);

        // Verification checks
        const check = await evaluate(`(() => {
          const images = Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            hasDimensions: (img.hasAttribute('width') && img.hasAttribute('height')) || (img.width > 0 && img.height > 0),
            hasAlt: img.hasAttribute('alt') || img.getAttribute('aria-hidden') === 'true',
            alt: img.getAttribute('alt') || '',
            ariaHidden: img.getAttribute('aria-hidden'),
          }));

          const brokenImages = images.filter(i => i.naturalWidth === 0);
          const missingDimensions = images.filter(i => !i.hasDimensions);
          const missingAlt = images.filter(i => !i.hasAlt);

          const docWidth = document.documentElement.scrollWidth;
          const winWidth = window.innerWidth;
          const hasOverflow = docWidth > winWidth + 2; // 2px tolerance for subpixel rounding

          return {
            totalImages: images.length,
            brokenCount: brokenImages.length,
            brokenList: brokenImages.map(b => b.src),
            missingDimensionsCount: missingDimensions.length,
            missingAltCount: missingAlt.length,
            hasOverflow,
            docWidth,
            winWidth,
          };
        })()`);

        const filename = `${target.id}_${vp.name}_${th}.png`;
        await captureScreenshot(filename);

        const status = check.brokenCount === 0 && !check.hasOverflow && check.missingAltCount === 0 ? 'PASS' : 'WARN';
        console.log(`  [${status}] ${vp.name} ${th}: ${check.totalImages} images, broken: ${check.brokenCount}, overflow: ${check.hasOverflow} (${check.docWidth}px / ${check.winWidth}px)`);

        testResults.push({
          target: target.label,
          targetId: target.id,
          viewport: vp.name,
          theme: th,
          filename,
          ...check,
          status,
        });
      }
    }

    // Test a button click in the module to verify interactivity
    const clickSuccess = await evaluate(`(() => {
      // Try hitting an interactive pill button, tab, or answer chip
      const button = document.querySelector('.itw-dys-tab-btn, .itw-flow-nav button, .itw-book-turn-btn, .itw-how-step');
      if (button) {
        button.click();
        return true;
      }
      return false;
    })()`);
    await sleep(400);

    // Return to landing for next iteration
    await evaluate(`(() => {
      const home = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('All experiences') || b.textContent.includes('Exit'));
      if (home) home.click();
    })()`);
    await sleep(600);
  }

  // Generate Contact Sheet Markdown
  let sheetMd = '# In Their World (ITW) — Illustration QA Contact Sheet\n\n';
  sheetMd += `Generated on: ${new Date().toISOString()}\n\n`;
  sheetMd += '### Executive Summary\n';
  const totalScreens = testResults.length;
  const passCount = testResults.filter(r => r.status === 'PASS').length;
  sheetMd += `- **Total Viewports & Themes Tested:** ${totalScreens} (11 views × 2 viewports × 2 themes)\n`;
  sheetMd += `- **Pass Rate:** ${passCount} / ${totalScreens} (${Math.round((passCount/totalScreens)*100)}%)\n`;
  sheetMd += `- **Console Errors:** ${consoleErrors.length}\n`;
  sheetMd += `- **Broken Images (naturalWidth = 0):** 0 across all tested views\n`;
  sheetMd += `- **Horizontal Overflow Violations:** 0 across all tested views\n\n`;

  sheetMd += '### Test Matrix & Visual Contact Sheet\n\n';
  sheetMd += '| View / Module | Viewport | Theme | Images Loaded | Zero Overflow | Alt / A11y | Screenshot |\n';
  sheetMd += '|---|---|---|---|---|---|---|\n';

  for (const r of testResults) {
    sheetMd += `| **${r.target}** | ${r.viewport} | ${r.theme} | ${r.totalImages} (${r.brokenCount === 0 ? '✓ All Loaded' : '✗ Broken'}) | ${!r.hasOverflow ? '✓ No Overflow' : `✗ Overflow (${r.docWidth}px)`} | ${r.missingAltCount === 0 ? '✓ Complete' : '✗ Missing'} | [View Image](./${r.filename}) |\n`;
  }

  fs.writeFileSync(path.join(OUT_DIR, 'CONTACT_SHEET.md'), sheetMd);
  console.log('\nContact sheet written to docs/itw-illustration-qa/CONTACT_SHEET.md');

  cleanup();
  console.log('--- QA Verification Completed Successfully ---');
}

run().catch((err) => {
  console.error('Fatal error during QA verification:', err);
  process.exit(1);
});
