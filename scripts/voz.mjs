#!/usr/bin/env node
// Voz em off da /fazervideocomvoz pela API da ElevenLabs. Só Node (fetch) e ffmpeg: nada de Python na
// rede, porque o Python de algumas máquinas falha HTTPS (CERTIFICATE_VERIFY_FAILED).
//   conta                                        plano, créditos usados e limite
//   buscar [--idioma pt] [--sotaque …] [--genero …] [--idade …] [--uso …] [--descritivo …] [--busca …]
//          [--ordem usage_character_count_1y] [--n 12] [--aviso-min 180] [--json]
//                                                vozes da biblioteca que se pode usar num vídeo
//   amostras (--roteiro r.json [--fala id] | --frase "…" [--perfil calmo]) --vozes a,b,c [--saida pasta]
//                                                a mesma frase lida por N vozes
//   gerar roteiro.json --saida <video>/voz/<versao> [--teto 1500] [--sim] [--refazer id,id] [--takes pasta]
//                                                locucao.json (Contrato L) + falas/*.wav, com o take em cache
//   conferir locucao.json [--tolerancia 0.08] [--fala id] [--detalhe]   alinhamento forçado: cada palavra a ±80 ms
//   ouvir locucao.json [--palavras "Nome,Sigla"] [--fala id]   transcreve cada fala e confere as palavras de risco
//   validar locucao.json                         o Contrato L, sem rede
// Todo comando aceita --registro <arquivo.jsonl>: uma linha por chamada à API, sem a chave.
// A chave vem de ELEVENLABS_API_KEY ou de ~/.claude/secrets/elevenlabs.env e nunca é impressa.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

export const FORMATO = 'mp3_44100_128'
export const MODELO = 'eleven_multilingual_v2'
export const TAXA = 48000
export const PERFIS = {
  calmo: { speed: 0.95, stability: 0.55, similarity_boost: 0.75, style: 0, use_speaker_boost: true },
  reels: { speed: 1.08, stability: 0.42, similarity_boost: 0.75, style: 0, use_speaker_boost: true },
}
const TETO = 1500
const TOLERANCIA = 0.08
const AVISO_MIN = 180

export class Falha extends Error {
  constructor(msg, codigo = 1) { super(msg); this.codigo = codigo }
}

const r3 = (v) => Math.round(v * 1000) / 1000
const num = (s) => (s == null || s === '' || !Number.isFinite(+s) ? null : +s)
const lista = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean)
const dormir = (ms) => new Promise((r) => setTimeout(r, ms))
const dataBr = (unix) => new Date(unix * 1000).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
const lerJson = (arq, oque) => {
  if (!fs.existsSync(arq)) throw new Falha(`Não achei ${oque}: ${arq}`)
  try { return JSON.parse(fs.readFileSync(arq, 'utf8')) } catch (e) { throw new Falha(`${arq} não é um JSON válido: ${e.message}`) }
}

