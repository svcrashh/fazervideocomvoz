# Modo tutorial: tela real, sem nada na frente

Contrato de como um projeto faz vídeos tutoriais com a skill:

- como define um vídeo;
- como grava, confere e compõe;
- como passa a identidade;
- como copia o motor para dentro do próprio repositório.

A skill não depende de nenhum produto: o app é só um cliente dela.

## Sumário
1. Como funciona (e por quê)
2. Estrutura de um projeto de tutoriais
3. Definir um vídeo: `video.mjs`
4. API do roteiro (`g`)
5. "Tem algo na frente?": a checagem de cada toque
6. Controles nativos, privacidade e dado plausível
7. Gravar, conferir e compor (comandos)
8. O que sai: `eventos.json`, quadros e folhas
9. Identidade da série (marca, fontes, trilha)
10. Copiar o motor para um repositório
11. Regravar quando a tela mudar
12. Armadilhas (cada uma já custou uma rodada)
13. O visual da série: os nove elementos, cada tipo, quando usar

---

## 1. Como funciona

```
video.mjs ──gravar.mjs──▶ saida/<versao>/quadros/*.jpg + quadros.json + eventos.json + folha-toques.png
                                   │
                         compor.mjs ▼
      projeto do motor (engine.js + tutorial.js + dados.js) ──render.cjs──▶ vídeo
      folha.json (sons nos eventos) ──arranjo_serie.py──▶ trilha.wav (semente do vídeo)
      finalizar.mjs (mix + duração, loudness, pico) ──▶ <id>-<versao>.mp4  +  folha de eventos
```

- **Tela real, nada recriado.** O gravador dirige o app com Playwright e captura a tela de verdade.
- **Indicadores na composição, não no app.** Dedo, cursor, realce, zoom, legendas e sons saem do `eventos.json`. Por isso:
  - a captura fica limpa;
  - o indicador fica nítido em qualquer zoom e proporcional à tela (dedo com 22 px CSS, cursor com ~22 px CSS);
  - dá pra recompor sem regravar.
- **Captura.** Screencast no Chromium de headless novo (`channel: 'chromium'`), com `--force-device-scale-factor` igual ao DSF do aparelho:
  - pixel real (celular 1170×2532, computador 2880×1800) a 50–60 qps, inclusive com `backdrop-filter`;
  - medido em 27/09/2026: 47 qps com um diálogo borrado aberto e um spinner rodando, a 2880×1800;
  - a tela parada não gera quadro: o quadro anterior fica segurado;
  - sem o canal `chromium`, cai para `captureScreenshot`, que é bem mais lento (7–20 qps).

## 2. Estrutura de um projeto de tutoriais

```
<repo>/docs/videos/                 (ou qualquer pasta)
  _motor/                           cópia do motor (seção 10) — ou use a skill instalada
  _serie/                           identidade da série (seção 9)
    marca.js  fontes/  serie.json  identidade.json  .venv/ (numpy+scipy, fora do git)
  01-agendar-aula/
    video.mjs                       a definição (seção 3) — versionada
    roteiro.md / NOTAS.md           opcionais, do projeto
    saida/  *.mp4  *-folha.png      saída — NÃO versionar
```

## 3. Definir um vídeo: `video.mjs`

```js
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { rodar, principal } from '../_motor/scripts/tutorial/gravar.mjs'   // ou <skill>/scripts/tutorial/gravar.mjs

const video = {
  id: '01-agendar-aula',                 // nome da pasta e dos arquivos
  titulo: 'Agendar uma aula',            // abertura do vídeo (quebra sozinho; ou tituloLinhas: ['…', '…'])
  url: 'https://app.exemplo/',           // onde começa (se não houver `entrar`)
  versoes: ['celular', 'computador'],    // aparelhos (seção 7); cada versão é um vídeo
  pasta: path.dirname(fileURLToPath(import.meta.url)),
  serie: '../_serie',                    // identidade (seção 9)
  idioma: 'pt-BR', fuso: 'America/Sao_Paulo',
  dados: { perfil: 'escola', feriados: 'br' },            // dado plausível (seção 6)
  privacidade: { seletores: ['.token'], emailsPermitidos: '@escola-modelo\\.demo$' },
  borrar: ['[data-cpf]'],                // atalho: seletores extras para borrar
  esconder: { seletores: ['#tour'], textos: ['Visita guiada', 'com IA'] },  // nunca aparecem
  avisos: ['.minha-notificacao'],        // seletores extras de aviso/toast (os padrões já cobrem role=status etc.)
  semente: 4242,                         // opcional: fixa a trilha (padrão: derivada de id + versão)
  // ganchos (todos opcionais) — rodam FORA da gravação
  async entrar({ p, v, ap, dados, check }) { /* login da demo ou conta de teste; nunca senha no código */ },
  async preparar({ p, v, dados, check }) { /* cria o dado que o vídeo precisa, pela própria tela ou API de teste */ },
  inicio: '/agenda',                     // opcional: página onde a gravação começa
  async roteiro(g) { /* seção 4 */ },
}
export default video
if (principal(import.meta.url)) await rodar(video)
```

- **Uma tarefa por vídeo.** Três tarefas são três vídeos da série.
- `entrar`: use modo demo ou conta de teste documentada. Senha nunca vai no chat nem no código. Se precisar, leia de variável de ambiente.

