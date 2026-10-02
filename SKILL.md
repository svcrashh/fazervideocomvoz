---
name: fazervideocomvoz
description: Faz vídeos de produto com VOZ EM OFF gerada pela ElevenLabs, sem avatar nem rosto. Antes de tudo olha o produto (repositório, telas, o que mudou, público, canal), recomenda um de sete estilos com o porquê em uma linha e pergunta qual usar, com vídeo de exemplo de cada — tela real com câmera (tutorial), texto que se digita, lista que corre, número que conta, antes e depois, teaser de luz, capítulos com índice —, cada um com molde de verdade, sem marca embutida, 16:9 e 9:16 recompostos (nunca tela encolhida). Roteiro de locução aprovado antes de gastar crédito, dicionário de pronúncia conferido por transcrição, voz escolhida por vídeo (três candidatas lendo a frase real do roteiro), trilha original que abaixa quando a voz fala, folha de quadros de cada formato olhada antes de entregar. Traz dentro o motor da /fazervideo. Fala português ou inglês, o idioma de quem pede. Use quando o pedido tiver voz — /fazervideocomvoz, "vídeo com voz", "com narração", "narrado", "locução", "voz em off", "uma voz explicando", "tutorial falado", "põe uma voz no vídeo" — ou, em inglês, "video with voice", "narrated video", "voiceover", "voice-over", "add narration", "talking tutorial". Pedido de vídeo sem voz é da /fazervideo.
---

# /fazervideocomvoz

## Idioma · Language

Converse no idioma de quem pede: português ou inglês. As referências desta skill estão em português; leia-as
como instruções e responda no idioma do usuário. O idioma do vídeo (legenda, título, voz) é decidido no briefing.

Reply in the user's language, Portuguese or English. This skill's references are written in Portuguese: read them
as instructions and answer in the user's language. The video's language (captions, titles, voice) is chosen in the
briefing.

Esta skill faz o vídeo de produto da `/fazervideo`, com o mesmo motor e o mesmo cuidado, e
acrescenta **uma voz em off** gerada pela ElevenLabs. Ninguém aparece: sem avatar, sem rosto, sem boca
sincronizada.

`$SKILL` é a pasta desta skill, que aparece no topo quando ela carrega. O motor inteiro mora aqui
dentro, nos caminhos de sempre: `scripts/`, `assets/`, `references/`.

**Antes de qualquer coisa, leia inteiro `$SKILL/references/fluxo.md` e siga-o.** É o fluxo completo
do vídeo: as três regras sem exceção, a leitura do projeto, a triagem, o briefing, a série, a
prancha, a trilha e a entrega. Ele vale aqui sem mudar nada. Esta página diz só o que a voz
acrescenta, e em que ponto do fluxo.

Pedido sem voz nenhuma: se a `/fazervideo` estiver instalada, ele é dela. Se não estiver, siga
`references/fluxo.md` e pule tudo o que está abaixo.

## O estilo: olhar o produto, recomendar, perguntar

A skill tem **sete estilos**, cada um com um molde de verdade. O estilo é escolhido **antes do briefing**,
logo depois do reconhecimento (passo 0.1 do fluxo), e vale para qualquer pedido com voz.

| Estilo (`id`) | O que é | Molde |
|---|---|---|
| Tela real com câmera (`tela-real-com-camera`) | tutorial: a tela real gravada, a câmera vai até o campo da vez, véu e desfoque no resto, cartão de passo, "Pronto!" | `moldes/tela-real-com-camera/` |
| Texto que se digita (`texto-que-se-digita`) | a pergunta ou o pedido escrito na tela no quadro 0, o cursor, e o produto respondendo | `moldes/texto-que-se-digita/` |
| Lista que corre (`lista-que-corre`) | novidades sem índice: frase curta + prova de tela por item, em rajada, lista ou cartaz; o muro no fim | `moldes/lista-que-corre/` |
| Número que conta (`numero-que-conta`) | um número gigante com rótulo de três palavras; vídeo de 6–20 s ou bloco de abertura e fecho dos outros | `moldes/numero-que-conta/` |
| Antes e depois (`antes-e-depois`) | o mesmo enquadramento em dois estados, cortado no clique; ou o zoom-out que revela o todo | `moldes/antes-e-depois/` |
| Teaser de luz (`teaser-de-luz`) | fundo escuro, uma linha de luz desenha pedaços da interface e revela o produto no fim | `moldes/teaser-de-luz/` |
| Capítulos com índice (`capitulos-com-indice`) | abertura com índice numerado, um capítulo de cartaz por novidade com a interface redesenhada, fecho com o índice | `assets/capitulos/` + `references/capitulos.md` |