// ── chave ────────────────────────────────────────────────────────────────────────────────────────
export const arquivoChave = () => path.join(os.homedir(), '.claude', 'secrets', 'elevenlabs.env')
// Os dois comandos leem a chave sem mostrar na tela e gravam o arquivo só para a própria pessoa.
const CHAVE_MAC = `mkdir -p ~/.claude/secrets && printf 'Cole a chave da ElevenLabs e tecle Enter: ' && read -rs k && echo && (umask 077; printf 'ELEVENLABS_API_KEY=%s\\n' "$k" > ~/.claude/secrets/elevenlabs.env) && unset k && echo 'Chave guardada.'`
const CHAVE_WIN = `$d = "$env:USERPROFILE\\.claude\\secrets"; New-Item -ItemType Directory -Force $d | Out-Null; $s = Read-Host 'Cole a chave da ElevenLabs e tecle Enter' -AsSecureString; Set-Content -Path "$d\\elevenlabs.env" -Encoding ascii -Value ("ELEVENLABS_API_KEY=" + [System.Net.NetworkCredential]::new('', $s).Password); Remove-Variable s; 'Chave guardada.'`
export function comoPorChave() {
  const mac = `  Mac ou Linux (Terminal, zsh ou bash):\n    ${CHAVE_MAC}`
  const win = `  Windows (PowerShell):\n    ${CHAVE_WIN}`
  return `Não achei a chave da ElevenLabs (${arquivoChave()}).
Crie a chave em elevenlabs.io → Developers → API Keys e rode, no seu terminal (não no chat), o comando do seu sistema.
Ele pede a chave sem mostrar o que você cola:
${process.platform === 'win32' ? `${win}\n${mac}` : `${mac}\n${win}`}
Ou exporte ELEVENLABS_API_KEY no ambiente. Nunca cole a chave numa conversa.`
}
let chaveLida = null
export function lerChave() {
  if (chaveLida) return chaveLida
  let k = (process.env.ELEVENLABS_API_KEY || '').trim()
  if (!k && fs.existsSync(arquivoChave())) {
    for (const l of fs.readFileSync(arquivoChave(), 'utf8').split(/\r?\n/)) {
      const m = l.match(/^\s*(?:export\s+)?ELEVENLABS_API_KEY\s*=\s*(.*?)\s*$/)
      if (m) k = m[1].replace(/^(['"])(.*)\1$/, '$2').trim()
    }
  }
  if (!k) throw new Falha(comoPorChave())
  chaveLida = k
  return k
}
// Nenhuma mensagem, erro ou registro sai com a chave, nem quando a API a devolve no corpo.
export const limpar = (s) => (chaveLida ? String(s ?? '').split(chaveLida).join('«chave»') : String(s ?? ''))

// ── API ──────────────────────────────────────────────────────────────────────────────────────────
const estado = { chamadas: 0, registro: null, comando: '' }
const base = () => process.env.ELEVENLABS_API_BASE || 'https://api.elevenlabs.io'

function registrar(linha) {
  estado.chamadas++
  if (!estado.registro) return
  fs.mkdirSync(path.dirname(estado.registro), { recursive: true })
  fs.appendFileSync(estado.registro, limpar(JSON.stringify({ quando: new Date().toISOString(), comando: estado.comando, ...linha })) + '\n')
}

// Erro da API: {"detail": {"code", "message", "status" (legado)}}. Crédito acabado vem como 402
// insufficient_credits ou, no formato antigo, 401/400 quota_exceeded.
function erroApi(status, corpo) {
  let d = {}
  try { d = JSON.parse(corpo).detail ?? {} } catch {}
  const tipo = typeof d === 'string' ? '' : d.code || d.status || ''
  const msg = typeof d === 'string' ? d : d.message || ''
  const semCredito = /quota|insufficient_credits/i.test(tipo)
  const quer = semCredito
    ? 'Os créditos da conta acabaram. Veja o saldo com `voz.mjs conta` e espere a renovação ou suba o plano.'
    : {
      401: `A ElevenLabs recusou a chave (401). Confira a linha ELEVENLABS_API_KEY em ${arquivoChave()}, sem colar a chave numa conversa.`,
      402: 'Isso pede um plano pago na ElevenLabs (402). Veja o plano com `voz.mjs conta`.',
      404: 'A ElevenLabs não achou isso (404). Confira o voice_id: copie de `voz.mjs buscar`.',
      422: 'A ElevenLabs recusou o pedido (422): algum campo está fora do que ela aceita.',
      429: 'Muitas requisições ao mesmo tempo (429). Espere um minuto e rode de novo: o que já saiu está no cache.',
    }[status] || `A ElevenLabs respondeu ${status}.`
  const e = new Falha(limpar(`${quer}${tipo ? ` [${tipo}]` : ''}${msg ? ` ${msg}` : ''}`))
  e.status = status
  return e
}

async function api(metodo, caminho, { consulta, json, form, fala, caracteres, tolerar = [] } = {}) {
  const url = new URL(caminho, base())
  for (const [k, v] of Object.entries(consulta || {})) {
    for (const x of [v].flat()) if (x != null && x !== '') url.searchParams.append(k, String(x))
  }
  const headers = { 'xi-api-key': lerChave(), accept: 'application/json' }
  let body
  if (json) { headers['content-type'] = 'application/json'; body = JSON.stringify(json) }
  if (form) body = form
  for (let tentativa = 0; ; tentativa++) {
    const t0 = Date.now()
    let r
    try {
      r = await fetch(url, { method: metodo, headers, body })
    } catch (e) {
      registrar({ metodo, caminho: url.pathname, status: 0, erro: e.cause?.code || e.message })
      throw new Falha(limpar(`Não consegui falar com a ElevenLabs (${e.cause?.code || e.message}). Confira a internet e rode de novo.`))
    }
    const corpo = await r.text()
    registrar({ metodo, caminho: url.pathname + url.search, status: r.status, ms: Date.now() - t0, request_id: r.headers.get('request-id'), custo: num(r.headers.get('character-cost')), caracteres, fala })
    // 429 é recusa antes de processar: repetir não cobra duas vezes. 5xx pode ter processado, então não repete.
    if (r.status === 429 && tentativa < 2) { await dormir((num(r.headers.get('retry-after')) ?? 2 * 2 ** tentativa) * 1000); continue }
    if (tolerar.includes(r.status)) { let d = null; try { d = JSON.parse(corpo) } catch {} return { dados: null, erro: d?.detail ?? null, corpo, cab: r.headers, status: r.status } }
    if (!r.ok) throw erroApi(r.status, corpo)
    try { return { dados: corpo ? JSON.parse(corpo) : null, cab: r.headers, status: r.status } } catch { throw new Falha(`A ElevenLabs respondeu algo que não é JSON em ${url.pathname}.`) }
  }
}

// ── áudio ────────────────────────────────────────────────────────────────────────────────────────
export function lerWav(arq) {
  const b = fs.readFileSync(arq)
  if (b.length < 12 || b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') throw new Falha(`${arq} não é um WAV.`)
  let fmt = null, dados = null
  for (let p = 12; p + 8 <= b.length; ) {
    const id = b.toString('ascii', p, p + 4), n = b.readUInt32LE(p + 4)
    if (id === 'fmt ') fmt = { formato: b.readUInt16LE(p + 8), canais: b.readUInt16LE(p + 10), taxa: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22) }
    if (id === 'data') { dados = b.subarray(p + 8, Math.min(b.length, p + 8 + n)); break }
    p += 8 + n + (n % 2)
  }
  if (!fmt || !dados) throw new Falha(`${arq}: WAV sem o bloco fmt ou data.`)
  const pcm16 = (fmt.formato === 1 || fmt.formato === 0xfffe) && fmt.bits === 16
  const amostras = pcm16 ? new Int16Array(dados.buffer.slice(dados.byteOffset, dados.byteOffset + dados.length - (dados.length % 2))) : null
  return { ...fmt, pcm16, n: Math.floor(dados.length / (fmt.bits / 8) / fmt.canais), amostras, inicio: dados.byteOffset - b.byteOffset }
}

const janelas = (x, taxa, limiarDb) => {
  const jan = Math.round(0.01 * taxa), passo = Math.round(0.001 * taxa), lim = 10 ** (limiarDb / 20)
  const rms = (i) => { let s = 0; for (let k = i; k < i + jan; k++) s += x[k] * x[k]; return Math.sqrt(s / jan) / 32768 }
  return { jan, passo, cabe: (i) => i + jan < x.length, som: (i) => i + jan < x.length && rms(i) >= lim }
}

// O primeiro som: RMS de 10 ms acima de −45 dBFS, andando de 1 em 1 ms. É a medida do Contrato L.
export function inicioVoz(x, taxa, limiarDb = -45) {
  const { passo, cabe, som } = janelas(x, taxa, limiarDb)
  let i = 0
  while (cabe(i) && !som(i)) i += passo
  return cabe(i) ? i / taxa : null
}

// A ElevenLabs às vezes devolve um estalo curto no começo do arquivo, antes de um silêncio (medido em
// 29/09/2026: 15 ms a −41 dBFS e ~75 ms de silêncio até a voz). Ele engana o primeiro som do Contrato L,
// e o motor acenderia a legenda antes da voz. Zera, só no começo, cada trecho acima de −45 dBFS que dura
// ≤ 40 ms e vem antes de ≥ 50 ms de silêncio. Devolve quantos segundos zerou.
export function limparInicio(arq, limiarDb = -45) {
  const w = lerWav(arq)
  const { passo, cabe, som } = janelas(w.amostras, w.taxa, limiarDb)
  let zerar = 0
  for (let volta = 0; volta < 5; volta++) {
    let i = zerar
    while (cabe(i) && !som(i)) i += passo
    if (!cabe(i) || i > 0.5 * w.taxa) break
    let j = i
    while (som(j)) j += passo
    let k = j
    while (cabe(k) && !som(k)) k += passo
    if (j - i > 0.04 * w.taxa || k - j < 0.05 * w.taxa || !cabe(k)) break
    zerar = k
  }
  if (!zerar) return 0
  const b = fs.readFileSync(arq)
  b.fill(0, w.inicio, w.inicio + zerar * 2)
  fs.writeFileSync(arq, b)
  return zerar / w.taxa
}

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-v', 'error', '-y', ...args], { encoding: 'utf8' })
  if (r.error?.code === 'ENOENT') throw new Falha('Falta o ffmpeg. macOS: brew install ffmpeg · Windows: winget install --id Gyan.FFmpeg -e · Linux: sudo apt install ffmpeg')
  if (r.status !== 0) throw new Falha(`ffmpeg falhou: ${(r.stderr || '').trim()}`)
}
export const mp3ParaWav = (mp3, wav) => ffmpeg(['-i', mp3, '-ar', String(TAXA), '-ac', '1', '-c:a', 'pcm_s16le', wav])

// ── texto, pronúncia e palavras ──────────────────────────────────────────────────────────────────
export const normalizar = (t) => String(t ?? '').trim().replace(/\s+/g, ' ')
const PARTES = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u

// A legenda mostra o texto do roteiro; a voz recebe o texto com as trocas de pronúncia. Cada palavra
// exibida vira uma ou mais palavras ditas, e `grupos` guarda quantas, para devolver os tempos à legenda.
export function aplicarPronuncia(texto, mapa = {}) {
  const exibidas = normalizar(texto).split(' ')
  const ditas = [], grupos = [], usadas = {}
  for (const w of exibidas) {
    const [, antes, nucleo, depois] = w.match(PARTES)
    const troca = nucleo && Object.hasOwn(mapa, nucleo) ? normalizar(mapa[nucleo]) : null
    const dita = troca ? `${antes}${troca}${depois}` : w
    if (troca) usadas[nucleo] = troca
    const partes = dita.split(' ')
    ditas.push(dita)
    grupos.push(partes.length)
  }
  return { exibidas, ditas, falado: ditas.join(' '), grupos, usadas }
}

// Palavras do alinhamento da ElevenLabs: separadas por espaço, com a pontuação junto.
export function palavrasDoAlinhamento(al) {
  const ch = al.characters, t0 = al.character_start_times_seconds, t1 = al.character_end_times_seconds
  const out = []
  let cur = '', a0 = 0, fim = 0
  ch.forEach((c, i) => {
    if (/^\s+$/.test(c)) { if (cur) out.push({ texto: cur, ini: a0, fim }); cur = ''; return }
    if (!cur) a0 = t0[i]
    cur += c
    fim = t1[i]
  })
  if (cur) out.push({ texto: cur, ini: a0, fim })
  return out
}

export function agrupar(ditas, grupos, exibidas) {
  if (ditas.length !== grupos.reduce((s, n) => s + n, 0)) return null
  let k = 0
  return exibidas.map((texto, i) => {
    const g = ditas.slice(k, (k += grupos[i]))
    return { texto, ini: g[0].ini, fim: g[g.length - 1].fim }
  })
}

// Uma fala do Contrato L a partir do alinhamento e do WAV já convertido.
export function montarFala({ fala, pron, alinhamento, wav, arquivo }) {
  const w = lerWav(wav)
  const ini = inicioVoz(w.amostras, w.taxa)
  if (ini == null) throw new Falha(`A fala ${fala.id} saiu muda (nada acima de −45 dBFS). Refaça com --refazer ${fala.id}.`)
  const ditas = palavrasDoAlinhamento(alinhamento)
  const pal = agrupar(ditas, pron.grupos, pron.exibidas)
  if (!pal) {
    throw new Falha(`O alinhamento da fala ${fala.id} não bate com o texto enviado.
  enviado:   ${pron.falado}
  alinhado:  ${ditas.map((d) => d.texto).join(' ')}`)
  }
  const dur = w.n / w.taxa
  const palavras = pal.map((p, i) => ({
    texto: p.texto,
    ini: r3(p.ini),
    fim: r3(Math.min(p.fim, dur)),
    ...(pron.ditas[i] !== p.texto ? { dito: pron.ditas[i] } : {}),
  }))
  // O alinhamento põe a 1ª letra em 0,000 mesmo quando a voz só começa depois: vale o som medido.
  palavras[0].ini = r3(Math.max(palavras[0].ini, ini))
  if (palavras[0].fim < palavras[0].ini) palavras[0].fim = palavras[0].ini
  return { id: fala.id, onde: fala.onde, texto: fala.texto, arquivo, duracao: r3(dur), inicio_voz: r3(ini), palavras }
}

// ── cache: o take aprovado ───────────────────────────────────────────────────────────────────────
const ordenado = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, ordenado(o[k])])) : o)
// SHA-256 de tudo o que muda o som: texto enviado, voz, modelo, ajustes, formato, vizinhos e dicionário.
export const chaveTake = (p) => crypto.createHash('sha256').update(JSON.stringify(ordenado({
  texto: p.texto, voz: p.voz, modelo: p.modelo, ajustes: p.ajustes, formato: p.formato,
  anterior: p.anterior || '', seguinte: p.seguinte || '', dicionario: p.dicionario || {},
}))).digest('hex')

