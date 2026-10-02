// node --test testes/   (sem rede: a API é a falsa, em 127.0.0.1; precisa do ffmpeg)
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  aplicarPronuncia, palavrasDoAlinhamento, agrupar, montarFala, inicioVoz, chaveTake, lerRoteiro, planejar,
  validarLocucao, motivoFora, comoPorChave, lerWav, mp3ParaWav, limparInicio, Falha, julgarEscuta,
} from '../scripts/voz.mjs'
import { subirApiFalsa, alinhamentoFalso } from './api-falsa.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const VOZ = path.join(AQUI, '..', 'scripts', 'voz.mjs')
const CHAVE = 'sk_teste_SEGREDO_0123456789abcdef'
const tmp = (nome) => fs.mkdtempSync(path.join(os.tmpdir(), `voz-${nome}-`))
const escrever = (arq, dados) => { fs.mkdirSync(path.dirname(arq), { recursive: true }); fs.writeFileSync(arq, typeof dados === 'string' || Buffer.isBuffer(dados) ? dados : JSON.stringify(dados, null, 1)) }

function wavSintetico(arq, { silencio = 0.25, tom = 1.0, taxa = 48000, canais = 1 } = {}) {
  const n = Math.round((silencio + tom) * taxa)
  const b = Buffer.alloc(44 + n * 2 * canais)
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2 * canais, 4); b.write('WAVE', 8); b.write('fmt ', 12)
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(canais, 22); b.writeUInt32LE(taxa, 24)
  b.writeUInt32LE(taxa * 2 * canais, 28); b.writeUInt16LE(2 * canais, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2 * canais, 40)
  for (let i = 0; i < n; i++) {
    const t = i / taxa
    const v = t < silencio ? 0 : Math.round(16000 * Math.sin(2 * Math.PI * 220 * (t - silencio)))
    for (let c = 0; c < canais; c++) b.writeInt16LE(v, 44 + (i * canais + c) * 2)
  }
  escrever(arq, b)
  return n / taxa
}

function rodar(args, { env = {}, semChave = false, home } = {}) {
  return new Promise((resolve) => {
    const casa = home || tmp('casa')
    const e = { PATH: process.env.PATH, HOME: casa, USERPROFILE: casa, ...env }
    if (!semChave && !e.ELEVENLABS_API_KEY) e.ELEVENLABS_API_KEY = CHAVE
    const p = spawn(process.execPath, [VOZ, ...args], { env: e })
    let out = '', err = ''
    p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (err += d))
    p.on('close', (code) => resolve({ code, out, err, tudo: out + err }))
  })
}

// ── unidade ──────────────────────────────────────────────────────────────────────────────────────
describe('texto, pronúncia e palavras', () => {
  test('as palavras saem separadas por espaço, com a pontuação junto', () => {
    const p = palavrasDoAlinhamento(alinhamentoFalso('Toque em Salvar.'))
    assert.deepEqual(p.map((x) => x.texto), ['Toque', 'em', 'Salvar.'])
    assert.equal(p[0].ini, 0)
  })

  test('pronúncia: a voz recebe a troca, a legenda continua com o texto do roteiro (caso inventado)', () => {
    const pr = aplicarPronuncia('Exporte o PDF no Vyrta.', { PDF: 'pê dê efe', Vyrta: 'Vírta' })
    assert.equal(pr.falado, 'Exporte o pê dê efe no Vírta.')
    assert.deepEqual(pr.grupos, [1, 1, 3, 1, 1])
    assert.deepEqual(pr.usadas, { PDF: 'pê dê efe', Vyrta: 'Vírta' })
    const ditas = palavrasDoAlinhamento(alinhamentoFalso(pr.falado))
    const pal = agrupar(ditas, pr.grupos, pr.exibidas)
    assert.deepEqual(pal.map((x) => x.texto), ['Exporte', 'o', 'PDF', 'no', 'Vyrta.'])
    assert.equal(pal[2].ini, ditas[2].ini, '"PDF" acende quando "pê" começa')
    assert.equal(pal[2].fim, ditas[4].fim, 'e apaga quando "efe" acaba')
  })

  test('pronúncia: a chave é a palavra sem pontuação e com a mesma caixa', () => {
    assert.equal(aplicarPronuncia('Abra o (PDF), não o pdf.', { PDF: 'pê dê efe' }).falado, 'Abra o (pê dê efe), não o pdf.')
    assert.equal(aplicarPronuncia('  Muitos   espaços  ', {}).falado, 'Muitos espaços')
  })

  test('agrupar recusa quando o alinhamento não bate com o texto', () => {
    assert.equal(agrupar([{ ini: 0, fim: 1 }], [1, 1], ['a', 'b']), null)
  })
})

