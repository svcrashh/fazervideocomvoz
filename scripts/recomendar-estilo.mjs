#!/usr/bin/env node
// Recomenda o estilo do vídeo pela tabela objetivo × canal × tipo de produto (references/catalogo/escolha.md).
//   node recomendar-estilo.mjs --objetivo novidade --canal reels --produto jovem [--itens 8] [--nome "Produto"] [--caixa-de-texto] [--ultimo <estilo>] [--json]
//   node recomendar-estilo.mjs registrar --nome "Produto" --estilo <estilo> [--video <pasta>]
//   node recomendar-estilo.mjs estilos
// O histórico (último estilo por produto) fica em ~/.claude/fazervideocomvoz/historico.json: é o que impede
// "capítulos com índice" de ser recomendado duas vezes seguidas para o mesmo produto.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const skill = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const historicoArq = path.join(os.homedir(), '.claude', 'fazervideocomvoz', 'historico.json')

export const ESTILOS = {
  'tela-real-com-camera': { nome: 'Tela real com câmera', frase: 'a tela real do produto, com a câmera indo até o campo da vez e véu no resto; cartão de passo e "Pronto!" no fim', molde: 'moldes/tela-real-com-camera/MOLDE.md' },
  'texto-que-se-digita': { nome: 'Texto que se digita', frase: 'a pergunta ou o pedido escrito na tela desde o quadro 0, e o produto respondendo', molde: 'moldes/texto-que-se-digita/MOLDE.md' },
  'lista-que-corre': { nome: 'Lista que corre', frase: 'cada novidade é uma frase curta + a prova na tela, em rajada, lista ou cartaz, e o muro com tudo no fim', molde: 'moldes/lista-que-corre/MOLDE.md' },
  'numero-que-conta': { nome: 'Número que conta', frase: 'um número só, gigante, com rótulo de três palavras; vídeo de 6–20 s ou bloco de abertura/fecho', molde: 'moldes/numero-que-conta/MOLDE.md' },
  'antes-e-depois': { nome: 'Antes e depois', frase: 'a mesma tela no mesmo lugar em dois estados, cortada no clique (ou o zoom-out que revela o todo)', molde: 'moldes/antes-e-depois/MOLDE.md' },
  'teaser-de-luz': { nome: 'Teaser de luz', frase: 'fundo escuro, uma linha de luz desenha pedaços da interface e revela o produto no fim; feito para ser lembrado', molde: 'moldes/teaser-de-luz/MOLDE.md' },
  'capitulos-com-indice': { nome: 'Capítulos com índice', frase: 'abertura com índice numerado, um capítulo de cartaz por novidade com a interface redesenhada, fecho com o índice completo', molde: 'references/capitulos.md', exemplo: 'assets/capitulos/exemplo' },
}

