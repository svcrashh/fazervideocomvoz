# Transições (`TR` no `engine.js`)

## Sumário
1. Como montar (vale para todas)
2. Catálogo: quando usar, chamada, duração e som
3. Tabela rápida de sons
4. Transição feita à mão
5. Armadilhas

---

## 1. Como montar (vale para todas)

Toda transição tem dois lados. Cada lado é chamado no `update` de uma das duas cenas, que se sobrepõem no tempo:

```js
const T0 = 12.0, D = 0.5                              // na grade: D = 1 tempo a 120 BPM
cena(8.0, T0 + D, (root) => {                         // A termina no FIM da transição
  const cam = camada(root, C.escuro)                  // o fundo fica na camada, nunca no root
  // … conteúdo dentro de cam …
  return (t) => { TR.whip.sai(cam, t, T0, D); /* anima o que está dentro de cam */ }
})
cena(T0, 18.0, (root) => {                            // B começa no INÍCIO da transição e é registrada depois (fica por cima)
  const cam = camada(root, C.claro)
  return (t) => { TR.whip.entra(cam, t, T0, D) }
})
```

- **Assinatura:** `TR.<nome>.sai(camada, t, t0, dur, opts)` e `TR.<nome>.entra(camada, t, t0, dur, opts)`.
- **Camada:** `camada(root, fundo)` cria uma div de tela cheia com o fundo da cena. O root fica sem fundo, porque ele recebe o tremor e cobriria a outra cena. Se o root tiver fundo, o motor imprime `TRANSIÇÃO …: o root da cena … tem fundo próprio` e o script sai com código 3.
- **Chame sempre, sem `if`.** Antes de `t0`, o `entra` esconde a camada. Depois de `t0 + dur`, o `sai` esconde. Fora da janela, nada é pintado.
- **A camada pertence à transição.** A cada quadro o motor devolve `transform`, `filter`, `clip-path`, `opacity`, `display` e `z-index` dela ao valor original. Anime só o que está **dentro** dela. A mesma camada pode ter um `entra` no começo e um `sai` no fim da cena.
- **Quem fica por cima:** a cena registrada depois. É o B, na ordem normal. A exceção é a virada de página, em que o motor põe o A por cima sozinho.
- **Registro:** cada chamada registra `{ nome, t0, dur }` em `TRANSICOES`. É por aí que a folha `quadros.cjs --auto` acha os cortes e que a checagem de colisão deixa de acusar cobertura dentro da janela (lá, cobrir é o próprio efeito).
- **Na grade:** `tempo = 60 / BPM`. Escolha `t0` e `dur` para que o momento forte (o meio do whip, o corte da lâmina, o nascimento de B no zoom) caia num tempo da música, de preferência no downbeat.
- **Revise:** rode `quadros.cjs --tira t0-0.1:t0+dur+0.1:8` em cada formato e olhe as imagens. O rascunho já gera a folha `--auto` sozinho.

## 2. Catálogo

### whip · panorâmica rápida
- **Quando:** mudança de assunto com energia, lista de funcionalidades, "e tem mais". Liga duas cenas do mesmo peso. Não use duas vezes seguidas.
- **Chamada:** `TR.whip.sai(camA, t, t0, dur, { dir: 'esquerda' })` e `TR.whip.entra(camB, t, t0, dur, { dir: 'esquerda' })`. O `dir` diz para onde o conteúdo vai: `'esquerda' | 'direita' | 'cima' | 'baixo'`. Opções: `ease` (`E.inOutExpo`), `blur` (fator, 1), `blurMax` (70 px).
- **O que faz:** um desfoque direcional (filtro SVG `stdDeviation "bx 0"`) proporcional à velocidade, medida pela derivada da posição. O rascunho já sai com cara de chicote, e o motion blur do final soma por cima. A camada de baixo estende o próprio fundo por trás da emenda, pra o palco não vazar entre as duas bordas desfocadas.
- **Duração:** 1 tempo (0,5 s a 120 BPM). Com o pico de velocidade no meio, o meio da transição cai no tempo seguinte.
- **Som:** `whoosh` com `dur` = a duração da transição e o pico no meio: `{'t': t0 + dur/2, 'som': 'whoosh', 'dur': dur, 'direcao': -1}`. Use `direcao` -1 quando o conteúdo vai pra esquerda.