## 4. API do roteiro (`g`)

Cada chamada gera um ou mais eventos. Todo toque passa pela checagem da seção 5.

| Chamada | O que faz |
|---|---|
| `g.passo('Toque em Salvar.')` | nova legenda; garante que a anterior ficou **≥ 3 s** na tela (`leituraMin`) |
| `g.toque(alvo, { ponto, depois, realce, rapido })` | leva o indicador até o alvo, confere, toca/clica **no ponto conferido** |
| `g.aponta(alvo, { ms, ponto, realce })` | leva o indicador e realça, sem tocar (mostrar onde fica algo) |
| `g.digita(alvo, 'texto', { privado, atraso, limpar })` | toca no campo e digita como uma pessoa; `privado` tira o texto do log |
| `g.escolhe(select, 'Opção')` | `<select>` nativo: passa pelas opções no próprio campo (seção 6) |
| `g.data(input, dados.diaUtil(2))` | campo de data/hora nativo: digita no campo; data em dia de funcionamento |
| `g.arquivo(botao, 'caminho.pdf')` | anexo: toca no botão do app e entrega o arquivo ao seletor |
| `g.rola(alvo \| px, { bloco })` | rolagem suave até o alvo ou por px |
| `g.espera(alvo \| ms, { estado, motivo })` | espera algo aparecer/sumir (carregamento) |
| `g.pausa(ms)` | pausa (só na gravação) |
| `g.sucesso(alvo?)` | marca o momento de sucesso: som e câmera abrindo |

- `alvo` é um locator do Playwright ou um seletor em texto. Seletor ambíguo é erro (modo estrito): seja específico.
- `ponto: { x, y }` toca numa parte do alvo, relativa ao canto dele.
- Disponíveis em `g`: `p` (a página), `v` (versão), `ap` (aparelho), `dados`, `check`, `toque` (true no celular).

## 5. "Tem algo na frente?": a checagem de cada toque

Regra sem exceção: **nenhum toque sem checagem.**

1. O alvo precisa estar visível e **parado**. Se estiver fora da tela, ou cortado por um contêiner com rolagem própria (o corpo de um diálogo, uma lista), rola suave até o centro e espera parar de mexer.
2. `document.elementFromPoint(x, y)` no ponto do toque. Se é o alvo (ou algo dentro dele, ou o `<label>` dele), segue.
3. Se não é, classifica **quem cobre** (o elemento mais de fora):

| Quem cobre | Como reconhece | O que faz |
|---|---|---|
| aviso / toast | `role=status\|alert`, `aria-live`, classe/id toast/snackbar/aviso/notif, ou `video.avisos`. Aviso fixo com `pointer-events: none` também conta: vale a caixa dele sobre a do alvo, não o `elementFromPoint` (o toque passaria através, mas quem assiste vê o dedo por baixo) | **espera sumir** (até `limiteAviso`, 10 s), evento `espera` |
| barra fixa / botão flutuante | ancestral `position: fixed\|sticky` que não contém o alvo | **rola** até o alvo ficar acima/abaixo dela (até 3 vezes), evento `rola` |
| alvo também fixo | os dois fixos: rolar não adianta | **falha**: "nav … cobre button \"Finalizar\" (os dois são fixos na tela, rolar não libera)" |
| véu de modal (> ½ da tela) | fixo e enorme | **falha** |
| qualquer outra coisa | — | **falha**: "X cobre Y" |

4. A checagem roda **de novo no instante do toque** (um aviso pode surgir durante o movimento) e o toque é disparado **exatamente no ponto conferido** (`touchscreen.tap` / `mouse.click`), nunca por `locator.click()`.
5. Na falha, sai com código 1, a mensagem e `saida/<versao>/falha.png`, com quem cobre em vermelho e o alvo em azul.
6. Vale igual no `--check`.

Quando falhar, o conserto é no roteiro (fechar o aviso, rolar de outro jeito, tocar noutro botão) ou **no produto**: um botão atrás da navegação é defeito do app, e vale avisar. Nunca desligue a checagem.

## 6. Controles nativos, privacidade e dado plausível

**Controles nativos.** O Chromium sem janela não desenha a lista do `<select>`, o calendário, o relógio nem o seletor de arquivo.

- `g.escolhe`: o indicador toca o campo, o campo passa **pelas opções, uma a uma** (380 ms cada) até a escolhida, com realce, e a composição cola um selo "✓ Opção" no campo. Cada passo dispara `input`/`change`. Se o app reage a cada troca, use `{ passoAPasso: false }`.
- `g.data`: digita dia/mês/ano no próprio campo (a ordem vem do `idioma`) e o selo mostra a data. Os eventos `input`/`change` do campo ficam retidos durante a digitação e sai um só no fim: app que reage a cada troca (campo de várias datas) não registra as datas intermediárias.
- `g.arquivo`: realce no botão e selo com o nome do arquivo.
- O `--check` lista os controles nativos usados. **Avise no briefing** e, se o app tiver um componente próprio de lista, prefira-o no roteiro.
- Componente próprio (listbox, combobox do app): use `g.toque` na opção. `g.escolhe` recusa componente que não é `<select>`.

**Privacidade por padrão.** Os itens abaixo são borrados **dentro da página, antes do pixel existir** (atributo `data-fv-borrar` mais folha de estilo; o DOM do app não é reescrito):