export function lerTake(dir, chave) {
  const d = path.join(dir, chave)
  if (!fs.existsSync(path.join(d, 'take.mp3')) || !fs.existsSync(path.join(d, 'take.json'))) return null
  return { ...JSON.parse(fs.readFileSync(path.join(d, 'take.json'), 'utf8')), mp3: path.join(d, 'take.mp3') }
}
function guardarTake(dir, chave, mp3, info) {
  const d = path.join(dir, chave)
  fs.mkdirSync(d, { recursive: true })
  fs.writeFileSync(path.join(d, 'take.mp3'), mp3)
  fs.writeFileSync(path.join(d, 'take.json'), JSON.stringify(info, null, 1) + '\n')
}
function aposentarTake(dir, chave) {
  const d = path.join(dir, chave)
  if (!fs.existsSync(path.join(d, 'take.json'))) return null
  const velho = path.join(d, 'antigos', new Date().toISOString().replace(/[:.]/g, '-'))
  fs.mkdirSync(velho, { recursive: true })
  for (const f of ['take.mp3', 'take.json']) if (fs.existsSync(path.join(d, f))) fs.renameSync(path.join(d, f), path.join(velho, f))
  return velho
}
function pastaTakes(p) {
  const abs = path.resolve(p)
  if (abs.split(path.sep).includes('saida')) throw new Falha(`Os takes não podem morar dentro de uma pasta saida/ (${abs}): saida/ se apaga e o take é a fonte do som. Use --takes <pasta do vídeo>/voz/_takes.`)
  return abs
}

// ── roteiro ──────────────────────────────────────────────────────────────────────────────────────
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]*$/
// Tutorial: { passo: n }. Vídeo em capítulos (update, lançamento): { capitulo: n }. Um roteiro usa um só.
const tipoOnde = (o) => (o && typeof o === 'object' ? Object.keys(o)[0] : null)
const ondeOk = (o) => o === 'abertura' || o === 'fechamento' || (o && typeof o === 'object' && Object.keys(o).length === 1
  && ['passo', 'capitulo'].includes(tipoOnde(o)) && Number.isInteger(o[tipoOnde(o)]) && o[tipoOnde(o)] >= 1)
const ordemOnde = (o) => (o === 'abertura' ? 0 : o === 'fechamento' ? Infinity : o[tipoOnde(o)])
const nomeOnde = (o) => (typeof o === 'string' ? o : `${tipoOnde(o) === 'capitulo' ? 'capítulo' : 'passo'} ${o[tipoOnde(o)]}`)
const FAIXAS = { speed: [0.7, 1.2], stability: [0, 1], similarity_boost: [0, 1], style: [0, 1] }

function conferirOndes(falas, erros) {
  const vistos = new Set()
  for (const f of falas) {
    if (!ondeOk(f.onde)) { erros.push(`${f.id || '?'}: onde tem de ser "abertura", "fechamento", { "passo": n } ou { "capitulo": n }, com n ≥ 1`); continue }
    const k = nomeOnde(f.onde)
    if (vistos.has(k)) erros.push(`${f.id}: ${k} aparece em mais de uma fala (cada lugar tem uma fala só)`)
    vistos.add(k)
  }
  const tipos = new Set(falas.map((f) => tipoOnde(f.onde)).filter(Boolean))
  if (tipos.size > 1) erros.push('o roteiro mistura passo e capitulo: o tutorial usa { "passo": n }, o vídeo em capítulos usa { "capitulo": n }')
}

export function lerRoteiro(arq, { precisaVoz = true } = {}) {
  const r = lerJson(arq, 'o roteiro')
  const erros = []
  if (typeof r.idioma !== 'string' || !r.idioma) erros.push('idioma: falta (ex.: "pt-BR", "en-US")')
  if (!Object.hasOwn(PERFIS, r.perfil)) erros.push(`perfil: tem de ser ${Object.keys(PERFIS).join(' ou ')} (o mesmo de video.voz.perfil)`)
  if (precisaVoz && !(r.voz && typeof r.voz.id === 'string' && r.voz.id)) erros.push('voz.id: falta a voz escolhida (voz.mjs buscar → amostras → a que o usuário aprovou)')
  const ajustes = { ...(PERFIS[r.perfil] || PERFIS.calmo), ...(r.ajustes || {}) }
  for (const [k, [a, b]] of Object.entries(FAIXAS)) if (!(typeof ajustes[k] === 'number' && ajustes[k] >= a && ajustes[k] <= b)) erros.push(`ajustes.${k}: ${ajustes[k]} fora de ${a}–${b}`)
  if (typeof ajustes.use_speaker_boost !== 'boolean') erros.push('ajustes.use_speaker_boost: tem de ser true ou false')
  const mapaOk = (m, onde) => {
    if (m == null) return
    if (typeof m !== 'object' || Array.isArray(m)) return erros.push(`${onde}: tem de ser um objeto { "Palavra": "como a voz lê" }`)
    for (const [k, v] of Object.entries(m)) {
      if (/\s/.test(k) || !k) erros.push(`${onde}: a chave "${k}" tem de ser uma palavra só, como está no texto`)
      if (typeof v !== 'string' || !v.trim()) erros.push(`${onde}.${k}: falta como a voz lê`)
    }
  }
  mapaOk(r.pronuncia, 'pronuncia')
  if (!Array.isArray(r.falas) || !r.falas.length) erros.push('falas: precisa de pelo menos uma fala')
  const falas = (r.falas || []).map((f, i) => ({ ...f, id: f?.id, texto: normalizar(f?.texto), _i: i }))
  const ids = new Set()
  for (const f of falas) {
    if (!ID.test(f.id || '')) erros.push(`falas[${f._i}].id: use letras, números, - e _ (vira o nome do arquivo)`)
    else if (ids.has(f.id)) erros.push(`${f.id}: id repetido`)
    ids.add(f.id)
    if (!f.texto) erros.push(`${f.id || `falas[${f._i}]`}: falta o texto`)
    mapaOk(f.pronuncia, `${f.id}.pronuncia`)
  }
  conferirOndes(falas, erros)
  if (erros.length) throw new Falha(`O roteiro ${arq} tem problemas:\n${erros.map((e) => `  - ${e}`).join('\n')}`)
  // A ordem falada é a do vídeo: abertura, passos em ordem, fechamento. Os vizinhos saem dela.
  falas.sort((a, b) => ordemOnde(a.onde) - ordemOnde(b.onde))
  return { ...r, ajustes, modelo: r.voz?.modelo || MODELO, pronuncia: r.pronuncia || {}, falas: falas.map(({ _i, ...f }) => f) }
}

