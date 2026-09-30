# Tipos de vídeo

O tipo decide de onde vem a imagem, o que perguntar, a duração, o **papel** da música, a densidade de sons e o QA. Por isso a triagem é o passo 0 do fluxo (`SKILL.md`).

O tipo **não** decide a cara do vídeo nem o gênero da música. Esses vêm da leitura do projeto (`references/leitura.md`): a cara, da seção 3; o gênero, do público (seção 4). Uma ficha que dissesse "tutorial: música acústica" ou "lançamento: eletrônico" daria a mesma música a um app de oficina mecânica e a um de maternidade. Por isso, nas fichas abaixo, "Música" diz só o papel:

- **de fundo:** nível baixo (perto de −18 LUFS na série), densidade baixa, os médios livres para a leitura, sem drop que roube a atenção. Continua tendo gênero: de fundo não é neutro;
- **protagonista:** nível cheio, contraste entre seções, build e impacto marcando os cortes;
- **meio-termo:** presente nos cortes, recuada no texto.

## Sumário
0. Triagem: como decidir e como perguntar
1. Tutorial / passo a passo
2. Demo de produto
3. Lançamento / anúncio
4. Showreel / institucional
5. Cases / portfólio
6. Explainer
7. Corte para redes / teaser
8. Vinheta / logo animado
9. Update / "o que mudou"
10. Outro
11. Série: identidade fixa, variação gerada

---

## 0. Triagem

1. **A conversa ou os argumentos já dizem o tipo?** Por exemplo, "faz um tutorial de como agendar", "um teaser de 15 s pro lançamento", "anima o logo". Então confirme em uma linha e siga para o briefing daquele tipo: "Entendi: um tutorial passo a passo do agendamento, com a tela real do app."
2. **Dá pra inferir com segurança?** Por exemplo, a conversa acabou de entregar uma funcionalidade e o pedido é "um vídeo mostrando isso". Proponha o tipo mais provável como opção recomendada, junto com as outras 2 ou 3 próximas.
3. **Não dá?** Pergunte com `AskUserQuestion`, uma pergunta só, com 4 opções escolhidas entre os 10 tipos pelo que a conversa sugere. O "Outro" cobre o resto.
   - Na descrição de cada opção vai o efeito ("tela real do app, uma tarefa, legenda por passo, música de fundo").
4. Na mesma rodada da triagem, só entram perguntas que **não** dependem do tipo, como onde vai passar. As outras esperam o briefing do tipo.

Um pedido pode ser dois tipos ("lançamento com um corte pros stories"). Nesse caso o principal manda e o outro vira extra da entrega.

**Onde passa decide entre 3 e 7.** Peça curta (≤ 15 s) feita **para** Stories, Reels, TikTok ou Shorts é **corte para redes**, mesmo que o conteúdo seja um anúncio: o formato nativo da rede (gancho no 1º segundo, som desligado, área segura, vertical) manda mais que o assunto. **Lançamento** é a peça principal, de 30 s ou mais, que pode *gerar* cortes.

| # | Tipo | Imagem | Papel da música | Sons | Texto |
|---|---|---|---|---|---|
| 1 | tutorial | **tela real** | fundo | toque, clique, digitação, virada, sucesso | legenda por passo |
| 2 | demo de produto | tela real com câmera, ou UI recriada | fundo ou meio-termo | toque, whoosh | títulos curtos |
| 3 | lançamento / anúncio | UI recriada, motion, tipografia | protagonista | todos, com riser e impacto | frases de impacto |
| 4 | showreel / institucional | motion, fotos, telas | protagonista | whoosh, impacto | pouco texto |
| 5 | cases / portfólio | prints e fotos com câmera | meio-termo | whoosh, virada | número e resultado |
| 6 | explainer | motion, ícones, diagramas | fundo | pop, virada | frases didáticas |
| 7 | corte para redes / teaser | reaproveita peças ou motion | protagonista | impactos | legendas grandes |
| 8 | vinheta / logo animado | logo | assinatura sonora | riser, impacto | só a marca |
| 9 | update / "o que mudou" | antes → agora, tela real | fundo | virada, sucesso | o que mudou e onde ver |
| 10 | outro | decidido na conversa | — | — | — |

Os sons vêm de `assets/audio/sons.py` e as transições estão em `references/transicoes.md`. Densidade de sons: **baixa** é só nos eventos principais, bem abaixo da música; **média** é em cada corte e toque; **alta** é em cada corte, palavra-chave e impacto.

---

## 1. Tutorial / passo a passo

