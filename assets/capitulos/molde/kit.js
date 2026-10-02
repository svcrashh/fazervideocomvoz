// Kit do vídeo em capítulos: tokens, fundo, cartão do índice, moldura de capítulo, celular, cartão, pílula,
// toque, índice e números. Carrega depois do engine.js e do indice.js. Quem faz capítulo NÃO edita este arquivo:
// defeito ou falta vira pedido a quem cuida do molde.
//
// TROQUE os tokens e as fontes pelos da leitura (§3, a cara do produto). Os daqui são inventados.

const TOK = {
  fundo: '#0D0F14',                     // fundo do vídeo inteiro
  cartao: '#161A22',                    // cartão, tela do celular
  campo: '#1F2530',                     // cartão ativo, campo
  texto: '#F2F2EE',                     // texto
  apoio: 'rgba(242,242,238,.66)',       // linhas de apoio
  apagado: 'rgba(242,242,238,.38)',     // rótulo apagado
  linha: 'rgba(242,242,238,.12)',       // borda
  destaque: '#5B8CFF',                  // SÓ destaque: palavra-chave, etiqueta, botão ativo, número
  ok: '#3DDC97',                        // só para "ok" / check
}
const FONTE = { titulo: 'Barlow Condensed', texto: 'Inter', mono: 'JetBrains Mono' }
const F = {
  titulo: (px, w = 700) => `${w} ${px}px "${FONTE.titulo}"`,
  texto: (px, w = 400) => `${w} ${px}px "${FONTE.texto}"`,
  mono: (px, w = 600) => `${w} ${px}px "${FONTE.mono}"`,
}
const INCLINA = 'skewX(-7deg)'          // '' se a marca não tem itálico no título

// Onde as coisas moram em cada formato. O conteúdo do capítulo vive dentro do PALCO.
// 16:9: texto na coluna da esquerda, palco à direita. 9:16: texto em cima, palco embaixo. Recomposto, não recortado.
const LAY = L({
  '16x9': { tx: 140, txW: 750, etqY: 300, tituloTop: 352, tituloPx: 128, apoioPx: 36,
            palco: { x: 900, y: 90, w: 900, h: 900 } },
  '9x16': { tx: 90, txW: 860, etqY: 210, tituloTop: 262, tituloPx: 118, apoioPx: 40,
            palco: { x: 90, y: 740, w: 900, h: 1000 } },
})
const PALCO = { ...LAY.palco, cx: LAY.palco.x + LAY.palco.w / 2, cy: LAY.palco.y + LAY.palco.h / 2 }
const n2 = (n) => String(n).padStart(2, '0')

// Fundo fixo, igual em todo capítulo, na abertura e no fecho: o corte entre capítulos não aparece.
function fundo(root) {
  const c = camada(root, TOK.fundo)
  el('div', { cls: 'layer', style: {
    backgroundImage: `linear-gradient(${rgba(TOK.texto, 0.035)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(TOK.texto, 0.035)} 1px, transparent 1px)`,
    backgroundSize: '64px 64px', backgroundPosition: `${(W / 2) % 64}px ${(H / 2) % 64}px` } }, c)
  el('div', { cls: 'layer', style: { background: `radial-gradient(${L({ '16x9': '900px 700px', '9x16': '900px 900px' })} at ${PALCO.cx}px ${PALCO.cy}px, ${rgba(TOK.destaque, 0.13)}, transparent 70%)` } }, c)
  el('div', { cls: 'layer', style: { background: `radial-gradient(120% 90% at 50% 50%, transparent 55%, ${rgba('#000000', 0.45)})` } }, c)
  const m = 44, s = 26, cor = `2px solid ${rgba(TOK.destaque, 0.55)}`
  for (const [x, y, bx, by] of [[m, m, 1, 1], [W - m - s, m, -1, 1], [m, H - m - s, 1, -1], [W - m - s, H - m - s, -1, -1]]) {
    el('div', { cls: 'abs', style: { left: px(x), top: px(y), width: px(s), height: px(s),
      borderLeft: bx > 0 ? cor : 'none', borderRight: bx < 0 ? cor : 'none', borderTop: by > 0 ? cor : 'none', borderBottom: by < 0 ? cor : 'none' } }, c)
  }
  return c
}