export function planejar(rot) {
  const pron = rot.falas.map((f) => aplicarPronuncia(f.texto, { ...rot.pronuncia, ...(f.pronuncia || {}) }))
  return rot.falas.map((fala, i) => {
    const pedido = {
      texto: pron[i].falado, voz: rot.voz.id, modelo: rot.modelo, ajustes: rot.ajustes, formato: FORMATO,
      anterior: pron[i - 1]?.falado || '', seguinte: pron[i + 1]?.falado || '', dicionario: pron[i].usadas,
    }
    return { fala, pron: pron[i], pedido, chave: chaveTake(pedido) }
  })
}

// ── Contrato L ───────────────────────────────────────────────────────────────────────────────────
export function validarLocucao(loc, base) {
  const e = []
  if (!loc || typeof loc !== 'object') return ['o arquivo não é um objeto JSON']
  if (loc.versao !== 1) e.push('versao: tem de ser 1')
  if (typeof loc.idioma !== 'string' || !loc.idioma) e.push('idioma: falta (ex.: "pt-BR")')
  if (loc.voz != null && (typeof loc.voz !== 'object' || Array.isArray(loc.voz))) e.push('voz: tem de ser um objeto (é informativo)')
  if (!Array.isArray(loc.falas) || !loc.falas.length) return [...e, 'falas: precisa de pelo menos uma']
  const ids = new Set()
  loc.falas.forEach((f, k) => {
    const q = `falas[${k}]${f?.id ? ` (${f.id})` : ''}`
    if (!ID.test(f?.id || '')) e.push(`${q}: id inválido`)
    else if (ids.has(f.id)) e.push(`${q}: id repetido`)
    ids.add(f?.id)
    if (typeof f?.texto !== 'string' || !f.texto || f.texto !== normalizar(f.texto)) e.push(`${q}: texto vazio ou com espaço sobrando`)
    const n = (x) => typeof x === 'number' && Number.isFinite(x) && x >= 0
    if (!n(f?.duracao) || f.duracao === 0) e.push(`${q}: duracao inválida`)
    if (!n(f?.inicio_voz) || !(f.inicio_voz < f.duracao)) e.push(`${q}: inicio_voz inválido`)
    if (typeof f?.arquivo !== 'string' || !f.arquivo || path.isAbsolute(f.arquivo)) e.push(`${q}: arquivo tem de ser um caminho relativo ao locucao.json`)
    else {
      const wav = path.resolve(base, f.arquivo)
      if (!fs.existsSync(wav)) e.push(`${q}: não achei ${f.arquivo}`)
      else {
        try {
          const w = lerWav(wav)
          if (!w.pcm16 || w.canais !== 1 || w.taxa !== TAXA) e.push(`${q}: ${f.arquivo} tem de ser WAV PCM 16 bits, ${TAXA} Hz, mono (é ${w.bits} bits, ${w.taxa} Hz, ${w.canais} canais)`)
          else {
            if (n(f.duracao) && Math.abs(w.n / w.taxa - f.duracao) > 0.002) e.push(`${q}: duracao ${f.duracao} s, mas o WAV tem ${r3(w.n / w.taxa)} s`)
            const iv = inicioVoz(w.amostras, w.taxa)
            if (n(f.inicio_voz) && (iv == null || Math.abs(iv - f.inicio_voz) > 0.002)) e.push(`${q}: inicio_voz ${f.inicio_voz} s, mas o primeiro som medido é ${iv == null ? 'nenhum (mudo)' : `${r3(iv)} s`}`)
          }
        } catch (x) { e.push(`${q}: ${x.message}`) }
      }
    }
    if (!Array.isArray(f?.palavras) || !f.palavras.length) { e.push(`${q}: faltam as palavras`); return }
    const tokens = typeof f.texto === 'string' ? f.texto.split(' ') : []
    if (f.palavras.length !== tokens.length) e.push(`${q}: ${f.palavras.length} palavras, mas o texto tem ${tokens.length}`)
    f.palavras.forEach((p, i) => {
      const w = `${q} palavra ${i + 1}`
      if (p?.texto !== tokens[i]) e.push(`${w}: "${p?.texto}" não é "${tokens[i]}" do texto`)
      if (!n(p?.ini) || !n(p?.fim) || p.ini > p.fim) e.push(`${w}: ini/fim inválidos`)
      else {
        if (n(f.duracao) && p.fim > f.duracao + 0.001) e.push(`${w}: fim ${p.fim} passa da duração ${f.duracao}`)
        if (i && n(f.palavras[i - 1]?.ini) && p.ini < f.palavras[i - 1].ini) e.push(`${w}: começa antes da anterior`)
      }
      if (p?.dito != null && (typeof p.dito !== 'string' || !p.dito.trim())) e.push(`${w}: dito vazio`)
    })
    if (n(f.palavras[0]?.ini) && n(f.inicio_voz) && f.palavras[0].ini < f.inicio_voz - 0.0005) e.push(`${q}: a 1ª palavra (${f.palavras[0].ini} s) começa antes do primeiro som (${f.inicio_voz} s)`)
  })
  conferirOndes(loc.falas.filter((f) => f && f.id), e)
  return e
}

// ── conta e voz ──────────────────────────────────────────────────────────────────────────────────
const gratis = (s) => s?.tier === 'free' || s?.status === 'free' || s?.status === 'free_disabled'
const milhar = (v) => (v == null ? '?' : Number(v).toLocaleString('pt-BR'))
const AVISO_GRATIS = `Plano grátis da ElevenLabs. O que muda:
  - sem uso comercial: o vídeo não pode ir para anúncio, loja, cliente nem canal que dá dinheiro;
  - atribuição obrigatória: diga onde o vídeo for publicado que a voz é da ElevenLabs (elevenlabs.io);
  - a API não usa vozes da biblioteca nesse plano: o buscar mostra as vozes padrão da conta.
Dá para seguir assim. Para uso comercial ou para as vozes da biblioteca, um plano pago.`

async function assinatura() {
  const { dados } = await api('GET', '/v1/user/subscription')
  return dados || {}
}
const saldo = (s) => {
  const resta = s.character_limit != null && s.character_count != null ? s.character_limit - s.character_count : null
  return `plano ${s.tier ?? '?'} · créditos usados ${milhar(s.character_count)} de ${milhar(s.character_limit)} (restam ${milhar(resta)})`
}

function exigirAutorizacao(autorizacao, base, nome) {
  const arq = autorizacao ? path.resolve(base, autorizacao) : null
  if (!arq || !fs.existsSync(arq) || !fs.statSync(arq).isFile() || fs.statSync(arq).size === 0) {
    throw new Falha(`A voz "${nome}" é um clone feito nesta conta. Clone de voz de pessoa real só com autorização escrita dela.
Guarde o documento assinado (PDF, imagem ou texto) na pasta do vídeo e aponte para ele em voz.autorizacao no roteiro
(no amostras: --autorizacao <arquivo>). ${arq ? `Não achei ${arq}, ou ele está vazio.` : 'Sem isso, não gero.'}`)
  }
}
const ehClone = (e) => e?.categoria === 'cloned' || (e?.categoria === 'professional' && e?.daConta === true)

function avisarSaida(e) {
  if (!e?.disable_at_unix) return
  const dias = Math.ceil((e.disable_at_unix * 1000 - Date.now()) / 864e5)
  console.log(`⚠ A voz ${e.nome ? `"${e.nome}" ` : ''}vai sair da biblioteca em ${dataBr(e.disable_at_unix)} (${dias > 0 ? `daqui a ${dias} dias` : 'já saiu'}; consultado em ${e.consultado.slice(0, 10)}).
  Os takes já gerados continuam valendo. Fala nova ou --refazer com ela depois dessa data não vai dar: termine antes ou escolha outra voz.`)
}