- **Objetivo:** alguém termina o vídeo sabendo fazer **uma** tarefa no produto, sozinho.
- **Imagem:** **tela real**, sempre. Nada recriado: a pessoa vai procurar exatamente aquela tela. O vídeo é gravado pelo motor de captura (`scripts/tutorial/`) e o contrato está em `references/tutorial.md`.
- **Perguntas próprias do briefing** (até 4 por rodada, só o que o reconhecimento não respondeu):
  - qual app ou URL, e **como entrar sem senha no chat** (modo demo, conta de teste documentada, ou o usuário entra e avisa);
  - qual pessoa ou papel (quem faz a tarefa, o que ela vê, o que ela pode);
  - **uma tarefa por vídeo** (se o pedido tem três, são três vídeos da mesma série);
  - série ou avulso;
  - versões: celular, computador ou as duas;
  - o que **nunca** pode aparecer: dado real, segredo, função não lançada, IA desligada;
  - regra de dado plausível: dias de funcionamento, horário, feriados (escola ≠ comércio ≠ clínica);
  - idioma da legenda, onde vai passar (dentro do app, site, YouTube, Reels);
  - como regravar quando a tela mudar (quem roda o `--check` e quando).
- **Aviso obrigatório no briefing:** se o `--check` listar controles nativos (select, data, hora, arquivo), diga que a lista e o calendário nativos não aparecem na captura. A escolha é mostrada no próprio campo, passando pelas opções, com realce e um selo com a escolha. Se o produto tem um componente próprio de lista, prefira-o no roteiro.
- **Duração:** o tempo real da tarefa, sem esticar nem cortar passo, entre 20 e 90 s. Mais que isso vira dois vídeos.
- **Formatos:** celular → 9:16; computador → 16:9. As duas versões saem do mesmo roteiro.
- **Música:** papel de fundo. Quem assiste está lendo e imitando o passo, então a música fica atrás da legenda: −18 LUFS, densidade baixa, sem drop. O gênero vem da leitura (seção 4): para um público de rock, uma guitarra limpa com a bateria contida; para um de balcão, um xote com a zabumba baixa. Série: `serie.py`, com a identidade declarada (§11).
- **Sons:** densidade média e discreta. Toque ou clique em cada toque, digitação enquanto digita, virada na troca de legenda, whoosh na troca de tela, sucesso no fim e impacto leve no fechamento.
- **Legenda:** legenda por passo, frase curta no imperativo ("Toque em Salvar."), parada **pelo menos 3 s**. O gravador garante isso.
- **Ritmo:** o da tarefa real.
  - A câmera acompanha a ação: zoom no alvo (limitado pela resolução da captura), volta ao quadro todo quando a tela rola ou muda.
  - Abertura de ~2,4 s com o título e fechamento de ~2,8 s com a marca.
- **QA específico** (sem exceção):
  - o `--check` passa;
  - **nenhum toque sem checagem**;
  - a folha de toques da gravação e a folha de eventos do vídeo composto foram **olhadas**;
  - nenhuma data em fim de semana ou feriado;
  - senha, link com token e e-mail real borrados;
  - o toque cai no alvo, não em quem está na frente.
- **Série:** identidade fixa, declarada a partir da leitura (§11): o visual em `serie.json` com `"versao": 2`, elemento por elemento, e a música em `identidade.json` com `"versao": 2`. O molde do tutorial é a armadilha mais fácil: o motor já sabe desenhar um tutorial inteiro sozinho, e esse desenho nasceu de outro produto (`direcao-criativa.md` §8). A identidade é mostrada numa prancha e aprovada antes do segundo vídeo. Cada vídeo tem a própria trilha, gerada pela semente do vídeo. O briefing não se repete: os vídeos seguintes só perguntam a tarefa e o papel.

## 2. Demo de produto

- **Objetivo:** mostrar o produto funcionando e dar vontade de usar. Não ensina passo a passo.
- **Imagem:** tela real gravada com o mesmo motor do tutorial (câmera e indicador), cortada nos melhores trechos. Ou UI recriada, quando a tela real é inalcançável ou confidencial.
- **Perguntas próprias:** qual o fluxo "uau" (o momento que vende), para quem, o que não pode aparecer, onde vai passar.
- **Duração e formatos:** 30–60 s; 16:9 para site e pitch, 9:16 para redes.
- **Música:** papel de fundo ou meio-termo, marcando os cortes. Gênero: da leitura.
- **Sons:** média (toque, whoosh nas trocas).
- **Texto:** títulos curtos por trecho, sem "passo n de N".
- **Ritmo:** trechos de 3–6 s, corte no tempo da música, zoom nos detalhes.
- **QA:** as mesmas regras de toque do tutorial, se for tela real; cada trecho mostra uma coisa só.
- **Série:** "demo de cada módulo" funciona como série de tutoriais sem legenda de passo.

## 3. Lançamento / anúncio

