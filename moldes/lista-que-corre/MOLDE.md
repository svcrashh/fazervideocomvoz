# Molde: lista que corre

Novidades **sem índice**. Cada item é uma **frase curta + a prova de tela**: a interface redesenhada, grande, fazendo
o que a frase promete. Um botão de velocidade muda o vídeo inteiro: **rajada**, **lista** ou **cartaz**. Fecha com o
**muro** (o tamanho da atualização) e a marca com o bordão. Junta as fichas rajada de recursos, lista-relâmpago,
lista numerada, cartão-frase e relâmpago, recursos no feed, UI desmontada e muro, cartaz e prova, e etiqueta de
novidade no canto (catálogo §3, molde 3).

## Quando usar / quando não

**Use** para update, patch notes e "o que tem de novo" de 3 a 10 itens, para quem já conhece o produto: Reels e
TikTok (rajada), site, YouTube e WhatsApp (lista), lançamento e feed sem som (cartaz). Também é o molde para quando o
último vídeo foi "capítulos com índice" e o próximo não pode repetir a cara.

**Não use** para ensinar o caminho de clique (use tela real com câmera), para uma novidade só (use antes e depois ou
número que conta) nem para quem nunca viu o produto (a rajada vira ruído; no máximo, cartaz).

## Como é o vídeo

| Trecho | O que tem | Tempo |
|---|---|---|
| Abertura | o número grande + "novidades …" + selo (data/versão) + marca, **já escritos no quadro 0** | 1,6–2,2 s |
| Itens | painel com a prova no mesmo lugar em todo item (corte seco não pula); no canto, **sempre o mesmo**, o número do item numa etiqueta de cor + o nome curto; a frase ao lado (16:9) ou embaixo (retrato) | 1,1 / 2,4 / 4,4 s por item |
| Muro | o total contando, os nomes de **todas** as novidades em pílulas (as mostradas em destaque) | 2,4–2,6 s |
| Fecho | cartões de frase (opcional) → marca, bordão e endereço, parados ≥ 1,2 s | 2,2 s (+0,9 por cartão) |
| Legenda | a fala, palavra a palavra, com a palavra da vez na cor de destaque | sempre que a voz fala |

Fundo: a cor da marca com uma mancha de luz na cor de destaque que muda de lugar a cada trecho (e grade fina, se
`gradeFundo`).

## Velocidades (o botão)

| `velocidade` | Por item | O que muda | Para |
|---|---|---|---|
| `rajada` | 1,1 s | sem frase (o nome do item vira o texto grande), fundo de cor chapada trocando a cada item (`marca.paleta`), provas aceleradas, cartões de frase no fecho | Reels, TikTok, consumidor jovem |
| `lista` | 2,4 s | etiqueta numerada + frase; prova viva (toque, contagem, troca) | site, YouTube, WhatsApp, B2B |
| `cartaz` | 4,4 s | 1,5 s de **cartaz** em tela cheia (a frase grande, palavra-chave na cor de destaque) → a prova entra sobre um bloco de cor | lançamento, feed sem som, telão |

`ritmo` no JSON sobrescreve qualquer tempo (`{ "item": 2.0, "muro": 3 }`); `itens[n].dur` muda só um item.

## Parâmetros (`exemplo.json`)

- `marca`: `nome`, `tema` (`escuro`/`claro`), `logo` (PNG; sem logo, o nome é escrito na fonte de título), `cores`
  (`fundo`, `superficie`, `campo`, `texto`, `destaque`, `tinta` = texto sobre o destaque, `ok`), `paleta` (cores de
  fundo da rajada e dos blocos do cartaz: claras o bastante para a etiqueta de destaque aparecer), `fontes`
  (`titulo`, `texto`, `mono`, baixadas pelo `scripts/fontes.mjs`), `pesoTitulo`, `caixaAlta`, `inclina` (graus de
  inclinação do título), `gradeFundo`, `luz` (força da mancha, 0–0,2), `grao`.
- `velocidade`, `semente` (muda o caminho da luz), `ritmo`.
- `abertura`: `numero`, `linhas` (ou `titulo`, quebrado em 2), `selo`.
- `itens[]`: `etiqueta` (2–3 palavras: o nome no canto e no muro), `frase` (≤ 6 palavras), `cartaz` e
  `palavraChave` (velocidade cartaz), `cor` (bloco do cartaz), `dur`, `prova`.
- `muro`: `rotulo`, `extras` (as novidades que não viraram item), `total` (se não for itens + extras). **Sem `muro`,
  o vídeo pula o muro.**
- `fecho`: `bordao`, `endereco`, `cartoes` (frase partida em 2–3 cartões) e `cartoesEm` (em quais velocidades).
- `voz`: `perfil`, `voz` (`id`, `nome`), `ajustes`, `pronuncia`, `palavrasDeRisco`. `falas[]`: `id`, `onde`
  (`abertura`, `muro`, `fecho` ou `{ "item": n }`), `atraso` (s depois do início do trecho), `texto`.
- `trilha`: `semente` (uma por vídeo; sem ela vale a `semente` do JSON) e `identidade` (o gênero do público, no
  esquema v2 de `assets/audio/API.md`: `genero`, `bpm`, `modos`, `tons`, `instrumentos`…). Sem `identidade`, sai
  uma neutra (epiano/piano, BPM pela velocidade): declare a da marca. Lumma = `house`; Brotto = `acustico`.

### Provas (`itens[].prova.tipo`)