export const OBJETIVOS = { ensinar: 'ensinar como faz', novidade: 'anunciar novidade', lancar: 'lançar / vender', atencao: 'chamar atenção', contas: 'prestar contas' }
export const CANAIS = { site: 'site, central de ajuda ou YouTube', whatsapp: 'WhatsApp', reels: 'Reels, TikTok ou Shorts (9:16)', feed: 'feed ou LinkedIn (1:1, 4:5)', telao: 'telão de evento (16:9, sem som)' }
export const PRODUTOS = {
  b2b: { nome: 'B2B sério (SaaS, ERP, painel)', puxe: ['tela-real-com-camera', 'antes-e-depois', 'numero-que-conta'], evite: [], tom: 'uma cor de destaque, 2 s por item (nada de rajada), o porquê antes do número' },
  jovem: { nome: 'consumidor jovem', puxe: ['texto-que-se-digita', 'lista-que-corre'], evite: ['capitulos-com-indice'], tom: 'cor saturada, 0,8–1,2 s por item, uma piada a cada 3–4 itens' },
  leigo: { nome: 'escola, serviço público, leigo', puxe: ['tela-real-com-camera'], evite: ['teaser-de-luz'], tom: 'frase completa em cada passo, ritmo lento, "Pronto! É só isso." no fim' },
  financas: { nome: 'banco / finanças', puxe: ['tela-real-com-camera', 'numero-que-conta'], evite: ['teaser-de-luz'], tom: 'contido; número sempre com contexto; nada que pareça promessa de ganho' },
  criador: { nome: 'criador, DJ, marca pessoal', puxe: ['capitulos-com-indice', 'lista-que-corre', 'numero-que-conta'], evite: [], tom: 'fotos e números da própria pessoa, nunca inventados' },
  jogo: { nome: 'jogo / comunidade', puxe: ['antes-e-depois', 'teaser-de-luz', 'lista-que-corre'], evite: [], tom: 'aceita fala rápida, cor da temporada, número da temporada fixo na abertura' },
  varejo: { nome: 'loja, varejo, entrega', puxe: ['numero-que-conta', 'antes-e-depois'], evite: [], tom: 'preço e prazo gigantes, refrão repetido' },
  outro: { nome: 'outro', puxe: [], evite: [], tom: '' },
}

// Estilos em ordem de preferência para cada objetivo × canal (o primeiro é o mais indicado).
export const TABELA = {
  ensinar: {
    site: ['tela-real-com-camera', 'antes-e-depois', 'texto-que-se-digita'],
    whatsapp: ['tela-real-com-camera', 'antes-e-depois', 'lista-que-corre'],
    reels: ['tela-real-com-camera', 'lista-que-corre', 'antes-e-depois'],
    feed: ['lista-que-corre', 'tela-real-com-camera', 'antes-e-depois'],
    telao: ['lista-que-corre', 'numero-que-conta', 'antes-e-depois'],
  },
  novidade: {
    site: ['lista-que-corre', 'capitulos-com-indice', 'antes-e-depois', 'numero-que-conta'],
    whatsapp: ['numero-que-conta', 'antes-e-depois', 'lista-que-corre'],
    reels: ['lista-que-corre', 'antes-e-depois', 'numero-que-conta'],
    feed: ['lista-que-corre', 'antes-e-depois', 'numero-que-conta'],
    telao: ['teaser-de-luz', 'lista-que-corre', 'numero-que-conta'],
  },
  lancar: {
    site: ['lista-que-corre', 'texto-que-se-digita', 'teaser-de-luz', 'capitulos-com-indice'],
    whatsapp: ['numero-que-conta', 'texto-que-se-digita', 'antes-e-depois'],
    reels: ['texto-que-se-digita', 'numero-que-conta', 'lista-que-corre'],
    feed: ['lista-que-corre', 'texto-que-se-digita', 'numero-que-conta'],
    telao: ['teaser-de-luz', 'lista-que-corre', 'numero-que-conta'],
  },
  atencao: {
    site: ['teaser-de-luz', 'antes-e-depois', 'texto-que-se-digita'],
    whatsapp: ['antes-e-depois', 'numero-que-conta', 'texto-que-se-digita'],
    reels: ['antes-e-depois', 'texto-que-se-digita', 'numero-que-conta'],
    feed: ['numero-que-conta', 'antes-e-depois', 'teaser-de-luz'],
    telao: ['teaser-de-luz', 'numero-que-conta', 'antes-e-depois'],
  },
  contas: {
    site: ['numero-que-conta', 'lista-que-corre', 'capitulos-com-indice', 'antes-e-depois'],
    whatsapp: ['numero-que-conta', 'antes-e-depois', 'lista-que-corre'],
    reels: ['numero-que-conta', 'antes-e-depois', 'lista-que-corre'],
    feed: ['numero-que-conta', 'lista-que-corre', 'antes-e-depois'],
    telao: ['numero-que-conta', 'lista-que-corre', 'teaser-de-luz'],
  },
}

