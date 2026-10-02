# Molde: antes e depois

A **mesma tela, no mesmo enquadramento, em dois estados**, cortada no clique. O olho compara sozinho.
Junta as fichas *antes e depois na tela*, *com e sem lado a lado*, *tela dividida casada* e *zoom-out que revela*
(catálogo, seção 3, item 5). Regras 6 e 10 do catálogo: prova > promessa, e o produto é o mecanismo.

## Quando usar
- Um recurso que transforma algo **visível** em **um passo**: foto pintada → natural, lista bagunçada → por
  corredor, planilha → gráfico, fundo → sem fundo, extrato cru → categorizado.
- Reels/WhatsApp (gancho de 12–15 s), anúncio, virada de lançamento, tutorial de um toque.

## Quando NÃO usar
- O recurso é invisível (segurança, desempenho, integração): use número que conta.
- A diferença é sutil ou o "antes" já é bom: ninguém vê a virada.
- Processo de vários passos: é tutorial (tela real com câmera).
- Comparar com concorrente nomeado.

## Como o vídeo anda (os tempos saem da voz)
| quando | o quê |
|---|---|
| 0 s | **promessa** escrita (título) + a tela no estado "antes", com a etiqueta ANTES no canto fixo. Nada de quadro vazio. |
| 0,5 s | fala "antes"; câmera empurra devagar (1,00 → 1,06) |
| fim da fala − 0,6 s | o **gatilho** entra: o controle do produto com os rótulos exatos (ex.: "Fotos · Na cor do layout / Naturais") e o cursor vai até a opção |
| fim da fala + 1,1 s | **clique = corte seco** para o "depois", mesmo enquadramento; etiqueta vira DEPOIS/AGORA na cor de acento; palavra da virada ("Natural.", "Fácil.") no canto oposto |
| clique + 0,25 s | fala "depois" |
| depois da fala | **cortina**: a divisória entra pela esquerda e para no meio — antes à esquerda, depois à direita, parados ~2,6 s |
| cortina + 2,6 s | **fecho**: véu + desfoque na tela, bordão, logo e endereço (3,2 s) |

Duração = voz + respiros, mínimo 12 s; o script avisa acima de 20 s.

## Variações
- `"variacao": "corte"` (padrão) — o descrito acima.
- `"variacao": "zoom-out"` — começa ampliado (`zoomDetalhe`, 2–3×) no `detalhe` do antes; o corte do clique
  acontece ainda ampliado e só então a câmera recua até a tela inteira: o detalhe muda de sentido quando aparece
  o todo. Bom para "este número… era a sua fatura". Também por linha de comando: `--variacao zoom-out`.
- **Formatos:** 16:9 (título e legenda numa coluna à esquerda, tela à direita), 9:16 (título em cima, tela no
  meio, legenda em pílula embaixo — use a captura de **celular**), 1:1 (título em cima, legenda sobre a tela).
  Recompostos, não recortados: cada formato tem o próprio `foco` e pode usar outra captura.

## Parâmetros (`exemplo.json`; segunda marca em `exemplo-cestou.json`)
- `marca`: `nome`, `logo` (PNG, ou `null` = nome escrito na fonte do título), `url`,
  `cores` { `fundo`, `superficie`, `texto`, `apagado`, `linha`, `acento`, `sobreAcento` } (acento e fundo em hex),
  `fontes` { `titulo`, `tituloPeso`, `tituloCaixaAlta`, `tituloInclinacao` (graus), `texto`, `mono` } — famílias do
  Google Fonts; o render baixa para dentro do projeto.
- `textos`: `promessa` e `bordao` (linhas de partes `{t, k}`; `k: true` = cor de acento), `antes`, `depois`
  (etiquetas), `virada` (uma palavra).
- `gatilho`: `titulo`, `opcoes` (rótulos **exatos** do produto), `escolha` (índice da opção clicada).
- `falas`: `antes` e `depois` (o texto da voz e da legenda). A voz sai da skill (`scripts/voz.mjs gerar`),
  com `onde: { passo: 1|2 }`.
- `captura`: `url` (ou caminho de HTML local), `bloquear` (rotas abortadas: analytics, registro de aparelho),
  `esperar`, `telas` { nome: { w, h, escala } }, `depois` { `clicar` seletor | `css` | `js` | `url` }.
- `formatos` { `16x9` | `9x16` | `1x1`: { `tela` (nome da captura), `foco` [x, y, w, h] em px CSS da captura,
  `detalhe` [x, y], `zoomDetalhe` } }. O foco é ampliado para cobrir a janela; se ficar **menor** que 1×, o
  console grita `TELA ENCOLHIDA` (regra 2: nunca a tela inteira encolhida).

## Como renderizar
```sh
M=~/Documents/GitHub/fazervideocomvoz/moldes/antes-e-depois
# 1. as duas telas (mesmo viewport); Playwright achado por scripts/playwright.cjs ou PLAYWRIGHT_PATH
node $M/capturar.mjs exemplo.json --saida <pasta>/telas
# 2. a voz (roteiro com as falas "antes" e "depois"), conferida por transcrição
node <skill>/scripts/voz.mjs gerar <pasta>/voz/roteiro.json --saida <pasta>/voz
node <skill>/scripts/voz.mjs ouvir <pasta>/voz/locucao.json --palavras "Marca,Termo"
# 3. o vídeo (rascunho = 30 fps sem motion blur; final = 60 fps, 4 subquadros)
node $M/renderizar.mjs exemplo.json --telas <pasta>/telas --locucao <pasta>/voz/locucao.json \
     --saida <pasta> --formatos 16x9,9x16,1x1 --modo rascunho
```
Sai `<nome>-<formato>.mp4` com a voz e `folha-<nome>-<formato>.png`. **Olhe a folha** antes de entregar.
Prévia parada num instante: `<pasta>/projeto/index.html?f=9x16&t=4.3`.

## Limites
- Título e bordão **se ajustam** à largura (o corpo diminui); abaixo de 70% do previsto o console pede texto
  mais curto. Fonte larga (Unbounded) pede 2–3 palavras por linha.
- Só **dois** estados. Três (fundo → transparente → fundo novo) ainda não.
- Sem trilha: o MP4 sai só com a voz. A trilha que abaixa sob a voz é a da skill (`assets/audio`, `finalizar.mjs`).
- O gatilho é **desenhado** pelo molde (com os rótulos do produto), não gravado: o clique de verdade fica na
  captura (`depois.clicar`) quando a tela tem o botão visível.
- Sem checagem de área segura de plataforma (`plataforma: null`): no 9:16 para Reels, a legenda fica em
  y ≈ 1670–1760, dentro da faixa que a interface do Reels cobre. Para Reels, suba a legenda.
- O `zoomDetalhe` amolece acima da `escala` da captura ÷ escala do foco; capture em 2×–3×.