// A data de saída da biblioteca aparece em GET /v1/voices/{id} → sharing.disable_at_unix. Uma voz da
// biblioteca ainda não usada na conta responde 400 voice_not_found (medido em 29/09/2026); depois do
// primeiro uso ela passa a responder, com sharing.status "copied" e o aviso prévio gravado na conta.
async function checarVoz(id, { autorizacao, base = '.' } = {}) {
  const { dados, erro, corpo, status } = await api('GET', `/v1/voices/${encodeURIComponent(id)}`, { tolerar: [400, 404] })
  const naoAchou = status === 404 || (status === 400 && /voice_not_found/.test(`${erro?.code ?? ''} ${erro?.status ?? ''}`))
  if (status === 400 && !naoAchou) throw erroApi(status, corpo)
  const v = dados || {}
  const e = {
    consultado: new Date().toISOString(), encontrada: !naoAchou, nome: v.name ?? null, categoria: v.category ?? null,
    daConta: v.is_owner ?? null, disable_at_unix: v.sharing?.disable_at_unix ?? null, notice_period: v.sharing?.notice_period ?? null,
  }
  if (ehClone(e)) exigirAutorizacao(autorizacao, base, e.nome || id)
  avisarSaida(e)
  return e
}

async function falar(pedido, fala) {
  const corpo = { text: pedido.texto, model_id: pedido.modelo, voice_settings: pedido.ajustes }
  if (pedido.anterior) corpo.previous_text = pedido.anterior
  if (pedido.seguinte) corpo.next_text = pedido.seguinte
  const { dados, cab } = await api('POST', `/v1/text-to-speech/${encodeURIComponent(pedido.voz)}/with-timestamps`, {
    consulta: { output_format: pedido.formato }, json: corpo, fala, caracteres: pedido.texto.length,
  })
  if (!dados?.audio_base64 || !dados?.alignment?.characters) throw new Falha(`A ElevenLabs respondeu sem áudio ou sem alinhamento (${fala}).`)
  return { mp3: Buffer.from(dados.audio_base64, 'base64'), alinhamento: dados.alignment, request_id: cab.get('request-id'), custo: num(cab.get('character-cost')) }
}

// Antes de gastar: caracteres novos, saldo e teto. Devolve a assinatura (para saber o plano).
async function antesDeGastar(novos, a) {
  const teto = num(a.teto) ?? TETO
  const s = await assinatura()
  console.log(`saldo: ${saldo(s)}`)
  if (gratis(s)) console.log(AVISO_GRATIS)
  if (novos > teto && !a.sim) throw new Falha(`${novos} caracteres novos passam do teto de ${teto}. Confira o roteiro e confirme com --sim (ou mude --teto).`, 2)
  return s
}
const dicaGratis = (e, s) => { if (gratis(s) && e instanceof Falha && e.status >= 400 && e.status < 500) e.message += '\nNo plano grátis a API não usa vozes da biblioteca: escolha uma voz padrão (voz.mjs buscar --padrao).'; return e }

// ── comandos ─────────────────────────────────────────────────────────────────────────────────────
async function cmdConta(a) {
  const s = await assinatura()
  const resta = s.character_limit != null && s.character_count != null ? s.character_limit - s.character_count : null
  if (a.json) return console.log(JSON.stringify({ tier: s.tier, status: s.status, usados: s.character_count, limite: s.character_limit, restam: resta, renova_unix: s.next_character_count_reset_unix ?? null, gratis: gratis(s) }))
  console.log(saldo(s))
  console.log(`status ${s.status ?? '?'}${s.next_character_count_reset_unix ? ` · renova em ${dataBr(s.next_character_count_reset_unix)}` : ''}${s.voice_limit != null ? ` · vozes na conta ${s.voice_slots_used ?? '?'} de ${s.voice_limit}` : ''}`)
  if (gratis(s)) console.log(AVISO_GRATIS)
}

const ORDENS = ['usage_character_count_1y', 'trending', 'cloned_by_count', 'created_date']
// Regras de uso num vídeo: aviso prévio ≥ 180 dias (nunca "sem aviso"), sem tarifa especial, sem
// moderação ao vivo, sem voz de famoso.
export function motivoFora(v, avisoMin = AVISO_MIN) {
  if (v.category === 'famous') return 'voz de famoso'
  if (!(v.notice_period >= avisoMin)) return v.notice_period ? `aviso de ${v.notice_period} dias` : 'sem aviso prévio'
  if ((v.rate != null && v.rate > 1) || (v.fiat_rate != null && v.fiat_rate > 0)) return 'tarifa especial'
  if (v.live_moderation_enabled) return 'moderação ao vivo'
  return null
}

function linhaVoz(v, i, idioma = '') {
  const todos = [...new Set((v.verified_languages || []).map((l) => `${l.locale || l.language}${l.accent ? ` (${l.accent})` : ''}`))]
  const doIdioma = todos.filter((x) => idioma && x.toLowerCase().startsWith(idioma.toLowerCase()))
  const primeiros = [...doIdioma, ...todos.filter((x) => !doIdioma.includes(x))].slice(0, Math.max(3, doIdioma.length))
  const idiomas = todos.length > primeiros.length ? [...primeiros, `+${todos.length - primeiros.length}`] : primeiros
  const tags = [v.locale || v.language, v.accent, v.gender, v.age, v.descriptive, v.use_case].filter(Boolean).join(' · ')
  return [
    `${String(i + 1).padStart(2)}. ${v.name}  [${v.voice_id}]`,
    `    ${tags}${v.notice_period != null ? ` · aviso ${v.notice_period} dias` : ''}${v.usage_character_count_1y != null ? ` · ${milhar(v.usage_character_count_1y)} caracteres/ano` : ''}${v.cloned_by_count != null ? ` · ${milhar(v.cloned_by_count)} usos salvos` : ''}`,
    ...(v.description ? [`    ${String(v.description).replace(/\s+/g, ' ').slice(0, 140)}`] : []),
    ...(idiomas.length ? [`    idiomas verificados: ${idiomas.join(', ')}`] : []),
    ...(v.preview_url ? [`    prévia: ${v.preview_url}`] : []),
  ].join('\n')
}

async function listarPadrao(a) {
  const { dados } = await api('GET', '/v2/voices', { consulta: { voice_type: 'default', page_size: 100 } })
  const idioma = (a.idioma || '').toLowerCase()
  const vozes = (dados?.voices || []).map((v) => ({ ...v, ...(v.labels || {}), use_case: v.labels?.use_case }))
    .filter((v) => !idioma || (v.verified_languages || []).some((l) => (l.language || '').toLowerCase() === idioma) || (v.language || '').toLowerCase() === idioma)
  if (a.json) return console.log(JSON.stringify(vozes, null, 1))
  console.log(`Vozes padrão da conta${idioma ? ` que falam "${idioma}"` : ''}: ${vozes.length}`)
  vozes.slice(0, num(a.n) ?? 50).forEach((v, i) => console.log(linhaVoz(v, i, a.idioma)))
}

