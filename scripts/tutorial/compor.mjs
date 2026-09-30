// Compõe o tutorial a partir da gravação (gravar.mjs): tela real sobre o fundo da marca, câmera que
// acompanha a ação, indicador de toque/cursor, realce, legenda por passo com virada, abertura e
// fechamento; trilha da série gerada na duração exata (semente própria do vídeo) com os sons nos
// eventos; render no motor; mix e verificação (finalizar.mjs); folha de contato dos eventos.
//
//   node compor.mjs <pasta-do-video> [--versao celular] [--modo rascunho|final] [--sem-trilha] [--sem-render]
//
// Com voz (video.voz, a locução do locucao.mjs): a abertura e o fechamento crescem pela fala, a legenda de cada
// passo é a fala com a palavra falada em destaque, e saem voz.wav (ao lado da folha de sincronia), <id>-<versao>.srt
// e o bloco `voz` da folha, que a trilha mistura. Sem voz, nada disso existe e a saída é a de sempre.
//
// --sem-render monta o projeto e faz só a folha de eventos com a checagem de colisão (sem trilha, sem vídeo):
// é o jeito de olhar um visual novo em segundos.
//
// Tudo o que ele lê: <pasta>/video.mjs (a definição), <pasta>/saida/<versao>/{eventos,quadros}.json e a
// identidade da série (video.serie: pasta com marca.js, fontes/, identidade.json, serie.json e, se a série
// desenha algum elemento por conta própria, visual.js). O visual declarado (serie.json "versao": 2) é
// conferido pelo visual.mjs; série sem "versao" usa o desenho antigo do motor.
// Python com numpy/scipy: $FAZERVIDEO_PYTHON, ou .venv da série/do vídeo/do motor, ou python3.
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { lerMarca, resolverVisual, conferirProprio, somDaTroca, sonsDaAbertura, sonsDoFechamento } from './visual.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const RAIZ = path.resolve(AQUI, '..', '..')          // a skill (ou a cópia do motor num repositório)
const TEMPLATE = path.join(RAIZ, 'assets', 'template')
const AUDIO = path.join(RAIZ, 'assets', 'audio')
const SCRIPTS = path.join(RAIZ, 'scripts')
const argv = process.argv.slice(2)
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d }
const r3 = (x) => +x.toFixed(3)

function acharPython(dirs) {
  const cands = [process.env.FAZERVIDEO_PYTHON, ...dirs.flatMap((d) => [path.join(d, '.venv', 'bin', 'python'), path.join(d, '.venv', 'Scripts', 'python.exe'), path.join(d, 'audio', '.venv', 'bin', 'python')]), 'python3', 'python', 'py']
  for (const c of cands.filter(Boolean)) {
    const r = spawnSync(c, ['-c', 'import numpy, scipy'], { encoding: 'utf8' })
    if (r.status === 0) return c
  }
  throw new Error('Python com numpy e scipy não encontrado. Crie um venv (python3 -m venv .venv && .venv/bin/pip install numpy scipy) na pasta da série, ou defina FAZERVIDEO_PYTHON.')
}

