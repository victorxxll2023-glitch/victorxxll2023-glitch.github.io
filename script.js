(() => {
  "use strict";

  const root = document.documentElement;
  const motionToggle = document.querySelector(".motion-toggle");
  const motionLabel = motionToggle?.querySelector(".motion-label");
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const motionStorageKey = "portfolio-motion-paused";
  let userPaused = false;
  let cursorFrame = 0;

  try {
    userPaused = localStorage.getItem(motionStorageKey) === "true";
  } catch {
    // Effects remain usable when browser storage is unavailable.
  }

  const motionPaused = () => userPaused || motionPreference.matches;
  const cursor = document.querySelector(".cursor-follower");
  let pointerVisible = false;
  let pointerX = 0;
  let pointerY = 0;
  let cursorX = 0;
  let cursorY = 0;
  let previousFrameTime = 0;
  const cursorEnabled = () => Boolean(cursor) && finePointer.matches && !motionPaused();

  function hideCursor() {
    pointerVisible = false;
    cancelAnimationFrame(cursorFrame);
    cursorFrame = 0;
    previousFrameTime = 0;
    cursor?.classList.remove("is-visible", "is-hovering");
  }

  function syncMotion() {
    const paused = motionPaused();
    root.classList.toggle("motion-paused", paused);
    if (motionToggle) {
      motionToggle.setAttribute("aria-pressed", String(paused));
      motionToggle.setAttribute("aria-label", "Pausar efeitos visuais");
      motionToggle.disabled = motionPreference.matches;
      motionToggle.title = motionPreference.matches
        ? "Efeitos desativados pela preferência de movimento reduzido do seu dispositivo."
        : paused ? "Retomar efeitos visuais" : "Pausar efeitos visuais";
    }
    if (motionLabel) motionLabel.textContent = paused ? "efeitos: off" : "efeitos: on";
    if (!cursorEnabled()) hideCursor();
    window.dispatchEvent(new CustomEvent("portfolio-motion", { detail: { paused } }));
  }

  function toggleMotion() {
    if (motionPreference.matches) {
      return "Efeitos desativados: seu dispositivo está com movimento reduzido. Essa preferência será respeitada por aqui.";
    }
    userPaused = !userPaused;
    try {
      localStorage.setItem(motionStorageKey, String(userPaused));
    } catch {
      // This session still remembers the choice.
    }
    syncMotion();
    return userPaused ? "Efeitos pausados. A navegação continua disponível." : "Efeitos ativados.";
  }

  function listenToPreference(query, callback) {
    if (query.addEventListener) query.addEventListener("change", callback);
    else query.addListener(callback);
  }

  motionToggle?.addEventListener("click", toggleMotion);
  listenToPreference(motionPreference, syncMotion);
  listenToPreference(finePointer, () => { if (!cursorEnabled()) hideCursor(); });
  syncMotion();

  function drawCursor(time) {
    cursorFrame = 0;
    if (!pointerVisible || !cursorEnabled()) return;
    const elapsed = previousFrameTime ? Math.min(time - previousFrameTime, 48) : 16;
    previousFrameTime = time;
    const follow = 1 - Math.exp(-elapsed / 34);
    cursorX += (pointerX - cursorX) * follow;
    cursorY += (pointerY - cursorY) * follow;
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
    if (Math.abs(pointerX - cursorX) + Math.abs(pointerY - cursorY) > 0.15) {
      cursorFrame = requestAnimationFrame(drawCursor);
    } else {
      previousFrameTime = 0;
    }
  }

  if (cursor) {
    cursor.setAttribute("aria-hidden", "true");
    document.addEventListener("pointermove", (event) => {
      if (!cursorEnabled() || event.pointerType === "touch") {
        hideCursor();
        return;
      }
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!pointerVisible) {
        cursorX = pointerX;
        cursorY = pointerY;
        pointerVisible = true;
        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
        cursor.classList.add("is-visible");
      }
      const interactive = event.target instanceof Element && event.target.closest("a, button, input, textarea, select, [role='button']");
      cursor.classList.toggle("is-hovering", Boolean(interactive));
      if (!cursorFrame) cursorFrame = requestAnimationFrame(drawCursor);
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", hideCursor);
    window.addEventListener("blur", hideCursor);
    document.addEventListener("visibilitychange", () => { if (document.hidden) hideCursor(); });
  }

  const navLinks = [...document.querySelectorAll(".desktop-nav a[href^='#']")];
  function setActiveSection(id) {
    navLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  navLinks.forEach((link) => link.addEventListener("click", () => {
    setActiveSection(link.hash.slice(1));
  }));
  if (window.location.hash) setActiveSection(window.location.hash.slice(1));
  window.addEventListener("hashchange", () => setActiveSection(window.location.hash.slice(1)));

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) setActiveSection(visible[0].target.id);
    }, { rootMargin: "-15% 0px -65% 0px", threshold: 0 });
    document.querySelectorAll("main section[id]").forEach((section) => sectionObserver.observe(section));
  }

  const revealElements = [...document.querySelectorAll(".reveal")];
  if ("IntersectionObserver" in window && !motionPaused()) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    revealElements.forEach((element) => revealObserver.observe(element));
    window.addEventListener("portfolio-motion", (event) => {
      if (!event.detail.paused) return;
      revealElements.forEach((element) => element.classList.add("visible"));
      revealObserver.disconnect();
    });
  } else {
    revealElements.forEach((element) => element.classList.add("visible"));
  }

  const terminalForm = document.querySelector(".terminal-form");
  const terminalInput = document.querySelector("#terminal-input");
  const terminalOutput = document.querySelector("#terminal-output");
  const commandNames = ["help", "whoami", "ls", "sobre", "radar", "projetos", "ferramentas", "stack", "estudos", "rede", "contato", "clear", "efeitos", "intro"];
  const commandHistory = [];
  let historyIndex = 0;
  let draftCommand = "";

  const sectionCommands = {
    sobre: { id: "sobre", text: "Victor — estudante de cybersecurity. Explorando Blue Team, Red Team, Linux e redes, com prática em ambientes de estudo." },
    radar: { id: "projetos", text: "Abrindo o radar de projetos: ideias e estudos que quero transformar em prática." },
    projetos: { id: "projetos", text: "Abrindo o radar: leituras de cybersecurity e acesso aos meus repositórios." },
    ferramentas: { id: "habilidades", text: "Abrindo as ferramentas que fazem parte dos meus estudos em cybersecurity." },
    stack: { id: "habilidades", text: "Abrindo as ferramentas que fazem parte dos meus estudos em cybersecurity." },
    estudos: { id: "estudos", text: "Abrindo os estudos: fundamentos, ferramentas e prática em laboratório." },
    rede: { id: "rede", text: "Abrindo as referências e comunidades que acompanho para aprender." },
    contato: { id: "contato", text: "Vamos conversar sobre estudos, comunidades e oportunidades.\nGitHub: https://github.com/victorxxll2023-glitch\nLinkedIn: https://www.linkedin.com/in/victor-hugo-053686306/" }
  };

  function appendOutput(command, response, kind = "") {
    if (!terminalOutput) return;
    const entry = document.createElement("div");
    entry.className = "terminal-entry";
    if (kind) entry.classList.add(`terminal-entry--${kind}`);
    const prompt = document.createElement("p");
    prompt.className = "terminal-command";
    prompt.textContent = `visitante@cyberlab:~$ ${command}`;
    const answer = document.createElement("p");
    answer.className = "terminal-response";
    answer.textContent = response;
    entry.append(prompt, answer);
    terminalOutput.append(entry);
    while (terminalOutput.children.length > 12) terminalOutput.firstElementChild.remove();
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function openSection(id) {
    const section = document.getElementById(id);
    if (!section) return;
    setActiveSection(id);
    section.scrollIntoView({ behavior: "instant", block: "start" });
    const destination = section.querySelector("h1, h2") || section;
    if (!destination.hasAttribute("tabindex")) destination.setAttribute("tabindex", "-1");
    destination.focus({ preventScroll: true });
    try {
      window.history.replaceState(null, "", `#${id}`);
    } catch {
      // Navigation still works in restricted previews.
    }
  }

  function executeCommand(rawCommand) {
    const command = String(rawCommand).trim().slice(0, 120);
    if (!command) return;
    const normalized = command.toLocaleLowerCase("pt-BR");
    if (commandHistory.at(-1) !== command) commandHistory.push(command);
    if (commandHistory.length > 40) commandHistory.shift();
    historyIndex = commandHistory.length;
    draftCommand = "";

    if (normalized === "clear") {
      terminalOutput?.replaceChildren();
    } else if (normalized === "help") {
      appendOutput(command, "whoami · sobre → perfil\nls → diretórios\nradar · projetos → leituras e repositórios\nferramentas · stack → ferramentas\nestudos → laboratório\nrede → referências\ncontato → vamos conversar\nefeitos → pausar ou retomar animações\nintro → rever abertura visual\nclear → limpar a sessão\n↑ ↓ histórico · Tab completar · Esc limpar entrada");
    } else if (normalized === "whoami") {
      appendOutput(command, "Victor\nEstudante de cybersecurity. Aprendendo sobre defesa, análise de ameaças, redes e segurança ofensiva em laboratório.");
    } else if (normalized === "ls") {
      appendOutput(command, "sobre/  projetos/  ferramentas/\nestudos/  rede/  contato/\nDigite o nome de um diretório para explorar.");
    } else if (normalized === "efeitos") {
      appendOutput(command, toggleMotion());
    } else if (normalized === "intro") {
      const played = window.portfolioOpening?.play();
      appendOutput(command, played ? "Reproduzindo a abertura. Simulação visual, sem conexões reais. Esc para pular." : "A abertura está indisponível enquanto os efeitos visuais estão desativados.");
    } else if (Object.hasOwn(sectionCommands, normalized)) {
      const target = sectionCommands[normalized];
      appendOutput(command, target.text);
      openSection(target.id);
    } else {
      appendOutput(command, "Comando não encontrado. Digite help para ver os caminhos disponíveis.", "error");
    }
    if (terminalInput) terminalInput.value = "";
  }

  if (terminalForm && terminalInput && terminalOutput) {
    terminalInput.maxLength = 120;
    terminalOutput.setAttribute("aria-live", "polite");
    terminalOutput.setAttribute("aria-relevant", "additions");
    terminalForm.addEventListener("submit", (event) => {
      event.preventDefault();
      executeCommand(terminalInput.value);
    });
    terminalInput.addEventListener("input", () => {
      historyIndex = commandHistory.length;
      draftCommand = terminalInput.value;
    });
    terminalInput.addEventListener("keydown", (event) => {
      if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.shiftKey && event.key !== "Tab") return;
      if (event.key === "Escape") {
        terminalInput.value = "";
        historyIndex = commandHistory.length;
        draftCommand = "";
      } else if ((event.key === "ArrowUp" || event.key === "ArrowDown") && commandHistory.length) {
        event.preventDefault();
        if (historyIndex === commandHistory.length) draftCommand = terminalInput.value;
        historyIndex = Math.max(0, Math.min(commandHistory.length, historyIndex + (event.key === "ArrowUp" ? -1 : 1)));
        terminalInput.value = historyIndex === commandHistory.length ? draftCommand : commandHistory[historyIndex];
        terminalInput.setSelectionRange(terminalInput.value.length, terminalInput.value.length);
      } else if (event.key === "Tab" && !event.shiftKey) {
        const prefix = terminalInput.value.trim().toLocaleLowerCase("pt-BR");
        if (!prefix || commandNames.includes(prefix)) return;
        const matches = commandNames.filter((name) => name.startsWith(prefix));
        if (matches.length === 1) {
          event.preventDefault();
          terminalInput.value = matches[0];
          draftCommand = matches[0];
        }
      }
    });
  }

  document.querySelectorAll("[data-command]").forEach((button) => {
    button.addEventListener("click", () => executeCommand(button.dataset.command));
  });

  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