describe('áudio', () => {
  test('inicio_voz: o primeiro RMS de 10 ms acima de −45 dBFS', () => {
    const d = tmp('wav')
    wavSintetico(path.join(d, 'a.wav'), { silencio: 0.25 })
    const w = lerWav(path.join(d, 'a.wav'))
    const iv = inicioVoz(w.amostras, w.taxa)
    assert.ok(iv >= 0.239 && iv <= 0.25, `medido ${iv}`)
  })

  function wavComEstalo(arq, { estalo = 0.015, nivelDb = -40, silencio = 0.075, taxa = 48000 } = {}) {
    const n = Math.round((estalo + silencio + 1) * taxa), x = new Int16Array(n)
    const amp = 32768 * 10 ** (nivelDb / 20) * Math.SQRT2
    for (let i = 0; i < n; i++) {
      const t = i / taxa
      x[i] = t < estalo ? Math.round(amp * Math.sin(2 * Math.PI * 3000 * t)) : t < estalo + silencio ? 0 : Math.round(16000 * Math.sin(2 * Math.PI * 220 * t))
    }
    const b = Buffer.alloc(44 + n * 2)
    b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20)
    b.writeUInt16LE(1, 22); b.writeUInt32LE(taxa, 24); b.writeUInt32LE(taxa * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40)
    Buffer.from(x.buffer).copy(b, 44)
    escrever(arq, b)
    return estalo + silencio
  }

  test('estalo curto antes do silêncio, no começo: é zerado, e o primeiro som vira o da voz', () => {
    const d = tmp('estalo'), arq = path.join(d, 'a.wav')
    const voz = wavComEstalo(arq)
    let w = lerWav(arq)
    assert.ok(inicioVoz(w.amostras, w.taxa) < 0.005, 'sem limpar, o estalo engana a medida')
    const zerado = limparInicio(arq)
    assert.ok(zerado > 0.06 && zerado <= voz, `zerou ${zerado} s`)
    w = lerWav(arq)
    const iv = inicioVoz(w.amostras, w.taxa)
    assert.ok(iv > voz - 0.012 && iv <= voz, `primeiro som ${iv}, voz em ${voz}`)
    assert.equal(w.n, Math.round((voz + 1) * 48000), 'a duração não muda')
  })

  test('não zera o que pode ser fala: trecho longo, ou seguido de pausa curta', () => {
    const d = tmp('estalo')
    for (const [nome, o] of [['longo', { estalo: 0.08 }], ['pausa-curta', { silencio: 0.03 }]]) {
      const arq = path.join(d, `${nome}.wav`)
      wavComEstalo(arq, o)
      const antes = fs.readFileSync(arq)
      assert.equal(limparInicio(arq), 0, nome)
      assert.ok(fs.readFileSync(arq).equals(antes), nome)
    }
  })

  test('inicio_voz de um arquivo mudo é null', () => {
    assert.equal(inicioVoz(new Int16Array(48000), 48000), null)
  })

  test('mp3ParaWav entrega WAV PCM 16 bits, 48 kHz, mono', () => {
    const d = tmp('mp3')
    wavSintetico(path.join(d, 'a.wav'), { taxa: 44100, canais: 2 })
    mp3ParaWav(path.join(d, 'a.wav'), path.join(d, 'b.wav'))
    const w = lerWav(path.join(d, 'b.wav'))
    assert.deepEqual([w.pcm16, w.taxa, w.canais], [true, 48000, 1])
  })
})

describe('cache', () => {
  const base = { texto: 'Toque em Salvar.', voz: 'v1', modelo: 'm', ajustes: { speed: 1, stability: 0.5 }, formato: 'mp3_44100_128', anterior: 'a', seguinte: 'b', dicionario: {} }
  test('a chave não depende da ordem dos campos', () => {
    assert.equal(chaveTake(base), chaveTake({ ...base, ajustes: { stability: 0.5, speed: 1 } }))
  })
  test('a chave muda com cada coisa que muda o som', () => {
    const k = chaveTake(base)
    for (const [campo, valor] of [['texto', 'Toque em Enviar.'], ['voz', 'v2'], ['modelo', 'outro'], ['ajustes', { speed: 1.1, stability: 0.5 }],
      ['formato', 'mp3_44100_192'], ['anterior', 'x'], ['seguinte', 'y'], ['dicionario', { PDF: 'pê dê efe' }]]) {
      assert.notEqual(chaveTake({ ...base, [campo]: valor }), k, campo)
    }
  })
})

