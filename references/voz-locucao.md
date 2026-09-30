# Roteiro de locução

O roteiro de locução é o que a voz vai dizer, fala por fala. Eu escrevo, o usuário aprova numa tabela
e só depois se gasta crédito. Ele mora em `<pasta do vídeo>/voz/<versao>/roteiro.json`, ao lado do
`locucao.json` que o `voz.mjs gerar` escreve.

## Sumário
1. Por que o roteiro vem antes da voz
2. De onde ele sai
3. Como escrever cada fala
4. Palavras de risco e pronúncia
5. A tabela de aprovação
6. O `roteiro.json`
7. Mudou uma frase: o que se regera
8. Três exemplos (inventados, de produtos diferentes)

---

## 1. Por que o roteiro vem antes da voz

- **A voz manda no tempo.** O gravador segura cada passo pelo tempo da fala. Uma frase de 4 s num
  passo de 1 s estica o vídeo em 3 s. Quem decide a duração do vídeo com voz é o roteiro, não a
  gravação.
- **A legenda é a fala.** O que a voz diz aparece escrito, frase a frase, com a palavra falada em
  destaque. Não existe uma legenda "resumida" e uma fala "completa": é o mesmo texto.
- **Cada caractere custa, e cada take é único.** A mesma frase nunca sai igual duas vezes (medido em
  29/09/2026: com o mesmo `seed`, os tempos repetem e o som muda). O take gerado vira o take do vídeo.
  Refazer é pedir outro take, não "o mesmo de novo". Por isso o texto se aprova antes.

## 2. De onde ele sai

- **Da leitura** (`leitura.md` da /fazervideo):
  - §1, as palavras que o público usa. É "fechar o caixa", não "conciliar recebíveis".
  - §2, o registro: você ou tu, formal ou próximo, e o que o público acharia falso.
- **Do roteiro do vídeo.** No tutorial, cada `g.passo('…')` com fala vira uma fala `{ "passo": n }`,
  na ordem dos passos, começando em 1.
- **A abertura** diz exatamente o título do vídeo (`video.titulo`). O gravador compara sem caixa e
  sem pontuação, e recusa se for outra coisa.
- **O fechamento** diz exatamente as `fimLinhas` da série, juntas, com a mesma comparação.
- Abertura e fechamento são opcionais. Um passo pode ficar sem fala quando a imagem basta, como uma
  espera de carregamento.

## 3. Como escrever cada fala

- **Uma frase por passo, dita antes da mão.** O gravador começa a ação 0,3 s antes do fim da frase:
  primeiro a voz diz, depois o dedo faz. A frase fala da ação daquele passo, e de nenhuma outra.
- **O nome do botão exatamente como está na tela,** com a mesma caixa: "Toque em Nova reserva."
  Quem assiste procura aquela palavra na tela.
- **Imperativo e curto:** "Escolha o horário." em vez de "Agora você vai escolher o horário que
  preferir."
- **Tempo:** numa locução de teste (voz calma, `speed` 0,95, 7 falas curtas de tutorial, medida em
  29/09/2026), a fala saiu a **2,3 palavras/s, ou 11,8 caracteres/s** contando os espaços. No ritmo
  `reels` (`speed` ~1,08), estime ~13,5 caracteres/s: é uma conta proporcional, ainda não medida.
  - A voz muda essa conta: a mesma frase variou de 9,9 a 16,3 caracteres/s entre três vozes. Depois
    das amostras, refaça a estimativa com o número da voz escolhida (`amostras.md`).
  - Um passo dura pelo menos 3 s (`leituraMin`), com ou sem voz.
  - Uma fala acima de ~4 s (uns 45 caracteres) estica o passo. Corte palavras ou divida o passo.
- **Pontuação é pausa:**
  - vírgula, pausa curta; ponto e dois-pontos, pausa;
  - nada de parênteses, barras, "etc.", emoji ou abreviação ("por exemplo", nunca "ex.").
- **A legenda precisa caber.** A frase passa pela checagem de colisão e de área segura como qualquer
  legenda. Frase longa em 9:16 quebra em três linhas e pode cobrir a tela.
