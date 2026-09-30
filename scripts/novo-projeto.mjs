#!/usr/bin/env node
// Cria a pasta de um vídeo novo a partir do molde da skill.
// Uso: node novo-projeto.mjs <destino> [--titulo "Nome"] [--duracao 40] [--bpm 120] [--formatos 16x9,9x16]
// Resultado: index.html, video.js, marca.js, engine.js, cenas.js (demo), fontes/, audio/ (synth.py,
// verifica.py, folha.json), ferramentas/ (render, quadros, finalizar) — pasta autocontida, re-renderizável.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const skill = path.resolve(here, '..')
const args = process.argv.slice(2)
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d }
const destino = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')))
if (!destino) { console.error('uso: node novo-projeto.mjs <destino> [--titulo ..] [--duracao 40] [--bpm 120] [--formatos 16x9,9x16]'); process.exit(1) }
const dest = path.resolve(destino)
if (fs.existsSync(dest) && fs.readdirSync(dest).length && !args.includes('--forcar')) {
  console.error(`${dest} já existe e não está vazia. Use outra pasta (ou --forcar para sobrescrever os arquivos do molde).`)
  process.exit(1)
}
const titulo = opt('titulo', 'Vídeo'), duracao = +opt('duracao', 40), bpm = +opt('bpm', 120)
const formatos = opt('formatos', '16x9').split(',').map((s) => s.trim())

fs.cpSync(path.join(skill, 'assets', 'template'), dest, { recursive: true })
fs.mkdirSync(path.join(dest, 'audio'), { recursive: true })
for (const f of ['synth.py', 'verifica.py', 'sons.py', 'serie.py', 'arranjo_serie.py']) {
  const src = path.join(skill, 'assets', 'audio', f)
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dest, 'audio', f)); else console.error(`aviso: ${f} não encontrado na skill`)
}
fs.mkdirSync(path.join(dest, 'ferramentas'), { recursive: true })
for (const f of ['playwright.cjs', 'quadros.cjs', 'render.cjs', 'finalizar.mjs']) fs.copyFileSync(path.join(here, f), path.join(dest, 'ferramentas', f))

const vj = path.join(dest, 'video.js')
let v = fs.readFileSync(vj, 'utf8')
v = v.replace(/titulo: '.*?'/, `titulo: ${JSON.stringify(titulo).replace(/"/g, "'")}`)
  .replace(/duracao: [\d.]+/, `duracao: ${duracao}`)
  .replace(/bpm: \d+/, `bpm: ${bpm}`)
  .replace(/formatos: \[.*?\]/, `formatos: [${formatos.map((f) => `'${f}'`).join(', ')}]`)
fs.writeFileSync(vj, v)

const folha = {
  titulo, duracao, bpm, compasso: 4, taxa: 48000, saida: 'trilha.wav', loudness_lufs: -14.0, teto_dbtp: -1.5,
  semente: Math.floor(Date.now() / 1000) % 100000000,
  silencios: [], fade: [Math.max(0, duracao - 2), duracao], secoes: [], marcos: [],
}
fs.writeFileSync(path.join(dest, 'audio', 'folha.json'), JSON.stringify(folha, null, 2) + '\n')

console.log(`projeto criado em ${dest}`)
console.log(`  ${titulo} · ${duracao} s · ${bpm} BPM (compasso = ${(240 / bpm).toFixed(3)} s) · formatos ${formatos.join(', ')}`)
console.log('  cenas.js é só a demonstração do motor — substitua pelas cenas do vídeo.')