- `input[type=password]` e `[data-privado]`;
- links com parâmetro de segredo (`token`, `key`, `secret`, `convite`, `invite`, `code`, `sig`…) ou com trecho aleatório de 20 ou mais caracteres;
- e-mails, menos os de `privacidade.emailsPermitidos`;
- os seletores de `privacidade.seletores` e `borrar`.

`esconder` some com elementos e botões por seletor ou por texto. Teste medido: a região borrada fica com 0% do detalhe de um título da mesma tela.

**Dado plausível** (`dados.mjs`, `g.dados`):

- perfis de funcionamento: `escola` (seg–sex, 07:30–17:30), `clinica`, `escritorio`, `comercio` (seg–sáb), `restaurante`, `sempre`, sobrescrevíveis com `dias`, `inicio`, `fim` e `passo`;
- `feriados: 'br'` inclui os nacionais, com os móveis calculados pela Páscoa;
- `dados.diaUtil(n)`: o n-ésimo dia de funcionamento a partir de hoje;
- `dados.horario('manha' | 'tarde' | 'fim' | 'HH:MM')`: horário dentro do expediente;
- `dados.extenso(d)`: "qua., 30 de set.";
- `g.data` **recusa** fim de semana e feriado (`{ qualquerDia: true }` para exceção explícita).

Nunca use "hoje" cru: a gravação pode cair num domingo.

## 7. Gravar, conferir e compor

```sh
node <pasta>/video.mjs --check                 # confere sem gravar: mesma checagem de toque, ~20 s por versão
node <pasta>/video.mjs [--versao celular]      # grava → saida/<versao>/ + folha-toques.png  (OLHE)
node <motor>/scripts/tutorial/compor.mjs <pasta> [--versao v] [--modo rascunho|final] [--sem-trilha] [--sem-render]
                                               # → <pasta>/<id>-<versao>[-rascunho].mp4 + <id>-<versao>-folha.png (OLHE)
                                               # --sem-render: só a folha de eventos e a checagem, em segundos (para acertar o visual)
```

**Aparelhos** (`scripts/tutorial/aparelhos.mjs`). O projeto sobrescreve com `video.aparelhos = { celular: { dsf: 2 } }`.

| nome | viewport | DSF | captura | formato |
|---|---|---|---|---|
| `celular` | 390×844 | 3 | 1170×2532 | 9:16 |
| `celular-grande` | 430×932 | 3 | 1290×2796 | 9:16 |
| `celular-pequeno` | 360×780 | 3 | 1080×2340 | 9:16 |
| `tablet` | 820×1180 | 2 | 1640×2360 | 4:5 |
| `computador` | 1440×900 | 2 | 2880×1800 | 16:9 |
| `computador-hd` | 1280×800 | 2 | 2560×1600 | 16:9 |

**O que o `compor.mjs` faz:**

1. **Monta o projeto do motor** em `saida/<versao>/comp/`:
   - `engine.js` e `tutorial.js` vêm da skill (mais `desenho.js` numa série versão 2, e o `visual.js` da série se ela desenha algum elemento por conta própria);
   - `dados.js` vem dos eventos;
   - `marca.js` e `fontes/` vêm da série.
2. **Linha do tempo:**
   - abertura (2,4 s: selo, título e a saída para a tela);
   - tela real no tempo real da gravação;
   - fechamento (2,8 s: entrada, frase final, logo).
   - Como cada parte se parece é o **visual da série** (seção 13). Série sem `"versao"` usa o desenho antigo: mergulho na abertura, íris no fechamento, cartão branco que vira.
3. **Câmera** que acompanha a ação:
   - zoom no alvo, com contexto mínimo de meia tela;
   - limitado a `largura da captura ÷ largura da tela no vídeo`, para não amolecer;
   - a ação fica centrada na parte do quadro que a legenda não cobre;
   - abre para a tela toda na rolagem, na troca de tela e depois de carregar;
   - não abre e fecha entre passos colados.
4. **Indicador:**
   - dedo pequeno (círculo translúcido com anel branco) que só aparece em volta dos toques, encolhe no toque e solta uma onda curta;
   - cursor de seta no computador, com onda discreta no clique, percorrendo a mesma curva que o mouse real fez.
5. **Realce:** antes de cada toque e durante `aponta`/`escolhe`, no tipo que a série escolheu (seção 13).
6. **Legenda:** fora da câmera, com o rótulo do passo e a frase, no lado, no tipo e na troca que a série escolheu (seção 13). A câmera centra a ação na parte do quadro que a legenda deixa livre.
7. **Sons** (`folha.json` gerada dos eventos, em `sons.py`), cada um na amostra exata:

   | Evento | Som |
   |---|---|
   | toque | toque (celular) ou clique (computador) |
   | digitação | digitacao, com a duração real |
   | legenda nova | depende da troca: `virar` → virada (cartão); `subir` → whoosh curto e baixo; `corte` → nenhum |
   | troca de tela | whoosh |
   | sucesso | sucesso |
   | escolha | sucesso baixinho |
   | abertura → tela | depende da saída: `mergulho` → whoosh; `deslizar` → whoosh da direita; `cortina` → whoosh longo; `corte` → nenhum |
   | fechamento | depende da entrada: `iris`, `corte` → impacto; `cortina` → impacto quando fecha; `deslizar` → whoosh |

   Na série antiga, a legenda nova é `virada` (página), a abertura é `whoosh` e o fechamento é `impacto`, como sempre foi.

