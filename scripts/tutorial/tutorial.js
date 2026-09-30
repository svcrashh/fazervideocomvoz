/* fazervideo · composição do modo tutorial (roda no motor, depois do engine.js).
 * Entrada: const TUTORIAL = { eventos, quadros, aparelho, captura, titulo, serie, textos, A, F, visual? } (gerado pelo compor.mjs).
 * Tudo é função do tempo, como qualquer cena do motor: a tela gravada é uma sequencia() de quadros e
 * câmera, indicador, realce, legendas e transições saem só dos eventos gravados.
 *
 * Linha do tempo: [0, A) abertura · [A, A + duracao) tela real · [A + duracao, fim) fechamento.
 *
 * Dois desenhos:
 *  · TU.visual presente (serie.json com "versao": 2): cada um dos nove elementos sai do que a série declarou
 *    (references/tutorial.md, seção 13). É este que evolui.
 *  · sem TU.visual (série antiga): cenasAntigas(), o desenho de antes da versão 2, congelado. A prova de
 *    regressão compara a folha de eventos pixel a pixel com a da skill original: não mude nada ali.
 * Câmera, indicador, realce e selos de escolha são os mesmos nos dois.
 *
 * Voz (TU.voz, só quando o video.mjs tem `voz`): nos dois desenhos, a legenda do passo é a fala, com a palavra
 * falada em destaque (falaNaLegenda). Sem TU.voz, nada muda.
 */
