# Motor (`engine.js`)

## Sumário
1. Como o motor funciona
2. API
3. Receitas de cena
4. Armadilhas (cada uma já custou tempo)

---

## 1. Como o motor funciona

- Cada cena é HTML/SVG comum. `cena(t0, t1, build)` registra a cena. `build(root)` monta o DOM **uma vez** e devolve `update(t)`, que só ajusta transform, opacidade e atributos a partir do tempo `t`.
- `renderAt(t)` liga as cenas ativas em `[t0, t1)` e chama os `update`. As cenas podem se sobrepor no tempo; a registrada depois fica por cima.
- O render (`render.cjs`) abre N abas do Chromium, chama `renderAt(t)` em cada uma e captura quadro a quadro, mandando tudo pro ffmpeg. Sem relógio, sem animação CSS e sem aleatório não-semeado, o resultado é idêntico a cada render. É isso que permite motion blur por subquadros.
- Formato pela URL: `index.html?f=9x16`. `W`, `H`, `CX`, `CY` e `VERTICAL` já vêm certos, e `L({ '16x9': a, '9x16': b })` escolhe o valor por formato.
- Prévia ao vivo: `index.html?play` toca com a trilha (`VIDEO.audio`); espaço pausa, ←/→ pula 1 s. `index.html?t=12.5` abre parado num instante.
- Ordem de carga: `video.js` (configuração) → `marca.js` (marca) → `engine.js` → `cenas.js` → `iniciar()`. O `iniciar` espera as fontes de `VIDEO.fontes`, monta todas as cenas visíveis (pra poder medir) e só então esconde.

## 2. API

**Tempo e easing**
- `P(t, a, b)`: progresso 0→1 com trava.
- `E.outExpo`, `E.inOutCubic`, `E.outBack(x, s)`, `E.inExpo`…: easings.
- `spring(dt, f, z)`: mola 0→1 com overshoot. Use `f` 1,3–2,8 e `z` 0,35–0,6.
- `pulse(dt, amp, f, d)`: escala que começa em 1+amp e assenta.
- `wob(dt, f, d)`: oscilação amortecida a partir de 0 (squash, tremor).
- `bez(x1, y1, x2, y2)` (também `E.bez`) é um cubic-bezier de verdade, o mesmo do CSS e do After Effects. Use quando o manual da marca der as curvas: `const acende = bez(0.16, 1, 0.3, 1)`.
- `lerp`, `clamp`, `rng(seed)` (aleatório com semente), `mix(hexA, hexB, t)`, `rgba(hex, a)`.

**DOM**
- `el(tag, props, parent)` e `sv(tag, attrs, parent)` criam HTML e SVG.
- `svgQuadro(parent)` cria um SVG do tamanho do quadro.
- `camada(root, fundo)` cria uma div de tela cheia com fundo, dentro do root. É nela que as transições atuam, e o root fica sem fundo.
- `place(e, x, y, w, h)`, `T(e, transform)`, `O(e, opacity)`.
- `rectOf(e)` e `centrarX(e, x)`: meça na construção, antes de transformar.

**Texto**
- `textLine(parent, [{t, style}], style)` → `{ line, words, chars }`: uma máscara por palavra e um span por letra. A linha já sai marcada como alvo da checagem de colisão (`data-colisao="texto"`).
- `bloco(parent, [[parts], [parts]], { top, entrelinha, style, alinhar, x })` monta várias linhas centradas. `palavras(ls)` e `letras(ls)` juntam as palavras e letras das linhas.
- Entradas e saídas: `riseWords(words, t, t0, stagger, dur)`, `riseChars(...)`, `exitWords(...)`, `quedaLetras(words, chars, t, t0)`.
- `digita(chars, t, t0, t1)` revela letra a letra; `conta(el, t, t0, t1, de, ate, casas)` faz o número contar.

**Traço e formas**
- `traco(path)` → `p => …`: desenha um path de 0 a 1.
- `STAR`: estrela de 4 pontas unitária (escale via transform).
- `makeBlob(parent, size, cor, corDoTraco?)` e `breathe(blob, t, x, y, escala, rot, formaA, fase, cor?, opacidadeTraco?)`: formas orgânicas que respiram nos cantos.
- `FORMAS`: usa `MARCA.formas` se houver, senão formas procedurais. `formaOrganica(seed)` gera outras.
- `samplePath`, `alignPts`, `ptsToPath`: morph genérico entre dois paths quaisquer (reamostra em 96 pontos).