8. **Trilha:** `arranjo_serie.py` com a identidade da série e a **semente do vídeo** (id + versão), na duração exata. `verifica.py` tem que passar.
9. **Render:** rascunho a 30 fps; final a 60 fps com 4 subquadros de motion blur (configurável em `serie.json`).
10. **Checagem de colisão/área segura** (`quadros.cjs`) em cada render. Legenda ou título coberto, ou fora da área, reprova a composição.
11. `finalizar.mjs` mixa e verifica duração, loudness (−18 LUFS) e true peak.
12. **Folha de eventos:** antes, durante e depois de cada toque, cada virada de passo, cada escolha, a abertura e o fechamento.

## 8. O que sai

`saida/<versao>/eventos.json`:

- coordenadas em px CSS do viewport;
- tempos em segundos desde o início da captura.

```json
{ "id": "01-agendar-aula", "versao": "celular",
  "aparelho": { "nome": "celular", "viewport": {"width":390,"height":844}, "dsf":3, "toque":true, "formato":"9x16" },
  "captura":  { "metodo":"screencast", "qps":8.0, "qpsPico":61, "largura":1170, "altura":2532, "quadros":"quadros.json" },
  "duracao": 16.7, "nativos": ["select: select#turma \"Turma\""], "errosDaPagina": [],
  "eventos": [
    { "t":0.0,  "tipo":"passo", "n":1, "legenda":"Toque em Agendar aula." },
    { "t":0.21, "t1":0.73, "tipo":"move", "de":[195,607.7], "para":[92,331] },
    { "t":1.06, "tipo":"toque", "alvo":"button#nova-aula \"Agendar aula\"", "ret":{"x":32,"y":309,"w":120,"h":44}, "ponto":[92,331],
      "realce":true, "checagem":[{"quem":"div[role=status] \"Meta adicionada!\"","tipo":"aviso","acao":"esperou 1,8 s"}] },
    { "t":3.1, "t1":4.3, "tipo":"digita", "alvo":"…", "ret":{}, "texto":"…", "teclas":17, "privado":false },
    { "t":4.3, "t1":6.2, "tipo":"escolhe", "alvo":"select#turma \"Turma\"", "ret":{}, "opcoes":["…"], "escolhida":"3º ano A" },
    { "t":7.0, "t1":7.8, "tipo":"rola", "dy":66, "motivo":"liberar button#salvar \"Salvar\" de button#fab (fixo)" },
    { "t":8.1, "tipo":"tela", "url":"/pei/12" },
    { "t":9.0, "t1":10.8, "tipo":"espera", "motivo":"aviso div[role=status] … sobre button#…" },
    { "t":12.0, "tipo":"sucesso", "ret":{} }
  ] }
```

- `quadros.json`: `[["00001.jpg", 0.012], …]`, com o tempo de cada quadro no mesmo relógio dos eventos.
- `folha-toques.png`: da gravação crua. Para cada toque, os quadros antes, no instante e depois, com o ponto marcado, o retângulo do alvo e o que a checagem fez. **Olhe antes de compor.**
- `<id>-<versao>-folha.png`: do vídeo composto. **Olhe antes de mostrar.**
- `check.json` (no `--check`): `ok`, `nativos` e eventos. Na falha: `falha.json` e `falha.png`.

## 9. Identidade da série

A pasta `serie` é decidida uma vez e vale para todos os vídeos:

| Arquivo | O que é |
|---|---|
| `marca.js` | `const MARCA = { nome, cores: { fundo, tinta, marca, acento }, logo: { viewBox, partes: [{ d, fill }], negativo }, simbolo, formas }`. Gere o logo com `node <skill>/scripts/logo.mjs logo.svg --js LOGO`. `negativo: true` pinta o logo de branco sobre a cor da marca no fechamento. |
| `fontes/` | `node <skill>/scripts/fontes.mjs <serie> "Família"`: woff2 locais, sem rede no render. O motor **mede** a largura para provar que a fonte desenhou. |
| `serie.json` | `{ "versao": 2, "leitura": "leitura.md", "visual": { … }, "rotulo": "Produto · passo a passo", "fimLinhas": ["Pronto."], "fontes": ["Família"], "fonteTitulo": "…", "fonteTexto": "…", "abertura": 2.4, "fechamento": 2.8, "loudness_lufs": -18, "fps": 60, "sub": 4, "plataforma": null, "niveis": { "toque": -6 }, "passo": "Passo {n} de {N}", "workers": 3 }`. `passo` é o rótulo do cartão de legenda (série em outro idioma: `"Step {n} of {N}"`); `workers` fixa quantos navegadores o render abre (máquina dividida), senão são núcleos − 2. `niveis` muda o nível de um som de efeito em dB (`"toque": -6`) ou o desliga (`"sucesso": false`, que cala também o som da escolha). `visual` é a seção 13; `fonteMono` é a fonte dos rótulos `mono` (senão, a monoespaçada do sistema); `endereco` é o domínio da barra da moldura `navegador` |
| `visual.js` | só se algum elemento é `"proprio"` (seção 13) |
| `identidade.json` | a trilha da série (esquema em `assets/audio/API.md` e `references/trilha.md` §9): `nome`, `papel` (`fundo`), `estilo`, `bpm` [min, max], `modos`, `tons`, `instrumentos` {harmonia, baixo, percussao, melodia, textura}, `densidade`, `loudness_lufs`, `efeitos.nivel` |
| `.venv/` | Python com numpy e scipy (fora do git). Ou `FAZERVIDEO_PYTHON`. |

