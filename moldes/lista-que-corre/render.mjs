#!/usr/bin/env node
// Renderiza o molde lista-que-corre a partir de um arquivo de parâmetros (exemplo.json).
//   node render.mjs <params.json> --saida <pasta> [--nome lumma-lista] [--formatos 16x9,9x16] [--modo final|rascunho]
//                   [--velocidade rajada|lista|cartaz] [--itens 1,2,3] [--voz] [--sem-trilha] [--so-montar]
// Monta <saida>/<nome>/ (index.html, engine.js, params.js, fontes/, midia/), gera a voz (com --voz, pela
// ElevenLabs da skill; a chave fica no cofre e nunca é impressa), renderiza cada formato e tira a folha de
// quadros. Sai <saida>/<nome>-<formato>.mp4 e <saida>/folha-<nome>-<formato>.png. OLHE as folhas.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync, execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const SKILL = path.resolve(AQUI, '..', '..')
const require = createRequire(import.meta.url)
const { planejar } = require(path.join(AQUI, 'molde', 'plano.js'))

const argv = process.argv.slice(2)
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d }
const tem = (k) => argv.includes('--' + k)
const exp = (p) => (p && p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p)
const arqParams = argv[0] && !argv[0].startsWith('--') ? path.resolve(argv[0]) : null
if (!arqParams || !opt('saida')) { console.error('uso: node render.mjs <params.json> --saida <pasta> [--nome x] [--formatos 16x9,9x16] [--modo final|rascunho] [--velocidade v] [--itens 1,2,3] [--voz]'); process.exit(1) }

const P = JSON.parse(fs.readFileSync(arqParams, 'utf8'))
if (opt('velocidade')) P.velocidade = opt('velocidade')
if (opt('itens')) {   // só alguns itens: os outros vão para o muro, para o tamanho da atualização continuar verdadeiro
  const quero = opt('itens').split(',').map((n) => +n - 1)
  const fora = P.itens.filter((_, i) => !quero.includes(i)).map((it) => it.etiqueta)
  P.itens = quero.map((i) => P.itens[i])
  if (P.muro) P.muro.extras = [...fora, ...(P.muro.extras || [])]
}
const nome = opt('nome', `${path.basename(arqParams, '.json')}-${P.velocidade || 'lista'}`)
const saida = path.resolve(exp(opt('saida')))
const proj = path.join(saida, nome)
const modo = opt('modo', 'final')
const formatos = opt('formatos', '16x9,9x16').split(',')
const dirParams = path.dirname(arqParams)
fs.mkdirSync(path.join(proj, 'midia'), { recursive: true })

// 1. arquivos do molde + o motor da skill
for (const f of ['index.html', 'plano.js', 'video.js', 'lista.js']) fs.copyFileSync(path.join(AQUI, 'molde', f), path.join(proj, f))
fs.copyFileSync(path.join(SKILL, 'assets', 'template', 'engine.js'), path.join(proj, 'engine.js'))

// 2. mídia: todo caminho de imagem do JSON é copiado para midia/ e reescrito
const copia = (src) => {
  const abs = path.resolve(dirParams, exp(src))
  if (!fs.existsSync(abs)) { console.error(`IMAGEM QUE FALTA: ${src} (procurei em ${abs})`); process.exit(1) }
  const dst = path.join('midia', path.basename(abs))
  fs.copyFileSync(abs, path.join(proj, dst))
  return dst
}
if (P.marca.logo) {
  P.marca.logo = copia(P.marca.logo)
  const b = fs.readFileSync(path.join(proj, P.marca.logo))   // PNG: largura e altura no IHDR, para centrar antes de a imagem carregar
  if (b.toString('ascii', 1, 4) === 'PNG') P.marca.logoAspecto = b.readUInt32BE(16) / b.readUInt32BE(20)
  else if (!P.marca.logoAspecto) { console.error('logo que não é PNG: ponha "logoAspecto" (largura ÷ altura) em "marca"'); process.exit(1) }
}
for (const it of P.itens) if (it.prova && it.prova.src) it.prova.src = copia(it.prova.src)