**Fotos e gravações**
- `imagem(parent, src, style)` cria um `<img>` absoluto, e o motor espera a imagem decodificar antes do primeiro quadro.
- `kenBurns(img, t, t0, t1, [escala, x%, y%], [escala, x%, y%])` faz zoom e pan lento entre dois enquadramentos.
- `camera(chaves, { cw, ch, vw, vh, zmax })` → `cam(t) = { x, y, z }` é a câmera guiada por chaves sobre um conteúdo `cw×ch` visto numa janela `vw×vh`.
  - Cada chave é `{ t, x, y, z, dur?, ease? }`: no instante `t`, a câmera está centrada em `(x, y)` do conteúdo, com zoom `z` (1 = o conteúdo cobre a janela). `dur` é quanto tempo ela leva pra chegar ali (padrão 0,7 s); o easing padrão é `E.inOutCubic`, e o zoom é interpolado em escala logarítmica.
  - O zoom fica preso em `[1, zmax]` e o centro é travado, pra a janela nunca mostrar fora do conteúdo.
  - `zmax` = resolução de origem ÷ tamanho na tela; acima disso a imagem amolece.
- `aplicarCamera(el, cam, t)` aplica a câmera num elemento (com `transformOrigin 0 0`) que contém o conteúdo `cw×ch` e devolve `{x, y, z}`.
- `clipe(parent, arquivos, fps, style)` → `{ el, set(t, t0) }` mostra um trecho de vídeo quadro a quadro, de forma determinística. Extraia antes com `ffmpeg -i gravacao.mp4 -vf "fps=30,scale=1080:-1" midia/clipe/q%04d.jpg`. Mantenha os trechos curtos (≤ 5 s, ~150 quadros) e na resolução em que vão aparecer: tudo fica na memória.
- `sequencia(parent, [[arquivo, tempo], …], style)` → `{ el, set(tv) }` serve pra sequências longas (tela gravada, centenas de quadros grandes). É um `<img>` só, que troca de arquivo conforme o tempo: `set(tv)` mostra o último quadro com tempo ≤ `tv`. A decodificação entra em `ESPERA_QUADRO`, e o `renderAt(t)` devolve uma Promise que o render e o `quadros.cjs` aguardam antes de capturar. Nada fica na memória além do quadro da vez.
- Tag `<video>` não serve pro render: o tempo dela não é determinístico.

**Logo**
- `logoPartes(g, MARCA.logo.partes)` → partes animáveis.
- `medirPartes(ps)`: chame depois de montar o SVG.
- `setParte(q, dx, dy, rot, sx, sy)` move a parte em torno do próprio centro, em unidades do viewBox.
- `pontoInterno(path)` → `{x, y, r}`: o ponto mais "gordo" dentro de uma forma, pra mergulhar a câmera nele.

**Transições** (catálogo, durações e sons em `references/transicoes.md`)
- `TR.<nome>.sai(camada, t, t0, dur, opts)` no update da cena que sai e `TR.<nome>.entra(camada, t, t0, dur, opts)` no update da cena que entra. As duas cenas se sobrepõem em `[t0, t0+dur]`.
- Os nomes são `whip` e `push` (com `dir`), `zoom` (`x, y, raio`), `mascara` (`forma`: `'circulo' | 'diagonal' | 'barras' | 'lamina'`), `virada` (`tipo`: `'cartao' | 'pagina'`) e `morph` (`de`: retângulo medido ou path).
- Chame sempre, sem `if`. A camada é da transição: o motor restaura `transform`, `filter`, `clip-path`, `opacity`, `display` e `z-index` dela a cada quadro.
- `TRANSICOES` é a lista `{ nome, t0, dur }` que as chamadas registram. Uma transição feita à mão se registra com `registrarTransicao(nome, t0, dur)`. `tocar(el, prop, valor)` escreve um estilo que volta ao original no quadro seguinte.

