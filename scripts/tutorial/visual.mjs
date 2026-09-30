// O visual declarado de uma série de tutoriais (serie.json com "versao": 2): o esquema dos nove elementos,
// a validação com mensagem que diz o que fazer, a resolução das cores e a checagem de contraste.
// Quem desenha é o tutorial.js (no navegador); aqui só se confere e se resolve o que a série declarou.
// Documentação de cada elemento e de cada tipo: references/tutorial.md, seção 13.
import fs from 'node:fs'
import vm from 'node:vm'

export const ELEMENTOS = ['fundo', 'moldura', 'legenda', 'selo', 'titulo', 'abertura', 'fechamento', 'realce', 'indicador']
const DOC = 'references/tutorial.md, seção 13 (O visual da série)'
const FORMATOS = ['16x9', '9x16', '4x5', '1x1']

// Por elemento: qual campo escolhe o tipo, os tipos com os campos que cada um exige, os campos exigidos por
// todos, os valores permitidos e os opcionais (com o valor que assumem, escrito aqui e na documentação).
const ESQ = {
  fundo: {
    chave: 'tipo',
    tipos: { liso: [], formas: ['tinta'], grade: ['tinta'], pontos: ['tinta'], luz: ['tinta'], faixas: ['tinta'], proprio: [] },
    comuns: ['cor'],
    opcionais: { tinta2: null, forca: null },
  },
  moldura: {
    chave: 'tipo',
    tipos: { nenhuma: [], fio: ['cor'], janela: ['cor'], navegador: ['cor'], proprio: [] },
    comuns: ['raio', 'sombra'],
    valores: { sombra: ['nenhuma', 'curta', 'longa'] },
    opcionais: { espessura: 2, margem: 0 },
  },
  legenda: {
    chave: 'tipo',
    tipos: { cartao: ['fundo', 'borda', 'raio'], faixa: ['fundo'], solta: [] },
    comuns: ['lado', 'tinta', 'rotulo', 'troca'],
    valores: { lado: ['direita', 'esquerda', 'baixo', 'cima'], rotulo: ['ponto', 'mono', 'numero', 'nenhum'], troca: ['virar', 'subir', 'corte'], caixa: ['alta', 'normal'], sombra: ['nenhuma', 'curta', 'longa'], fonte: ['titulo', 'texto'] },
    opcionais: { sinal: null, caixa: 'normal', peso: 700, sombra: 'nenhuma', fonte: 'titulo' },
  },
  selo: {
    chave: 'tipo',
    tipos: { pilula: ['cor'], mono: ['cor'], linha: ['cor'], nenhum: [], proprio: [] },
    comuns: [],
  },
  titulo: {
    chave: 'entrada',
    tipos: { palavras: [], letras: [], mascara: [], corte: [] },
    comuns: ['caixa', 'peso', 'espaco', 'tinta'],
    valores: { caixa: ['alta', 'normal'], alinhar: ['centro', 'esquerda'] },
    opcionais: { alinhar: 'centro', escala: 1 },
  },
  abertura: {
    chave: 'saida',
    tipos: { mergulho: [], corte: [], deslizar: [], cortina: ['cor'] },
    comuns: [],
  },
  fechamento: {
    chave: 'entrada',
    tipos: { iris: [], cortina: [], corte: [], deslizar: [] },
    comuns: ['fundo', 'tinta', 'logo'],
    valores: { logo: ['cores', 'negativo'] },
  },
  realce: {
    chave: 'tipo',
    tipos: { contorno: ['cor', 'espessura', 'raio'], cantos: ['cor', 'espessura', 'raio'], sublinhado: ['cor', 'espessura', 'raio'], preenchido: ['cor', 'raio'], proprio: [] },
    comuns: [],
    opcionais: { cor: null, espessura: 3, raio: 12 },
  },
  indicador: { chave: null, tipos: {}, comuns: ['tinta', 'contorno'] },
}
// campos que são cor (hex ou nome); `borda` aceita também "nenhuma"
const CORES = ['cor', 'tinta', 'tinta2', 'fundo', 'borda', 'sinal', 'contorno']
// quais tipos aceitam o gancho `proprio` (visual.js da série)
export const PROPRIOS = ['fundo', 'moldura', 'selo', 'realce']