export function lerHistorico(arq = historicoArq) {
  try { return JSON.parse(fs.readFileSync(arq, 'utf8')) } catch { return {} }
}

const chave = (nome) => String(nome || '').trim().toLowerCase()

export function ultimoEstilo(nome, hist = lerHistorico()) {
  const lista = hist[chave(nome)] || []
  return lista.length ? lista[lista.length - 1].estilo : null
}

function exemplo(id, canal) {
  const formato = ['reels', 'whatsapp'].includes(canal) ? '9x16' : '16x9'
  const pasta = path.join(skill, ESTILOS[id].exemplo || path.join('moldes', id, 'exemplo'))
  try {
    const mp4 = fs.readdirSync(pasta).filter((f) => f.endsWith('.mp4')).sort()
    if (mp4.length) return path.join(pasta, mp4.find((f) => f.includes(formato)) || mp4[0])
  } catch {}
  return null
}

export function recomendar({ objetivo, canal, produto = 'outro', itens = 0, caixaDeTexto = false, ultimo = null }) {
  if (!TABELA[objetivo]) throw new Error(`objetivo desconhecido: ${objetivo}. Use um destes: ${Object.keys(OBJETIVOS).join(', ')}`)
  if (!TABELA[objetivo][canal]) throw new Error(`canal desconhecido: ${canal}. Use um destes: ${Object.keys(CANAIS).join(', ')}`)
  const prod = PRODUTOS[produto] || PRODUTOS.outro
  const base = TABELA[objetivo][canal]
  const pontos = {}
  const motivos = {}
  for (const id of Object.keys(ESTILOS)) { pontos[id] = 0; motivos[id] = [] }
  base.forEach((id, i) => { pontos[id] += (base.length - i) * 10; if (i === 0) motivos[id].push(`é o primeiro da tabela para ${OBJETIVOS[objetivo]} em ${CANAIS[canal]}`) })
  for (const id of prod.puxe) { pontos[id] += 6; motivos[id].push(`combina com ${prod.nome}`) }
  for (const id of prod.evite) { pontos[id] -= 25; motivos[id].push(`não combina com ${prod.nome}`) }
  if (caixaDeTexto && objetivo !== 'ensinar') { pontos['texto-que-se-digita'] += 25; motivos['texto-que-se-digita'].unshift('o produto tem caixa de texto, e a pergunta escrita no quadro 0 é quase sempre a melhor abertura') }
  if (objetivo === 'ensinar' && canal !== 'telao') { pontos['teaser-de-luz'] -= 30 }
  if (['novidade', 'lancar', 'contas'].includes(objetivo) && canal === 'site' && itens >= 6) { pontos['capitulos-com-indice'] += 20; motivos['capitulos-com-indice'].unshift(`são ${itens} novidades para ver com calma no site: capítulos com índice organizam 6 a 12`) }
  if (itens >= 6 && canal !== 'site') { pontos['lista-que-corre'] += 8; motivos['lista-que-corre'].push(`${itens} itens cabem numa lista que corre`) }

  const ordem = Object.keys(ESTILOS).filter((id) => pontos[id] > 0).sort((a, b) => pontos[b] - pontos[a] || base.indexOf(a) - base.indexOf(b))
  const avisos = []
  if (objetivo === 'ensinar' && canal === 'telao') avisos.push('tutorial não serve em telão sem som: a sugestão vira um cartaz por passo, sem câmera nem fala')
  let recomendado = ordem[0]
  if (recomendado === 'capitulos-com-indice' && ultimo === 'capitulos-com-indice') {
    recomendado = ordem[1]
    avisos.push('o último vídeo deste produto já foi "capítulos com índice": não repito duas vezes seguidas')
  }
  const alternativas = ordem.filter((id) => id !== recomendado).slice(0, 3)
  const porque = motivos[recomendado].length ? motivos[recomendado].join('; ') : `é o que melhor cabe em ${OBJETIVOS[objetivo]} em ${CANAIS[canal]}`
  const ficha = (id) => ({
    id, nome: ESTILOS[id].nome, frase: ESTILOS[id].frase,
    ficha: path.join(skill, 'references', 'catalogo', 'estilos', `${id}.md`),
    molde: path.join(skill, ESTILOS[id].molde),
    exemplo: exemplo(id, canal),
    ...(id === ultimo ? { foiOUltimo: true } : {}),
  })
  return { recomendado: ficha(recomendado), porque, alternativas: alternativas.map(ficha), tom: prod.tom, avisos }
}

