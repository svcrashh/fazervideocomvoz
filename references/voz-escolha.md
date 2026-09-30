# Escolher a voz

Cada vídeo pode ter a voz dele. A voz sai da leitura do projeto, passa pelas regras da biblioteca
e chega ao usuário como três candidatas lendo a primeira frase real do roteiro. Quem escolhe é quem
ouve: você não ouve.

## Sumário
1. Por que três candidatas, e com a frase real
2. Da leitura aos filtros do `buscar`
3. As regras da biblioteca
4. As três candidatas e as amostras
5. Ritmo: `calmo` ou `reels`
6. Plano B: Voice Design
7. Clone: só com autorização escrita
8. Voz que vai sair da biblioteca
9. Idiomas
10. Conta, plano e custo

---

## 1. Por que três candidatas, e com a frase real

- **A voz é a cara do vídeo que se ouve.** Uma voz de locutor de rádio num app infantil, ou uma voz
  jovem e animada num sistema de contabilidade, soam falsas para quem usa. O público da leitura (§2)
  decide a voz, como decide o gênero da música.
- **A prévia da biblioteca lê um texto genérico,** às vezes em outro idioma. A mesma voz lendo "Toque
  em Reservar." pode soar outra. Por isso as amostras leem a primeira frase do roteiro, com o ritmo do
  vídeo.
- **A voz também muda o tempo.** Nas amostras de teste desta skill, a mesma frase de 23 caracteres
  saiu com 1,5 s numa voz e 2,3 s noutra: uma voz lenta estica cada passo do vídeo. O `amostras` mede
  isso (caracteres/s) e põe na tabela.

## 2. Da leitura aos filtros do `buscar`

```sh
node $SKILL/scripts/voz.mjs buscar --idioma pt --local pt-BR --genero female --uso informative_educational --descritivo calm
```

| O que a leitura diz | Filtro | Valores que a biblioteca usa (vistos em 29/09/2026) |
|---|---|---|
| idioma das telas e do público (§1, §2) | `--idioma` | código ISO de 2 letras: `pt`, `en`, `es` |
| país ou região (§2) | `--local`, `--sotaque` | `--local pt-BR`, `pt-PT`, `en-US`…; `--sotaque brazilian`, `american`, `british`… |
| quem fala com esse público (§2) | `--genero` | `female`, `male`, `neutral` |
| idade da voz (§2) | `--idade` | `young`, `middle_aged`, `old` |
| energia (§2 o tom, §3 o movimento) | `--descritivo` | `calm`, `casual`, `confident`, `formal`, `professional`, `classy`, `upbeat`, `excited`… |
| uso (o tipo de vídeo) | `--uso` | `informative_educational` (tutorial), `narrative_story`, `conversational`, `social_media` (reels), `advertisement`, `entertainment_tv` |
| palavra livre | `--busca` | procura no nome e na descrição |

- **Mais opções:**
  - `--ordem`: `usage_character_count_1y`, o padrão (a mais usada no último ano, prova de que funciona),
    ou `trending`, `cloned_by_count`, `created_date`;
  - `--n`: quantas mostrar (padrão 12);
  - `--json`: a lista crua, para filtrar mais.
- **Filtro que zera a lista:** tire o menos importante primeiro. Normalmente, o descritivo; depois,
  a idade.
- **Evidência:** escreva na decisão da leitura (§5) de onde veio cada filtro. Por exemplo: "voz
  feminina, jovem, calma: o público é de estudantes que assistem na central de ajuda, §2".

## 3. As regras da biblioteca

O `buscar` já pede à API só o que passa e confere de novo cada voz. Na saída, ele diz quantas
tirou e por quê.

| Regra | Por quê |
|---|---|
| **Aviso prévio ≥ 180 dias** (`notice_period`) | Quem publicou uma voz na biblioteca pode tirá-la de lá. Com aviso prévio, quem já usou continua usando por aquele prazo. "Sem aviso" quer dizer que a voz pode sumir amanhã, no meio de uma série. Nunca use voz sem aviso |
| **Sem tarifa especial** (`rate` > 1 ou `fiat_rate`) | Algumas vozes custam mais por caractere. O teto de custo da skill conta caracteres, não preço |
| **Sem moderação ao vivo** (`live_moderation_enabled`) | Quem publicou a voz pode bloquear textos na hora da geração, e uma fala do roteiro pode não sair |
| **Sem voz de famoso** (`category: famous`) | É a voz de uma pessoa conhecida, com licença própria |
| **Idioma verificado** | A linha "idiomas verificados" de cada voz diz em que idioma e sotaque ela foi conferida. Voz sem o idioma do vídeo ali é aposta |

