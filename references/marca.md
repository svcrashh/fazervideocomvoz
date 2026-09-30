# Produto e marca

O vídeo tem que parecer feito por quem conhece a marca por dentro, e por quem conhece quem usa o produto. Descubra tudo sozinho antes de perguntar.

Este arquivo diz onde procurar e o que extrair. O que você extrai vira o `leitura.md` (`references/leitura.md`), escrito antes de qualquer decisão: o produto, o público, a cara do produto, o som do público, as decisões com o porquê, o teste da troca e o que não deu para saber. Cor, fonte e logo são o começo. Quem só colheu isso só tem onde pôr quatro cores, e o resto do vídeo sai do padrão do motor.

**Comece pelo script:** `node $SKILL/scripts/leitura.mjs <repositório> --saida <pasta>` colhe os fatos (cores com o lugar onde cada uma é usada, fontes, raios, borda ou sombra, superfícies, arquivos de marca, documentos sobre público e produto, vocabulário das telas) e não lê segredo. Os caminhos abaixo são para ir além do que ele achou.

## Onde procurar (em ordem)

1. **A conversa atual:** o usuário pode ter colado cores, links, arquivos ou regras.
2. **O projeto atual e as pastas irmãs:** outra pasta com `brand`, `-brand-kit`, `site` ou `ui` no nome costuma ter a marca.
   ```sh
   # logos, kits e manuais (ignore node_modules/dist/android/ios)
   find . .. -maxdepth 4 \( -path '*/node_modules' -o -path '*/dist' -o -path '*/android' -o -path '*/ios' \) -prune -o \
     \( -iname '*logo*' -o -iname '*brand*' -o -iname '*marca*' -o -iname '*simbolo*' -o -iname '*symbol*' -o -iname '*presskit*' \) -print
   ```
   - Windows (PowerShell): `Get-ChildItem -Recurse -Depth 4 -Include *logo*,*brand*,*marca* | ? FullName -notmatch 'node_modules|dist'`.
   - Procure: `public/brand*`, `docs/brand`, `assets/logo*`, `favicon.svg`, tokens de cor (`tokens.css/json`, `tailwind.config`, `index.css` com `--cor`), fontes (`@fontsource*` no package.json, `@font-face`, Google Fonts no `index.html`) e um manual de marca (PDF, página `/manual-marca`, `.md` de voz e tom).
3. **O site do produto:** tire um print de página inteira pra ver cores, tipografia e tom em uso. Faça isso só com requisições GET, sem disparar formulário nem login.
   ```js
   await page.route('**/*', r => r.request().method() !== 'GET' ? r.abort() : r.continue())
   // páginas que revelam ao rolar: role em passos de ~400 px com pausa antes do screenshot fullPage
   ```
4. **Instruções do projeto:** CLAUDE.md, README e docs podem trazer regras de linguagem, dados sensíveis e o que o produto se recusa a fazer. Isso vale para o texto do vídeo.
5. **Quem usa:** documentos de visão, persona, pesquisa, planos e roadmap; os papéis que o sistema tem (quem entra, o que cada um pode); o idioma, o registro e o vocabulário das telas; a landing (para quem ela fala). O público raramente está num arquivo chamado "público": está espalhado nessas fontes.

## O que extrair

- **Logo em SVG:** prefira o vetorial oficial (horizontal, vertical, símbolo, versão negativa) ao PNG. Rode `node $SKILL/scripts/logo.mjs logo.svg --js LOGO`:
  - `--dividir` separa caminhos compostos (peças, letras). Furos de letra viram partes soltas; reagrupe pelo `getBBox` antes de animar letra a letra.
  - Olhe o resultado: quantas partes, que cores, e se as partes contam uma história (peças, camadas, traços) que pode virar o movimento-assinatura.
