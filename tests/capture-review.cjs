const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const path = require('node:path');
async function captureSection(page, selector, output) {
  const viewport = page.viewportSize();
  const height = await page.locator(selector).evaluate(el => el.getBoundingClientRect().height);
  await page.setViewportSize({ width: viewport.width, height: Math.max(viewport.height, Math.ceil(height) + 200) });
  await page.locator(selector).screenshot({ path: output, style: '.topbar,.skip-link { visibility: hidden!important; }' });
  await page.setViewportSize(viewport);
}
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    if (process.argv.includes('--guide')) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 1 });
      await page.goto('https://victorxxll2023-glitch.github.io/cybersecurity-interactive-guide/', { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(__dirname, '../assets/cyber-guide-preview.jpg'), type: 'jpeg', quality: 85 });
      console.log('Captured real guide:', await page.title());
      return;
    }
    const out = path.join(__dirname, '../.impeccable/review');
    fs.mkdirSync(out, { recursive: true });
    for (const width of [1440, 740, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(process.env.PORTFOLIO_URL || 'http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
      // Full-page screenshots do not trigger below-the-fold lazy images by themselves.
      await page.evaluate(async () => {
        const images = [...document.images];
        images.forEach(img => { img.loading = 'eager'; });
        await Promise.all(images.map(img => img.decode().catch(() => {})));
      });
      await page.screenshot({ path: path.join(out, width === 1440 ? 'desktop.png' : width === 390 ? 'mobile.png' : 'user-740.png'), fullPage: true });
      if (width === 1440) {
        for (const [name, selector] of [['hero', '.hero'], ['projects', '#projetos'], ['labs', '#laboratorios']]) {
          await captureSection(page, selector, path.join(out, name + '.png'));
        }
      }
      if (width === 390) {
        for (const [name, selector] of [['mobile-hero', '.hero'], ['mobile-labs', '#laboratorios'], ['mobile-network', '#rede']]) {
          await captureSection(page, selector, path.join(out, name + '.png'));
        }
      }
      console.log(JSON.stringify({ width, errors, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) }));
      await context.close();
    }
  } finally { await browser.close(); }
})();