/** MARCA do marca.js da série (um script de navegador: `const MARCA = {…}`). */
export function lerMarca(arquivo) {
  const ctx = { window: {} }
  vm.createContext(ctx)
  vm.runInContext(fs.readFileSync(arquivo, 'utf8') + '\n;globalThis.__M = typeof MARCA !== "undefined" ? MARCA : null', ctx)
  return ctx.__M || {}
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
const hex6 = (h) => (h.length === 4 ? '#' + [...h.slice(1)].map((c) => c + c).join('') : h).toUpperCase()

/** Confere o visual da série e devolve { visual (cores já em hex), avisos, usaProprio }. Erro = lança com o que fazer. */
export function resolverVisual(serie, marca) {
  const vis = serie.visual
  if (!vis || typeof vis !== 'object') throw new Error(`serie.json tem "versao": 2 e não tem "visual". Declare os nove elementos (${ELEMENTOS.join(', ')}); as opções estão em ${DOC}.`)
  const faltam = ELEMENTOS.filter((k) => !vis[k])
  if (faltam.length) throw new Error(`serie.json tem "versao": 2 e não declara visual.${faltam.join(', visual.')}. Numa série nova cada elemento é escolhido, nenhum vem de padrão escondido; as opções estão em ${DOC}.`)
  const paleta = { ...(marca.cores || {}), ...(vis.cores || {}) }
  const cor = (v, onde) => {
    if (typeof v !== 'string') throw new Error(`${onde}: esperava uma cor (hex como "#FF7A1A" ou um nome de visual.cores/MARCA.cores), veio ${JSON.stringify(v)}.`)
    if (HEX.test(v)) return hex6(v)
    if (paleta[v] != null) {
      if (!HEX.test(paleta[v])) throw new Error(`${onde}: a cor "${v}" vale ${JSON.stringify(paleta[v])}, que não é hex (#RRGGBB).`)
      return hex6(paleta[v])
    }
    throw new Error(`${onde}: "${v}" não é hex nem nome de cor. Nomes que existem: ${Object.keys(paleta).join(', ') || '(nenhum: declare visual.cores)'}.`)
  }
  const out = { cores: {} }
  for (const [n, v] of Object.entries(paleta)) if (typeof v === 'string' && HEX.test(v)) out.cores[n] = hex6(v)
  let usaProprio = false
  for (const el of ELEMENTOS) {
    const E = ESQ[el], d = vis[el], onde = `visual.${el}`
    if (typeof d !== 'object') throw new Error(`${onde} tem de ser um objeto; opções em ${DOC}.`)
    const r = { ...d }
    let tipo = null
    if (E.chave) {
      tipo = d[E.chave]
      if (!(tipo in E.tipos)) throw new Error(`${onde}.${E.chave} = ${JSON.stringify(tipo)} não existe. Opções: ${Object.keys(E.tipos).join(' | ')} (quando usar cada uma: ${DOC}).`)
      if (tipo === 'proprio') usaProprio = true
    }
    for (const [k, v] of Object.entries(E.opcionais || {})) if (r[k] === undefined && v !== null) r[k] = v
    const exige = [...E.comuns, ...(tipo ? E.tipos[tipo] : [])]
    const semCampo = exige.filter((k) => d[k] === undefined && (E.opcionais || {})[k] == null)
    if (semCampo.length) throw new Error(`${onde} (${tipo || el}) precisa de ${semCampo.map((k) => `"${k}"`).join(', ')}. Veja ${DOC}.`)
    for (const [k, vals] of Object.entries(E.valores || {})) {
      if (r[k] === undefined) continue
      const lista = k === 'lado' && typeof r[k] === 'object' ? Object.entries(r[k]) : [[null, r[k]]]
      for (const [f, v] of lista) {
        if (f && f !== 'padrao' && !FORMATOS.includes(f)) throw new Error(`${onde}.${k}: formato "${f}" não existe (${FORMATOS.join(', ')}, padrao).`)
        if (!vals.includes(v)) throw new Error(`${onde}.${k}${f ? '.' + f : ''} = ${JSON.stringify(v)} não existe. Opções: ${vals.join(' | ')}.`)
      }
    }
    for (const k of CORES) {
      if (r[k] === undefined || r[k] === null) continue
      if (k === 'borda' && r[k] === 'nenhuma') continue
      r[k] = cor(r[k], `${onde}.${k}`)
    }
    for (const k of ['raio', 'espessura', 'peso', 'espaco', 'escala', 'forca']) if (r[k] !== undefined && typeof r[k] !== 'number') throw new Error(`${onde}.${k} tem de ser número, veio ${JSON.stringify(r[k])}.`)
    out[el] = r
  }
  // o rótulo do passo usa a tinta da legenda se a série não disser outra cor; o realce proprio não tem cor exigida
  if (!out.legenda.sinal) out.legenda.sinal = out.legenda.tinta
  if (!out.realce.cor) out.realce.cor = out.legenda.sinal
  if (!out.fundo.tinta2 && out.fundo.tinta) out.fundo.tinta2 = out.fundo.tinta
  if (out.fundo.forca == null) out.fundo.forca = { liso: 0, formas: 0.1, grade: 0.14, pontos: 0.22, luz: 0.38, faixas: 0.16, proprio: 1 }[out.fundo.tipo]
  return { visual: out, avisos: contrastes(out), usaProprio }
}

// ---------- contraste (WCAG 2): texto que ninguém lê é o defeito mais barato de pegar antes do render ----------
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
export const contraste = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }

