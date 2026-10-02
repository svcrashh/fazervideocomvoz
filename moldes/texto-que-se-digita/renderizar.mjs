#!/usr/bin/env node
// Renderiza o molde "texto que se digita" a partir de um arquivo de parâmetros.
//   node renderizar.mjs <exemplo.json> --saida <pasta> [--formatos 16x9,9x16,1x1] [--modo final|rascunho] [--sem-som] [-- <opções do render.cjs, ex. --sub 4>]
// Sai em <pasta>/<nome>-<formato>.mp4 (com voz, teclas e efeitos) e <pasta>/<nome>-<formato>-folha.png.
// A obra (cena montada, para prévia no navegador) fica em <pasta>/.obra-<nome>/index.html?f=9x16&t=3.
// Som: precisa de um Python com numpy e scipy (FAZERVIDEO_PY, ou o python3 do sistema se tiver os dois).
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const skill = path.resolve(aqui, '..', '..')
const todos = process.argv.slice(2), corte = todos.indexOf('--')
const args = corte >= 0 ? todos.slice(0, corte) : todos, extra = corte >= 0 ? todos.slice(corte + 1) : []
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d }
const arq = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && !['--sem-som'].includes(args[i - 1])))
if (!arq || !opt('saida')) { console.error('uso: node renderizar.mjs <exemplo.json> --saida <pasta> [--formatos 16x9,9x16] [--modo final|rascunho] [--sem-som]'); process.exit(1) }
const base = path.dirname(path.resolve(arq))
const P = JSON.parse(fs.readFileSync(arq, 'utf8'))
const saida = path.resolve(opt('saida')), modo = opt('modo', 'final')
const nome = P.nome || path.basename(arq, '.json')
const formatos = opt('formatos', (P.formatos || ['16x9', '9x16']).join(',')).split(',')
const obra = path.join(saida, `.obra-${nome}`)
fs.mkdirSync(path.join(obra, 'midia'), { recursive: true })

// 1. a cena: index, molde, motor da skill
for (const f of ['index.html', 'molde.js']) fs.copyFileSync(path.join(aqui, 'cena', f), path.join(obra, f))
fs.copyFileSync(path.join(skill, 'assets', 'template', 'engine.js'), path.join(obra, 'engine.js'))
if (P.marca.logo?.arquivo) fs.copyFileSync(path.resolve(base, P.marca.logo.arquivo_origem || P.marca.logo.arquivo), path.join(obra, 'midia', P.marca.logo.arquivo))

// 2. a voz: trechos de falas já geradas (locucao.json da voz.mjs), com os tempos de cada palavra para a legenda
const falas = []
for (const tr of P.voz?.trechos || []) {
  const locArq = path.resolve(base, tr.locucao || P.voz.locucao)
  const loc = JSON.parse(fs.readFileSync(locArq, 'utf8'))
  const f = loc.falas.find((x) => x.id === tr.fala)
  if (!f) throw new Error(`fala ${tr.fala} não está em ${locArq}`)
  const de = tr.de ?? 0, ate = tr.ate ?? f.palavras.at(-1).fim + 0.05
  const ps = f.palavras.filter((p) => p.ini >= de - 0.01 && p.fim <= ate + 0.01).map((p) => ({ texto: p.texto, ini: +(p.ini - de).toFixed(3), fim: +(p.fim - de).toFixed(3) }))
  falas.push({ em: tr.em, texto: ps.map((p) => p.texto).join(' '), palavras: ps, wav: path.resolve(path.dirname(locArq), f.arquivo), de, ate })
}
const total = P.cenas.reduce((s, c) => s + c.dur, 0)
for (const f of falas) if (f.em + (f.ate - f.de) > total - 0.3) throw new Error(`a fala "${f.texto}" passa do fim do vídeo (${total} s): adiante o "em" ou alongue um bloco`)
const fontes = [...new Set([P.marca.fontes.titulo, P.marca.fontes.texto, P.marca.fontes.mono].filter(Boolean))]
const VIDEO = { titulo: nome, duracao: +total.toFixed(3), formatos, plataforma: P.plataforma || null, fontes, fundo: P.marca.cores.fundo, grao: P.grao ?? 0.03, impactos: [], selo: null }
fs.writeFileSync(path.join(obra, 'params.js'), `const PARAMS = ${JSON.stringify({ ...P, falas: falas.map(({ wav, de, ate, ...f }) => f) }, null, 1)}\nconst VIDEO = ${JSON.stringify(VIDEO)}\n`)

