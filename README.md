# Portfólio do Victor

Portfólio de Victor Hugo, estudante em busca de estágio em cybersecurity, com interesse em Blue Team e SOC. Criado com HTML, CSS e JavaScript, sem dependências em produção.

Site: https://victorxxll2023-glitch.github.io/

## Abrir localmente

Inicie um servidor local na pasta com `python -m http.server 4173` e acesse `http://127.0.0.1:4173/`. O conteúdo principal também pode ser aberto diretamente em `index.html`.

## Conteúdo e transparência

- **Trilha CyberSec:** projeto de estudo publicado, com link para a demonstração, código e créditos. O preview é uma captura real, não um mockup. Consulte `assets/PREVIEWS.md`.
- **Security Write-ups:** acervo em início de construção. Não é apresentado como um conjunto de investigações concluídas.
- **Demonstrações Blue Team:** dois exemplos sintéticos de autenticação SSH e integridade de arquivos, com roteiro, dados e Python em [`labs/`](labs/README.md). Foram criados com apoio de IA e não representam incidentes reais ou experiência profissional.
- **Wazuh:** próximo laboratório planejado, ainda sem relatório de execução. Não há screenshots ou métricas inventadas.
- Ferramentas, estudos e referências brasileiras complementam o trabalho publicado; não representam certificações ou endosso das pessoas citadas.

## Personalizar

- Nome, apresentação e biografia: `index.html`
- Projetos publicados: seção `#projetos` em `index.html`
- Exemplos interativos: seção `#laboratorios`, `lab-explorer.js` e arquivos em `labs/`
- Leituras complementares: seção `#radar` em `index.html`
- E-mail e redes sociais: seção `#contato` em `index.html`
- Cores principais: variáveis no topo de `styles.css`; layout para recrutamento e novos componentes em `recruiter.css`
- Personagem hacker 2D: `assets/hacker-mascot.png`; efeitos em `hacker-character.css` e `hacker-character.js`
- Galeria de estudos: seção `#estudos` em `index.html`
- Pessoas do GitHub: seção `#rede` em `index.html`
- Galeria e globo: `interactive-effects.js`
- Terminal, navegação, cursor e pausa de efeitos: `script.js`
- Abertura visual simulada (3,4 s): `boot-sequence.js` e `boot-sequence.css`

GitHub e LinkedIn usam os endereços confirmados. Instagram e e-mail não foram informados e não aparecem como contatos. Nenhuma funcionalidade do site executa comandos de sistema ou testa redes; a abertura é apenas uma simulação visual.

Use `help` no terminal do site para consultar os comandos. `intro` repete a abertura. O comando `efeitos` pausa as animações e a preferência de movimento reduzido do dispositivo é respeitada.

O terminal é opcional: projetos e contato funcionam sem digitar comandos. A demonstração de análise tem reprodução única automática em desktop, controles manuais, pausa ao sair da tela e navegação por teclado. No celular e com movimento reduzido, a leitura é manual. O rodapé permite pausar os efeitos. Conteúdo e roteiro permanecem disponíveis sem JavaScript.

## Publicação

Hospedado no GitHub Pages a partir da raiz da branch `main`. Não há etapa de compilação. O arquivo `.nojekyll` mantém a publicação estática. Créditos e fontes das marcas estão em `assets/LOGOS.md`.

## Testes

Com Playwright e Edge disponíveis no ambiente de desenvolvimento:

```text
node tests/terminal.behavior.cjs
node tests/portfolio.behavior.cjs
node tests/capture-review.cjs
python -m unittest discover -s labs -p "test_*.py"
python labs/analyze.py
```

O primeiro teste isola o terminal. O segundo acessa o servidor local e verifica os novos exemplos, responsividade em 1440/740/390 px, globo, galeria, teclado, movimento reduzido, pausa persistente e alternativa sem JavaScript. O terceiro gera imagens locais de revisão em `.impeccable/review/`.

É possível fornecer `PLAYWRIGHT_MODULE`, `BROWSER_CHANNEL` (testes de comportamento) e `PORTFOLIO_URL` (teste da página e capturas) para usar outro ambiente. Os testes Python usam apenas a biblioteca padrão. Não há dependência de execução em produção.
