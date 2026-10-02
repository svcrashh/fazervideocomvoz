// Molde tela-real-com-camera: tutorial com a tela real gravada, câmera que vai até o campo da vez,
// véu + desfoque no resto, cartão de passo, intertítulo entre etapas, legenda karaokê da voz e "Pronto!".
// Tudo o que é da marca e do vídeo vem de DADOS (montado pelo montar.mjs a partir do exemplo.json).
const D = DADOS, C = D.marca.cores, FT = D.marca.fontes, X = D.linha
const TW = D.tela.w, TH = D.tela.h
const fTitulo = (px) => `${FT.titulo.peso || 700} ${px}px "${FT.titulo.familia}"`
const fTexto = (px, peso) => `${peso || FT.texto.peso || 500} ${px}px "${FT.texto.familia}"`
const fMono = (px) => `${FT.mono ? FT.mono.peso || 600 : 600} ${px}px "${FT.mono ? FT.mono.familia : FT.texto.familia}"`
const caixa = (s) => (FT.titulo.caixa === 'alta' ? s.toUpperCase() : s)

// Layout por formato: onde o cartão fica, a área livre onde a câmera centra o campo, e o plano geral.
const LAY = L({
  '16x9': { card: { x: 72, y: 540, w: 560, ancora: 'meio' }, livre: { x: 680, y: 70, w: 1180, h: 800 }, cobre: { x: 660, y: 0, w: 1260, h: 1080 },
    geral: { cx: 960, cy: 572, w: 1440 }, leg: { y: 1080 - 64, w: 1500, px: 44 }, sMin: 1.9, frase: 46, rot: 22, titulo: 104, inter: 120 },
  '9x16': { card: { x: 70, y: 262, w: 860, ancora: 'topo' }, livre: { x: 40, y: 560, w: 1000, h: 700 }, cobre: { x: 0, y: 520, w: 1080, h: 800 },
    geral: { cx: 540, cy: 900, w: 1000 }, leg: { y: 1440, w: 800, px: 48 }, sMin: 3.0, frase: 50, rot: 24, titulo: 112, inter: 128 },
})
const S_MAX = D.tela.dsf * 1.1

const sGeral = LAY.geral.w / TW
const GERAL = { cx: TW / 2, cy: TH / 2, s: sGeral, fx: LAY.geral.cx, fy: LAY.geral.cy }
const centroLivre = { x: LAY.livre.x + LAY.livre.w / 2, y: LAY.livre.y + LAY.livre.h / 2 }
function enquadra(r) {
  const s = clamp(Math.min((LAY.livre.w * 0.86) / r.w, (LAY.livre.h * 0.86) / r.h), LAY.sMin, S_MAX)
  return { cx: r.x + r.w / 2, cy: r.y + r.h / 2, s, fx: centroLivre.x, fy: centroLivre.y }
}
// Chaves da câmera: plano geral → o campo de cada ação (chega um pouco antes do toque) → o resultado.
const CH = [{ v: 0, ...GERAL, reg: { x: 0, y: 0, w: TW, h: TH } }, { v: X.geral1, ...GERAL, reg: { x: 0, y: 0, w: TW, h: TH } }]
for (const fc of X.focos) CH.push({ v: fc.v, dur: fc.dur, ...enquadra(fc.reg), reg: fc.reg })
function cam(v) {
  let cur = CH[0]
  for (let i = 1; i < CH.length; i++) {
    const k = CH[i], d = k.dur || 0.85
    if (v < k.v - d) break
    const e = E.inOutCubic(P(v, k.v - d, k.v))
    cur = { cx: lerp(cur.cx, k.cx, e), cy: lerp(cur.cy, k.cy, e), s: Math.exp(lerp(Math.log(cur.s), Math.log(k.s), e)),
      fx: lerp(cur.fx, k.fx, e), fy: lerp(cur.fy, k.fy, e),
      reg: { x: lerp(cur.reg.x, k.reg.x, e), y: lerp(cur.reg.y, k.reg.y, e), w: lerp(cur.reg.w, k.reg.w, e), h: lerp(cur.reg.h, k.reg.h, e) } }
  }
  let tx = cur.fx - cur.cx * cur.s, ty = cur.fy - cur.cy * cur.s
  // com zoom, a tela cobre a área livre inteira (nada de borda vazia atrás do campo)
  const cb = LAY.cobre, sw = TW * cur.s, sh = TH * cur.s
  if (sw >= cb.w) tx = clamp(tx, cb.x + cb.w - sw, cb.x)
  if (sh >= cb.h) ty = clamp(ty, cb.y + cb.h - sh, cb.y)
  return { s: cur.s, tx, ty, reg: cur.reg }
}
// tempo da gravação para cada instante do vídeo (congela entre trechos)
function tGrav(v) {
  const sg = X.trechos
  if (v <= sg[0].v0) return sg[0].r0
  for (const s of sg) if (v < s.v1) return v < s.v0 ? s.r0 : s.r0 + (v - s.v0) * s.vel
  return sg[sg.length - 1].r1
}
function interpKeys(ks, v) {
  if (!ks.length) return null
  if (v <= ks[0].v) return ks[0]
  for (let i = 1; i < ks.length; i++) if (v < ks[i].v) { const a = ks[i - 1], b = ks[i], e = E.inOutCubic(P(v, a.v, b.v)); return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) } }
  return ks[ks.length - 1]
}
// foco (véu + desfoque) liga quando a câmera chega no primeiro passo
const foco = (v) => (X.passos.length ? E.inOutCubic(P(v, X.passos[0].v0 + 0.15, X.passos[0].v0 + 0.75)) : 0)