O catálogo está em `references/catalogo/`: `regras.md` (as 12 regras que valem para todo estilo), `escolha.md`
(o guia de escolha), `estilos/<id>.md` (uma ficha por estilo) e `sem-molde.md` (estilos e ideias de roteiro que
ainda não têm molde). **Leia `regras.md` e `escolha.md` antes de recomendar.**

1. **Olhe o produto,** no reconhecimento do fluxo (0.1), antes de perguntar: o repositório e as telas; **o que
   mudou** (`git log`, changelog, a conversa); **para quem é**; **onde o vídeo vai passar**; quantas novidades ou
   passos são; se o produto tem uma caixa de texto (busca, IA, chat). Daí saem cinco valores:
   - objetivo: `ensinar` · `novidade` · `lancar` · `atencao` · `contas`;
   - canal: `site` · `whatsapp` · `reels` · `feed` · `telao`;
   - produto: `b2b` · `jovem` · `leigo` · `financas` · `criador` · `jogo` · `varejo` · `outro`;
   - o número de itens e se há caixa de texto.
2. **Rode a tabela:**
   ```sh
   node $SKILL/scripts/recomendar-estilo.mjs --objetivo novidade --canal reels --produto jovem --itens 5 --nome "Produto" [--caixa-de-texto]
   ```
   Ela devolve o recomendado com o porquê, mais três que também servem, cada um com o vídeo de exemplo, e o
   tom para aquele tipo de produto. O `--nome` lê o histórico do produto: **capítulos com índice nunca é
   recomendado duas vezes seguidas para o mesmo produto.** A tabela é o ponto de partida: se a leitura mostrar
   algo que ela não sabe (o produto não tem tela, o dono já recusou um estilo), mude e diga por quê.
3. **Diga o recomendado e o porquê em uma linha:** "Recomendo **Lista que corre**: são cinco novidades para
   Reels e o público é jovem; uma por segundo, com a prova na tela."
4. **Pergunte qual estilo** com `AskUserQuestion`: o recomendado primeiro, com "(Recomendado)", e mais dois ou
   três que também servem. Cada opção traz uma frase do que é e o caminho do vídeo de exemplo
   (`moldes/<id>/exemplo/`); abra os exemplos para o usuário (`open`, `start ""` ou `xdg-open`). Se ele não
   escolher, ou não houver como perguntar, siga com o recomendado e diga isso numa linha.
5. **Leia a ficha** (`references/catalogo/estilos/<id>.md`) e o `MOLDE.md` do molde escolhido (nos capítulos,
   `references/capitulos.md` inteiro) antes do briefing: o briefing pergunta o que o molde precisa (as telas, o
   número, o texto digitado, o antes e o depois).
6. **Pediram uma ideia** (gancho, virada, piada) ou um estilo que ainda não tem molde? Procure em
   `references/catalogo/sem-molde.md`. Pode sugerir como ideia de roteiro, mas avise que o vídeo sai **no molde
   mais próximo**, o que a própria linha diz.
7. **Ao entregar,** registre: `node $SKILL/scripts/recomendar-estilo.mjs registrar --nome "Produto" --estilo <id> --video <pasta>`.

Tela real encolhida numa moldura, com a legenda da fala embaixo, foi recusada em todo vídeo que a usou: nenhum
estilo faz isso (`references/catalogo/regras.md`, regra 2).

## Sete regras a mais, sem exceção

1. **Nenhum caractere gasto sem o roteiro de locução aprovado.** O usuário aprova o texto numa
   tabela (passo 2). O `gerar` mostra o custo antes de chamar e, acima do teto, para e pede `--sim`.
