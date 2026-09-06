(() => {
  'use strict';
  const workbench = document.querySelector('.lab-workbench');
  if (!workbench) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const cases = {
    ssh: {
      file: 'fixture / auth-events.json', title: 'Falhas seguidas de um acesso',
      log: '09:00:00  falha    ana   192.0.2.44\n09:00:08  falha    ana   192.0.2.44\n09:00:16  falha    ana   192.0.2.44\n09:00:24  falha    ana   192.0.2.44\n09:00:32  falha    ana   192.0.2.44\n09:00:40  falha    ana   192.0.2.44\n09:00:48  sucesso  ana   192.0.2.44',
      steps: [
        ['O que aconteceu?', 'A amostra contém seis falhas de autenticação e um sucesso para a mesma conta e origem. Primeiro, preservo a sequência e os horários.', 'O acesso era esperado para essa conta, origem e horário?'],
        ['Uma sequência, não eventos isolados.', 'As seis falhas e o sucesso ocorreram em 48 segundos. Esse padrão merece investigação, mas também pode ser causado por uma pessoa que errou a senha.', 'Há mudança de origem, sessão incomum ou atividade posterior que sustente a hipótese?'],
        ['Suspeita não é confirmação.', 'Classificação didática: revisar a sessão. Validar com o responsável pela conta e correlacionar eventos do host antes de recomendar contenção. O exemplo não comprova invasão.', 'Próxima evidência: comandos da sessão, histórico da conta e contexto do endpoint.']
      ]
    },
    integrity: {
      file: 'fixture / integrity-files.json', title: 'O conteúdo de um arquivo mudou',
      log: 'baseline  → SHA-256 do conteúdo\n\nconfig/app.conf\n  ANTES   debug=false\n  DEPOIS  debug=true\n  ESTADO  conteúdo alterado\n\nnotes/readme.txt  sem alteração',
      steps: [
        ['O que foi alterado?', 'O exemplo compara o SHA-256 de duas versões de arquivos sintéticos. A configuração mudou de debug=false para debug=true; as notas continuam iguais.', 'A baseline é confiável e a alteração estava prevista?'],
        ['Hash diferente não explica a causa.', 'A diferença confirma alteração de conteúdo, não sua autoria ou intenção. Eu buscaria o responsável, o horário e uma solicitação de mudança correspondente.', 'Foi uma manutenção autorizada, um erro ou uma ação indevida?'],
        ['Validar antes de restaurar.', 'Preservar as versões e registrar a diferença. Se a alteração for não autorizada, seguir o processo de resposta e restaurar uma versão validada. Hash sozinho não comprova malware.', 'Próxima evidência: trilha de auditoria e registro de mudança.']
      ]
    }
  };
  const fields = ['analysis-title', 'analysis-text', 'analysis-question'].map(id => document.getElementById(id));
  const buttons = [...document.querySelectorAll('[data-lab-case]')];
  const steps = [...document.querySelectorAll('[data-lab-step]')];
  const play = document.getElementById('lab-play');
  const progress = document.getElementById('lab-progress');
  const copy = document.querySelector('.analysis-copy');
  const activeReveals = new Set();
  let selected = 'ssh', step = 0, timer = 0, running = false, visible = false, hasAutoplayed = false, entrance = null;
  const motionAllowed = () => !reduce.matches && !document.documentElement.classList.contains('motion-paused') && !document.hidden;

  function paint(animate = false) {
    fields.forEach((field, i) => { field.textContent = cases[selected].steps[step][i]; });
    steps.forEach((button, i) => {
      if (i === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    progress.textContent = `Etapa ${step + 1} de 3`;
    entrance?.cancel();
    if (animate && motionAllowed()) entrance = copy.animate([
      { opacity: .65, transform: 'translateX(8px)' }, { opacity: 1, transform: 'translateX(0)' }
    ], { duration: 260, easing: 'cubic-bezier(.16,1,.3,1)' });
  }

  function stop() {
    clearTimeout(timer);
    timer = 0;
    running = false;
    workbench.classList.remove('is-playing');
    play.textContent = 'Reproduzir análise';
  }

  function advance() {
    if (!running || !visible || !motionAllowed()) { stop(); return; }
    if (step === 2) { stop(); return; }
    step += 1;
    paint(true);
    timer = setTimeout(advance, 4400);
  }

  function start(animate = true) {
    stop();
    hasAutoplayed = true;
    if (!motionAllowed()) { step = 2; paint(false); return; }
    step = 0;
    paint(animate);
    running = true;
    play.textContent = 'Pausar análise';
    workbench.classList.add('is-playing');
    timer = setTimeout(advance, 4400);
  }

  buttons.forEach(button => button.addEventListener('click', event => {
    stop(); hasAutoplayed = true; selected = button.dataset.labCase; step = 0;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.getElementById('evidence-file').textContent = cases[selected].file;
    document.getElementById('evidence-title').textContent = cases[selected].title;
    document.getElementById('evidence-log').textContent = cases[selected].log;
    paint(event.detail > 0);
  }));
  steps.forEach(button => button.addEventListener('click', event => {
    stop(); hasAutoplayed = true; step = Number(button.dataset.labStep); paint(event.detail > 0);
  }));
  [...buttons, ...steps].forEach(button => { button.disabled = false; });
  play.addEventListener('click', event => running ? stop() : start(event.detail > 0));

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (!visible) stop();
      // Only desktop offers a single guided pass; touch visitors control each step.
      else if (!hasAutoplayed && fine.matches && motionAllowed()) start();
    }, { threshold: .35 }).observe(workbench);
  } else visible = true;
  function settle() {
    play.hidden = !motionAllowed();
    if (!motionAllowed()) {
      stop(); entrance?.cancel();
      activeReveals.forEach(animation => animation.cancel());
      activeReveals.clear();
    }
  }
  workbench.addEventListener('focusin', event => {
    hasAutoplayed = true;
    if (event.target !== play) stop();
  });
  window.addEventListener('portfolio-motion', settle);
  document.addEventListener('visibilitychange', settle);
  window.addEventListener('pagehide', stop);
  reduce.addEventListener('change', settle);
  settle();

  // Native scroll is preserved. Only the project and workflow get a short entrance.
  if ('IntersectionObserver' in window) {
    const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      reveals.unobserve(entry.target);
      if (motionAllowed()) {
        const animation = entry.target.animate([
          { opacity: .6, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' });
        activeReveals.add(animation);
        animation.addEventListener('finish', () => activeReveals.delete(animation));
      }
    }), { threshold: .1 });
    document.querySelectorAll('.featured-project,.writeups-row').forEach(el => reveals.observe(el));
  }
})();
