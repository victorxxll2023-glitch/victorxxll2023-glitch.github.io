const assert = require("node:assert/strict");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const fixture = `<!doctype html><html lang="pt-BR"><head><style>
body { margin: 0; } main section { height: 500px; }
.cursor-follower { position: fixed; top: 0; left: 0; opacity: 0; pointer-events: none; }
.cursor-follower.is-visible { opacity: 1; }
</style></head><body>
<button class="motion-toggle"><span class="motion-label"></span></button>
<nav class="desktop-nav"><a href="#sobre">Sobre</a><a href="#projetos">Projetos</a></nav>
<div class="cursor-follower"></div><button data-command="help">Ajuda</button>
<form class="terminal-form"><label for="terminal-input">Comando</label><input id="terminal-input"><button>Executar</button></form>
<div id="terminal-output"></div><main>
${["sobre", "projetos", "habilidades", "estudos", "rede", "contato"].map((id) => `<section id="${id}">${id}</section>`).join("")}
</main><span id="year"></span></body></html>`;

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || "msedge" });
  try {
    const context = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("http://portfolio.test/**", (route) => route.fulfill({ contentType: "text/html", body: fixture }));
    const start = async () => {
      await page.goto("http://portfolio.test/");
      await page.addScriptTag({ path: path.join(__dirname, "..", "script.js") });
    };
    const input = page.locator("#terminal-input");
    const run = async (command) => { await input.fill(command); await input.press("Enter"); };
    await start();
    assert.equal(await input.evaluate((node) => node === document.activeElement), false, "Input must not steal focus on load");

    await page.getByRole("button", { name: "Ajuda", exact: true }).click();
    assert.match(await page.locator("#terminal-output").innerText(), /whoami.*sobre/s);
    await run("whoami");
    assert.match(await page.locator(".terminal-response").last().innerText(), /Estudante de cybersecurity/);
    await input.fill("rascunho");
    await input.press("ArrowUp");
    assert.equal(await input.inputValue(), "whoami");
    await input.press("ArrowDown");
    assert.equal(await input.inputValue(), "rascunho");
    await input.fill("ferr");
    await input.press("Tab");
    assert.equal(await input.inputValue(), "ferramentas");
    assert.equal(await input.evaluate((node) => node === document.activeElement), true);
    await input.press("Tab");
    assert.equal(await input.evaluate((node) => node === document.activeElement), false, "Completed command must allow tabbing away");
    await input.focus();
    await input.press("Escape");
    assert.equal(await input.inputValue(), "");

    await run("<img src=x onerror=alert(1)>");
    assert.equal(await page.locator("#terminal-output img").count(), 0, "Input must be rendered as plain text");
    await run("constructor");
    assert.match(await page.locator(".terminal-response").last().innerText(), /Comando não encontrado/);
    for (const [command, section] of [["sobre", "sobre"], ["radar", "projetos"], ["projetos", "projetos"], ["ferramentas", "habilidades"], ["stack", "habilidades"], ["estudos", "estudos"], ["rede", "rede"], ["contato", "contato"]]) {
      await run(command);
      assert.equal(new URL(page.url()).hash, `#${section}`);
    }
    for (let count = 0; count < 15; count += 1) await run("ls");
    assert.equal(await page.locator(".terminal-entry").count(), 12, "Output must remain bounded");
    await run("clear");
    assert.equal(await page.locator(".terminal-entry").count(), 0);

    await run("efeitos");
    assert.equal(await page.locator("html").evaluate((node) => node.classList.contains("motion-paused")), true);
    assert.equal(await page.locator(".motion-label").innerText(), "efeitos: off");
    await start();
    assert.equal(await page.locator(".motion-toggle").getAttribute("aria-pressed"), "true", "Pause preference must persist");
    await page.locator(".motion-toggle").click();
    assert.equal(await page.locator(".motion-label").innerText(), "efeitos: on");
    await page.mouse.move(640, 400);
    assert.equal(await page.locator(".cursor-follower").evaluate((node) => node.classList.contains("is-visible")), true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() => document.documentElement.classList.contains("motion-paused"));
    assert.equal(await page.locator(".motion-toggle").isDisabled(), true);
    assert.equal(await page.locator(".cursor-follower").evaluate((node) => node.classList.contains("is-visible")), false);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForFunction(() => !document.documentElement.classList.contains("motion-paused"));

    const restrictedContext = await browser.newContext();
    const restrictedPage = await restrictedContext.newPage();
    await restrictedPage.setContent(fixture);
    await restrictedPage.addScriptTag({ path: path.join(__dirname, "..", "script.js") });
    await restrictedPage.locator("#terminal-input").fill("whoami");
    await restrictedPage.locator("#terminal-input").press("Enter");
    assert.match(await restrictedPage.locator(".terminal-response").innerText(), /Victor/, "Commands must work without localStorage access");
    assert.deepEqual(errors, []);
    console.log("PASS: terminal commands, navigation, history, completion, text safety, output bounds, motion persistence, live reduced motion, cursor, and restricted storage.");
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
