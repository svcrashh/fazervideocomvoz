// Grava a jornada real de um tutorial num app web (Playwright), ou só confere que ela ainda roda (--check).
// O que aparece no vídeo é a tela de verdade: nada recriado. Indicador de toque, cursor, realce, zoom,
// legendas e sons são da composição (compor.mjs), a partir do log de eventos que este arquivo grava.
//
//   node <pasta-do-video>/video.mjs                     grava todas as versões
//   node <pasta-do-video>/video.mjs --versao celular    grava só uma
//   node <pasta-do-video>/video.mjs --check             confere sem gravar (rápido, mesma checagem de toque)
//
// Regra sem exceção: nenhum toque sem checagem. Antes de cada toque/aponta, e de novo no instante do
// toque, document.elementFromPoint no ponto. Se não é o alvo: aviso → espera sumir; barra fixa ou botão
// flutuante → rola até liberar; qualquer outra coisa → a gravação FALHA com "X cobre Y".
//
// Saída: <pasta>/saida/<versao>/quadros/*.jpg, quadros.json ([[arquivo, t], …]), eventos.json, folha-toques.png
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { aparelho } from './aparelhos.mjs'
import { criarDados } from './dados.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const PAGINA = fs.readFileSync(path.join(AQUI, 'pagina.js'), 'utf8')
const argv = process.argv.slice(2)
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d }
const r1 = (x) => +x.toFixed(1), r3 = (x) => +x.toFixed(3)
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)  // igual à composição

export function carregarPlaywright(pasta) {
  // mesmo achador da skill (ou da cópia do motor num repositório): PLAYWRIGHT_PATH, node_modules, npm -g, npx
  for (const cand of [path.join(AQUI, '..', 'playwright.cjs'), path.join(AQUI, 'playwright.cjs'), path.join(AQUI, '..', 'ferramentas', 'playwright.cjs')]) {
    if (fs.existsSync(cand)) return require(cand).carregar(pasta).pw
  }
  return require('playwright')
}

/** Roda um vídeo: grava (padrão) ou confere (--check). Devolve [{ versao, ok, erro }]. */
export async function rodar(video, { check = argv.includes('--check'), versao = opt('versao'), captura = opt('captura', 'screencast') } = {}) {
  const versoes = versao ? [versao] : video.versoes || ['celular']
  const res = []
  for (const v of versoes) {
    const r = await rodarVersao(video, v, { check, captura })
    res.push(r)
  }
  if (res.some((r) => !r.ok)) process.exitCode = 1
  return res
}

export function principal(metaUrl) {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(metaUrl)
}

async function abrir(pw, ap, idioma, captura) {
  const args = [`--lang=${idioma}`, '--hide-scrollbars']
  // Headless novo (canal "chromium") + DSF na linha de comando: é o que faz o screencast sair no pixel
  // real a ~60 qps. Sem o canal, cai para o headless antigo com captureScreenshot (mais lento).
  if (captura === 'screencast') {
    try { return { browser: await pw.chromium.launch({ channel: 'chromium', args: [...args, `--force-device-scale-factor=${ap.dsf}`] }), captura } } catch (e) {
      console.log(`  (canal chromium indisponível: ${e.message.split('\n')[0]} — usando captureScreenshot)`)
    }
  }
  return { browser: await pw.chromium.launch({ args }), captura: 'screenshot' }
}

/** Título e texto final como a tela vai mostrar (a voz da abertura e do fechamento diz o mesmo). */
function textosDaTela(video) {
  const arq = path.join(path.resolve(video.pasta, video.serie || '../serie'), 'serie.json')
  const serie = fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq, 'utf8')) : {}
  return { titulo: video.titulo || video.id, fimLinhas: video.fimLinhas || serie.fimLinhas || ['Pronto!'] }
}