2. **Voz de pessoa real, só com autorização escrita dela,** guardada na pasta do vídeo ou da série.
   - Sem o documento, recuse o clone, mesmo que o pedido venha da própria pessoa: o documento precisa
     existir na pasta.
   - Voice Design "parecida com fulano" também é clone: recuse.
   - Voz sintética nunca se apresenta como pessoa real.
3. **A chave nunca passa por uma conversa.** Cada pessoa usa a própria chave da ElevenLabs, que vem
   de `ELEVENLABS_API_KEY` ou de `~/.claude/secrets/elevenlabs.env` (no Windows,
   `%USERPROFILE%\.claude\secrets\elevenlabs.env`).
   - Se faltar, o script mostra um comando para Mac e outro para Windows, que pedem a chave sem
     mostrar na tela.
   - Passe o comando ao usuário para ele rodar **no terminal dele**, não na conversa.
   - Você nunca pede, nunca imprime, nunca copia a chave.
4. **Você não ouve.** O que se mede, mede-se. O que só o ouvido julga (a voz combina com a marca? a
   entonação? tem respiração ou estalo estranho?) vai para o usuário com todas as letras.
5. **Nenhum nome sem dicionário e transcrição.** Antes de gerar, toda palavra de risco (produto, nome
   próprio, termo em inglês, sigla) tem grafia decidida no mapa `pronuncia`. Depois de gerar,
   `voz.mjs ouvir` transcreve cada fala; palavra de risco que a transcrição não ouviu não vai para a
   montagem (`references/capitulos.md` §10). Número por extenso ("doze") bate com o algarismo da transcrição
   ("12"), e endereço (`marca.com/7`) aceita uma letra de diferença.
6. **Nenhuma tela encolhida.** A interface que aparece pequena demais para ler é redesenhada, grande, só
   com o que importa. A tela real entra só como prova, em tela cheia e com zoom no detalhe. Nenhuma
   gravação em conta real conta visita, clique ou aparelho: as chamadas de métrica são interceptadas.
7. **Nenhuma entrega sem a folha de quadros de cada formato,** olhada: nada vazio, nada ilegível, nada
   cortado no vertical (`references/capitulos.md` §12; cada molde gera a sua folha). O ✓ de um script não
   substitui olhar.

O script é `node $SKILL/scripts/voz.mjs <comando>`: Node 18 ou mais novo, sem dependência, com o
ffmpeg que o motor já pede.

## O que a voz acrescenta ao fluxo

### 1 · Voz no reconhecimento e no briefing (passos 0.1 e 1 do fluxo)

- **No reconhecimento,** rode `voz.mjs conta`. Ele mostra o plano, os créditos usados e o limite.
  No plano grátis, ele diz o que muda, e você diz ao usuário antes de seguir:
  - sem uso comercial;
  - atribuição obrigatória à ElevenLabs onde o vídeo for publicado;
  - sem as vozes da biblioteca pela API: a escolha fica entre as vozes padrão da conta.

  Dá para seguir assim. Para uso comercial, um plano pago.
- **No briefing,** a voz já está decidida (é esta skill), e a legenda é a própria fala. As perguntas
  que a voz traz:
  - o idioma e o sotaque, se a leitura não disse;
  - o **ritmo** (passo 4), que sai de onde o vídeo passa: central de ajuda ou dentro do app →
    `calmo`; Reels, TikTok, Shorts, propaganda → `reels`;
  - nos capítulos, **os dois formatos** (16:9 e 9:16) são o padrão: pergunte só se o usuário quer menos;
  - nos capítulos, **a conta de exemplo**: de quem são o nome, a foto e os números que aparecem (autorizada,
    nunca inventada).
- **A voz não se pergunta no escuro.** Quem fala (gênero, idade, energia) sai da leitura (§2 e §3) e
  vira três candidatas no passo 3.

### 2 · Roteiro de locução (depois do roteiro do vídeo)

Eu escrevo a partir da leitura e do roteiro. As regras e o formato estão em
`references/voz-locucao.md`:

- **capítulos:** abertura, uma fala por capítulo (`{ "capitulo": n }`, 2 a 4 frases curtas de propaganda,
  6 a 10 s) e fecho; a fala diz o que se ganha, não lê a tela (`references/capitulos.md` §9);
