/* fazervideo · o desenho declarado do modo tutorial (serie.json com "versao": 2). Roda no motor, depois do
 * engine.js; quem chama é o montarTutorial (tutorial.js), que já resolveu layout, câmera e indicador.
 * Cada elemento sai de TU.visual (cores já em hex, conferido pelo visual.mjs). Um tipo existe porque muda a
 * estrutura do quadro, não a cor. O que cada um é e quando usar: references/tutorial.md, seção 13.
 */

// O iniciar() do motor espera só o peso 400 de cada fonte. O desenho mede títulos e legendas em outros pesos
// (800, 600…) na montagem: medidos com a métrica da fonte reserva, saem descentrados e com a entrelinha
// errada. Aqui se espera toda face declarada no fontes.css antes de montar. (O desenho antigo tem o mesmo
// defeito e fica como está: a regressão exige o pixel de antes.)
const _iniciarDoMotor = iniciar
// eslint-disable-next-line no-global-assign
iniciar = async function () {
  await Promise.all([...document.fonts].map((f) => f.load().catch(() => null)))
  return _iniciarDoMotor()
}

function cenasNovas({ conteudoTela, gancho, marcarSe, V, TOQUE, A, D, FIM, FT, FX, FM, passos, NP, LAY, T0, cam, telas, TU }) {
  const S = areaSegura()
  const FU = V.fundo, M = V.moldura, LG = V.legenda, SE = V.selo, TI = V.titulo, AB = V.abertura, FC = V.fechamento
  const alto = (s) => s.toLocaleUpperCase('pt-BR')
  const lum = (h) => { const c = hex2rgb(h).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
  const legivel = (h) => (lum(h) > 0.4 ? '#111111' : '#FFFFFF')   // tinta que se lê sobre h
  const sombraDe = (s) => ({ nenhuma: 'none', curta: '0 6px 18px rgba(0,0,0,.18)', longa: '0 40px 90px rgba(0,0,0,.26), 0 8px 22px rgba(0,0,0,.14)' })[s] || 'none'
  const ret = (r) => ({ position: 'absolute', left: px(r.x), top: px(r.y), width: px(r.w), height: px(r.h) })
  const passoTxt = (n, pad) => (TU.textos.passo || 'Passo {n} de {N}').replace('{n}', pad ? String(n).padStart(2, '0') : n).replace('{N}', pad ? String(NP).padStart(2, '0') : NP)

  // ---------- fundo: o que fica atrás da tela e da abertura ----------
  // Desenhado duas vezes (abertura e tela) pela mesma função do tempo: a troca entre as cenas não aparece.
  function fundo(camada, fase) {
    camada.style.background = FU.cor
    const f = FU.forca
    if (FU.tipo === 'liso') return () => {}
    if (FU.tipo === 'formas') {
      const b1 = makeBlob(camada, L({ '16x9': 900, padrao: 800 }), rgba(FU.tinta, f))
      const b2 = makeBlob(camada, 560, rgba(FU.tinta2, f * 0.9))
      return (t) => { breathe(b1, t, L({ '16x9': W - 60, padrao: W - 40 }), 120, 1, 6 * t, 1, 0.3); breathe(b2, t, 70, H - 90, 1, -5 * t, 3, 1.4) }
    }
    if (FU.tipo === 'grade' || FU.tipo === 'pontos') {
      // papel técnico: linhas finas (grade) ou pontos (pontos) num passo fixo, andando devagar
      const passo = L({ '16x9': 64, padrao: 60 }), id = 'fvfundo-' + fase
      const s = svgQuadro(camada)
      const pat = sv('pattern', { id, width: passo, height: passo, patternUnits: 'userSpaceOnUse' }, sv('defs', {}, s))
      if (FU.tipo === 'grade') sv('path', { d: `M${passo} 0H0V${passo}`, fill: 'none', stroke: rgba(FU.tinta, f), 'stroke-width': 1.5 }, pat)
      else sv('circle', { cx: passo / 2, cy: passo / 2, r: 2.6, fill: rgba(FU.tinta, f) }, pat)
      sv('rect', { width: W, height: H, fill: `url(#${id})` }, s)
      return (t) => pat.setAttribute('patternTransform', `translate(${((t * 5) % passo).toFixed(2)} ${((t * 3) % passo).toFixed(2)})`)
    }
    if (FU.tipo === 'luz') {
      // superfície escura com focos de luz que derivam, como luz de palco sobre fumaça
      const d = Math.max(W, H) * 1.15
      const luzes = [[FU.tinta, 0.12, 0.18, 0], [FU.tinta2, 0.9, 0.8, 2.1], [FU.tinta, 0.78, 0.05, 4.2]].map(([c, x, y, ph]) => ({
        e: el('div', { style: { position: 'absolute', left: px(x * W - d / 2), top: px(y * H - d / 2), width: px(d), height: px(d), borderRadius: '50%', willChange: 'transform', background: `radial-gradient(circle, ${rgba(c, f)} 0%, ${rgba(c, f * 0.35)} 28%, ${rgba(c, 0)} 60%)` } }, camada), ph,
      }))
      // anda por transform (a luz é rasterizada uma vez e só composta): por left/top, custava 3× o quadro de um
      // fundo liso; assim, 1,7×. Rasterizar a 1/4 e ampliar saiu mais caro, não mais barato (medido)
      return (t) => { for (const l of luzes) T(l.e, `translate(${(Math.sin(t * 0.45 + l.ph) * W * 0.08).toFixed(2)}px,${(Math.cos(t * 0.38 + l.ph) * H * 0.06).toFixed(2)}px)`) }
    }
    if (FU.tipo === 'faixas') {
      // listras largas em diagonal, em duas tintas, correndo devagar
      const lg = L({ '16x9': 110, padrao: 96 }), dg = Math.hypot(W, H)
      const s = el('div', { style: { position: 'absolute', left: px(CX - dg), top: px(CY - dg), width: px(2 * dg), height: px(2 * dg), opacity: f, background: `repeating-linear-gradient(-35deg, ${FU.tinta} 0 ${lg}px, transparent ${lg}px ${2 * lg}px, ${FU.tinta2} ${2 * lg}px ${3 * lg}px, transparent ${3 * lg}px ${4 * lg}px)` } }, camada)
      return (t) => T(s, `translate(${(t * 14).toFixed(2)}px,${(-t * 9).toFixed(2)}px)`)
    }
    return gancho('fundo', { camada, fase })
  }

  // ---------- moldura: o que envolve a tela gravada (dentro do mundo: anda com a câmera) ----------
  function moldura(mundo) {
    const r = T0.r, cr = LAY.cromo, sb = sombraDe(M.sombra)
    const fora = { x: T0.x - cr.l, y: T0.y - cr.t, w: T0.w + cr.l + cr.r, h: T0.h + cr.t + cr.b }
    let raioTela = px(r), up = () => {}
    if (M.tipo === 'nenhuma') { if (sb !== 'none') el('div', { style: { ...ret(T0), borderRadius: px(r), boxShadow: sb } }, mundo) }
    else if (M.tipo === 'fio') el('div', { style: { ...ret(fora), borderRadius: px(r > 0 ? r + M.espessura : 0), background: M.cor, boxShadow: sb } }, mundo)
    else if (M.tipo === 'janela') {
      if (TOQUE) el('div', { style: { ...ret(fora), borderRadius: px(r + 14), background: M.cor, boxShadow: sb } }, mundo)
      else {
        const j = el('div', { style: { ...ret(fora), borderRadius: px(r > 0 ? r + 4 : 0), background: M.cor, boxShadow: sb, boxSizing: 'border-box', border: `1px solid ${rgba(legivel(M.cor), 0.12)}` } }, mundo)
        for (let i = 0; i < 3; i++) el('div', { style: { position: 'absolute', left: px(18 + i * 24), top: '14px', width: '12px', height: '12px', borderRadius: '50%', background: ['#FF5F57', '#FEBC2E', '#28C840'][i] } }, j)
        raioTela = `0 0 ${px(r)} ${px(r)}`
      }
    } else if (M.tipo === 'navegador') {
      // barra de endereço com o domínio (só o domínio: caminho de URL pode ter token)
      const tinta = legivel(M.cor), bar = el('div', { style: { ...ret(fora), borderRadius: px(r), background: M.cor, boxShadow: sb, overflow: 'hidden' } }, mundo)
      const hb = cr.t, ph = TOQUE ? 38 : 36, x0 = TOQUE ? 14 : 96
      if (!TOQUE) for (let i = 0; i < 3; i++) el('div', { style: { position: 'absolute', left: px(20 + i * 22), top: px(hb / 2 - 6), width: '12px', height: '12px', borderRadius: '50%', background: rgba(tinta, 0.22) } }, bar)
      const pill = el('div', { style: { position: 'absolute', left: px(x0), right: px(x0), top: px((hb - ph) / 2), height: px(ph), borderRadius: px(ph / 2), background: rgba(tinta, 0.08), font: `600 ${TOQUE ? 19 : 17}px ${FX}`, color: rgba(tinta, 0.7), display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', overflow: 'hidden' } }, bar)
      pill.textContent = M.endereco || TU.textos.endereco || ''
      raioTela = `0 0 ${px(r)} ${px(r)}`
    } else up = gancho('moldura', { mundo, cromo: cr })
    return { raioTela, up }
  }

  // ---------- título (abertura e fechamento usam o mesmo desenho de letra) ----------
  // Encolhe até a linha mais larga caber na área segura: caixa alta e escala grande estouram fácil no 9:16.
  function titulo(parent, linhas0, { tam0, ent0, tinta, meio }) {
    const linhas = linhas0.map((s) => (TI.caixa === 'alta' ? alto(s) : s))
    const margem = L({ '16x9': 40, padrao: 24 })
    const x = TI.alinhar === 'centro' ? CX : S.x0 + margem
    const maxW = TI.alinhar === 'centro' ? 2 * Math.min(CX - S.x0, S.x1 - CX) - 2 * margem : S.x1 - x - margem
    // A entrelinha nunca fica menor que a caixa do texto na fonte da série (Baloo, Caveat e outras têm
    // ascendente alto): senão a caixa de uma linha invade a outra e a checagem acusa, com razão.
    let tam = tam0 * TI.escala, razao = ent0 / tam0, ls = []
    for (let volta = 0; volta < 14; volta++) {
      const ent = tam * razao, top = meio - (linhas.length * ent) / 2
      ls = bloco(parent, linhas.map((t) => [{ t }]), { top, entrelinha: ent, alinhar: TI.alinhar === 'centro' ? 'centro' : 'esquerda', x, style: { font: `${TI.peso} ${tam}px ${FT}`, color: tinta, letterSpacing: `${TI.espaco}em` } })
      const larg = Math.max(...ls.map((l) => rectOf(l.line).w))
      const rg = document.createRange(); rg.selectNodeContents(ls[0].chars[0])
      const caixa = rg.getBoundingClientRect().height * 1.04
      if (larg <= maxW && (linhas.length < 2 || caixa <= ent)) break
      for (const l of ls) l.line.remove()
      if (linhas.length > 1 && caixa > ent) razao = caixa / tam
      if (larg > maxW) tam *= Math.max(0.7, (maxW / larg) * 0.98)
    }
    return ls
  }
  const entrar = (ls, t, t0) => {
    if (TI.entrada === 'palavras') riseWords(palavras(ls), t, t0, 0.07)
    else if (TI.entrada === 'letras') riseChars(letras(ls), t, t0, 0.028)
    else if (TI.entrada === 'mascara') ls.forEach((l, i) => { const e = E.inOutCubic(P(t, t0 + i * 0.12, t0 + i * 0.12 + 0.55)); l.line.style.clipPath = e >= 1 ? 'none' : `inset(-30% ${((1 - e) * 100).toFixed(2)}% -30% 0)` })
    else ls.forEach((l) => O(l.line, t >= t0 ? 1 : 0))
  }

  // ---------- selo: o rótulo da série acima do título ----------
  function selo(w, ls) {
    if (SE.tipo === 'nenhum') return () => {}
    const rs = ls.map((l) => rectOf(l.line)), r0 = rs[0]
    const x0 = Math.min(...rs.map((r) => r.x)), dy = L({ '16x9': 96, padrao: 112 })
    const texto = TU.textos.rotulo
    if (SE.tipo === 'proprio') return gancho('selo', { camada: w, texto, alinhar: TI.alinhar, titulo: { x: x0, y: r0.y, w: Math.max(...rs.map((r) => r.x + r.w)) - x0, h: rs[rs.length - 1].y + rs[rs.length - 1].h - r0.y } })
    const pos = (e) => { place(e, TI.alinhar === 'centro' ? 0 : x0, r0.y - dy); if (TI.alinhar === 'centro') centrarX(e); marcarSe(e, 'texto') }
    if (SE.tipo === 'pilula') {
      const chip = el('div', { style: { position: 'absolute', font: `700 ${L({ '16x9': 30, padrao: 34 })}px ${FX}`, color: SE.cor, background: rgba(SE.cor, 0.12), padding: '12px 26px', borderRadius: '999px', whiteSpace: 'nowrap' } }, w)
      chip.textContent = texto; pos(chip)
      return (t) => { O(chip, E.outCubic(P(t, 0.1, 0.45))); T(chip, `translateY(${(1 - E.outExpo(P(t, 0.1, 0.6))) * 30}px)`) }
    }
    if (SE.tipo === 'mono') {
      // letra de máquina, caixa alta, datilografada letra a letra
      const s = el('div', { style: { position: 'absolute', font: `500 ${L({ '16x9': 24, padrao: 28 })}px ${FM}`, letterSpacing: '0.16em', color: SE.cor, whiteSpace: 'nowrap' } }, w)
      const chs = [...alto(texto)].map((c) => el('span', { text: c }, s)); pos(s)
      return (t) => digita(chs, t, 0.05, 0.05 + 0.028 * chs.length)
    }
    // linha: um fio curto que se estende e o texto ao lado, sem caixa
    const box = el('div', { style: { position: 'absolute', display: 'flex', alignItems: 'center', gap: '18px', whiteSpace: 'nowrap' } }, w)
    const fio = el('span', { style: { display: 'block', width: px(L({ '16x9': 56, padrao: 64 })), height: '4px', background: SE.cor, transformOrigin: '0 50%' } }, box)
    const tx = el('span', { style: { font: `600 ${L({ '16x9': 28, padrao: 32 })}px ${FX}`, color: SE.cor } }, box)
    tx.textContent = texto; pos(box)
    return (t) => { T(fio, `scaleX(${E.outExpo(P(t, 0.05, 0.5))})`); O(tx, E.outCubic(P(t, 0.2, 0.5))); T(tx, `translateX(${(1 - E.outExpo(P(t, 0.2, 0.7))) * -16}px)`) }
  }

  // ---------- abertura ----------
  const janAb = { mergulho: [A - 0.45, 0.45], corte: null, deslizar: [A - 0.35, 0.5], cortina: [A - 0.4, 0.8] }[AB.saida]
  cena(0, A + 0.5, (root) => {
    const fu = fundo(el('div', { cls: 'layer' }, root), 'abertura')
    const w = el('div', { cls: 'layer' }, root)
    const ls = titulo(w, TU.textos.tituloLinhas, { tam0: L({ '16x9': 112, '9x16': 100, padrao: 92 }), ent0: L({ '16x9': 124, '9x16': 132, padrao: 120 }), tinta: TI.tinta, meio: L({ '16x9': 560, '9x16': 880, padrao: H / 2 + 40 }) })
    const su = selo(w, ls)
    if (janAb) registrarTransicao(`abertura/${AB.saida}`, ...janAb)
    return (t) => {
      fu(t); su(t); entrar(ls, t, 0.25)
      if (AB.saida === 'mergulho') {
        // mergulha na tela: zoom-through no ponto onde a tela vai aparecer
        const z = Math.exp(Math.log(9) * E.inCubic(P(t, A - 0.45, A)))
        T(w, `translate(${CX}px,${CY}px) scale(${z}) translate(${-CX}px,${-CY}px)`); O(w, 1 - P(t, A - 0.12, A))
      } else if (AB.saida === 'deslizar') T(w, `translateX(${-W * E.inOutCubic(P(t, A - 0.35, A + 0.15))}px)`)
      else O(w, t < A ? 1 : 0)
    }
  }, 'abertura')

  // ---------- tela real ----------
  cena(A - 0.45, A + D + 0.6, (root) => {
    const fc = el('div', { cls: 'layer' }, root), fu = fundo(fc, 'tela')
    // Com zoom, a tela pode passar por baixo da legenda, mas nunca aparecer do outro lado dela (a tira entre a
    // legenda e a borda do quadro): lá ela vira um pedaço de app solto. O recorte fica na borda de fora da legenda.
    const b = LG.tipo === 'faixa' ? LAY.banda : LAY.legenda
    const recorte = { baixo: `inset(0 0 ${H - b.y - b.h}px 0)`, cima: `inset(${b.y}px 0 0 0)`, direita: `inset(0 ${W - b.x - b.w}px 0 0)`, esquerda: `inset(0 0 0 ${b.x}px)` }[LAY.lado]
    const corte = el('div', { cls: 'layer', style: { clipPath: recorte } }, root)
    const mundo = el('div', { cls: 'layer' }, corte)
    const mo = moldura(mundo)
    const RC = V.realce, IN = V.indicador
    const conteudo = conteudoTela(mundo, {
      realce: RC, dedo: [rgba(IN.tinta, 0.3), rgba(IN.contorno, 0.95)], seta: [IN.tinta, IN.contorno], onda: TOQUE ? IN.contorno : RC.cor,
      selo: { fundo: RC.cor, tinta: legivel(RC.cor), sombra: '#000000', raio: RC.raio > 0 ? 999 : 0 },
    }, mo.raioTela)
    const cort = AB.saida === 'cortina' ? el('div', { cls: 'layer', style: { background: AB.cor } }, root) : null
    return (t) => {
      const tc = t - A, s = AB.saida
      // o fundo da tela só aparece quando a abertura (que desenha o mesmo fundo) já saiu da frente
      O(fc, (s === 'mergulho' ? t >= A - 0.12 : s === 'deslizar' ? t >= A + 0.15 : t >= A) ? 1 : 0)
      fu(t)
      const ent = s === 'mergulho' ? E.outExpo(P(t, A - 0.2, A + 0.5)) : 1, sai = E.inOutCubic(P(t, A + D - 0.1, A + D + 0.55))
      aplicarCamera(mundo, cam, t)
      // troca de tela: a tela "respira" (recua 3,5% e volta em 0,45 s) no tempo do whoosh
      let resp = 0
      for (const e of telas) resp = Math.max(resp, Math.sin(Math.PI * P(tc, e.t + 0.05, e.t + 0.5)))
      const esc = lerp(0.86, 1, ent) * lerp(1, 0.9, sai) * (1 - 0.035 * resp)
      mundo.style.transform += ` translate(${CX}px,${CY}px) scale(${esc}) translate(${-CX}px,${-CY}px)`
      if (s === 'deslizar') mundo.style.transform = `translateX(${W * (1 - E.inOutCubic(P(t, A - 0.35, A + 0.15)))}px) ` + mundo.style.transform
      const op = s === 'mergulho' ? P(t, A - 0.14, A + 0.06) : s === 'deslizar' ? 1 : t >= A ? 1 : 0
      O(mundo, op * (1 - P(t, A + D + 0.2, A + D + 0.55)))
      mo.up(t)
      conteudo(t, tc, sai)
      if (cort) { const e = E.inOutCubic(P(t, A - 0.4, A + 0.4)); T(cort, `translateX(${lerp(-W, W, e)}px)`); O(cort, e > 0 && e < 1 ? 1 : 0) }
    }
  }, 'tela')

  // ---------- legendas (fora da câmera) ----------
  const tLeg0 = AB.saida === 'cortina' ? A + 0.3 : A
  cena(A - 0.1, A + D + 0.35, (root) => {
    root.style.pointerEvents = 'none'
    const G = LAY.legenda
    // Legenda solta não tem fundo: com zoom, a tela passaria por baixo do texto. O lado da legenda ganha o
    // mesmo fundo da série (a mesma função do tempo, então a emenda não aparece) e a tela some na borda da
    // parte livre, como papel sobre papel.
    let fuVeu = () => {}
    if (LG.tipo === 'solta') {
      const lv = LAY.livre, veu = el('div', { cls: 'layer' }, root)
      veu.style.clipPath = { esquerda: `inset(0 ${W - lv.x}px 0 0)`, direita: `inset(0 0 0 ${lv.x + lv.w}px)`, cima: `inset(0 0 ${H - lv.y}px 0)`, baixo: `inset(${lv.y + lv.h}px 0 0 0)` }[LAY.lado]
      fuVeu = fundo(veu, 'veu')
    }
    const lay = el('div', { cls: 'layer' }, root)
    if (LG.tipo === 'faixa') el('div', { style: { ...ret(LAY.banda), background: LG.fundo } }, lay)
    const PAD = LG.tipo === 'solta' ? L({ '16x9': 10, padrao: 12 }) : L({ '16x9': 30, padrao: 36 })
    const card = el('div', { style: { ...ret(G), boxSizing: 'border-box', transformOrigin: LAY.lateral ? '50% 0%' : '50% 50%', overflow: LG.troca === 'subir' ? 'hidden' : 'visible' } }, lay)
    card.dataset.fv = 'legenda'
    if (LG.tipo === 'cartao') Object.assign(card.style, { background: LG.fundo, borderRadius: px(LG.raio), border: LG.borda === 'nenhuma' ? 'none' : `2px solid ${LG.borda}`, boxShadow: sombraDe(LG.sombra) })
    const tam = LAY.lateral ? L({ '16x9': 42, padrao: 40 }) : L({ '16x9': 48, '9x16': 50, padrao: 46 })
    const tamRot = L({ '16x9': 22, padrao: 28 })
    const itens = passos.map((pa) => {
      const box = el('div', { style: { position: 'absolute', left: px(PAD), right: px(PAD), top: px(PAD) } }, card)
      let rot = null
      if (LG.rotulo === 'ponto') {
        rot = el('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', font: `700 ${tamRot}px ${FX}`, color: LG.sinal, marginBottom: '12px' } }, box)
        rot.innerHTML = `<span style="width:${tamRot / 2}px;height:${tamRot / 2}px;border-radius:50%;background:${LG.sinal}"></span>`
        rot.appendChild(document.createTextNode(passoTxt(pa.n)))
      } else if (LG.rotulo === 'mono') {
        rot = el('div', { style: { font: `500 ${Math.round(tamRot * 0.95)}px ${FM}`, letterSpacing: '0.1em', color: LG.sinal, marginBottom: '12px', whiteSpace: 'nowrap' } }, box)
        rot.textContent = alto(passoTxt(pa.n, true))
      } else if (LG.rotulo === 'numero') {
        // o número do passo em corpo de título: a ordem vira a imagem
        rot = el('div', { style: { font: `800 ${Math.round(tam * 1.5)}px/1 ${FT}`, color: LG.sinal, marginBottom: '8px', letterSpacing: '-0.02em' } }, box)
        rot.innerHTML = `${String(pa.n).padStart(2, '0')}<span style="font-size:.42em;opacity:.55;letter-spacing:0">&thinsp;/${String(NP).padStart(2, '0')}</span>`
      }
      if (rot) marcarSe(rot, 'texto')
      const tx = el('div', { style: { font: `${LG.peso} ${tam}px/1.16 ${LG.fonte === 'texto' ? FX : FT}`, color: LG.tinta, letterSpacing: LG.caixa === 'alta' ? '0.02em' : '-0.01em' } }, box)
      const fala = falaNaLegenda(TU, tx, pa.n, LG.caixa === 'alta' ? alto : undefined)
      if (!fala) tx.textContent = LG.caixa === 'alta' ? alto(pa.legenda) : pa.legenda
      marcarSe(tx, 'legenda')
      return { box, tx, pa, fala }
    })
    // Legenda longa não vaza: a fonte encolhe (até 60%) até o passo mais longo caber. Mede uma vez, com as fontes
    // carregadas; todo passo usa o mesmo lugar, então nada pula na troca.
    let medido = false
    // Mede o que a letra ocupa de verdade: a caixa de texto de fontes de ascendente alto passa da linha CSS
    // (o número grande da Baloo sobe 20 px acima do bloco). O bloco desce o que a letra sobe.
    const caber = () => {
      const topo = G.y + PAD, chao = G.y + G.h - PAD, st = stage.getBoundingClientRect()
      const ext = (box) => { const rg = document.createRange(); rg.selectNodeContents(box); const r = rg.getBoundingClientRect(); return { y0: r.top - st.top, y1: r.bottom - st.top } }
      for (const it of itens) {
        const d = it.box.style.display
        it.box.style.display = 'block'
        const base = parseFloat(getComputedStyle(it.tx).fontSize)
        const mede = () => { it.box.style.top = px(PAD); const e = ext(it.box), desce = Math.max(0, topo - e.y0); it.box.style.top = px(PAD + desce); return e.y1 + desce }
        for (let f = base; mede() > chao && f > base * 0.6; f -= 2) it.tx.style.fontSize = px(f - 2)
        it.box.style.display = d
      }
      medido = true
    }
    return (t) => {
      if (!medido && (!document.fonts || document.fonts.status === 'loaded')) caber()
      for (const it of itens) if (it.fala) it.fala(t)
      fuVeu(t)
      const tc = t - A
      O(lay, E.outCubic(P(t, tLeg0, tLeg0 + 0.35)) * (1 - P(t, A + D, A + D + 0.3)))
      if (LG.troca === 'corte') {
        let ativo = 0
        itens.forEach((it, i) => { if (tc >= it.pa.t) ativo = i })
        itens.forEach((it, i) => { it.box.style.display = i === ativo ? 'block' : 'none' })
        return
      }
      let ativo = 0
      itens.forEach((it, i) => { if (tc >= it.pa.t - 0.25) ativo = i })
      const tv = itens[ativo] ? itens[ativo].pa.t : 0
      const f = ativo > 0 ? P(tc, tv - 0.25, tv + 0.25) : 1
      const qual = f < 0.5 && ativo > 0 ? ativo - 1 : ativo
      itens.forEach((it, i) => { it.box.style.display = i === qual ? 'block' : 'none' })
      if (LG.troca === 'virar') {
        // o cartão (ou o bloco de texto, na faixa e na solta) vira no eixo X e o texto novo nasce no verso
        const ang = f < 1 ? (f < 0.5 ? -90 * E.inCubic(f * 2) : 90 * (1 - E.outCubic((f - 0.5) * 2))) : 0
        card.style.transform = `perspective(1400px) rotateX(${ang}deg)`
      } else {
        // subir: o texto velho sai por cima, o novo entra por baixo
        const s = f < 1 ? (f < 0.5 ? E.inCubic(f * 2) : 1 - E.outCubic((f - 0.5) * 2)) : 0
        const it = itens[qual]
        T(it.box, `translateY(${(f < 0.5 ? -1 : 1) * s * 70}px)`); O(it.box, 1 - s)
      }
    }
  }, 'legendas')

  // ---------- fechamento ----------
  cena(A + D + 0.2, FIM + 0.01, (root) => {
    const t0 = A + D + 0.2
    const cm = el('div', { cls: 'layer', style: { background: FC.fundo } }, root)
    const ls = titulo(cm, TU.textos.fimLinhas, { tam0: L({ '16x9': 104, '9x16': 96, padrao: 88 }), ent0: L({ '16x9': 118, padrao: 124 }), tinta: FC.tinta, meio: L({ '16x9': 430, '9x16': 800, padrao: H * 0.42 }) })
    let logo = null
    if (MARCA.logo) {
      const rs = ls.map((l) => rectOf(l.line)), ult = rs[rs.length - 1]
      const vb = MARCA.logo.viewBox.split(/\s+/).map(Number), LH = L({ '16x9': 110, '9x16': 130, padrao: 110 }), LW = (LH * vb[2]) / vb[3]
      logo = sv('svg', { viewBox: MARCA.logo.viewBox, width: LW, height: LH }, cm)
      Object.assign(logo.style, { position: 'absolute', left: px(TI.alinhar === 'centro' ? CX - LW / 2 : Math.min(...rs.map((r) => r.x))), top: px(ult.y + ult.h + L({ '16x9': 90, padrao: 110 })) })
      const g = sv('g', { transform: MARCA.logo.transform || '' }, logo)
      for (const pt of MARCA.logo.partes) sv('path', { d: pt.d, fill: FC.logo === 'negativo' ? FC.tinta : pt.fill, ...(pt.transform ? { transform: pt.transform } : {}) }, g)
      marcarSe(logo, 'logo')
    }
    const bw = L({ '16x9': 18, padrao: 14 })
    const borda = FC.entrada === 'cortina' ? el('div', { style: { position: 'absolute', top: '0', width: px(bw), height: px(H), background: FC.tinta } }, root) : null
    if (FC.entrada !== 'corte') registrarTransicao(`fechamento/${FC.entrada}`, t0, FC.entrada === 'deslizar' ? 0.55 : 0.45)
    return (t) => {
      const e = E.inOutCubic(P(t, t0, t0 + 0.45))
      if (FC.entrada === 'iris') iris(cm, raioCobre(CX, CY) * e, CX, CY)
      else if (FC.entrada === 'cortina') {
        cm.style.clipPath = e >= 1 ? 'none' : `inset(0 ${((1 - e) * 100).toFixed(2)}% 0 0)`
        borda.style.left = px(e * W - bw / 2); O(borda, e > 0 && e < 1 ? 1 : 0)
      } else if (FC.entrada === 'deslizar') T(cm, `translateX(${W * (1 - E.outExpo(P(t, t0, t0 + 0.55)))}px)`)
      entrar(ls, t, t0 + 0.3)
      if (logo) { O(logo, E.outCubic(P(t, t0 + 0.7, t0 + 1.0))); T(logo, `scale(${0.9 + 0.1 * E.outBack(P(t, t0 + 0.7, t0 + 1.1))})`); logo.style.transformOrigin = '50% 50%' }
    }
  }, 'fechamento')
}