/** Folha de sincronia do vídeo: os sons de efeito caem na amostra exata de cada evento gravado. */
// Com visual (série versão 2), os sons da troca de legenda, da abertura e do fechamento seguem o que a série
// escolheu (visual.mjs); sem visual, é a folha de antes, marco por marco. Com voz, a folha ganha o bloco `voz`
// (Contrato F) e o alvo de loudness e o teto de pico do vídeo falado.
export function folhaDoVideo(video, log, { A, F, semente, serie, visual = null, voz = null }) {
  const D = log.duracao, dur = r3(A + D + F)
  const toque = log.aparelho.toque
  const niv = { ...(serie.niveis || {}) }
  const m = [], ja = new Set()
  const add = (t, evento, efeito, extra = {}) => {
    if (niv[efeito] === false) return   // a série desligou este som (ex.: "niveis": { "sucesso": false })
    const tt = r3(t)
    if (tt <= 0.05 || tt >= dur - 0.3) return
    // dois sons de ataque no mesmo instante viram um só
    const chave = Math.round(tt * 20)
    if (ja.has(chave) && !extra.forca) return
    ja.add(chave)
    m.push({ t: tt, evento, som: efeito, efeito, opcional: false, ...(niv[efeito] != null ? { nivel: niv[efeito] } : {}), ...extra })
  }
  if (!visual) add(A - 0.02, 'a tela aparece (mergulho da abertura)', 'whoosh', { dur: 0.6, opcional: true })
  else for (const s of sonsDaAbertura(visual, A)) add(s.t, s.evento, s.efeito, s.extra)
  for (const e of log.eventos) {
    const t = A + e.t
    if (e.tipo === 'passo' && e.n > 1 && !visual) add(t - 0.25, `passo ${e.n}: a legenda vira`, 'virada')
    if (e.tipo === 'passo' && e.n > 1 && visual) { const s = somDaTroca(visual, t); if (s) add(s.t, `passo ${e.n}: a legenda ${visual.legenda.troca === 'virar' ? 'vira' : 'sobe'}`, s.efeito, s.extra) }
    if (e.tipo === 'toque' && !e.nativo) add(t, `${toque ? 'toque' : 'clique'} em ${e.alvo}`, toque ? 'toque' : 'clique')
    if (e.tipo === 'toque' && e.nativo) add(t, `abre ${e.alvo}`, toque ? 'toque' : 'clique')
    if (e.tipo === 'digita' && e.teclas) add(t, `digita em ${e.alvo}`, 'digitacao', { dur: r3(Math.max(0.2, e.t1 - e.t)), teclas: e.teclas })
    if (e.tipo === 'escolhe') add(A + e.t1, `escolheu "${e.escolhida}"`, 'sucesso', { opcional: true, nivel: (niv.sucesso ?? -2) - 6 })
    if (e.tipo === 'tela') add(t + 0.3, `outra tela: ${e.url}`, 'whoosh', { dur: 0.45, opcional: true })
    if (e.tipo === 'sucesso') add(t, 'sucesso', 'sucesso')
  }
  if (!visual) add(A + D + 0.2, 'fechamento: a cor da marca cobre a tela', 'impacto', { forca: true })
  else for (const s of sonsDoFechamento(visual, A + D + 0.2)) add(s.t, s.evento, s.efeito, s.extra)
  m.sort((a, b) => a.t - b.t)
  const folha = {
    titulo: `${video.id} · ${log.versao}`, duracao: dur, bpm: serie.bpm || 100, compasso: 4, taxa: 48000,
    saida: 'trilha.wav', loudness_lufs: serie.loudness_lufs ?? -18, teto_dbtp: -1.5, semente,
    silencios: [], fade: [r3(dur - 1.2), dur],
    secoes: [
      { nome: 'abertura', de: 0, ate: r3(A), energia: 'baixa', descricao: 'título do tutorial' },
      { nome: 'tela', de: r3(A), ate: r3(A + D), energia: 'baixa', descricao: 'tela real com legendas' },
      { nome: 'fechamento', de: r3(A + D), ate: dur, energia: 'media', descricao: 'fechamento com a marca' },
    ],
    marcos: m,
  }
  if (voz) Object.assign(folha, { loudness_lufs: -14, teto_dbtp: -1.0, voz })
  return folha
}