- **tutorial:** uma frase por passo, dita antes da mão; a abertura é o título, o fechamento as `fimLinhas`;
  o nome do botão como está na tela;
- **nos seis moldes de `moldes/`:** o `MOLDE.md` diz quantas falas, de quanto tempo e onde cada uma entra
  (`onde`); a voz fala metade do tempo, não o vídeo inteiro (`references/catalogo/regras.md`, regra 8);
- em todos: o **dicionário de pronúncia** do vídeo inteiro, decidido antes de gastar
  (`references/capitulos.md` §10).

O usuário aprova numa tabela com:

- o que se vê;
- o que a voz diz;
- os segundos estimados;
- as palavras de risco, com a grafia proposta.

Só depois se gasta.

### 3 · Voz por vídeo

Cada vídeo pode ter a voz dele. O caminho completo está em `references/voz-escolha.md`:

1. `voz.mjs buscar`, com os filtros tirados da leitura: idioma, sotaque, gênero, idade, energia e
   uso. O script já tira as vozes que não servem num vídeo:
   - com aviso prévio menor que 180 dias, ou sem aviso nenhum;
   - com tarifa especial;
   - com moderação ao vivo;
   - de famoso.
2. Escolha **três candidatas** diferentes entre si, cada uma com o porquê apontando para a leitura.
3. `voz.mjs amostras --roteiro <roteiro.json> --vozes a,b,c`: as três leem **a primeira frase real**
   do roteiro, no ritmo escolhido. A tabela diz também quanto cada uma demora.
4. Abra os arquivos para o usuário (`open`, `start ""` ou `xdg-open`) e pergunte com
   `AskUserQuestion`: as três vozes, com a recomendada primeiro.
5. Nenhuma serve? Plano B: Voice Design, uma voz descrita em texto (`references/voz-escolha.md` §6).
6. Clone, só com a autorização escrita (regra 2 e `references/voz-escolha.md` §7).

Numa série, ofereça a voz do vídeo anterior como primeira opção. A escolha continua sendo do
vídeo.

### 4 · Ritmo do vídeo

| Perfil | Quando | `speed` | `stability` | O mix |
|---|---|---|---|---|
| `calmo` | tutorial, ajuda: quem assiste imita o passo | ~0,92–0,97 | ~0,55–0,60 | a trilha cede 11 dB na fala |
| `reels` | rede social, peça curta, energia | ~1,05–1,12 | ~0,40–0,45 | a trilha cede 9 dB na fala |

O mesmo nome vai no `roteiro.json` (`perfil`) e no `video.mjs` (`video.voz.perfil`): a velocidade
da voz e o perfil do mix mudam juntos.

### 5 · Gerar

```sh
node $SKILL/scripts/voz.mjs gerar <pasta do vídeo>/voz/<versao>/roteiro.json --saida <pasta do vídeo>/voz/<versao>
```

- **Uma requisição por fala,** com as falas vizinhas como contexto, para a entonação emendar.
- **Escreve** o `locucao.json` e o `falas/*.wav` (48 kHz, mono) que o motor lê.
- **Antes de chamar,** mostra os caracteres que ainda não estão no cache e o saldo. Acima do teto
  (1500, ou `--teto`), para e pede `--sim`.
- **O cache é o take aprovado,** não economia: a mesma frase nunca sai igual duas vezes. Rodar de
  novo não chama a API. `--refazer <id>` pede outro take de uma fala e guarda o antigo.
- **Avisa se a voz vai sair da biblioteca,** e em que data.

Logo depois de gerar, antes de montar qualquer coisa:

```sh
node $SKILL/scripts/voz.mjs ouvir <pasta do vídeo>/voz/<versao>/locucao.json --palavras "Nome,Sigla,Termo"
```

Ele transcreve cada fala (speech-to-text da ElevenLabs, sem keyterms) e sai com código 1 se uma palavra de
risco não foi ouvida. Ajuste o mapa `pronuncia` e `gerar --refazer <id>` até passar; o resultado fica em
`ouvido.md`.