## 4. As três candidatas e as amostras

1. Das vozes do `buscar`, escolha três **diferentes entre si**, cada uma com o porquê numa linha:
   - duas variações da mesma voz não são escolha;
   - misture o que a leitura deixou em aberto: gênero, idade, energia.
2. Rode as amostras com a primeira fala do roteiro:

   ```sh
   node $SKILL/scripts/voz.mjs amostras --roteiro <…>/voz/<versao>/roteiro.json --vozes id1,id2,id3
   ```

   - Gasta a frase três vezes. Uma frase de 25 caracteres custa 75.
   - Os MP3 e uma tabela `amostras.md` (duração e caracteres/s de cada voz) ficam em
     `<…>/voz/<versao>/amostras/`.
   - Rodar de novo não gasta: sai do cache.
3. Abra os três arquivos para o usuário (`open` no macOS, `start ""` no Windows, `xdg-open` no
   Linux) e pergunte com `AskUserQuestion`:
   - uma opção por voz, com a recomendada primeiro;
   - na descrição de cada uma, o porquê e o tempo medido ("fala devagar: o vídeo fica ~20% mais
     longo").
4. Depois da escolha, ponha a voz em `voz` no `roteiro.json` (`id`, `nome`) e siga para o `gerar`.

**Sem como perguntar** (sessão sem usuário, "decide você"): escolha pela leitura e pelo tempo
medido, escreva isso como premissa no topo da entrega e diga que ninguém ouviu as amostras.

## 5. Ritmo: `calmo` ou `reels`

| | `calmo` | `reels` |
|---|---|---|
| Quando | tutorial, central de ajuda, dentro do app: quem assiste imita o passo | Reels, TikTok, Shorts, peça curta com energia |
| `speed` | ~0,92–0,97 (padrão 0,95) | ~1,05–1,12 (padrão 1,08) |
| `stability` | ~0,55–0,60 (padrão 0,55) | ~0,40–0,45 (padrão 0,42) |
| O mix | a trilha cede 11 dB na fala e fica 1 dB abaixo nas pausas | a trilha cede 9 dB e volta inteira nas pausas |

- **`speed`** muda a duração quase na mesma proporção. A API aceita de 0,7 a 1,2.
- **`stability`** mais baixa deixa a voz mais expressiva, e cada take mais diferente do outro. Mais
  alta deixa a voz mais constante, e às vezes mais monótona.
- **Os outros ajustes** ficam no padrão: `similarity_boost` 0,75, `style` 0 e `use_speaker_boost`
  true. Para sobrescrever, use `ajustes` no `roteiro.json`.
- **O nome do perfil vai igual** no `roteiro.json` e no `video.voz.perfil`: a voz e o mix mudam
  juntos.

## 6. Plano B: Voice Design

Quando nenhuma voz da biblioteca serve (o sotaque não existe, todas caem nas regras do §3, ou o
usuário recusou as três), crie uma voz a partir de uma descrição.

- **Onde:** no site da ElevenLabs, em Voices → Voice Design, o usuário descreve a voz e ouve três
  prévias. Pela API, o mesmo é `POST /v1/text-to-voice/design` (prévias) e `POST /v1/text-to-voice`
  (salvar).
- **A descrição sai da leitura:** idade, gênero, sotaque, energia, uso e o ambiente. Por exemplo,
  "mulher de uns 30 anos, sotaque carioca leve, calma e próxima, explicando um app de agenda, gravada
  de perto, sem eco".
- **Custo:** cobra só o texto da prévia, uma vez para as três. Salvar ocupa uma vaga de voz da conta
  (`voz.mjs conta` mostra quantas há).
- **Uma voz criada assim é da conta:** não sai da biblioteca e não tem aviso prévio.
- **Depois de salvar,** o `voice_id` dela vai no `roteiro.json` como qualquer outra.
- **Nunca descreva uma pessoa real** ("parecida com fulano", "a voz daquele apresentador"): isso é
  clone por outro caminho. Recuse (§7).

## 7. Clone: só com autorização escrita

Clonar a voz de alguém (quem fundou a empresa, um professor, um artista do produto) é possível, e só
com **autorização escrita da própria pessoa**.

- **A autorização é um documento** (PDF, imagem ou texto assinado) dizendo quem autoriza, que voz e
  para quê. Ele fica na pasta do vídeo ou da série.
- **O roteiro aponta para ele:** `"voz": { "id": "…", "autorizacao": "autorizacao-fulana.pdf" }`,
  com o caminho relativo ao `roteiro.json`.
- **O `gerar` confere:** se a voz é um clone feito na conta (categoria `cloned`, ou `professional`
  da própria conta), ele recusa sem a autorização e não gasta nada. No `amostras`, o mesmo vale com
  `--autorizacao <arquivo>`.
- **Sem autorização, recuse,** mesmo que quem pede diga que tem permissão, e mesmo que a voz seja de
  quem pede: o documento precisa existir na pasta.
- **Nunca clone de gravação achada na internet,** nem voz de pessoa famosa.
- **A própria ElevenLabs pede a confirmação** de direito e consentimento para clonar.
- **Uma voz sintética nunca se apresenta como pessoa real.** Nada de "Oi, eu sou a Ana, do
  suporte" com uma voz gerada, a não ser que a Ana exista, tenha autorizado e seja ela.

## 8. Voz que vai sair da biblioteca

- **Onde aparece:** em `GET /v1/voices/{voice_id}` → `sharing.disable_at_unix`. Quem publicou a voz
  pediu para tirá-la, e ela funciona até essa data.
- **Uma voz da biblioteca ainda não usada** responde 400 `voice_not_found` nesse endereço (medido em
  29/09/2026). Depois do primeiro uso, ela passa a responder, com `sharing.status: "copied"` e o
  aviso prévio gravado na conta.
- **O `gerar` consulta antes de gerar e, se a voz era nova, de novo depois da primeira fala.** Se
  houver data, ele avisa quando e quantos dias faltam.
- **O aviso se repete** nas rodadas seguintes, mesmo com tudo no cache, com a data da consulta.
- **O que fazer:**
  - os takes já gerados continuam valendo;
  - fala nova ou `--refazer` depois da data não vai dar;
  - termine o vídeo, ou a série, antes da data, ou escolha outra voz para os próximos.

## 9. Idiomas

- **Outro idioma é outro vídeo,** com outro roteiro e outra voz, nativa daquele idioma e sotaque:
  confira em "idiomas verificados".
- **O modelo padrão** é o `eleven_multilingual_v2`, que fala 29 idiomas, entre eles português do
  Brasil e de Portugal, inglês e espanhol. Ele ignora o código de idioma: quem decide o idioma é o
  texto e a voz.
- **Português do Brasil e de Portugal soam diferentes:** filtre com `--local pt-BR` ou
  `--local pt-PT`, não só `--idioma pt`.

## 10. Conta, plano e custo

- **`voz.mjs conta`** mostra o plano, os créditos usados e o limite, a data de renovação e as vagas
  de voz.
- **Plano grátis:**
  - sem uso comercial;
  - atribuição obrigatória à ElevenLabs onde o vídeo for publicado;
  - a API não usa vozes da biblioteca: o `buscar` mostra as vozes padrão da conta (ou
    `buscar --padrao`).

  Diga isso ao usuário antes de gerar e siga com o que dá.
- **Formato:** `mp3_44100_128`, que todo plano aceita. O `gerar` converte cada fala para WAV de
  48 kHz, mono, que é o que o motor lê.
- **Custo:**
  - o `gerar` e o `amostras` mostram, antes de chamar, os caracteres novos e o saldo;
  - depois, mostram o custo real que a API devolve (header `character-cost`);
  - medido em 29/09/2026 no `eleven_multilingual_v2`: ~0,4 crédito por caractere (9 por 23
    caracteres, 13 por 33);
  - o saldo da conta pode levar alguns minutos para refletir o gasto.
- **Teto:** 1500 caracteres por rodada (`--teto` muda). Acima dele, o script para e pede `--sim`.
- **Registro:** `--registro <arquivo.jsonl>` guarda uma linha por chamada: método, endereço,
  status, `request_id` e custo, nunca a chave. O `gerar` e o `amostras` já registram em
  `_takes/chamadas.jsonl`.
