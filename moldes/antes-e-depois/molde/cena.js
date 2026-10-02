// Molde antes-e-depois: a MESMA tela em dois estados, no mesmo enquadramento, cortada no clique.
// Tudo o que é marca, texto, tela e tempo vem de PARAM (video.js, gerado pelo renderizar.mjs).
// Linha do tempo: promessa + "antes" no quadro 0 → gatilho e cursor → clique = corte seco para o "depois"
// → cortina (antes | depois lado a lado) → fecho com véu e desfoque, bordão, logo e endereço.
const M = PARAM.marca, C = M.cores, TX = PARAM.textos, TP = PARAM.tempos
const FT = M.fontes
const fTit = (s) => `${FT.tituloPeso || 700} ${s}px "${FT.titulo}"`
const fTxt = (s, w = 500) => `${w} ${s}px "${FT.texto}"`
const fMono = (s, w = 600) => `${w} ${s}px "${FT.mono || FT.texto}"`
const caixa = (s) => (FT.tituloCaixaAlta ? s.toUpperCase() : s)
const incl = FT.tituloInclinacao ? `skewX(${FT.tituloInclinacao}deg)` : ''

// Onde as coisas moram em cada formato (recomposto, não recortado).
const LY = L({
  '16x9': { tx: 100, tTop: 150, tPx: 86, txW: 520, win: { x: 660, y: 90, w: 1180, h: 900 },
            leg: { modo: 'coluna', x: 100, y: 640, w: 500, px: 40 }, gat: 'canto' },
  '9x16': { tx: 70, tTop: 140, tPx: 108, txW: 940, win: { x: 60, y: 450, w: 960, h: 1180 },
            leg: { modo: 'centro', x: 60, y: 1670, w: 960, px: 54 }, gat: 'base' },
  '1x1':  { tx: 60, tTop: 54, tPx: 74, txW: 960, win: { x: 60, y: 250, w: 960, h: 770 },
            leg: { modo: 'sobre', x: 60, y: 940, w: 960, px: 36 }, gat: 'meio' },
})
const WIN = LY.win
const CFG = PARAM.formato  // { antes, depois, w, h, foco:[x,y,w,h], detalhe:[x,y], zoomDetalhe }

