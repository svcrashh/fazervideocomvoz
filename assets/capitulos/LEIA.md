# Molde do vídeo em capítulos

Estrutura sem marca: os tokens, as fontes, o nome e os números daqui são inventados. O método está em
`references/capitulos.md`; aqui está só como usar os arquivos.

## Criar

```sh
node $SKILL/scripts/capitulos/novo.mjs <pasta do vídeo> --fontes "Título,Texto,Mono"
```

Cria `molde/` (engine, `kit.js`, `indice.js`, `capitulo.html`, `fontes/`), `cenas/00-abertura`, `cenas/01-exemplo`,
`cenas/99-fecho`, `midia/`, `voz/`, `audio/` e `ferramentas/`. O Playwright é achado como no resto da skill
(`PLAYWRIGHT_PATH`, `node_modules` da pasta ou dos pais, npm global).

## Trocar pela marca (uma vez, antes do primeiro capítulo)

- `molde/kit.js`: `TOK` (fundo, cartão, campo, texto, apoio, destaque, ok), `FONTE`, `INCLINA` e, se a forma pedir,
  o `celular()` e o `fundo()`. Tudo pela leitura (§3, a cara do produto).
- `molde/indice.js`: `MARCA_NOME`, `ENDERECO`, `INDICE` (n, nome do cartão, seção da etiqueta, pasta) e `NUMEROS`
  (só os verdadeiros).
- `logo()` no kit escreve o nome em texto: troque pelo SVG da marca (`scripts/logo.mjs`) ou por `foto(…)`.
- `video.js` de cada cena: as mesmas `fontes` do `FONTE` e o `fundo` do `TOK.fundo`.

## Um capítulo

Copie `cenas/01-exemplo` para `cenas/NN-nome` (NN = o `n` do índice). Edite só `video.js` (a `duracao`) e
`cena.js`:

```js
cena(0, VIDEO.duracao, (root) => {
  const cap = capitulo(root, { n: 2, dur: VIDEO.duracao,
    titulo: [[{ t: 'Cores ' }, { t: 'novas', k: true }]],          // 2–3 palavras; k = cor de destaque
    apoio: [{ t: 'Paleta pronta ou cor a cor.', em: 2.8 }] })       // em = quando a voz chega nisso
  const c = celular(cap.palco, { x: …, y: …, h: PALCO.h * 0.94 })    // desenhe na c.tela, em px de celular
  return (t) => { cap.update(t); sobe(c.el, t, ENTRA_PALCO, 80) /* … o antes → depois do palco … */ }
})
```

- A moldura (fundo, cartão do índice que passa, etiqueta `NN · SEÇÃO`, título, apoio, saída) vem pronta. O seu
  trabalho é o palco: nada antes de `ENTRA_PALCO` (0,9 s), nada fora de `PALCO`, saída nenhuma (a moldura faz).
- Recomponha o palco por formato com `L({ '16x9': …, '9x16': … })` ou `VERTICAL`.
- A fala entra em `FALA_EM` (1,4 s) e termina antes de `duracao − 0,8`. Duração: `max(5, 1,4 + fala + 0,8)`.
- Proibido: `Math.random`, `Date.now`, `transition`/`animation` de CSS, `<video>`, imagem da internet, cor fora do
  `TOK`, fonte fora do `FONTE`. O render é quadro a quadro: tudo tem de ser função de `t`.
- O console avisa `TÍTULO LARGO DEMAIS`, `APOIO LARGO DEMAIS` e `CAPÍTULO n FORA DO ÍNDICE`; o render sai com código
  3 quando há erro no console.

## Renderizar e olhar

```sh
node $SKILL/scripts/capitulos/render.mjs <pasta do vídeo> NN-nome --modo rascunho   # 30 fps, para olhar
node $SKILL/scripts/capitulos/render.mjs <pasta do vídeo> NN-nome                   # final, 60 fps
node $SKILL/scripts/capitulos/render.mjs <pasta do vídeo> todas
```

Sai `cenas/NN-nome/out/16x9.mp4`, `out/9x16.mp4` e uma folha de 24 quadros de cada (`out/folha-*.png`). Abra as
duas folhas antes de dizer que o capítulo está pronto. Prévia ao vivo: `cenas/NN-nome/index.html?f=9x16&t=4.5`.

## Montar

```sh
node $SKILL/scripts/capitulos/montar.mjs <pasta do vídeo> --locucao voz/<versao>/locucao.json --perfil reels
```

Junta as cenas em ordem (`00-` abertura, `99-` fecho), por formato, em `out/montado-<formato>.mp4`; põe cada fala
em `início da cena + 1,4 s` num `audio/voz.wav`; escreve o bloco `voz` e um whoosh por passagem de capítulo no
`audio/folha.json`; recusa fala que não cabe na cena e diz a duração que resolve. Depois, a trilha sobre a folha
(`references/trilha.md` §4, `references/voz-mix.md`) e o `ferramentas/finalizar.mjs` de cada formato.
