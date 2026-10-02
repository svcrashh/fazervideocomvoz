# Molde: tela real com câmera (tutorial)

Tutorial de 3 a 8 passos com **a tela real gravada**: a câmera dá zoom e desliza até o campo da vez, o resto
ganha véu e desfoque, um cartão diz o passo, um intertítulo de 2–3 palavras separa as etapas e o vídeo fecha
num "Pronto!". A voz fala pouco (abertura e fecho, ou um passo ou outro) e a legenda karaokê acende a palavra
dita. Junta as fichas *do notebook ao detalhe*, *câmera que passeia na UI*, *tela real com cartão de passo* e,
no 9:16, *tutorial relâmpago com legenda karaokê* (catálogo, seção 3, molde 1).

## Quando usar
- Ensinar **uma tarefa** que a pessoa vai repetir: "como mandar o link", "como montar a cesta", "como cadastrar
  um aluno". Central de ajuda, YouTube, WhatsApp (9:16), dentro do app.
- Produto de computador (painel, SaaS, site) em que a tela inteira ficaria ilegível: a câmera resolve.
- Público leigo: o cartão traz a frase inteira do passo, em ritmo calmo.

## Quando não usar
- Anunciar novidade ou vender: falta gancho (use *lista que corre*, *capítulos com índice*, *texto que se digita*).
- Fluxo com mais de 8 passos: quebre em vídeos.
- Telão de evento ou feed sem som e sem paciência: tutorial não serve lá.
- App que só existe no celular e tela que já cabe legível: o modo tutorial da skill (`references/tutorial.md`)
  com moldura de celular basta.

## Como é o vídeo (linha do tempo)
| trecho | o que se vê |
|---|---|
| 0 → `abertura` (1,8 s) | **quadro 0 já com a promessa**: rótulo + título grande sobre a tela velada; a fala de abertura começa em 0,25 s com legenda karaokê |
| +1,0 s | plano geral: a tela inteira numa moldura de navegador (só para situar; nenhum texto citado aqui) |
| cada passo | o cartão "Passo N de M" + frase entra; a câmera chega no campo **um pouco antes do toque** (zoom 1,9–3,3× no 16:9, 3–3,3× no 9:16), véu + desfoque fora do campo, contorno fino na cor de destaque, cursor e anel de toque |
| entre etapas | intertítulo de 2–3 palavras sozinho no fundo da marca (1,1 s, corte seco) |
| rolagem | o foco desce/sobe junto com a página |
| sucesso | a câmera abre no resultado (`g.sucesso(alvo)`) |
| fim | círculo da cor de fim cresce do último campo: logo, "Pronto!", linha de apoio, fala de fecho com legenda |

16:9: cartão à esquerda, campo centrado na área livre à direita. 9:16: cartão no alto (dentro da área segura do
Reels), campo no meio, legenda karaokê embaixo. Os dois são **recompostos** a partir da mesma gravação de
computador (não é recorte de um no outro). 1:1 não é pedido pela ficha e não foi feito.

## Fluxo
1. **Gravar** com o gravador da skill (`scripts/tutorial/gravar.mjs`, contrato em `references/tutorial.md`):
   `versoes: ['computador']`, `aparelhos: { computador: { viewport: { width: 1280, height: 800 }, dsf: 3 } }`
   (DSF 3 = 3840×2400: dá zoom de até ~3× sem amolecer). Um `g.passo('frase')` por passo — **a frase do cartão é a
   legenda do passo** — e `g.sucesso(alvo)` no fim. Gravação crua de 8 a 14 s para um vídeo de 12–20 s. Em conta
   real, intercepte as chamadas de métrica (`p.route(/analytics|record_device/, r => r.abort())`) e não salve nada.
2. **Voz** (opcional, recomendada): `roteiro.json` com as falas `abertura` e `fechamento` (e, se quiser, `{ "passo": n }`),
   `voz.mjs gerar` e `voz.mjs ouvir --palavras …` (pronúncia conferida por transcrição). O molde lê o `locucao.json`.