### push · empurrão
- **Quando:** sequência lógica ("depois", "passo 2"), carrossel, feed que rola. É mais calmo que o whip. No 9:16, `dir: 'cima'` imita o gesto de rolar.
- **Chamada:** `TR.push.sai(camA, t, t0, dur, { dir: 'cima' })` e `TR.push.entra(camB, t, t0, dur, { dir: 'cima' })`. Opções: `ease` (`E.inOutCubic`); `recuo` (só no `sai`), em que `0.3` faz A andar só 30% e escurecer enquanto B passa por cima, como um cartão empilhado.
- **Duração:** 1 tempo.
- **Som:** `whoosh` curto e baixo, com pico no meio: `{'t': t0 + dur/2, 'som': 'whoosh', 'variante': 'curto', 'nivel': -9}`. Num tutorial, troque pelo `toque` no início, se o push vier de um gesto.

### zoom · mergulho (zoom-through)
- **Quando:** "vamos entrar nisso", quando o detalhe vira a próxima cena ou quando se mergulha numa forma do logo, num botão ou num ícone. É a mais cinematográfica. Guarde pra uma ou duas vezes no vídeo.
- **Chamada:** `TR.zoom.sai(camA, t, t0, dur, { x, y, raio })` e `TR.zoom.entra(camB, t, t0, dur, { x, y })`.
  - `x, y` é um ponto **com sentido**: para uma forma, use `pontoInterno(path)` convertido para o quadro; para um elemento, o centro de `rectOf`.
  - `raio` é o raio em px da forma em volta do ponto. Com ele, o motor calcula `zmax = 1,25·raioCobre/raio` para a cor da forma encher a tela; sem ele, `zmax` fica em 14.
  - Outras opções: `nasce` (0,6, a escala em que B nasce), `blur` (6 px) e `ease` (`E.inCubic`, só no A).
- **O que faz:** A cresce exponencialmente até encher a tela na metade da duração. Daí B nasce de dentro, por cima, com opacidade, escala `nasce → 1` e desfoque que limpa. O fundo de B combinando com a cor da forma dá o mergulho perfeito.
- **Duração:** 1 a 1,5 tempo. O meio (B nascendo) cai no downbeat.
- **Som:** `whoosh` longo com pico no meio (`{'t': t0 + dur/2, 'som': 'whoosh', 'dur': dur}`). Num mergulho grande, use um `riser` que termina no meio (`{'t': t0 + dur/2, 'som': 'riser', 'dur': 1.5}`) e um `impacto` leve no mesmo instante.

### mascara · revelação por forma
B fica por cima e é revelada por uma forma. Chame só o `entra`: `TR.mascara.entra(camB, t, t0, dur, { forma, … })`. O `sai` é o inverso (a cena que sai se recolhe na mesma forma) e serve só quando a cena que sai está por cima.

- **`forma: 'circulo'`** (íris a partir de `x, y`)
  - **Quando:** a próxima cena nasce de algo: um botão tocado, uma notificação, uma palavra. Nunca parte do centro por falta de ideia.
  - **Duração:** 1 tempo.
  - **Som:** se nasce de um toque, `toque` em `t0`. Senão, `whoosh` curto com pico no meio.
- **`forma: 'diagonal'`** (wipe reto)
  - **Opções:** `angulo` é a direção do avanço em graus: 0 vai da esquerda pra direita, 90 de cima pra baixo; o padrão é 20.
  - **Quando:** troca editorial e seca, tipografia, antes → depois.
  - **Duração:** 1 tempo.
  - **Som:** `whoosh` curto com pico no meio.