// Cartão do índice ("01  Nome"): o mesmo desenho na abertura, no fecho e na passagem entre capítulos.
// `s` aumenta o cartão inteiro (no 9:16, a lista da abertura e do fecho usa ~1,4).
function cartaoIndice(parent, n, nome, { w = 560, ativo = false, s = 1 } = {}) {
  const e = el('div', { cls: 'abs', style: { width: px(w), height: px(76 * s), borderRadius: px(14 * s), boxSizing: 'border-box',
    background: ativo ? TOK.campo : TOK.cartao, border: `2px solid ${ativo ? TOK.destaque : TOK.linha}`,
    display: 'flex', alignItems: 'center', gap: px(18 * s), padding: `0 ${22 * s}px`,
    boxShadow: ativo ? `0 0 40px ${rgba(TOK.destaque, 0.35)}` : 'none' } }, parent)
  el('div', { text: n2(n), style: { font: F.mono(24 * s), color: TOK.destaque, letterSpacing: '.08em' } }, e)
  el('div', { text: nome, style: { font: F.texto(28 * s, 500), color: TOK.texto, whiteSpace: 'nowrap' } }, e)
  return e
}

// Moldura de capítulo: fundo + passagem do cartão do índice + etiqueta + título de cartaz + apoio + saída.
// cfg = { n, dur, titulo: [[{ t, k? }], …], apoio: [{ t, em }, …], tituloPx? } — nome e seção vêm do INDICE.
// Título largo demais: quebre em duas linhas (mesmo texto); só em último caso, tituloPx: { '16x9': 118 }.
// Devolve { palco, update(t) }. O capítulo desenha dentro de `palco` (PALCO.w × PALCO.h, coordenadas locais) a
// partir de ENTRA_PALCO; nada antes, nada fora dele.
const ENTRA_TEXTO = 0.75, ENTRA_PALCO = 0.9, SAIDA = 0.5, FALA_EM = 1.4   // a fala entra com o título já lido
function capitulo(root, cfg) {
  const item = INDICE.find((i) => i.n === cfg.n)
  if (!item) console.error(`CAPÍTULO ${cfg.n} FORA DO ÍNDICE: ponha { n: ${cfg.n}, nome, secao, pasta } no molde/indice.js`)
  const { nome = '?', secao = '?' } = item || {}
  fundo(root)
  const conteudo = el('div', { cls: 'layer' }, root)
  const tx = el('div', { cls: 'layer' }, conteudo)
  const barra = el('div', { cls: 'abs', style: { left: px(LAY.tx), top: px(LAY.etqY - 34), width: '120px', height: '5px', background: TOK.destaque, transformOrigin: '0 50%' } }, tx)
  const etq = textLine(tx, [{ t: `${n2(cfg.n)} · ${secao.toUpperCase()}` }], { font: F.mono(L({ '16x9': 26, '9x16': 28 })), color: TOK.destaque, letterSpacing: '.32em' })
  place(etq.line, LAY.tx, LAY.etqY)
  const tpx = (cfg.tituloPx && L(cfg.tituloPx)) || LAY.tituloPx
  const linhas = cfg.titulo.map((parts, i) => {
    const l = textLine(tx, parts.map((p) => ({ t: p.t.toUpperCase(), style: p.k ? { color: TOK.destaque } : {} })),
      { font: F.titulo(tpx), color: TOK.texto, transform: INCLINA })
    place(l.line, LAY.tx, LAY.tituloTop + i * tpx)
    return l
  })
  const largura = Math.max(...linhas.map((l) => rectOf(l.line).w))
  if (largura > LAY.txW) console.error(`TÍTULO LARGO DEMAIS (${Math.round(largura)} px > ${LAY.txW}) no capítulo ${cfg.n}: encurte ou quebre a linha`)
  const apoioTop = LAY.tituloTop + linhas.length * tpx + L({ '16x9': 56, '9x16': 50 })
  const apoio = (cfg.apoio || []).map((a, i) => {
    const l = textLine(tx, [{ t: a.t }], { font: F.texto(LAY.apoioPx), color: TOK.apoio })
    place(l.line, LAY.tx, apoioTop + i * LAY.apoioPx * 1.45)
    if (rectOf(l.line).w > LAY.txW) console.error(`APOIO LARGO DEMAIS no capítulo ${cfg.n}: "${a.t}"`)
    return { ...l, em: a.em }
  })
  const palco = el('div', { cls: 'abs', style: { left: px(PALCO.x), top: px(PALCO.y), width: px(PALCO.w), height: px(PALCO.h) } }, conteudo)
  const passa = el('div', { cls: 'layer' }, root)
  const card = cartaoIndice(passa, cfg.n, nome, { ativo: true })
  const cw = 560
  return {
    palco,
    update(t) {
      // o cartão do índice entra pela direita, para no meio e encolhe rumo à etiqueta
      const a = E.outExpo(P(t, 0, 0.4)), b = E.inOutCubic(P(t, 0.45, 0.85))
      const x = t < 0.45 ? lerp(W + 40, (W - cw) / 2, a) : lerp((W - cw) / 2, LAY.tx, b)
      const y = t < 0.45 ? CY - 38 : lerp(CY - 38, LAY.etqY - 20, b)
      card.style.transformOrigin = '0 0'
      T(card, `translate(${x}px,${y}px) scale(${lerp(1, 0.55, b)})`)
      O(card, 1 - P(t, 0.7, 0.9))
      T(barra, `scaleX(${E.outExpo(P(t, ENTRA_TEXTO - 0.1, ENTRA_TEXTO + 0.4))})`)
      riseChars(etq.chars, t, ENTRA_TEXTO, 0.012, 0.4)
      linhas.forEach((l, i) => riseWords(l.words, t, ENTRA_TEXTO + 0.08 + i * 0.12, 0.07, 0.6))
      for (const a2 of apoio) riseWords(a2.words, t, a2.em, 0.03, 0.5)
      // saída: tudo sobe e some nos últimos SAIDA s; o fundo fica
      const s = E.inCubic(P(t, cfg.dur - SAIDA, cfg.dur - 0.05))
      T(conteudo, `translateY(${-30 * s}px)`); O(conteudo, 1 - s)
    },
  }
}

