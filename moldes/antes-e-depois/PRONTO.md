# PRONTO — molde antes-e-depois (02/10/2026)

## O que foi provado (render final 60 fps + folha de quadros olhada)
Vídeos e folhas em `~/Desktop/moldes-teste/antes-e-depois/`:

| marca | variação | formato | arquivo | duração |
|---|---|---|---|---|
| LUMMA1 (G7VEN, `lummaone.com/7`) | corte | 16:9 | `lumma/lumma-fotos-naturais-16x9.mp4` | 14,27 s |
| LUMMA1 | corte | 9:16 | `lumma/lumma-fotos-naturais-9x16.mp4` | 14,27 s |
| LUMMA1 | corte | 1:1 | `lumma/lumma-fotos-naturais-1x1.mp4` | 14,27 s |
| LUMMA1 | zoom-out | 16:9 | `lumma-zoom-out/lumma-fotos-naturais-zoom-out-16x9.mp4` | 14,27 s |
| LUMMA1 | zoom-out | 9:16 | `lumma-zoom-out/lumma-fotos-naturais-zoom-out-9x16.mp4` | 14,27 s |
| Cestou (fictícia: lista de compras, creme/rosa/verde, Unbounded + Space Grotesk) | corte | 16:9 | `cestou/cestou-por-corredor-16x9.mp4` | 12,37 s |
| Cestou | corte | 9:16 | `cestou/cestou-por-corredor-9x16.mp4` | 12,37 s |

Os 7 MP4 têm vídeo + áudio (a voz) na resolução certa (conferido com ffprobe). Cada um tem `folha-<nome>-<formato>.png` ao lado. O que conferi nelas:
- **Quadro 0** já tem a promessa escrita e a tela no "antes" com a etiqueta ANTES (regra 1).
- **Mesmo enquadramento** nos dois estados; o corte é seco no quadro do clique (regra 6).
- **Nada encolhido**: o foco de cada formato é ampliado (16:9 a 1,16×, 9:16 a 2,46×, Cestou 16:9 a 1,13×);
  o molde grita `TELA ENCOLHIDA` se ficar abaixo de 1× (regra 2).
- Etiqueta, legenda e o rótulo do gatilho subiram para ≥ 3% da altura depois da primeira folha.
- Título e bordão se encaixam sozinhos na largura (a Unbounded da Cestou estourava a coluna; a primeira folha
  mostrou "em or…" cortado, e foi isso que levou ao encaixe automático).
- Cortina sem salto (na 1ª versão o "antes" voltava inteiro por um quadro — corrigido).
- Fecho com véu + desfoque, bordão, logo e endereço (regra 3, regra 11).
- Legenda = a fala, palavra a palavra no tempo da ElevenLabs (regra 4). Voz ~45% do tempo (regra 8).
- Duas marcas de cara oposta (escuro/laranja/Oswald inclinado × claro/rosa/Unbounded reto) sem tocar no código.

## Tela real
- LUMMA1: Playwright em `lummaone.com/7` (página pública do G7VEN), desk 1440×900 @2x e celular 390×844 @3x,
  com `presskit_analytics_events` e `record_device` **abortados** (10 chamadas bloqueadas). Nada foi gravado em
  kit nenhum; não entrei na `primoteste`.
- O "depois" (foto natural) é **encenado na página real**: o molde injeta o CSS que tira o filtro de cor da foto,
  que é o que a opção "Fotos: Naturais" do construtor faz. Não gravei o clique no construtor porque o cofre
  `~/.claude/secrets/lumma.env` **não tem `LUMMA_E2E_PASSWORD`** (a senha da `primo@lummaone.com`). Com a senha,
  é trocar `depois.css` por `depois.clicar` numa captura logada.
- Cestou: a tela é um HTML fictício (`exemplos/cestou/tela.html`) capturado pelo mesmo `capturar.mjs`.

## Voz
- 4 falas curtas (2 por marca), voz Davi Andrei, 77 créditos, sem retentativa.
- Transcrição (`voz.mjs ouvir`): LUMMA1 2/2 ok ("layout", "Naturais" ouvidos).
  Cestou: a transcrição ouviu **"sextou"** no lugar de "Cestou" — em pt-BR as duas soam iguais (homófonas);
  não refiz. Marca real com nome assim precisa de `pronuncia` ou aceitar o homófono.

## O que ficou de fora
- **Trilha**: os MP4 saem só com a voz. A trilha que abaixa sob a voz e o `finalizar.mjs` (loudness, sincronia)
  ficam para a integração com a skill.
- **1:1 da Cestou** não renderizado (o molde faz; faltou tempo de render).
- **Cestou 16:9 com texto pequeno:** o foco pega a página inteira (1120 px a 1,13×), e as linhas da lista ficam com
  ~2% da altura do quadro, abaixo dos 3% da regra 2. Não está encolhida, mas pede foco mais fechado (duas colunas,
  `foco: [0, 0, 760, 550]`). Não refiz por causa do prazo.
- No 9:16 da Cestou, a etiqueta DEPOIS cobre parte do logo do app no topo da tela. Vale um `foco` que comece
  abaixo do cabeçalho ou uma opção de mudar o canto da etiqueta.
- Três estados (fundo → transparente → fundo novo) e "contagem de dias" (vários estados no tempo).
- Área segura de Reels (`plataforma: null`): no 9:16 a legenda fica em y ≈ 1670–1760, na faixa que a interface
  do Reels cobre.

## O que eu não consegui conferir
- **Som**: não ouvi nenhum vídeo. A voz está posicionada pelos tempos (`adelay`), e a transcrição confere as
  palavras, mas volume, respiração e a emenda com o clique não foram ouvidos.
- Um quadro do zoom-out (≈ 5,5 s, 16:9) mostra um retalho claro no canto inferior esquerdo durante o recuo, na
  folha a 24 quadros; não investiguei se é o cursor saindo ou a borda da captura.

## Pedidos ao integrador
- `capturar.mjs` e `renderizar.mjs` acham o Playwright por `scripts/playwright.cjs`; nesta máquina só funcionou
  com `PLAYWRIGHT_PATH=~/Desktop/fetchbuild-video/node_modules/playwright`.
- O `render.cjs` sai com código ≠ 0 quando há `console.error`; o `renderizar.mjs` trata isso como aviso e segue.