- **`forma: 'barras'`** (`n` faixas escalonadas)
  - **Opções:** `n` (5); `direcao` `'horizontal'` (faixas empilhadas, cada uma varre da esquerda pra direita) ou `'vertical'`; `escalonar` (0,45); `alterna` (faixas alternando o sentido).
  - **Quando:** lista, ritmo marcado, energia gráfica. Casa com semicolcheias da trilha.
  - **Duração:** 1 a 2 tempos.
  - **Som:** `whoosh` curto com pico no meio. Pra um efeito mais rítmico, um `clique` por faixa, espaçado por `escalonar·dur/(n−1)`.
- **`forma: 'lamina'`** (lâmina dupla inclinada)
  - **Opções:** `cor` (a lâmina larga, que cobre o quadro inteiro exatamente no corte), `cor2` (a lâmina fina de acento, que vai na frente), `angulo` (30), `dir` (`'direita'` ou `'esquerda'`) e `atraso` (7% da duração).
  - **O que faz:** A some e B aparece **no corte**, que é o instante em que a curva passa de 0,5 (o meio, com a curva padrão). As lâminas ficam no root da cena B. Por isso **a cena B começa em `t0`**, não no corte.
  - **Quando:** corte de impacto, virada de seção, cor da marca riscando a tela. Pode ser o movimento-assinatura quando o logo tem uma diagonal.
  - **Duração:** 1 tempo, com `t0 = downbeat − dur/2`, pra o corte cair no downbeat.
  - **Som:** `impacto` no corte (`{'t': t0 + dur/2, 'som': 'impacto'}`) mais um `whoosh` curto com pico no mesmo instante. Ponha também o corte em `VIDEO.impactos`, pra ganhar o tremor.

### virada
- **`tipo: 'cartao'`** (a tela vira como um cartão)
  - **Chamada:** `TR.virada.sai(camA, t, t0, dur, { tipo: 'cartao' })` e `TR.virada.entra(camB, t, t0, dur, { tipo: 'cartao' })`. A é a frente e B o verso.
  - **O que faz:** recua no meio (`recuo` 0,35) e escurece no ângulo.
  - **Opções:** `dir` (`'direita'` ou `'esquerda'`), `eixo` (`'y'` ou `'x'`), `perspectiva` e `fundo`, a cor atrás do cartão (padrão: o fundo do palco, `VIDEO.fundo`).
  - **Quando:** antes → depois, pergunta → resposta, frente e verso da mesma coisa (técnico × família).
  - **Duração:** 1,5 tempo. A virada (90°) cai no tempo.
  - **Som:** `virada` com `variante: 'cartao'` em `t0` (`{'t': t0, 'som': 'virada', 'variante': 'cartao'}`).
- **`tipo: 'pagina'`** (página virando em torno da lombada)
  - **Chamada:** `TR.virada.sai(camA, t, t0, dur, { tipo: 'pagina' })` e `TR.virada.entra(camB, t, t0, dur, { tipo: 'pagina' })`.
  - **O que faz:** A vira **por cima** de B. O motor sobe o `z-index` da cena A durante a transição; o grão e o selo continuam acima de tudo. A página ganha brilho na dobra e escurece na borda livre. A página de baixo tem sombra ao lado da borda da página que vira e escurece por inteiro no começo.
  - **Opções:** `dir` (`'esquerda'`, com a lombada à esquerda, é o padrão), `perspectiva` (4·W) e `ease`.
  - **Quando:** capítulo, passo a passo, diário, "um dia na vida", relatório, cardápio.
  - **Duração:** 1,5 a 2 tempos.
  - **Som:** `virada` com `variante: 'pagina'` em `t0`, que é quando a página começa a virar (`{'t': t0, 'som': 'virada', 'direcao': -1}`).