**Checagem "tem algo na frente?"**
- `marcar(el, tipo, nome?)` marca um alvo, com `tipo` `'texto' | 'logo' | 'legenda'`. `textLine`/`bloco` já marcam cada linha. Marque logos (`marcar(svg, 'logo', MARCA.nome)`), números de `conta` e legendas. `marcar(el, false)` desmarca, pra texto decorativo que passa por baixo de propósito (palavra gigante de fundo, por exemplo).
- `checarQuadro(t)` (em `window`, é async) devolve `[{ tipo: 'colisao' | 'area', t, msg, … }]` e deixa a página renderizada em `t`. Cada alvo **parado** (o retângulo mexe ≤ 2 px até `t + 1/30`) e **opaco** (opacidade efetiva ≥ 0,9) é testado de duas formas:
  - **Cobertura:** uma grade de 5×3 pontos com `elementsFromPoint`. Contam como cobertura forma SVG pintada, `img`/`canvas`/`video`, HTML com fundo de alfa ≥ 0,35, imagem ou gradiente de fundo e texto de outro elemento. O grão, o `<svg>` raiz, elementos com opacidade < 0,05 e HTML sem pintura no ponto não contam, e ponto recortado (máscara, `clip-path`) não entra na conta. É erro se ≥ 20% dos pontos estiverem cobertos. Dentro da janela de uma transição registrada, a cobertura não é acusada.
  - **Área segura:** o retângulo tem que caber em `areaSegura()`, que vem de `VIDEO.plataforma` (ver `formatos.md`).
- O retângulo do alvo é o que ele **mostra**: letras visíveis recortadas pela máscara, as formas de um SVG ou o texto de um HTML. Não é a caixa inteira.
- Quem roda a checagem: o `quadros.cjs` em todo quadro, o `quadros.cjs --checar` na linha do tempo inteira e a folha `--auto` que o rascunho gera. As mensagens saem assim: `COLISÃO t=3,20 s: texto "Planilha nunca mais." coberto por div (fundo #FF6B4A) em 40% dos pontos` e `ÁREA SEGURA t=…: texto "…" sai da área segura do reels (y 1520 > 1450)`.

**Câmera e quadro**
- `iris(el, r, x, y)` recorta num círculo.
- `raioCobre(x, y)`: raio que cobre o quadro a partir de (x, y).
- `VIDEO.impactos = [[t, intensidade]]` gera tremor automático.
- `VIDEO.selo` põe o símbolo pequeno por cima nas cenas internas.
- `VIDEO.grao` controla o grão.

## 3. Receitas de cena

Esqueleto:
```js
cena(4.0, 10.0, (root) => {
  root.style.background = MARCA.cores.escuro
  const ls = bloco(root, [[{ t: 'Planilha' }], [{ t: 'nunca mais.', style: { color: MARCA.cores.acento, fontStyle: 'italic' } }]],
    { top: L({ '16x9': 380, '9x16': 760 }), entrelinha: L({ '16x9': 170, '9x16': 180 }), style: { font: `800 ${L({ '16x9': 150, '9x16': 140 })}px "Fonte"`, color: '#fff' } })
  return (t) => {
    riseWords(palavras(ls), t, 4.0, 0.08)
    exitWords(palavras(ls), t, 9.7)
  }
})
```

**Mergulho numa forma do logo (zoom-through):**
```js
const alvo = partes[2].p, best = pontoInterno(alvo)          // em unidades do viewBox
const k = alturaPx / alturaViewBox                             // px por unidade
const fx = svgLeft + (best.x - vbX) * k, fy = svgTop + (best.y - vbY) * k
const zmax = (1.12 * raioCobre(fx, fy)) / (best.r * k)
// no update: câmera = container com transformOrigin '0 0'
const z = Math.exp(Math.log(zmax) * E.inCubic(P(t, 3.45, 3.97)))
T(cam, `translate(${fx}px,${fy}px) scale(${z}) translate(${-fx}px,${-fy}px)`)
```
No tempo exato do fim, corte seco pra cena seguinte, com o fundo da cor da forma ou um contraste forte no downbeat.

