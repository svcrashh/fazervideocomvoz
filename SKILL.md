---
name: fazervideocomvoz
description: Faz vídeos de produto com VOZ EM OFF gerada pela ElevenLabs — uma narração falando por cima das telas reais do app (tutorial passo a passo, demo, update "o que mudou"), sem avatar nem rosto. Roteiro de locução aprovado antes de gastar crédito, voz escolhida por vídeo (três candidatas lendo a frase real do roteiro), ritmo calmo ou reels, legenda igual à fala com a palavra falada em destaque, trilha original que abaixa quando a voz fala, e prova de sincronia. Traz dentro o motor da /fazervideo (gravação da tela real, composição, trilha, entrega) e acrescenta a camada de voz. Use quando o pedido tiver voz — /fazervideocomvoz, "vídeo com voz", "com narração", "narrado", "locução", "locutor", "locutora", "voz em off", "voiceover", "uma voz explicando", "tutorial falado", "põe uma voz no vídeo". Pedido de vídeo sem voz é da /fazervideo.
---

# /fazervideocomvoz

Esta skill faz o vídeo de produto da `/fazervideo`, com o mesmo motor e o mesmo cuidado, e
acrescenta **uma voz em off** gerada pela ElevenLabs sobre as telas gravadas. Ninguém aparece: sem
avatar, sem rosto, sem boca sincronizada.

`$SKILL` é a pasta desta skill, que aparece no topo quando ela carrega. O motor inteiro mora aqui
dentro, nos caminhos de sempre: `scripts/`, `assets/`, `references/`.

**Antes de qualquer coisa, leia inteiro `$SKILL/references/fluxo.md` e siga-o.** É o fluxo completo
do vídeo: as três regras sem exceção, a leitura do projeto, a triagem, o briefing, a série, a
prancha, a trilha e a entrega. Ele vale aqui sem mudar nada. Esta página diz só o que a voz
acrescenta, e em que ponto do fluxo.

Pedido sem voz nenhuma: se a `/fazervideo` estiver instalada, ele é dela. Se não estiver, siga
`references/fluxo.md` e pule tudo o que está abaixo.

## Onde a voz funciona hoje

- **Modo tutorial** (tela real): tutorial, demo e update gravados pelo motor de captura. A voz manda
  no tempo, e a legenda é a fala.
- **Motion** (`cenas.js`): ainda não. A trilha já mistura uma voz se a folha tiver `voz`, mas o tempo
  de cena guiado pela voz e a legenda falada ainda não existem. Diga isso e ofereça o tutorial com
  voz ou o motion sem voz.

## Quatro regras a mais, sem exceção

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
   palavra de risco saiu certa? tem respiração ou estalo estranho?) vai para o usuário com todas as
   letras.

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
    `calmo`; Reels, TikTok, Shorts → `reels`.
- **A voz não se pergunta no escuro.** Quem fala (gênero, idade, energia) sai da leitura (§2 e §3) e
  vira três candidatas no passo 3.

### 2 · Roteiro de locução (depois do roteiro passo a passo do fluxo)

Eu escrevo a partir da leitura e dos passos. As regras e o formato estão em
`references/voz-locucao.md`:

- uma frase por passo, dita antes da mão;
- a abertura é o título; o fechamento, as `fimLinhas`;
- o nome do botão como está na tela;
- a pronúncia das palavras de risco resolvida sem mudar a legenda.

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

Celular e computador têm cada um o seu roteiro ("Toque em" não é "Clique em"). As falas iguais
(abertura, fechamento) saem do mesmo take.

### 6 · Gravar e compor (passos 3 e 4 do fluxo)

No `video.mjs`, acrescente:

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
2. `voz.mjs conferir <…/locucao.json>`: alinhamento forçado na ElevenLabs.
   - Cada palavra começa a ±80 ms de onde a legenda acende; a primeira é julgada contra o primeiro
     som medido.
   - Sai com código 1 se falhar, e aí não se entrega.
   - Custa pouco, cobrado pela duração do áudio, não por caractere.
3. As medidas do mix (`references/voz-mix.md`):
   - a voz pelo menos 12 dB acima da trilha em cada fala, também no filtro de alto-falante de
     celular;
   - −14 LUFS e teto de −1 dBTP;
   - a sincronia a ±1 quadro depois do AAC.
4. **A folha de eventos, olhada:** a palavra em destaque é a que está sendo dita.
5. No relatório, a lista do que ninguém ouviu:
   - se a voz combina com a marca;
   - a pronúncia de cada palavra de risco;
   - a entonação das perguntas e das pausas;
   - respiração, estalo ou chiado;
   - se a trilha agrada debaixo da voz.

### 8 · Idiomas

- **Outro idioma é outro vídeo:** outro `video.mjs` (título, `fimLinhas`, o `passo` da série no
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
| `scripts/voz.mjs validar` | provar o contrato da locução, sem rede |
| `references/voz-locucao.md` | **antes de gastar**: como escrever o roteiro, pronúncia, tabela de aprovação, `roteiro.json` |
| `references/voz-escolha.md` | escolher a voz: filtros, regras da biblioteca, ritmo, Voice Design, clone, idiomas, plano e custo |
| `references/voz-tutorial.md` | a voz no modo tutorial: tempos, legenda falada, saídas novas |
| `references/voz-mix.md` | o mix com voz e as medidas que o provam |
| `testes/` | `node --test "$SKILL/testes/*.test.mjs"`: os testes do `voz.mjs`, sem rede |
