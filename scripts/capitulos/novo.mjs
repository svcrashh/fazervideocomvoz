#!/usr/bin/env node
// Cria a pasta de um vídeo em capítulos a partir do molde (references/capitulos.md §11 e §13).
//   node novo.mjs <destino> [--fontes "Título,Texto,Mono"] [--forcar]
// Resultado: molde/ (engine, kit, índice, fontes), cenas/00-abertura, 01-exemplo, 99-fecho, midia/, voz/,
// audio/ (síntese e mix com voz), ferramentas/ (render, quadros, finalizar), out/.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const skill = path.resolve(aqui, '..', '..')
const args = process.argv.slice(2)
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d }
const destino = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--') && args[i - 1] !== '--forcar'))
if (!destino) { console.error('uso: node novo.mjs <destino> [--fontes "Título,Texto,Mono"] [--forcar]'); process.exit(1) }
const dest = path.resolve(destino)
if (fs.existsSync(dest) && fs.readdirSync(dest).length && !args.includes('--forcar')) {
  console.error(`${dest} já existe e não está vazia. Use outra pasta, ou --forcar para sobrescrever os arquivos do molde.`)
  process.exit(1)
}
const fontes = opt('fontes', 'Barlow Condensed,Inter,JetBrains Mono').split(',').map((s) => s.trim()).filter(Boolean)

fs.cpSync(path.join(skill, 'assets', 'capitulos'), dest, { recursive: true })
fs.copyFileSync(path.join(skill, 'assets', 'template', 'engine.js'), path.join(dest, 'molde', 'engine.js'))
for (const d of ['midia', 'voz', 'audio', 'ferramentas', 'out']) fs.mkdirSync(path.join(dest, d), { recursive: true })
for (const f of ['playwright.cjs', 'quadros.cjs', 'render.cjs', 'finalizar.mjs']) fs.copyFileSync(path.join(skill, 'scripts', f), path.join(dest, 'ferramentas', f))
for (const f of ['synth.py', 'verifica.py', 'sons.py', 'serie.py', 'arranjo_serie.py', 'mix_voz.py', 'API.md']) fs.copyFileSync(path.join(skill, 'assets', 'audio', f), path.join(dest, 'audio', f))

if (opt('fontes')) {
  const [t, x, m] = fontes
  const kit = path.join(dest, 'molde', 'kit.js')
  fs.writeFileSync(kit, fs.readFileSync(kit, 'utf8').replace(/const FONTE = \{[^}]*\}/, `const FONTE = { titulo: ${JSON.stringify(t)}, texto: ${JSON.stringify(x || t)}, mono: ${JSON.stringify(m || x || t)} }`))
  for (const c of fs.readdirSync(path.join(dest, 'cenas'))) {
    const v = path.join(dest, 'cenas', c, 'video.js')
    if (fs.existsSync(v)) fs.writeFileSync(v, fs.readFileSync(v, 'utf8').replace(/fontes: \[[^\]]*\]/, `fontes: ${JSON.stringify([...new Set(fontes)]).replace(/"/g, "'").replace(/,/g, ', ')}`))
  }
}
const r = spawnSync(process.execPath, [path.join(skill, 'scripts', 'fontes.mjs'), path.join(dest, 'molde'), ...new Set(fontes)], { stdio: 'inherit' })
if (r.status !== 0) console.error(`aviso: as fontes não vieram (${fontes.join(', ')}). Rode de novo: node ${path.join(skill, 'scripts', 'fontes.mjs')} ${path.join(dest, 'molde')} "Família" …`)

console.log(`\nvídeo em capítulos criado em ${dest}
  1. troque os tokens e o logo em molde/kit.js e o índice em molde/indice.js (pela leitura);
  2. faça UM capítulo inteiro (copie cenas/01-exemplo) e renderize: node ${path.join(aqui, 'render.mjs')} ${dest} 01-exemplo --modo rascunho;
  3. olhe out/folha-*.png de cada formato; só então os outros capítulos, em paralelo;
  4. monte: node ${path.join(aqui, 'montar.mjs')} ${dest} --locucao voz/<versao>/locucao.json`)