**Cada vídeo tem a própria trilha**: a mesma identidade com a semente do vídeo. Tom, BPM, progressão, motivo e groove mudam. Nunca a mesma trilha esticada. Para provar: `python serie.py --comparar folhaA.json folhaB.json wavA wavB`.

## 10. Copiar o motor para um repositório

Para rodar sem a skill instalada (outra máquina, Windows, CI):

```sh
node <skill>/scripts/tutorial/copiar.mjs docs/videos/_motor
```

- Copia os scripts (tutorial, render, quadros, finalizar, playwright, fontes, logo), o molde do motor (`engine.js`, `index.html`), a biblioteca de áudio (`synth.py`, `verifica.py`, `sons.py`, `serie.py`, `arranjo_serie.py`) e este contrato, **no mesmo layout da skill**. Os caminhos relativos continuam valendo.
- Escreve `MOTOR.md` com a data da cópia.
- **Não edite a cópia.** Melhore na skill e copie de novo.
- Os `video.mjs` importam de `../_motor/scripts/tutorial/gravar.mjs`.
- **Windows:** Node 18+, ffmpeg (`winget install --id Gyan.FFmpeg -e`), `npx playwright install chromium` e `py -3 -m venv .venv; .venv\Scripts\pip install numpy scipy`. Os scripts não usam nada de shell Unix.
- **.gitignore:** `*/saida/`, `*.mp4`, `*-folha.png`, `.venv/`.

## 11. Regravar quando a tela mudar

1. `node <pasta>/video.mjs --check` em cada vídeo (a cada release do app). Quebrou = a tela mudou, ou um toque agora está coberto.
2. Corrija o roteiro. Se o toque ficou coberto por defeito do app, avise quem cuida do app.
3. Grave, **olhe a folha de toques**, componha, **olhe a folha de eventos**.
4. A trilha não muda se a semente não mudar. Ela só se ajusta à duração nova.

## 12. Armadilhas

- **`--lang`:** o Chromium precisa de `--lang=<idioma>` na linha de comando, senão a data sai "mm/dd/yyyy". O gravador já passa.
- **Screencast em pixel CSS:** no headless antigo, o screencast ignora o DSF. É por isso que o gravador usa o canal `chromium` com `--force-device-scale-factor`.
- **`captureScreenshot` com página rolada:** o `clip` é em coordenadas do **documento**. Fixo em (0,0), a tela rolada sai em branco. A reserva acompanha o `cssVisualViewport`.
- **Fonte de `file://`:** o headless sem `--allow-file-access-from-files` não carrega fonte local e cai no fallback sem avisar. O render da skill passa o flag, e o motor **mede** a largura contra o fallback.
- **Realce durante rolagem:** não existe mais. O realce é desenhado pela composição a partir do retângulo gravado com o alvo **parado**.
- **O log mente:** "✓ gravado" não prova que o toque caiu no lugar. Olhe as folhas: o log só sabe que o clique foi disparado, não o que ele mostrou. Um toque no lugar errado ou um alvo coberto passa com "✓".
- **Uma coisa por vez** quando o app de demonstração reseta dados a cada login: nunca grave duas versões em paralelo contra a mesma demo.

## 13. O visual da série

**Por que existe.** Até a versão 2, o motor desenhava o mesmo vídeo para qualquer produto: duas formas
orgânicas no fundo, a janela com três bolinhas, um cartão branco que vira, um mergulho na abertura e uma
íris no fechamento. A série só trocava quatro cores e duas fontes. Assim, uma casa noturna, um escritório
de contabilidade e um app infantil saíam com a mesma estrutura, e só a cor mudava. Um desenho que ninguém
escolheu vira a identidade de todo mundo. Agora a série **declara** cada elemento, e cada escolha aponta
para a leitura do projeto (`leitura.md`). Escolha sem evidência é palpite, e se diz que é palpite.

**Série antiga.** Sem `"versao"` no `serie.json`, o quadro sai igual ao de antes, pixel por pixel. O
`compor.mjs` avisa numa linha que aquele é o desenho antigo do motor, não uma identidade.

**Série nova.** Com `"versao": 2`, os nove elementos são obrigatórios. Faltou um, o `compor.mjs` para e diz
qual. Um padrão que ninguém escolheu vira a identidade de todo mundo. Os poucos campos opcionais estão
marcados abaixo com o valor que assumem.

