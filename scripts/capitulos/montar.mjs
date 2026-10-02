#!/usr/bin/env node
// Monta o vídeo em capítulos: junta as cenas na ordem, por formato, e põe a voz no lugar.
//   node montar.mjs <projeto> [--locucao voz/<versao>/locucao.json] [--perfil reels|calmo] [--fala-em 1.4]
//                   [--formatos 16x9,9x16] [--bpm 120]
// Cenas: as pastas cenas/NN-nome com out/<formato>.mp4, em ordem. 00-… é a abertura, 99-… o fecho, NN o capítulo
// NN (a fala { "capitulo": NN } da locução). Cada fala começa em <início da cena> + --fala-em.
// Sai: out/montado-<formato>.mp4 (mudo), audio/voz.wav, audio/folha.json (duração, bloco voz, whoosh em cada
// passagem de capítulo) e out/montagem.json (onde cada cena e cada fala caem). Depois: a trilha
// (references/trilha.md, com mix_voz) e o finalizar.mjs de cada formato.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { validarLocucao } from '../voz.mjs'
import { escreverVozWav, blocoFolha } from '../tutorial/locucao.mjs'

const args = process.argv.slice(2)
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d }
const proj = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')))
if (!proj) { console.error('uso: node montar.mjs <projeto> [--locucao voz/<versao>/locucao.json] [--perfil reels] [--fala-em 1.4]'); process.exit(1) }
const projeto = path.resolve(proj)
const formatos = opt('formatos', '16x9,9x16').split(',')
const falaEm = +opt('fala-em', 1.4)
const SAIDA = 0.5
const r3 = (v) => Math.round(v * 1000) / 1000
const duracao = (f) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim()
const erro = (m) => { console.error(m); process.exit(1) }

const cenas = fs.readdirSync(path.join(projeto, 'cenas')).filter((c) => /^\d\d-/.test(c)).sort().map((nome) => ({ nome, n: +nome.slice(0, 2) }))
if (!cenas.length) erro(`não há cenas NN-nome em ${path.join(projeto, 'cenas')}`)
const faltam = cenas.flatMap((c) => formatos.filter((f) => !fs.existsSync(path.join(projeto, 'cenas', c.nome, 'out', `${f}.mp4`))).map((f) => `${c.nome}/out/${f}.mp4`))
if (faltam.length) erro(`faltam renders (node render.mjs ${projeto} <cena>):\n  ${faltam.join('\n  ')}`)

// a linha do tempo sai do primeiro formato; os outros têm de bater com ela
let t = 0
for (const c of cenas) {
  c.dur = duracao(path.join(projeto, 'cenas', c.nome, 'out', `${formatos[0]}.mp4`))
  for (const f of formatos.slice(1)) {
    const d = duracao(path.join(projeto, 'cenas', c.nome, 'out', `${f}.mp4`))
    if (Math.abs(d - c.dur) > 0.02) erro(`${c.nome}: ${formatos[0]} tem ${c.dur.toFixed(3)} s e ${f} tem ${d.toFixed(3)} s. Renderize os dois com a mesma duracao.`)
  }
  c.ini = r3(t); t += c.dur
}
const total = r3(t)

fs.mkdirSync(path.join(projeto, 'out'), { recursive: true })
for (const f of formatos) {
  const lista = path.join(projeto, 'out', `lista-${f}.txt`)
  fs.writeFileSync(lista, cenas.map((c) => `file '${path.join(projeto, 'cenas', c.nome, 'out', `${f}.mp4`).replace(/'/g, "'\\''")}'`).join('\n') + '\n')
  const saida = path.join(projeto, 'out', `montado-${f}.mp4`)
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', '-an', '-movflags', '+faststart', saida])
  fs.rmSync(lista)
  const d = duracao(saida)
  if (Math.abs(d - total) > 0.05) erro(`out/montado-${f}.mp4 tem ${d.toFixed(3)} s, a soma das cenas é ${total} s: as cenas não têm o mesmo fps/codec. Renderize todas no mesmo --modo.`)
  console.log(`✓ out/montado-${f}.mp4 · ${cenas.length} cenas · ${d.toFixed(2)} s`)
}

