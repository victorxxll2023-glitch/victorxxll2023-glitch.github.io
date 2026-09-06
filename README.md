# Portfólio do Victor

Portfólio pessoal estático criado com HTML, CSS e JavaScript. Não exige instalação.

Site: https://victorxxll2023-glitch.github.io/

## Abrir localmente

Abra `index.html` no navegador ou inicie um servidor local na pasta.

## Personalizar

- Nome, apresentação e biografia: `index.html`
- Leituras do radar e acesso aos repositórios: seção `#projetos` em `index.html`
- E-mail e redes sociais: seção `#contato` em `index.html`
- Cores principais: variáveis no topo de `styles.css`
- Personagem hacker 2D: `assets/hacker-mascot.png`; efeitos em `hacker-character.css` e `hacker-character.js`
- Galeria de estudos: seção `#estudos` em `index.html`
- Pessoas do GitHub: seção `#rede` em `index.html`
- Galeria e globo: `interactive-effects.js`
- Terminal, navegação, cursor e pausa de efeitos: `script.js`
- Abertura visual simulada (3,4 s): `boot-sequence.js` e `boot-sequence.css`

GitHub e LinkedIn já usam os endereços confirmados. Instagram e e-mail ainda não foram informados. Nenhuma funcionalidade executa comandos de sistema ou testa redes; a abertura é apenas uma simulação visual.

Use `help` no terminal do site para consultar os comandos. `intro` repete a abertura. O comando `efeitos` pausa as animações e a preferência de movimento reduzido do dispositivo é respeitada.

## Publicação

Hospedado no GitHub Pages a partir da raiz da branch `main`. Não há etapa de compilação. O arquivo `.nojekyll` mantém a publicação estática. Créditos e fontes das marcas estão em `assets/LOGOS.md`.

## Testes

`node tests/terminal.behavior.cjs` executa os testes de comportamento com Playwright e Edge instalados. É possível fornecer `PLAYWRIGHT_MODULE` e `BROWSER_CHANNEL` para usar outro ambiente. Não há dependência de execução em produção.
