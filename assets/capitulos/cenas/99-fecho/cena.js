// Fecho: o índice completo (cada item ganha o check), os números grandes e o logo parado ≥ 1,5 s.
cena(0, VIDEO.duracao, (root) => {
  fundo(root)
  const A = el('div', { cls: 'layer' }, root), B = el('div', { cls: 'layer' }, root), C = el('div', { cls: 'layer' }, root)
  const cards = listaIndice(A, L({ '16x9': { x: 360, y: 110, w: 1200, h: 860 }, '9x16': { x: 90, y: 260, w: 900, h: 1400 } }))
  const checks = cards.map((c) => el('div', { text: '✓', style: { position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', font: F.texto(L({ '16x9': 34, '9x16': 44 }), 700), color: TOK.ok, opacity: 0 } }, c))
  // números: só os verdadeiros (molde/indice.js), em linha no 16:9 e em coluna no 9:16
  const grade = el('div', { cls: 'layer', style: { display: 'flex', flexDirection: VERTICAL ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: VERTICAL ? '90px' : '160px' } }, B)
  const nums = NUMEROS.map((nu) => {
    const box = el('div', { style: { textAlign: 'center' } }, grade)
    const v = el('div', { text: String(nu.valor), style: { font: F.titulo(L({ '16x9': 220, '9x16': 260 })), color: TOK.destaque, lineHeight: '1', transform: INCLINA } }, box)
    el('div', { text: nu.rotulo.toUpperCase(), style: { font: F.mono(L({ '16x9': 30, '9x16': 38 })), color: TOK.texto, letterSpacing: '.24em', marginTop: '14px' } }, box)
    return { box, v, nu }
  })
  const lg = logo(C, { px: L({ '16x9': 180, '9x16': 190 }) })
  const end = textLine(C, [{ t: ENDERECO }], { font: F.mono(L({ '16x9': 34, '9x16': 42 })), color: TOK.destaque, letterSpacing: '.12em' })
  const cent = (l, y) => place(l.line, (W - rectOf(l.line).w) / 2, y)
  cent(lg, CY - L({ '16x9': 130, '9x16': 150 })); cent(end, CY + 90)
  const passoC = Math.min(0.2, 2.2 / INDICE.length)
  return (t) => {
    O(A, E.outExpo(P(t, 0, 0.6)) * (1 - P(t, 3.2, 3.6)))
    checks.forEach((c, i) => O(c, P(t, 0.6 + i * passoC, 0.8 + i * passoC)))
    O(B, P(t, 3.6, 3.9) * (1 - P(t, 6.0, 6.3)))
    nums.forEach((n, i) => { sobe(n.box, t, 3.6 + i * 0.25, 40); conta(n.v, t, 3.7 + i * 0.25, 5.2 + i * 0.25, 0, n.nu.valor) })
    O(C, P(t, 6.3, 6.6))
    riseWords(lg.words, t, 6.3, 0.05, 0.7)
    riseWords(end.words, t, 6.7, 0.05, 0.5)
  }
})