Interface redesenhada com os **rótulos exatos** do produto. Toda prova aceita `titulo` (barra do painel).

| tipo | campos | o que acontece |
|---|---|---|
| `grade` | `itens[{nome, cor, cor2, tinta, botao}]`, `selecionado`, `colunas`, `contador{de, ate, rotulo}` | miniaturas entram, toque escolhe uma, o contador conta |
| `paleta` | `paletas[{nome, cores[4], previa[4]}]`, `ordem` | toque em cada paleta repinta a prévia |
| `numeros` | `cartoes[{rotulo, valor}]`, `total{rotulo, valor}` | os números contam, o total por último na cor de destaque |
| `campo` | `rotulo`, `dica`, `de`, `para`, `resultado` | o texto sujo vira o limpo, com o ✓ |
| `lista` | `linhas[]` (texto ou `{t, destaque}`) | linhas entram com ✓ |
| `foto` | `src`, `posicao`, `titulo`, `corTitulo`, `chips[]`, `chipAtivo` | foto ou print recortado, cobrindo o painel, com zoom lento |
| `interruptores` | `itens[{nome, ligado}]`, `troca`, `aviso` | toque troca um interruptor, aviso confirma |
| `barra` | `rotulo`, `de`, `para`, `max`, `unidade`, `casas`, `nota` | o número e a barra vão de `de` a `para` |
| `escolha` | `pergunta`, `opcoes[]`, `ativa`, `colunas`, `botao` | toque escolhe a opção, o botão acende |

## Formatos

16:9, 9:16, 1:1 e 4:5, **recompostos** (não recorte): no 16:9 a frase fica à direita da etiqueta e o muro dos dois
lados do número; no retrato a marca vai pequena no alto, a frase quebra em 2 linhas embaixo da etiqueta e o muro
fica em cima e embaixo do número.

## Como renderizar

```sh
node moldes/lista-que-corre/render.mjs <params.json> --saida <pasta> [--nome x] [--formatos 16x9,9x16,1x1,4x5]
     [--modo rascunho|final] [--sub 2] [--velocidade rajada|lista|cartaz] [--itens 1,2,3] [--voz] [--sem-trilha]
```
Exemplo (rascunho rápido, ~15 s; a voz em cache no projeto não gasta crédito):
```sh
FAZERVIDEO_PY=<python com numpy e scipy> node moldes/lista-que-corre/render.mjs moldes/lista-que-corre/exemplo.json \
     --saida ~/Desktop/lista-teste --nome lumma-lista --formatos 16x9 --modo rascunho
```

- Monta `<saida>/<nome>/` (molde + `assets/template/engine.js` + `params.js` + fontes + mídia), gera a voz com
  `--voz` (`scripts/voz.mjs gerar`, teto de 400 caracteres), recusa fala que não cabe no trecho, renderiza cada
  formato e tira a folha. Sai `<saida>/<nome>-<formato>.mp4` e `<saida>/folha-<nome>-<formato>.png`. **Olhe a folha.**
- `--velocidade` e `--itens` trocam a velocidade e escolhem itens sem editar o JSON; os itens que ficam de fora vão
  para o muro, para o total continuar verdadeiro.
- Uma `voz/v1/locucao.json` já existente no projeto é reaproveitada sem `--voz` (copie de outro formato da mesma
  marca para não pagar duas vezes).
- **Trilha** (com voz e um Python com numpy/scipy em `FAZERVIDEO_PY`, `PYTHON` ou `python3`): escreve
  `audio/voz.wav`, `audio/folha.json` (seções = os trechos do plano; um **marco em cada corte**: entra item, muro,
  fecho; bloco `voz`, Contrato M), `audio/identidade.json` e `legenda.srt`, roda `assets/audio/arranjo_serie.py`
  (a cama cede à voz pelo `mix_voz.py`, e cada corte vira um acento musical na amostra exata, **obrigatório na
  rajada**: a batida do corte) e mede com `assets/audio/verifica.py`. Mira −14 LUFS; se o verifica reprovar (com
  pouca voz e cama esparsa o limiter do master aperta uma fala mais que a outra), recompõe a −16. Cada formato é
  juntado pelo `scripts/finalizar.mjs`, que confere duração, loudness, pico e cada fala no tempo e ≥ 15 dB acima da
  trilha, já no AAC. Sem esse Python, ou com `--sem-trilha`, sai só a voz em −16 LUFS (e o render avisa).
- Depois da voz: `node scripts/voz.mjs ouvir <proj>/voz/v1/locucao.json --palavras "<palavrasDeRisco>"`.
- Prévia: `<proj>/index.html?f=9x16&t=5.2`.
- O Playwright é achado como no resto da skill (`node_modules` da pasta ou dos pais, `PLAYWRIGHT_PATH`).

## Limites

- **Trilha só com voz.** Sem falas, o vídeo sai mudo (a trilha nasce da folha com o bloco `voz`). Os cortes são
  acentos musicais (nota do acorde), não efeitos (whoosh, impacto): para efeito, ponha `efeito` no marco da folha.
- A prova é **interface redesenhada**, não gravação: para tela gravada, use `foto` com um print recortado, ou o molde
  tela-real-com-camera. Não há recorte de vídeo (`clipe`) aqui.
- Logo só em PNG (ou declare `logoAspecto`).
- O muro foi feito para 8–40 nomes; com mais de ~40 as pílulas ficam pequenas demais para ler (de propósito, no
  original, mas confira na folha).
- A legenda fica numa linha; frase longa encolhe até 70% e depois corta: escreva falas curtas.