let falas = []
const locArg = opt('locucao')
if (locArg) {
  const arq = path.resolve(projeto, locArg), dir = path.dirname(arq)
  if (!fs.existsSync(arq)) erro(`não achei a locução ${arq}`)
  const loc = JSON.parse(fs.readFileSync(arq, 'utf8'))
  const e = validarLocucao(loc, dir)
  if (e.length) erro(`a locução não passa no Contrato L:\n  ${e.join('\n  ')}`)
  const problemas = []
  for (const f of loc.falas) {
    const n = f.onde === 'abertura' ? 0 : f.onde === 'fechamento' ? 99 : f.onde.capitulo
    if (n == null) { problemas.push(`${f.id}: onde ${JSON.stringify(f.onde)} não é de vídeo em capítulos`); continue }
    const c = cenas.find((x) => x.n === n)
    if (!c) { problemas.push(`${f.id}: não há cena ${String(n).padStart(2, '0')}-… para esta fala`); continue }
    const fim = falaEm + f.palavras.at(-1).fim
    if (fim > c.dur - SAIDA) problemas.push(`${c.nome}: a fala ${f.id} termina em ${fim.toFixed(2)} s e a cena tem ${c.dur.toFixed(2)} s; ponha duracao ≥ ${Math.ceil((fim + 0.8) * 10) / 10} no video.js e renderize de novo`)
    const ini = c.ini + falaEm
    falas.push({ ...f, caminho: path.join(dir, f.arquivo), inicioArquivo: ini, som: ini + f.inicio_voz, fim: ini + f.palavras.at(-1).fim })
  }
  if (problemas.length) erro(`a voz não cabe nas cenas:\n  ${problemas.join('\n  ')}`)
  const semFala = cenas.filter((c) => c.n !== 0 && c.n !== 99 && !falas.some((f) => f.onde?.capitulo === c.n))
  if (semFala.length) console.log(`  aviso: capítulo sem fala: ${semFala.map((c) => c.nome).join(', ')}`)
  falas.sort((a, b) => a.som - b.som)
  fs.mkdirSync(path.join(projeto, 'audio'), { recursive: true })
  escreverVozWav(falas, total, path.join(projeto, 'audio', 'voz.wav'))
  console.log(`✓ audio/voz.wav · ${falas.length} falas no lugar (início da cena + ${falaEm} s)`)
}

const folhaP = path.join(projeto, 'audio', 'folha.json')
const folha = fs.existsSync(folhaP) ? JSON.parse(fs.readFileSync(folhaP, 'utf8')) : {
  titulo: path.basename(projeto), bpm: +opt('bpm', 120), compasso: 4, taxa: 48000, saida: 'trilha.wav',
  semente: Math.floor(Date.now() / 1000) % 100000000, silencios: [], secoes: [], marcos: [],
}
folha.duracao = total
folha.fade = [Math.max(0, total - 2.5), total]
// a passagem do cartão do índice é a transição: um whoosh no pico dela, em cada capítulo
folha.marcos = [...(folha.marcos || []).filter((m) => m.auto !== 'montar'),
  ...cenas.slice(1).map((c) => ({ t: r3(c.ini + 0.3), evento: `cartão do índice: ${c.nome}`, efeito: 'whoosh', opcional: true, auto: 'montar' }))]
  .sort((a, b) => a.t - b.t)
if (falas.length) Object.assign(folha, { loudness_lufs: -14, teto_dbtp: -1.0, voz: blocoFolha(falas, opt('perfil', 'reels')) })
else Object.assign(folha, { loudness_lufs: folha.loudness_lufs ?? -14, teto_dbtp: folha.teto_dbtp ?? -1.5 })
fs.writeFileSync(folhaP, JSON.stringify(folha, null, 2) + '\n')
fs.writeFileSync(path.join(projeto, 'out', 'montagem.json'), JSON.stringify({
  duracao: total, fala_em: falaEm,
  cenas: cenas.map((c) => ({ nome: c.nome, ini: c.ini, dur: r3(c.dur) })),
  falas: falas.map((f) => ({ id: f.id, som: r3(f.som), fim: r3(f.fim), texto: f.texto })),
}, null, 1) + '\n')
console.log(`✓ audio/folha.json · ${total} s · ${folha.marcos.length} marcos${falas.length ? ' · bloco voz' : ''}
  próximo: a trilha sobre a folha (references/trilha.md §4, com mix_voz) → audio/trilha.wav, e então, por formato:
  node ${path.join(projeto, 'ferramentas', 'finalizar.mjs')} --projeto ${projeto} --video out/montado-16x9.mp4 --audio audio/trilha.wav --saida <entrega>`)
