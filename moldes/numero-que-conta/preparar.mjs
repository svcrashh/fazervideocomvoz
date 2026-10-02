#!/usr/bin/env node
// Monta a pasta de um vídeo do molde "número que conta" a partir de um arquivo de parâmetros.
//   node preparar.mjs <parametros.json> <pasta-do-video> [--locucao voz/pt/locucao.json]
// Sem --locucao: copia o molde, baixa as fontes, escreve params.js e voz/roteiro.json (para gerar a voz).
// Com --locucao: põe a duração e as palavras de cada fala nos blocos (legenda palavra a palavra), e escreve
// audio/voz.wav, audio/folha.json (bloco "voz", seções, whoosh em cada troca de bloco) e audio/identidade.json.
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const SKILL = path.resolve(AQUI, '..', '..')
const args = process.argv.slice(2)
const opt = (k) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : null }
const [arqParams, pastaArg] = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')))
if (!arqParams || !pastaArg) { console.error('uso: node preparar.mjs <parametros.json> <pasta-do-video> [--locucao voz/pt/locucao.json]'); process.exit(1) }
const pasta = path.resolve(pastaArg)
const P = JSON.parse(fs.readFileSync(arqParams, 'utf8'))
const base = path.dirname(path.resolve(arqParams))
fs.mkdirSync(path.join(pasta, 'midia'), { recursive: true })

for (const f of ['index.html', 'video.js', 'molde.js']) fs.copyFileSync(path.join(AQUI, f), path.join(pasta, f))
fs.copyFileSync(path.join(SKILL, 'assets', 'template', 'engine.js'), path.join(pasta, 'engine.js'))

if (P.marca.logo) {
  const src = path.resolve(base, P.marca.logo), dst = path.join('midia', path.basename(src))
  fs.copyFileSync(src, path.join(pasta, dst))
  P.marca.logo = dst
}

const familias = [...new Set([P.marca.fontes.numero.familia, P.marca.fontes.texto.familia, (P.marca.fontes.etiqueta || P.marca.fontes.texto).familia])]
const css = path.join(pasta, 'fontes', 'fontes.css')
const temTodas = fs.existsSync(css) && familias.every((f) => fs.readFileSync(css, 'utf8').includes(`"${f}"`))
if (!temTodas) execFileSync('node', [path.join(SKILL, 'scripts', 'fontes.mjs'), pasta, ...familias], { stdio: 'inherit' })

// falas: { texto, em } em cada bloco; id b1, b2… pela posição do bloco
const emPadrao = (b) => (b.tipo === 'contador' ? (b.sozinho ?? 1.6) + 0.25 : 0.45)
P.blocos.forEach((b, i) => { if (typeof b.fala === 'string') b.fala = { texto: b.fala }; if (b.fala) { b.fala.id = `b${i + 1}`; b.fala.em ??= emPadrao(b) } })
const comFala = P.blocos.filter((b) => b.fala)

const loc = opt('locucao') ? path.resolve(opt('locucao')) : null
if (loc) {
  const L = JSON.parse(fs.readFileSync(loc, 'utf8'))
  for (const b of comFala) {
    const f = L.falas.find((x) => x.id === b.fala.id)
    if (!f) throw new Error(`a locução não tem a fala ${b.fala.id} ("${b.fala.texto}"): gere a voz de novo`)
    if (f.texto !== b.fala.texto) throw new Error(`a fala ${b.fala.id} mudou desde a locução ("${f.texto}" → "${b.fala.texto}"): gere a voz de novo`)
    const iv = f.inicio_voz || 0
    b.fala.dur = +(f.palavras[f.palavras.length - 1].fim - iv).toFixed(3)
    b.fala.palavras = f.palavras.map((w) => ({ texto: w.texto, ini: +(w.ini - iv).toFixed(3), fim: +(w.fim - iv).toFixed(3) }))
    b.fala._arquivo = path.resolve(path.dirname(loc), f.arquivo)
    b.fala._iv = iv
  }
}

const paramsJs = `// gerado por preparar.mjs a partir de ${path.basename(arqParams)} — edite o JSON, não este arquivo\nconst PARAMS = ${JSON.stringify(P, (k, v) => (k.startsWith('_') ? undefined : v), 2)}\n`
fs.writeFileSync(path.join(pasta, 'params.js'), paramsJs)