- **Não invente:** nem número, nem prazo, nem promessa ("em segundos", "grátis") que o produto não
  garante.
- **Abertura e fechamento com voz são curtos.** A abertura dura `max(abertura da série, 0,3 + fala +
  0,4)` e o fechamento, `max(fechamento da série, 0,25 + fala + 1,5)`. Um título longo falado
  empurra a tela para depois.

## 4. Palavras de risco e pronúncia

**Palavra de risco** é a que a voz pode ler errado:

- nome de produto e de marca;
- sigla;
- termo em inglês numa fala em português;
- número com unidade, hora, data, moeda;
- endereço, e-mail, código.

Cada uma entra na tabela de aprovação com a grafia proposta.

**Como se resolve sem quebrar a legenda.** A legenda mostra o `texto` do roteiro. A voz recebe o
mesmo texto com as trocas do mapa `pronuncia`, e o `voz.mjs` devolve as palavras do `locucao.json`
com o texto da legenda.

- **Exemplo:** o `texto` "Exporte o PDF no Vyrta." com `"pronuncia": { "PDF": "pê dê efe", "Vyrta": "Vírta" }`.
- A voz recebe "Exporte o pê dê efe no Vírta.".
- A legenda continua "Exporte o PDF no Vyrta.". A palavra "PDF." fica em destaque do início de "pê"
  ao fim de "efe.".

Regras do mapa:

- **A chave é a palavra como está no `texto`,** sem a pontuação em volta, e com a mesma caixa:
  `"PDF"` não troca "pdf".
- **Uma palavra por chave.** Para uma expressão, ponha uma chave para cada palavra que precisa de
  troca.
- **O valor é a escrita que faz a voz acertar:** grafia fonética do idioma ("déchbórd", "Vírta",
  "catorze e trinta"). Pode ter várias palavras.
- **O mapa vale para o roteiro inteiro.** Uma fala pode ter o próprio `pronuncia`, que vence o
  geral naquela fala.
- **O `locucao.json` guarda o que foi dito** em `dito`, só nas palavras trocadas
  (`{ "texto": "PDF.", "ini": …, "fim": …, "dito": "pê dê efe." }`). O `conferir` alinha o áudio
  contra o texto dito.
- **Dúvida numa palavra?** Gere só aquela frase com `voz.mjs amostras`, com a voz escolhida, antes
  de gerar tudo. O usuário ouve, e custa uma frase.

## 5. A tabela de aprovação

Mostre ao usuário antes de gastar. Uma linha por fala:

| # | Onde | O que se vê | O que a voz diz (= legenda) | s | Palavras de risco → como a voz lê |
|---|---|---|---|---|---|
| 0 | abertura | título sobre o fundo da série | Reservar uma bicicleta. | 2,0 | — |
| 1 | passo 1 | mapa com as estações | Abra o Vyrta e toque em Reservar. | 2,8 | Vyrta → "Vírta" |
| 2 | passo 2 | lista de bicicletas | Escolha uma bicicleta livre. | 2,4 | — |
| 3 | fechamento | logo parado | Pronto. Boa pedalada. | 1,8 | — |

- **s** é a estimativa pelo §3: caracteres ÷ 11,8 no calmo, ÷ 13,5 no reels.
- Embaixo da tabela, uma linha com o total de caracteres (é o que se gasta) e a voz e o ritmo
  propostos.
- Pergunte com `AskUserQuestion`: "Aprovar e gerar", "Trocar frases", "Mudar a pronúncia", ou
  texto livre.

## 6. O `roteiro.json`

```json
{
  "idioma": "pt-BR",
  "perfil": "calmo",
  "voz": { "id": "<voice_id da voz escolhida>", "nome": "<nome dela>", "modelo": "eleven_multilingual_v2" },
  "ajustes": { "speed": 0.95 },
  "pronuncia": { "Vyrta": "Vírta" },
  "falas": [
    { "id": "abertura",   "onde": "abertura",      "texto": "Reservar uma bicicleta." },
    { "id": "p1",         "onde": { "passo": 1 },  "texto": "Abra o Vyrta e toque em Reservar." },
    { "id": "p2",         "onde": { "passo": 2 },  "texto": "Escolha uma bicicleta livre." },
    { "id": "fechamento", "onde": "fechamento",    "texto": "Pronto. Boa pedalada." }
  ]
}
```