**Peças do logo chegando no tempo, com gabarito:** desenhe antes o contorno de cada parte com `traco` (stroke fino, opacidade 0,4). Cada parte vem de fora do quadro por um arco: `pos = off*(1-e) + normal*sin(πe)*0.22*|off|`, com `e = E.inOutCubic(P(t, L-0.58, L))`. Ela chega exatamente no tempo `L` da música e ganha squash com `wob(t-L, 3.2, 7)`, mais uma ondulação (círculo com stroke que cresce e some) no centro da parte.

**Riscar e trocar:** traço coral por cima da frase (`traco` em 0,22 s). Depois `quedaLetras` nas letras antigas, e a nova frase sobe com `riseChars(..., E.outBack)` sobre uma pílula que cresce com `scaleX` de 0 a 1 (`transformOrigin: 0 50%`). Tempos seguros num compasso de 2 s: frase em T, risco em T+0,5, queda em T+0,75, nova em T+1,0, saída em T+1,85.

**Pílula ou cartão que vira tela:** anime `left/top/width/height` do retângulo medido até `0, 0, W, H` com `E.inOutCubic`. O raio vai de `h/2` a 0 com `Math.pow(x, 3)`, pra ficar arredondado até o fim. A cor vai para o fundo da próxima cena.

**Íris a partir de algo com sentido:** meça o elemento de origem (`rectOf`) e, na cena seguinte, faça `iris(root, raioCobre(cx, cy) * E.inOutCubic(P(t, a, b)), cx, cy)`. Pra inverter a cor do texto no meio da íris, ponha uma cópia do texto na cena nova (com a outra cor), na mesma posição.

**Whip-pan, push, íris, wipe, lâmina, virada e morph:** agora são `TR.*` (`references/transicoes.md`). Monte à mão só o que o catálogo não tem.

**Ken Burns guiado por chaves (foto, print ou tela gravada):** a câmera segue a ação em vez de um zoom fixo.
```js
const FOTO = [4000, 2667]                                    // resolução de origem
cena(10, 16, (root) => {
  const cam = camada(root, '#000')
  const conteudo = el('div', { cls: 'abs', style: { width: px(FOTO[0]), height: px(FOTO[1]) } }, cam)
  imagem(conteudo, 'midia/foto.jpg', { width: px(FOTO[0]), height: px(FOTO[1]) })
  const cmr = camera([
    { t: 10.0, x: 2000, y: 1333, z: 1 },                     // abre no todo
    { t: 12.0, x: 2750, y: 870, z: 1.8, dur: 1.2 },          // chega no detalhe em 12,0 (na batida)
    { t: 14.5, x: 1500, y: 1650, z: 1.4, dur: 0.9 },         // passeia até o segundo ponto
  ], { cw: FOTO[0], ch: FOTO[1], vw: W, vh: H, zmax: Math.min(FOTO[0] / W, FOTO[1] / H) })   // 2,08: acima disso amolece
  return (t) => { aplicarCamera(conteudo, cmr, t) }
})
```
As chaves caem na grade: o `t` da chave é quando a câmera **chega**, então quem se move durante a batida anterior é o `dur`. Numa tela gravada, troque o `imagem` por `sequencia(conteudo, quadros)` e chame `.set(t - inicio)` no update.

**Colapso em pontos:** cada painel anima `w/h` até ~130 e `borderRadius` até 65. Depois todos vão pro centro por arcos e somem, enquanto um círculo da cor da próxima cena cresce do centro até `raioCobre`.

**Virada 3D de um cartão DENTRO da cena** (a tela inteira virando é o `TR.virada`): um container com `perspective: 2400px`, dentro dele um flipper com `transformStyle: preserve-3d`, e duas faces com `backfaceVisibility: hidden` (o verso com `rotateY(180deg)`). Anime `rotateY(180*e)` com um leve `scale(1+0.07*sin(πe))`.

**Dissolução em partículas:** cada letra ganha `translateY`, `blur` e opacidade escalonados. Em cada letra nascem 6–8 divs redondas com velocidade semeada (`rng`), que sobem e somem em 0,9 s.

**UI de produto coreografada:** monte a tela com os tokens do app (fundo, cartão, borda, raio, fonte). O "dedo" é um círculo semitransparente que percorre uma curva entre os alvos medidos com `rectOf`. No toque: o dedo encolhe 0,8, a opção faz `scale(.97)`, surge uma onda e o estado muda. Um cronômetro pode provar "em menos de 1 minuto".