cena(0, VIDEO.duracao, (root) => {
  camada(root, C.fundo)
  const fundoBrilho = el('div', { cls: 'layer', style: { background: `radial-gradient(70% 60% at ${((WIN.x + WIN.w / 2) / W) * 100}% ${((WIN.y + WIN.h / 2) / H) * 100}%, ${rgba(C.acento, 0.12)}, transparent 70%)` } }, root)

  // ── título-promessa: inteiro no quadro 0 ──
  // o corpo do título se ajusta à coluna; abaixo de 70% do previsto, o texto é que está comprido
  const monta = (tpx) => TX.promessa.map((parts, i) => {
    const l = textLine(root, parts.map((p) => ({ t: caixa(p.t), style: p.k ? { color: C.acento } : {} })), { font: fTit(tpx), color: C.texto, transform: incl })
    place(l.line, LY.tx, LY.tTop + i * tpx * 1.04)
    return l
  })
  let linhas = monta(LY.tPx)
  const largT = Math.max(...linhas.map((l) => rectOf(l.line).w))
  if (largT > LY.txW) {
    for (const l of linhas) l.line.remove()
    const k = LY.txW / largT
    if (k < 0.7) console.error(`PROMESSA LARGA DEMAIS no ${FMT}: encurte o texto (precisou de ${Math.round(k * 100)}% do corpo)`)
    linhas = monta(Math.floor(LY.tPx * k))
  }

  // ── janela da tela ──
  const win = el('div', { cls: 'abs', style: { left: px(WIN.x), top: px(WIN.y), width: px(WIN.w), height: px(WIN.h), overflow: 'hidden', borderRadius: '28px',
    background: C.superficie, boxShadow: `0 40px 120px rgba(0,0,0,.35), 0 0 0 2px ${C.linha}` } }, root)
  const [fx, fy, fw, fh] = CFG.foco
  const s0 = Math.max(WIN.w / fw, WIN.h / fh)               // px do quadro por px CSS da captura
  const cam = el('div', { cls: 'abs', style: { width: px(CFG.w), height: px(CFG.h), transformOrigin: '0 0' } }, win)
  const imgA = imagem(cam, CFG.antes, { width: px(CFG.w), height: px(CFG.h) })
  const camD = el('div', { cls: 'abs', style: { width: px(CFG.w), height: px(CFG.h) } }, cam)
  const imgD = imagem(camD, CFG.depois, { width: px(CFG.w), height: px(CFG.h) })
  if (s0 < 1) console.error(`TELA ENCOLHIDA no ${FMT}: foco ${fw}×${fh} numa janela ${WIN.w}×${WIN.h} (escala ${s0.toFixed(2)}). Diminua o foco.`)
  // posição base: centro do foco no centro da janela
  const ox = WIN.w / 2 - (fx + fw / 2) * s0, oy = WIN.h / 2 - (fy + fh / 2) * s0
  const det = CFG.detalhe || [fx + fw / 2, fy + fh / 2]
  const pDet = [ox + det[0] * s0, oy + det[1] * s0]          // detalhe em coordenadas da janela
  const zDet = CFG.zoomDetalhe || 2.2
  function enquadra(z, pz) {
    let l = pz[0] + (ox - pz[0]) * z, tp = pz[1] + (oy - pz[1]) * z
    const iw = CFG.w * s0 * z, ih = CFG.h * s0 * z
    if (iw >= WIN.w) l = clamp(l, WIN.w - iw, 0); if (ih >= WIN.h) tp = clamp(tp, WIN.h - ih, 0)
    T(cam, `translate(${l}px,${tp}px) scale(${s0 * z})`)
    return [l, s0 * z]
  }

  // véu + desfoque do fecho
  const veu = el('div', { cls: 'layer', style: { width: px(WIN.w), height: px(WIN.h), background: C.fundo, opacity: 0 } }, win)

  // divisória da cortina
  const div = el('div', { cls: 'abs', style: { width: '6px', height: px(WIN.h), marginLeft: '-3px', background: C.acento, boxShadow: `0 0 30px ${rgba(C.acento, 0.6)}` } }, win)
  const pega = el('div', { cls: 'abs', style: { width: '64px', height: '64px', marginLeft: '-32px', marginTop: '-32px', top: px(WIN.h / 2), borderRadius: '50%', background: C.acento,
    color: C.sobreAcento, font: fTxt(30, 700), display: 'flex', alignItems: 'center', justifyContent: 'center' }, text: '‹ ›' }, win)

  // etiquetas no canto fixo (o olho aprende onde ler)
  const etq = (texto, ativo) => el('div', { cls: 'abs', text: texto.toUpperCase(), style: { font: fMono(L({ '16x9': 34, '9x16': 46, '1x1': 34 })), letterSpacing: '.2em', padding: '12px 20px', borderRadius: '999px',
    background: ativo ? C.acento : C.superficie, color: ativo ? C.sobreAcento : C.texto, border: `2px solid ${ativo ? C.acento : C.linha}`, whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(0,0,0,.25)' } }, win)
  const eA = etq(TX.antes, false), eD = etq(TX.depois, true), eA2 = etq(TX.antes, false)
  place(eA, 28, 28); place(eD, 28, 28)
  const wD = rectOf(eD).w
  place(eA2, 28, 28)
  marcar(eA, 'texto'); marcar(eD, 'texto')

  // palavra da virada, canto oposto
  const vir = el('div', { cls: 'abs', text: TX.virada, style: { font: fTit(L({ '16x9': 64, '9x16': 70, '1x1': 56 })), color: C.sobreAcento, background: C.acento, padding: '10px 26px 14px',
    borderRadius: '18px', whiteSpace: 'nowrap', transform: incl, transformOrigin: '100% 0' } }, win)
  const vw = rectOf(vir).w
  const virBox = el('div', { cls: 'abs', style: { left: px(WIN.w - vw - 28), top: '24px' } }, win); virBox.appendChild(vir); vir.style.position = 'relative'

  // ── gatilho: o controle que causa a mudança, com os rótulos exatos do produto ──
  const G = PARAM.gatilho
  const gk = L({ '16x9': 1.15, '9x16': 1.8, '1x1': 1.1 })
  const gat = el('div', { cls: 'abs', style: { width: px(440 * gk), boxSizing: 'border-box', padding: px(24 * gk), borderRadius: px(24 * gk), background: C.superficie,
    border: `2px solid ${C.linha}`, boxShadow: '0 30px 80px rgba(0,0,0,.45)' } }, win)
  el('div', { text: G.titulo, style: { font: fTxt(24 * gk, 700), color: C.apagado, marginBottom: px(14 * gk), letterSpacing: '.04em' } }, gat)
  const ops = G.opcoes.map((o) => {
    const r = el('div', { style: { display: 'flex', alignItems: 'center', gap: px(14 * gk), padding: `${px(14 * gk)} ${px(16 * gk)}`, borderRadius: px(14 * gk), marginTop: px(8 * gk), border: `2px solid ${C.linha}`, position: 'relative' } }, gat)
    const bol = el('div', { style: { width: px(28 * gk), height: px(28 * gk), borderRadius: '50%', border: `3px solid ${C.apagado}`, boxSizing: 'border-box', flex: 'none' } }, r)
    el('div', { text: o, style: { font: fTxt(30 * gk, 500), color: C.texto, whiteSpace: 'nowrap' } }, r)
    return { r, bol }
  })
  const gw = 440 * gk, gh = rectOf(gat).h
  const gx = LY.gat === 'base' ? (WIN.w - gw) / 2 : WIN.w - gw - 32, gy = LY.gat === 'meio' ? (WIN.h - gh) / 2 : WIN.h - gh - 32
  place(gat, gx, gy)
  const alvo = ops[G.escolha].r, ra = rectOf(alvo), rw = rectOf(win)
  const alvoXY = [ra.x - rw.x + 46 * gk, ra.y - rw.y + ra.h / 2]
  const cursor = el('div', { cls: 'abs', style: { width: '44px', height: '44px', marginLeft: '-22px', marginTop: '-22px', borderRadius: '50%', background: rgba('#FFFFFF', 0.85),
    border: `3px solid ${C.texto}`, boxShadow: '0 6px 20px rgba(0,0,0,.35)', opacity: 0 } }, win)
  const anel = el('div', { cls: 'abs', style: { width: '90px', height: '90px', marginLeft: '-45px', marginTop: '-45px', borderRadius: '50%', border: `5px solid ${C.acento}`, opacity: 0 } }, win)

  // ── legenda igual à fala ──
  const LG = LY.leg
  const legBox = el('div', { cls: 'abs', style: { left: px(LG.x), top: px(LG.y), width: px(LG.w), display: 'flex', justifyContent: LG.modo === 'coluna' ? 'flex-start' : 'center' } }, root)
  const blocos = PARAM.legendas.map((b) => {
    const e = el('div', { text: b.texto, style: { font: fTxt(LG.px, 600), color: LG.modo === 'coluna' ? C.texto : C.texto, background: LG.modo === 'coluna' ? 'transparent' : C.superficie,
      padding: LG.modo === 'coluna' ? '0' : '14px 26px', borderRadius: '16px', lineHeight: 1.25, maxWidth: px(LG.w), boxSizing: 'border-box', textAlign: LG.modo === 'coluna' ? 'left' : 'center',
      position: 'absolute', opacity: 0, boxShadow: LG.modo === 'coluna' ? 'none' : '0 12px 40px rgba(0,0,0,.3)', borderLeft: LG.modo === 'coluna' ? `6px solid ${C.acento}` : 'none', paddingLeft: LG.modo === 'coluna' ? '22px' : '26px' } }, legBox)
    marcar(e, 'legenda')
    return { ...b, e }
  })
  if (LG.modo === 'sobre') legBox.style.top = px(WIN.y + WIN.h - 40 - 80)

  // ── fecho: bordão + logo + endereço, sobre o véu ──
  const fecho = el('div', { cls: 'layer', style: { width: px(WIN.w), height: px(WIN.h), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0 } }, win)
  const bPx = L({ '16x9': 104, '9x16': 112, '1x1': 84 })
  const bLs = TX.bordao.map((parts) => {
    const d = el('div', { style: { font: fTit(bPx), color: C.texto, transform: incl, whiteSpace: 'nowrap', lineHeight: 1.08, textAlign: 'center' } }, fecho)
    for (const p of parts) el('span', { text: caixa(p.t), style: p.k ? { color: C.acento } : {} }, d)
    return d
  })
  const assin = el('div', { style: { display: 'flex', alignItems: 'center', gap: '22px', marginTop: px(bPx * 0.55) } }, fecho)
  if (M.logo) imagem(assin, M.logo, { position: 'relative', height: px(L({ '16x9': 70, '9x16': 76, '1x1': 60 })), width: 'auto' })
  else el('div', { text: M.nome, style: { font: fTit(L({ '16x9': 64, '9x16': 70, '1x1': 56 })), color: C.texto } }, assin)
  el('div', { text: M.url, style: { font: fMono(L({ '16x9': 32, '9x16': 36, '1x1': 30 })), color: C.acento, letterSpacing: '.06em' } }, fecho).style.marginTop = '18px'
  const largB = Math.max(...bLs.map((d) => d.getBoundingClientRect().width))
  if (largB > WIN.w - 80) {
    const k = (WIN.w - 80) / largB
    if (k < 0.7) console.error(`BORDÃO LARGO DEMAIS no ${FMT}: encurte o texto (precisou de ${Math.round(k * 100)}% do corpo)`)
    for (const d of bLs) d.style.font = fTit(Math.floor(bPx * k))
  }

  const varZoomOut = PARAM.variacao === 'zoom-out'
  return (t) => {
    // câmera
    let z
    if (varZoomOut) z = Math.exp(Math.log(zDet) * (1 - E.inOutCubic(P(t, TP.clique + 0.6, TP.clique + 2.6))))
    else z = 1 + 0.06 * E.inOutCubic(P(t, 0, TP.clique)) + 0.04 * E.inOutCubic(P(t, TP.clique, TP.cortina)) - 0.1 * E.inOutCubic(P(t, TP.cortina - 0.2, TP.cortina + 0.5))
    const [camL, camK] = enquadra(Math.max(1, z), pDet)

    // corte seco no clique; cortina depois
    const cx = WIN.w * 0.5 * E.inOutCubic(P(t, TP.cortina, TP.cortina + 1.1))
    const naCortina = t >= TP.cortina
    camD.style.display = t >= TP.clique ? 'block' : 'none'
    camD.style.clipPath = naCortina ? `inset(0 0 0 ${(cx - camL) / camK}px)` : 'none'
    O(div, naCortina ? 1 - P(t, TP.fecho, TP.fecho + 0.3) : 0); T(div, `translateX(${cx}px)`)
    O(pega, naCortina ? (1 - P(t, TP.fecho, TP.fecho + 0.3)) * P(t, TP.cortina, TP.cortina + 0.2) : 0); T(pega, `translateX(${cx}px)`)

    // etiquetas
    const fe = 1 - P(t, TP.fecho, TP.fecho + 0.3)
    O(eA, t < TP.clique ? fe : 0)
    O(eD, t >= TP.clique ? fe : 0)
    O(eA2, naCortina ? fe * P(t, TP.cortina + 0.6, TP.cortina + 1.0) : 0)
    const dxD = (WIN.w - 28 - wD - 28) * E.inOutCubic(P(t, TP.cortina, TP.cortina + 1.1))
    T(eD, `translateX(${dxD}px)`)

    // virada: estampa no clique, some antes da cortina
    const pv = P(t, TP.clique, TP.clique + 0.35)
    O(vir, t >= TP.clique ? 1 - P(t, TP.cortina - 0.4, TP.cortina) : 0)
    T(vir, `${incl} scale(${t >= TP.clique ? 1 + 0.25 * (1 - E.outBack(pv, 2.2)) : 1})`)
    O(virBox, naCortina ? 0 : 1)

    // gatilho + cursor + toque
    const gIn = E.outExpo(P(t, TP.gatilho, TP.gatilho + 0.5)), gOut = E.inCubic(P(t, TP.clique + 0.7, TP.clique + 1.1))
    O(gat, gIn * (1 - gOut)); T(gat, `translateY(${(1 - gIn) * 40 + gOut * 30}px)`)
    const sel = t >= TP.clique ? G.escolha : 0
    ops.forEach((o, i) => {
      const on = i === sel
      o.r.style.background = on ? rgba(C.acento, 0.14) : 'transparent'; o.r.style.borderColor = on ? C.acento : C.linha
      o.bol.style.borderColor = on ? C.acento : C.apagado; o.bol.style.boxShadow = on ? `inset 0 0 0 ${7 * gk}px ${C.acento}` : 'none'
    })
    const cIn = E.inOutCubic(P(t, TP.gatilho + 0.3, TP.clique - 0.12))
    const c0 = [alvoXY[0] - L({ '16x9': 260, '9x16': 200, '1x1': 220 }), alvoXY[1] + 180 + gy * 0]
    const cxp = lerp(c0[0], alvoXY[0], cIn), cyp = lerp(Math.min(c0[1], WIN.h - 30), alvoXY[1], cIn) - 60 * Math.sin(Math.PI * cIn)
    const aperta = 1 - 0.18 * Math.sin(Math.PI * P(t, TP.clique - 0.12, TP.clique + 0.12))
    O(cursor, P(t, TP.gatilho + 0.3, TP.gatilho + 0.5) * (1 - gOut)); T(cursor, `translate(${cxp}px,${cyp}px) scale(${aperta})`)
    const pa = P(t, TP.clique, TP.clique + 0.55)
    O(anel, pa > 0 && pa < 1 ? 1 - pa : 0); T(anel, `translate(${alvoXY[0]}px,${alvoXY[1]}px) scale(${0.3 + 1.2 * E.outCubic(pa)})`)

    // legendas
    for (const b of blocos) {
      const on = P(t, b.de, b.de + 0.18) * (1 - P(t, b.ate - 0.12, b.ate))
      O(b.e, on); T(b.e, `translateY(${(1 - E.outCubic(P(t, b.de, b.de + 0.3))) * 14}px)`)
    }

    // fecho: véu + desfoque, bordão, assinatura
    const pf = E.inOutCubic(P(t, TP.fecho, TP.fecho + 0.5))
    O(veu, 0.84 * pf); cam.style.filter = pf > 0 ? `blur(${14 * pf}px)` : 'none'
    O(fecho, P(t, TP.fecho + 0.2, TP.fecho + 0.6)); T(fecho, `translateY(${(1 - E.outExpo(P(t, TP.fecho + 0.2, TP.fecho + 0.9))) * 40}px)`)
    O(fundoBrilho, 1)
  }
})