function montarTutorial(TU) {
  const marcarSe = (e, tipo) => { if (typeof marcar === 'function') marcar(e, tipo) }
  const C = MARCA.cores
  const V = TU.visual || null
  const ap = TU.aparelho, vp = ap.viewport, TOQUE = ap.toque
  const A = TU.A, D = TU.duracao, F = TU.F
  const FIM = A + D + F
  const FT = VIDEO.fonteTitulo || 'system-ui', FX = VIDEO.fonteTexto || FT
  const FM = VIDEO.fonteMono || 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'
  const ev = TU.eventos
  const passos = ev.filter((e) => e.tipo === 'passo')
  const NP = passos.length

  // ---------- layout por formato ----------
  // tela: onde a tela do aparelho fica no quadro (z = 1); legenda: onde a legenda mora (fora da câmera);
  // livre: a parte do quadro que a câmera usa para centrar a ação quando dá zoom (não fica sob a legenda).
  const LAY = V ? layoutNovo() : L({
    // 9:16 respeita a área segura do Reels/TikTok (texto em x 70–940, y 250–1450): a legenda mora ali e
    // a tela (imagem, não texto) pode descer sob a faixa de baixo da plataforma
    '9x16': (() => { const h = 1340, w = (h * vp.width) / vp.height; return { tela: { x: (W - w) / 2, y: 540, w, h, r: 44 }, legenda: { x: 80, y: 252, w: 856, h: 250 }, livre: { x: 0, y: 520, w: W, h: H - 520 } } })(),
    '16x9': (() => { const w = 1320, h = (w * vp.height) / vp.width; return { tela: { x: 64, y: (H - h) / 2 + 20, w, h, r: 18 }, legenda: { x: 1432, y: 200, w: 430, h: 680 }, livre: { x: 0, y: 0, w: 1410, h: H } } })(),
    '4x5': (() => { const h = 980, w = (h * vp.width) / vp.height; return { tela: { x: (W - w) / 2, y: 320, w, h, r: 30 }, legenda: { x: 64, y: 70, w: W - 128, h: 220 }, livre: { x: 0, y: 300, w: W, h: H - 300 } } })(),
    '1x1': (() => { const h = 800, w = (h * vp.width) / vp.height; return { tela: { x: W - w - 80, y: 200, w, h, r: 24 }, legenda: { x: 64, y: 200, w: W - w - 200, h: 600 }, livre: { x: W - w - 140, y: 0, w: w + 140, h: H } } })(),
  })
  const T0 = LAY.tela, k = T0.w / vp.width                 // px do quadro por px CSS do app
  const aTela = (x, y) => [T0.x + x * k, T0.y + y * k]
  const ZMAX = Math.max(1, (TU.captura.largura / T0.w) * 0.98)   // acima disso a imagem amolece

  // Layout da versão 2: a legenda ocupa um lado (visual.legenda.lado), a tela ocupa o maior retângulo que sobra
  // (descontada a moldura) e a parte livre é o quadro menos o lado da legenda. O texto da legenda fica sempre
  // dentro da área segura; a faixa (fundo da legenda) e a tela, que não são texto, podem ir até a borda.
  function layoutNovo() {
    const S = areaSegura(), LG = V.legenda
    const lado = typeof LG.lado === 'object' ? L(LG.lado) : LG.lado
    const lateral = lado === 'direita' || lado === 'esquerda'
    const g = L({ '16x9': 48, padrao: 40 })                     // entre a legenda e a tela
    const mt = L({ '16x9': 56, '9x16': 40, padrao: 44 })        // da tela até a borda do quadro
    const pf = LG.tipo === 'faixa' ? L({ '16x9': 34, padrao: 36 }) : 0   // o quanto a faixa passa do texto
    const cr = cromo()
    let G, banda, R
    if (lateral) {
      const lw = Math.min(L({ '16x9': 440, '9x16': 380, '4x5': 400, '1x1': 380 }), (S.x1 - S.x0) * 0.44)
      const lh = L({ '16x9': 330, '9x16': 400, padrao: 340 })
      const x = lado === 'direita' ? S.x1 - lw : S.x0
      G = { x, y: 0, w: lw, h: lh }
      banda = lado === 'direita' ? { x: x - pf, y: 0, w: W - x + pf, h: H } : { x: 0, y: 0, w: x + lw + pf, h: H }
      const bx0 = LG.tipo === 'faixa' ? banda.x : x, bx1 = LG.tipo === 'faixa' ? banda.x + banda.w : x + lw
      R = lado === 'direita' ? { x0: mt, x1: bx0 - g, y0: mt, y1: H - mt } : { x0: bx1 + g, x1: W - mt, y0: mt, y1: H - mt }
    } else {
      const lh = L({ '16x9': 200, '9x16': 250, '4x5': 220, '1x1': 200 })
      const lw = Math.min(S.x1 - S.x0, L({ '16x9': 1180, padrao: 9999 }))
      const y = lado === 'cima' ? S.y0 : S.y1 - lh
      G = { x: 0, y, w: lw, h: lh }
      // a faixa vai de uma borda lateral à outra e abraça o texto: descer até a borda de baixo, no 9:16,
      // pintaria 40% do quadro sob a interface da plataforma
      banda = { x: 0, y: y - pf, w: W, h: lh + 2 * pf }
      const by0 = LG.tipo === 'faixa' ? banda.y : y, by1 = LG.tipo === 'faixa' ? banda.y + banda.h : y + lh
      R = lado === 'cima' ? { x0: mt, x1: W - mt, y0: by1 + g, y1: H - mt } : { x0: mt, x1: W - mt, y0: mt, y1: by0 - g }
    }
    const aw = R.x1 - R.x0 - cr.l - cr.r, ah = R.y1 - R.y0 - cr.t - cr.b, a = vp.width / vp.height
    const w = Math.min(aw, ah * a), h = w / a
    const tela = { x: R.x0 + cr.l + (aw - w) / 2, y: R.y0 + cr.t + (ah - h) / 2, w, h, r: V.moldura.raio }
    if (lateral) G.y = clamp(tela.y + L({ '16x9': 40, padrao: 32 }), S.y0, S.y1 - G.h)
    else G.x = clamp(tela.x + w / 2 - G.w / 2, S.x0, S.x1 - G.w)
    const bl = LG.tipo === 'faixa' ? banda : { x: G.x, y: G.y, w: G.w, h: G.h }
    const livre = lado === 'direita' ? { x: 0, y: 0, w: bl.x - g / 2, h: H }
      : lado === 'esquerda' ? { x: bl.x + bl.w + g / 2, y: 0, w: W - bl.x - bl.w - g / 2, h: H }
      : lado === 'cima' ? { x: 0, y: bl.y + bl.h + g / 2, w: W, h: H - bl.y - bl.h - g / 2 }
      : { x: 0, y: 0, w: W, h: bl.y - g / 2 }
    return { tela, legenda: G, banda, livre, lado, lateral, cromo: cr }
  }
  // quanto a moldura ocupa em volta da tela (px do quadro), para o layout reservar
  function cromo() {
    const M = V.moldura, z = { t: 0, r: 0, b: 0, l: 0 }
    if (M.tipo === 'fio') { const e = M.espessura; return { t: e, r: e, b: e, l: e } }
    if (M.tipo === 'janela') return TOQUE ? { t: 14, r: 14, b: 14, l: 14 } : { ...z, t: 40 }
    if (M.tipo === 'navegador') return TOQUE ? { t: 58, r: 0, b: 0, l: 0 } : { ...z, t: 62 }
    if (M.tipo === 'proprio') { const m = M.margem; return Array.isArray(m) ? { t: m[0], r: m[1], b: m[2], l: m[3] } : { t: m, r: m, b: m, l: m } }
    return z
  }

  // ---------- câmera: sai só dos eventos ----------
  const chaves = [{ t: 0, x: CX, y: CY, z: 1 }]
  const livre = LAY.livre
  // v2: a janela pode passar da borda da tela do aparelho só do lado da legenda (o que aparece ali fica sob ela)
  const folga = { l: livre.x, r: W - livre.x - livre.w, t: livre.y, b: H - livre.y - livre.h }
  const trava = (v, meia, ini, tam, fMin, fMax, z, centroLivre) => {
    const lo = ini + meia - fMin / z, hi = ini + tam - meia + fMax / z
    // janela maior que a tela: a tela fica centrada na parte livre (não no quadro, que tem a legenda)
    return lo > hi ? ini + tam / 2 - centroLivre / z : clamp(v, lo, hi)
  }
  const foco = (ret, t, dur = 0.75) => {
    // caixa de interesse: o alvo com contexto (no mínimo meia tela de largura), no máximo o que cabe na parte livre
    const bw = Math.max(ret.w + 40, vp.width * 0.5), bh = Math.max(ret.h + 40, vp.height * 0.28)
    let z = clamp(Math.min(livre.w / (bw * k * 1.15), livre.h / (bh * k * 1.15)), 1, ZMAX)
    const [fx, fy] = aTela(ret.x + ret.w / 2, ret.y + ret.h / 2)
    const [ax0, ay0] = aTela(ret.x, ret.y), [ax1, ay1] = aTela(ret.x + ret.w, ret.y + ret.h)
    let x, y
    // Presa na borda da tela do aparelho, a janela pode deixar o alvo fora da parte livre (embaixo da
    // legenda: alvo no canto direito, no 16:9). Então o zoom diminui até o alvo caber na parte livre.
    for (let volta = 0; volta < 14; volta++) {
      // o foco fica no centro da parte livre, não no centro do quadro
      x = fx - (livre.x + livre.w / 2 - CX) / z; y = fy - (livre.y + livre.h / 2 - CY) / z
      // com zoom, a janela não passa da borda da tela do aparelho (senão mostra fundo e corta o app)
      const hw = W / (2 * z), hh = H / (2 * z)
      if (V) {
        x = trava(x, hw, T0.x, T0.w, folga.l, folga.r, z, livre.x + livre.w / 2 - CX)
        y = trava(y, hh, T0.y, T0.h, folga.t, folga.b, z, livre.y + livre.h / 2 - CY)
      } else {
        x = 2 * hw >= T0.w ? T0.x + T0.w / 2 : clamp(x, T0.x + hw, T0.x + T0.w - hw)
        y = 2 * hh >= T0.h ? T0.y + T0.h / 2 : clamp(y, T0.y + hh - (livre.y - (CY - H / 2)) / z, T0.y + T0.h - hh)
      }
      const sx0 = CX + (ax0 - x) * z, sx1 = CX + (ax1 - x) * z, sy0 = CY + (ay0 - y) * z, sy1 = CY + (ay1 - y) * z
      const cabe = sx0 >= livre.x + 8 && sx1 <= livre.x + livre.w - 8 && sy0 >= livre.y + 8 && sy1 <= livre.y + livre.h - 8
      if (cabe || z <= 1) break
      z = Math.max(1, z * 0.88)
    }
    chaves.push({ t: A + t, x, y, z: z < 1.12 ? 1 : z, dur })
  }
  const geral = (t, dur = 0.6) => chaves.push({ t: A + t, x: CX, y: CY, z: 1, dur })
  let ultFoco = -9
  const acoes = ev.filter((e) => /^(toque|aponta|digita|escolhe)$/.test(e.tipo) && e.ret)
  const proxAcao = (t) => acoes.find((a) => a.t > t)
  for (const e of ev) {
    // no passo novo a câmera só abre para o quadro todo se a próxima ação demora: senão é "bomba" de zoom
    if (e.tipo === 'passo') { const pa = proxAcao(e.t); if (e.t - ultFoco > 0.4 && (!pa || pa.t - e.t > 1.8)) geral(e.t + 0.55, 0.55) }
    else if (e.tipo === 'espera' && e.t1 - e.t > 0.5) geral(e.t1 + 0.1, 0.6)  // a tela mudou depois de carregar
    else if ((e.tipo === 'toque' || e.tipo === 'aponta') && e.ret) { foco(e.ret, Math.max(e.t - 0.05, (chaves[chaves.length - 1].t - A) + 0.5)); ultFoco = e.t }
    else if ((e.tipo === 'digita' || e.tipo === 'escolhe') && e.ret) { foco(e.ret, e.t + 0.1, 0.5); ultFoco = e.t }
    else if (e.tipo === 'rola' || e.tipo === 'tela') geral(e.t + 0.3, 0.45)
    else if (e.tipo === 'sucesso') geral(e.t + 0.2, 0.7)
  }
  geral(D - 0.2, 0.9)
  chaves.sort((a, b) => a.t - b.t)
  const cam = camera(chaves, { zmax: ZMAX })

  // posição do indicador: segue os "move" com a mesma curva do gravador
  const moves = ev.filter((e) => e.tipo === 'move')
  const toques = ev.filter((e) => e.tipo === 'toque')
  const telas = ev.filter((e) => e.tipo === 'tela')
  const posEm = (t) => {
    let p = moves.length ? moves[0].de : [vp.width / 2, vp.height * 0.7]
    for (const m of moves) {
      if (t < m.t) break
      p = t >= m.t1 ? m.para : [lerp(m.de[0], m.para[0], E.inOutCubic(P(t, m.t, m.t1))), lerp(m.de[1], m.para[1], E.inOutCubic(P(t, m.t, m.t1)))]
    }
    return p
  }
  // dedo visível só em volta dos toques; cursor visível desde o primeiro movimento
  const visDedo = (t) => {
    let v = 0
    for (const m of moves) {
      const tq = toques.find((q) => q.t >= m.t1 - 0.02 && q.t < m.t1 + 1.5)
      const fimV = (tq ? tq.t : m.t1) + 0.55
      v = Math.max(v, E.outCubic(P(t, m.t - 0.12, m.t + 0.12)) * (1 - E.inCubic(P(t, fimV, fimV + 0.3))))
    }
    return v
  }

  // ---------- conteúdo da tela: gravação, realce, ondas, indicador, selos de escolha ----------
  // es = { realce: {tipo, cor, espessura, raio}, dedo: [preenchimento, traço], seta: [preenchimento, traço], onda, selo: {fundo, tinta, sombra, raio} }
  function conteudoTela(mundo, es, raioTela) {
    const telaBox = el('div', { style: { position: 'absolute', left: px(T0.x), top: px(T0.y), width: px(T0.w), height: px(T0.h), borderRadius: raioTela, overflow: 'hidden', background: '#fff' } }, mundo)
    telaBox.dataset.fv = 'tela'
    const seq = sequencia(telaBox, TU.quadros, { width: px(T0.w), height: px(T0.h) })
    const fx = svgQuadro(mundo)  // realce, ondas, indicador: dentro do mundo = crescem com o zoom, proporcionais à tela
    const realce = realceDe(fx, es.realce)
    const ondas = toques.map(() => sv('circle', { fill: 'none', stroke: es.onda, 'stroke-width': 2 * k }, fx))
    const ind = sv('g', {}, fx)
    const R = (TOQUE ? 11 : 0) * k   // dedo: 22 px CSS de diâmetro (5,6% de uma tela de 390)
    let dedo, seta
    if (TOQUE) {
      dedo = sv('circle', { r: R, fill: es.dedo[0], stroke: es.dedo[1], 'stroke-width': 2 * k }, ind)
      ind.setAttribute('filter', 'drop-shadow(0 2px 5px rgba(0,0,0,.22))')
    } else {
      // cursor: ~22 px CSS de altura (1,5% de 1440), contorno, sombra curta
      seta = sv('path', { d: 'M0 0 L0 17.5 L4.4 13.6 L7.6 20.6 L10.6 19.3 L7.4 12.4 L13 12.4 Z', fill: es.seta[0], stroke: es.seta[1], 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, ind)
      ind.setAttribute('filter', 'drop-shadow(0 1.5px 2px rgba(0,0,0,.3))')
    }
    // escolha de lista nativa e data: um selo com a escolha, colado no campo (a lista nativa não aparece)
    const selos = ev.filter((e) => (e.tipo === 'escolhe' || (e.tipo === 'digita' && e.nativo === 'date')) && e.ret).map((e) => {
      const s = el('div', { style: { position: 'absolute', whiteSpace: 'nowrap', font: `700 ${14 * k}px ${FX}`, color: es.selo.tinta, background: es.selo.fundo, padding: `${5 * k}px ${10 * k}px`, borderRadius: px(es.selo.raio), boxShadow: `0 ${4 * k}px ${12 * k}px ${rgba(es.selo.sombra, 0.25)}` } }, mundo)
      s.textContent = '✓ ' + (e.tipo === 'escolhe' ? e.escolhida : e.texto)
      const [sx, sy] = aTela(e.ret.x + e.ret.w, e.ret.y)
      const r = rectOf(s)
      place(s, Math.min(sx - r.w, T0.x + T0.w - r.w - 6 * k), sy - r.h - 6 * k)
      return { s, e }
    })
    return (t, tc, sai) => {
      seq.set(Math.max(0, tc))
      // realce: no aponta (a duração dele) e antes de cada toque
      let rr = null, ra = 0
      for (const e of ev) {
        if (!e.ret || e.realce === false) continue
        if (e.tipo === 'aponta') { const a = P(tc, e.t, e.t + 0.25) * (1 - P(tc, e.t + e.dur, e.t + e.dur + 0.25)); if (a > ra) { ra = a; rr = e.ret } }
        if (e.tipo === 'toque') { const a = P(tc, e.t - 0.45, e.t - 0.25) * (1 - P(tc, e.t + 0.1, e.t + 0.35)); if (a > ra) { ra = a; rr = e.ret } }
        if (e.tipo === 'escolhe') { const a = P(tc, e.t - 0.1, e.t + 0.15) * (1 - P(tc, e.t1 + 0.4, e.t1 + 0.7)); if (a > ra) { ra = a; rr = e.ret } }
      }
      realce(t, rr, ra)
      // indicador
      const [ix, iy] = aTela(...posEm(tc))
      let aperto = 1
      toques.forEach((q, i) => {
        const d = tc - q.t
        if (d > -0.12 && d < 0.2) aperto = Math.min(aperto, 1 - 0.18 * Math.sin(Math.PI * clamp((d + 0.12) / 0.32)))
        const o = ondas[i], a = P(d, 0, 0.42)
        if (d >= 0 && d < 0.42) { const [ox, oy] = aTela(...q.ponto); o.setAttribute('cx', ox); o.setAttribute('cy', oy); o.setAttribute('r', (TOQUE ? R : 5 * k) * (1 + E.outCubic(a) * (TOQUE ? 1.1 : 2.2))); O(o, 0.85 * (1 - a)) } else O(o, 0)
      })
      if (TOQUE) { dedo.setAttribute('cx', ix); dedo.setAttribute('cy', iy); dedo.setAttribute('r', R * aperto); O(ind, visDedo(tc) * (1 - sai)) }
      else { seta.setAttribute('transform', `translate(${ix} ${iy}) scale(${k * aperto})`); O(ind, P(tc, (moves[0] || { t: 0 }).t - 0.2, (moves[0] || { t: 0 }).t) * (1 - sai)) }
      for (const { s, e } of selos) {
        const a = E.outBack(P(tc, (e.t1 || e.t) - 0.05, (e.t1 || e.t) + 0.3)), b = P(tc, (e.t1 || e.t) + 1.9, (e.t1 || e.t) + 2.2)
        O(s, P(tc, (e.t1 || e.t) - 0.05, (e.t1 || e.t) + 0.1) * (1 - b)); T(s, `scale(${0.6 + 0.4 * a})`); s.style.transformOrigin = '100% 100%'
      }
    }
  }

  // ---------- realce: um tipo por estrutura (o contorno é o do desenho antigo) ----------
  // Devolve (t, ret, a): ret = retângulo do alvo em px CSS do app (ou null), a = intensidade 0→1.
  function realceDe(fx, RC) {
    const box = (rr, m = 5) => { const [x, y] = aTela(rr.x - m, rr.y - m); return { x, y, w: (rr.w + 2 * m) * k, h: (rr.h + 2 * m) * k } }
    const cresce = (b, g) => `translate(${b.x + b.w / 2} ${b.y + b.h / 2}) scale(${g}) translate(${-(b.x + b.w / 2)} ${-(b.y + b.h / 2)})`
    if (RC.tipo === 'contorno') {
      const realce = sv('rect', { fill: 'none', stroke: RC.cor, 'stroke-width': RC.espessura, rx: RC.raio * k }, fx)
      const halo = sv('rect', { fill: rgba(RC.cor, 0.1), stroke: 'none', rx: RC.raio * k }, fx)
      fx.insertBefore(halo, realce)
      return (t, rr, ra) => {
        if (rr) {
          const [x, y] = aTela(rr.x - 5, rr.y - 5), g = 1 + 0.04 * (1 - ra)
          for (const r of [realce, halo]) { r.setAttribute('x', x); r.setAttribute('y', y); r.setAttribute('width', (rr.w + 10) * k); r.setAttribute('height', (rr.h + 10) * k); r.setAttribute('transform', `translate(${x + ((rr.w + 10) * k) / 2} ${y + ((rr.h + 10) * k) / 2}) scale(${g}) translate(${-(x + ((rr.w + 10) * k) / 2)} ${-(y + ((rr.h + 10) * k) / 2)})`) }
        }
        O(realce, ra); O(halo, ra)
      }
    }
    if (RC.tipo === 'cantos') {
      // quatro cantos de visor: o alvo fica emoldurado sem nada passar por cima dele
      const p = sv('path', { fill: 'none', stroke: RC.cor, 'stroke-width': RC.espessura * k * 0.9, 'stroke-linecap': RC.raio > 0 ? 'round' : 'square', 'stroke-linejoin': RC.raio > 0 ? 'round' : 'miter' }, fx)
      return (t, rr, ra) => {
        if (rr) {
          const b = box(rr, 7), g = 1 + 0.12 * (1 - E.outCubic(ra)), c = Math.min(b.w, b.h) * 0.32
          const x0 = b.x, y0 = b.y, x1 = b.x + b.w, y1 = b.y + b.h
          p.setAttribute('d', `M${x0} ${y0 + c}V${y0}H${x0 + c}M${x1 - c} ${y0}H${x1}V${y0 + c}M${x1} ${y1 - c}V${y1}H${x1 - c}M${x0 + c} ${y1}H${x0}V${y1 - c}`)
          p.setAttribute('transform', cresce(b, g))
        }
        O(p, ra)
      }
    }
    if (RC.tipo === 'sublinhado') {
      // um traço que corre por baixo do alvo, da esquerda para a direita
      const r = sv('rect', { fill: RC.cor, rx: Math.min(RC.raio, RC.espessura) * k * 0.5 }, fx)
      return (t, rr, ra) => {
        if (rr) {
          const b = box(rr, 2), e = RC.espessura * k * 0.9
          r.setAttribute('x', b.x); r.setAttribute('y', b.y + b.h + 3 * k); r.setAttribute('width', Math.max(0.01, b.w * E.outCubic(ra))); r.setAttribute('height', e)
        }
        O(r, ra > 0.02 ? 1 : 0)
      }
    }
    if (RC.tipo === 'preenchido') {
      // marca-texto: o alvo ganha um fundo de cor por trás (multiplica, então o texto do app continua legível)
      const r = sv('rect', { fill: RC.cor, rx: RC.raio * k }, fx)
      r.style.mixBlendMode = 'multiply'
      return (t, rr, ra) => {
        if (rr) { const b = box(rr, 6); r.setAttribute('x', b.x); r.setAttribute('y', b.y); r.setAttribute('width', b.w); r.setAttribute('height', b.h); r.setAttribute('transform', cresce(b, 0.94 + 0.06 * E.outBack(ra))) }
        O(r, 0.34 * ra)
      }
    }
    // proprio: o gancho desenha no svg do mundo; recebe o alvo já em px do quadro
    const up = gancho('realce', { svg: fx, k, aTela, cor: RC.cor })
    return (t, rr, ra) => up(t, rr ? { ...box(rr, 5), a: ra } : null)
  }

  // ---------- gancho `proprio` (visual.js da série) ----------
  // VISUAL_PROPRIO.<elemento> = (ctx) => (t, …) => {}. ctx traz o lugar onde desenhar e as medidas; o gancho
  // desenha só dentro do que recebeu e devolve a função do tempo. Contrato completo: references/tutorial.md §13.
  function gancho(nome, extra) {
    const fn = typeof VISUAL_PROPRIO !== 'undefined' && VISUAL_PROPRIO[nome]
    if (typeof fn !== 'function') throw new Error(`visual.${nome} é "proprio", mas o visual.js não define VISUAL_PROPRIO.${nome} = (ctx) => (t) => {}`)
    const up = fn({
      W, H, FMT, L, CX, CY, A, D, F, fim: FIM, toque: TOQUE,
      cores: V.cores, visual: V, area: areaSegura(),
      tela: { ...T0 }, legenda: { ...LAY.legenda }, livre: { ...LAY.livre },
      fontes: { titulo: FT, texto: FX, mono: FM }, ...extra,
    })
    return typeof up === 'function' ? up : () => {}
  }

  const PARTES = { conteudoTela, gancho, marcarSe, C, V, ap, vp, TOQUE, A, D, F, FIM, FT, FX, FM, ev, passos, NP, LAY, T0, k, aTela, cam, telas, TU }
  if (V) cenasNovas(PARTES)
  else cenasAntigas(PARTES)
}

/* ---------- voz: a legenda é a fala, com a palavra falada em destaque ----------
 * TU.voz = { destaque: { modo: 'cor' | 'marca', cor, tinta }, falas: [{ passo, palavras: [{ texto, ini, ate }] }] }, em
 * tempo do vídeo. Uma palavra por vez fica em destaque, de ini a ate (o fim dela, no mínimo 0,12 s para palavra curta
 * não piscar, nunca além da próxima: locucao.mjs). A cor sai da marca (acento); se não se lê sobre o fundo da
 * legenda, vira marca-texto (modo 'marca'). Só a cor muda, o texto não anda: a medida e a checagem da legenda valem.
 * Devolve a função do tempo, ou null se o passo não tem fala (aí a legenda é o texto de sempre). */
function falaNaLegenda(TU, tx, n, caixa = (s) => s) {
  const fala = TU.voz && TU.voz.falas.find((f) => f.passo === n)
  if (!fala) return null
  const D = TU.voz.destaque, ps = fala.palavras
  tx.textContent = ''
  const spans = ps.map((p, i) => { if (i) tx.appendChild(document.createTextNode(' ')); return el('span', { text: caixa(p.texto) }, tx) })
  const liga = D.modo === 'cor' ? { color: D.cor } : { color: D.tinta, background: D.cor, boxShadow: `0 0 0 0.08em ${D.cor}`, borderRadius: '0.12em' }
  const desliga = { color: '', background: '', boxShadow: '', borderRadius: '' }
  let atual = -1
  return (t) => {
    let k = -1
    for (let i = 0; i < ps.length; i++) if (t >= ps[i].ini && t < ps[i].ate) k = i
    if (k === atual) return
    if (atual >= 0) Object.assign(spans[atual].style, desliga)
    if (k >= 0) Object.assign(spans[k].style, liga)
    atual = k
  }
}

/* ======================================================================================================
 * Desenho antigo (série sem "versao"). Congelado: a folha de eventos tem de sair idêntica à da skill
 * original, pixel por pixel (provas/v). Melhorias vão para cenasNovas.
 * ==================================================================================================== */
function cenasAntigas({ conteudoTela, marcarSe, C, TOQUE, A, D, FIM, FT, FX, passos, NP, LAY, T0, cam, telas, TU }) {
  // ---------- abertura ----------
  cena(0, A + 0.5, (root) => {
    root.style.background = C.fundo
    const w = el('div', { cls: 'layer' }, root)
    const bl = makeBlob(w, L({ '16x9': 720, '9x16': 760, padrao: 640 }), rgba(C.marca, 0.14))
    const b2 = makeBlob(w, 420, rgba(C.acento || C.marca, 0.12))
    const chip = el('div', { style: { position: 'absolute', font: `700 ${L({ '16x9': 30, padrao: 34 })}px ${FX}`, color: C.marca, background: rgba(C.marca, 0.1), padding: '12px 26px', borderRadius: '999px', whiteSpace: 'nowrap' } }, w)
    chip.textContent = TU.textos.rotulo
    const ls = bloco(w, TU.textos.tituloLinhas.map((t) => [{ t }]), { top: L({ '16x9': 470, '9x16': 800, padrao: 480 }), entrelinha: L({ '16x9': 124, '9x16': 132, padrao: 120 }), style: { font: `800 ${L({ '16x9': 112, '9x16': 100, padrao: 92 })}px ${FT}`, color: C.tinta, letterSpacing: '-0.02em' } })
    const r0 = rectOf(ls[0].line)
    place(chip, 0, r0.y - L({ '16x9': 110, padrao: 130 })); centrarX(chip)
    return (t) => {
      breathe(bl, t, W - 120, 140, spring(t, 1.3, 0.6), 8 * t, 0, 0)
      breathe(b2, t, 110, H - 140, spring(t - 0.15, 1.3, 0.6), -6 * t, 2, 1.1)
      O(chip, E.outCubic(P(t, 0.1, 0.45))); T(chip, `translateY(${(1 - E.outExpo(P(t, 0.1, 0.6))) * 30}px)`)
      riseWords(palavras(ls), t, 0.25, 0.07)
      // a abertura "mergulha" na tela: zoom-through no ponto onde a tela vai aparecer
      const z = Math.exp(Math.log(9) * E.inCubic(P(t, A - 0.45, A)))
      T(w, `translate(${CX}px,${CY}px) scale(${z}) translate(${-CX}px,${-CY}px)`); O(w, 1 - P(t, A - 0.12, A))
    }
  }, 'abertura')

  // ---------- tela real ----------
  cena(A - 0.45, A + D + 0.6, (root) => {
    const mundo = el('div', { cls: 'layer' }, root)
    // fundo da marca: papel + duas formas que respiram (ficam atrás da tela)
    const b1 = makeBlob(mundo, L({ '16x9': 900, padrao: 800 }), rgba(C.marca, 0.1))
    const b2 = makeBlob(mundo, 560, rgba(C.acento || C.marca, 0.09))
    const sombra = el('div', { style: { position: 'absolute', left: px(T0.x), top: px(T0.y), width: px(T0.w), height: px(T0.h), borderRadius: px(T0.r), boxShadow: `0 40px 90px ${rgba(C.tinta, 0.22)}, 0 8px 22px ${rgba(C.tinta, 0.12)}` } }, mundo)
    const moldura = el('div', { style: { position: 'absolute', left: px(T0.x - (TOQUE ? 14 : 0)), top: px(T0.y - (TOQUE ? 14 : 40)), width: px(T0.w + (TOQUE ? 28 : 0)), height: px(T0.h + (TOQUE ? 28 : 40)), borderRadius: px(T0.r + (TOQUE ? 14 : 4)), background: TOQUE ? '#101114' : '#fff', border: TOQUE ? 'none' : `1px solid ${rgba(C.tinta, 0.12)}` } }, mundo)
    if (!TOQUE) {
      // barra de janela do computador: três bolinhas
      for (let i = 0; i < 3; i++) el('div', { style: { position: 'absolute', left: px(18 + i * 24), top: '14px', width: '12px', height: '12px', borderRadius: '50%', background: ['#FF5F57', '#FEBC2E', '#28C840'][i] } }, moldura)
    }
    void sombra
    const conteudo = conteudoTela(mundo, {
      realce: { tipo: 'contorno', cor: C.marca, espessura: 3, raio: 12 },
      dedo: [rgba('#1B1B1F', 0.28), 'rgba(255,255,255,.95)'], seta: ['#1B1B1F', '#fff'], onda: TOQUE ? '#fff' : C.marca,
      selo: { fundo: C.marca, tinta: '#fff', sombra: C.tinta, raio: 999 },
    }, px(T0.r))
    return (t) => {
      const tc = t - A
      // até o corte a abertura ainda está mergulhando: a tela só ganha fundo quando a abertura sai
      root.style.background = t >= A - 0.12 ? C.fundo : 'transparent'
      breathe(b1, t, L({ '16x9': W - 60, padrao: W - 40 }), 120, 1, 6 * t, 1, 0.3)
      breathe(b2, t, 70, H - 90, 1, -5 * t, 3, 1.4)
      // entrada: a tela nasce de dentro da abertura (escala 0,86 → 1)
      const ent = E.outExpo(P(t, A - 0.2, A + 0.5)), sai = E.inOutCubic(P(t, A + D - 0.1, A + D + 0.55))
      aplicarCamera(mundo, cam, t)
      // troca de tela: a tela "respira" (recua 3,5% e volta em 0,45 s) no tempo do whoosh
      let resp = 0
      for (const e of telas) resp = Math.max(resp, Math.sin(Math.PI * P(tc, e.t + 0.05, e.t + 0.5)))
      const esc = lerp(0.86, 1, ent) * lerp(1, 0.9, sai) * (1 - 0.035 * resp)
      mundo.style.transform += ` translate(${CX}px,${CY}px) scale(${esc}) translate(${-CX}px,${-CY}px)`
      O(mundo, P(t, A - 0.14, A + 0.06) * (1 - P(t, A + D + 0.2, A + D + 0.55)))
      conteudo(t, tc, sai)
    }
  }, 'tela')

  // ---------- legendas (fora da câmera) ----------
  const G = LAY.legenda
  cena(A - 0.1, A + D + 0.35, (root) => {
    root.style.pointerEvents = 'none'
    const card = el('div', { style: { position: 'absolute', left: px(G.x), top: px(G.y), width: px(G.w), minHeight: px(L({ '9x16': 236, '16x9': 300, padrao: 200 })), background: '#fff', borderRadius: px(L({ '16x9': 26, padrao: 30 })), padding: L({ '16x9': '34px 34px 38px', padrao: '32px 40px 38px' }), boxSizing: 'border-box', boxShadow: `0 24px 60px ${rgba(C.tinta, 0.16)}`, transformOrigin: '50% 0%' } }, root)
    card.dataset.fv = 'legenda'
    const itens = passos.map((pa) => {
      const box = el('div', { style: { position: 'absolute', left: L({ '16x9': '34px', padrao: '40px' }), right: L({ '16x9': '34px', padrao: '40px' }), top: L({ '16x9': '34px', padrao: '32px' }) } }, card)
      const rot = el('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', font: `700 ${L({ '16x9': 24, padrao: 30 })}px ${FX}`, color: C.marca, marginBottom: '14px' } }, box)
      rot.innerHTML = `<span style="width:${L({ '16x9': 12, padrao: 14 })}px;height:${L({ '16x9': 12, padrao: 14 })}px;border-radius:50%;background:${C.marca}"></span>${(TU.textos.passo || 'Passo {n} de {N}').replace('{n}', pa.n).replace('{N}', NP)}`
      const tx = el('div', { style: { font: `700 ${L({ '16x9': 44, '9x16': 50, padrao: 46 })}px/1.16 ${FT}`, color: C.tinta, letterSpacing: '-0.01em' } }, box)
      const fala = falaNaLegenda(TU, tx, pa.n)
      if (!fala) tx.textContent = pa.legenda
      marcarSe(tx, 'legenda')
      return { box, tx, pa, fala }
    })
    // Legenda longa não vaza do cartão: a fonte encolhe (até 70%) até o passo caber na altura do cartão.
    // Mede uma vez, com as fontes carregadas; todo passo usa o mesmo cartão, então nada pula na virada.
    let medido = false
    const caber = () => {
      const cs = getComputedStyle(card)
      const livre = card.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      for (const it of itens) {
        const d = it.box.style.display
        it.box.style.display = 'block'
        const base = parseFloat(getComputedStyle(it.tx).fontSize)
        for (let f = base; it.box.scrollHeight > livre && f > base * 0.7; f -= 2) it.tx.style.fontSize = px(f - 2)
        it.box.style.display = d
      }
      medido = true
    }
    return (t) => {
      if (!medido && (!document.fonts || document.fonts.status === 'loaded')) caber()
      for (const it of itens) if (it.fala) it.fala(t)
      const tc = t - A
      O(card, E.outCubic(P(t, A, A + 0.35)) * (1 - P(t, A + D, A + D + 0.3)))
      // virada de passo: o cartão vira no eixo X (0,5 s) e o texto novo nasce no verso
      let ativo = 0
      itens.forEach((it, i) => { if (tc >= it.pa.t - 0.25) ativo = i })
      const tv = itens[ativo] ? itens[ativo].pa.t : 0
      const f = ativo > 0 ? P(tc, tv - 0.25, tv + 0.25) : 1
      const ang = f < 1 ? (f < 0.5 ? -90 * E.inCubic(f * 2) : 90 * (1 - E.outCubic((f - 0.5) * 2))) : 0
      card.style.transform = `perspective(1400px) rotateX(${ang}deg)`
      itens.forEach((it, i) => { it.box.style.display = i === (f < 0.5 && ativo > 0 ? ativo - 1 : ativo) ? 'block' : 'none' })
    }
  }, 'legendas')

  // ---------- fechamento ----------
  cena(A + D + 0.2, FIM + 0.01, (root) => {
    root.style.background = C.marca
    const ls = bloco(root, TU.textos.fimLinhas.map((t) => [{ t }]), { top: L({ '16x9': 330, '9x16': 640, padrao: 380 }), entrelinha: L({ '16x9': 118, padrao: 124 }), style: { font: `800 ${L({ '16x9': 104, '9x16': 96, padrao: 88 })}px ${FT}`, color: '#fff', letterSpacing: '-0.02em' } })
    let logo = null
    if (MARCA.logo) {
      const vb = MARCA.logo.viewBox.split(/\s+/).map(Number), LH = L({ '16x9': 110, '9x16': 130, padrao: 110 }), LW = (LH * vb[2]) / vb[3]
      logo = sv('svg', { viewBox: MARCA.logo.viewBox, width: LW, height: LH }, root)
      Object.assign(logo.style, { position: 'absolute', left: px(CX - LW / 2), top: px(L({ '16x9': 700, '9x16': 1180, padrao: 760 })) })
      const g = sv('g', { transform: MARCA.logo.transform || '' }, logo)
      for (const pt of MARCA.logo.partes) sv('path', { d: pt.d, fill: MARCA.logo.negativo ? '#fff' : pt.fill }, g)
      marcarSe(logo, 'logo')
    }
    return (t) => {
      const t0 = A + D + 0.2
      iris(root, raioCobre(CX, CY) * E.inOutCubic(P(t, t0, t0 + 0.45)), CX, CY)
      riseWords(palavras(ls), t, t0 + 0.3, 0.08)
      if (logo) { O(logo, E.outCubic(P(t, t0 + 0.7, t0 + 1.0))); T(logo, `scale(${0.9 + 0.1 * E.outBack(P(t, t0 + 0.7, t0 + 1.1))})`); logo.style.transformOrigin = '50% 50%' }
    }
  }, 'fechamento')
}