// Celular: moldura + tela lógica 390×844 (desenhe na `tela` em px de celular). h = altura no quadro.
// Para ocupar o palco: h = PALCO.h * 0.94. Texto da tela ≥ 24 px de celular (fica ≥ 22 px no quadro).
// No 9:16 o conteúdo do palco encosta no topo dele (até 60 px) e cresce para baixo: nunca um celular pequeno
// centralizado no meio do palco, com um vão entre ele e o título.
function celular(parent, { x, y, h = 860 }) {
  const k = h / 900, w = 430 * k
  const e = el('div', { cls: 'abs', style: { left: px(x), top: px(y), width: px(w), height: px(h), transformOrigin: '50% 50%' } }, parent)
  el('div', { cls: 'layer', style: { width: px(w), height: px(h), borderRadius: px(64 * k), background: '#05070A',
    border: `${Math.max(2, 3 * k)}px solid ${rgba(TOK.texto, 0.16)}`, boxSizing: 'border-box', boxShadow: `0 40px 120px ${rgba('#000000', 0.55)}` } }, e)
  const tela = el('div', { cls: 'abs', style: { left: px(20 * k), top: px(28 * k), width: '390px', height: '844px', overflow: 'hidden',
    borderRadius: '44px', background: TOK.cartao, transform: `scale(${k})`, transformOrigin: '0 0' } }, e)
  el('div', { cls: 'abs', style: { left: px((w - 120 * k) / 2), top: px(40 * k), width: px(120 * k), height: px(34 * k), borderRadius: px(20 * k), background: '#05070A' } }, e)
  return { el: e, tela, k, w, h }
}

