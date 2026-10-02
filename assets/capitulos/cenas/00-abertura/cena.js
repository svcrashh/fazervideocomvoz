// Abertura: logo, a palavra do vídeo e o índice numerado, que se preenche item a item.
cena(0, VIDEO.duracao, (root) => {
  fundo(root)
  const conteudo = el('div', { cls: 'layer' }, root)
  const lg = logo(conteudo, { px: L({ '16x9': 64, '9x16': 80 }) })
  place(lg.line, LAY.tx, L({ '16x9': 330, '9x16': 220 }))
  const titulo = textLine(conteudo, [{ t: 'NOVIDADES', style: { color: TOK.destaque } }], { font: F.titulo(L({ '16x9': 150, '9x16': 170 })), color: TOK.texto, transform: INCLINA })
  place(titulo.line, LAY.tx, L({ '16x9': 420, '9x16': 330 }))
  const sub = textLine(conteudo, [{ t: 'O que mudou, em ' + INDICE.length + ' itens.' }], { font: F.texto(LAY.apoioPx), color: TOK.apoio })
  place(sub.line, LAY.tx, L({ '16x9': 600, '9x16': 530 }))
  // 16:9: a lista à direita; 9:16: embaixo, ocupando a metade de baixo
  const cards = listaIndice(conteudo, L({ '16x9': { x: 1000, y: 110, w: 760, h: 860 }, '9x16': { x: 90, y: 630, w: 900, h: 1130 } }))
  return (t) => {
    riseWords(lg.words, t, 0.1, 0.05, 0.5)
    riseWords(titulo.words, t, 0.35, 0.05, 0.7)
    riseWords(sub.words, t, 0.8, 0.03, 0.5)
    const passoT = Math.min(0.3, 3.2 / INDICE.length)
    cards.forEach((c, i) => sobe(c, t, 1.4 + i * passoT, 30))
    const s = E.inCubic(P(t, VIDEO.duracao - SAIDA, VIDEO.duracao - 0.05))
    T(conteudo, `translateY(${-30 * s}px)`); O(conteudo, 1 - s)
  }
})