function contrastes(v) {
  const pares = [
    ['legenda', v.legenda.tinta, v.legenda.tipo === 'solta' ? v.fundo.cor : v.legenda.fundo, 4.5],
    ['rótulo do passo (legenda.sinal)', v.legenda.sinal, v.legenda.tipo === 'solta' ? v.fundo.cor : v.legenda.fundo, 3],
    ['título', v.titulo.tinta, v.fundo.cor, 3],
    ['fechamento', v.fechamento.tinta, v.fechamento.fundo, 3],
  ]
  if (v.selo.cor) pares.push(['selo', v.selo.cor, v.fundo.cor, 3])
  const avisos = []
  for (const [nome, a, b, min] of pares) {
    const c = contraste(a, b)
    // abaixo de 3:1 ninguém lê no celular com brilho baixo: é erro. Entre 3 e o mínimo, é aviso.
    if (c < 3) throw new Error(`contraste de ${nome}: ${a} sobre ${b} dá ${c.toFixed(2)}:1, abaixo de 3:1. Troque uma das duas cores.`)
    if (c < min) avisos.push(`contraste de ${nome}: ${a} sobre ${b} dá ${c.toFixed(2)}:1 (o mínimo pra texto corrido é ${min}:1)`)
  }
  return avisos
}

// ---------- gancho proprio: o visual.js da série roda no render, então não pode depender de nada de fora ----------
const PROIBIDO = [
  [/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|\bimport\s*\(/, 'rede: o render roda sem rede e o vídeo tem de sair igual em qualquer máquina'],
  [/https?:\/\//, 'endereço de rede: traga o arquivo para a pasta da série'],
  [/Math\.random|Date\.now|new Date\b|performance\.now/, 'relógio ou sorteio sem semente: cada subquadro sairia diferente (use rng(semente) e o tempo t)'],
  [/requestAnimationFrame|setTimeout|setInterval/, 'animação por relógio: tudo tem de ser função do tempo t'],
  [/@keyframes|animation\s*:|transition\s*:/, 'animação CSS: o render captura quadro a quadro pelo tempo t, não pelo relógio'],
]
export function conferirProprio(arquivo, visual) {
  if (!fs.existsSync(arquivo)) {
    const quais = PROPRIOS.filter((k) => visual[k] && (visual[k].tipo === 'proprio'))
    throw new Error(`visual.${quais.join(', visual.')} é "proprio", mas a série não tem visual.js (${arquivo}). O gancho está em ${DOC}.`)
  }
  const src = fs.readFileSync(arquivo, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
  for (const [re, porque] of PROIBIDO) {
    const m = src.match(re)
    if (m) throw new Error(`visual.js usa "${m[0]}": ${porque}.`)
  }
  for (const k of PROPRIOS) if (visual[k].tipo === 'proprio' && !new RegExp(`VISUAL_PROPRIO\\.${k}\\s*=`).test(src)) throw new Error(`visual.${k} é "proprio", mas o visual.js não define VISUAL_PROPRIO.${k} = (ctx) => …`)
}

// ---------- som: a folha de sincronia acompanha o visual (nomes de efeito de assets/audio/sons.py) ----------
/** Som da troca de legenda no passo que começa em t (a troca vai de t−0,25 a t+0,25). null = nenhum. */
export function somDaTroca(visual, t) {
  const tr = visual.legenda.troca
  if (tr === 'virar') return { t: t - 0.25, efeito: 'virada', extra: { variante: 'cartao' } }
  if (tr === 'subir') return { t, efeito: 'whoosh', extra: { dur: 0.4, nivel: -9, opcional: true } }   // pico no meio da troca
  return null   // corte: a troca seca é o próprio acento; um som ali só faria ruído a cada passo
}
/** Sons da passagem da abertura para a tela (A = fim da abertura). */
export function sonsDaAbertura(visual, A) {
  const s = visual.abertura.saida
  if (s === 'mergulho') return [{ t: A - 0.02, efeito: 'whoosh', evento: 'a tela aparece (mergulho da abertura)', extra: { dur: 0.6, opcional: true } }]
  if (s === 'deslizar') return [{ t: A - 0.1, efeito: 'whoosh', evento: 'a tela entra deslizando', extra: { dur: 0.5, direcao: -1, opcional: true } }]
  if (s === 'cortina') return [{ t: A, efeito: 'whoosh', evento: 'a cortina passa e revela a tela', extra: { dur: 0.8, opcional: true } }]
  return []   // corte: seco, sem som
}
/** Sons da entrada do fechamento (t0 = início dele). */
export function sonsDoFechamento(visual, t0) {
  const e = visual.fechamento.entrada
  if (e === 'deslizar') return [{ t: t0 + 0.25, efeito: 'whoosh', evento: 'fechamento: o cartão final entra deslizando', extra: { dur: 0.5, direcao: -1, forca: true, opcional: true } }]   // whoosh não tem ataque seco: o verifica.py só exige ataque de marco obrigatório
  if (e === 'cortina') return [{ t: t0 + 0.45, efeito: 'impacto', evento: 'fechamento: a cortina fecha sobre a tela', extra: { forca: true } }]
  if (e === 'corte') return [{ t: t0, efeito: 'impacto', evento: 'fechamento: corte seco para a marca', extra: { forca: true } }]
  return [{ t: t0, efeito: 'impacto', evento: 'fechamento: a cor da marca cobre a tela', extra: { forca: true } }]
}