// 3. fontes dentro da obra (sem rede no render)
if (!fs.existsSync(path.join(obra, 'fontes', 'fontes.css')) || fontes.some((f) => !fs.readFileSync(path.join(obra, 'fontes', 'fontes.css'), 'utf8').includes(`"${f}"`))) {
  const r = spawnSync(process.execPath, [path.join(skill, 'scripts', 'fontes.mjs'), obra, ...fontes], { stdio: 'inherit' })
  if (r.status !== 0) { console.error('as fontes não vieram: ' + fontes.join(', ')); process.exit(1) }
}

// 4. os sons que a cena marcou (teclas, cliques, whoosh, sucesso)
const require = createRequire(import.meta.url)
const { abrirNavegador } = require(path.join(skill, 'scripts', 'playwright.cjs'))
const { browser } = await abrirNavegador(obra)
const pg = await browser.newPage()
const erros = []
pg.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()) })
pg.on('pageerror', (e) => erros.push(e.message))
await pg.goto('file://' + path.join(obra, 'index.html') + `?f=${formatos[0]}`)
await pg.waitForFunction('window.__ready === true', null, { timeout: 60000 }).catch(() => {})
const sons = await pg.evaluate(() => window.SONS || [])
await browser.close()
if (erros.length) { console.error('ERRO NA CENA:\n' + erros.join('\n')); process.exit(3) }

// 5. o som: voz + efeitos, voz por cima
let wav = null
if (!args.includes('--sem-som')) {
  const py = [process.env.FAZERVIDEO_PY, 'python3'].filter(Boolean).find((p) => spawnSync(p, ['-c', 'import numpy, scipy'], { stdio: 'ignore' }).status === 0)
  if (!py) console.error('aviso: sem Python com numpy e scipy (defina FAZERVIDEO_PY): o vídeo sai mudo')
  else {
    wav = path.join(obra, 'som.wav')
    fs.writeFileSync(path.join(obra, 'som.json'), JSON.stringify({ duracao: total, sons, falas: falas.map(({ wav, de, ate, em }) => ({ wav, de, ate, em })), saida: wav, audio: path.join(skill, 'assets', 'audio') }, null, 1))
    const r = spawnSync(py, [path.join(aqui, 'mixar.py'), path.join(obra, 'som.json')], { stdio: 'inherit' })
    if (r.status !== 0) { console.error('o som falhou: o vídeo sai mudo'); wav = null }
  }
}

// 6. render por formato, som junto, folha de quadros
for (const f of formatos) {
  const r = spawnSync(process.execPath, [path.join(skill, 'scripts', 'render.cjs'), '--projeto', obra, '--modo', modo, '--formato', f, '--saida', `out/${f}.mp4`, '--sem-folha', ...extra], { stdio: 'inherit' })
  if (r.status !== 0) { console.error(`✗ ${f}: render saiu com ${r.status}`); process.exitCode = 1; continue }
  const mudo = path.join(obra, 'out', `${f}.mp4`), final = path.join(saida, `${nome}-${f}.mp4`)
  if (wav) execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', mudo, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', final])
  else fs.copyFileSync(mudo, final)
  const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', final]).toString().trim()
  const [esc, grade] = f === '9x16' ? ['270:-1', '8x3'] : f === '1x1' ? ['360:-1', '6x4'] : ['480:-1', '6x4']
  const folha = path.join(saida, `${nome}-${f}-folha.png`)
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', final, '-vf', `fps=24/${dur},scale=${esc},tile=${grade}`, '-frames:v', '1', folha])
  console.log(`✓ ${final} · ${dur.toFixed(2)} s · OLHE a folha: ${folha}`)
}
