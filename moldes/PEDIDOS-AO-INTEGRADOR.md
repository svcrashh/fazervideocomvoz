
## tela-real-com-camera (02/10/2026)
- **Nada bloqueia**: o molde usa o motor sem mudar nada (`assets/template/engine.js` copiado no projeto, `scripts/render.cjs`, `scripts/tutorial/gravar.mjs`, `scripts/voz.mjs`).
- Sugestão (não urgente): levar o "véu + desfoque fora do campo" para o `realce` do modo tutorial (`tutorial.js`) como tipo `veu`; hoje ele só existe neste molde.
- O render não achou o Playwright sozinho a partir de `~/Desktop`: rodei com `PLAYWRIGHT_PATH=…/_oficina-fazervideo/node_modules/playwright`. Se o README tiver uma linha sobre isso, ajuda.
- `exemplo.json` e `exemplo-pomar.json` apontam para `~/Desktop/moldes-teste/…` (gravação, voz) e `~/Desktop/lumma-patch-notes/molde/fontes` (fontes): servem para reproduzir nesta máquina; noutra, regrave e troque os caminhos.

## teaser-de-luz (02/10/2026)
- **Nada bloqueia**: motor sem mudança (`engine.js` copiado pelo `montar.mjs`, `scripts/render.cjs`, `scripts/quadros.cjs`, `scripts/fontes.mjs`, `scripts/voz.mjs`). Exemplos autocontidos: a mídia está em `moldes/teaser-de-luz/exemplo-midia/` e as fontes vêm do Google pelo `fontes.mjs`.
- `voz.mjs ouvir` acusa falso negativo em chave de pronúncia que é endereço: `lummaone.com/7` → dito "lúma uân ponto com barra sete", o Whisper devolve "lumaone.com/7" e o conferidor diz que a palavra não apareceu. Sugestão: comparar sem pontuação e aceitar grafia aproximada (distância de edição ≤ 1) para chaves com `.` ou `/`.
- A trilha do molde (`trilha.py`) é própria e simples (numpy + scipy, os mesmos de `assets/audio`); se o Integrador quiser, ela pode virar um arranjo do `arranjo_serie.py` com o `mix_voz.py` (Contrato M) no lugar do ducking de 10 dB que fiz aqui.
- Mesmo caso do tela-real: rodei com `PLAYWRIGHT_PATH=~/Desktop/fetchbuild-video/node_modules/playwright`.

## numero-que-conta (02/10/2026)
- **Nada bloqueia**: motor sem mudança. O `preparar.mjs` copia `assets/template/engine.js`, usa `scripts/fontes.mjs`, `scripts/voz.mjs`, `scripts/tutorial/locucao.mjs` (`escreverVozWav`, `blocoFolha`, `srt`), `assets/audio/arranjo_serie.py` (folha com bloco `voz`, Contrato M) e `scripts/finalizar.mjs`. Exemplos autocontidos (logo da Lumma em `moldes/numero-que-conta/exemplos/`, fontes do Google).
- `voz.mjs ouvir` marca ✗ quando a fala tem número por extenso ("Doze", "Mil duzentas e quarenta e oito"): o scribe devolve "12", "1.248". Sugestão: normalizar número por extenso ↔ algarismo antes de comparar. Hoje o MOLDE.md avisa que é falso negativo.
- Para virar **bloco de outro molde** (abertura/fecho de lista-que-corre, antes-e-depois): `BLOCOS[tipo](root, bloco)` em `molde.js` já é uma função por bloco com `t0/t1`; falta um jeito comum de um molde importar o bloco de outro (sugestão: `moldes/_comum/numero.js` com `BLOCOS` e as funções de número/legenda).
- Playwright: achado pelo symlink `~/Desktop/moldes-teste/node_modules → ~/Desktop/lumma-patch-notes/node_modules` (mesmo problema dos outros moldes).