```json
{
  "versao": 2,
  "leitura": "leitura.md",
  "visual": {
    "cores":      { "palco": "#07070B", "sinal": "#FF2E63", "osso": "#F4F1EA" },
    "fundo":      { "tipo": "luz", "cor": "palco", "tinta": "sinal", "tinta2": "#3A2BFF" },
    "moldura":    { "tipo": "nenhuma", "raio": 0, "sombra": "nenhuma" },
    "legenda":    { "tipo": "faixa", "lado": "baixo", "fundo": "sinal", "tinta": "palco", "rotulo": "mono", "troca": "corte" },
    "selo":       { "tipo": "mono", "cor": "sinal" },
    "titulo":     { "caixa": "alta", "peso": 400, "espaco": 0.01, "entrada": "corte", "tinta": "osso" },
    "abertura":   { "saida": "corte" },
    "fechamento": { "entrada": "corte", "fundo": "sinal", "tinta": "palco", "logo": "negativo" },
    "realce":     { "tipo": "cantos", "cor": "sinal", "espessura": 4, "raio": 0 },
    "indicador":  { "tinta": "sinal", "contorno": "osso" }
  }
}
```

- **Cor** é um hex (`"#FF7A1A"`) ou o nome de uma cor de `visual.cores` ou de `MARCA.cores`.
- **Contraste** é conferido antes do render (WCAG). Abaixo de 3:1, o `compor.mjs` para. Abaixo de 4,5:1 na legenda, ele avisa. Os pares conferidos são:
  - a legenda sobre o fundo dela (o do quadro, na `solta`);
  - o rótulo do passo sobre esse mesmo fundo;
  - o título sobre `fundo.cor`;
  - o fechamento;
  - o selo.
- **A checagem de colisão e de área segura vale em qualquer combinação.** Texto coberto ou fora da área
  segura reprova a composição, como antes.
- **Para acertar o visual rápido:** `compor.mjs <pasta> --sem-render` monta o projeto e gera só a folha de
  eventos, com a checagem, em uns 5 s.

Cada tipo existe porque muda a **estrutura** do quadro, não a cor. Duas opções que só diferissem na cor
seriam uma opção.

### fundo: o que fica atrás da tela e do título

Campos: `tipo`, `cor` (a superfície), `tinta` (o desenho), `tinta2` (opcional; o padrão é `tinta`) e
`forca` (opcional: a opacidade do desenho, de 0 a 1; o padrão depende do tipo e está entre parênteses
abaixo).

| tipo | miniatura | quando usar | quando não usar |
|---|---|---|---|
| `liso` | uma cor chapada, nada mais | produto minimalista; quando a tela gravada já é carregada e o fundo tem de sumir | quando o produto tem textura ou luz própria (o vídeo fica sem lugar) |
| `formas` (0,1) | duas manchas orgânicas nos cantos, respirando devagar | marca de formas moles, amigável, sem grade | produto técnico, sóbrio ou noturno (é o desenho antigo) |
| `grade` (0,14) | papel quadriculado de linhas finas, andando devagar | contabilidade, engenharia, planilha, ferramenta de precisão | público infantil ou de festa (lê como "escritório") |
| `pontos` (0,22) | pontilhado regular | ferramenta de design, caderno de rascunho, produto técnico mais leve que a grade | quando a tela tem muita textura fina (os pontos brigam com ela) |
| `luz` (0,38) | superfície escura com dois ou três focos de luz colorida à deriva, como palco com fumaça | noite, música, evento, game, qualquer produto de interface escura | fundo claro (a luz some) e marca sóbria |
| `faixas` (0,16) | listras largas em diagonal, em duas tintas, correndo | infantil, esporte, promoção, marca com energia gráfica | leitura longa e marca séria. Com `forca` baixa sobre cor forte, a mistura fica suja: prefira tintas tonais com `forca` 1 |
| `proprio` | o que o `visual.js` desenhar | quando nenhum tipo diz o que o produto é (caderno, mapa, tecido…) | quando um tipo pronto serve: é código para manter |

### moldura: o que envolve a tela gravada

Campos: `tipo`, `raio`, `sombra` (`nenhuma` | `curta` | `longa`), `cor` (menos em `nenhuma`) e `espessura`
(no `fio`, padrão 2). A moldura anda com a câmera.

| tipo | miniatura | quando usar | quando não usar |
|---|---|---|---|
| `nenhuma` | a tela solta no fundo, só com o raio | produto que quer parecer tela cheia; estética crua de noite, de flyer | quando o fundo tem a mesma cor da tela (ela some) |
| `fio` | um contorno de `espessura` px em volta da tela | contorno fino e sóbrio (1–2 px) ou grosso e redondo de brinquedo (10–14 px) | quando o produto é "um site" e isso importa (use `navegador`) |
| `janela` | no computador, a barra de janela com as três bolinhas; no celular, o corpo preto do aparelho | quando reconhecer "é um app no meu computador/celular" ajuda quem assiste | como padrão por hábito: é o desenho antigo |
| `navegador` | a barra de endereço com o domínio (só o domínio: o caminho pode ter token) | portal web, SaaS, "entre em app.produto.com" | app nativo |
| `proprio` | o `visual.js` desenha; `margem` (número ou `[cima, direita, baixo, esquerda]`) diz quanto o layout reserva em volta | polaroide, papel colado, moldura da marca | quando `fio` ou `janela` bastam |

### legenda: o texto do passo

Campos:

