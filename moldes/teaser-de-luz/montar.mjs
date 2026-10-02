#!/usr/bin/env node
// Monta um projeto de vídeo do teaser-de-luz a partir de um arquivo de parâmetros.
//   node montar.mjs exemplo.json <pasta-do-projeto>
// Escreve video.js e parametros.js, copia o motor, a cena e a mídia citada no JSON (caminhos relativos ao
// próprio JSON, ou com ~) e coloca as três fontes em fontes/ pelo scripts/fontes.mjs da skill.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const SKILL = path.resolve(AQUI, '..', '..')
const [arqJson, destino] = process.argv.slice(2)
if (!arqJson || !destino) { console.error('uso: node montar.mjs exemplo.json <pasta-do-projeto>'); process.exit(1) }
const exp = (p) => (p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p)
const base = path.dirname(path.resolve(arqJson))
const M = JSON.parse(fs.readFileSync(arqJson, 'utf8'))
const proj = path.resolve(exp(destino))
fs.mkdirSync(path.join(proj, 'midia'), { recursive: true })

const erros = []
if (!M.fragmentos?.length || M.fragmentos.length > 5) erros.push('fragmentos: de 1 a 5 (3 é o ponto certo para 12–20 s)')
for (const [i, f] of (M.fragmentos || []).entries()) if (!['numero', 'campo', 'lista', 'botao', 'imagem', 'cartao'].includes(f.tipo)) erros.push(`fragmentos[${i}].tipo: ${f.tipo} não existe`)
if (!M.revelacao?.imagem && !M.revelacao?.blocos) erros.push('revelacao: precisa de imagem ou blocos')
if (!M.promessa) erros.push('promessa: a frase que aparece no quadro 0')
const D = M.duracao || 16
const sobra = D - 0.9 - (M.tempos?.revelacao ?? 3.8) - (M.tempos?.fecho ?? 3.6)
if (sobra / (M.fragmentos?.length || 1) < 1.8) erros.push(`duracao ${D} s: cada fragmento fica com ${(sobra / M.fragmentos.length).toFixed(2)} s; precisa de 1,8 s ou mais`)
if (erros.length) { console.error('Parâmetros com problema:\n  - ' + erros.join('\n  - ')); process.exit(1) }

// mídia: copia e reescreve o caminho
const copiar = (p) => {
  const src = path.resolve(base, exp(p)), nome = path.basename(src)
  if (!fs.existsSync(src)) { console.error(`não achei a mídia ${src}`); process.exit(1) }
  fs.copyFileSync(src, path.join(proj, 'midia', nome))
  return 'midia/' + nome
}
for (const f of M.fragmentos) if (f.arquivo) f.arquivo = copiar(f.arquivo)
if (M.revelacao.imagem) M.revelacao.imagem.arquivo = copiar(M.revelacao.imagem.arquivo)
if (M.logo?.arquivo) M.logo.arquivo = copiar(M.logo.arquivo)

const fontes = [...new Set([M.fontes.titulo, M.fontes.texto, M.fontes.mono])]
const VIDEO = {
  titulo: M.titulo || `Teaser · ${M.marca}`, duracao: D, formatos: M.formatos || ['16x9', '9x16'],
  plataforma: M.plataforma || null, fontes, fundo: M.cores.fundo, grao: M.grao ?? 0.06, impactos: [], selo: null,
  audio: 'audio/mix.wav',
}
fs.writeFileSync(path.join(proj, 'video.js'), `// Gerado por montar.mjs a partir de ${path.basename(arqJson)}\nconst VIDEO = ${JSON.stringify(VIDEO, null, 2)}\n`)
fs.writeFileSync(path.join(proj, 'parametros.js'), `// Gerado por montar.mjs a partir de ${path.basename(arqJson)}\nconst PARAM = ${JSON.stringify(M, null, 2)}\n`)
for (const f of ['index.html', 'teaser.js']) fs.copyFileSync(path.join(AQUI, f), path.join(proj, f))
fs.copyFileSync(path.join(SKILL, 'assets', 'template', 'engine.js'), path.join(proj, 'engine.js'))

const css = path.join(proj, 'fontes', 'fontes.css')
const faltam = fontes.filter((f) => !(fs.existsSync(css) && fs.readFileSync(css, 'utf8').includes(`"${f}"`)))
if (faltam.length) {
  const r = spawnSync(process.execPath, [path.join(SKILL, 'scripts', 'fontes.mjs'), proj, ...faltam], { stdio: 'inherit' })
  if (r.status !== 0) { console.error('as fontes não vieram: rode scripts/fontes.mjs à mão'); process.exit(1) }
}
const FR = sobra / M.fragmentos.length, tRev = 0.9 + M.fragmentos.length * FR, tFecho = tRev + (M.tempos?.revelacao ?? 3.8)
console.log(`projeto pronto: ${proj}`)
console.log(`tempos: fragmentos de ${FR.toFixed(2)} s a partir de 0,90 · revelação em ${tRev.toFixed(2)} · fecho em ${tFecho.toFixed(2)} · fim ${D}`)