3. **Parâmetros**: copie `exemplo.json` (Lumma, escura) ou `exemplo-pomar.json` (marca fictícia clara) e troque.
4. **Montar e renderizar**:
   ```sh
   node moldes/tela-real-com-camera/montar.mjs meu.json --sem-render     # só monta o projeto (segundos)
   node scripts/quadros.cjs --projeto <saida>/<id>/proj --tempos 0.1,4,9 [--formato 9x16]   # olhar quadros soltos + checagem
   node moldes/tela-real-com-camera/montar.mjs meu.json                   # rascunho 30 fps, os formatos do json
   node moldes/tela-real-com-camera/montar.mjs meu.json --modo final      # 60 fps com motion blur, voz mixada (−16 LUFS)
   ```
   Sai `<saida>/<id>-<formato>.mp4` e `<saida>/<id>-<formato>-folha.png`. **Olhe a folha** antes de entregar.
   Se o Playwright não for achado: `PLAYWRIGHT_PATH=<…>/node_modules/playwright`.

## Parâmetros (`exemplo.json`)
| campo | o que é |
|---|---|
| `id` | nome dos arquivos de saída |
| `gravacao` | pasta `saida/<versao>` do gravador (eventos.json, quadros.json, quadros/) |
| `saida` | onde escrever projeto e vídeos |
| `formatos` | `["16x9", "9x16"]` |
| `titulo` | linhas do título da abertura: lista, ou `{ "16x9": [...], "9x16": [...] }` para quebrar diferente |
| `rotulo` | linha pequena acima do título ("Marca · passo a passo") |
| `textoPasso` | rótulo do cartão, com `{n}` e `{N}` ("Step {n} of {N}" em inglês) |
| `endereco` | domínio na barra da moldura de navegador (só o domínio) |
| `etapas` | `[{ "passos": [1,2] }, { "intertitulo": "Agora o QR", "passos": [3,4] }]` — intertítulo antes da etapa |
| `passos` | opcional: `{ "2": { "frase": "…" } }` troca a frase do cartão sem regravar |
| `fim` | `{ "linha": "Pronto!", "apoio": "lummaone.com/7" }` |
| `voz.locucao` | `locucao.json` do `voz.mjs`; `voz.inicioAbertura` (padrão 0,25 s) |
| `marca.cores` | `fundo`, `superficie` (cartão, moldura, fundo da legenda), `texto`, `destaque` (rótulo, contorno, cursor, palavra dita), `sobreDestaque`, `veu` (cor do véu), `fimFundo`, `fimTexto` |
| `marca.veu` | opacidade do véu (0,6 em marca escura; ~0,4 com véu escuro sobre marca clara) |
| `marca.textura` | `pontos` ou `liso` |
| `marca.fontesPasta` | pasta com `fontes.css` e woff2 locais (gere com `scripts/fontes.mjs`) |
| `marca.fontes` | `titulo { familia, peso, caixa: alta|normal }`, `texto { familia, peso, pesoForte }`, `mono { familia, peso }` |
| `marca.logo` | `{ arquivo, w, h }` (PNG ou SVG), no cartão final |
| opcionais | `velocidade` (1), `abertura` (1,8), `planoGeral` (1,0), `intertituloDur` (1,1), `segurarSucesso` (1,4), `segurarFim` (0,4), `fimDur` (2,4), `contexto { w: 420, h: 220 }` (o mínimo de tela em volta do alvo, em px CSS: menor = mais zoom), `plataforma`, `sub` |

## Variações
- **Marca escura × clara**: o véu é sempre escuro (`cores.veu`), a superfície do cartão muda (provado com Lumma e Pomar).
- **Mais voz**: uma fala por passo (`{ "passo": n }`) entra 0,1 s depois de o passo começar, com karaokê; mantenha a
  voz em ~metade do tempo (regra 8).
- **Mais ou menos zoom**: `contexto`.
- **Sem intertítulo**: uma etapa só.

## Limites (o que o molde não faz)
- A gravação é uma só, de computador; o 9:16 recompõe a mesma tela. Celular gravado em viewport de celular
  não foi testado neste molde (use o modo tutorial da skill).
- Texto do app de 14 px chega a ~34 px no 16:9 (3,1% da altura) e a ~42 px no 9:16 (2,2% da altura; 3,9% da
  largura). Para mais no 9:16, grave com texto maior ou DSF 4.
- Sem trilha nem efeitos de som: só a voz, normalizada a −16 LUFS. A trilha da skill (`assets/audio`) entra
  por fora, se o pedido quiser.
- O destaque segue o retângulo gravado do alvo; elemento que se move sozinho (animação do app) sai do foco.
- O plano geral mostra a tela inteira por 1 s, de propósito; nada citado pela voz ou pelo cartão aparece nele.
