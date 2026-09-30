#!/usr/bin/env node
// Quadros soltos, tiras de transição e checagem para REVISAR o vídeo antes do render (você olha as imagens).
//   node quadros.cjs --projeto . --tempos 0.5,3.2,7.9 [--formato 9x16] [--nome cenas]
//   node quadros.cjs --projeto . --tira 11.6:12.3:12 [--nome drop]      (de:até:quantos)
//   node quadros.cjs --projeto . --cenas                                 (um quadro no meio de cada cena)
//   node quadros.cjs --projeto . --auto                                  (folha de cenas + folha de cortes/transições)
//   node quadros.cjs --projeto . --checar [--qps 10]                     (varre a linha do tempo, sem imagem)
// Saída: <projeto>/previas/<nome>/*.png e a folha de contato <projeto>/previas/<nome>.png
// Todo quadro passa pela checagem do motor (checarQuadro): texto/logo/legenda parado e opaco coberto por outra
// coisa, ou fora da área segura, é impresso. Códigos de saída: 0 ok · 3 erro na página (fonte, exceção) ·
// 4 problema de colisão/área segura (a folha fica gerada do mesmo jeito) · 1/2 falha da ferramenta.
const path = require('path'), fs = require('fs')
const { pathToFileURL } = require('url')
const { execFileSync } = require('child_process')
const { abrirNavegador } = require('./playwright.cjs')
const FORMATOS = { '16x9': [1920, 1080], '9x16': [1080, 1920], '1x1': [1080, 1080], '4x5': [1080, 1350] }
const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d }
const projeto = path.resolve(arg('projeto', '.'))
const seg = (t) => t.toFixed(2).replace('.', ',')