| Campo | O que é |
|---|---|
| `idioma` | o idioma da fala, como no `video.mjs` |
| `perfil` | `calmo` ou `reels`. Decide os ajustes padrão da voz e vai igual para `video.voz.perfil`, que decide o mix (`references/voz-escolha.md` §5) |
| `voz` | a voz escolhida (`references/voz-escolha.md`). `modelo` padrão: `eleven_multilingual_v2`. `autorizacao`: o arquivo da autorização escrita, obrigatório para voz clonada (`references/voz-escolha.md` §7) |
| `ajustes` | opcional: sobrescreve os ajustes do perfil (`speed`, `stability`, `similarity_boost`, `style`, `use_speaker_boost`) |
| `pronuncia` | opcional: o mapa do §4 |
| `falas[]` | `id` (letras, números, `-` e `_`; vira o nome do arquivo), `onde` (`"abertura"`, `{ "passo": n }` ou `"fechamento"`), `texto` e, se precisar, o próprio `pronuncia` |

Na hora das amostras a voz ainda não foi escolhida: o `amostras --roteiro` aceita o roteiro sem
`voz`. O `gerar` não aceita.

## 7. Mudou uma frase: o que se regera

A chave de cada take é o SHA-256 de tudo o que muda o som:

- o texto enviado (já com a pronúncia);
- a voz, o modelo, os ajustes e o formato;
- as falas vizinhas, que vão como `previous_text` e `next_text` para a entonação emendar;
- as trocas de pronúncia usadas naquela fala.

Então, trocar a frase do passo 2 regera o passo 2 **e as falas 1 e 3**, porque o vizinho delas
mudou. O `gerar` mostra quantos caracteres novos vai gastar antes de chamar. Acima do teto (1500,
ou `--teto`), ele para e pede `--sim`.

O usuário ouviu e não gostou de um take? `voz.mjs gerar roteiro.json --saida … --refazer p2` pede
outro take só daquela fala. O antigo fica guardado em `voz/_takes/<chave>/antigos/`.

Os takes moram em `<pasta do vídeo>/voz/_takes/`, fora de qualquer `saida/`, e são a fonte da
verdade do som. Versione a pasta `voz/` inteira (os MP3 são pequenos): apagar um take é perder
aquela leitura para sempre.

## 8. Três exemplos

Inventados. O que vale é o formato e o tom de cada um, não as palavras.

**Encomenda de pão numa padaria de bairro, celular, calmo, você.**

| # | Onde | O que a voz diz | Risco |
|---|---|---|---|
| 0 | abertura | Encomendar o pão de amanhã. | — |
| 1 | passo 1 | Toque em Encomendar. | — |
| 2 | passo 2 | Escolha a quantidade de cada pão. | — |
| 3 | passo 3 | Marque a hora da retirada. | — |
| 4 | fechamento | Pronto. Seu pão fica separado. | — |

**Aula experimental numa academia, Reels, reels, tu, energia alta.**

| # | Onde | O que a voz diz | Risco |
|---|---|---|---|
| 0 | abertura | Marcar tua aula grátis. | — |
| 1 | passo 1 | Toca em Aula experimental. | — |
| 2 | passo 2 | Escolhe o treino e o horário. | — |
| 3 | fechamento | Bora treinar. | — |

"Grátis" só entra se o produto disser que é.

**Chamado de suporte numa ferramenta interna de TI, computador, calmo, termos em inglês.**

| # | Onde | O que a voz diz | Risco |
|---|---|---|---|
| 1 | passo 1 | Clique em Novo ticket. | ticket → "tíquet" |
| 2 | passo 2 | Anexe o log do erro. | log → "lóg" |
| 3 | passo 3 | Envie para o time de SRE. | SRE → "ésse érre é" |

Aqui a pronúncia mora no mapa, e a legenda continua com a palavra que o time usa.
