#!/usr/bin/env node
// Renderiza um capítulo (ou todos) nos formatos do vídeo e tira a folha de quadros de cada um.
//   node render.mjs <projeto> <cena|todas> [--modo final|rascunho] [--formatos 16x9,9x16] [-- <opções do render.cjs>]
// Sai em cenas/<cena>/out/<formato>.mp4 e out/folha-<formato>.png. Código ≠ 0 = erro no console da página
// (título largo demais, capítulo fora do índice, imagem que falta…) ou no render: corrija antes de entregar.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync, execFileSync } from 'node:child_process'

const argv = process.argv.slice(2)
const corte = argv.indexOf('--')
const extra = corte >= 0 ? argv.slice(corte + 1) : []
const args = corte >= 0 ? argv.slice(0, corte) : argv
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d }
const [proj, alvo] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')))
if (!proj || !alvo) { console.error('uso: node render.mjs <projeto> <cena|todas> [--modo final|rascunho] [--formatos 16x9,9x16]'); process.exit(1) }
const projeto = path.resolve(proj), modo = opt('modo', 'final')
const formatos = opt('formatos', '16x9,9x16').split(',')
const cenas = alvo === 'todas' ? fs.readdirSync(path.join(projeto, 'cenas')).filter((c) => /^\d/.test(c) && fs.existsSync(path.join(projeto, 'cenas', c, 'cena.js'))).sort() : [alvo]
let falhou = 0
for (const c of cenas) {
  const dir = path.join(projeto, 'cenas', c)
  if (!fs.existsSync(path.join(dir, 'cena.js'))) { console.error(`não achei ${dir}/cena.js`); falhou++; continue }
  for (const f of formatos) {
    const r = spawnSync(process.execPath, [path.join(projeto, 'ferramentas', 'render.cjs'), '--projeto', dir, '--modo', modo, '--formato', f, '--saida', `out/${f}.mp4`, '--sem-folha', ...extra], { stdio: 'inherit' })
    if (r.status === 2) process.exit(2)   // sem Playwright ou Chromium: a mensagem acima diz o que instalar
    if (r.status !== 0) { console.error(`✗ ${c} ${f}: o render saiu com código ${r.status}`); falhou++; continue }
    const mp4 = path.join(dir, 'out', `${f}.mp4`)
    const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString().trim()
    const [escala, grade] = f === '9x16' ? ['270:-1', '8x3'] : ['480:-1', '6x4']
    const folha = path.join(dir, 'out', `folha-${f}.png`)
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', mp4, '-vf', `fps=24/${dur},scale=${escala},tile=${grade}`, '-frames:v', '1', folha])
    console.log(`✓ ${c} ${f} · ${dur.toFixed(2)} s · OLHE a folha: ${folha}`)
  }
}
process.exitCode = falhou ? 1 : 0
