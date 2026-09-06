const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
  try {
    for (const width of [360, 390, 430]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(process.env.PORTFOLIO_URL || 'http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
      const cdp = await context.newCDPSession(page);
      const sphere = page.locator('.image-sphere');
      await page.evaluate(() => {
        window.globeTouchTrace = { cancelled: 0 };
        document.querySelector('.image-sphere').addEventListener('pointercancel', () => { window.globeTouchTrace.cancelled++; });
      });
      async function swipe(start, delta) {
        const point = (x, y) => ({ x, y, id: 1, radiusX: 6, radiusY: 6, force: 1 });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(start.x, start.y)] });
        for (let step = 1; step <= 12; step++) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(start.x + delta.x * step / 12, start.y + delta.y * step / 12)] });
          // Real compositor time is intentional: dispatched DOM events do not test native panning.
          await page.waitForTimeout(20);
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForTimeout(180);
      }
      const transforms = () => sphere.locator('.sphere-person').evaluateAll(nodes => nodes.map(el => el.style.transform));
      async function frontPerson() {
        return sphere.locator('.sphere-person').evaluateAll(nodes => {
          const sorted = nodes.map((el, index) => ({ el, index })).sort((a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex));
          for (const { el, index } of sorted) {
            const r = el.getBoundingClientRect();
            const x = r.left + r.width / 2, y = r.top + r.height / 2;
            if (el.contains(document.elementFromPoint(x, y))) return { x, y, index };
          }
          throw new Error('No unobscured profile touch target');
        });
      }
      for (const [name, delta] of [['vertical', { x: 0, y: -90 }], ['horizontal', { x: 85, y: 0 }], ['diagonal', { x: -60, y: 65 }]]) {
        await sphere.scrollIntoViewIfNeeded();
        const rect = await sphere.boundingBox();
        const start = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        const before = await transforms();
        const scroll = await page.evaluate(() => scrollY);
        await swipe(start, delta);
        const afterScroll = await page.evaluate(() => scrollY);
        assert.ok(Math.abs(afterScroll - scroll) <= 1, `${width}px ${name}: page moved ${afterScroll - scroll}px while dragging globe`);
        assert.notDeepEqual(await transforms(), before, `${name}: globe must rotate`);
        assert.equal(await page.locator('.sphere-profile').isVisible(), false, 'Dragging must not open a profile');
        assert.equal(await sphere.evaluate(el => el.classList.contains('dragging')), false, 'Drag state must clear after release');
      }
      await sphere.scrollIntoViewIfNeeded();
      const avatar = await frontPerson();
      const beforeAvatar = await transforms();
      const scrollBeforeAvatar = await page.evaluate(() => scrollY);
      await swipe(avatar, { x: 25, y: 70 });
      assert.ok(Math.abs(await page.evaluate(() => scrollY) - scrollBeforeAvatar) <= 1, 'Dragging from an avatar must not scroll');
      assert.notDeepEqual(await transforms(), beforeAvatar);
      assert.equal(await page.locator('.sphere-profile').isVisible(), false);
      assert.equal(await page.evaluate(() => window.globeTouchTrace.cancelled), 0, 'Browser must not cancel one-finger globe gestures');
      const tap = await frontPerson();
      await page.touchscreen.tap(tap.x, tap.y);
      assert.equal(await page.locator('.sphere-profile').isVisible(), true, 'Single tap must still show profile');
      await page.locator('.sphere-profile-close').tap();
      assert.equal(await page.locator('.sphere-profile').isVisible(), false);

      await page.locator('.network-copy').scrollIntoViewIfNeeded();
      const outside = await page.locator('.network-copy > p:not(.command-line)').first().boundingBox();
      const outsideScroll = await page.evaluate(() => scrollY);
      await swipe({ x: outside.x + outside.width / 2, y: outside.y + outside.height / 2 }, { x: 0, y: -85 });
      assert.ok(await page.evaluate(() => scrollY) > outsideScroll + 10, 'Touch outside globe must scroll normally');
      assert.deepEqual(errors, []);
      console.log(`PASS: ${width}px native touch; vertical/horizontal/diagonal and avatar drags rotate without scrolling; taps open profiles; page scroll outside remains available.`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