**Anel de choque e confete no impacto final:** um círculo com stroke cresce até `raioCobre`, com espessura de 16→0,5 e opacidade de 1→0 em 0,7 s. O confete são 30–40 formas semeadas com `dist = v/k*(1-exp(-k*t))` e gravidade `420*t²`, que encolhem no fim.

**Gráficos:** para linha, use `traco` no path e pontos com `E.outBack` escalonado. No radar, os vértices vêm de `R*v[k]`; os valores fazem morph com `spring` por eixo, escalonado em 0,02 s. Para barras, `scaleY` com `transformOrigin: 50% 100%`.

## 4. Armadilhas (cada uma já custou tempo)

- **Medir antes da hora:** meça (`rectOf`, `getBBox`, `getTotalLength`) só depois de as fontes carregarem e com a cena visível. O `iniciar()` já garante isso dentro do `build`. Medida feita em `update` depois de transformar sai errada.
- **Máscara corta o que devia sair:** letra que cai ou voa precisa de `mask.style.overflow = 'visible'` (`quedaLetras` já faz isso).
- **Fonte que não carregou:** o render sai com a fonte reserva sem avisar ninguém. Os scripts imprimem `FONTE NÃO CARREGOU`; leia a saída. Subconjunto latin sem `unicode-range` também quebra acento (o `fontes.mjs` já cuida disso).
- **Mistura de cor entre matizes distantes** passa por marrom ou cinza: troque a cor no meio de um "pop" de escala.
- **Flash de tela inteira** fica cinza no meio do fade: use anel de choque ou corte seco.
- **Íris ou expansão que não cobre:** calcule o raio com `raioCobre(x, y)`, não com a metade da diagonal (o centro raramente é o ponto de origem).
- **`clip-path` e `transform` no mesmo root:** funciona, mas o tremor de câmera (`VIDEO.impactos`) aplica `transform` no root. Não use `root.style.transform` na cena; ponha um wrapper dentro.
- **Texto largo demais no 9:16:** meça e quebre em linhas (`bloco`) ou reduza o corpo. Nunca deixe o texto sair da área segura.
- **`Math.random`, `Date.now`, animação CSS e `transition` nas cenas** quebram o determinismo: um subquadro diverge do outro e o motion blur vira fantasma. Use `rng(seed)` e só o tempo `t`.
- **Muitos elementos com `filter: blur()`** deixam o render lento; limite ao que aparece na tela no momento.
- **Corte seco e motion blur:** a janela do obturador começa no instante do quadro, então o corte em T cai limpo no quadro T. Não desloque a janela.
- **Vídeo e música fora de sincronia:** a fonte da verdade é o `folha.json`. Tempo mudado em `cenas.js` sem mudar a folha deixa a trilha fora do lugar.
- **Root com fundo numa cena com transição:** o fundo do root não se move com a camada e cobre a outra cena. O motor imprime `TRANSIÇÃO …: o root da cena … tem fundo próprio`. O fundo vai em `camada(root, cor)`.
- **Transição dentro de `if`:** a transição precisa ser chamada em todo quadro. Dentro de um `if`, a camada fica com o último estado e o registro para a folha `--auto` falha. O motor já faz um update de cada cena no início dela, pra registrar tudo.
- **Grão e selo sumindo numa virada de página:** o motor sobe o `z-index` da cena que vira, e por isso o grão (`z-index` 20) e o selo (19) ficam acima. Se você mexer em `z-index` de cena, fique abaixo de 19.
- **Degraus no motion blur de bordas muito rápidas** (lâmina, whip vertical): com 8 subquadros, cada um anda ~16 px e a borda fica escalonada. Renderize o trecho com `--sub 16`.
- **`elementsFromPoint` só enxerga dentro do viewport:** `checarQuadro` precisa de uma página do tamanho do quadro. O `quadros.cjs` já abre assim. Numa página com viewport menor, a checagem não vê nada.
- **Falso positivo de área segura em 9:16:** um título centrado no 9:16 cabe no reels só se tiver até 800 px de largura, porque a faixa dos botões começa em x 940 e o centro fica em 540. Reduza o corpo ou quebre a linha; não desmarque o texto.