- **Objetivo:** anunciar algo novo e fazer lembrar a marca.
- **Imagem:** motion, tipografia e UI recriada com os tokens do produto (é o caso de hoje da skill). Telas reais só como prova rápida.
- **Perguntas próprias:** a novidade em uma frase, a data, a chamada para ação, o tom e a música (3 direções).
- **Duração e formatos:** 15, 30 ou 40 s; 16:9 e 9:16.
- **Música:** papel protagonista, com build, drop e silêncio antes do impacto. Gênero: da leitura; o build e o drop se escrevem na linguagem desse gênero.
- **Sons:** alta (riser antes do drop, impacto no logo, whoosh nas transições).
- **Texto:** frases de impacto, uma ideia por cena.
- **Ritmo e QA:** o de `direcao-criativa.md` §4 e §7, mais a checagem de colisão e de área segura do `quadros.cjs`.
- **Série:** campanha com vários anúncios, com identidade fixa e trilha variada pela semente.

## 4. Showreel / institucional

- **Objetivo:** mostrar quem é a marca ou o estúdio, e o que ela já fez.
- **Imagem:** motion, fotos e telas com câmera (Ken Burns guiado, `camera()`), 3D leve (`references/motor.md`).
- **Perguntas próprias:** o que entra (projetos, números verdadeiros), a sensação, onde passa (site, evento, telão).
- **Duração e formatos:** 40–90 s; 16:9, às vezes 9:16.
- **Música:** papel protagonista. Gênero: da leitura.
- **Sons:** média para alta, com whoosh e impacto nos cortes principais.
- **Texto:** pouco (nomes, números).
- **QA:** todo número tem fonte; hold final do logo ≥ 1,5 s.
- **Série:** raro. Quando existe (reel anual), segue a identidade do anterior com trilha nova.

## 5. Cases / portfólio

- **Objetivo:** provar resultado com um cliente real.
- **Imagem:** prints e fotos do cliente com câmera, 3D leve, número grande.
- **Perguntas próprias:** quais cases, quais números (verificados), o que pode ser mostrado do cliente (autorização).
- **Duração e formatos:** 20–30 s por case; 16:9.
- **Música:** papel meio-termo. Gênero: da leitura (num portfólio de estúdio, o público é o cliente do estúdio).
- **Sons:** média.
- **Texto:** dor → solução → número → marca do cliente.
- **QA:** número verificável; logo do cliente exato.
- **Série:** quase sempre é série. A estrutura e a identidade são fixas; o que muda por case é cor, fonte, textos, mídia e **a trilha, gerada pela semente de cada case**. Uma trilha única para todos os cases é o erro da rodada anterior.

## 6. Explainer

- **Objetivo:** explicar um conceito ou como algo funciona por dentro.
- **Imagem:** motion, ícones, diagramas que se montam, metáfora visual.
- **Perguntas próprias:** qual ideia, para quem (nível de conhecimento), a única coisa que precisa ficar.
- **Duração e formatos:** 45–120 s; 16:9.
- **Música:** papel de fundo, com tempo para a frase ser lida. Gênero: da leitura.
- **Sons:** baixa para média (pop quando algo aparece, virada na troca de ideia).
- **Texto:** frases didáticas, uma por cena, com tempo de leitura folgado.
- **QA:** leitura (tempo mínimo), sequência lógica, nada de jargão sem explicar.
- **Série:** "explicando cada parte do produto", com identidade fixa e trilha por semente.

## 7. Corte para redes / teaser

- **Objetivo:** parar o polegar no feed e levar para o produto ou para o vídeo principal. Vale para anúncio de novidade, teaser, chamada de evento: qualquer peça curta nativa de rede.
- **Imagem:** motion curto feito do zero, **ou** cenas cortadas de uma peça que já existe (se houver). UI recriada com dados fictícios quando o produto aparece.
- **Perguntas próprias:** qual rede (se não veio), se existe peça principal para cortar, o gancho do 1º segundo, a mensagem, o público (quem ainda não conhece ou quem já usa), a chamada para ação.
- **Duração e formatos:** 6–15 s; 9:16 (Reels, TikTok, Shorts, Stories) e 4:5 ou 1:1 (feed).
- **Música:** papel protagonista, com o gancho no primeiro segundo. Gênero: da leitura, e do que toca naquela rede para aquele público.
- **Sons:** alta.
- **Texto:** legendas grandes, porque a maioria assiste sem som. Tudo dentro da área segura da plataforma (`VIDEO.plataforma`).
- **QA:** quadro 0 com movimento, área segura sem violação no `quadros.cjs --checar`.
- **Série:** cortes de uma campanha, com trilha derivada da peça principal pela semente.

## 8. Vinheta / logo animado