function sementeDe(s) { return [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 100000000 }

/** O visual da série: null na série antiga (com o aviso de uma linha), o resolvido na versão 2. */
export function visualDaSerie(serie, serieDir) {
  if (serie.versao == null) {
    console.log('  aviso: serie.json sem "versao": este é o desenho antigo do motor, igual para todo produto, não uma identidade (references/tutorial.md §13)')
    return null
  }
  if (serie.versao !== 2) throw new Error(`serie.json: "versao": ${JSON.stringify(serie.versao)} não existe (use 2, ou tire o campo para o desenho antigo)`)
  const { visual, avisos, usaProprio } = resolverVisual(serie, lerMarca(path.join(serieDir, 'marca.js')))
  if (usaProprio) conferirProprio(path.join(serieDir, 'visual.js'), visual)
  for (const a of avisos) console.log('  aviso: ' + a)
  if (!serie.leitura || !fs.existsSync(path.join(serieDir, serie.leitura))) console.log(`  aviso: serie.json não aponta para a leitura do projeto ("leitura": "leitura.md"): sem ela, nada diz por que o visual é este`)
  return { visual, usaProprio }
}

export async function comporVersao(video, v, { modo = 'rascunho', semTrilha = false, semRender = false } = {}) {
  const dir = path.join(video.pasta, 'saida', v)
  let log = JSON.parse(fs.readFileSync(path.join(dir, 'eventos.json'), 'utf8'))
  let quadros = JSON.parse(fs.readFileSync(path.join(dir, 'quadros.json'), 'utf8'))
  const serieDir = path.resolve(video.pasta, video.serie || '../serie')
  const serie = fs.existsSync(path.join(serieDir, 'serie.json')) ? JSON.parse(fs.readFileSync(path.join(serieDir, 'serie.json'), 'utf8')) : {}
  let A = serie.abertura ?? 2.4, F = serie.fechamento ?? 2.8
  if (!fs.existsSync(path.join(serieDir, 'marca.js'))) throw new Error(`a série não tem marca.js: ${serieDir} (veja references/tutorial.md → Identidade)`)
  const vis = visualDaSerie(serie, serieDir)
  const titulo = video.titulo || video.id
  // voz: a locução manda no tempo da abertura e do fechamento e dá o texto de cada legenda. O locucao.mjs só é
  // carregado quando o vídeo tem voz: sem voz, a composição não depende dele.
  const LV = video.voz ? await import('./locucao.mjs') : null
  const loc = LV && LV.lerLocucao(video, v)
  // corte seco nas esperas longas, só quando o vídeo pede (cortes.mjs); a fala do passo nunca é cortada
  if (video.cortarEsperas) {
    const { cortarEsperas } = await import('./cortes.mjs')
    const fimDaFala = loc ? (n) => { const f = loc.passos.get(n); return f ? LV.ENTRA + LV.util(f) : null } : null
    const c = cortarEsperas(log, quadros, video.cortarEsperas, fimDaFala)
    log = c.log; quadros = c.quadros
    for (const [a, b] of c.cortes) console.log(`  corte seco na espera: ${a.toFixed(2).replace('.', ',')}–${b.toFixed(2).replace('.', ',')} s da gravação (${(b - a).toFixed(1).replace('.', ',')} s a menos)`)
  }
  let falasVoz = null, eventos = log.eventos
  if (loc) {
    if (!log.voz) throw new Error(`a gravação de ${v} é de antes da voz: o passo não foi segurado pela fala. Grave de novo (node ${path.join(video.pasta, 'video.mjs')} --versao ${v}).`)
    if (log.voz.sha256 !== loc.sha256) console.log(`  aviso: ${loc.rel} mudou depois da gravação; os tempos foram conferidos de novo contra os passos gravados`)
    LV.conferirTextos(loc, { titulo, fimLinhas: video.fimLinhas || serie.fimLinhas || ['Pronto!'] })
    const A0 = A, F0 = F
    A = LV.duracaoAbertura(loc.abertura, A); F = LV.duracaoFechamento(loc.fechamento, F)
    falasVoz = LV.linhaDoTempo(loc, log, { A, D: log.duracao })
    // a legenda é a fala (a fala vence o que o roteiro escreveu)
    eventos = log.eventos.map((e) => {
      const f = e.tipo === 'passo' && loc.passos.get(e.n)
      if (!f || f.texto === e.legenda) return e
      console.log(`  aviso: passo ${e.n}: a legenda gravada diz "${e.legenda}" e a fala diz "${f.texto}". A legenda é a fala.`)
      return { ...e, legenda: f.texto }
    })
    const cresceu = (x, x0) => `${x.toFixed(2).replace('.', ',')} s${x > x0 ? ` (cresceu de ${x0.toFixed(2).replace('.', ',')} s pela fala)` : ''}`
    console.log(`  voz: ${loc.falas.length} falas de ${loc.rel}, perfil ${loc.perfil} · abertura ${cresceu(A, A0)} · fechamento ${cresceu(F, F0)}`)
  }
  const comp = path.join(dir, 'comp')
  fs.rmSync(comp, { recursive: true, force: true })
  fs.mkdirSync(path.join(comp, 'ferramentas'), { recursive: true })

  // 1 · projeto do motor
  fs.copyFileSync(path.join(TEMPLATE, 'engine.js'), path.join(comp, 'engine.js'))
  fs.copyFileSync(path.join(AQUI, 'tutorial.js'), path.join(comp, 'tutorial.js'))
  if (vis) fs.copyFileSync(path.join(AQUI, 'desenho.js'), path.join(comp, 'desenho.js'))
  if (vis && vis.usaProprio) fs.copyFileSync(path.join(serieDir, 'visual.js'), path.join(comp, 'visual.js'))
  for (const f of ['playwright.cjs', 'quadros.cjs', 'render.cjs', 'finalizar.mjs']) fs.copyFileSync(path.join(SCRIPTS, f), path.join(comp, 'ferramentas', f))
  let html = fs.readFileSync(path.join(TEMPLATE, 'index.html'), 'utf8')
  const extras = vis ? `<script src="desenho.js"></script>\n${vis.usaProprio ? '<script src="visual.js"></script>\n' : ''}` : ''
  html = html.replace('<script src="cenas.js"></script>', `<script src="dados.js"></script>\n${extras}<script src="tutorial.js"></script>\n<script src="cenas.js"></script>`)
  fs.writeFileSync(path.join(comp, 'index.html'), html)
  if (fs.existsSync(path.join(serieDir, 'fontes'))) fs.cpSync(path.join(serieDir, 'fontes'), path.join(comp, 'fontes'), { recursive: true })
  else { fs.mkdirSync(path.join(comp, 'fontes')); fs.writeFileSync(path.join(comp, 'fontes', 'fontes.css'), '') }
  fs.copyFileSync(path.join(serieDir, 'marca.js'), path.join(comp, 'marca.js'))
  const dur = r3(A + log.duracao + F)
  fs.writeFileSync(path.join(comp, 'video.js'), `// gerado pelo compor.mjs — não edite; mude a série ou o vídeo e componha de novo
const VIDEO = ${JSON.stringify({
    titulo, duracao: dur, bpm: serie.bpm || 100, formatos: [log.aparelho.formato], fontes: serie.fontes || [],
    fonteTitulo: serie.fonteTitulo ? `"${serie.fonteTitulo}"` : undefined, fonteTexto: serie.fonteTexto ? `"${serie.fonteTexto}"` : undefined,
    fundo: undefined, grao: 0, impactos: [], selo: null, audio: 'audio/trilha.wav', plataforma: video.plataforma || serie.plataforma || null,
    ...(vis && serie.fonteMono ? { fonteMono: `"${serie.fonteMono}", ui-monospace, Menlo, Consolas, monospace` } : {}),
  }, null, 2)}\n`)
  const quebra = (s, max) => { const ps = s.split(' '), ls = ['']; for (const p of ps) { if ((ls[ls.length - 1] + ' ' + p).trim().length > max && ls[ls.length - 1]) ls.push(p); else ls[ls.length - 1] = (ls[ls.length - 1] + ' ' + p).trim() } return ls }
  const vert = log.aparelho.formato !== '16x9'
  const TU = {
    A, F, duracao: log.duracao, aparelho: log.aparelho, captura: log.captura, eventos,
    quadros: quadros.map(([f, t]) => ['../quadros/' + f, t]),
    textos: {
      rotulo: video.rotulo || serie.rotulo || 'Passo a passo',
      tituloLinhas: video.tituloLinhas || quebra(titulo, vert ? 12 : 24),
      fimLinhas: (video.fimLinhas || serie.fimLinhas || ['Pronto!']).flatMap((l) => quebra(l, vert ? 12 : 24)),
      // rótulo do cartão de legenda; {n} e {N} viram o passo e o total (série em outro idioma)
      passo: video.passo || serie.passo || 'Passo {n} de {N}',
    },
  }
  if (vis) {
    TU.visual = vis.visual
    // a barra do navegador mostra só o domínio: o caminho pode carregar token
    TU.textos.endereco = video.endereco || serie.endereco || (() => { try { return new URL(video.url).host } catch { return '' } })()
  }
  if (loc) {
    const marca = lerMarca(path.join(serieDir, 'marca.js')), LG = vis && vis.visual.legenda
    const cores = vis ? { fundo: LG.tipo === 'solta' ? vis.visual.fundo.cor : LG.fundo, tinta: LG.tinta } : { fundo: '#FFFFFF', tinta: (marca.cores || {}).tinta || '#111111' }
    TU.voz = { destaque: LV.estiloDestaque(marca, cores), falas: falasVoz.filter((f) => typeof f.onde === 'object').map((f) => ({ passo: f.onde.passo, palavras: f.palavras })) }
  }
  fs.writeFileSync(path.join(comp, 'dados.js'), `// gerado pelo compor.mjs a partir de eventos.json e quadros.json\nconst TUTORIAL = ${JSON.stringify(TU)}\n${vis ? 'const VISUAL_PROPRIO = {}   // o visual.js da série preenche (gancho proprio)\n' : ''}`)
  fs.writeFileSync(path.join(comp, 'cenas.js'), 'montarTutorial(TUTORIAL)\n')

  // 2 · trilha da série: semente própria do vídeo e da versão (nunca a mesma trilha esticada)
  fs.mkdirSync(path.join(comp, 'audio'), { recursive: true })
  const semente = video.semente ?? sementeDe(video.id + '·' + v)
  const folha = folhaDoVideo(video, log, { A, F, semente, serie, visual: vis && vis.visual, voz: loc && LV.blocoFolha(falasVoz, loc.perfil) })
  fs.writeFileSync(path.join(comp, 'audio', 'folha.json'), JSON.stringify(folha, null, 2))
  let arqSrt = null
  if (loc) {
    LV.escreverVozWav(falasVoz, dur, path.join(comp, 'audio', 'voz.wav'))
    arqSrt = path.join(video.pasta, `${video.id}-${v}.srt`)
    fs.writeFileSync(arqSrt, LV.srt(falasVoz))
  }
  let trilha = null
  if (!semTrilha && !semRender) {
    for (const f of ['synth.py', 'verifica.py', 'sons.py', 'serie.py', 'arranjo_serie.py', ...(loc ? ['mix_voz.py'] : [])]) fs.copyFileSync(path.join(AUDIO, f), path.join(comp, 'audio', f))
    const ident = path.join(serieDir, 'identidade.json')
    if (!fs.existsSync(ident)) throw new Error(`a série não tem identidade.json (a trilha): ${ident}`)
    fs.copyFileSync(ident, path.join(comp, 'audio', 'identidade.json'))
    const py = acharPython([serieDir, video.pasta, RAIZ])
    const a = spawnSync(py, ['arranjo_serie.py', 'identidade.json', 'folha.json'], { cwd: path.join(comp, 'audio'), encoding: 'utf8' })
    if (a.status !== 0) { console.log(a.stdout, a.stderr); throw new Error('arranjo_serie.py falhou') }
    const ver = spawnSync(py, ['verifica.py', 'folha.json'], { cwd: path.join(comp, 'audio'), encoding: 'utf8' })
    if (ver.status !== 0) { console.log(ver.stdout, ver.stderr); throw new Error('verifica.py reprovou a trilha') }
    trilha = path.join(comp, 'audio', 'trilha.wav')
    let resumo = ''
    try { const vj = JSON.parse(fs.readFileSync(path.join(comp, 'audio', 'trilha.variacao.json'), 'utf8')); const va = vj.variacao || {}; resumo = ` · ${va.tom || ""} ${va.modo || ""}, ${Math.round(vj.bpm_efetivo || va.bpm || 0)} BPM` } catch { /* sem resumo */ }
    console.log(`  trilha: semente ${semente}${resumo} · verifica.py ok`)
  }

  const fmt = log.aparelho.formato
  const final = path.join(video.pasta, `${video.id}-${v}${modo === 'rascunho' ? '-rascunho' : ''}.mp4`)
  if (!semRender) {
  // 3 · render
  const out = path.join(comp, 'out', `${modo}-${fmt}.mp4`)
  const extra = modo === 'final' ? ['--fps', String(serie.fps || 60), '--sub', String(serie.sub || 4)] : []
  // navegadores do render: a série fixa (máquina dividida); sem isso, o render.cjs usa núcleos − 2
  if (serie.workers) extra.push('--workers', String(serie.workers))
  const rr = spawnSync('node', [path.join(comp, 'ferramentas', 'render.cjs'), '--projeto', comp, '--modo', modo, '--formato', fmt, '--saida', out, ...extra], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  const errosRender = (rr.stderr || '').trim()
  if (rr.status === 4) { console.log('  ' + (rr.stderr || '').trim().split('\n').join('\n  ')); throw new Error('a checagem de colisão/área segura reprovou a composição (lista acima): corrija o layout ou os textos, não a checagem') }
  if (rr.status !== 0 && rr.status !== 3) { console.log(rr.stdout, rr.stderr); throw new Error('render falhou') }
  if (errosRender) console.log('  ' + errosRender.split('\n').join('\n  '))

  // 4 · mix + verificação
  if (trilha) {
    const fin = spawnSync('node', [path.join(comp, 'ferramentas', 'finalizar.mjs'), '--projeto', comp, '--video', out, '--audio', trilha, '--folha', path.join(comp, 'audio', 'folha.json'), '--saida', final], { encoding: 'utf8' })
    process.stdout.write(fin.stdout.split('\n').filter((l) => /^[✓✗]/.test(l)).map((l) => '  ' + l).join('\n') + '\n')
    if (fin.status !== 0) throw new Error('finalizar.mjs reprovou ' + final)
  } else fs.copyFileSync(out, final)
  }

  // 5 · folha de contato dos eventos no vídeo composto (obrigatória: olhe antes de mostrar)
  const tempos = new Set([A * 0.5, A - 0.2, A + 0.3])
  for (const e of log.eventos) {
    if (e.tipo === 'toque') { tempos.add(A + e.t - 0.3); tempos.add(A + e.t); tempos.add(A + e.t + 0.35) }
    if (e.tipo === 'passo') { tempos.add(A + e.t - 0.25); tempos.add(A + e.t + 0.6) }
    if (e.tipo === 'escolhe' || e.tipo === 'sucesso') tempos.add(A + (e.t1 || e.t) + 0.4)
    if (e.tipo === 'tela') tempos.add(A + e.t + 0.3)
  }
  tempos.add(A + log.duracao + 0.35); tempos.add(dur - 0.5)
  const lista = [...tempos].filter((t) => t > 0 && t < dur).sort((a, b) => a - b).map((t) => t.toFixed(2))
  const q = spawnSync('node', [path.join(comp, 'ferramentas', 'quadros.cjs'), '--projeto', comp, '--formato', fmt, '--tempos', lista.join(','), '--nome', 'eventos'], { encoding: 'utf8' })
  const folhaImg = (q.stdout.match(/folha de contato: (.*)/) || [])[1]
  if (q.stderr && q.stderr.trim()) console.log('  ' + q.stderr.trim().split('\n').join('\n  '))
  const destinoFolha = path.join(video.pasta, `${video.id}-${v}-folha.png`)
  if (folhaImg) fs.copyFileSync(folhaImg, destinoFolha)
  if (semRender && q.status === 4) throw new Error('a checagem de colisão/área segura reprovou a composição (lista acima): corrija o layout ou os textos, não a checagem')
  return { final: semRender ? null : final, folha: destinoFolha, duracao: dur, colisao: q.status === 4, ...(loc ? { srt: arqSrt, voz: path.join(comp, 'audio', 'voz.wav') } : {}) }
}

export async function compor(pasta, { versao = opt('versao'), modo = opt('modo', 'rascunho'), semTrilha = argv.includes('--sem-trilha'), semRender = argv.includes('--sem-render') } = {}) {
  const video = (await import(pathToFileURL(path.join(path.resolve(pasta), 'video.mjs')).href)).default
  const versoes = versao ? [versao] : (video.versoes || []).filter((v) => fs.existsSync(path.join(video.pasta, 'saida', v, 'eventos.json')))
  if (!versoes.length) throw new Error(`nada gravado em ${video.pasta}/saida: rode primeiro node ${path.join(pasta, 'video.mjs')}`)
  const res = []
  for (const v of versoes) {
    console.log(`compondo ${video.id} (${v}, ${modo})…`)
    const r = await comporVersao(video, v, { modo, semTrilha, semRender })
    console.log(`✓ ${r.final || '(sem render)'} (${r.duracao.toFixed(1)} s)\n  folha de contato: ${r.folha}  ← OLHE antes de mostrar a qualquer pessoa`)
    res.push(r)
  }
  return res
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const alvo = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--') && !['--sem-trilha', '--sem-render'].includes(argv[i - 1])))
  if (!alvo) { console.error('uso: node compor.mjs <pasta-do-video> [--versao v] [--modo rascunho|final] [--sem-trilha] [--sem-render]'); process.exit(1) }
  try { await compor(alvo) } catch (e) { console.error('✗ ' + e.message); process.exit(1) }
}