## lista-que-corre (02/10/2026)
- **Nada bloqueia**: motor sem mudança. O `render.mjs` copia `assets/template/engine.js` e usa `scripts/fontes.mjs`, `scripts/voz.mjs` (`gerar`, e `ouvir` à mão) e `scripts/render.cjs` (repassa `--sub`).
- **Falta a trilha**: o molde entrega só a voz (−16 LUFS). Pedido: ligar o `render.mjs` ao `arranjo_serie.py` + `mix_voz.py` (Contrato M) como o numero-que-conta fez — as passagens de item (`PLANO.secoes`) são os marcos naturais da trilha (uma batida por corte na rajada).
- O muro e a abertura poderiam usar o bloco do numero-que-conta quando existir o `moldes/_comum/` sugerido lá.
- Playwright: symlink `~/Desktop/moldes-teste/lista-que-corre/node_modules → ~/Desktop/fetchbuild-video/node_modules` (mesmo problema dos outros moldes).
- `exemplo.json` (Lumma) aponta para `~/Desktop/lumma-patch-notes/molde/midia/` (logo e foto do G7VEN), de propósito fora do repositório público; a Brotto (`exemplo-brotto.json`) é autocontida.

## antes-e-depois (02/10/2026)
- `scripts/playwright.cjs` não acha o Playwright nesta máquina sem `PLAYWRIGHT_PATH=~/Desktop/fetchbuild-video/node_modules/playwright` (ou `npm i -D playwright` na pasta). Os scripts do molde (`capturar.mjs`, `renderizar.mjs`) usam o loader da skill.
- O `render.cjs` sai com código ≠ 0 quando há qualquer `console.error`; o `renderizar.mjs` do molde trata como aviso. Talvez valha um código separado para "avisos" vs. "falhou".
- O cofre `~/.claude/secrets/lumma.env` não tem `LUMMA_E2E_PASSWORD`: sem ela não dá para gravar tela logada da conta `primo@lummaone.com`.

## texto-que-se-digita (02/10/2026)
- **Nada bloqueia**: usa `assets/template/engine.js`, `scripts/render.cjs`, `scripts/playwright.cjs`, `scripts/fontes.mjs`, `scripts/voz.mjs` e `assets/audio/{synth,sons}.py` sem mudar nada. O Playwright foi achado sozinho (sem `PLAYWRIGHT_PATH`).
- O som pede Python com numpy/scipy: rodei com `FAZERVIDEO_PY=…/_oficina-fazervideo/.venv/bin/python`. Se o SKILL.md já diz qual Python a trilha usa, vale a mesma linha para os moldes.
- `voz/lumma/` traz o take `c04.wav` do vídeo de patch notes (1 MB, pronúncia já conferida), reaproveitado em dois trechos sem gastar crédito. Se o repositório não deve levar áudio, troque pela `voz.mjs gerar` do `roteiro.json` de lá.
- Sugestão (não urgente): o `renderizar.mjs` aceita `-- --sub 2` para passar opções ao `render.cjs`. Com várias janelas renderizando juntas, o final de 8 subquadros levou ~20 min por formato de 16 s.

## Integrado (02/10/2026)
- `voz.mjs ouvir`: número por extenso bate com o algarismo ("Doze" = "12", "mil duzentas e quarenta e oito" = "1.248"), e endereço com `.` ou `/` aceita uma letra de diferença em pedaço de 6+ letras (`lummaone.com/7` = "lumaone.com/7"). Testes em `testes/voz.test.mjs`.
- `scripts/playwright.cjs`: a mensagem de erro ensina o `PLAYWRIGHT_PATH`; o `SKILL.md` também.
- `render.sh` do numero-que-conta e do teaser-de-luz aceitam `FAZERVIDEO_PY` além de `PYTHON`; o numero-que-conta só transcreve de novo quando a locução muda (cada transcrição custa crédito).
- lista-que-corre: trilha ligada (`arranjo_serie.py` + `mix_voz.py`, marcos nos cortes, `verifica.py`, `finalizar.mjs`).
- Vídeos de exemplo de cada molde em `moldes/<id>/exemplo/` (até 20 s, comprimidos), lidos pelo `scripts/recomendar-estilo.mjs`.
- Fica para a segunda leva: `moldes/_comum/` com o bloco de número; véu como `realce` do tutorial; código de saída do `render.cjs` separando aviso de falha; `roteiro.json` do teaser escrito pelo `montar.mjs`.