// 3. fontes dentro do projeto (sem depender de rede no render)
const familias = [...new Set(Object.values(P.marca.fontes))]
if (!fs.existsSync(path.join(proj, 'fontes', 'fontes.css')) || familias.some((f) => !fs.readFileSync(path.join(proj, 'fontes', 'fontes.css'), 'utf8').includes(`"${f}"`))) {
  const r = spawnSync(process.execPath, [path.join(SKILL, 'scripts', 'fontes.mjs'), proj, ...familias], { stdio: 'inherit' })
  if (r.status !== 0) { console.error('as fontes não vieram: veja a mensagem acima'); process.exit(1) }
}

// 4. voz: roteiro → ElevenLabs → locucao.json; a legenda usa os tempos de cada palavra
const plano = planejar(P)
const legendas = {}
let falasAudio = []
const dirVoz = path.join(proj, 'voz', 'v1')
if (tem('voz') && P.falas && P.falas.length) {
  const V = P.voz || {}
  if (!V.voz || !V.voz.id) { console.error('--voz pede "voz": { "voz": { "id": … } } no JSON'); process.exit(1) }
  const roteiro = { idioma: 'pt-BR', perfil: V.perfil || 'reels', voz: V.voz, ...(V.ajustes ? { ajustes: V.ajustes } : {}), pronuncia: V.pronuncia || {},
    falas: P.falas.map((f) => ({ id: f.id, onde: f.onde === 'abertura' ? 'abertura' : (f.onde === 'fecho' || f.onde === 'muro') ? 'fechamento' : { passo: (f.onde && f.onde.item) || 1 }, texto: f.texto })) }
  fs.mkdirSync(path.join(proj, 'voz'), { recursive: true })
  fs.writeFileSync(path.join(proj, 'voz', 'roteiro.json'), JSON.stringify(roteiro, null, 2))
  const r = spawnSync(process.execPath, [path.join(SKILL, 'scripts', 'voz.mjs'), 'gerar', path.join(proj, 'voz', 'roteiro.json'), '--saida', dirVoz, '--teto', '400'], { stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status || 1)
}
const arqLoc = path.join(dirVoz, 'locucao.json')
if (fs.existsSync(arqLoc)) {
  const loc = JSON.parse(fs.readFileSync(arqLoc, 'utf8'))
  for (const f of plano.falas) {
    const lf = loc.falas.find((x) => x.id === f.id)
    if (!lf) continue
    legendas[f.id] = lf.palavras.map((w) => ({ texto: w.texto, ini: w.ini, fim: w.fim }))
    const fim = f.em + lf.duracao
    const prox = plano.falas.find((g) => g.em > f.em)
    if (fim > plano.dur - 0.2) { console.error(`FALA "${f.id}" NÃO CABE: termina em ${fim.toFixed(2)} s e o vídeo tem ${plano.dur} s. Encurte a frase ou alongue o muro/fecho no "ritmo".`); process.exit(1) }
    if (prox && fim > prox.em - 0.1) { console.error(`FALA "${f.id}" ENCOSTA NA "${prox.id}": termina em ${fim.toFixed(2)} s, a próxima começa em ${prox.em} s.`); process.exit(1) }
    const iv = lf.inicio_voz || 0
    falasAudio.push({ arq: path.join(dirVoz, lf.arquivo), em: f.em, dur: lf.duracao, id: f.id, texto: lf.texto, som: f.em + iv, fim: f.em + lf.palavras[lf.palavras.length - 1].fim })
  }
}
fs.writeFileSync(path.join(proj, 'params.js'), `// gerado pelo render.mjs a partir de ${path.basename(arqParams)}\nconst PARAMS = ${JSON.stringify({ ...P, legendas }, null, 2)}\n`)
const voz = plano.falas.reduce((a, f) => a + (falasAudio.find((x) => x.em === f.em)?.dur || 0), 0)
console.log(`plano · ${plano.velocidade} · ${P.itens.length} itens · ${plano.dur} s · voz ${voz.toFixed(1)} s (${Math.round((voz / plano.dur) * 100)}% do tempo)`)
for (const s of plano.secoes) console.log(`  ${s.t0.toFixed(2).padStart(6)}–${s.t1.toFixed(2).padEnd(6)} ${s.tipo}${s.i != null ? ' ' + (s.i + 1) : ''}`)

// 5. áudio: trilha original da skill (arranjo_serie.py) que cede à voz (mix_voz.py, Contrato M), com um acento em
// cada corte de trecho. Sem Python com numpy/scipy (ou com --sem-trilha): só a voz, normalizada em -16 LUFS.
let wav = null, comTrilha = false
const pyOk = (py) => spawnSync(py, ['-c', 'import numpy, scipy'], { stdio: 'ignore' }).status === 0
const PY = [process.env.FAZERVIDEO_PY, process.env.PYTHON, 'python3'].find((p) => p && pyOk(p))
if (falasAudio.length && !tem('sem-trilha') && !PY) console.error('AVISO: sem Python com numpy e scipy (FAZERVIDEO_PY=…), o vídeo sai só com a voz, sem trilha')
if (falasAudio.length && !tem('sem-trilha') && PY) {
  const dirAudio = path.join(proj, 'audio')
  fs.mkdirSync(dirAudio, { recursive: true })
  for (const f of ['trilha.wav', 'final.wav']) fs.rmSync(path.join(dirAudio, f), { force: true })
  const { escreverVozWav, blocoFolha, srt } = await import(path.join(SKILL, 'scripts', 'tutorial', 'locucao.mjs'))
  const falas = falasAudio.map((f) => ({ id: f.id, texto: f.texto, caminho: f.arq, inicioArquivo: f.em, som: +f.som.toFixed(3), fim: +f.fim.toFixed(3) }))
  escreverVozWav(falas, plano.dur, path.join(dirAudio, 'voz.wav'))
  const T = P.trilha || {}
  const rajada = plano.velocidade === 'rajada'
  const nomeSecao = (s) => (s.tipo === 'fecho' ? 'fechamento' : s.tipo === 'item' ? `item-${s.i + 1}` : s.tipo)
  const folha = {
    titulo: `${P.marca.nome} · lista que corre (${plano.velocidade})`, duracao: plano.dur, bpm: 120, compasso: 4, taxa: 48000, saida: 'trilha.wav',
    loudness_lufs: -14.0, teto_dbtp: -1.5, semente: T.semente ?? P.semente ?? 7, silencios: [], fade: [+Math.min(plano.dur - 0.2, Math.max(plano.dur - 0.8, falas[falas.length - 1].fim + 0.05)).toFixed(3), plano.dur],   // o fade não come a última palavra
    secoes: plano.secoes.map((s) => ({ nome: nomeSecao(s), de: s.t0, ate: s.t1, energia: s.tipo === 'abertura' || s.tipo === 'fecho' ? 'media' : rajada || s.tipo === 'muro' ? 'alta' : 'media' })),
    // cada corte (entra item, muro, fecho) é um acento musical na amostra exata; na rajada ele é obrigatório (a batida do corte)
    marcos: plano.secoes.slice(1).map((s) => ({ t: s.t0, evento: `entra ${nomeSecao(s)}`, som: 'acento no corte', opcional: !rajada })),
    voz: blocoFolha(falas, (P.voz && P.voz.perfil) || 'reels'),
  }
  const BPM = { rajada: [118, 128], lista: [100, 112], cartaz: [88, 100] }[plano.velocidade]
  const ident = { versao: 2, nome: `${P.marca.nome} · lista que corre`, papel: 'fundo', densidade: 'baixa', loudness_lufs: -14.0,
    bpm: BPM, modos: ['maior', 'mixolidio', 'dorico'], tons: ['C', 'D', 'F', 'G', 'A'],
    instrumentos: { harmonia: ['epiano', 'piano'], baixo: ['bass_note'], percussao: ['kick', 'clap', 'hat', 'shaker'], melodia: ['pluck'], textura: ['pad_note'] },
    ...(T.identidade || {}) }
  if (!T.identidade) console.log('trilha: sem "trilha.identidade" no JSON, uso uma identidade neutra (declare o gênero do público: assets/audio/API.md)')
  fs.writeFileSync(path.join(dirAudio, 'identidade.json'), JSON.stringify(ident, null, 2) + '\n')
  fs.writeFileSync(path.join(proj, 'legenda.srt'), srt(falas))
  // compõe e mede (verifica.py). A −14 LUFS, com pouca voz e cama esparsa, o limiter do master chega a 7 dB e
  // aperta uma fala mais que a outra (medido na Brotto rajada): aí recompõe a −16, o nível que o molde já usava.
  for (const lufs of [-14, -16]) {
    folha.loudness_lufs = lufs
    fs.writeFileSync(path.join(dirAudio, 'folha.json'), JSON.stringify(folha, null, 1) + '\n')
    const r = spawnSync(PY, [path.join(SKILL, 'assets', 'audio', 'arranjo_serie.py'), 'identidade.json', 'folha.json'], { cwd: dirAudio, stdio: 'inherit' })
    if (r.status !== 0 || !fs.existsSync(path.join(dirAudio, 'trilha.wav'))) { console.error('a trilha não saiu (veja acima); rode com --sem-trilha para sair só com a voz'); process.exit(1) }
    const m = spawnSync(PY, [path.join(SKILL, 'assets', 'audio', 'verifica.py'), 'folha.json'], { cwd: dirAudio, encoding: 'utf8' })
    const falhas = (m.stdout || '').split('\n').filter((l) => /FALHOU/.test(l))
    if (m.status === 0) { console.log(`trilha: verifica.py tudo OK a ${lufs} LUFS (marcos, voz acima da trilha, loudness, pico)`); break }
    console.error(`trilha a ${lufs} LUFS reprovada no verifica.py:\n${falhas.join('\n')}`)
    if (lufs === -16) { console.error('AVISO: a trilha saiu reprovada; leia audio/folha.json e rode o verifica.py à mão'); process.exitCode = 1 }
  }
  wav = path.join(dirAudio, 'trilha.wav')
  comTrilha = true
}
if (falasAudio.length && !comTrilha) {
  wav = path.join(proj, 'audio', 'final.wav')
  fs.mkdirSync(path.dirname(wav), { recursive: true })
  const ins = falasAudio.flatMap((f) => ['-i', f.arq])
  const atrasos = falasAudio.map((f, i) => `[${i}:a]aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(f.em * 1000)}:all=1[a${i}]`).join(';')
  const mix = `${atrasos};${falasAudio.map((_, i) => `[a${i}]`).join('')}amix=inputs=${falasAudio.length}:normalize=0,apad,atrim=0:${plano.dur},loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[o]`
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...ins, '-filter_complex', mix, '-map', '[o]', '-ar', '48000', wav])
}
if (tem('so-montar')) process.exit(0)