- **Cores:** a paleta oficial com nome e hex, qual é o fundo claro e o escuro, e qual é a cor de ênfase. Anote a proporção do manual, se houver.
- **Fontes:** as famílias de título e de texto. Traga com `fontes.mjs`: ele busca no node_modules e, se não achar, no Google Fonts. Fonte paga que não está no projeto: pergunte ao usuário se ele tem o arquivo; senão, proponha a alternativa gratuita mais próxima e avise.
- **Elementos:** formas oficiais (vão em `MARCA.formas`, paths em viewBox 400×400), padrões, ícones, ilustrações.
- **Voz:** frases-âncora, slogan, palavras que a marca usa e as que ela proíbe.
- **Produto:** telas, tokens da interface (cor de botão, raio, fonte do app) e vocabulário das funcionalidades, pra reconstruir a UI em HTML.
- **Linguagem visual, além da tinta.** Para cada item, a evidência (`arquivo:linha`, print):
  - superfície: clara ou escura, e onde cada uma aparece (landing, painel, app);
  - o **papel** de cada cor: onde ela entra (fundo de página, botão, item ativo, alerta), onde ela nunca entra e como muda de uma superfície para outra. Olhe onde cada cor é usada, não só onde é definida;
  - tipografia: família, peso, caixa (alta ou normal), espaçamento entre letras, o tamanho do título contra o do texto;
  - forma: raio, borda ou sombra, chapado ou com gradiente;
  - densidade, textura e grade, fotografia (tem? de quê? como é tratada?), movimento (o que a interface já faz).
- **Público:** quem é, o que faz, onde vai assistir, o que acharia falso, e o que ouve. Onde o repositório não diz, escreva palpite ou pergunte; nunca tire o público do nome ou da cor do produto.

Monte o `marca.js` com `cores`, `logo`, `simbolo` e `formas`. Os nomes das cores ficam como a marca chama.

## Quando não há marca

Projeto novo, marca ainda crua, usuário que "só quer um vídeo": não invente uma identidade sozinho. A leitura continua valendo: o público e o som do público existem mesmo sem marca, e é deles que saem as direções. No briefing, ofereça 2 ou 3 direções visuais prontas, cada uma com paleta, par de fontes do Google Fonts e estilo de forma (orgânico, geométrico, editorial). Use o nome do produto como wordmark em texto. Deixe claro que é uma identidade provisória, só para o vídeo.

## Respeito à marca

- O logo final é exato: proporção, cores, área de respiro e versão certa para o fundo. Animar as partes chegando ao lugar é permitido; o quadro final não pode ter distorção.
- Cores fora da paleta só em tons neutros de apoio.
- Regras do manual ("não aplique sombra no logo", "texto sempre na cor X") valem no vídeo.

## Telas do produto: capturar, reaproveitar ou recriar

Decida sozinho, nesta ordem:

1. **Reaproveitar:** prints, gravações de tela ou mockups que já existem (na conversa, no repo, em `docs/`, `presskit`, loja de apps). Os mais recentes ganham.
2. **Capturar do sistema rodando:** quando dá pra subir o projeto local ou abrir o site público.
   - Descubra como rodar pelo README, pelo `package.json` (scripts `dev`/`start`) e pelo CLAUDE.md, e respeite portas e avisos do projeto.
   - Use Playwright pra levar a tela ao estado certo (clicar, preencher com dados fictícios) e capturar em alta resolução (`deviceScaleFactor: 2`). Pra movimento, grave a tela (`recordVideo`) ou capture uma sequência de quadros.
   - Em produção, só GET: bloqueie o resto com `page.route`. Nunca envie formulário, compra nem mensagem de verdade.
   - Login: use modo demo ou conta de teste documentada no projeto. Se não houver, peça ao usuário. Senha nunca vai no chat: ele entra e te avisa.
   - Dados reais de pessoas (nomes, e-mails, fotos, documentos) não entram no vídeo. Troque por fictícios na interface ou recrie a tela.
3. **Recriar em HTML (mock):** quando a tela real é difícil de alcançar, é confidencial ou ficaria ilegível no formato. Reconstrua com os tokens do produto (cores, raio, fonte, espaçamentos), use o vocabulário real das funcionalidades e dados fictícios verossímeis. Costuma ficar melhor que o print: anima por partes, fica nítido em qualquer escala e se adapta ao 9:16.
4. **Sem tela:** produto físico, serviço, evento, marca pessoal. Use tipografia, formas, ícones, fotos que o usuário mandar (`imagem()` + `kenBurns`) e metáforas visuais do que o produto faz.

Arquivos de mídia ficam em `<projeto>/midia/`. Gravação vira sequência de quadros pro motor (`clipe()`), veja `motor.md`.