Celular e computador têm cada um o seu roteiro ("Toque em" não é "Clique em"). As falas iguais
(abertura, fechamento) saem do mesmo take.

### 6 · Montar

**Os seis moldes de `moldes/`** (tela real com câmera, texto que se digita, lista que corre, número que conta,
antes e depois, teaser de luz): o `moldes/<id>/MOLDE.md` diz tudo — parâmetros, o comando que renderiza, onde a
voz entra, as variações e os limites. Comece copiando o `exemplo.json` do molde e trocando cores, fontes, logo,
textos, telas e números pelos da leitura; nada de marca está embutido no molde. Rascunho primeiro, folha olhada,
depois o final. Requisitos que valem para todos:

- Playwright: `scripts/playwright.cjs` acha sozinho; se não achar, `PLAYWRIGHT_PATH=<pasta>/node_modules/playwright`.
- Trilha: Python com numpy e scipy, num venv do projeto do vídeo (`FAZERVIDEO_PY` ou `PYTHON`, como o molde disser).
- Rascunho: 30 fps sem motion blur, segundos; final: 60 fps com subquadros, minutos por formato.

**Capítulos** (`references/capitulos.md` §11 e `assets/capitulos/LEIA.md`):

```sh
node $SKILL/scripts/capitulos/novo.mjs <pasta do vídeo> --fontes "Título,Texto,Mono"
node $SKILL/scripts/capitulos/render.mjs <pasta do vídeo> 01-exemplo --modo rascunho
node $SKILL/scripts/capitulos/montar.mjs <pasta do vídeo> --locucao voz/<versao>/locucao.json --perfil reels
```

Troque tokens, fontes, logo e índice pela leitura e faça **um capítulo inteiro** nos dois formatos, olhado
na folha, antes dos outros. Depois, os capítulos em paralelo (subagentes, um por capítulo ou grupo, cada um
com a sua pasta `cenas/NN-nome/` e a ordem de não mexer no molde). A duração de cada capítulo sai da fala
medida: `max(5, 1,4 + fala + 0,8)` s. O `montar.mjs` põe a voz no lugar e escreve a folha da trilha
(`references/voz-mix.md` §2); depois, a trilha e o `finalizar.mjs` de cada formato.

**Tutorial** (passos 3 e 4 do fluxo): no `video.mjs`, acrescente:

```js
voz: { locucao: 'voz/{versao}/locucao.json', perfil: 'calmo' },   // ou 'reels'
```

O resto é o modo tutorial do fluxo (`references/tutorial.md`), e o que muda com a voz está em
`references/voz-tutorial.md`:

- o gravador segura cada passo pelo tempo da fala, e a ação começa 0,3 s antes do fim da frase;
- a legenda de cada passo vira o texto da fala, com a palavra falada em destaque na cor de acento
  da marca;
- a abertura e o fechamento crescem quando a fala precisa.

Um `g.passo('…')` que diga outra coisa gera aviso, e a fala vence. Abertura diferente do título,
ou fechamento diferente das `fimLinhas`, é erro: acerte o roteiro, não o vídeo.

A trilha abaixa antes da fala, fica embaixo enquanto a voz fala e sobe nas pausas. O mix e as
medidas estão em `references/voz-mix.md`.

### 7 · Provar

Antes de mostrar o rascunho, além das folhas que o fluxo manda olhar:

1. `voz.mjs validar <…/locucao.json>`: o contrato da locução, sem rede.
2. `voz.mjs ouvir <…/locucao.json> --palavras "…"`: a transcrição de cada fala traz todas as palavras de
   risco. Código 1 = não se monta.
3. **Só no tutorial,** `voz.mjs conferir <…/locucao.json>`: alinhamento forçado na ElevenLabs.
   - Cada palavra começa a ±80 ms de onde a legenda acende; a primeira é julgada contra o primeiro
     som medido.
   - Sai com código 1 se falhar, e aí não se entrega.
   - Custa pouco, cobrado pela duração do áudio, não por caractere.
4. As medidas do mix (`references/voz-mix.md`):
   - a voz pelo menos 12 dB acima da trilha em cada fala, também no filtro de alto-falante de
     celular;
   - −14 LUFS e teto de −1 dBTP;
   - a sincronia a ±1 quadro depois do AAC.
