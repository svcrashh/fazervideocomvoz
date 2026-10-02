#!/usr/bin/env node
// Molde tela-real-com-camera: monta e renderiza um tutorial a partir de um arquivo de parâmetros.
//   node montar.mjs exemplo.json [--modo rascunho|final] [--formato 16x9|9x16|1x1] [--sem-render]
// Lê a gravação do gravador da skill (eventos.json + quadros.json + quadros/), a locução opcional
// (locucao.json do voz.mjs) e a marca; escreve o projeto do motor em <saida>/<id>/proj e os vídeos
// <saida>/<id>-<formato>.mp4 com a voz mixada, mais a folha de quadros de cada formato.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const SKILL = path.resolve(AQUI, '..', '..')
const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d }
const arqParams = argv.find((a) => a.endsWith('.json'))
if (!arqParams) { console.error('uso: node montar.mjs <parametros.json> [--modo rascunho|final] [--formato 16x9] [--sem-render]'); process.exit(1) }
const BASE = path.dirname(path.resolve(arqParams))
const cam = (p) => (p ? path.resolve(BASE, p.replace(/^~(?=$|\/)/, os.homedir())) : null)
const P = JSON.parse(fs.readFileSync(arqParams, 'utf8'))
const modo = arg('modo', 'rascunho')
const formatos = arg('formato') ? [arg('formato')] : P.formatos || ['16x9', '9x16']
const falha = (m) => { console.error('✗ ' + m); process.exit(1) }

// ── gravação ──────────────────────────────────────────────────────────────────────────────────────
const G = cam(P.gravacao)
if (!G || !fs.existsSync(path.join(G, 'eventos.json'))) falha(`não achei eventos.json em ${G} (grave antes com o gravador da skill: references/tutorial.md §3)`)
const ev = JSON.parse(fs.readFileSync(path.join(G, 'eventos.json'), 'utf8'))
const quadros = JSON.parse(fs.readFileSync(path.join(G, 'quadros.json'), 'utf8'))
const vp = ev.aparelho.viewport, dsf = ev.aparelho.dsf
const eventos = ev.eventos.slice().sort((a, b) => a.t - b.t)
const passosEv = eventos.filter((e) => e.tipo === 'passo')
if (!passosEv.length) falha('a gravação não tem nenhum g.passo')
const sucessoEv = eventos.find((e) => e.tipo === 'sucesso')
const fimGrav = Math.min(ev.duracao, sucessoEv ? sucessoEv.t + (P.segurarSucesso ?? 1.4) : ev.duracao)

// ── voz (opcional) ────────────────────────────────────────────────────────────────────────────────
let loc = null, LOCDIR = null
if (P.voz && P.voz.locucao) {
  const a = cam(P.voz.locucao)
  if (!fs.existsSync(a)) falha(`não achei a locução ${a}`)
  loc = JSON.parse(fs.readFileSync(a, 'utf8')); LOCDIR = path.dirname(a)
}
const fala = (onde) => loc && loc.falas.find((f) => (typeof f.onde === 'string' ? f.onde === onde : f.onde.passo === onde))

// ── linha do tempo ────────────────────────────────────────────────────────────────────────────────
const vel = P.velocidade || 1
const abertura = P.abertura ?? 1.8, geral = P.planoGeral ?? 1.0, interDur = P.intertituloDur ?? 1.1
const etapas = P.etapas || [{ passos: passosEv.map((p) => p.n) }]
const etapaDe = (n) => etapas.findIndex((e) => e.passos.includes(n))
const trechos = [], inters = [], passos = []
let v = abertura + geral
const textoPasso = (p) => (P.passos && P.passos[p.n] && P.passos[p.n].frase) || p.legenda
passosEv.forEach((p, i) => {
  const r0 = i === 0 ? Math.max(0, p.t - 0.05) : p.t, r1 = i + 1 < passosEv.length ? passosEv[i + 1].t : fimGrav
  const et = etapaDe(p.n)
  if (i > 0 && et !== etapaDe(passosEv[i - 1].n) && etapas[et] && etapas[et].intertitulo) {
    inters.push({ v0: v, v1: v + interDur, texto: etapas[et].intertitulo }); v += interDur
  }
  const d = (r1 - r0) / vel
  trechos.push({ v0: v, v1: v + d, r0, r1, vel })
  passos.push({ n: p.n, frase: textoPasso(p), v0: v, v1: v + d, corte: inters.length && inters[inters.length - 1].v1 === v })
  v += d
})
const vDe = (r) => {
  for (const s of trechos) if (r >= s.r0 && r <= s.r1) return s.v0 + (r - s.r0) / s.vel
  if (r < trechos[0].r0) return trechos[0].v0
  for (let i = trechos.length - 1; i >= 0; i--) if (r > trechos[i].r1) return trechos[i].v1
  return trechos[0].v0
}
const holdFim = P.segurarFim ?? 0.4
const fimV0 = v + holdFim
const falaFim = fala('fechamento')
const fimDur = Math.max(P.fimDur ?? 2.4, falaFim ? 0.35 + falaFim.duracao + 0.5 : 0)
const dur = +(fimV0 + fimDur).toFixed(3)