function cartao(parent, { x, y, w, h, destaque = false, raio = 20 }) {
  return el('div', { cls: 'abs', style: { left: px(x), top: px(y), width: px(w), height: px(h), boxSizing: 'border-box', borderRadius: px(raio),
    background: destaque ? TOK.campo : TOK.cartao, border: `2px solid ${destaque ? TOK.destaque : TOK.linha}`,
    boxShadow: destaque ? `0 0 50px ${rgba(TOK.destaque, 0.25)}` : `0 24px 60px ${rgba('#000000', 0.35)}` } }, parent)
}

function pilula(parent, texto, { ativo = false, px: tam = 20 } = {}) {
  return el('div', { text: texto.toUpperCase(), style: { display: 'inline-block', font: F.mono(tam), letterSpacing: '.12em', padding: '10px 16px',
    borderRadius: '999px', color: ativo ? TOK.fundo : TOK.apoio, background: ativo ? TOK.destaque : rgba(TOK.texto, 0.06),
    border: `1.5px solid ${ativo ? TOK.destaque : TOK.linha}`, whiteSpace: 'nowrap' } }, parent)
}

// Toque: anel que cresce e some em (x, y) a partir de t0. Chame no update: tq(t, t0, x, y).
function toque(parent) {
  const r = el('div', { cls: 'abs', style: { width: '80px', height: '80px', marginLeft: '-40px', marginTop: '-40px', borderRadius: '50%',
    border: `4px solid ${TOK.destaque}`, opacity: 0 } }, parent)
  return (t, t0, x, y) => { const p = P(t, t0, t0 + 0.55); T(r, `translate(${x}px,${y}px) scale(${0.3 + 1.1 * E.outCubic(p)})`); O(r, p > 0 && p < 1 ? 1 - p : 0) }
}

// Entrada padrão de um bloco: sobe d px e aparece.
function sobe(e, t, t0, d = 40) { const p = E.outExpo(P(t, t0, t0 + 0.6)); T(e, `translateY(${(1 - p) * d}px)`); O(e, p) }

// Foto ou logo de midia/ (na raiz do projeto). Só arquivos que existem: imagem que falta trava o render.
function foto(parent, nome, style) { return imagem(parent, `../../midia/${nome}`, { objectFit: 'cover', ...style }) }

// Logo: troque pelo SVG da marca (scripts/logo.mjs gera as partes animáveis). Aqui, o nome em texto.
function logo(parent, { px: tam = 120 } = {}) {
  return textLine(parent, [{ t: MARCA_NOME.toUpperCase() }], { font: F.titulo(tam), color: TOK.texto, transform: INCLINA })
}

// A lista do índice (abertura e fecho) dentro da caixa { x, y, w, h }: uma coluna, ou duas quando não cabe.
// Devolve os cartões, na ordem do INDICE.
function listaIndice(parent, { x, y, w, h, s = L({ '16x9': 1, '9x16': 1.4 }) }) {
  // uma coluna enquanto o cartão não precisa encolher abaixo de 80% do tamanho padrão; senão, duas
  const cols = h / (INDICE.length * 92) >= Math.min(s, 0.8) ? 1 : 2, porCol = Math.ceil(INDICE.length / cols)
  const passo = Math.min(92 * s, h / porCol), largura = (w - (cols - 1) * 40) / cols
  const y0 = y + (h - porCol * passo) / 2
  return INDICE.map((it, i) => {
    const col = Math.floor(i / porCol), lin = i % porCol
    const c = cartaoIndice(parent, it.n, it.nome, { w: largura, s: Math.min(s, passo / 92) })
    place(c, x + col * (largura + 40), y0 + lin * passo)
    return c
  })
}