cena(0, X.dur, (root) => {
  const fundo = camada(root, C.fundo)
  if (D.marca.textura !== 'liso') {
    const g = el('div', { cls: 'layer', style: { backgroundImage: `radial-gradient(${rgba(C.texto, 0.09)} 1.6px, transparent 1.8px)`, backgroundSize: '34px 34px' } }, fundo)
    g.style.opacity = 0.9
  }
  // mundo = moldura de navegador + tela gravada. Duas cópias: a de baixo desfocada, a de cima nítida e recortada no campo.
  const barra = 46
  function mundo(parent) {
    const m = el('div', { cls: 'abs', style: { width: px(TW), height: px(TH), transformOrigin: '0 0' } }, parent)
    const moldura = el('div', { cls: 'abs', style: { left: px(-10), top: px(-barra - 10), width: px(TW + 20), height: px(TH + barra + 20), borderRadius: '18px', background: C.superficie, boxShadow: `0 40px 90px ${rgba('#000000', 0.35)}` } }, m)
    for (let i = 0; i < 3; i++) el('div', { cls: 'abs', style: { left: px(26 + i * 22), top: px(barra / 2 + 2), width: '12px', height: '12px', borderRadius: '50%', background: rgba(C.texto, 0.28) } }, moldura)
    if (D.endereco) el('div', { cls: 'abs', text: D.endereco, style: { left: px(TW / 2 - 200), top: px(13), width: '400px', height: px(barra - 16), lineHeight: px(barra - 16), borderRadius: '10px', textAlign: 'center', background: rgba(C.texto, 0.08), color: rgba(C.texto, 0.7), font: fTexto(15, 500) } }, moldura)
    const seq = sequencia(m, D.quadros, { width: px(TW), height: px(TH), borderRadius: '4px' })
    return { m, seq }
  }
  const A = mundo(root)
  const veu = el('div', { cls: 'layer', style: { background: C.veu } }, root)
  const janela = el('div', { cls: 'layer' }, root)
  const B = mundo(janela)
  const borda = el('div', { cls: 'abs', style: { border: `3px solid ${rgba(C.destaque, 0.9)}`, borderRadius: '16px', boxShadow: `0 0 0 9999px transparent, 0 18px 50px ${rgba('#000000', 0.35)}` } }, root)
  // cursor (seta) e anel de toque
  const cur = sv('svg', { width: 40, height: 48, viewBox: '0 0 20 24' }, root)
  Object.assign(cur.style, { position: 'absolute', left: '0', top: '0', overflow: 'visible' })
  sv('path', { d: 'M1 1 L1 19 L5.6 14.8 L8.6 22 L11.6 20.7 L8.7 13.6 L15 13.6 Z', fill: C.destaque, stroke: '#FFFFFF', 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, cur)
  const aneis = X.toques.map(() => el('div', { cls: 'abs', style: { width: '0', height: '0', borderRadius: '50%', border: `4px solid ${C.destaque}` } }, root))

  // cartão de passo: rótulo + frase de cada passo, trocando por "subir"
  const card = el('div', { cls: 'abs', style: { left: px(LAY.card.x), width: px(LAY.card.w), background: C.superficie, borderRadius: '26px', boxShadow: `0 24px 60px ${rgba('#000000', 0.28)}`, overflow: 'hidden' } }, root)
  const barraProg = el('div', { cls: 'abs', style: { left: '0', bottom: '0', height: '6px', width: '0', background: C.destaque } }, card)
  const conteudos = X.passos.map((p) => {
    const c = el('div', { style: { position: 'absolute', left: '40px', top: '34px', width: px(LAY.card.w - 80) } }, card)
    el('div', { text: D.textos.passo.replace('{n}', p.n).replace('{N}', X.passos.length).toUpperCase(), style: { font: fMono(LAY.rot), letterSpacing: '0.12em', color: C.destaque, marginBottom: '14px' } }, c)
    el('div', { text: p.frase, style: { font: fTexto(LAY.frase, FT.texto.pesoForte || 700), lineHeight: '1.18', color: C.texto } }, c)
    marcar(c, 'texto', p.frase)
    return c
  })
  const altCard = Math.max(...conteudos.map((c) => c.getBoundingClientRect().height)) + 34 + 40
  card.style.height = px(altCard)
  card.style.top = px(LAY.card.ancora === 'meio' ? LAY.card.y - altCard / 2 : LAY.card.y)

  // legenda karaokê das falas (a palavra dita fica numa caixa da cor de destaque)
  const legendas = X.falas.map((f) => {
    const box = el('div', { cls: 'abs', style: { left: px(CX - LAY.leg.w / 2), width: px(LAY.leg.w), display: 'flex', justifyContent: 'center' } }, root)
    const pil = el('div', { style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `0 ${Math.round(LAY.leg.px * 0.26)}px`, padding: '14px 26px', borderRadius: '20px', background: rgba(C.superficie, 0.92), maxWidth: px(LAY.leg.w) } }, box)
    const ws = f.palavras.map((w) => el('span', { text: w.texto, style: { font: fTexto(LAY.leg.px, 700), color: C.texto, padding: '2px 8px', borderRadius: '10px', lineHeight: '1.3' } }, pil))
    const h = box.getBoundingClientRect().height
    box.style.top = px(LAY.leg.y - h)
    marcar(pil, 'legenda', f.texto)
    return { box, ws, f }
  })

  // intertítulos: o fundo da marca e 2–3 palavras grandes
  const inters = X.inters.map((it) => {
    const lay = camada(root, C.fundo)
    const ls = bloco(lay, [[{ t: caixa(it.texto) }]], { top: CY - LAY.inter * 0.55, entrelinha: LAY.inter, style: { font: fTitulo(LAY.inter), color: C.texto, letterSpacing: '-0.01em' } })
    const fio = el('div', { cls: 'abs', style: { left: px(CX - 50), top: px(CY - LAY.inter * 0.55 - 46), width: '100px', height: '8px', borderRadius: '4px', background: C.destaque, transformOrigin: '50% 50%' } }, lay)
    return { lay, ls, fio, it }
  })

  // abertura: a promessa escrita já no quadro 0, sobre a tela no plano geral velada
  const ab = el('div', { cls: 'layer' }, root)
  const abVeu = el('div', { cls: 'layer', style: { background: C.fundo } }, ab)
  const rot = el('div', { cls: 'abs', text: D.textos.rotulo.toUpperCase(), style: { left: '0', width: px(W), textAlign: 'center', font: fMono(LAY.rot + 4), letterSpacing: '0.16em', color: C.destaque } }, ab)
  const linhasTit = D.textos.tituloLinhas[FMT] || D.textos.tituloLinhas.padrao
  const tit = bloco(ab, linhasTit.map((l) => [{ t: caixa(l) }]), { top: CY - (linhasTit.length * LAY.titulo * 1.26) / 2, entrelinha: LAY.titulo * 1.26, style: { font: fTitulo(LAY.titulo), color: C.texto } })
  rot.style.top = px(CY - (linhasTit.length * LAY.titulo * 1.26) / 2 - 70)
  marcar(rot, 'texto', 'rótulo')

  // fim: "Pronto!" + apoio + logo, abrindo de um círculo no campo do último passo
  const fim = camada(root, C.fimFundo)
  const fimL = bloco(fim, [[{ t: D.textos.fim }]], { top: CY - L({ '16x9': 130, '9x16': 170 }), entrelinha: 150, style: { font: fTitulo(L({ '16x9': 150, '9x16': 160 })), color: C.fimTexto } })
  const apoio = el('div', { cls: 'abs', text: D.textos.fimApoio || '', style: { left: '0', width: px(W), top: px(CY + L({ '16x9': 110, '9x16': 110 })), textAlign: 'center', font: fTexto(L({ '16x9': 40, '9x16': 44 }), 500), color: rgba(C.fimTexto, 0.82) } }, fim)
  if (D.textos.fimApoio) marcar(apoio, 'texto', 'apoio')
  let logo = null
  if (D.logo) logo = imagem(fim, D.logo.arquivo, { left: px(CX - D.logo.w / 2), top: px(L({ '16x9': 250, '9x16': 560 }) - D.logo.h / 2), width: px(D.logo.w), height: px(D.logo.h) })

  legendas.forEach(({ box }) => root.appendChild(box))   // a legenda fica por cima de tudo, inclusive do fim

  return (t) => {
    const k = cam(t), tr = `translate(${k.tx}px,${k.ty}px) scale(${k.s})`
    const tg = tGrav(t)
    A.seq.set(tg); B.seq.set(tg)
    T(A.m, tr); T(B.m, tr)
    const f = foco(t) * (t < X.fim.v0 ? 1 : 0)
    A.m.style.filter = f > 0.01 ? `blur(${(10 * f) / k.s}px)` : 'none'
    O(veu, (D.marca.veu || 0.58) * f)
    const pad = 14, rx = k.reg.x * k.s + k.tx - pad, ry = k.reg.y * k.s + k.ty - pad, rw = k.reg.w * k.s + 2 * pad, rh = k.reg.h * k.s + 2 * pad
    const cx0 = lerp(0, rx, f), cy0 = lerp(0, ry, f), cx1 = lerp(W, rx + rw, f), cy1 = lerp(H, ry + rh, f)
    janela.style.clipPath = `inset(${cy0}px ${W - cx1}px ${H - cy1}px ${cx0}px round ${18 * f}px)`
    place(borda, rx - 2, ry - 2, rw + 4, rh + 4); O(borda, f * 0.9)

    const pc = interpKeys(X.cursor, t), vis = P(t, X.geral1 - 0.2, X.geral1 + 0.2) * (1 - P(t, X.fim.v0 - 0.1, X.fim.v0))
    if (pc) T(cur, `translate(${pc.x * k.s + k.tx - 2}px,${pc.y * k.s + k.ty - 2}px)`)
    O(cur, pc ? vis : 0)
    X.toques.forEach((q, i) => {
      const e = P(t, q.v, q.v + 0.5), r = 8 + 46 * E.outExpo(e), x = q.x * k.s + k.tx, y = q.y * k.s + k.ty
      place(aneis[i], x - r, y - r, 2 * r, 2 * r); O(aneis[i], t >= q.v && e < 1 ? 1 - e : 0)
    })

    // cartão: entra pela lateral (16:9) ou de cima (9:16) no primeiro passo e sai no fim
    const p0 = X.passos[0].v0, entra = E.outExpo(P(t, p0 - 0.1, p0 + 0.5)), sai = E.inOutCubic(P(t, X.fim.v0 - 0.35, X.fim.v0))
    T(card, VERTICAL ? `translateY(${(1 - entra) * -420 - sai * 420}px)` : `translateX(${(1 - entra) * -700 - sai * 700}px)`)
    O(card, entra * (1 - sai)); card.style.display = X.inters.some((it) => t >= it.v0 && t < it.v1) ? 'none' : 'block'
    let atual = 0
    X.passos.forEach((p, i) => { if (t >= p.v0 - 0.05) atual = i })
    conteudos.forEach((c, i) => {
      const p = X.passos[i], e = E.outExpo(P(t, p.v0 - 0.05, p.v0 + 0.4)), prox = X.passos[i + 1]
      const s = prox ? E.inOutCubic(P(t, prox.v0 - 0.3, prox.v0 - 0.05)) : 0
      T(c, `translateY(${(1 - e) * 60 - s * 60}px)`); O(c, i === 0 && t < p.v0 ? 1 : e * (1 - s))
    })
    barraProg.style.width = px(LAY.card.w * ((atual + P(t, X.passos[atual].v0, X.passos[atual].v1)) / X.passos.length))

    legendas.forEach(({ box, ws, f: fl }) => {
      const ini = fl.palavras[0].ini, fimF = fl.palavras[fl.palavras.length - 1].fim
      const o = P(t, ini - 0.25, ini - 0.05) * (1 - P(t, fimF + 0.45, fimF + 0.65))
      O(box, o); T(box, `translateY(${(1 - E.outExpo(P(t, ini - 0.25, ini + 0.1))) * 24}px)`)
      fl.palavras.forEach((w, i) => {
        const dita = t >= w.ini - 0.03 && (t < w.fim + 0.02 || (i === fl.palavras.length - 1 && t < fimF + 0.65))
        ws[i].style.background = dita ? C.destaque : 'transparent'
        ws[i].style.color = dita ? C.sobreDestaque : C.texto
        ws[i].style.opacity = t >= w.ini - 0.03 ? 1 : 0.55
      })
    })

    inters.forEach(({ lay, ls, fio, it }) => {
      const on = t >= it.v0 && t < it.v1
      lay.style.display = on ? 'block' : 'none'
      if (on) { riseWords(palavras(ls), t, it.v0, 0.06, 0.45); T(fio, `scaleX(${E.outExpo(P(t, it.v0, it.v0 + 0.4))})`) }
    })

    // abertura: título inteiro no quadro 0; sai subindo e o véu abre para o plano geral
    const sa = E.inOutCubic(P(t, X.abertura - 0.45, X.abertura))
    ab.style.display = t < X.abertura ? 'block' : 'none'
    O(abVeu, 0.86 * (1 - sa))
    palavras(tit).forEach((w) => { T(w.inner, `translateY(${-sa * 140}%)`) })
    O(rot, 1 - sa)

    const fv = X.fim.v0, fe = E.inOutCubic(P(t, fv, fv + 0.55))
    fim.style.display = t >= fv ? 'block' : 'none'
    if (t >= fv) {
      const ox = X.fimOrigem ? X.fimOrigem.x * k.s + k.tx : CX, oy = X.fimOrigem ? X.fimOrigem.y * k.s + k.ty : CY
      iris(fim, raioCobre(ox, oy) * fe, ox, oy)
      riseWords(palavras(fimL), t, fv + 0.3, 0.06, 0.5)
      O(apoio, E.outExpo(P(t, fv + 0.6, fv + 1.0))); T(apoio, `translateY(${(1 - E.outExpo(P(t, fv + 0.6, fv + 1.0))) * 30}px)`)
      if (logo) O(logo, E.outExpo(P(t, fv + 0.8, fv + 1.2)))
    }
  }
})