async function cmdBuscar(a) {
  if (a.padrao) return listarPadrao(a)
  const s = await assinatura()
  if (gratis(s)) { console.log(AVISO_GRATIS); return listarPadrao(a) }
  const ordem = a.ordem || 'usage_character_count_1y'
  if (!ORDENS.includes(ordem)) throw new Falha(`--ordem tem de ser ${ORDENS.join(', ')}`)
  const avisoMin = num(a['aviso-min']) ?? AVISO_MIN
  const { dados } = await api('GET', '/v1/shared-voices', {
    consulta: {
      page_size: 100, sort: ordem, language: a.idioma, locale: a.local, accent: a.sotaque, gender: a.genero, age: a.idade,
      search: a.busca, use_cases: lista(a.uso), descriptives: lista(a.descritivo), category: a.categoria,
      min_notice_period_days: avisoMin, include_custom_rates: false, include_live_moderated: false,
    },
  })
  const todas = dados?.voices || []
  const fora = {}
  const boas = todas.filter((v) => { const m = motivoFora(v, avisoMin); if (m) fora[m] = (fora[m] || 0) + 1; return !m })
  if (a.json) return console.log(JSON.stringify(boas, null, 1))
  console.log(`${todas.length} vozes na busca · ${boas.length} usáveis num vídeo${Object.keys(fora).length ? ` · fora: ${Object.entries(fora).map(([m, n]) => `${n} (${m})`).join(', ')}` : ''}`)
  boas.slice(0, num(a.n) ?? 12).forEach((v, i) => console.log(linhaVoz(v, i, a.idioma)))
  if (!boas.length) console.log('Nenhuma voz passou nas regras. Afrouxe um filtro (sotaque, idade, uso) ou use o plano B: Voice Design (references/voz.md).')
}

const slug = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'voz'

async function cmdAmostras(a) {
  const vozes = lista(a.vozes)
  if (!vozes.length) throw new Falha('uso: voz.mjs amostras (--roteiro roteiro.json [--fala id] | --frase "…" [--perfil calmo]) --vozes id1,id2,id3 [--saida pasta]')
  let frase, ajustes, modelo = MODELO, rotulo
  if (a.roteiro) {
    const rot = lerRoteiro(a.roteiro, { precisaVoz: false })
    const f = a.fala ? rot.falas.find((x) => x.id === a.fala) : rot.falas[0]
    if (!f) throw new Falha(`Não achei a fala ${a.fala} no roteiro.`)
    frase = aplicarPronuncia(f.texto, { ...rot.pronuncia, ...(f.pronuncia || {}) }).falado
    ajustes = rot.ajustes; modelo = rot.voz?.modelo || MODELO; rotulo = `${f.id} · ${rot.perfil}`
  } else if (a.frase) {
    const perfil = a.perfil || 'calmo'
    if (!PERFIS[perfil]) throw new Falha(`--perfil tem de ser ${Object.keys(PERFIS).join(' ou ')}`)
    frase = normalizar(a.frase); ajustes = PERFIS[perfil]; rotulo = perfil
  } else throw new Falha('Diga a frase: --roteiro <roteiro.json> (usa a 1ª fala) ou --frase "…".')
  const saida = path.resolve(a.saida || (a.roteiro ? path.join(path.dirname(a.roteiro), 'amostras') : 'amostras-voz'))
  const takes = pastaTakes(path.join(saida, '_takes'))
  if (!estado.registro) estado.registro = path.join(takes, 'chamadas.jsonl')
  const plano = vozes.map((voz) => { const pedido = { texto: frase, voz, modelo, ajustes, formato: FORMATO }; return { voz, pedido, chave: chaveTake(pedido) } })
  const falta = plano.filter((p) => !lerTake(takes, p.chave))
  console.log(`"${frase}" (${rotulo}) · ${vozes.length} vozes · ${plano.length - falta.length} no cache · ${falta.length * frase.length} caracteres novos`)
  if (falta.length) {
    const s = await antesDeGastar(falta.length * frase.length, a)
    for (const p of falta) {
      let ev = await checarVoz(p.voz, { autorizacao: a.autorizacao, base: process.cwd() })
      const t = await falar(p.pedido, p.voz).catch((e) => { throw dicaGratis(e, s) })
      if (!ev.encontrada) ev = await checarVoz(p.voz, { autorizacao: a.autorizacao, base: process.cwd() })
      guardarTake(takes, p.chave, t.mp3, { chave: p.chave, pedido: p.pedido, request_id: t.request_id, data: new Date().toISOString(), custo: t.custo, caracteres: frase.length, alinhamento: t.alinhamento, voz_estado: ev })
      console.log(`  ${ev.nome || p.voz}: custo ${t.custo ?? '?'}`)
    }
  }
  const linhas = ['| # | Voz | voice_id | Arquivo | Duração | Caracteres/s |', '|---|---|---|---|---|---|']
  plano.forEach((p, i) => {
    const t = lerTake(takes, p.chave)
    const nome = t.voz_estado?.nome || p.voz
    const arq = `${i + 1}-${slug(nome)}.mp3`
    fs.copyFileSync(t.mp3, path.join(saida, arq))
    const tmp = path.join(os.tmpdir(), `voz-${p.chave}.wav`)
    mp3ParaWav(t.mp3, tmp)
    limparInicio(tmp)
    const w = lerWav(tmp); fs.rmSync(tmp, { force: true })
    const ini = inicioVoz(w.amostras, w.taxa) ?? 0, fim = palavrasDoAlinhamento(t.alinhamento).at(-1)?.fim ?? w.n / w.taxa
    linhas.push(`| ${i + 1} | ${nome} | ${p.voz} | ${arq} | ${(w.n / w.taxa).toFixed(2)} s | ${(frase.length / Math.max(0.1, fim - ini)).toFixed(1)} |`)
  })
  fs.writeFileSync(path.join(saida, 'amostras.md'), `# Amostras\n\nFrase: "${frase}" (${rotulo})\n\n${linhas.join('\n')}\n\nNinguém ouviu estas amostras: quem escolhe é quem ouve.\n`)
  console.log(`${linhas.slice(2).join('\n')}\n→ ${saida}${path.sep}amostras.md`)
}

async function cmdGerar(a) {
  const arq = a._[0]
  if (!arq || !a.saida) throw new Falha('uso: voz.mjs gerar <roteiro.json> --saida <pasta do vídeo>/voz/<versao> [--teto 1500] [--sim] [--refazer id,id]')
  const rot = lerRoteiro(arq)
  const saida = path.resolve(a.saida)
  const takes = pastaTakes(a.takes || path.join(path.dirname(saida), '_takes'))
  if (!estado.registro) estado.registro = path.join(takes, 'chamadas.jsonl')
  const baseRot = path.dirname(path.resolve(arq))
  const plano = planejar(rot)
  const refazer = new Set(lista(a.refazer))
  for (const id of refazer) if (!plano.some((p) => p.fala.id === id)) throw new Falha(`--refazer ${id}: não há fala com esse id no roteiro.`)
  const falta = plano.filter((p) => refazer.has(p.fala.id) || !lerTake(takes, p.chave))
  const novos = falta.reduce((s, p) => s + p.pedido.texto.length, 0)
  console.log(`${plano.length} falas · ${plano.length - falta.length} no cache · ${falta.length} para gerar · ${novos} caracteres novos`)
  let ev = plano.map((p) => lerTake(takes, p.chave)?.voz_estado).find(Boolean) || null
  if (ev && ehClone(ev)) exigirAutorizacao(rot.voz.autorizacao, baseRot, ev.nome || rot.voz.id)
  let custo = 0, semCusto = 0
  if (falta.length) {
    const s = await antesDeGastar(novos, a)
    ev = await checarVoz(rot.voz.id, { autorizacao: rot.voz.autorizacao, base: baseRot })
    for (const p of falta) {
      if (refazer.has(p.fala.id)) { const velho = aposentarTake(takes, p.chave); if (velho) console.log(`  ${p.fala.id}: take antigo guardado em ${path.relative(takes, velho)}`) }
      const t = await falar(p.pedido, p.fala.id).catch((e) => { throw dicaGratis(e, s) })
      if (!ev.encontrada) ev = await checarVoz(rot.voz.id, { autorizacao: rot.voz.autorizacao, base: baseRot })
      guardarTake(takes, p.chave, t.mp3, {
        chave: p.chave, fala: p.fala.id, texto: p.fala.texto, pedido: p.pedido, request_id: t.request_id, data: new Date().toISOString(),
        custo: t.custo, caracteres: p.pedido.texto.length, alinhamento: t.alinhamento, voz_estado: ev,
      })
      if (t.custo == null) semCusto++; else custo += t.custo
      console.log(`  ${p.fala.id.padEnd(11)} ${String(p.pedido.texto.length).padStart(3)} caracteres · custo ${t.custo ?? '?'} · ${p.pedido.texto}`)
    }
  } else if (ev) avisarSaida(ev)
  fs.mkdirSync(path.join(saida, 'falas'), { recursive: true })
  const falas = plano.map((p) => {
    const t = lerTake(takes, p.chave)
    const rel = `falas/${p.fala.id}.wav`
    mp3ParaWav(t.mp3, path.join(saida, rel))
    const zerado = limparInicio(path.join(saida, rel))
    if (zerado) console.log(`  ${p.fala.id}: estalo antes da voz zerado (${Math.round(zerado * 1000)} ms do começo)`)
    return montarFala({ fala: p.fala, pron: p.pron, alinhamento: t.alinhamento, wav: path.join(saida, rel), arquivo: rel })
  })
  const loc = { versao: 1, idioma: rot.idioma, voz: { provedor: 'elevenlabs', id: rot.voz.id, nome: rot.voz.nome || ev?.nome || null, modelo: rot.modelo, ajustes: rot.ajustes }, falas }
  const erros = validarLocucao(loc, saida)
  if (erros.length) throw new Falha(`A locução gerada não passou no Contrato L:\n${erros.map((e) => `  - ${e}`).join('\n')}`)
  fs.writeFileSync(path.join(saida, 'locucao.json'), JSON.stringify(loc, null, 1) + '\n')
  const voz = falas.reduce((s, f) => s + f.palavras.at(-1).fim - f.inicio_voz, 0)
  console.log(`✓ ${path.join(saida, 'locucao.json')} · ${falas.length} falas · ${r3(voz)} s de voz`)
  if (falta.length) console.log(`custo real (header character-cost): ${r3(custo)}${semCusto ? ` · ${semCusto} chamada(s) sem o header` : ''} por ${novos} caracteres`)
}