describe('roteiro', () => {
  const r = (dados) => { const d = tmp('rot'); escrever(path.join(d, 'r.json'), dados); return path.join(d, 'r.json') }
  const ok = { idioma: 'pt-BR', perfil: 'calmo', voz: { id: 'v1' }, falas: [
    { id: 'fechamento', onde: 'fechamento', texto: 'Pronto.' }, { id: 'p2', onde: { passo: 2 }, texto: 'Escolha a hora.' },
    { id: 'abertura', onde: 'abertura', texto: 'Marcar um corte.' }, { id: 'p1', onde: { passo: 1 }, texto: 'Toque   em Agendar.' }] }

  test('ordena como o vídeo fala e aplica o perfil', () => {
    const rot = lerRoteiro(r(ok))
    assert.deepEqual(rot.falas.map((f) => f.id), ['abertura', 'p1', 'p2', 'fechamento'])
    assert.equal(rot.falas[1].texto, 'Toque em Agendar.')
    assert.equal(rot.ajustes.speed, 0.95)
    const pl = planejar(rot)
    assert.equal(pl[1].pedido.anterior, 'Marcar um corte.')
    assert.equal(pl[1].pedido.seguinte, 'Escolha a hora.')
    assert.equal(pl[0].pedido.anterior, '')
  })

  test('recusa roteiro com problema e diz qual', () => {
    const ruim = { idioma: 'pt-BR', perfil: 'rapido', falas: [{ id: 'p1', onde: { passo: 1 }, texto: 'a' }, { id: 'p1', onde: { passo: 1 }, texto: '' }], pronuncia: { 'duas palavras': 'x' }, ajustes: { speed: 2 } }
    assert.throws(() => lerRoteiro(r(ruim)), (e) => e instanceof Falha && /perfil/.test(e.message) && /voz\.id/.test(e.message) && /id repetido/.test(e.message)
      && /passo 1 aparece em mais de uma fala/.test(e.message) && /falta o texto/.test(e.message) && /uma palavra só/.test(e.message) && /speed/.test(e.message))
  })

  test('vídeo em capítulos: { capitulo: n } ordena como passo, e não se mistura com passo', () => {
    const cap = { idioma: 'pt-BR', perfil: 'reels', voz: { id: 'v1' }, falas: [
      { id: 'fecho', onde: 'fechamento', texto: 'Tudo no ar.' }, { id: 'c2', onde: { capitulo: 2 }, texto: 'Cores novas.' },
      { id: 'abre', onde: 'abertura', texto: 'Novidades.' }, { id: 'c1', onde: { capitulo: 1 }, texto: 'Layouts novos.' }] }
    assert.deepEqual(lerRoteiro(r(cap)).falas.map((f) => f.id), ['abre', 'c1', 'c2', 'fecho'])
    const mistura = { ...cap, falas: [...cap.falas, { id: 'p1', onde: { passo: 1 }, texto: 'Toque.' }] }
    assert.throws(() => lerRoteiro(r(mistura)), /mistura passo e capitulo/)
    assert.throws(() => lerRoteiro(r({ ...cap, falas: [{ id: 'c0', onde: { capitulo: 0 }, texto: 'x' }] })), /capitulo/)
  })

  test('amostras aceita roteiro sem voz', () => {
    const { voz, ...semVoz } = ok
    assert.equal(lerRoteiro(r(semVoz), { precisaVoz: false }).falas.length, 4)
  })
})

describe('ouvir (julgarEscuta)', () => {
  const fala = { palavras: [{ texto: 'Conheça' }, { texto: 'o' }, { texto: 'Vyrta,', dito: 'Vírta,' }, { texto: 'no' }, { texto: 'Instagram.' }] }
  test('palavra de risco ouvida: passa, sem caixa, acento nem pontuação', () => {
    assert.equal(julgarEscuta(fala, 'conheca o virta no instagram', ['Instagram']).falhou, false)
  })
  test('palavra de risco trocada: falha e diz qual', () => {
    const j = julgarEscuta(fala, 'Conheça o Virgo no Instagram.', ['Instagram'])
    assert.equal(j.falhou, true)
    assert.deepEqual(j.faltas, [{ texto: 'Vyrta,', esperado: 'Vírta,', risco: true }])
  })
  test('a transcrição escreve a palavra de verdade, não a grafia do mapa: vale também', () => {
    const marca = { palavras: [{ texto: 'Conheça' }, { texto: 'o' }, { texto: 'Nuvo', dito: 'Núvo' }, { texto: 'One.', dito: 'Uân.' }] }
    assert.equal(julgarEscuta(marca, 'Conheça o Nuvo One.').falhou, false)
    assert.equal(julgarEscuta(marca, 'Conheça o Novo On.').falhou, true)
    assert.equal(julgarEscuta(marca, 'Conheça o NuvoOne.').falhou, false, 'duas palavras grudadas na transcrição')
  })
  test('palavra comum que não aparece é só informativa', () => {
    const j = julgarEscuta(fala, 'Conheça Vírta no Instagram')
    assert.equal(j.falhou, false)
    assert.deepEqual(j.faltas.map((f) => f.texto), ['o'])
  })
})