;(async () => {
  const { browser } = await abrirNavegador(projeto)
  const workers = +arg('workers', 4)
  const url0 = pathToFileURL(path.join(projeto, 'index.html')).href  // file:///C:/… no Windows
  const probe = await browser.newPage()
  const falhas = []
  probe.on('pageerror', (e) => falhas.push('ERRO NA PÁGINA: ' + e.message))
  probe.on('console', (m) => { if (m.type() === 'error') falhas.push('CONSOLE: ' + m.text()) })
  await probe.goto(url0 + (arg('formato') ? `?f=${arg('formato')}` : ''))
  await probe.waitForFunction('window.__ready === true', null, { timeout: 60000 }).catch(() => { throw new Error('a página não ficou pronta em 60 s.\n' + (falhas.join('\n') || 'nenhum erro no console: veja se cenas.js e video.js carregam')) })
  const info = await probe.evaluate(() => ({ fmt: FMT, dur: VIDEO.duracao, cenas: CENAS.map((c) => [c.t0, c.t1, c.nome]),
    transicoes: typeof TRANSICOES !== 'undefined' ? TRANSICOES.map((x) => [x.nome, x.t0, x.dur]) : [], checa: typeof checarQuadro === 'function' }))
  await probe.close()
  const formato = arg('formato', info.fmt)
  const [VW, VH] = FORMATOS[formato]
  const suf = formato !== '16x9' ? `-${formato}` : ''
  const fim = info.dur - 0.001
  if (!info.checa) console.error('aviso: este engine.js não tem checarQuadro — copie o engine.js novo da skill para ter a checagem de colisão')

  const erros = new Set()
  // Renderiza cada tempo, checa e (se dir) salva o PNG. Devolve os problemas por índice.
  async function capturar(tempos, dir) {
    const probs = new Array(tempos.length)
    let i = 0
    await Promise.all(Array.from({ length: Math.min(workers, tempos.length) }, async () => {
      const p = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 })
      p.on('pageerror', (e) => erros.add('ERRO NA PÁGINA: ' + e.message))
      p.on('console', (m) => { if (m.type() === 'error') erros.add('CONSOLE: ' + m.text()) })
      await p.goto(url0 + `?f=${formato}`)
      await p.waitForFunction('window.__ready === true', null, { timeout: 60000 })
      while (i < tempos.length) {
        const k = i++, t = tempos[k]
        probs[k] = await p.evaluate(async (t) => { await window.renderAt(t); return window.checarQuadro ? await window.checarQuadro(t) : [] }, t)
        if (dir) await p.screenshot({ path: path.join(dir, `${String(k).padStart(3, '0')}.png`), clip: { x: 0, y: 0, width: VW, height: VH } })
      }
      await p.close()
    }))
    return probs
  }
  function folha(nome, tempos, cols) {
    const dir = path.join(projeto, 'previas', nome)
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true })
    return { dir, png: path.join(projeto, 'previas', `${nome}.png`), montar() {
      const rows = Math.ceil(tempos.length / cols)
      // sequência numerada (o -pattern_type glob não existe no ffmpeg do Windows)
      execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-start_number', '0', '-i', path.join(dir, '%03d.png'),
        '-vf', `scale=${VH > VW ? 360 : 640}:-1,tile=${cols}x${rows}:padding=6:color=black`, '-frames:v', '1', this.png])
    } }
  }
  // Agrupa o mesmo problema: em varredura regular vira intervalo (t=3,20–4,10 s); senão, lista de instantes.
  function relatar(tempos, probs, regular) {
    const grupos = new Map()
    probs.forEach((ps, k) => (ps || []).forEach((q) => {
      if (!grupos.has(q.chave)) grupos.set(q.chave, { q, ks: [], pct: 0 })
      const g = grupos.get(q.chave); g.ks.push(k); g.pct = Math.max(g.pct, q.pct || 0)
    }))
    const linhas = []
    for (const g of grupos.values()) {
      const ks = [...new Set(g.ks)].sort((a, b) => a - b)
      let quando
      if (regular) {
        const iv = []
        for (const k of ks) { const u = iv[iv.length - 1]; if (u && k === u[1] + 1) u[1] = k; else iv.push([k, k]) }
        quando = iv.map(([a, b]) => (a === b ? seg(tempos[a]) : `${seg(tempos[a])}–${seg(tempos[b])}`)).join(', ')
      } else quando = ks.map((k) => seg(tempos[k])).join(', ')
      const q = g.q
      const msg = q.tipo === 'colisao' ? `COLISÃO t=${quando} s: ${q.rotulo} coberto por ${q.capa} em ${ks.length > 1 ? 'até ' : ''}${g.pct}% dos pontos`
        : q.msg.replace(/^ÁREA SEGURA t=[\d,]+ s/, `ÁREA SEGURA t=${quando} s`)
      linhas.push([tempos[ks[0]], msg])
    }
    return linhas.sort((a, b) => a[0] - b[0]).map((l) => l[1])
  }
  const encerrar = (problemas) => {
    for (const e of erros) console.error(e)
    for (const l of problemas) console.error(l)
    if (erros.size) process.exitCode = 3
    else if (problemas.length) process.exitCode = 4
  }

  // ---------- --checar: só renderAt + checarQuadro, a linha do tempo inteira ----------
  if (argv.includes('--checar')) {
    const qps = +arg('qps', 10), tempos = []
    for (let k = 0; k / qps < info.dur; k++) tempos.push(Math.min(k / qps, fim))
    const t0 = Date.now()
    const probs = await capturar(tempos, null)
    await browser.close()
    const linhas = relatar(tempos, probs, true)
    console.log(`checagem ${formato}: ${tempos.length} instantes de 0 a ${seg(info.dur)} s (${qps} qps) em ${((Date.now() - t0) / 1000).toFixed(0)} s · ${linhas.length ? linhas.length + ' problema(s)' : 'nenhum problema de colisão nem de área segura'}`)
    encerrar(linhas)
    return
  }

  // ---------- --auto: folha de cenas + folha de cortes (antes · meio · depois) ----------
  if (argv.includes('--auto')) {
    const cenasT = info.cenas.map(([a, b]) => Math.min(fim, (a + Math.min(b, info.dur)) / 2))
    const janelas = []
    const vistos = new Set()
    for (const [nome, a, d] of info.transicoes) { const k = `${a}+${d}`; if (!vistos.has(k)) { vistos.add(k); janelas.push({ nome, a, b: a + d }) } }
    // limites de cena que nenhuma transição registrada cobre: corte seco ou sobreposição feita à mão
    const inst = info.cenas.flatMap(([a, b]) => [a, b]).filter((x) => x > 0.01 && x < info.dur - 0.01).sort((x, y) => x - y)
    const grupos = []
    for (const x of inst) { const u = grupos[grupos.length - 1]; if (u && x - u.b <= 0.3) u.b = x; else grupos.push({ a: x, b: x }) }
    for (const g of grupos) if (!janelas.some((j) => g.b >= j.a - 0.05 && g.a <= j.b + 0.05)) janelas.push({ nome: g.a === g.b ? 'corte seco' : 'sobreposição', a: g.a, b: g.b })
    janelas.sort((x, y) => x.a - y.a)
    const cortesT = janelas.flatMap((j) => [Math.max(0, j.a - 0.1), Math.min(fim, (j.a + j.b) / 2), Math.min(fim, j.b + 0.1)])
    const fc = folha(`auto-cenas${suf}`, cenasT, VH > VW ? Math.min(cenasT.length, 6) : Math.min(cenasT.length, 4))
    const fk = janelas.length ? folha(`auto-cortes${suf}`, cortesT, VH > VW ? 6 : 3) : null
    if (!fk) fs.rmSync(path.join(projeto, 'previas', `auto-cortes${suf}.png`), { force: true })   // não deixa folha velha passar por nova
    const pc = await capturar(cenasT, fc.dir)
    const pk = fk ? await capturar(cortesT, fk.dir) : []
    await browser.close()
    fc.montar(); if (fk) fk.montar()
    console.log(`folha de cenas: ${fc.png}`)
    console.log('  ' + info.cenas.map(([a, b, n], i) => `${i + 1}) ${n ? n + ' ' : ''}${seg(cenasT[i])} s`).join(' · '))
    if (fk) {
      console.log(`folha de cortes: ${fk.png}  (cada ${VH > VW ? 'meia linha' : 'linha'} = antes · meio · depois)`)
      janelas.forEach((j, i) => console.log(`  ${i + 1}) ${j.nome} ${seg(j.a)}–${seg(j.b)} s: ${cortesT.slice(3 * i, 3 * i + 3).map(seg).join(' · ')}`))
    }
    const todos = [...cenasT, ...cortesT], todosP = [...pc, ...pk]
    const ordem = todos.map((t, i) => i).sort((x, y) => todos[x] - todos[y])
    encerrar(relatar(ordem.map((i) => todos[i]), ordem.map((i) => todosP[i]), false))
    return
  }

  // ---------- quadros soltos, tira ou cenas ----------
  let tempos = []
  if (arg('tempos')) tempos = arg('tempos').split(',').map(Number)
  else if (arg('tira')) { const [a, b, n] = arg('tira').split(':').map(Number); const q = n || 12; for (let i = 0; i < q; i++) tempos.push(a + ((b - a) * i) / (q - 1)) }
  else if (argv.includes('--cenas')) tempos = info.cenas.map(([a, b]) => Math.min(fim, (a + Math.min(b, info.dur)) / 2))
  else { const n = 16; for (let i = 0; i < n; i++) tempos.push(((i + 0.5) * info.dur) / n) }
  const nome = arg('nome', arg('tira') ? `tira-${arg('tira').split(':')[0]}` : 'quadros') + suf
  const f = folha(nome, tempos, VH > VW ? Math.min(tempos.length, 6) : Math.min(tempos.length, 4))
  const probs = await capturar(tempos, f.dir)
  await browser.close()
  f.montar()
  console.log(`${tempos.length} quadros (${formato}) em ${f.dir}`)
  console.log(`folha de contato: ${f.png}`)
  console.log('tempos (na ordem dos arquivos 000, 001…): ' + tempos.map((t) => t.toFixed(2)).join(' '))
  encerrar(relatar(tempos, probs, !!arg('tira')))
})().catch((e) => { console.error(e.message); process.exit(e.code === 'SEM_PLAYWRIGHT' || e.code === 'SEM_CHROMIUM' ? 2 : 1) })
