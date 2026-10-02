// node --test testes/   (sem rede)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { recomendar, ESTILOS, OBJETIVOS, CANAIS, PRODUTOS } from '../scripts/recomendar-estilo.mjs'

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'recomendar-estilo.mjs')
const combinacoes = []
for (const objetivo of Object.keys(OBJETIVOS)) for (const canal of Object.keys(CANAIS)) for (const produto of Object.keys(PRODUTOS)) for (const itens of [0, 8]) for (const caixaDeTexto of [false, true]) combinacoes.push({ objetivo, canal, produto, itens, caixaDeTexto })

test('toda combinação dá um recomendado, o porquê e duas ou três alternativas, sem repetir', () => {
  for (const c of combinacoes) {
    const r = recomendar(c)
    assert.ok(ESTILOS[r.recomendado.id], JSON.stringify(c))
    assert.ok(r.porque.length > 10, JSON.stringify(c))
    assert.ok(r.alternativas.length >= 2 && r.alternativas.length <= 3, `${JSON.stringify(c)} → ${r.alternativas.length} alternativas`)
    const ids = [r.recomendado.id, ...r.alternativas.map((a) => a.id)]
    assert.equal(new Set(ids).size, ids.length)
  }
})

test('capítulos com índice nunca é recomendado duas vezes seguidas para o mesmo produto', () => {
  let apareceu = 0
  for (const c of combinacoes) {
    if (recomendar(c).recomendado.id === 'capitulos-com-indice') apareceu++
    assert.notEqual(recomendar({ ...c, ultimo: 'capitulos-com-indice' }).recomendado.id, 'capitulos-com-indice', JSON.stringify(c))
  }
  assert.ok(apareceu > 0, 'capítulos com índice precisa ser recomendado em algum caso')
})

test('casos do guia de escolha', () => {
  assert.equal(recomendar({ objetivo: 'ensinar', canal: 'site', produto: 'leigo' }).recomendado.id, 'tela-real-com-camera')
  assert.equal(recomendar({ objetivo: 'ensinar', canal: 'whatsapp', produto: 'b2b' }).recomendado.id, 'tela-real-com-camera')
  assert.equal(recomendar({ objetivo: 'lancar', canal: 'site', produto: 'b2b', caixaDeTexto: true }).recomendado.id, 'texto-que-se-digita')
  assert.equal(recomendar({ objetivo: 'novidade', canal: 'reels', produto: 'jovem' }).recomendado.id, 'lista-que-corre')
  assert.equal(recomendar({ objetivo: 'novidade', canal: 'site', produto: 'criador', itens: 8 }).recomendado.id, 'capitulos-com-indice')
  assert.equal(recomendar({ objetivo: 'novidade', canal: 'site', produto: 'criador', itens: 8, ultimo: 'capitulos-com-indice' }).recomendado.id, 'lista-que-corre')
  assert.equal(recomendar({ objetivo: 'atencao', canal: 'telao', produto: 'jogo' }).recomendado.id, 'teaser-de-luz')
  assert.equal(recomendar({ objetivo: 'contas', canal: 'feed', produto: 'varejo' }).recomendado.id, 'numero-que-conta')
  assert.equal(recomendar({ objetivo: 'atencao', canal: 'reels', produto: 'jogo' }).recomendado.id, 'antes-e-depois')
})

test('o que o tipo de produto manda evitar não é recomendado', () => {
  for (const c of combinacoes) for (const id of PRODUTOS[c.produto].evite) assert.notEqual(recomendar(c).recomendado.id, id, JSON.stringify(c))
  for (const c of combinacoes.filter((c) => c.objetivo === 'ensinar' && c.canal !== 'telao')) assert.notEqual(recomendar(c).recomendado.id, 'teaser-de-luz')
})

test('registrar guarda o último estilo e a recomendação seguinte respeita', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'recomendar-'))
  const rodar = (...a) => spawnSync(process.execPath, [SCRIPT, ...a], { env: { ...process.env, HOME: home, USERPROFILE: home }, encoding: 'utf8' })
  const pedido = ['--objetivo', 'novidade', '--canal', 'site', '--produto', 'criador', '--itens', '8', '--nome', 'Produto X']
  assert.match(rodar(...pedido).stdout, /^Recomendado: Capítulos com índice/)
  assert.equal(rodar('registrar', '--nome', 'Produto X', '--estilo', 'capitulos-com-indice').status, 0)
  const depois = rodar(...pedido)
  assert.match(depois.stdout, /^Recomendado: Lista que corre/)
  assert.match(depois.stdout, /não repito duas vezes seguidas/)
  assert.equal(rodar('--objetivo', 'xyz', '--canal', 'site').status, 1)
})