- **Objetivo:** assinatura de marca de 2 a 6 s (abertura de vídeo, fim de apresentação).
- **Imagem:** o logo em partes (`logo.mjs --dividir`), o movimento-assinatura.
- **Perguntas próprias:** onde vai ser usada, fundo claro ou escuro, com ou sem som, a versão do logo.
- **Duração e formatos:** 2–6 s; todos os formatos pedidos.
- **Música:** papel de assinatura sonora curta (logo sonoro). O timbre sai do gênero da leitura.
- **Sons:** riser e impacto no encaixe final.
- **Texto:** só a marca.
- **QA:** logo final exato e parado ≥ 1,5 s; sem distorção.
- **Série:** não se aplica.

## 9. Update / "o que mudou"

- **Objetivo:** mostrar para quem já usa o que mudou e onde achar.
- **Imagem:** tela real (motor do tutorial), antes → agora, com virada entre os dois.
- **Perguntas próprias:** o que mudou, para quem, onde está no app, a data.
- **Duração e formatos:** 15–45 s; o formato de onde passa (dentro do app, e-mail, redes).
- **Música:** papel de fundo. Gênero: da leitura; numa série de updates, a mesma identidade dos tutoriais.
- **Sons:** baixa para média (virada no antes → agora, sucesso no fim).
- **Texto:** "Antes… / Agora… / Onde ver".
- **QA:** as regras de toque do tutorial; a tela "antes" precisa ser verdadeira (gravação antiga ou versão anterior), nunca recriada.
- **Série:** notas de versão em vídeo, uma por release, com trilha por semente.

## 10. Outro

Pergunte o objetivo em uma frase e descubra qual dos tipos acima está mais perto. Use a ficha dele como ponto de partida e diga o que muda.

---

## 11. Série: identidade fixa, variação gerada

Numa série (tutoriais de um app, cases de um estúdio, anúncios de uma campanha), a identidade é decidida **uma vez** e se repete em cada peça. Se ela estiver errada, erra em todas. Por isso ela sai da leitura, é declarada por escrito e é vista antes de se multiplicar.

**1. A leitura, primeiro.** O `leitura.md` mora na pasta da série (`references/leitura.md`). A seção 5 dele é a identidade em prosa: cada elemento com o porquê.

**2. O visual, declarado (contrato B).** No `serie.json`, com `"versao": 2` e `"leitura": "leitura.md"`, o bloco `visual` declara cada elemento: `cores`, `fundo`, `moldura`, `legenda`, `selo`, `titulo`, `abertura`, `fechamento`, `realce`, `indicador`. As opções de cada um estão em `references/tutorial.md`. Nenhum elemento fica de fora: um padrão que ninguém escolheu vira a identidade de todo mundo, e dois produtos sem nada em comum saem com o mesmo vídeo. Uma série sem `"versao"` compõe com o desenho antigo do motor, que não é identidade de ninguém; use só para refazer uma série antiga.

**3. A música, declarada (contrato C).** No `identidade.json`, com `"versao": 2`: o `papel` (de fundo ou protagonista, do tipo de vídeo: nível, densidade e espaço para a leitura), a lista de `groove` que a série aceita e os timbres, o bumbo, o baixo e o quanto a cama cede ao bumbo, com os nomes de campo de `references/trilha.md` §9. Os grooves e timbres saem do gênero da leitura (seção 4). A semente escolhe só entre o que foi declarado.

**4. A prancha, antes do segundo vídeo.** Com o rascunho do primeiro vídeo pronto, tire três quadros e junte lado a lado:

```sh
# abertura com o título legível, uma tela com legenda e realce, fechamento com o logo parado
ffmpeg -y -ss 1.9 -i rascunho.mp4 -frames:v 1 p1.png
ffmpeg -y -ss <um passo do meio + 1 s> -i rascunho.mp4 -frames:v 1 p2.png
ffmpeg -y -sseof -0.5 -i rascunho.mp4 -frames:v 1 p3.png
ffmpeg -y -i p1.png -i p2.png -i p3.png -filter_complex "[0][1][2]hstack=inputs=3,scale=2400:-2" prancha.png
```

O instante do passo vem do `eventos.json` (o começo de uma legenda do meio). Numa versão 9:16 a prancha sai alta e estreita; tudo bem. Guarde `prancha.png` na pasta da série, olhe você mesmo (o teste da troca vale aqui também) e mostre ao usuário junto com a seção 5 da leitura e o rascunho com som (`SKILL.md`, passo 4.1). Só grave o segundo vídeo depois da aprovação.

**5. Cada peça ganha:**

- o conteúdo;
- a **trilha própria**, gerada por `serie.py` com a semente da peça (tom, BPM, progressão, motivo e groove mudam, dentro do declarado);
- os sons nos eventos dela.

Os vídeos seguintes **não repetem o briefing**: pergunte só o que muda (a tarefa, o case). Prove a variação com `serie.py --comparar` antes de entregar a série.