function opt(args, k, d) { const i = args.indexOf('--' + k); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d }

function principal(args) {
  if (args[0] === 'estilos') {
    for (const [id, e] of Object.entries(ESTILOS)) console.log(`${id.padEnd(22)} ${e.frase}${exemplo(id) ? '' : '  (sem vídeo de exemplo)'}`)
    return 0
  }
  if (args[0] === 'registrar') {
    const nome = opt(args, 'nome'), estilo = opt(args, 'estilo')
    if (!nome || !ESTILOS[estilo]) { console.error(`uso: registrar --nome "Produto" --estilo <${Object.keys(ESTILOS).join('|')}> [--video <pasta>]`); return 1 }
    const hist = lerHistorico()
    ;(hist[chave(nome)] ||= []).push({ estilo, data: new Date().toISOString().slice(0, 10), video: opt(args, 'video') || null })
    fs.mkdirSync(path.dirname(historicoArq), { recursive: true })
    fs.writeFileSync(historicoArq, JSON.stringify(hist, null, 2) + '\n')
    console.log(`registrado: ${nome} → ${estilo}`)
    return 0
  }
  const objetivo = opt(args, 'objetivo'), canal = opt(args, 'canal')
  if (!objetivo || !canal) {
    console.error('uso: node recomendar-estilo.mjs --objetivo <o> --canal <c> [--produto <p>] [--itens N] [--nome "Produto"] [--caixa-de-texto] [--ultimo <estilo>] [--json]')
    console.error(`  objetivos: ${Object.keys(OBJETIVOS).join(', ')}\n  canais:    ${Object.keys(CANAIS).join(', ')}\n  produtos:  ${Object.keys(PRODUTOS).join(', ')}`)
    return 1
  }
  const produto = opt(args, 'produto', 'outro')
  if (!PRODUTOS[produto]) { console.error(`produto desconhecido: ${produto}. Use um destes: ${Object.keys(PRODUTOS).join(', ')}`); return 1 }
  const nome = opt(args, 'nome')
  const ultimo = opt(args, 'ultimo') || (nome ? ultimoEstilo(nome) : null)
  let r
  try { r = recomendar({ objetivo, canal, produto, itens: Number(opt(args, 'itens', 0)) || 0, caixaDeTexto: args.includes('--caixa-de-texto'), ultimo }) } catch (e) { console.error(e.message); return 1 }
  if (args.includes('--json')) { console.log(JSON.stringify({ ...r, ultimo }, null, 2)); return 0 }
  const linha = (e, i) => `  ${i}. ${e.nome} (${e.id}) — ${e.frase}${e.foiOUltimo ? ' [foi o último deste produto]' : ''}\n     exemplo: ${e.exemplo || 'ainda sem vídeo de exemplo instalado'}`
  console.log(`Recomendado: ${r.recomendado.nome} (${r.recomendado.id}) — ${r.porque}.`)
  console.log(linha(r.recomendado, 1))
  r.alternativas.forEach((e, i) => console.log(linha(e, i + 2)))
  if (r.tom) console.log(`Tom para ${PRODUTOS[produto].nome}: ${r.tom}.`)
  for (const a of r.avisos) console.log(`Aviso: ${a}.`)
  if (ultimo) console.log(`Último estilo deste produto: ${ultimo}.`)
  return 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(principal(process.argv.slice(2)))