- `tipo`, `lado` e `tinta`;
- `rotulo` (`ponto` | `mono` | `numero` | `nenhum`) e `troca` (`virar` | `subir` | `corte`);
- no cartão: `fundo`, `borda` (cor ou `"nenhuma"`) e `raio`. Na faixa: `fundo`;
- opcionais: `sinal` (a cor do rótulo; o padrão é `tinta`), `caixa` (padrão `normal`), `peso` (padrão 700), `sombra` do cartão (padrão `nenhuma`) e `fonte` (`titulo` ou `texto`, padrão `titulo`: a frase usa a fonte do título; letra manuscrita ou de display pede `texto`, senão fica pequena demais para ler).

**`lado`** é `direita`, `esquerda`, `baixo` ou `cima`, ou um valor por formato:
`{ "9x16": "cima", "padrao": "direita" }`. O lado decide o layout inteiro:

- a legenda ocupa aquele lado, com o texto sempre dentro da área segura;
- a tela ocupa o maior retângulo que sobra, descontada a moldura;
- a câmera centra a ação no que sobra.

Os quatro lados funcionam nos quatro formatos (prova em `provas/v/matriz.md`). A escolha de cada um:

- `direita`/`esquerda` no 16:9 é o natural;
- no 9:16, lateral espreme a tela (a coluna tem uns 380 px);
- `cima` no 9:16 é o natural (a área segura do Reels começa em y 250);
- `baixo` no 9:16 sobe até y 1450 e deixa vazio o que fica embaixo, sob a interface da plataforma.

| tipo | miniatura | quando usar | quando não usar |
|---|---|---|---|
| `cartao` | um cartão com fundo, borda e raio, flutuando ao lado da tela | o jeito mais claro de ler; marca de superfícies e cartões | estética crua ou editorial |
| `faixa` | uma faixa de cor chapada que sangra de uma borda à outra do quadro, com o texto dentro | noite, esporte, TV, qualquer marca de bloco de cor | marca delicada; fundo da mesma cor da faixa |
| `solta` | o texto direto no fundo, sem caixa. O lado da legenda ganha um véu com o mesmo fundo, e a tela com zoom some na borda da parte livre em vez de passar por baixo do texto | editorial, sóbrio, muito espaço em branco | fundo muito ocupado (`luz`, `faixas` fortes): o texto perde contraste |

| rotulo | miniatura | quando usar |
|---|---|---|
| `ponto` | "● Passo 2 de 5" | o padrão legível |
| `mono` | "PASSO 02 DE 05" em letra de máquina, espaçada | técnico, noite, flyer |
| `numero` | "02 /05" em corpo de título, acima da frase | infantil, editorial: quando a ordem é a mensagem |
| `nenhum` | só a frase | vídeo de um passo, ou quando o número atrapalha |

| troca | miniatura | som | quando usar |
|---|---|---|---|
| `virar` | o cartão (ou o bloco de texto) vira no eixo X e o texto novo nasce no verso | `virada` (variante cartão) | cartão, infantil, amigável |
| `subir` | o texto velho sai por cima, o novo entra por baixo | `whoosh` curto e baixo | sóbrio, editorial |
| `corte` | troca seca no instante do passo | nenhum (o corte é o acento) | noite, corte seco, ritmo |

### selo: o rótulo da série acima do título, na abertura

Campos: `tipo` e `cor` (menos em `nenhum` e `proprio`). O texto é o `rotulo` do `serie.json`.

| tipo | miniatura | quando usar |
|---|---|---|
| `pilula` | o texto numa pílula de fundo claro da mesma cor | amigável, produto de consumo |
| `mono` | o texto em caixa alta, letra de máquina, datilografado letra a letra | técnico, noite |
| `linha` | um fio curto que se estende e o texto ao lado, sem caixa | editorial, sóbrio, título alinhado à esquerda |
| `nenhum` | nada | quando o título basta (infantil, marca muito forte) |
| `proprio` | o `visual.js` desenha | fita adesiva, carimbo, etiqueta da marca |

### titulo: a letra da abertura e do fechamento

Campos: `caixa` (`alta` | `normal`), `peso`, `espaco` (em em, ex. -0.02), `tinta` e `entrada`. Opcionais:
`alinhar` (`centro` | `esquerda`, padrão `centro`) e `escala` (padrão 1).

O título encolhe sozinho até caber na área segura. A entrelinha nunca fica menor que a caixa do texto
na fonte da série: fonte de ascendente alto, como Baloo ou Caveat, ganha mais espaço.

| entrada | miniatura | quando usar |
|---|---|---|
| `palavras` | cada palavra sobe de dentro de uma máscara | o padrão calmo |
| `letras` | cada letra sobe em cascata | infantil, lúdico |
| `mascara` | a linha inteira é revelada da esquerda para a direita | editorial, sóbrio |
| `corte` | aparece inteira, de uma vez | noite, corte seco |

### abertura: como o título dá lugar à tela

Campo: `saida` (mais `cor` na `cortina`).

| saida | miniatura | som | quando usar |
|---|---|---|---|
| `mergulho` | o título cresce até atravessar a tela, e a tela nasce de dentro | whoosh | cinematográfico; é o desenho antigo |
| `corte` | corte seco no fim da abertura | nenhum | noite, ritmo, marca direta |
| `deslizar` | o título sai pela esquerda e a tela entra pela direita, sobre o mesmo fundo | whoosh da direita | sóbrio, sequência lógica |
| `cortina` | um painel de `cor` atravessa o quadro e revela a tela | whoosh longo | infantil, energia, marca de cor chapada |

### fechamento: a marca no fim

