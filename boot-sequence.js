(() => {
  "use strict";

  const sessionKey = "portfolio-opening-seen";
  const root = document.documentElement;
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canPlay = () => !motionPreference.matches && !root.classList.contains("motion-paused");
  let opening = null;
  let skipButton = null;
  let previousFocus = null;
  let finishTimer = 0;
  let progressTimers = [];
  let seenThisPage = false;

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  function rememberOpening() {
    seenThisPage = true;
    try { sessionStorage.setItem(sessionKey, "true"); } catch { /* Session storage is optional. */ }
  }

  function dismissOpening() {
    if (!opening) return;
    clearTimeout(finishTimer);
    progressTimers.forEach(clearTimeout);
    progressTimers = [];
    const restoreFocus = document.activeElement === skipButton;
    opening.remove();
    opening = null;
    skipButton = null;
    root.classList.remove("boot-sequence-active");
    if (restoreFocus && previousFocus?.isConnected && previousFocus !== document.body) {
      previousFocus.focus({ preventScroll: true });
    }
    previousFocus = null;
  }

  function makeNetwork() {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    svg.setAttribute("viewBox", "0 0 720 240");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("boot-network");
    const nodes = [[55, 62], [55, 181], [207, 120], [355, 45], [355, 195], [497, 120], [658, 62], [658, 181]];
    const links = [[0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [5, 6], [5, 7]];
    links.forEach(([from, to], index) => {
      const line = document.createElementNS(namespace, "line");
      line.setAttribute("x1", String(nodes[from][0]));
      line.setAttribute("y1", String(nodes[from][1]));
      line.setAttribute("x2", String(nodes[to][0]));
      line.setAttribute("y2", String(nodes[to][1]));
      line.setAttribute("pathLength", "1");
      line.style.animationDelay = `${140 + index * 170}ms`;
      svg.append(line);
    });
    nodes.forEach(([x, y], index) => {
      const group = document.createElementNS(namespace, "g");
      group.classList.add("boot-node");
      group.style.animationDelay = `${120 + index * 180}ms`;
      const circle = document.createElementNS(namespace, "circle");
      circle.setAttribute("cx", String(x));
      circle.setAttribute("cy", String(y));
      circle.setAttribute("r", index === 2 || index === 5 ? "7" : "4");
      const label = document.createElementNS(namespace, "text");
      label.setAttribute("x", String(x));
      label.setAttribute("y", String(y + 26));
      label.textContent = index === 5 ? "PORTFOLIO" : `N_0${index + 1}`;
      group.append(circle, label);
      svg.append(group);
    });
    return svg;
  }

  function playOpening() {
    if (!canPlay()) return false;
    if (opening) dismissOpening();
    rememberOpening();
    previousFocus = document.activeElement;
    opening = make("section", "boot-sequence");
    opening.setAttribute("aria-label", "Abertura visual do portfólio");
    const panel = make("div", "boot-panel");
    const top = make("div", "boot-topline");
    top.append(make("span", "boot-identifier", "VICTOR / INITIAL ACCESS"));
    skipButton = make("button", "boot-skip", "Pular abertura ↗");
    skipButton.type = "button";
    skipButton.addEventListener("click", dismissOpening);
    top.append(skipButton);

    const disclaimer = make("p", "boot-disclaimer", "SIMULAÇÃO VISUAL · NENHUMA CONEXÃO REAL");
    const heading = make("h2", "boot-title", "Reconhecendo a rede.");
    const diagram = make("div", "boot-diagram");
    diagram.append(makeNetwork());
    const log = make("ol", "boot-log");
    log.setAttribute("aria-hidden", "true");
    const steps = [
      ["01", "Inicializando ambiente isolado", "Reconhecendo a rede."],
      ["02", "Mapeando a topologia visual", "Perímetro mapeado."],
      ["03", "Acesso simulado autorizado", "Acesso simulado."],
      ["04", "Carregando portfólio", "Bem-vindo ao laboratório."]
    ];
    const rows = steps.map(([number, text]) => {
      const row = make("li", "boot-log-row");
      row.append(make("span", "boot-step-number", number), make("span", "boot-step-text", text), make("span", "boot-step-state", "—"));
      log.append(row);
      return row;
    });
    const bottom = make("div", "boot-bottomline");
    bottom.append(make("span", "", "AMBIENTE: PORTFÓLIO"), make("span", "boot-key-hint", "Esc para pular"));
    const timeline = make("div", "boot-timeline");
    timeline.setAttribute("aria-hidden", "true");
    timeline.append(make("i"));
    panel.append(top, disclaimer, heading, diagram, log, bottom, timeline);
    opening.append(panel);
    document.body.append(opening);
    root.classList.add("boot-sequence-active");

    const setStep = (index) => {
      if (!opening) return;
      rows.forEach((row, rowIndex) => {
        row.classList.toggle("is-current", rowIndex === index);
        row.classList.toggle("is-complete", rowIndex < index);
        row.querySelector(".boot-step-state").textContent = rowIndex < index ? "ok" : rowIndex === index ? "…" : "—";
      });
      heading.textContent = steps[index][2];
      opening.dataset.step = String(index + 1);
    };
    setStep(0);
    [700, 1500, 2350].forEach((delay, index) => progressTimers.push(setTimeout(() => setStep(index + 1), delay)));
    finishTimer = setTimeout(dismissOpening, 3400);
    return true;
  }

  window.portfolioOpening = { play: playOpening, dismiss: dismissOpening };
  window.addEventListener("portfolio-replay-boot", playOpening);
  document.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("[data-replay-boot]")) playOpening();
  });
  document.addEventListener("keydown", (event) => {
    if (!opening) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      dismissOpening();
    } else if (event.key === "Tab") {
      // The first keyboard navigation continues directly into the portfolio.
      dismissOpening();
    }
  }, true);
  const syncMotion = () => {
    const enabled = canPlay();
    if (!enabled) dismissOpening();
    document.querySelectorAll("[data-replay-boot]").forEach((button) => {
      button.disabled = !enabled;
      button.title = enabled ? "Rever a simulação visual de abertura" : "Ative os efeitos para rever a abertura. Movimento reduzido do dispositivo também é respeitado.";
    });
  };
  window.addEventListener("portfolio-motion", syncMotion);
  motionPreference.addEventListener("change", syncMotion);
  syncMotion();
  document.addEventListener("visibilitychange", () => { if (document.hidden) dismissOpening(); });

  try { seenThisPage = sessionStorage.getItem(sessionKey) === "true"; } catch { /* Autoplay still runs only once on this page. */ }
  if (!seenThisPage) {
    if (canPlay()) playOpening();
    else rememberOpening();
  }
})();