### morph · a forma vira a tela
- **Quando:** o botão tocado vira a próxima tela, a pílula vira o fundo, o ícone vira o cenário. É o match cut contínuo e fala a língua de produto.
- **Chamada:**
  ```js
  let alvo                                          // fora das cenas
  cena(…A…, (root) => { … alvo = rectOf(botao); alvo.el = botao; return (t) => { TR.morph.sai(camA, t, T0, D, { de: alvo, origem: alvo.el }) } })
  cena(…B…, (root) => { const camB = camada(root, C.escuro); return (t) => { TR.morph.entra(camB, t, T0, D, { de: alvo, origem: alvo.el }) } })
  ```
  - `de` é `{x, y, w, h, r?}` (o `rectOf` medido no build de A, antes de qualquer transform) ou um path `'M…'` em coordenadas do quadro.
  - `cor` é a cor da forma. O padrão é o fundo da camada de B, que dá a emenda perfeita.
  - `corInicial` é a cor do botão. A troca para `cor` é seca, no meio do morph, sem mistura suja.
  - `origem` é o elemento que some enquanto a forma ocupa o lugar dele.
- **O que faz:**
  - A forma vira um círculo com a mesma área, e o sentido dos pontos é alinhado pra não torcer.
  - O círculo cresce até cobrir o quadro, e B aparece de dentro dessa cor (opacidade e escala de 0,94 a 1).
  - A avança 4% em direção à forma. Recuar abriria borda com o palco.
- **Duração:** 1,5 a 2 tempos.
- **Som:** `toque` ou `clique` em `t0`, se nasce de um toque, mais um `whoosh` curto com pico em `t0 + 0,45·dur` (quando o círculo dispara).

## 3. Tabela rápida de sons

Nomes do `assets/audio/sons.py`. O `t` é o instante que vai para `sons.colocar([...])`. Veja as âncoras em `sons.CATALOGO`: o `whoosh` tem o pico em `t`, o `riser` termina em `t` e os outros começam em `t`.

| Transição | Som | `t` |
|---|---|---|
| whip | `whoosh` (`dur` = dur, `direcao` pelo sentido) | `t0 + dur/2` |
| push | `whoosh` curto, `nivel` −9 | `t0 + dur/2` |
| zoom | `whoosh` longo, ou `riser` + `impacto` | `t0 + dur/2` |
| máscara círculo | `toque` (se vem de um toque) ou `whoosh` curto | `t0`, ou `t0 + dur/2` |
| máscara diagonal / barras | `whoosh` curto (barras: um `clique` por faixa, opcional) | `t0 + dur/2` |
| lâmina | `impacto` + `whoosh` curto | o corte, `t0 + dur/2` |
| virada cartão | `virada` com `variante: 'cartao'` | `t0` |
| virada página | `virada` com `variante: 'pagina'` | `t0` |
| morph | `toque`/`clique` + `whoosh` curto | `t0`, e `t0 + 0,45·dur` |

Cada som com evento vira um marco no `folha.json`. Mudou o `t0` de uma transição? Mude o som junto.

## 4. Transição feita à mão

Uma transição que não está no `TR` (colapso em pontos, partículas, match cut) precisa se registrar no build de uma das cenas. Assim a folha `--auto` mostra o corte e a checagem entende que ali a cobertura é intencional:

```js
registrarTransicao('colapso', 20.0, 0.6)
```

`tocar(el, 'prop', valor)` escreve um estilo que o motor devolve ao original a cada quadro. Use isso nos elementos que só a transição mexe.

## 5. Armadilhas

- **Root com fundo** cobre a outra cena, e o motor acusa. O fundo vai na `camada`.
- **A cena B começando no corte** (lâmina, morph) faz as lâminas ou a forma aparecerem só no meio. Ela precisa começar em `t0`.
- **A cena A terminando antes de `t0 + dur`** faz a transição ser cortada no meio.
- **Animar a própria camada** (`T(cam, …)`) briga com a transição e é desfeito a cada quadro. Ponha um wrapper dentro dela.
- **Transform ou recorte na camada numa cena menor que o quadro:** as formas da máscara são calculadas em coordenadas do quadro. A camada precisa estar em (0, 0) e cobrir o quadro.
- **Bordas muito rápidas no final** (lâmina, whip vertical longo): com 8 subquadros, a borda anda ~16 px entre um e outro e aparecem degraus. Nesse trecho, renderize com `--sub 16`.
- **Zoom sem `raio`**, num ponto longe do centro, pode não encher a tela, e os cantos da cena A aparecem quando B nasce. Passe o `raio` da forma.
