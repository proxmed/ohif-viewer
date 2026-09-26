// Times how long the viewer takes to show the first image for one study, against a deployed or local viewer.
// Logs in via Cognito, opens the study from the study list, and reports series-metadata vs first-image timing.
//
// Usage:
//   ROW=<study list row text> node scripts/viewer-timing.mjs [baseUrl]   # default baseUrl: https://tenacity.dev.proxmed.io
//   HEADED=1 node scripts/viewer-timing.mjs                               # no ROW: open the study yourself in the window
//
// Credentials: TENACITY_TEST_USER / TENACITY_TEST_PASS, from the environment or from .env.test (gitignored). Never printed.
// Env: CHROME (browser path, default system Chrome), TIMEOUT_MS (default 120000),
//      EXPECT_EARLY=1 to fail unless the first image renders before the last series metadata arrives (see #10).
// Exit 1 if no image renders within TIMEOUT_MS, or EXPECT_EARLY fails.
import { chromium } from 'playwright-core';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const envFile = join(dirname(fileURLToPath(import.meta.url)), '..', '.env.test');
const fileEnv = existsSync(envFile)
  ? Object.fromEntries(readFileSync(envFile, 'utf8').split('\n').filter(l => l.includes('=')).map(l => l.split(/=(.*)/s).slice(0, 2)))
  : {};
const USER = process.env.TENACITY_TEST_USER || fileEnv.TENACITY_TEST_USER;
const PASS = process.env.TENACITY_TEST_PASS || fileEnv.TENACITY_TEST_PASS;
if (!USER || !PASS) {
  console.error('Set TENACITY_TEST_USER and TENACITY_TEST_PASS (environment or .env.test)');
  process.exit(2);
}

const BASE = process.argv[2] || 'https://tenacity.dev.proxmed.io';
const ROW = process.env.ROW;
const HEADED = Boolean(process.env.HEADED);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 120_000);

const browser = await chromium.launch({
  headless: !HEADED,
  executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  // Headless has no GPU; software WebGL lets cornerstone render.
  args: HEADED ? [] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

// Log in (the study list redirects to Cognito).
await page.goto(BASE + '/');
await page.waitForURL(/amazoncognito\.com|auth\./, { timeout: 30_000 });
await page.locator('input[name="username"]:visible, input[type="email"]:visible').first().fill(USER);
const pass = page.locator('input[name="password"]:visible, input[type="password"]:visible').first();
if (!(await pass.count())) {
  await page.locator('button[type="submit"]:visible').first().click(); // two-step managed login
}
await pass.waitFor({ timeout: 15_000 });
await pass.fill(PASS);
await page.locator('input[name="signInSubmitButton"]:visible, button[type="submit"]:visible').first().click();
await page.waitForURL(u => u.origin === new URL(BASE).origin && !u.pathname.startsWith('/callback'), { timeout: 30_000 });

// Time AHI traffic from the first series-level request, so scripted and manual opening both work.
let t0 = null;
const meta = new Map(); // seriesUID -> seconds when its metadata finished
let metaPending = 0;
const now = () => (Date.now() - t0) / 1000;
const seriesOf = u => (u.match(/\/series\/([^/?]+)/) || [])[1];
page.on('request', r => {
  if (t0 === null && r.method() === 'GET' && r.url().includes('medical-imaging') && /\/series(\?|$|\/)/.test(r.url())) {
    t0 = Date.now();
  }
  if (t0 !== null && r.method() === 'GET' && r.url().endsWith('/metadata')) metaPending++;
});
page.on('requestfinished', r => {
  if (t0 !== null && r.method() === 'GET' && r.url().endsWith('/metadata')) {
    meta.set(seriesOf(r.url()), now());
    metaPending--;
  }
});
page.on('requestfailed', r => {
  if (t0 !== null && r.method() === 'GET' && r.url().endsWith('/metadata')) metaPending--;
});

// Open the study the way a user does: select the row, then Launch workflow.
// Opening /viewer?StudyInstanceUIDs=... directly renders a black screen in headless Chrome.
await page.waitForLoadState('networkidle');
if (ROW) {
  await page.locator('tr', { hasText: ROW }).first().click();
  await page.getByText('Launch workflow').click();
  const mode = page.getByRole('button', { name: /basic viewer|longitudinal|viewer/i }).first();
  if (await mode.isVisible().catch(() => false)) await mode.click();
} else {
  if (!HEADED) {
    console.error('Without ROW, run with HEADED=1 and open the study yourself');
    process.exit(2);
  }
  console.log('Open the study in the browser window...');
}
await page.waitForURL(/\/viewer/, { timeout: 180_000 });
while (t0 === null) await page.waitForTimeout(100);

// First image = the viewport overlay shows an image index such as "1/1" or "14/28".
const imageIndex = () =>
  page.evaluate(
    () =>
      [...document.querySelectorAll('body *')]
        .find(e => e.children.length === 0 && /^\s*(\d+\s*)?\(?\s*\d+\s*\/\s*[1-9]\d*\s*\)?\s*$/.test(e.textContent || ''))
        ?.textContent.trim() ?? null
  );
const deadline = Date.now() + TIMEOUT_MS;
let firstImage = NaN;
let firstIndex = null;
while (Date.now() < deadline) {
  firstIndex = await imageIndex();
  if (firstIndex) {
    firstImage = now();
    break;
  }
  await page.waitForTimeout(100);
}
// Keep going until every series' metadata has arrived (none pending for 2 s), so "last metadata" is really the last.
let idleSince = Date.now();
while (Date.now() < deadline && Date.now() - idleSince < 2000) {
  if (metaPending > 0) idleSince = Date.now();
  await page.waitForTimeout(100);
}
await page.waitForTimeout(1000); // let the protocol re-run after the last series
const finalIndex = await imageIndex();
if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
await browser.close();

const lastMeta = meta.size ? Math.max(...meta.values()) : NaN;
const fmt = s => (isNaN(s) ? 'n/a' : `${s.toFixed(1)}s`);
console.log(
  `series_metadata=${meta.size} last_metadata=${fmt(lastMeta)} first_image=${isNaN(firstImage) ? 'NONE (timeout)' : fmt(firstImage)} ` +
    `image_minus_last_metadata=${fmt(firstImage - lastMeta)} image_index=${firstIndex} -> ${finalIndex}`
);

if (isNaN(firstImage)) process.exit(1);
if (process.env.EXPECT_EARLY && !(firstImage < lastMeta)) {
  console.log('FAIL: first image did not render before the last series metadata arrived');
  process.exit(1);
}