// focos da câmera: o campo de cada ação, chegando um pouco antes do toque; a rolagem leva o foco junto
const ACOES = new Set(['toque', 'aponta', 'digita', 'escolhe', 'data', 'arquivo'])
const minW = P.contexto?.w ?? 420, minH = P.contexto?.h ?? 220
const comContexto = (r) => {
  const w = Math.min(vp.width, Math.max(r.w + 48, minW)), h = Math.min(vp.height, Math.max(r.h + 48, minH))
  const x = Math.min(Math.max(0, r.x + r.w / 2 - w / 2), vp.width - w), y = Math.min(Math.max(0, r.y + r.h / 2 - h / 2), vp.height - h)
  return { x, y, w, h, alvo: r }
}
const focos = []
let ultimo = null, vAnt = abertura + geral - 0.2
for (const e of eventos) {
  if (e.t > fimGrav) break
  let reg = null, ve = null, d = 0.85
  if (ACOES.has(e.tipo) && e.ret) { reg = comContexto(e.ret); ve = vDe(e.t) - 0.08 }
  else if (e.tipo === 'rola' && ultimo && e.dy) { reg = { ...ultimo, y: ultimo.y - e.dy, alvo: { ...ultimo.alvo, y: ultimo.alvo.y - e.dy } }; ve = vDe(e.t1 || e.t); d = Math.max(0.3, ve - vDe(e.t)) }
  else if (e.tipo === 'sucesso' && e.ret) { reg = { ...e.ret, alvo: e.ret }; ve = vDe(e.t) + 0.5 }
  if (!reg) continue
  ve = Math.max(ve, vAnt + 0.3)
  const ent = inters.find((it) => ve - d < it.v1 && ve > it.v0)
  if (ent) { d = Math.max(0.001, ve - ent.v1 + 0.0); if (ve - d < ent.v1) d = 0.001 }
  focos.push({ v: +ve.toFixed(3), dur: +Math.min(d, ve - vAnt).toFixed(3), reg: { x: reg.x, y: reg.y, w: reg.w, h: reg.h } })
  ultimo = reg; vAnt = ve
}
const cursor = [], toques = []
for (const e of eventos) {
  if (e.t > fimGrav) break
  if (e.tipo === 'move') { cursor.push({ v: vDe(e.t), x: e.de[0], y: e.de[1] }, { v: vDe(e.t1), x: e.para[0], y: e.para[1] }) }
  if ((e.tipo === 'toque' || e.tipo === 'aponta') && e.ponto) { cursor.push({ v: vDe(e.t), x: e.ponto[0], y: e.ponto[1] }); if (e.tipo === 'toque') toques.push({ v: vDe(e.t), x: e.ponto[0], y: e.ponto[1] }) }
}
cursor.sort((a, b) => a.v - b.v)
const ultFoco = focos[focos.length - 1]
const fimOrigem = ultFoco ? { x: ultFoco.reg.x + ultFoco.reg.w / 2, y: ultFoco.reg.y + ultFoco.reg.h / 2 } : null

// falas na linha do tempo do vídeo
const falasV = []
const fAb = fala('abertura')
const iniAb = P.voz?.inicioAbertura ?? 0.25
if (fAb) falasV.push({ id: fAb.id, texto: fAb.texto, arquivo: fAb.arquivo, v0: iniAb, palavras: fAb.palavras.map((w) => ({ texto: w.texto, ini: +(iniAb + w.ini).toFixed(3), fim: +(iniAb + w.fim).toFixed(3) })) })
for (const p of passos) { const f = fala(p.n); if (f) falasV.push({ id: f.id, texto: f.texto, arquivo: f.arquivo, v0: p.v0 + 0.1, palavras: f.palavras.map((w) => ({ texto: w.texto, ini: +(p.v0 + 0.1 + w.ini).toFixed(3), fim: +(p.v0 + 0.1 + w.fim).toFixed(3) })) }) }
if (falaFim) { const i0 = fimV0 + 0.35; falasV.push({ id: falaFim.id, texto: falaFim.texto, arquivo: falaFim.arquivo, v0: i0, palavras: falaFim.palavras.map((w) => ({ texto: w.texto, ini: +(i0 + w.ini).toFixed(3), fim: +(i0 + w.fim).toFixed(3) })) }) }