describe('Contrato L (validar)', () => {
  function locucaoValida() {
    const d = tmp('loc')
    const dur = wavSintetico(path.join(d, 'falas', 'p1.wav'), { silencio: 0.1, tom: 1.4 })
    const w = lerWav(path.join(d, 'falas', 'p1.wav'))
    const iv = Math.round(inicioVoz(w.amostras, w.taxa) * 1000) / 1000
    const loc = { versao: 1, idioma: 'pt-BR', voz: { provedor: 'elevenlabs' }, falas: [{ id: 'p1', onde: { passo: 1 }, texto: 'Toque em Salvar.', arquivo: 'falas/p1.wav',
      duracao: Math.round(dur * 1000) / 1000, inicio_voz: iv, palavras: [{ texto: 'Toque', ini: iv, fim: 0.5 }, { texto: 'em', ini: 0.55, fim: 0.7 }, { texto: 'Salvar.', ini: 0.75, fim: 1.4 }] }] }
    return { d, loc }
  }
  test('uma locução certa passa', () => {
    const { d, loc } = locucaoValida()
    assert.deepEqual(validarLocucao(loc, d), [])
  })
  test('cada quebra do contrato vira uma mensagem', () => {
    const casos = [
      [(l) => { l.versao = 2 }, /versao/],
      [(l) => { l.falas[0].palavras[2].texto = 'Salve.' }, /não é "Salvar\."/],
      [(l) => { l.falas[0].palavras.pop() }, /2 palavras, mas o texto tem 3/],
      [(l) => { l.falas[0].palavras[0].ini = 0 }, /começa antes do primeiro som/],
      [(l) => { l.falas[0].inicio_voz = 0.3; l.falas[0].palavras[0].ini = 0.3 }, /primeiro som medido/],
      [(l) => { l.falas[0].duracao = 3 }, /o WAV tem/],
      [(l) => { l.falas[0].onde = { passo: 0 } }, /onde tem de ser/],
      [(l) => { l.falas.push({ ...l.falas[0], id: 'p1b' }) }, /passo 1 aparece em mais de uma fala/],
      [(l) => { l.falas[0].arquivo = 'falas/nao-existe.wav' }, /não achei/],
      [(l) => { l.falas[0].palavras[1].ini = 0.05 }, /começa antes da anterior/],
    ]
    for (const [quebrar, esperado] of casos) {
      const { d, loc } = locucaoValida()
      quebrar(loc)
      const e = validarLocucao(loc, d)
      assert.ok(e.some((m) => esperado.test(m)), `${esperado} → ${JSON.stringify(e)}`)
    }
  })
  test('WAV fora do formato é recusado', () => {
    const { d, loc } = locucaoValida()
    wavSintetico(path.join(d, 'falas', 'p1.wav'), { silencio: 0.1, tom: 1.4, taxa: 44100 })
    assert.ok(validarLocucao(loc, d).some((m) => /48000 Hz, mono/.test(m)))
  })
})

describe('regras da biblioteca', () => {
  const v = { category: 'professional', notice_period: 365, rate: 1, fiat_rate: null, live_moderation_enabled: false }
  test('só passa voz com aviso ≥ 180 dias, sem tarifa especial, sem moderação ao vivo e que não seja de famoso', () => {
    assert.equal(motivoFora(v), null)
    assert.match(motivoFora({ ...v, notice_period: 0 }), /sem aviso/)
    assert.match(motivoFora({ ...v, notice_period: null }), /sem aviso/)
    assert.match(motivoFora({ ...v, notice_period: 90 }), /aviso de 90/)
    assert.match(motivoFora({ ...v, fiat_rate: 0.3 }), /tarifa/)
    assert.match(motivoFora({ ...v, rate: 2 }), /tarifa/)
    assert.match(motivoFora({ ...v, live_moderation_enabled: true }), /moderação/)
    assert.match(motivoFora({ ...v, category: 'famous' }), /famoso/)
  })
})

// A locução de referência da oficina: reconstruída do bruto da API, tem de sair igual.
const OFICINA = path.resolve(AQUI, '..', '..')
const REF = path.join(OFICINA, 'amostra-voz', '01-agendar-aula', 'voz', 'celular', 'locucao.json')
const BRUTO = path.join(OFICINA, 'amostra-voz', '_bruto')
describe('locução de referência (só na oficina)', { skip: !fs.existsSync(REF) && 'sem a oficina' }, () => {
  test('passa no validar', () => {
    assert.deepEqual(validarLocucao(JSON.parse(fs.readFileSync(REF, 'utf8')), path.dirname(REF)), [])
  })
  test('o gerar monta, a partir do MP3 e do alinhamento crus, a mesma locução', () => {
    const ref = JSON.parse(fs.readFileSync(REF, 'utf8'))
    const d = tmp('ref')
    for (const f of ref.falas) {
      const wav = path.join(d, `${f.id}.wav`)
      mp3ParaWav(path.join(BRUTO, `${f.id}.mp3`), wav)
      assert.equal(limparInicio(wav), 0, `${f.id}: a referência não tem estalo, não se mexe nela`)
      const al = JSON.parse(fs.readFileSync(path.join(BRUTO, `${f.id}.alinhamento.json`), 'utf8')).alignment
      const feita = montarFala({ fala: f, pron: aplicarPronuncia(f.texto, {}), alinhamento: al, wav, arquivo: f.arquivo })
      assert.deepEqual(feita, f, f.id)
    }
  })
})

