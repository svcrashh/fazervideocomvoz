# Voz no modo tutorial: a voz manda no tempo, a legenda é a fala

Como o motor do modo tutorial (`references/tutorial.md`) grava e compõe um vídeo com voz em off.

- **Quem gera a voz** é a skill com voz (roteiro de locução, escolha da voz, `voz.mjs gerar`). Ela entrega
  a locução, e o motor só lê.
- **O motor não sabe quem gerou.** Ele lê um `locucao.json` neutro e os WAV ao lado.
- **Sem `voz` no `video.mjs`, nada disto existe**, e a saída é a de sempre, byte por byte.

## Sumário
1. Ligar a voz num vídeo
2. A locução que o motor lê
3. O tempo: primeiro diz, depois faz
4. A legenda é a fala
5. O que sai
6. Mensagens de erro e o que fazer
7. O que ainda não tem voz

---

## 1. Ligar a voz num vídeo

No `video.mjs`, um bloco a mais:

```js
voz: { locucao: 'voz/{versao}/locucao.json', perfil: 'calmo' },   // perfil: 'calmo' | 'reels'
```

- **`{versao}`** vira o nome da versão (`celular`, `computador`…). Cada versão tem a sua locução, porque
  o texto muda: no celular a voz diz "Toque em Salvar"; no computador, "Clique em Salvar".
  - Versão sem locução é erro. Gere a voz dela, ou tire a versão de `versoes`.
- **`perfil`** vai para a folha de sincronia e escolhe o mix: `calmo` no tutorial, `reels` no corte curto.
  É o mesmo nome que a skill com voz usou para a velocidade da fala.
  - Sem o campo, vale `calmo`.
- **Grave e componha como sempre** (`references/tutorial.md` §7). O `--check` já confere a locução, então
  um erro de texto aparece em segundos, antes de gravar.

## 2. A locução que o motor lê

`<pasta do vídeo>/voz/<versao>/locucao.json`, com os áudios em `falas/` (WAV PCM, 48 kHz, mono):

```json
{
  "versao": 1, "idioma": "pt-BR", "voz": { "…": "informativo; o motor não usa" },
  "falas": [
    { "id": "abertura", "onde": "abertura", "texto": "Regar a horta.", "arquivo": "falas/abertura.wav",
      "duracao": 1.21, "inicio_voz": 0.04,
      "palavras": [ { "texto": "Regar", "ini": 0.04, "fim": 0.39 }, { "texto": "a", "ini": 0.42, "fim": 0.47 }, { "texto": "horta.", "ini": 0.5, "fim": 1.21 } ] },
    { "id": "p1", "onde": { "passo": 1 }, "texto": "Toque no canteiro.", "…": "…" },
    { "id": "fechamento", "onde": "fechamento", "texto": "Pronto. Até amanhã.", "…": "…" }
  ]
}
```

- **`onde`** diz onde a fala entra: `"abertura"`, `{ "passo": n }` (n começa em 1, na ordem dos
  `g.passo`) ou `"fechamento"`. Todas são opcionais, e cada lugar tem no máximo uma fala. Passo sem fala
  fica como sempre, pela leitura mínima.
- **Tempos** em segundos desde o início do arquivo. `inicio_voz` é o primeiro som medido (RMS de 10 ms
  acima de −45 dBFS), e a 1ª palavra nunca começa antes dele.
- **As palavras, juntas por espaço, dão exatamente o `texto`**, com a pontuação. É isso que deixa a
  legenda mostrar o texto e destacar palavra por palavra sem se perder.
- **O que o motor confere** (e recusa, dizendo o quê):
  - `versao` 1;
  - `id` único e `onde` válido, sem lugar repetido;
  - o arquivo existe e é 48 kHz mono;
  - as palavras estão em ordem, dentro do áudio, e batem com o texto;
  - a fala da abertura é o título do vídeo, e a do fechamento é o `fimLinhas` junto (sem caixa e sem
    pontuação). A tela mostra um texto; a voz não pode dizer outro;
  - não sobra fala para passo que o roteiro não tem.

## 3. O tempo: primeiro diz, depois faz

A voz manda e a imagem segue: o gravador segura cada passo pelo tempo da fala. Se a imagem mandasse, a
voz teria de correr ou ser cortada.

Constantes: `ENTRA` = 0,15 s e `ANTES` = 0,30 s. O `util` de uma fala vai do primeiro som ao fim da
última palavra.

| Onde | Regra | Por quê |
|---|---|---|
| passo com fala | o primeiro som cai `ENTRA` depois da troca de legenda | quem assiste lê a legenda nova e ouve logo em seguida, não antes |
| | o `g.passo()` só devolve o controle 0,3 s antes do fim da frase | a primeira ação do passo começa quando a frase já está acabando: primeiro diz, depois faz |
| | o próximo passo espera `max(leituraMin, ENTRA + util + 0,5)` | nenhuma fala atravessa uma troca de passo; sobra meio segundo de respiro |
| primeiro passo | a tela respira 0,5 s antes da primeira fala | não há troca: a legenda entra por fade, e na abertura `cortina` só fica inteira em A + 0,65 s. Sem o respiro, a voz começaria antes de a legenda aparecer |
| abertura com fala | primeiro som em 0,30 s; dura `max(abertura da série, 0,30 + util + 0,40)` | título longo não é cortado pela tela |
| fechamento com fala | primeiro som 0,25 s depois do início; dura `max(fechamento da série, 0,25 + util + 1,5)` | o logo fica parado pelo menos 1,5 s depois da voz |