// 6. render de cada formato + folha de quadros
let falhou = 0
for (const f of formatos) {
  const r = spawnSync(process.execPath, [path.join(SKILL, 'scripts', 'render.cjs'), '--projeto', proj, '--modo', modo, '--formato', f, '--saida', `out/${f}.mp4`, '--sem-folha', ...(opt('sub') ? ['--sub', opt('sub')] : [])], { stdio: 'inherit' })
  if (r.status !== 0) { console.error(`✗ ${f}: o render saiu com código ${r.status}`); falhou++; continue }
  const mp4 = path.join(proj, 'out', `${f}.mp4`), final = path.join(saida, `${nome}-${f}.mp4`)
  if (comTrilha) {   // junta e confere a entrega: duração, loudness, pico, e cada fala no tempo e acima da trilha, já em AAC
    // timeout: já vi o node travar no process.exit do finalizar (depois de imprimir o resultado), uma vez em três
    const v = spawnSync(process.execPath, [path.join(SKILL, 'scripts', 'finalizar.mjs'), '--projeto', proj, '--video', `out/${f}.mp4`, '--audio', 'audio/trilha.wav', '--saida', final],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 180000 })
    process.stdout.write(v.stdout || ''); process.stderr.write(v.stderr || '')
    if (v.status !== 0 && !/entrega verificada\./.test(v.stdout || '')) { console.error(`✗ ${f}: o finalizar acusou problema na entrega (acima)`); falhou++ }
  } else if (wav) execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', mp4, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', final])
  else fs.copyFileSync(mp4, final)
  const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', final]).toString().trim()
  const [escala, grade] = { '9x16': ['270:-1', '8x3'], '16x9': ['480:-1', '6x4'], '1x1': ['360:-1', '6x4'], '4x5': ['324:-1', '6x4'] }[f]
  const folha = path.join(saida, `folha-${nome}-${f}.png`)
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', final, '-vf', `fps=24/${dur},scale=${escala},tile=${grade}`, '-frames:v', '1', folha])
  console.log(`✓ ${nome} ${f} · ${dur.toFixed(2)} s · OLHE a folha: ${folha}`)
}
process.exitCode = falhou ? 1 : process.exitCode || 0