// ── ponta a ponta, contra a API falsa ────────────────────────────────────────────────────────────
describe('voz.mjs contra a API falsa', () => {
  let api, env
  before(async () => {
    api = await subirApiFalsa({ chave: CHAVE })
    env = { ELEVENLABS_API_BASE: api.url }
    api.estado.vozes.v1 = { voice_id: 'v1', name: 'Voz Inventada', category: 'professional', is_owner: false, sharing: { disable_at_unix: null, notice_period: 365 } }
  })
  after(() => api.fechar())

  function video(roteiroExtra = {}) {
    const d = tmp('video')
    const rot = { idioma: 'pt-BR', perfil: 'calmo', voz: { id: 'v1', nome: 'Voz Inventada' }, pronuncia: { Vyrta: 'Vírta' }, falas: [
      { id: 'abertura', onde: 'abertura', texto: 'Reservar uma bicicleta.' },
      { id: 'p1', onde: { passo: 1 }, texto: 'Abra o Vyrta e toque em Reservar.' },
      { id: 'fechamento', onde: 'fechamento', texto: 'Pronto. Boa pedalada.' }], ...roteiroExtra }
    escrever(path.join(d, 'voz', 'celular', 'roteiro.json'), rot)
    return { d, rot: path.join(d, 'voz', 'celular', 'roteiro.json'), saida: path.join(d, 'voz', 'celular') }
  }

  test('gerar: uma requisição por fala, com os vizinhos, e a locução passa no contrato', async () => {
    const v = video()
    api.zerar()
    const r = await rodar(['gerar', v.rot, '--saida', v.saida], { env })
    assert.equal(r.code, 0, r.tudo)
    const tts = api.tts()
    assert.equal(tts.length, 3)
    assert.deepEqual(tts.map((p) => p.json.text), ['Reservar uma bicicleta.', 'Abra o Vírta e toque em Reservar.', 'Pronto. Boa pedalada.'])
    assert.equal(tts[1].json.previous_text, 'Reservar uma bicicleta.')
    assert.equal(tts[1].json.next_text, 'Pronto. Boa pedalada.')
    assert.equal(tts[0].json.previous_text, undefined)
    assert.equal(tts[0].consulta.get('output_format'), 'mp3_44100_128')
    assert.equal(tts[0].json.voice_settings.speed, 0.95)
    assert.equal(tts[0].json.language_code, undefined, 'o multilingual_v2 não aceita language_code')
    assert.match(r.out, /3 para gerar · 77 caracteres novos/)
    assert.match(r.out, /saldo: plano starter/)
    assert.match(r.out, /custo real \(header character-cost\): 30\.8 por 77 caracteres/)
    const loc = JSON.parse(fs.readFileSync(path.join(v.saida, 'locucao.json'), 'utf8'))
    assert.deepEqual(validarLocucao(loc, v.saida), [])
    const p1 = loc.falas.find((f) => f.id === 'p1')
    assert.equal(p1.texto, 'Abra o Vyrta e toque em Reservar.')
    assert.deepEqual(p1.palavras[2], { ...p1.palavras[2], texto: 'Vyrta', dito: 'Vírta' })
    assert.deepEqual(loc.falas.map((f) => f.onde), ['abertura', { passo: 1 }, 'fechamento'])
    assert.ok(loc.falas.every((f) => Math.abs(f.inicio_voz - 0.12) < 0.03), 'o primeiro som medido, não o 0,000 do alinhamento')
    const val = await rodar(['validar', path.join(v.saida, 'locucao.json')])
    assert.equal(val.code, 0, val.tudo)
    const reg = fs.readFileSync(path.join(v.d, 'voz', '_takes', 'chamadas.jsonl'), 'utf8')
    assert.equal(reg.trim().split('\n').length, 5, 'assinatura + voz + 3 falas')
    assert.ok(!reg.includes(CHAVE) && !r.tudo.includes(CHAVE))
    const takes = fs.readdirSync(path.join(v.d, 'voz', '_takes')).filter((f) => /^[0-9a-f]{64}$/.test(f))
    assert.equal(takes.length, 3)
    const info = JSON.parse(fs.readFileSync(path.join(v.d, 'voz', '_takes', takes[0], 'take.json'), 'utf8'))
    for (const campo of ['request_id', 'data', 'custo', 'alinhamento', 'pedido']) assert.ok(info[campo] != null, campo)

    // 2ª rodada: tudo do cache, nenhuma chamada, mesma locução
    const antes = fs.readFileSync(path.join(v.saida, 'locucao.json'), 'utf8')
    api.zerar()
    const r2 = await rodar(['gerar', v.rot, '--saida', v.saida], { env })
    assert.equal(r2.code, 0, r2.tudo)
    assert.equal(api.pedidos.length, 0)
    assert.match(r2.out, /chamadas à API: 0/)
    assert.equal(fs.readFileSync(path.join(v.saida, 'locucao.json'), 'utf8'), antes)

    // --refazer: só aquela fala, e o take antigo fica guardado
    api.zerar()
    const r3 = await rodar(['gerar', v.rot, '--saida', v.saida, '--refazer', 'p1'], { env })
    assert.equal(r3.code, 0, r3.tudo)
    assert.deepEqual(api.tts().map((p) => p.json.text), ['Abra o Vírta e toque em Reservar.'])
    assert.match(r3.out, /take antigo guardado em [0-9a-f]{64}[\\/]antigos/)

    // mudar uma frase regera ela e as vizinhas (o vizinho entra na chave)
    const rot = JSON.parse(fs.readFileSync(v.rot, 'utf8'))
    rot.falas[1].texto = 'Abra o Vyrta e toque em Nova reserva.'
    escrever(v.rot, rot)
    api.zerar()
    const r4 = await rodar(['gerar', v.rot, '--saida', v.saida], { env })
    assert.equal(r4.code, 0, r4.tudo)
    assert.equal(api.tts().length, 3)
  })

  test('teto: acima dele, para sem gastar e pede --sim', async () => {
    const v = video()
    api.zerar()
    const r = await rodar(['gerar', v.rot, '--saida', v.saida, '--teto', '50'], { env })
    assert.equal(r.code, 2)
    assert.match(r.err, /passam do teto de 50.*--sim/s)
    assert.equal(api.tts().length, 0)
    const r2 = await rodar(['gerar', v.rot, '--saida', v.saida, '--teto', '50', '--sim'], { env })
    assert.equal(r2.code, 0, r2.tudo)
  })

  test('sem chave: ensina a criar o arquivo no Mac e no Windows, sem chamar a API', async () => {
    const v = video()
    api.zerar()
    const r = await rodar(['gerar', v.rot, '--saida', v.saida], { env, semChave: true })
    assert.equal(r.code, 1)
    assert.match(r.err, /elevenlabs\.env/)
    assert.match(r.err, /read -rs k/)
    assert.match(r.err, /Read-Host .* -AsSecureString/)
    assert.equal(api.pedidos.length, 0)
    assert.ok(comoPorChave().includes('Nunca cole a chave'))
  })

  test('a chave vem do arquivo ~/.claude/secrets/elevenlabs.env', async () => {
    const casa = tmp('casa')
    escrever(path.join(casa, '.claude', 'secrets', 'elevenlabs.env'), `# comentário\nELEVENLABS_API_KEY="${CHAVE}"\n`)
    const r = await rodar(['conta'], { env, semChave: true, home: casa })
    assert.equal(r.code, 0, r.tudo)
  })

  test('a chave nunca aparece, nem quando a API a devolve no erro', async () => {
    const v = video()
    api.estado.devolverChaveNo401 = true
    try {
      const r = await rodar(['gerar', v.rot, '--saida', v.saida, '--registro', path.join(v.d, 'reg.jsonl')], { env })
      assert.equal(r.code, 1)
      assert.match(r.err, /recusou a chave \(401\)/)
      assert.match(r.err, /«chave»/)
      assert.ok(!r.tudo.includes(CHAVE))
      assert.ok(!fs.readFileSync(path.join(v.d, 'reg.jsonl'), 'utf8').includes(CHAVE))
    } finally { api.estado.devolverChaveNo401 = false }
  })

  test('conta: plano, créditos e, no grátis, o que muda', async () => {
    let r = await rodar(['conta'], { env })
    assert.equal(r.code, 0, r.tudo)
    assert.match(r.out, /plano starter · créditos usados/)
    api.estado.tier = 'free'
    try {
      r = await rodar(['conta'], { env })
      assert.match(r.out, /sem uso comercial/)
      assert.match(r.out, /atribuição obrigatória/)
      assert.match(r.out, /vozes padrão/)
    } finally { api.estado.tier = 'starter' }
  })

  test('buscar: manda os filtros e tira as vozes que não servem num vídeo', async () => {
    const base = { category: 'professional', rate: 1, fiat_rate: null, live_moderation_enabled: false, gender: 'female', age: 'young', accent: 'brazilian', language: 'pt', locale: 'pt-BR', descriptive: 'calm', use_case: 'informative_educational', verified_languages: [{ language: 'pt', model_id: 'eleven_multilingual_v2', accent: 'brazilian', locale: 'pt-BR' }] }
    api.estado.biblioteca = [
      { ...base, voice_id: 'boa', name: 'Serena Inventada', notice_period: 365 },
      { ...base, voice_id: 'curta', name: 'Aviso Curto', notice_period: 30 },
      { ...base, voice_id: 'cara', name: 'Tarifa Alta', notice_period: 365, fiat_rate: 0.5 },
      { ...base, voice_id: 'vigiada', name: 'Moderada', notice_period: 365, live_moderation_enabled: true },
    ]
    api.zerar()
    const r = await rodar(['buscar', '--idioma', 'pt', '--local', 'pt-BR', '--genero', 'female', '--uso', 'informative_educational', '--descritivo', 'calm'], { env })
    assert.equal(r.code, 0, r.tudo)
    const q = api.pedidos.find((p) => p.caminho === '/v1/shared-voices').consulta
    assert.equal(q.get('language'), 'pt')
    assert.equal(q.get('locale'), 'pt-BR')
    assert.equal(q.get('gender'), 'female')
    assert.equal(q.get('use_cases'), 'informative_educational')
    assert.equal(q.get('descriptives'), 'calm')
    assert.equal(q.get('min_notice_period_days'), '180')
    assert.equal(q.get('include_custom_rates'), 'false')
    assert.equal(q.get('include_live_moderated'), 'false')
    assert.equal(q.get('sort'), 'usage_character_count_1y')
    assert.match(r.out, /4 vozes na busca · 1 usáveis/)
    assert.match(r.out, /Serena Inventada {2}\[boa\]/)
    assert.doesNotMatch(r.out, /Aviso Curto|Tarifa Alta|Moderada/)
    const ruim = await rodar(['buscar', '--ordem', 'popular'], { env })
    assert.equal(ruim.code, 1)
    assert.match(ruim.err, /--ordem tem de ser/)
  })

  test('buscar no plano grátis mostra as vozes padrão', async () => {
    api.estado.tier = 'free'
    api.estado.padrao = [{ voice_id: 'pd1', name: 'Padrão Um', category: 'premade', labels: { accent: 'american', gender: 'male' }, verified_languages: [{ language: 'pt', model_id: 'eleven_multilingual_v2' }] }]
    try {
      api.zerar()
      const r = await rodar(['buscar', '--idioma', 'pt'], { env })
      assert.equal(r.code, 0, r.tudo)
      assert.equal(api.pedidos.find((p) => p.caminho === '/v2/voices').consulta.get('voice_type'), 'default')
      assert.match(r.out, /Padrão Um {2}\[pd1\]/)
      assert.ok(!api.pedidos.some((p) => p.caminho === '/v1/shared-voices'))
    } finally { api.estado.tier = 'starter' }
  })

  test('amostras: a primeira frase real do roteiro lida por três vozes; a 2ª rodada vem do cache', async () => {
    const v = video()
    for (const id of ['a1', 'a2', 'a3']) api.estado.vozes[id] = { voice_id: id, name: `Candidata ${id}`, category: 'professional', is_owner: false, sharing: {} }
    api.zerar()
    const r = await rodar(['amostras', '--roteiro', v.rot, '--vozes', 'a1,a2,a3'], { env })
    assert.equal(r.code, 0, r.tudo)
    assert.deepEqual(api.tts().map((p) => [p.caminho.split('/')[3], p.json.text]), [['a1', 'Reservar uma bicicleta.'], ['a2', 'Reservar uma bicicleta.'], ['a3', 'Reservar uma bicicleta.']])
    const pasta = path.join(v.saida, 'amostras')
    assert.deepEqual(fs.readdirSync(pasta).filter((f) => f.endsWith('.mp3')).sort(), ['1-candidata-a1.mp3', '2-candidata-a2.mp3', '3-candidata-a3.mp3'])
    assert.match(fs.readFileSync(path.join(pasta, 'amostras.md'), 'utf8'), /Ninguém ouviu/)
    api.zerar()
    const r2 = await rodar(['amostras', '--roteiro', v.rot, '--vozes', 'a1,a2,a3'], { env })
    assert.equal(r2.code, 0, r2.tudo)
    assert.equal(api.pedidos.length, 0)
  })

  test('conferir: passa com o alinhamento no lugar e sai com código 1 com a voz deslocada 120 ms', async () => {
    const v = video()
    await rodar(['gerar', v.rot, '--saida', v.saida], { env })
    const loc = path.join(v.saida, 'locucao.json')
    api.zerar()
    const r = await rodar(['conferir', loc], { env })
    assert.equal(r.code, 0, r.tudo)
    assert.match(r.out, /✓ 3 de 3 falas com toda palavra a ±80 ms/)
    const fa = api.pedidos.filter((p) => p.caminho === '/v1/forced-alignment')
    assert.equal(fa.length, 3)
    assert.equal(fa[1].texto, 'Abra o Vírta e toque em Reservar.', 'o alinhamento forçado recebe o que foi dito')
    api.estado.desvio = 0.12
    try {
      const r2 = await rodar(['conferir', loc], { env })
      assert.equal(r2.code, 1, r2.tudo)
      assert.match(r2.out, /começa 1\d\d ms depois/)
    } finally { api.estado.desvio = 0 }
  })

  test('ouvir: transcreve cada fala sem keyterms e sai com código 1 se a palavra de risco não foi ouvida', async () => {
    const v = video()
    await rodar(['gerar', v.rot, '--saida', v.saida], { env })
    const loc = path.join(v.saida, 'locucao.json')
    Object.assign(api.estado.ouvido, { 'abertura.wav': 'Reservar uma bicicleta.', 'p1.wav': 'Abra o Virta e toque em reservar.', 'fechamento.wav': 'Pronto, boa pedalada.' })
    api.zerar()
    const r = await rodar(['ouvir', loc], { env })
    assert.equal(r.code, 0, r.tudo)
    const stt = api.pedidos.filter((p) => p.caminho === '/v1/speech-to-text')
    assert.equal(stt.length, 3)
    assert.equal(stt[0].modelo, 'scribe_v2')
    assert.equal(stt[0].idioma, 'pt')
    assert.equal(stt[0].keyterms, null, 'keyterms enviesariam a transcrição para a palavra certa')
    assert.match(fs.readFileSync(path.join(v.saida, 'ouvido.md'), 'utf8'), /\| p1 \| Vyrta \|/)
    api.estado.ouvido['p1.wav'] = 'Abra o Virgo e toque em reservar.'
    try {
      const r2 = await rodar(['ouvir', loc], { env })
      assert.equal(r2.code, 1, r2.tudo)
      assert.match(r2.out, /RISCO "Vyrta" \(dito "Vírta"\) não aparece/)
      const r3 = await rodar(['ouvir', loc, '--fala', 'abertura', '--palavras', 'bicicleta'], { env })
      assert.equal(r3.code, 0, r3.tudo)
    } finally { api.estado.ouvido = {} }
  })

  test('voz que vai sair da biblioteca: o gerar avisa a data', async () => {
    api.estado.vozes.sai = { voice_id: 'sai', name: 'Voz de Saída', category: 'professional', is_owner: false, sharing: { disable_at_unix: Math.floor(Date.now() / 1000) + 40 * 86400, notice_period: 180 } }
    const v = video({ voz: { id: 'sai' } })
    const r = await rodar(['gerar', v.rot, '--saida', v.saida], { env })
    assert.equal(r.code, 0, r.tudo)
    assert.match(r.out, /vai sair da biblioteca em .* \(daqui a 40 dias/)
    const r2 = await rodar(['gerar', v.rot, '--saida', v.saida], { env })
    assert.match(r2.out, /vai sair da biblioteca/, 'avisa também quando tudo vem do cache')
  })

  test('voz da biblioteca ainda não usada: consulta de novo depois da 1ª fala e guarda a data de saída', async () => {
    api.estado.vozes.nova = { voice_id: 'nova', name: 'Voz Nova da Biblioteca', category: 'professional', is_owner: null, sharing: { status: 'copied', disable_at_unix: Math.floor(Date.now() / 1000) + 200 * 86400, notice_period: 730 } }
    api.estado.naoUsadas.add('nova')
    const v = video({ voz: { id: 'nova' } })
    api.zerar()
    const r = await rodar(['gerar', v.rot, '--saida', v.saida], { env })
    assert.equal(r.code, 0, r.tudo)
    assert.deepEqual(api.pedidos.map((p) => `${p.metodo} ${p.caminho.replace(/\/with-timestamps$/, '')}`), [
      'GET /v1/user/subscription', 'GET /v1/voices/nova', 'POST /v1/text-to-speech/nova', 'GET /v1/voices/nova', 'POST /v1/text-to-speech/nova', 'POST /v1/text-to-speech/nova'])
    assert.match(r.out, /"Voz Nova da Biblioteca" vai sair da biblioteca em .* \(daqui a 200 dias/)
    const loc = JSON.parse(fs.readFileSync(path.join(v.saida, 'locucao.json'), 'utf8'))
    assert.equal(loc.voz.nome, 'Voz Nova da Biblioteca', 'o nome vem da consulta feita depois do uso')
  })

  test('clone sem autorização escrita: recusa antes de gastar; com ela, gera', async () => {
    api.estado.vozes.clone = { voice_id: 'clone', name: 'Clone de Alguém', category: 'cloned', is_owner: true, sharing: null }
    const v = video({ voz: { id: 'clone' } })
    api.zerar()
    const r = await rodar(['gerar', v.rot, '--saida', v.saida], { env })
    assert.equal(r.code, 1)
    assert.match(r.err, /autorização escrita/)
    assert.equal(api.tts().length, 0)
    escrever(path.join(v.saida, 'autorizacao.txt'), 'Eu, Fulana Inventada, autorizo o uso da minha voz neste vídeo. Assinado.')
    const rot = JSON.parse(fs.readFileSync(v.rot, 'utf8'))
    rot.voz.autorizacao = 'autorizacao.txt'
    escrever(v.rot, rot)
    const r2 = await rodar(['gerar', v.rot, '--saida', v.saida], { env })
    assert.equal(r2.code, 0, r2.tudo)
  })

  test('os takes não moram dentro de saida/', async () => {
    const v = video()
    const r = await rodar(['gerar', v.rot, '--saida', v.saida, '--takes', path.join(v.d, 'saida', 'celular', '_takes')], { env })
    assert.equal(r.code, 1)
    assert.match(r.err, /não podem morar dentro de uma pasta saida/)
  })
})
