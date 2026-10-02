#!/usr/bin/env node
// Monta e renderiza um vídeo antes-e-depois a partir de um exemplo.json.
//   node renderizar.mjs <exemplo.json> --telas <pasta das capturas> --saida <pasta>
//        [--locucao voz/locucao.json] [--formatos 16x9,9x16,1x1] [--modo final|rascunho] [--variacao corte|zoom-out]
// Sai em <saida>: <nome>-<formato>.mp4 (com a voz, se houver locução), folha-<nome>-<formato>.png e projeto/
// (o HTML do vídeo, para prévia: projeto/index.html?f=9x16&t=4).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const skill = path.resolve(aqui, '..', '..')
const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d }
const exp = (p) => (p && p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p)
const jsonP = path.resolve(argv[0] || '')
if (!argv[0] || !fs.existsSync(jsonP)) { console.error('uso: node renderizar.mjs <exemplo.json> --telas <pasta> --saida <pasta> [--locucao …]'); process.exit(1) }
const cfg = JSON.parse(fs.readFileSync(jsonP, 'utf8'))
const base = path.dirname(jsonP)
const telas = path.resolve(exp(arg('telas', path.join(base, 'telas'))))
const saida = path.resolve(exp(arg('saida', path.join(base, 'out'))))
const modo = arg('modo', 'final')
const formatos = arg('formatos', '16x9,9x16').split(',')
const locP = arg('locucao') ? path.resolve(exp(arg('locucao'))) : null
const proj = path.join(saida, 'projeto')
fs.mkdirSync(path.join(proj, 'telas'), { recursive: true })
fs.mkdirSync(path.join(proj, 'midia'), { recursive: true })
const run = (cmd, a) => { const r = spawnSync(cmd, a, { stdio: 'inherit' }); if (r.status !== 0) { console.error(`falhou: ${cmd} ${a.join(' ')}`); process.exit(r.status || 1) } }

// 1. molde + motor + telas + logo
fs.copyFileSync(path.join(aqui, 'molde', 'index.html'), path.join(proj, 'index.html'))
fs.copyFileSync(path.join(aqui, 'molde', 'cena.js'), path.join(proj, 'cena.js'))
fs.copyFileSync(path.join(skill, 'assets', 'template', 'engine.js'), path.join(proj, 'engine.js'))
for (const f of fs.readdirSync(telas).filter((f) => f.endsWith('.png'))) fs.copyFileSync(path.join(telas, f), path.join(proj, 'telas', f))
const marca = { ...cfg.marca }
if (marca.logo) { const dst = 'midia/logo' + path.extname(marca.logo); fs.copyFileSync(path.resolve(base, marca.logo), path.join(proj, dst)); marca.logo = dst }

// 2. fontes da marca dentro do projeto (o render não depende de rede nem de fonte instalada)
const familias = [...new Set([marca.fontes.titulo, marca.fontes.texto, marca.fontes.mono].filter(Boolean))]
if (!fs.existsSync(path.join(proj, 'fontes', 'fontes.css')) || familias.some((f) => !fs.readFileSync(path.join(proj, 'fontes', 'fontes.css'), 'utf8').includes(`"${f}"`)))
  run(process.execPath, [path.join(skill, 'scripts', 'fontes.mjs'), proj, ...familias])

// 3. tempos: a voz manda. Sem locução, estima 0,38 s por palavra.
const loc = locP ? JSON.parse(fs.readFileSync(locP, 'utf8')) : null
const falaDe = (id) => {
  const f = loc?.falas.find((x) => x.id === id)
  if (f) return { dur: f.duracao, palavras: f.palavras.map((p) => ({ t: p.texto, ini: p.ini })), arquivo: path.resolve(path.dirname(locP), f.arquivo) }
  const txt = cfg.falas.find((x) => x.id === id)?.texto || ''
  const ws = txt.split(/\s+/).filter(Boolean)
  return { dur: ws.length * 0.38, palavras: ws.map((t, i) => ({ t, ini: i * 0.38 })), arquivo: null }
}
const fA = falaDe('antes'), fD = falaDe('depois')
const tp = { a: 0.5 }
tp.gatilho = Math.max(1.6, tp.a + fA.dur - 0.6)
tp.clique = tp.a + fA.dur + 1.1
tp.d = tp.clique + 0.25
tp.cortina = Math.max(tp.d + fD.dur + 0.4, tp.clique + 3)
tp.fecho = tp.cortina + 2.6
let dur = Math.max(12, tp.fecho + 3.2)
if (dur > 20) console.error(`aviso: ${dur.toFixed(1)} s passa de 20 s — encurte as falas`)
dur = Math.round(dur * 60) / 60