async function rodarVersao(video, v, { check, captura: capturaPedida }) {
  // Com voz, a locução manda no tempo: cada passo fica na tela pela fala dele. Confere antes de abrir o navegador.
  // O locucao.mjs só é carregado quando o vídeo tem voz: sem voz, o gravador não depende dele.
  let voz = null, LV = null
  if (video.voz) {
    try { LV = await import('./locucao.mjs'); voz = LV.lerLocucao(video, v); LV.conferirTextos(voz, textosDaTela(video)) } catch (e) {
      console.log(`✗ ${video.id} (${v}) voz: ${e.message}`)
      process.exitCode = 1
      return { versao: v, ok: false, erro: e.message.split('\n')[0] }
    }
  }
  const ap = aparelho(v, video.aparelhos)
  const idioma = video.idioma || 'pt-BR'
  const saida = path.join(video.pasta, 'saida', v)
  const pw = carregarPlaywright(video.pasta)
  const { browser, captura } = await abrir(pw, ap, idioma, capturaPedida)
  const ctx = await browser.newContext({
    viewport: ap.viewport, deviceScaleFactor: ap.dsf, isMobile: !!ap.toque, hasTouch: !!ap.toque,
    locale: idioma, timezoneId: video.fuso || 'America/Sao_Paulo', colorScheme: video.tema || 'light', reducedMotion: 'no-preference',
  })
  const cfgPagina = { privacidade: { ...(video.privacidade || {}), seletores: [...((video.privacidade && video.privacidade.seletores) || []), ...(video.borrar || [])] },
    esconder: Array.isArray(video.esconder) ? { seletores: video.esconder } : video.esconder || {}, avisos: video.avisos || [] }
  await ctx.addInitScript({ content: `${PAGINA}\n;fvPagina(${JSON.stringify(cfgPagina)});` })
  const p = await ctx.newPage()
  const errosPagina = []
  p.on('pageerror', (e) => errosPagina.push(e.message))
  p.setDefaultTimeout(check ? 15000 : 30000)
  const dados = criarDados({ fuso: video.fuso, idioma, ...(video.dados || {}) })

  const eventos = []
  let t0 = null
  const agora = () => (t0 == null ? 0 : Date.now() / 1000 - t0)
  const ev = (e) => { if (t0 != null) eventos.push({ t: r3(agora()), ...e }) }
  await p.exposeBinding('__fvTela', (_s, url) => ev({ tipo: 'tela', url }))

  const W = ap.viewport.width, H = ap.viewport.height
  let pos = [W / 2, ap.toque ? H * 0.72 : H / 2]
  const nativos = new Map()
  const leituraMin = check ? 0 : video.leituraMin || 3.0

  // ---------- entrar e preparar (fora da gravação) ----------
  if (video.entrar) await video.entrar({ p, v, ap, dados, check })
  else await p.goto(video.url, { waitUntil: 'networkidle' })
  if (video.preparar) await video.preparar({ p, v, ap, dados, check })
  if (video.inicio) await p.goto(new URL(video.inicio, p.url()).href, { waitUntil: 'networkidle' })
  await p.waitForLoadState('networkidle').catch(() => {})
  await p.waitForTimeout(check ? 200 : 900)

  // ---------- captura ----------
  const quadros = []
  let capturando = false, laco = null, cdp = null
  let offset = Infinity  // relógio do navegador → relógio daqui (menor latência observada)
  const brutos = []
  if (!check) {
    fs.rmSync(saida, { recursive: true, force: true })
    fs.mkdirSync(path.join(saida, 'quadros'), { recursive: true })
    cdp = await ctx.newCDPSession(p)
    t0 = Date.now() / 1000
    capturando = true
    let n = 0
    if (captura === 'screencast') {
      cdp.on('Page.screencastFrame', (f) => {
        const rec = Date.now() / 1000
        cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {})
        if (!capturando) return
        const nome = String(++n).padStart(5, '0') + '.jpg'
        fs.writeFileSync(path.join(saida, 'quadros', nome), Buffer.from(f.data, 'base64'))
        const ts = f.metadata && f.metadata.timestamp ? f.metadata.timestamp : rec
        offset = Math.min(offset, rec - ts)
        brutos.push([nome, ts, rec])
      })
      await cdp.send('Page.startScreencast', { format: 'jpeg', quality: video.qualidade || 88, maxWidth: Math.round(W * ap.dsf), maxHeight: Math.round(H * ap.dsf), everyNthFrame: 1 })
      // o screencast só manda quadro quando algo pinta: força o primeiro
      await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    } else {
      laco = (async () => {
        while (capturando) {
          const a = Date.now() / 1000
          let r
          try {
            // o clip é em coordenadas do DOCUMENTO: acompanha a rolagem, senão a página rolada sai em branco
            const { cssVisualViewport: vp } = await cdp.send('Page.getLayoutMetrics')
            r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: video.qualidade || 88, optimizeForSpeed: true, clip: { x: vp.pageX, y: vp.pageY, width: W, height: H, scale: ap.dsf } })
          } catch { continue }
          const b = Date.now() / 1000
          const nome = String(++n).padStart(5, '0') + '.jpg'
          fs.writeFileSync(path.join(saida, 'quadros', nome), Buffer.from(r.data, 'base64'))
          quadros.push([nome, r3((a + b) / 2 - t0)])
        }
      })()
    }
  } else t0 = Date.now() / 1000

  // ---------- helpers ----------
  const loc = (alvo) => (typeof alvo === 'string' ? p.locator(alvo) : alvo)
  const caixa = async (l) => {
    const r = await l.evaluate((e) => window.__fv.ret(e))
    return r
  }
  const parado = async (l) => {
    let r = await caixa(l)
    for (let i = 0; i < 30; i++) {
      await p.waitForTimeout(check ? 40 : 80)
      const r2 = await caixa(l)
      const ok = Math.abs(r2.x - r.x) < 0.5 && Math.abs(r2.y - r.y) < 0.5 && Math.abs(r2.w - r.w) < 0.5
      r = r2
      if (ok) break
    }
    return r
  }
  const pontoDe = (r, ponto) => [r1(r.x + (ponto ? ponto.x : r.w / 2)), r1(r.y + (ponto ? ponto.y : r.h / 2))]
  const visivel = async (l) => {
    await l.waitFor({ state: 'visible' })
    let r = await caixa(l)
    // fora da janela, ou cortado por um contêiner com rolagem própria (corpo de diálogo, lista): rola até ele
    const cortado = await l.evaluate((e) => {
      const re = e.getBoundingClientRect()
      for (let a = e.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
        if (!/(auto|scroll|hidden)/.test(getComputedStyle(a).overflowY)) continue
        const ra = a.getBoundingClientRect()
        if (re.top < ra.top - 1 || re.bottom > ra.bottom + 1) return true
      }
      return false
    })
    if (cortado || r.y < 0 || r.y + r.h > H || r.x < 0 || r.x + r.w > W) {
      const r0 = r
      await l.evaluate((e, suave) => e.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'center', inline: 'nearest' }), !check)
      const t1 = agora()
      r = await parado(l)
      // pelo alvo, não pelo scrollY: a rolagem pode ter sido dentro do diálogo
      if (Math.abs(r.y - r0.y) > 1) ev({ tipo: 'rola', t: r3(t1 - 0.05), t1: r3(agora()), dy: r1(r0.y - r.y), auto: true })
    }
    return r
  }

  const erroCobre = (c, extra) => {
    const e = new Error(`${c.quem} cobre ${c.alvo}${extra ? ` (${extra})` : ''}`)
    e.cobre = c
    return e
  }
  /** "Tem algo na frente?" — resolve (espera o aviso, rola a barra) ou falha. Devolve { r, pt, historico }. */
  const livre = async (l, ponto) => {
    // o waitForFunction do aviso acha o alvo por um atributo temporário (não dá para passar o elemento)
    await l.evaluate((e) => e.setAttribute('data-fv-alvo', ''))
    try {
      const historico = []
      let rolagens = 0
      for (let volta = 0; volta < 12; volta++) {
        const r = await parado(l)
        const pt = pontoDe(r, ponto)
        const c = await l.evaluate((e, [x, y]) => window.__fv.checa(e, x, y), pt)
        if (c.ok) return { r, pt, historico }
        if (c.tipo === 'aviso') {
          const ta = agora(), lim = video.limiteAviso || 10
          const ok = await p.waitForFunction(([x, y]) => { const e = document.querySelector('[data-fv-alvo]'); return !e || window.__fv.checa(e, x, y).tipo !== 'aviso' }, pt, { timeout: lim * 1000, polling: 100 }).then(() => true, () => false)
          historico.push({ quem: c.quem, tipo: 'aviso', acao: `esperou ${(agora() - ta).toFixed(1).replace('.', ',')} s` })
          ev({ tipo: 'espera', t: r3(ta), t1: r3(agora()), motivo: `aviso ${c.quem} sobre ${c.alvo}` })
          if (!ok) throw erroCobre(c, `o aviso não sumiu em ${lim} s`)
          continue
        }
        if (c.tipo === 'fixo' && rolagens < 3) {
          rolagens++
          const q = c.retQuem
          // barra na metade de baixo: o alvo sobe acima dela; na metade de cima: desce abaixo dela
          const dy = q.y + q.h / 2 > H / 2 ? r.y + r.h - (q.y - 14) : r.y - (q.y + q.h + 14)
          const ta = agora()
          const andou = await l.evaluate((e, [d, s]) => window.__fv.rolaAlvo(e, d, s), [dy, !check])
          historico.push({ quem: c.quem, tipo: 'fixo', acao: `rolou ${Math.round(andou)} px` })
          ev({ tipo: 'rola', t: r3(ta), t1: r3(agora()), dy: r1(andou), motivo: `liberar ${c.alvo} de ${c.quem}` })
          if (Math.abs(andou) < 1) throw erroCobre(c, 'rolar não libera: a página não anda mais')
          continue
        }
        throw erroCobre(c, c.tipo === 'fixo' ? 'rolei 3 vezes e continua coberto' : c.motivo)
      }
      throw new Error(`o alvo ${await l.evaluate((e) => window.__fv.descrever(e))} não ficou livre depois de 12 tentativas`)
    } finally {
      await l.evaluate((e) => e.removeAttribute('data-fv-alvo')).catch(() => {})
    }
  }

  const mover = async (pt, rapido) => {
    const d = Math.hypot(pt[0] - pos[0], pt[1] - pos[1])
    const ms = check ? 0 : Math.round(Math.min(ap.toque ? 750 : 650, Math.max(rapido ? 180 : 320, 260 + d * (ap.toque ? 0.9 : 0.45))))
    const de = pos
    const ta = agora()
    if (!check) {
      if (!ap.toque) {
        // o mouse de verdade percorre a mesma curva que o cursor desenhado (hover aparece no lugar certo)
        const passos = Math.max(4, Math.round(ms / 16))
        for (let i = 1; i <= passos; i++) {
          const e = ease(i / passos)
          await p.mouse.move(de[0] + (pt[0] - de[0]) * e, de[1] + (pt[1] - de[1]) * e)
          await p.waitForTimeout(ms / passos)
        }
      } else await p.waitForTimeout(ms)
    }
    pos = pt
    if (ms) ev({ tipo: 'move', t: r3(ta), t1: r3(agora()), de: de.map(r1), para: pt })
  }

  const descr = (l) => l.evaluate((e) => window.__fv.descrever(e))
  const ultimoPasso = () => [...eventos].reverse().find((e) => e.tipo === 'passo')

  const g = {
    p, v, ap, dados, check, celular: !!ap.toque, toque: !!ap.toque,
    /** Nova legenda. A anterior fica parada pelo menos `leituraMin` (3 s). Com voz, a legenda é a fala do passo,
     *  o passo fica na tela pela fala inteira e o controle volta 0,3 s antes do fim da frase: primeiro diz, depois faz. */
    async passo(legenda) {
      const ult = ultimoPasso()
      if (ult) { const falta = ult.t + (voz && !check ? LV.esperaDoPasso(voz.passos.get(ult.n), leituraMin) : leituraMin) - agora(); if (falta > 0) await p.waitForTimeout(falta * 1000) }
      const n = eventos.filter((e) => e.tipo === 'passo').length + 1
      const fala = voz && voz.passos.get(n)
      if (fala && n === 1 && !check) { const falta = LV.RESPIRO - agora(); if (falta > 0) await p.waitForTimeout(falta * 1000) }
      if (fala && fala.texto !== legenda) console.log(`  aviso: passo ${n}: o roteiro diz "${legenda}" e a fala diz "${fala.texto}". A legenda é a fala.`)
      ev({ tipo: 'passo', n, legenda: fala ? fala.texto : legenda, ...(fala ? { fala: fala.id } : {}), ...(fala && fala.texto !== legenda ? { roteiro: legenda } : {}) })
      if (check) console.log(`  · ${fala ? fala.texto : legenda}`)
      else if (fala) { const falta = eventos[eventos.length - 1].t + LV.devolveEm(fala) - agora(); if (falta > 0) await p.waitForTimeout(falta * 1000) }
    },
    async pausa(ms) { if (!check) await p.waitForTimeout(ms) },
    /** Espera algo: um locator aparecer (padrão) ou sumir ({ estado: 'hidden' }), ou ms. */
    async espera(alvo, { estado = 'visible', motivo = '', timeout } = {}) {
      const ta = agora()
      if (typeof alvo === 'number') { if (!check) await p.waitForTimeout(alvo) } else await loc(alvo).waitFor({ state: estado, timeout })
      ev({ tipo: 'espera', t: r3(ta), t1: r3(agora()), motivo: motivo || (typeof alvo === 'number' ? 'pausa' : estado) })
    },
    /** Leva o indicador até o alvo e realça, sem tocar. */
    async aponta(alvo, { ponto = null, ms = 1100, realce = true } = {}) {
      const l = loc(alvo)
      await visivel(l)
      const { r, pt, historico } = await livre(l, ponto)
      await mover(pt)
      const { r: r2, pt: pt2 } = await livre(l, ponto)
      ev({ tipo: 'aponta', alvo: await descr(l), ret: r2, ponto: pt2, realce, dur: ms / 1000, checagem: historico })
      if (!check) await p.waitForTimeout(ms)
      return r2
    },
    /** Toca (celular) ou clica (computador) EXATAMENTE no ponto conferido. */
    async toque(alvo, { ponto = null, depois = 700, realce = true, rapido = false, nativo = null } = {}) {
      const l = loc(alvo)
      await visivel(l)
      const c1 = await livre(l, ponto)
      await mover(c1.pt, rapido)
      if (realce && !check && !rapido) await p.waitForTimeout(260)
      // de novo no instante do toque: um aviso pode ter aparecido durante o movimento
      const { r, pt, historico } = await livre(l, ponto)
      if (pt[0] !== pos[0] || pt[1] !== pos[1]) await mover(pt, true)
      const nat = await l.evaluate((e) => window.__fv.nativo(e))
      ev({ tipo: 'toque', alvo: await descr(l), ret: r, ponto: pt, realce, checagem: [...c1.historico, ...historico], ...(nat ? { nativo: nat } : {}) })
      if (!nativo) {
        if (ap.toque) await p.touchscreen.tap(pt[0], pt[1])
        else await p.mouse.click(pt[0], pt[1])
      }
      await p.waitForTimeout(check ? 120 : depois)
      return r
    },
    /** Digita num campo como uma pessoa. privado: o log não guarda o texto (senha, dado pessoal). */
    async digita(alvo, texto, { privado = null, atraso = 55, depois = 450, limpar = false } = {}) {
      const l = loc(alvo)
      await g.toque(l, { realce: false, depois: 200 })
      if (limpar) await l.fill('')
      const ehSenha = await l.evaluate((e) => e.type === 'password' || e.hasAttribute('data-privado') || e.hasAttribute('data-fv-borrar'))
      const ta = agora()
      await p.keyboard.type(texto, { delay: check ? 0 : atraso })
      const r = await caixa(l)
      ev({ tipo: 'digita', t: r3(ta), t1: r3(agora()), alvo: await descr(l), ret: r, texto: privado || ehSenha ? '•••' : texto, teclas: texto.length, privado: !!(privado || ehSenha) })
      await p.waitForTimeout(check ? 60 : depois)
    },
    /** Escolhe uma opção de um <select> nativo. A lista nativa não aparece na captura (o Chromium sem janela
     *  não desenha o popup): o campo passa pelas opções, uma a uma, com realce e legenda da escolha. */
    async escolhe(alvo, opcao, { passoAPasso = true, intervalo = 380 } = {}) {
      const l = loc(alvo)
      const tag = await l.evaluate((e) => e.tagName.toLowerCase())
      if (tag !== 'select') throw new Error(`escolhe() é para <select> nativo; ${await descr(l)} é um componente do app: use g.toque() na opção da lista dele`)
      nativos.set('select', (nativos.get('select') || new Set()).add(await descr(l)))
      await g.toque(l, { depois: 150, nativo: 'select' })
      const { opcoes, atual, alvoIdx } = await l.evaluate((e, o) => {
        const ops = [...e.options].map((x) => x.label || x.text)
        const idx = ops.findIndex((t) => t.trim() === String(o).trim()) >= 0 ? ops.findIndex((t) => t.trim() === String(o).trim()) : [...e.options].findIndex((x) => x.value === o)
        return { opcoes: ops, atual: e.selectedIndex, alvoIdx: idx }
      }, opcao)
      if (alvoIdx < 0) throw new Error(`opção "${opcao}" não existe em ${await descr(l)}. Opções: ${opcoes.join(' · ')}`)
      const ta = agora()
      await l.focus()
      const passo = alvoIdx > atual ? 1 : -1
      const idxs = passoAPasso && !check ? Array.from({ length: Math.abs(alvoIdx - atual) }, (_, k) => atual + passo * (k + 1)) : [alvoIdx]
      for (const i of idxs) {
        await l.evaluate((e, i) => { e.selectedIndex = i; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })) }, i)
        if (!check) await p.waitForTimeout(intervalo)
      }
      await l.evaluate((e) => e.blur())
      ev({ tipo: 'escolhe', t: r3(ta), t1: r3(agora()), alvo: await descr(l), ret: await caixa(l), opcoes, escolhida: opcoes[alvoIdx] })
      if (!check) await p.waitForTimeout(500)
    },
    /** Campo de data/hora nativo: digita no próprio campo (o seletor de calendário não aparece na captura).
     *  Datas passam por dados.confere(): fim de semana e feriado são erro (a não ser { qualquerDia: true }). */
    async data(alvo, valor, { qualquerDia = false } = {}) {
      const l = loc(alvo)
      const tipo = await l.evaluate((e) => e.type)
      nativos.set(tipo, (nativos.get(tipo) || new Set()).add(await descr(l)))
      let iso = valor
      if (tipo === 'date') {
        iso = typeof valor === 'string' ? valor : dados.iso(valor)
        if (!qualquerDia) dados.confere(iso)
      }
      await g.toque(l, { depois: 150, nativo: tipo })
      await l.focus()
      const ta = agora()
      // pt-BR: dd mm aaaa; en-US: mm dd aaaa. A ordem vem do próprio campo, então digitamos pelo locale.
      const [y, m, d] = String(iso).split('-')
      const teclas = tipo === 'date' ? (/^en/.test(idioma) ? m + d + y : d + m + y) : tipo === 'time' ? String(valor).replace(':', '') : null
      // Digitando dígito a dígito, o campo passa por datas intermediárias válidas (dia 2, depois 29…) e
      // dispara input/change em cada uma. App que reage a cada troca (campo de várias datas, que vira um
      // chip por change) registra datas que ninguém escolheu. Então os eventos do campo ficam retidos
      // enquanto digita, e sai um só no fim, com o valor final.
      await l.evaluate((e) => {
        const reter = (x) => { if (x.target === e) x.stopImmediatePropagation() }
        e.__fvReter = reter
        window.addEventListener('input', reter, true); window.addEventListener('change', reter, true)
      })
      if (teclas) await p.keyboard.type(teclas, { delay: check ? 0 : 110 })
      const ok = await l.inputValue() === (tipo === 'date' ? iso : String(valor))
      await l.evaluate((e, disparar) => {
        window.removeEventListener('input', e.__fvReter, true); window.removeEventListener('change', e.__fvReter, true)
        if (disparar) { e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })) }
      }, ok)
      if (!ok) await l.fill(tipo === 'date' ? iso : String(valor))
      await l.evaluate((e) => e.blur())
      ev({ tipo: 'digita', t: r3(ta), t1: r3(agora()), alvo: await descr(l), ret: await caixa(l), texto: tipo === 'date' ? dados.br(iso) : String(valor), teclas: (teclas || '').length, nativo: tipo })
      if (!check) await p.waitForTimeout(400)
      return iso
    },
    /** Anexo: toca no botão visível do app e entrega os arquivos ao seletor (que não aparece na captura). */
    async arquivo(botao, arquivos, { depois = 700 } = {}) {
      const l = loc(botao)
      // O botão é medido antes do toque: no app de verdade a tela costuma avançar assim que recebe o arquivo, e o
      // botão some (medir depois esperaria até estourar o prazo).
      const alvo = await descr(l), ret = await caixa(l)
      nativos.set('file', (nativos.get('file') || new Set()).add(alvo))
      const esperando = p.waitForEvent('filechooser')
      await g.toque(l, { depois: 0 })
      const fc = await esperando
      await fc.setFiles(arquivos)
      ev({ tipo: 'escolhe', t: r3(agora()), t1: r3(agora() + 0.8), alvo, ret, opcoes: [], escolhida: [].concat(arquivos).map((a) => path.basename(a)).join(', '), nativo: 'file' })
      await p.waitForTimeout(check ? 100 : depois)
    },
    /** Rola até o alvo (bloco: 'center' | 'start' | 'end') ou por dy px. */
    async rola(alvo, { bloco = 'center', dy = null } = {}) {
      const y0 = await p.evaluate(() => scrollY)
      const ta = agora()
      if (typeof alvo === 'number' || dy != null) await p.evaluate(([d, s]) => scrollBy({ top: d, behavior: s ? 'smooth' : 'auto' }), [dy != null ? dy : alvo, !check])
      else await loc(alvo).evaluate((e, [b, s]) => e.scrollIntoView({ behavior: s ? 'smooth' : 'auto', block: b }), [bloco, !check])
      let ant = null
      for (let i = 0; i < 40; i++) { await p.waitForTimeout(check ? 30 : 60); const y = await p.evaluate(() => scrollY); if (ant !== null && Math.abs(y - ant) < 0.5) break; ant = y }
      ev({ tipo: 'rola', t: r3(ta), t1: r3(agora()), dy: r1((await p.evaluate(() => scrollY)) - y0) })
    },
    /** Marca um momento de sucesso (som de sucesso e um pulso de câmera na composição). */
    async sucesso(alvo, { ms = 900 } = {}) {
      const r = alvo ? await caixa(loc(alvo)) : null
      ev({ tipo: 'sucesso', ...(r ? { ret: r } : {}) })
      if (!check) await p.waitForTimeout(ms)
    },
  }

  // ---------- roteiro ----------
  let falha = null
  try {
    await video.roteiro(g)
    const ult = ultimoPasso()
    const falaFim = voz && ult && voz.passos.get(ult.n)
    if (ult && !check) { const falta = ult.t + (falaFim ? Math.max(leituraMin + 0.6, LV.esperaDoPasso(falaFim, 0)) : leituraMin + 0.6) - agora(); if (falta > 0) await p.waitForTimeout(falta * 1000) }
    if (voz) {
      const np = eventos.filter((e) => e.tipo === 'passo').length
      const sobra = [...voz.passos.keys()].filter((n) => n > np)
      if (sobra.length) throw new Error(`a locução tem fala para o passo ${sobra.join(', ')}, mas o roteiro só tem ${np} passo(s): a fala não teria onde entrar`)
    }
  } catch (e) { falha = e }
  const fim = r3(agora())
  capturando = false
  if (cdp && captura === 'screencast') await cdp.send('Page.stopScreencast').catch(() => {})
  if (laco) await laco
  fs.mkdirSync(saida, { recursive: true })
  if (falha) {
    await p.screenshot({ path: path.join(saida, 'falha.png') }).catch(() => {})
    if (falha.cobre && falha.cobre.ret) {
      // marca na imagem da falha quem cobre (vermelho) e o alvo (azul)
      await p.evaluate(({ a, b }) => {
        for (const [r, c] of [[a, '#E4572E'], [b, '#2F6FEB']]) { if (!r) continue; const d = document.createElement('div'); Object.assign(d.style, { position: 'fixed', left: r.x - 3 + 'px', top: r.y - 3 + 'px', width: r.w + 6 + 'px', height: r.h + 6 + 'px', border: `3px solid ${c}`, borderRadius: '8px', zIndex: 2147483647, pointerEvents: 'none' }); document.body.appendChild(d) }
      }, { a: falha.cobre.retQuem, b: falha.cobre.ret }).catch(() => {})
      await p.screenshot({ path: path.join(saida, 'falha.png') }).catch(() => {})
    }
  }
  await p.screenshot({ path: path.join(saida, 'referencia.png') }).catch(() => {})
  await ctx.close()
  await browser.close()

  const listaNativos = [...nativos].map(([k, s]) => `${k}: ${[...s].join(', ')}`)
  if (falha) {
    const ult = ultimoPasso()
    console.log(`✗ ${video.id} (${v}) ${check ? 'não passou na conferência' : 'não gravou'}${ult ? ` no passo ${ult.n} "${ult.legenda}"` : ''}:\n    ${falha.message.split('\n')[0]}\n    imagem: ${path.join(saida, 'falha.png')}`)
    fs.writeFileSync(path.join(saida, check ? 'check.json' : 'falha.json'), JSON.stringify({ ok: false, erro: falha.message.split('\n')[0], passo: ult || null, eventos }, null, 2))
    return { versao: v, ok: false, erro: falha.message.split('\n')[0] }
  }
  // tempo de cada quadro do screencast no relógio daqui
  if (brutos.length) for (const [nome, ts] of brutos) quadros.push([nome, r3(ts + offset - t0)])
  quadros.sort((a, b) => a[1] - b[1])
  const toques = eventos.filter((e) => e.tipo === 'toque')
  const esperas = eventos.filter((e) => e.tipo === 'espera' && /aviso/.test(e.motivo || ''))
  const rolagens = eventos.filter((e) => e.tipo === 'rola' && e.motivo)
  const resumo = `${toques.length} toques conferidos` + (esperas.length ? `, ${esperas.length} espera(s) por aviso` : '') + (rolagens.length ? `, ${rolagens.length} rolagem(ns) para liberar alvo` : '') + (voz ? `, voz: ${voz.falas.length} falas (${voz.rel})` : '')
  if (check) {
    fs.writeFileSync(path.join(saida, 'check.json'), JSON.stringify({ ok: true, nativos: listaNativos, eventos }, null, 2))
    console.log(`✓ ${video.id} (${v}) ok · ${resumo}`)
    for (const e of [...esperas, ...rolagens]) console.log(`    ${e.tipo === 'espera' ? 'esperou' : 'rolou ' + Math.round(e.dy) + ' px:'} ${e.motivo}`)
  } else {
    const [qw, qh] = [Math.round(W * ap.dsf), Math.round(H * ap.dsf)]
    const qps = quadros.length / fim
    // o screencast só manda quadro quando a tela muda: a média engana. O que importa é a taxa nos trechos
    // com movimento — o pico numa janela de 1 s.
    let pico = 0
    for (let i = 0, j = 0; i < quadros.length; i++) { while (quadros[i][1] - quadros[j][1] > 1) j++; pico = Math.max(pico, i - j + 1) }
    const log = {
      id: video.id, titulo: video.titulo, versao: v,
      aparelho: { nome: ap.nome, viewport: ap.viewport, dsf: ap.dsf, toque: !!ap.toque, formato: ap.formato },
      captura: { metodo: captura, qps: r1(qps), qpsPico: pico, largura: qw, altura: qh, quadros: 'quadros.json' },
      duracao: fim, gravadoEm: new Date().toISOString(), nativos: listaNativos, errosDaPagina: errosPagina,
      ...(voz ? { voz: { locucao: voz.rel, sha256: voz.sha256, perfil: voz.perfil } } : {}), eventos,
    }
    fs.writeFileSync(path.join(saida, 'quadros.json'), JSON.stringify(quadros))
    fs.writeFileSync(path.join(saida, 'eventos.json'), JSON.stringify(log, null, 2))
    console.log(`✓ ${video.id} (${v}) gravado: ${fim.toFixed(1)} s, ${quadros.length} quadros (pico ${pico} qps em movimento, ${captura}, ${qw}×${qh}) · ${resumo}`)
    if (errosPagina.length) console.log('  erros da página:', errosPagina.join(' | '))
    try {
      const { folhaToques } = await import('./folha.mjs')
      const f = await folhaToques(saida, pw)
      console.log(`  folha de contato dos toques: ${f}  ← OLHE antes de compor`)
    } catch (e) { console.log('  (folha de contato falhou: ' + e.message.split('\n')[0] + ')') }
  }
  if (listaNativos.length) console.log(`  controles nativos (não aparecem abertos na captura): ${listaNativos.join(' · ')}`)
  return { versao: v, ok: true, fim, eventos: eventos.length }
}
