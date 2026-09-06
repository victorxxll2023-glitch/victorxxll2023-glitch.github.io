const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:4173/';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
  try {
    for (const width of [1440, 740, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base, { waitUntil: 'networkidle' });
      assert.match(await page.title(), /Estágio em Cybersecurity/);
      assert.match(await page.locator('.hero-intro').innerText(), /Busco estágio/);
      assert.equal(await page.locator('.boot-sequence').count(), 0);
      assert.equal(await page.locator('.footer-motion').isDisabled(), true);
      assert.equal(await page.locator('#lab-play').isVisible(), false);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Overflow at ${width}`);
      const structural = await page.evaluate(() => {
        const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
        return {
          duplicates: ids.filter((id, index) => ids.indexOf(id) !== index),
          brokenAnchors: [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(href => href.length > 1 && !document.getElementById(href.slice(1))),
        };
      });
      assert.deepEqual(structural, { duplicates: [], brokenAnchors: [] });
      await page.locator('[data-lab-case="integrity"]').click();
      assert.match(await page.locator('#evidence-title').innerText(), /arquivo mudou/);
      assert.match(await page.locator('#evidence-log').innerText(), /debug=true/);
      await page.locator('[data-lab-step="1"]').focus();
      await page.keyboard.press('Enter');
      assert.match(await page.locator('#analysis-title').innerText(), /não explica a causa/);
      assert.equal(await page.locator('[data-lab-step="1"]').getAttribute('aria-current'), 'step');
      await page.locator('[data-lab-step="2"]').click();
      assert.match(await page.locator('#analysis-text').innerText(), /não comprova malware/);
      await page.locator('[data-lab-case="ssh"]').click();
      assert.equal(await page.locator('#lab-progress').innerText(), 'Etapa 1 de 3');
      await page.locator('[data-lab-step="1"]').click();
      assert.match(await page.locator('#analysis-text').innerText(), /48 segundos/);
      await page.locator('[data-lab-step="2"]').click();
      assert.match(await page.locator('#analysis-text').innerText(), /não comprova invasão/);
      assert.match(await page.locator('.lab-resources').innerText(), /apoio de IA/);
      assert.match(await page.locator('.next-lab').innerText(), /Planejado, ainda sem relatório/);

      const gallery = page.locator('.learning-gallery');
      await gallery.scrollIntoViewIfNeeded();
      await page.locator('.gallery-next').click();
      await page.waitForFunction(() => document.querySelector('.learning-gallery').scrollLeft > 0);
      await gallery.focus();
      await page.keyboard.press('End');
      await page.waitForFunction(() => document.querySelector('.gallery-next').disabled);
      await page.keyboard.press('Home');
      await page.waitForFunction(() => document.querySelector('.gallery-prev').disabled);

      const sphere = page.locator('.image-sphere');
      await sphere.scrollIntoViewIfNeeded();
      const fitted = await sphere.evaluate(el => {
        const outer = el.getBoundingClientRect();
        return [...el.querySelectorAll('.sphere-person')].every(person => {
          const rect = person.getBoundingClientRect();
          return rect.left >= outer.left - 1 && rect.right <= outer.right + 1 && rect.top >= outer.top - 1 && rect.bottom <= outer.bottom + 1;
        });
      });
      assert.equal(fitted, true, `Globe avatars must fit at ${width}`);
      const firstPerson = page.locator('.sphere-person').first();
      const transform = await firstPerson.evaluate(el => el.style.transform);
      await sphere.focus();
      await page.keyboard.press('ArrowRight');
      assert.notEqual(await firstPerson.evaluate(el => el.style.transform), transform);
      await firstPerson.focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('.sphere-profile').isVisible(), true);
      assert.equal(await page.locator('.sphere-profile-link').getAttribute('href'), await firstPerson.getAttribute('data-github'));
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.sphere-profile').isVisible(), false);
      assert.equal(await firstPerson.evaluate(el => el === document.activeElement), true);

      // Load lazy images for a resource check; preserve production lazy-loading.
      await page.evaluate(async () => {
        const images = [...document.images];
        images.forEach(img => { img.loading = 'eager'; });
        await Promise.all(images.map(img => img.decode().catch(() => {})));
      });
      const broken = await page.evaluate(() => [...document.images].filter(img => !img.naturalWidth).map(img => img.getAttribute('src')));
      assert.deepEqual(broken.filter(src => !src.startsWith('http')), [], 'Local images must load');
      assert.deepEqual(errors, []);
      console.log(`PASS: ${width}px, keyboard cases, gallery, globe fit/profile/focus, reduced motion, content and links. External image failures: ${broken.filter(src => src.startsWith('http')).length}`);
      await context.close();
    }

    const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('.boot-sequence'));
    await page.clock.install();
    await page.locator('.lab-workbench').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('.lab-workbench').classList.contains('is-playing'));
    await page.locator('#lab-play').click();
    assert.equal(await page.locator('.lab-workbench').evaluate(el => el.classList.contains('is-playing')), false, 'First click pauses autoplay');
    await page.locator('#lab-play').click();
    await page.clock.fastForward(4500);
    assert.equal(await page.locator('#lab-progress').innerText(), 'Etapa 2 de 3');
    await page.clock.fastForward(4500);
    assert.equal(await page.locator('#lab-progress').innerText(), 'Etapa 3 de 3');
    await page.clock.fastForward(4500);
    assert.equal(await page.locator('#lab-play').innerText(), 'Reproduzir análise');
    await page.locator('.hero').scrollIntoViewIfNeeded();
    await page.locator('.lab-workbench').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('#lab-progress').innerText(), 'Etapa 3 de 3', 'Scrolling back must not restart analysis');
    await page.locator('#lab-play').click();
    await page.locator('.footer-motion').click();
    assert.equal(await page.locator('html').evaluate(el => el.classList.contains('motion-paused')), true);
    assert.equal(await page.locator('.lab-workbench').evaluate(el => el.classList.contains('is-playing')), false);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('.footer-motion').innerText(), 'Retomar animações');
    console.log('PASS: autoplay, first-click pause, replay, one-pass timing, global pause and persistence.');
    await context.close();

    const staticContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 960 } });
    const staticPage = await staticContext.newPage();
    await staticPage.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await staticPage.locator('.hacker-image').first().isVisible(), true);
    assert.equal(await staticPage.locator('.featured-project').isVisible(), true);
    assert.equal(await staticPage.locator('[data-lab-case="integrity"]').isDisabled(), true);
    assert.match(await staticPage.locator('noscript').innerText(), /dois exemplos completos/);
    assert.equal((await staticPage.request.get(new URL('labs/README.md', base).href)).ok(), true);
    console.log('PASS: no-JavaScript project, mascot, lab fallback and downloadable guide.');
    await staticContext.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