Campos: `entrada`, `fundo`, `tinta` e `logo` (`cores`: o logo com as cores dele; `negativo`: o logo
inteiro na `tinta`).

| entrada | miniatura | som | quando usar |
|---|---|---|---|
| `iris` | um círculo de `fundo` cresce do centro e cobre a tela | impacto | amigável; é o desenho antigo |
| `cortina` | o cartão final é revelado por uma borda que corre da esquerda para a direita | impacto quando fecha | sóbrio, editorial |
| `corte` | corte seco para o cartão final | impacto no corte | noite, ritmo |
| `deslizar` | o cartão final entra pela direita, por cima da tela | whoosh | infantil, leve, sem peso de impacto |

### realce: onde o dedo vai

Campos: `tipo`, `cor`, `espessura` (padrão 3) e `raio` (padrão 12).

| tipo | miniatura | quando usar | quando não usar |
|---|---|---|---|
| `contorno` | retângulo arredondado de traço, com um véu leve por dentro | o padrão; é o desenho antigo | — |
| `cantos` | só os quatro cantos, como o visor de uma câmera | técnico, noite, foto | alvo muito pequeno (os cantos se juntam) |
| `sublinhado` | um traço que corre por baixo do alvo | editorial, sóbrio, links e campos | alvo alto (um cartão inteiro) |
| `preenchido` | marca-texto: um fundo de cor por trás do alvo, que multiplica (o texto do app continua legível) | infantil, estudo | app de interface escura (o multiplicar escurece mais) |
| `proprio` | o `visual.js` desenha | círculo de caneta, seta desenhada | — |

### indicador: o dedo e o cursor

Campos: `tinta` (o miolo do dedo, translúcido, e o corpo do cursor) e `contorno` (o anel do dedo e a
borda do cursor). A onda do toque sai no `contorno` no celular e na cor do `realce` no computador. O selo
de escolha ("✓ 3º ano A") usa a cor do `realce`, com a tinta que se lê sobre ela.

### O gancho `proprio` (visual.js)

Quando nenhum tipo diz o que o produto é, a série traz `visual.js` na pasta dela. Aceitam `proprio`:

- `fundo`, `moldura`, `selo` e `realce`.

Não aceitam, e por quê:

- `legenda`, `titulo`, `abertura` e `fechamento`;
- eles carregam texto que a checagem mede e tempos que a folha de som segue;
- um desenho livre ali quebraria as duas coisas sem ninguém ver.

```js
// <serie>/visual.js — roda no navegador, depois do engine.js. Só os ajudantes do motor.
VISUAL_PROPRIO.fundo = (ctx) => {
  const s = svgQuadro(ctx.camada)
  // … desenha …
  return (t) => { /* só a partir de t */ }
}
```

**O que todo gancho recebe (`ctx`):**

- o quadro: `W`, `H`, `FMT`, `L`, `CX`, `CY`;
- os tempos: `A`, `D`, `F` e `fim`;
- `toque` e as cores: `cores` (a paleta resolvida) e `visual` (tudo, já em hex);
- o espaço: `area` (a área segura), `tela` (x, y, w, h, r), `legenda`, `livre` e `fontes` (titulo, texto, mono).

**O que cada um recebe a mais e o que devolve:**

| elemento | recebe | devolve | desenha em |
|---|---|---|---|
| `fundo` | `camada` (tela cheia, já com `fundo.cor`) e `fase` (`abertura`, `tela` ou `veu`, pois é chamado uma vez por cena) | `(t) => {}` | a camada, atrás de tudo |
| `moldura` | `mundo` (anda com a câmera) e `cromo` (a margem declarada, em px) | `(t) => {}` | o mundo, embaixo da tela gravada |
| `selo` | `camada` (a da abertura), `texto`, `titulo` (retângulo das linhas) e `alinhar` | `(t) => {}` | a camada da abertura |
| `realce` | `svg` (no mundo), `k` (px do quadro por px do app), `aTela(x, y)` e `cor` | `(t, alvo) => {}`; `alvo` é `{ x, y, w, h, a }` em px do mundo, ou `null`; `a` é a intensidade, de 0 a 1 | o svg |

**O que o gancho não pode fazer, e quem garante:**

- **Depender de rede, relógio ou sorteio sem semente:**
  - o render roda sem rede;
  - cada subquadro do motion blur tem de sair igual.
  - O `compor.mjs` lê o `visual.js` e **recusa** `fetch`, `http://`, `import()`, `Math.random`, `Date.now`, `setTimeout`, `requestAnimationFrame` e animação CSS. Use `rng(semente)` e o tempo `t`.
- **Cobrir a legenda:**
  - fundo, moldura e realce estão em cenas embaixo da cena da legenda, então não conseguem;
  - o selo mora na abertura, que não tem legenda.
- **Sair da área segura com texto:** texto do gancho tem de ser marcado (`marcar(el, 'texto')`, ou `bloco`, que já marca). Aí a checagem de área segura e de colisão vale para ele como para o resto.
- **Desenhar fora do lugar que recebeu:** é regra, não trava. O gancho recebe o próprio contêiner; mexer em outro elemento da página é defeito do gancho.

O exemplo completo (caderno pautado, polaroide com fita, fita adesiva, círculo de caneta) está em
`provas/v/series/rabisco/visual.js` na oficina da skill.