// ── projeto do motor ──────────────────────────────────────────────────────────────────────────────
const SAIDA = cam(P.saida || '.')
const PROJ = path.join(SAIDA, P.id, 'proj')
fs.mkdirSync(PROJ, { recursive: true })
for (const f of ['index.html', 'cena.js']) fs.copyFileSync(path.join(AQUI, f), path.join(PROJ, f))
fs.copyFileSync(path.join(SKILL, 'assets/template/engine.js'), path.join(PROJ, 'engine.js'))
const liga = (de, para) => { try { fs.rmSync(para, { recursive: true, force: true }) } catch {} ; fs.symlinkSync(de, para) }
liga(path.join(G, 'quadros'), path.join(PROJ, 'quadros'))
const FONTES = cam(P.marca.fontesPasta)
if (!FONTES || !fs.existsSync(path.join(FONTES, 'fontes.css'))) falha(`a marca precisa de fontesPasta com fontes.css (gere com node ${SKILL}/scripts/fontes.mjs <pasta> "Família")`)
liga(FONTES, path.join(PROJ, 'fontes'))
let logo = null
if (P.marca.logo) {
  const a = cam(P.marca.logo.arquivo), ext = path.extname(a)
  fs.copyFileSync(a, path.join(PROJ, 'logo' + ext))
  logo = { arquivo: 'logo' + ext, w: P.marca.logo.w, h: P.marca.logo.h }
}
const familias = [...new Set(Object.values(P.marca.fontes).map((f) => f.familia))]
const corTexto = P.marca.cores.texto
const DADOS = {
  tela: { w: vp.width, h: vp.height, dsf },
  quadros: quadros.map(([a, t]) => ['quadros/' + a, t]),
  endereco: P.endereco || null,
  logo,
  marca: { cores: { veu: P.marca.cores.fundo, fimFundo: P.marca.cores.destaque, fimTexto: P.marca.cores.fundo, sobreDestaque: P.marca.cores.fundo, ...P.marca.cores, texto: corTexto }, fontes: P.marca.fontes, veu: P.marca.veu ?? 0.58, textura: P.marca.textura || 'pontos' },
  textos: {
    rotulo: P.rotulo || '', passo: P.textoPasso || 'Passo {n} de {N}', fim: P.fim?.linha || 'Pronto!', fimApoio: P.fim?.apoio || '',
    tituloLinhas: Array.isArray(P.titulo) ? { padrao: P.titulo } : P.titulo,
  },
  linha: { abertura, geral1: abertura + geral, trechos, inters, passos, focos, cursor, toques, falas: falasV, fim: { v0: fimV0, v1: dur }, fimOrigem, dur },
}
fs.writeFileSync(path.join(PROJ, 'dados.js'), 'const DADOS = ' + JSON.stringify(DADOS, null, 1) + '\n')
fs.writeFileSync(path.join(PROJ, 'video.js'), `const VIDEO = ${JSON.stringify({ titulo: P.id, duracao: dur, formatos, plataforma: P.plataforma || null, fontes: familias, fundo: P.marca.cores.fundo, grao: 0, impactos: [] })}\n`)
console.log(`projeto: ${PROJ}\nduração ${dur.toFixed(2)} s · ${passos.length} passos · ${inters.length} intertítulo(s) · ${focos.length} focos · ${falasV.length} fala(s)`)
if (argv.includes('--sem-render')) process.exit(0)

// ── render, voz e folha ───────────────────────────────────────────────────────────────────────────
const sh = (cmd, args) => { const r = spawnSync(cmd, args, { stdio: 'inherit' }); if (r.status !== 0) falha(`${cmd} saiu com ${r.status}`) }
for (const F of formatos) {
  const mudo = path.join(PROJ, 'out', `${F}-${modo}.mp4`)
  const extra = modo === 'final' ? ['--sub', String(P.sub ?? 4), '--crf', '16', '--preset', 'medium'] : []
  sh('node', [path.join(SKILL, 'scripts/render.cjs'), '--projeto', PROJ, '--modo', modo, '--formato', F, '--saida', mudo, '--sem-folha', ...extra])
  const final = path.join(SAIDA, `${P.id}-${F}${modo === 'final' ? '' : '-rascunho'}.mp4`)
  if (falasV.length) {
    const ins = [], fil = []
    falasV.forEach((f, i) => { ins.push('-i', path.join(LOCDIR, f.arquivo)); fil.push(`[${i + 1}:a]adelay=${Math.round(f.v0 * 1000)}:all=1[a${i}]`) })
    const mix = `${fil.join(';')};${falasV.map((_, i) => `[a${i}]`).join('')}amix=inputs=${falasV.length}:normalize=0,apad,atrim=0:${dur},loudnorm=I=-16:TP=-1.5:LRA=11[a]`
    sh('ffmpeg', ['-v', 'error', '-y', '-i', mudo, ...ins, '-filter_complex', mix, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', final])
  } else fs.copyFileSync(mudo, final)
  const folha = final.replace(/\.mp4$/, '-folha.png')
  const [S, Tl] = F === '9x16' ? ['270:-1', '8x3'] : ['480:-1', '6x4']
  sh('ffmpeg', ['-v', 'error', '-y', '-i', final, '-vf', `fps=24/${dur},scale=${S},tile=${Tl}`, '-frames:v', '1', folha])
  console.log(`✓ ${final}\n  folha: ${folha}`)
}
