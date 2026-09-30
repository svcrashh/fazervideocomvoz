// Folha de contato de cada toque, a partir da GRAVAÇÃO crua (antes de compor): três quadros por toque
// (antes, no instante, depois), com o ponto do toque marcado e quem estava lá. É o que pegou os defeitos
// que o log dava como "✓" na rodada 1: olhe sempre antes de compor.
//   node folha.mjs <pasta>/saida/<versao>
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { carregarPlaywright } from './gravar.mjs'

export async function folhaToques(dir, pw) {
  const log = JSON.parse(fs.readFileSync(path.join(dir, 'eventos.json'), 'utf8'))
  const quadros = JSON.parse(fs.readFileSync(path.join(dir, 'quadros.json'), 'utf8'))
  const ts = quadros.map((q) => q[1])
  const quadroEm = (t) => { let lo = 0, hi = ts.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (ts[m] <= t) lo = m; else hi = m - 1 } return quadros[lo][0] }
  const { viewport: vp } = log.aparelho
  const alvos = log.eventos.filter((e) => e.tipo === 'toque' || e.tipo === 'escolhe' || (e.tipo === 'digita' && e.nativo))
  const passos = log.eventos.filter((e) => e.tipo === 'passo')
  const passoEm = (t) => [...passos].reverse().find((p) => p.t <= t + 0.01)
  const largura = vp.width > vp.height ? 360 : 190
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const cel = (e, dt, rot) => {
    const f = quadroEm(e.t + dt)
    const k = largura / vp.width
    const mk = e.ponto && dt === 0 ? `<div style="position:absolute;left:${e.ponto[0] * k - 9}px;top:${e.ponto[1] * k - 9}px;width:18px;height:18px;border-radius:50%;border:3px solid #FF2D55;box-shadow:0 0 0 2px #fff"></div>` : ''
    const rt = e.ret && dt === 0 ? `<div style="position:absolute;left:${e.ret.x * k}px;top:${e.ret.y * k}px;width:${e.ret.w * k}px;height:${e.ret.h * k}px;outline:2px dashed #2F6FEB"></div>` : ''
    return `<div style="position:relative;width:${largura}px;height:${(vp.height * largura) / vp.width}px;overflow:hidden;border-radius:6px;background:#000">
      <img src="${pathToFileURL(path.join(dir, 'quadros', f)).href}" style="width:100%;display:block">${rt}${mk}
      <div style="position:absolute;left:4px;top:4px;font:600 11px system-ui;color:#fff;background:rgba(0,0,0,.6);padding:2px 5px;border-radius:4px">${rot} ${(e.t + dt).toFixed(2)} s</div></div>`
  }
  const linhas = alvos.map((e, i) => {
    const ps = passoEm(e.t)
    const chk = (e.checagem || []).map((c) => `${c.acao} (${esc(c.quem)})`).join('; ')
    return `<div style="display:flex;gap:10px;align-items:flex-start;margin:0 0 14px">
      <div style="width:230px;font:13px/1.35 system-ui;color:#222"><b>${i + 1}. ${e.tipo}${e.nativo ? ' · ' + e.nativo : ''}</b><br>${esc(e.alvo || '')}<br>
        <span style="color:#666">passo ${ps ? ps.n + ': ' + esc(ps.legenda) : '—'}</span>${chk ? `<br><span style="color:#B34700">${chk}</span>` : ''}${e.escolhida ? `<br>escolhida: <b>${esc(e.escolhida)}</b>` : ''}${e.nativo === 'date' && e.tipo === 'digita' ? `<br>data: <b>${esc(e.texto)}</b>` : ''}</div>
      ${cel(e, -0.3, 'antes')}${cel(e, 0, 'toque')}${cel(e, e.t1 ? e.t1 - e.t + 0.2 : 0.5, 'depois')}</div>`
  })
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;padding:16px;background:#F4F4F2">
    <div style="font:700 16px system-ui;margin:0 0 12px">${esc(log.titulo || log.id)} · ${log.versao} · ${alvos.length} toques · pico ${log.captura.qpsPico} qps (${log.captura.metodo}) · ${log.captura.largura}×${log.captura.altura}</div>
    ${linhas.join('')}</body>`
  const htmlP = path.join(dir, 'folha-toques.html')
  fs.writeFileSync(htmlP, html)
  const browser = await pw.chromium.launch({ args: ['--allow-file-access-from-files'] })
  const p = await browser.newPage({ viewport: { width: 250 + 3 * (largura + 10) + 32, height: 400 } })
  await p.goto(pathToFileURL(htmlP).href, { waitUntil: 'load' })
  await p.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))))
  const saida = path.join(dir, 'folha-toques.png')
  await p.screenshot({ path: saida, fullPage: true })
  await browser.close()
  return saida
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = path.resolve(process.argv[2] || '.')
  console.log(await folhaToques(dir, carregarPlaywright(dir)))
}