async function cmdConferir(a) {
  const arq = a._[0]
  if (!arq) throw new Falha('uso: voz.mjs conferir <locucao.json> [--tolerancia 0.08]')
  const base = path.dirname(path.resolve(arq))
  const loc = lerJson(path.resolve(arq), 'a locução')
  const erros = validarLocucao(loc, base)
  if (erros.length) throw new Falha(`A locução não passa no Contrato L; conserte antes de conferir:\n${erros.map((e) => `  - ${e}`).join('\n')}`)
  const tol = num(a.tolerancia) ?? TOLERANCIA
  const falas = a.fala ? loc.falas.filter((f) => lista(a.fala).includes(f.id)) : loc.falas
  if (!falas.length) throw new Falha(`--fala ${a.fala}: não há fala com esse id na locução.`)
  let ruins = 0, pior = 0
  for (const f of falas) {
    const ditas = f.palavras.map((p) => p.dito ?? p.texto)
    const form = new FormData()
    form.append('file', new Blob([fs.readFileSync(path.resolve(base, f.arquivo))], { type: 'audio/wav' }), path.basename(f.arquivo))
    form.append('text', ditas.join(' '))
    const { dados } = await api('POST', '/v1/forced-alignment', { form, fala: f.id })
    const grupos = ditas.map((d) => d.split(' ').length)
    const tentar = (ws) => agrupar(ws.map((w) => ({ ini: w.start, fim: w.end })), grupos, f.palavras.map((p) => p.texto))
    const ws = (dados?.words || []).filter((w) => normalizar(w.text))
    const alinhadas = tentar(ws) || tentar(ws.filter((w) => /[\p{L}\p{N}]/u.test(w.text)))
    if (!alinhadas) { ruins++; console.log(`✗ ${f.id}: o alinhamento forçado devolveu ${ws.length} palavras para ${grupos.reduce((s, n) => s + n, 0)} ditas (${ws.map((w) => w.text).join(' ')})`); continue }
    // A 1ª palavra é julgada contra o primeiro som medido; as outras, contra o ini do locucao.json.
    const d = alinhadas.map((x, i) => ({ texto: f.palavras[i].texto, ini: x.ini - (i ? f.palavras[i].ini : f.inicio_voz), fim: x.fim - f.palavras[i].fim }))
    const fora = d.filter((x) => Math.abs(x.ini) > tol + 1e-9)
    const maior = d.reduce((m, x) => (Math.abs(x.ini) > Math.abs(m.ini) ? x : m))
    const fimMeio = d.slice(0, -1).reduce((m, x) => Math.max(m, Math.abs(x.fim)), 0)
    pior = Math.max(pior, Math.abs(maior.ini))
    if (fora.length) ruins++
    console.log(`${fora.length ? '✗' : '✓'} ${f.id.padEnd(11)} ${d.length} palavras · maior desvio no início ${Math.round(maior.ini * 1000)} ms ("${maior.texto}") · fim, só informativo: ${Math.round(fimMeio * 1000)} ms${dados?.loss != null ? ` · loss ${r3(dados.loss)}` : ''}`)
    for (const x of fora) console.log(`    "${x.texto}" começa ${Math.round(x.ini * 1000)} ms ${x.ini > 0 ? 'depois' : 'antes'} de onde a legenda acende`)
    if (a.detalhe) alinhadas.forEach((x, i) => console.log(`    ${f.palavras[i].texto.padEnd(14)} legenda ${(i ? f.palavras[i].ini : f.inicio_voz).toFixed(3)} · alinhamento forçado ${x.ini.toFixed(3)}–${x.fim.toFixed(3)} · desvio ${Math.round(d[i].ini * 1000)} ms`))
  }
  console.log(`${ruins ? '✗' : '✓'} ${falas.length - ruins} de ${falas.length} falas com toda palavra a ±${Math.round(tol * 1000)} ms · pior ${Math.round(pior * 1000)} ms`)
  return ruins ? 1 : 0
}