- **O `--check` não espera a voz.** Ele confere os toques em segundos. Os tempos só valem na gravação.
- **Trocou a locução depois de gravar?** A composição confere de novo, fala por fala, contra os passos
  gravados. Se couber, compõe e avisa. Se alguma fala atravessaria a troca seguinte, recusa: grave de novo.

## 4. A legenda é a fala

- **A legenda do passo é o `texto` da fala.** Se o `g.passo('…')` do roteiro disser outra coisa, o
  gravador avisa e a fala vence: a legenda nunca diz uma coisa enquanto a voz diz outra.
- **A palavra falada fica em destaque**, uma de cada vez, do `ini` ao `fim` dela, no estilo de letra
  que a legenda da série já tem.
  - Palavra curta ("a", "o", "e") fica em destaque pelo menos 0,12 s, sem passar do início da próxima.
    Com 50 ms, ela piscaria num quadro só.
  - Nas pausas entre frases, nenhuma palavra fica em destaque.
- **A cor do destaque sai da marca**: `MARCA.cores.acento` (ou `marca`, se não houver acento). Nunca é
  uma cor fixa.
  - Se a cor se lê sobre o fundo da legenda (pelo menos 3:1), só a cor da palavra muda.
  - Se não se lê (por exemplo, uma faixa da mesma família de cor), o destaque vira **marca-texto**: fundo
    na cor, letra na tinta da série se ela passar de 4,5:1 ali. Senão, a letra vai na que mais contrasta
    entre o fundo da legenda, branco e quase-preto.
- **Só a cor muda: o texto não anda.** A medida que encolhe a legenda longa e a checagem de colisão e de
  área segura continuam valendo para o texto da fala.
- **Vale nos dois desenhos:** no da série versão 2 e no desenho antigo.

## 5. O que sai

Além do de sempre, só quando há voz:

| Arquivo | O que é |
|---|---|
| `saida/<versao>/comp/audio/voz.wav` | a faixa da voz do vídeo inteiro: 48 kHz, mono, 16 bits, cada fala amostra por amostra no lugar dela e silêncio fora |
| `<id>-<versao>.srt` | legenda externa: uma deixa por fala, do primeiro som ao fim da última palavra, no tempo do vídeo final |
| bloco `voz` da `folha.json` | `{ arquivo: "voz.wav", trechos: [[início, fim], …], perfil, falas: [{ id, t, texto }] }`, mais `loudness_lufs: -14` e `teto_dbtp: -1.0`. Quem mistura a voz com a trilha lê daqui |

- **`eventos.json`** ganha `voz: { locucao, sha256, perfil }` (qual locução gravou). Cada `passo` ganha
  `fala` (o id), e `roteiro` quando o texto do roteiro era outro.
- **Linha de resumo da composição:** diz quantas falas, o perfil e se a abertura ou o fechamento cresceram.
  Exemplo: `voz: 7 falas de voz/celular/locucao.json, perfil calmo · abertura 2,40 s · fechamento 3,96 s
  (cresceu de 2,80 s pela fala)`.

## 6. Mensagens de erro e o que fazer

| Mensagem (começo) | O que fazer |
|---|---|
| `falta a locução da versão computador` | gere a voz dessa versão, ou tire a versão de `versoes` |
| `… não segue o contrato da locução` | a lista embaixo diz o campo e a fala. Normalmente a locução foi editada à mão: gere de novo |
| `a fala da abertura (…) não é o título do vídeo` | troque o título ou a fala da abertura, para que digam o mesmo |
| `a fala do fechamento (…) não é o texto do fechamento` | o mesmo, com `fimLinhas` |
| `a locução tem fala para o passo 6, mas o roteiro só tem 5` | tire a fala, ou acrescente o passo no roteiro |
| `a gravação de celular é de antes da voz` | grave de novo: a gravação antiga não segurou os passos pela fala |
| `a fala do passo 2 (…) não cabe no passo gravado` | a locução mudou depois de gravar e ficou longa demais: grave de novo |
| `MARCA.cores.acento (ou .marca) tem de ser um hex` | ponha a cor em hex no `marca.js` da série |

## 7. O que ainda não tem voz

- **O modo motion** (`cenas.js`) não tem tempo de cena guiado pela voz nem legenda falada.
- **O título da abertura e o texto do fechamento** não destacam palavra. A voz diz o mesmo texto que está
  na tela, e ele já está inteiro à vista.
- **O mix** (a trilha abaixar sob a voz, o loudness final) não é do motor de imagem: está na referência de
  mix da skill com voz.
