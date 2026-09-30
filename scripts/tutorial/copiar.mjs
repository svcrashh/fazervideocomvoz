// Copia o motor do modo tutorial para dentro de um repositório, para os vídeos rodarem sem a skill
// instalada (outra máquina, Windows, CI). A cópia tem o mesmo layout da skill, então os caminhos
// relativos continuam valendo. Recopie quando a skill melhorar: o MOTOR.md diz de quando é a cópia.
//   node copiar.mjs <destino>        ex.: node copiar.mjs docs/videos/_motor
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const SKILL = path.resolve(AQUI, '..', '..')
const destino = process.argv[2]
if (!destino) { console.error('uso: node copiar.mjs <destino>'); process.exit(1) }
const D = path.resolve(destino)
const ARQUIVOS = [
  'scripts/playwright.cjs', 'scripts/quadros.cjs', 'scripts/render.cjs', 'scripts/finalizar.mjs', 'scripts/fontes.mjs', 'scripts/logo.mjs',
  ...fs.readdirSync(path.join(SKILL, 'scripts/tutorial')).filter((f) => /\.(mjs|js|cjs)$/.test(f)).map((f) => 'scripts/tutorial/' + f),
  ...fs.readdirSync(path.join(SKILL, 'assets/template')).filter((f) => /\.(js|html)$/.test(f)).map((f) => 'assets/template/' + f),
  'assets/audio/synth.py', 'assets/audio/verifica.py', 'assets/audio/sons.py', 'assets/audio/serie.py', 'assets/audio/arranjo_serie.py', 'assets/audio/API.md',
  'references/tutorial.md',
]
// Só existem na skill com voz: vão junto quando estão lá, sem aviso quando não estão.
const DA_VOZ = ['assets/audio/mix_voz.py', 'references/voz-tutorial.md', 'references/voz-mix.md']
ARQUIVOS.push(...DA_VOZ.filter((f) => fs.existsSync(path.join(SKILL, f))))
let n = 0
for (const f of ARQUIVOS) {
  const de = path.join(SKILL, f)
  if (!fs.existsSync(de)) { console.error(`aviso: ${f} não existe na skill`); continue }
  fs.mkdirSync(path.dirname(path.join(D, f)), { recursive: true })
  fs.copyFileSync(de, path.join(D, f)); n++
}
fs.writeFileSync(path.join(D, 'MOTOR.md'), `# Motor de tutoriais (cópia da skill /fazervideo)

Copiado em ${new Date().toISOString().slice(0, 10)} por \`scripts/tutorial/copiar.mjs\`. Não edite aqui: melhore na skill
e copie de novo (\`node <skill>/scripts/tutorial/copiar.mjs ${destino}\`). O contrato está em
\`references/tutorial.md\`.

- Gravar: \`node <pasta-do-video>/video.mjs [--versao celular] [--check]\`
- Compor: \`node ${destino}/scripts/tutorial/compor.mjs <pasta-do-video> [--modo final]\`
- Precisa de: Node 18+, ffmpeg, Playwright com Chromium (\`npx playwright install chromium\`) e Python 3 com
  numpy + scipy num venv (\`python -m venv .venv\`; macOS/Linux \`.venv/bin/pip install numpy scipy\`,
  Windows \`.venv\\Scripts\\pip install numpy scipy\`), ou \`FAZERVIDEO_PYTHON\` apontando para ele.
- Não versione: \`*/saida/\`, \`*.mp4\`, \`.venv/\` (ponha no .gitignore).
`)
console.log(`${n} arquivos copiados para ${D} (+ MOTOR.md)`)