// ── ouvir: a transcrição confere a pronúncia ─────────────────────────────────────────────────────
// Sem keyterms de propósito: enviesar a transcrição para a palavra certa esconderia a palavra errada.
export const MODELO_STT = 'scribe_v2'
export const chaveOuvida = (t) => String(t ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

// A transcrição escreve "12" e "1.248" onde a fala diz "doze" e "mil duzentas e quarenta e oito": os dois lados
// viram extenso no masculino antes de comparar (português; em outro idioma o algarismo só bate com algarismo).
const UNID = ['zero', 'um', 'dois', 'tres', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove']
const DEZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
const CEM = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']
function ate999(n) {
  if (n < 20) return UNID[n]
  if (n < 100) return DEZ[Math.floor(n / 10)] + (n % 10 ? ' e ' + UNID[n % 10] : '')
  if (n === 100) return 'cem'
  return CEM[Math.floor(n / 100)] + (n % 100 ? ' e ' + ate999(n % 100) : '')
}
export function porExtenso(n) {
  if (!Number.isSafeInteger(n) || n < 0 || n > 999999) return String(n)
  const mil = Math.floor(n / 1000), resto = n % 1000
  if (!mil) return ate999(resto)
  const m = mil === 1 ? 'mil' : `${ate999(mil)} mil`
  return resto ? `${m}${resto < 100 || resto % 100 === 0 ? ' e' : ''} ${ate999(resto)}` : m
}
const extenso = (t) => String(t ?? '').replace(/\d{1,3}(?:\.\d{3})+(?![\d.])|\d+/g, (x) => ` ${porExtenso(Number(x.replace(/\./g, '')))} `)
const masculino = (f) => f === 'uma' ? 'um' : f === 'duas' ? 'dois' : f.replace(/entas$/, 'entos')
const fichas = (t) => chaveOuvida(extenso(t)).split(' ').filter(Boolean).map(masculino)

// Endereço ("marca.com/7") é palavra de risco que a transcrição grafa do jeito dela ("lumaone.com/7"):
// vale uma letra de diferença em cada pedaço de 6 letras ou mais.
const umaLetra = (a, b) => {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1 || Math.min(a.length, b.length) < 6) return false
  let i = 0
  while (i < a.length && a[i] === b[i]) i++
  return a.slice(i + (a.length >= b.length ? 1 : 0)) === b.slice(i + (b.length >= a.length ? 1 : 0))
}

// Quais fichas esperadas a transcrição não trouxe, pela maior subsequência comum (a ordem conta).
export function faltasNaEscuta(esperadas, ouvidas) {
  const n = esperadas.length, m = ouvidas.length
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = esperadas[i] === ouvidas[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  const achada = new Array(n).fill(false)
  for (let i = 0, j = 0; i < n && j < m;) {
    if (esperadas[i] === ouvidas[j]) { achada[i] = true; i++; j++ } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++
  }
  return achada
}

// Uma fala: o que se esperava ouvir contra o que a transcrição ouviu. A transcrição escreve a palavra de verdade
// ("One") ou o som dela ("Luma"), nunca a grafia do mapa ("Uân"): a palavra de risco vale se aparecer como está no
// texto OU como foi dita. Palavra de risco = a que tem `dito` no locucao.json ou está em --palavras; faltou uma, a
// fala falha. As outras palavras só informam.
export function julgarEscuta(fala, ouvido, extras = []) {
  const extrasK = new Set(extras.flatMap(fichas))
  const ouvidas = fichas(ouvido), tem = new Set(ouvidas)
  const grupos = fala.palavras.map((p) => ({ p, texto: fichas(p.texto), dito: p.dito != null ? fichas(p.dito) : null, risco: p.dito != null || fichas(p.texto).some((f) => extrasK.has(f)) }))
  const achada = faltasNaEscuta(grupos.flatMap((g) => g.texto), ouvidas)
  let k = 0
  const faltas = []
  const formas = (g) => [g.texto, g.dito].filter(Boolean)
  // a transcrição às vezes gruda duas palavras ("LumaOne"): vale a junção com a vizinha, em qualquer das formas
  const grudada = (i) => [i - 1, i + 1].some((j) => grupos[j] && formas(grupos[Math.min(i, j)]).some((a) => formas(grupos[Math.max(i, j)])
    .some((b) => tem.has([...a, ...b].join('')))))
  for (const [gi, g] of grupos.entries()) {
    const naOrdem = g.texto.every((_, i) => achada[k + i])
    k += g.texto.length
    const endereco = /[./]\S/.test(g.p.texto) && g.texto.every((f) => ouvidas.some((o) => umaLetra(f, o)))
    const ok = g.risco ? formas(g).some((fs) => fs.length && fs.every((f) => tem.has(f))) || grudada(gi) || endereco : naOrdem
    if (!ok) faltas.push({ texto: g.p.texto, esperado: g.p.dito ?? g.p.texto, risco: g.risco })
  }
  return { riscos: grupos.filter((g) => g.risco).map((g) => g.p.texto), faltas, falhou: faltas.some((f) => f.risco) }
}

async function cmdOuvir(a) {
  const arq = a._[0]
  if (!arq) throw new Falha('uso: voz.mjs ouvir <locucao.json> [--palavras "Nome,Sigla"] [--fala id]')
  const base = path.dirname(path.resolve(arq))
  const loc = lerJson(path.resolve(arq), 'a locução')
  const erros = validarLocucao(loc, base)
  if (erros.length) throw new Falha(`A locução não passa no Contrato L; conserte antes de ouvir:\n${erros.map((e) => `  - ${e}`).join('\n')}`)
  const extras = lista(a.palavras)
  const falas = a.fala ? loc.falas.filter((f) => lista(a.fala).includes(f.id)) : loc.falas
  if (!falas.length) throw new Falha(`--fala ${a.fala}: não há fala com esse id na locução.`)
  const idioma = String(loc.idioma || '').split('-')[0].toLowerCase()
  const linhas = ['| fala | risco | o que a voz devia dizer | o que a transcrição ouviu | |', '|---|---|---|---|---|']
  let ruins = 0
  for (const f of falas) {
    const form = new FormData()
    form.append('file', new Blob([fs.readFileSync(path.resolve(base, f.arquivo))], { type: 'audio/wav' }), path.basename(f.arquivo))
    form.append('model_id', MODELO_STT)
    if (idioma) form.append('language_code', idioma)
    form.append('tag_audio_events', 'false')
    const { dados } = await api('POST', '/v1/speech-to-text', { form, fala: f.id })
    const ouvido = normalizar(dados?.text)
    const j = julgarEscuta(f, ouvido, extras)
    if (j.falhou) ruins++
    const devia = f.palavras.map((p) => p.dito ?? p.texto).join(' ')
    console.log(`${j.falhou ? '✗' : '✓'} ${f.id.padEnd(11)} ouvido: "${ouvido}"`)
    for (const x of j.faltas) console.log(`    ${x.risco ? 'RISCO ' : ''}"${x.texto}"${x.esperado !== x.texto ? ` (dito "${x.esperado}")` : ''} não aparece na transcrição${x.risco ? '' : ' (só informativo)'}`)
    linhas.push(`| ${f.id} | ${j.riscos.join(', ') || '—'} | ${devia} | ${ouvido} | ${j.falhou ? '✗' : '✓'} |`)
  }
  fs.writeFileSync(path.join(base, 'ouvido.md'), `# O que a transcrição ouviu\n\nModelo ${MODELO_STT}, sem keyterms. Palavra de risco que não aparece = ouvir aquela fala e acertar o mapa \`pronuncia\`.\n\n${linhas.join('\n')}\n\nA transcrição não julga sotaque nem entonação: isso continua com quem ouve.\n`)
  console.log(`${ruins ? '✗' : '✓'} ${falas.length - ruins} de ${falas.length} falas com toda palavra de risco ouvida · → ${path.join(base, 'ouvido.md')}`)
  return ruins ? 1 : 0
}

function cmdValidar(a) {
  const arq = a._[0]
  if (!arq) throw new Falha('uso: voz.mjs validar <locucao.json>')
  const loc = lerJson(path.resolve(arq), 'a locução')
  const erros = validarLocucao(loc, path.dirname(path.resolve(arq)))
  if (erros.length) { console.log(`✗ ${arq}\n${erros.map((e) => `  - ${e}`).join('\n')}`); return 1 }
  const lugares = loc.falas.map((f) => nomeOnde(f.onde))
  const pal = loc.falas.reduce((s, f) => s + f.palavras.length, 0)
  const voz = loc.falas.reduce((s, f) => s + f.palavras.at(-1).fim - f.inicio_voz, 0)
  console.log(`✓ ${arq}: ${loc.falas.length} falas (${lugares.join(', ')}), ${pal} palavras, ${r3(voz)} s de voz`)
  return 0
}

const COMANDOS = { conta: cmdConta, buscar: cmdBuscar, amostras: cmdAmostras, gerar: cmdGerar, conferir: cmdConferir, ouvir: cmdOuvir, validar: cmdValidar }
const SEM_VALOR = new Set(['sim', 'json', 'padrao', 'detalhe'])

export async function principal(argv) {
  const [cmd, ...resto] = argv
  if (!COMANDOS[cmd]) { console.error(`uso: node voz.mjs <${Object.keys(COMANDOS).join('|')}> …  (o cabeçalho de scripts/voz.mjs explica cada um)`); return 1 }
  const a = { _: [] }
  estado.chamadas = 0; estado.comando = cmd; estado.registro = null
  try {
    for (let i = 0; i < resto.length; i++) {
      const s = resto[i]
      if (!s.startsWith('--')) { a._.push(s); continue }
      const k = s.slice(2)
      if (SEM_VALOR.has(k)) { a[k] = true; continue }
      if (resto[i + 1] == null || resto[i + 1].startsWith('--')) throw new Falha(`--${k} precisa de um valor.`)
      a[k] = resto[++i]
    }
    if (a.registro) estado.registro = path.resolve(a.registro)
    return (await COMANDOS[cmd](a)) ?? 0
  } catch (e) {
    console.error(limpar(e instanceof Falha ? e.message : e?.stack || e))
    return e instanceof Falha ? e.codigo : 1
  } finally {
    if (cmd !== 'validar') (a.json ? console.error : console.log)(`chamadas à API: ${estado.chamadas}`)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await principal(process.argv.slice(2))