// legendas = a fala, em pedaços de até 6 palavras, no tempo de cada palavra
const legendas = []
for (const [f, t0] of [[fA, tp.a], [fD, tp.d]]) {
  const ps = f.palavras
  for (let i = 0; i < ps.length; i += 6) {
    const g = ps.slice(i, i + 6)
    const prox = ps[i + 6]
    legendas.push({ texto: g.map((p) => p.t).join(' '), de: t0 + g[0].ini - 0.05, ate: prox ? t0 + prox.ini - 0.05 : t0 + f.dur + 0.5 })
  }
}

// 4. render por formato
const variacao = arg('variacao', cfg.variacao || 'corte')
fs.mkdirSync(saida, { recursive: true })
for (const F of formatos) {
  const fc = cfg.formatos[F]
  if (!fc) { console.error(`o exemplo.json não tem formatos.${F}`); continue }
  const vp = cfg.captura?.telas?.[fc.tela] || fc.viewport
  const formato = { antes: `telas/${fc.tela}-antes.png`, depois: `telas/${fc.tela}-depois.png`, w: vp.w, h: vp.h, foco: fc.foco, detalhe: fc.detalhe, zoomDetalhe: fc.zoomDetalhe }
  const PARAM = { marca, textos: cfg.textos, gatilho: cfg.gatilho, variacao, formato,
    tempos: { gatilho: tp.gatilho, clique: tp.clique, cortina: tp.cortina, fecho: tp.fecho }, legendas }
  fs.writeFileSync(path.join(proj, 'video.js'), `// gerado pelo renderizar.mjs a partir de ${path.basename(jsonP)} — não edite\n` +
    `const VIDEO = ${JSON.stringify({ titulo: cfg.nome, duracao: dur, formatos: [F], plataforma: null, fontes: familias, fundo: marca.cores.fundo, grao: 0, impactos: [], selo: null }, null, 1)}\n` +
    `const PARAM = ${JSON.stringify(PARAM, null, 1)}\n`)
  const mudo = path.join(proj, 'out', `${F}.mp4`)
  const extra = modo === 'final' ? ['--sub', '4', '--crf', '16', '--preset', 'medium'] : []
  if (fs.existsSync(mudo)) fs.rmSync(mudo)
  const r = spawnSync(process.execPath, [path.join(skill, 'scripts', 'render.cjs'), '--projeto', proj, '--modo', modo, '--formato', F, '--saida', `out/${F}.mp4`, '--sem-folha', ...extra], { stdio: 'inherit' })
  if (!fs.existsSync(mudo)) { console.error(`o render do ${F} não saiu`); process.exit(r.status || 1) }
  if (r.status !== 0) console.error(`AVISO: o render do ${F} saiu com avisos no console (acima) — corrija antes de entregar`)
  const final = path.join(saida, `${cfg.nome}-${variacao === 'corte' ? '' : variacao + '-'}${F}.mp4`)
  const falas = [[fA, tp.a], [fD, tp.d]].filter(([f]) => f.arquivo)
  if (falas.length) {
    const ins = falas.flatMap(([f]) => ['-i', f.arquivo])
    const fil = falas.map(([, t0], i) => `[${i + 1}:a]aresample=48000,adelay=${Math.round(t0 * 1000)}|${Math.round(t0 * 1000)}[a${i}]`).join(';') +
      `;${falas.map((_, i) => `[a${i}]`).join('')}amix=inputs=${falas.length}:normalize=0,apad,atrim=0:${dur}[voz]`
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', mudo, ...ins, '-filter_complex', fil, '-map', '0:v', '-map', '[voz]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', final])
  } else fs.copyFileSync(mudo, final)
  const D = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', final]).toString().trim()
  const [S, Tl] = F === '16x9' ? ['480:-1', '6x4'] : F === '9x16' ? ['270:-1', '8x3'] : ['360:-1', '6x4']
  const folha = path.join(saida, `folha-${path.basename(final, '.mp4')}.png`)
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', final, '-vf', `fps=24/${D},scale=${S},tile=${Tl}`, '-frames:v', '1', folha])
  console.log(`✓ ${final} (${(+D).toFixed(2)} s)  folha: ${folha}`)
}
console.log(`tempos: clique ${tp.clique.toFixed(2)} s · cortina ${tp.cortina.toFixed(2)} s · fecho ${tp.fecho.toFixed(2)} s · total ${dur.toFixed(2)} s`)