5. **A folha, olhada:**
   - capítulos: a folha de quadros de **cada formato** (`references/capitulos.md` §12): nada vazio, nada
     ilegível, nada cortado no vertical, a mesma composição em todo capítulo, o índice completo;
   - tutorial: a folha de eventos, e a palavra em destaque é a que está sendo dita.
6. No relatório, a lista do que ninguém ouviu:
   - se a voz combina com a marca;
   - a pronúncia de cada palavra de risco (a transcrição pegou a palavra, não o sotaque);
   - a entonação das perguntas e das pausas;
   - respiração, estalo ou chiado;
   - se a trilha agrada debaixo da voz.

### 8 · Idiomas

- **Outro idioma é outro vídeo:** outro `video.mjs` ou outro molde (título, `fimLinhas`, os títulos de capítulo, o `passo` da série no
  idioma), outro roteiro e outra aprovação.
- **O roteiro se reescreve, não se traduz palavra por palavra:** o tempo muda, os botões têm outro
  nome, e o que é palavra de risco também muda.
- **A voz é nativa daquele idioma e sotaque.** O `buscar` mostra os idiomas verificados de cada voz.
  Uma voz brasileira lendo inglês soa como brasileiro lendo inglês.
- **O modelo padrão** (`eleven_multilingual_v2`) fala 29 idiomas. Confira o idioma antes de
  prometer.

## Arquivos da voz

| Arquivo | Quando usar |
|---|---|
| `references/fluxo.md` | **sempre, primeiro**: o fluxo inteiro do vídeo |
| `scripts/voz.mjs conta` | no reconhecimento: plano, créditos usados, limite, e o que muda no plano grátis |
| `scripts/voz.mjs buscar` | escolher as candidatas na biblioteca, com os filtros da leitura (`--padrao`: as vozes padrão da conta) |
| `scripts/voz.mjs amostras` | a mesma frase lida por N vozes, para o usuário ouvir |
| `scripts/voz.mjs gerar` | a locução do vídeo: `locucao.json` + `falas/*.wav`, com cache e teto |
| `scripts/voz.mjs conferir` | provar que cada palavra está onde a legenda acende (±80 ms) |
| `scripts/voz.mjs ouvir` | transcrever cada fala e conferir as palavras de risco (`ouvido.md`) |
| `references/catalogo/` | **antes do briefing**: as 12 regras, o guia de escolha, uma ficha por estilo e o que ainda não tem molde |
| `scripts/recomendar-estilo.mjs` | a tabela objetivo × canal × produto: o estilo recomendado, o porquê e as alternativas; `registrar` guarda o último estilo do produto |
| `moldes/<id>/` | os seis moldes novos, cada um com `MOLDE.md` (como renderizar), `exemplo.json` (Lumma One) e uma segunda marca, e `exemplo/` com o vídeo de exemplo |
| `references/capitulos.md` | **estilo capítulos com índice**: o vídeo em capítulos com a interface redesenhada, índice, 16:9 e 9:16, dicionário, folha de quadros |
| `assets/capitulos/` | o molde de exemplo do vídeo em capítulos (kit de componentes + abertura, capítulo e fecho), sem marca; `LEIA.md` diz como usar |
| `scripts/capitulos/` | `novo.mjs` (cria o projeto), `render.mjs` (capítulo nos dois formatos + folha), `montar.mjs` (junta, põe a voz, folha da trilha) |
| `scripts/voz.mjs validar` | provar o contrato da locução, sem rede |
| `references/voz-locucao.md` | **antes de gastar**: como escrever o roteiro, pronúncia, tabela de aprovação, `roteiro.json` |
| `references/voz-escolha.md` | escolher a voz: filtros, regras da biblioteca, ritmo, Voice Design, clone, idiomas, plano e custo |
| `references/voz-tutorial.md` | a voz no modo tutorial: tempos, legenda falada, saídas novas |
| `references/voz-mix.md` | o mix com voz e as medidas que o provam |
| `testes/` | `node --test "$SKILL/testes/*.test.mjs"`: os testes do `voz.mjs` e do `recomendar-estilo.mjs`, sem rede |
