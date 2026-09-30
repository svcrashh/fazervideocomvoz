// Acha o Playwright onde ele estiver nesta máquina (Mac, Linux ou Windows), sem instalar nada.
// Ordem: PLAYWRIGHT_PATH → node_modules do projeto/pasta atual → npm global → cache do npx.
const fs = require('fs'), path = require('path'), os = require('os')
const { execSync } = require('child_process')

function candidatos(projeto) {
  const out = []
  if (process.env.PLAYWRIGHT_PATH) out.push(process.env.PLAYWRIGHT_PATH)
  for (const base of [projeto, process.cwd(), __dirname].filter(Boolean)) {
    try { out.push(path.dirname(require.resolve('playwright/package.json', { paths: [base] }))) } catch {}
  }
  try { out.push(path.join(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(), 'playwright')) } catch {}
  const caches = [path.join(os.homedir(), '.npm', '_npx')]
  if (process.env.LOCALAPPDATA) caches.push(path.join(process.env.LOCALAPPDATA, 'npm-cache', '_npx'))
  if (process.env.APPDATA) caches.push(path.join(process.env.APPDATA, 'npm-cache', '_npx'))
  for (const c of caches) {
    let dirs = []
    try { dirs = fs.readdirSync(c) } catch { continue }
    const achados = dirs.map((d) => path.join(c, d, 'node_modules', 'playwright')).filter((p) => fs.existsSync(path.join(p, 'package.json')))
    achados.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
    out.push(...achados)
  }
  return [...new Set(out)].filter((p) => fs.existsSync(path.join(p, 'package.json')))
}

function carregar(projeto) {
  const cs = candidatos(projeto)
  for (const c of cs) {
    try { const pw = require(c); if (pw.chromium) return { pw, onde: c } } catch {}
  }
  const err = new Error('Playwright não encontrado nesta máquina.\n' +
    'Instale dentro da pasta do projeto do vídeo:\n  npm i -D playwright && npx playwright install chromium')
  err.code = 'SEM_PLAYWRIGHT'
  throw err
}

async function abrirNavegador(projeto) {
  const { pw, onde } = carregar(projeto)
  try {
    const browser = await pw.chromium.launch({ args: ['--allow-file-access-from-files', '--force-color-profile=srgb', '--font-render-hinting=none', '--autoplay-policy=no-user-gesture-required'] })
    return { browser, onde }
  } catch (e) {
    const err = new Error(`O Playwright (${onde}) não conseguiu abrir o Chromium.\nRode: npx playwright install chromium\n\n${e.message.split('\n')[0]}`)
    err.code = 'SEM_CHROMIUM'
    throw err
  }
}

module.exports = { candidatos, carregar, abrirNavegador }

if (require.main === module) {
  const cs = candidatos(process.argv[2])
  console.log(cs.length ? cs.join('\n') : 'nenhum Playwright encontrado')
}
