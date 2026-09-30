#!/usr/bin/env node
// Diagnóstico do ambiente para o /fazervideo: sistema, ffmpeg, Python (numpy/scipy), Playwright + Chromium,
// CPUs e disco livre. Imprime o que falta e o comando de instalação certo para ESTE sistema.
// Uso: node ambiente.mjs [pasta-do-projeto]   ·   --json para saída em JSON
import { execSync } from 'node:child_process'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const here = path.dirname(fileURLToPath(import.meta.url))
const projeto = process.argv.slice(2).find((a) => !a.startsWith('--')) || process.cwd()
const win = process.platform === 'win32', mac = process.platform === 'darwin'
const run = (cmd) => { try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 }).toString().trim() } catch { return null } }

const r = { sistema: `${mac ? 'macOS' : win ? 'Windows' : 'Linux'} ${os.release()} (${os.arch()})`, shell: win ? 'PowerShell' : (process.env.SHELL || 'sh'), cpus: os.cpus().length, node: process.version }
r.ffmpeg = (run('ffmpeg -version') || '').split('\n')[0] || null
r.ffprobe = !!run('ffprobe -version')

let py = null
for (const c of win ? ['py -3', 'python', 'python3'] : ['python3', 'python']) { const v = run(`${c} --version`); if (v && /Python 3/.test(v)) { py = c; r.python = v; break } }
r.python_cmd = py
if (py) r.numpy_scipy = !!run(`${py} -c "import numpy, scipy"`)

try {
  const { candidatos } = require(path.join(here, 'playwright.cjs'))
  const cs = candidatos(projeto)
  r.playwright = cs[0] || null
  if (cs[0]) {
    const pw = require(cs[0])
    const exe = pw.chromium.executablePath()
    r.chromium = exe && fs.existsSync(exe) ? exe : null
  }
} catch (e) { r.playwright_erro = e.message }

try { const st = fs.statfsSync(projeto); r.disco_livre_gb = +((st.bavail * st.bsize) / 1e9).toFixed(1) } catch {}

const falta = []
if (!r.ffmpeg) falta.push(['ffmpeg', mac ? 'brew install ffmpeg' : win ? 'winget install --id Gyan.FFmpeg -e' : 'sudo apt install ffmpeg'])
if (!py) falta.push(['Python 3', mac ? 'brew install python' : win ? 'winget install --id Python.Python.3.12 -e' : 'sudo apt install python3 python3-venv'])
else if (!r.numpy_scipy) falta.push(['numpy + scipy (só para a trilha)', `crie um venv na pasta audio do projeto: ${py} -m venv .venv && ${win ? '.venv\\Scripts\\pip' : '.venv/bin/pip'} install numpy scipy`])
if (!r.playwright) falta.push(['Playwright', 'na pasta do projeto: npm i -D playwright && npx playwright install chromium'])
else if (!r.chromium) falta.push(['Chromium do Playwright', 'npx playwright install chromium'])
if (r.disco_livre_gb != null && r.disco_livre_gb < 3) falta.push(['espaço em disco', `só ${r.disco_livre_gb} GB livres — o render faz streaming, mas o encode e as prévias precisam de ~2 GB`])
r.falta = falta.map(([o, c]) => ({ o, como: c }))
r.workers_sugeridos = Math.max(2, Math.min(8, r.cpus - 2))

if (process.argv.includes('--json')) { console.log(JSON.stringify(r, null, 2)); process.exit(0) }
console.log(`sistema   ${r.sistema} · ${r.cpus} CPUs · shell ${r.shell}`)
console.log(`node      ${r.node}`)
console.log(`ffmpeg    ${r.ffmpeg || 'NÃO ENCONTRADO'}`)
console.log(`python    ${r.python || 'NÃO ENCONTRADO'}${py ? ` (${py})` : ''}${py ? ` · numpy/scipy ${r.numpy_scipy ? 'ok' : 'faltando'}` : ''}`)
console.log(`playwright ${r.playwright || 'NÃO ENCONTRADO'}`)
console.log(`chromium  ${r.chromium ? 'ok' : 'NÃO ENCONTRADO'}`)
if (r.disco_livre_gb != null) console.log(`disco     ${r.disco_livre_gb} GB livres`)
console.log(`workers   ${r.workers_sugeridos} (render em paralelo)`)
if (falta.length) { console.log('\nFALTA:'); for (const f of r.falta) console.log(`  · ${f.o}: ${f.como}`) }
else console.log('\nTudo pronto para renderizar.')
process.exit(falta.some(([o]) => /ffmpeg|Playwright|Chromium/.test(o)) ? 2 : 0)