// roteiro de locução (Contrato da skill: references/voz-locucao.md §6)
if (comFala.length && P.voz) {
  fs.mkdirSync(path.join(pasta, 'voz'), { recursive: true })
  const roteiro = { idioma: P.idioma || 'pt-BR', perfil: P.voz.perfil || 'reels', voz: { id: P.voz.id, nome: P.voz.nome, modelo: P.voz.modelo || 'eleven_multilingual_v2' },
    ...(P.voz.ajustes ? { ajustes: P.voz.ajustes } : {}), pronuncia: P.voz.pronuncia || {},
    falas: comFala.map((b) => ({ id: b.fala.id, onde: { passo: P.blocos.indexOf(b) + 1 }, texto: b.fala.texto })) }
  fs.writeFileSync(path.join(pasta, 'voz', 'roteiro.json'), JSON.stringify(roteiro, null, 2) + '\n')
}

// a mesma linha do tempo do navegador (video.js), rodada aqui
const ctx = { PARAMS: JSON.parse(JSON.stringify(P)), Math, console }
vm.createContext(ctx)
vm.runInContext(fs.readFileSync(path.join(AQUI, 'video.js'), 'utf8') + '\n;this.LINHA = LINHA; this.VIDEO = VIDEO', ctx)
const { LINHA, VIDEO } = ctx
console.log(`duração ${VIDEO.duracao} s · ` + LINHA.map((b) => `${b.tipo} ${b.t0.toFixed(2)}–${b.t1.toFixed(2)}`).join(' · '))
const falado = comFala.reduce((s, b) => s + (b.fala.dur || 0), 0)
if (loc) console.log(`voz fala ${falado.toFixed(1)} s de ${VIDEO.duracao} s (${Math.round((100 * falado) / VIDEO.duracao)}%)`)

if (loc) {
  const { escreverVozWav, blocoFolha } = await import(path.join(SKILL, 'scripts', 'tutorial', 'locucao.mjs'))
  fs.mkdirSync(path.join(pasta, 'audio'), { recursive: true })
  const falas = LINHA.filter((b) => b.fala).map((b) => {
    const src = comFala.find((x) => x.fala.id === b.fala.id).fala
    const som = b.t0 + b.fala.em
    return { id: b.fala.id, texto: b.fala.texto, caminho: src._arquivo, inicioArquivo: som - src._iv, som, fim: som + b.fala.dur }
  })
  escreverVozWav(falas, VIDEO.duracao, path.join(pasta, 'audio', 'voz.wav'))
  const folha = {
    titulo: VIDEO.titulo, duracao: VIDEO.duracao, bpm: 120, compasso: 4, taxa: 48000, saida: 'trilha.wav',
    loudness_lufs: -14.0, teto_dbtp: -1.5, semente: P.trilha?.semente ?? 7, silencios: [], fade: [Math.max(0, VIDEO.duracao - 0.8), VIDEO.duracao],
    secoes: LINHA.map((b, i) => ({ nome: i === 0 ? 'abertura' : b.i === LINHA.length - 1 ? 'fechamento' : `${b.tipo}-${i + 1}`, de: +b.t0.toFixed(3), ate: +b.t1.toFixed(3), energia: 'media' })),
    marcos: LINHA.slice(1).map((b) => ({ t: +b.t0.toFixed(3), evento: `entra ${b.tipo}`, som: 'whoosh', opcional: true })),
    voz: blocoFolha(falas, P.voz?.perfil || 'reels'),
  }
  fs.writeFileSync(path.join(pasta, 'audio', 'folha.json'), JSON.stringify(folha, null, 1) + '\n')
  const ident = { versao: 2, nome: `${P.marca.nome} · número que conta`, papel: 'fundo', loudness_lufs: -14.0, densidade: 'baixa', ...(P.trilha?.identidade || {}) }
  fs.writeFileSync(path.join(pasta, 'audio', 'identidade.json'), JSON.stringify(ident, null, 2) + '\n')
  fs.writeFileSync(path.join(pasta, 'legenda.srt'), (await import(path.join(SKILL, 'scripts', 'tutorial', 'locucao.mjs'))).srt(falas))
}
console.log(`pronto: ${pasta}`)
