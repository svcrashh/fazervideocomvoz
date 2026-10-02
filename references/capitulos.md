# Vídeo em capítulos: a interface redesenhada, com voz

O padrão para update, patch notes, lançamento, demo, explainer e anúncio. Vale também sem voz. O tutorial que
ensina uma tarefa continua com a tela real (`references/tutorial.md`).

## Sumário
1. Por que redesenhar em vez de gravar
2. O que reprova (os defeitos que já saíram e ninguém quer de novo)
3. A estrutura: abertura com índice, capítulos, fecho
4. Anatomia de um capítulo
5. A interface redesenhada
6. Tela real: só como prova
7. Transição entre capítulos
8. 16:9 e 9:16 recompostos
9. A voz nos capítulos
10. Dicionário de pronúncia e conferência por transcrição
11. Produção: molde primeiro, capítulos em paralelo
12. Folha de quadros: obrigatória, por formato
13. O molde de exemplo (`assets/capitulos/`)
14. Armadilhas que já custaram tempo

---

## 1. Por que redesenhar em vez de gravar

Uma tela de app inteira dentro de um vídeo de 1920 px vira uma imagem de 600 px com letra de 6 px. Ninguém lê,
e o que importa (o botão novo, o número, a cor) se perde no meio de tudo o que não mudou. O vídeo que funciona
**redesenha a interface simplificada, grande e animada, só com o que importa**:

- o celular mostra três linhas de conteúdo, não trinta;
- o número novo ocupa um terço da altura do celular;
- a mudança acontece na frente de quem assiste: o estado antes vira o estado depois.

Os tokens (cores, fontes, raios, ícones) saem do produto, pela leitura (`references/leitura.md`); os dados, de
uma conta de exemplo autorizada (§5). Parece o produto, mas lê-se como um cartaz.

## 2. O que reprova

Cada item abaixo saiu num vídeo entregue e foi recusado. A folha de quadros (§12) procura cada um.

- **Tela real encolhida numa moldura:** letra ilegível, quadro cheio de nada.
- **Página gravada pela metade:** o quadro mostra carregando, branco ou um canto vazio.
- **Sempre a mesma composição:** tela no meio e legenda embaixo, do começo ao fim.
- **Legenda igual à fala inteira:** o texto na tela repete o que a voz diz, palavra por palavra. Num vídeo em
  capítulos, o título é cartaz (§4), e a fala é outra coisa.
- **Sem índice nem capítulos:** quem assiste não sabe quanto falta nem onde está.
- **Nome pronunciado errado:** marca, nome de produto, termo em inglês, nome inventado. Sem o dicionário e a
  conferência por transcrição (§10), isso só aparece quando o dono ouve.

## 3. A estrutura

| Trecho | Duração | O que acontece |
|---|---|---|
| **Abertura** | 5–8 s | logo, a palavra do vídeo ("Novidades", "O que mudou") e o **índice numerado**, que se preenche item a item |
| **Capítulos** | 5–12 s cada | um por novidade, na ordem do índice (§4) |
| **Fecho** | 6–10 s | o índice completo, **números grandes** (só os verdadeiros), logo parado ≥ 1,5 s, endereço ou slogan |

- O índice é o fio do vídeo: o cartão do próximo item abre o capítulo (§7), e o fecho volta a ele inteiro.
- 6 a 12 capítulos. Mais que isso vira "E mais": um capítulo com três novidades pequenas, uma linha cada.
- Duração total: 1min30 a 3min no 16:9; a mesma estrutura no 9:16 (não é corte do horizontal, §8).

## 4. Anatomia de um capítulo

Composição fixa, para que quem assiste aprenda a ler o vídeo no primeiro capítulo:

- **Etiqueta** pequena em fonte mono, com traço acima: `01 · ÁREA` (a área do produto, uma palavra).
- **Título de cartaz:** 2–3 palavras, fonte de título da marca (condensada, peso alto; itálico se a marca tiver),
  com a **palavra-chave na cor de destaque**. "Cores **novas**", "Seu **kit**". Não é frase da fala.
- **Apoio:** 1–2 linhas curtas, que entram quando a voz chega naquele assunto. No máximo ~45 caracteres cada.
- **O objeto:** à direita no 16:9, embaixo no 9:16. Celular, cartão, painel ou número, redesenhado (§5), que
  **muda enquanto a voz fala**: entra, mostra o estado antes, vira o estado depois, destaca o detalhe.
- **Fundo:** a cor de fundo da marca, grade sutil e um brilho lento da cor de destaque. Igual em todo capítulo:
  o que muda é o objeto.

Tempo de um capítulo:

| t (s) | O que |
|---|---|
| 0,0–0,9 | o cartão do índice entra pela direita, para no meio e encolhe até a etiqueta (§7) |
| 0,75 | etiqueta, traço e título entram (máscara de baixo para cima, palavra a palavra) |
| 0,9–1,5 | o objeto entra no palco; nada no palco antes de 0,9 |
| 1,4 | a fala começa: o título já foi lido |
| com a fala | uma ação nova a cada 1,5–3 s; o apoio entra quando a fala chega nele (`em`) |
| fim da fala + 0,8 | respiro com tudo parado e legível; nos últimos 0,5 s tudo sobe e some, o fundo fica |

A duração do capítulo é a da fala: `max(5, 1,4 + fala + 0,8)` segundos. Uma fala de 9 s dá um capítulo de
11,2 s; se passar de 12–15 s, o capítulo tem duas novidades, divida. Os `em` do apoio saem dos tempos
palavra por palavra do `locucao.json`, não da estimativa.

## 5. A interface redesenhada

- **Só o que importa:** a tela real tem trinta elementos; o capítulo tem três a cinco. Se o assunto é a cor do
  botão, o celular mostra o perfil, dois botões e a paleta. Tire menus, rodapés e texto corrido.
- **Grande:** texto do objeto ≥ 28 px no 16:9 (1080 de altura) e ≥ 32 px no 9:16. O celular ocupa ~70% da
  altura no 16:9 e ~55% no 9:16.
- **Componentes, não print:** o celular é um componente (moldura, ilha, tela com raio) que recebe o conteúdo;
  o cartão, o seletor, a lista e o número também. Um capítulo monta o objeto com eles.
- **Animado:** cada objeto tem um "antes → depois" visível. Seletor que anda, cor que troca, número que conta,
  lista que se preenche, cartão que se destaca. Um objeto parado é um print.
- **Dados de uma conta de exemplo autorizada** (nome, foto, números de verdade, com o ok escrito do dono da conta)
  ou fictícios verossímeis (`references/marca.md`). Nunca invente número do produto, cliente ou depoimento. Se o
  número não existe, o objeto mostra a interface sem número.
- **Fotos e logos de verdade** entram como imagem (`midia/`), recortadas no tamanho em que aparecem.

## 6. Tela real: só como prova

A tela real entra poucas vezes (0 a 3 no vídeo inteiro), quando provar vale mais que explicar: "está no ar".

- **Em tela cheia,** com zoom no detalhe que importa. Nunca encolhida numa moldura no meio do quadro.
- **Página pronta:** grave depois de carregar tudo (fontes, imagens), nunca o carregamento.
- **Sem sujar dado real:** a gravação numa conta de verdade não pode contar visita, clique nem aparelho. Intercepte
  as chamadas de métrica no navegador (`page.route`) antes de abrir a página, e diga no relatório o que foi
  interceptado.
- Use o motor de captura do tutorial (`scripts/tutorial/gravar.mjs`) ou um `page.screenshot` quadro a quadro; a
  gravação vira sequência de quadros em `midia/` (`references/motor.md`).

## 7. Transição entre capítulos

- **O cartão do índice passa por cima:** o item do próximo capítulo (número + nome) entra como cartão, cresce e
  vira a etiqueta do capítulo. É a transição padrão; mantenha a mesma em todo o vídeo.
- Duração 0,5–0,7 s, com um whoosh curto (`audio/sons.py`) no marco da folha.
- O capítulo anterior não some antes de o cartão cobri-lo: nada de quadro vazio entre capítulos.

## 8. 16:9 e 9:16 recompostos

O vertical é outra composição, com os mesmos elementos, não um recorte do horizontal:

| | 16:9 (1920×1080) | 9:16 (1080×1920) |
|---|---|---|
| etiqueta + título + apoio | coluna da esquerda (x 140, até 700 px de largura), título 128 px | em cima (x 90, até 860 px), etiqueta a ~11% da altura, título 118 px |
| objeto (o palco) | à direita, x 900–1800, y 90–990 | embaixo, x 90–990, y 740–1740 |
| índice (abertura e fecho) | à direita do logo | embaixo do logo, uma coluna |
| área segura | 5% em volta | 9:16 de rede: 14% em cima, 20% embaixo, 6% nas laterais (`references/formatos.md`) |

Cada cena declara o layout por formato (`L({ '16x9': …, '9x16': … })`) desde a primeira linha. Título que cabe
em uma linha no 16:9 pode precisar de duas no 9:16: escreva as quebras, não deixe o navegador decidir.

## 9. A voz nos capítulos

- **Roteiro por capítulo:** a fala de cada capítulo é `{ "onde": { "capitulo": n } }` no `roteiro.json`, além de
  `abertura` e `fechamento` (`references/voz-locucao.md`). O `voz.mjs` ordena e confere igual ao tutorial; um
  roteiro não mistura `passo` e `capitulo`.
- **Frases de propaganda:** curtas, no presente, uma ideia por frase. 2 a 4 frases por capítulo, 6 a 10 s.
  "Trinta e três layouts. Quatro em destaque, e o resto a um toque." Não lê a tela; diz o que ganha.
- **A voz manda no tempo** (§4): o capítulo dura a fala. Escreva o roteiro, gere a voz, e só então feche as
  durações. Num trabalho dividido, o roteiro fechado (texto + duração estimada) vem antes de qualquer cena.
- **Título ≠ fala:** o título é o cartaz (2–3 palavras), o apoio são 1–2 linhas, a fala é a frase inteira. Não há
  legenda palavra a palavra no vídeo em capítulos. Se for preciso legenda para assistir sem som (rede social),
  ela é um elemento à parte, embaixo, que a folha confere como o resto.
- **Números por extenso no roteiro** quando a voz pode errar ("dois vírgula sete mega"), e em algarismo na tela.
- A fala é medida (`voz.mjs gerar` devolve a duração de cada uma); a montagem usa a duração medida, não a
  estimada.
- A abertura e o fecho seguem as mesmas regras do `references/voz-locucao.md`.
- O mix é o de sempre (`references/voz-mix.md`), perfil `reels` para propaganda e redes, `calmo` para ajuda.

## 10. Dicionário de pronúncia e conferência por transcrição

Antes de gerar a primeira fala:

1. **Liste as palavras de risco do vídeo inteiro:** nome do produto, nomes próprios, nomes artísticos, termos em
   inglês, siglas, números com unidade, endereço. Num update de produto são quase sempre 8 a 15.
2. **Decida a grafia de cada uma** no mapa `pronuncia` do roteiro (`references/voz-locucao.md` §4). Uma palavra
   que a voz lê certo fica fora do mapa, mas fica na lista de risco.
3. **Ouça antes de gastar o resto:** `voz.mjs amostras --frase "<as palavras de risco numa frase>" --vozes <a
   escolhida>`. Uma frase só, poucos créditos. Ajuste o mapa e repita até a transcrição (passo 5) bater.
4. Mostre o dicionário na tabela de aprovação: palavra → como a voz lê.
5. **Depois de gerar, transcreva:**

   ```sh
   node $SKILL/scripts/voz.mjs ouvir <…>/locucao.json --palavras "Nome,Outro,Sigla"
   ```

   - Manda cada fala para o speech-to-text da ElevenLabs (`scribe_v2`), **sem keyterms**: enviesar a transcrição
     para a palavra certa esconderia a palavra errada.
   - Compara o que a transcrição ouviu com o que a voz devia dizer (o `dito`, quando há troca de pronúncia).
   - Palavra de risco = a que tem troca no mapa, mais as de `--palavras`. Se uma não aparece na transcrição, a fala
     falha e o comando sai com código 1.
   - Escreve `ouvido.md` ao lado do `locucao.json`: fala, risco, o que devia, o que se ouviu.
   - Palavra de risco que falhou: ajuste o mapa e `gerar --refazer <id>`. Dois takes seguidos errados na mesma
     palavra: troque a grafia, não insista no take.
6. A transcrição não julga sotaque nem entonação, e uma palavra inventada pode sair "certa" na transcrição e
   estranha no ouvido. O relatório lista as palavras de risco para quem ouve.

## 11. Produção: molde primeiro, capítulos em paralelo

1. **Roteiro fechado:** índice, a fala de cada capítulo e a duração estimada (caracteres ÷ 13,5 no `reels`).
   Gere a voz cedo: com os tempos medidos, as durações e os `em` do apoio deixam de ser palpite.
2. **Molde:** `node $SKILL/scripts/capitulos/novo.mjs <pasta> --fontes "…"` cria o projeto a partir de
   `assets/capitulos/`. Troque tokens, fontes, logo e índice pela leitura e faça **um capítulo inteiro**,
   renderizado nos dois formatos (`scripts/capitulos/render.mjs`) e olhado na folha. É o gabarito.
3. **Capítulos em paralelo:** com o molde aprovado, cada capítulo (ou grupo de 3) vai para um subagente ou
   janela, com escopo fechado: a pasta `cenas/NN-nome/`, o texto e a duração do roteiro, e a ordem de não mexer no
   molde. Cada um renderiza os dois formatos, olha a própria folha (§12) e escreve um `PRONTO.md` curto (o que
   fez, a duração, o que ficou de fora). Defeito no molde vira pedido a quem cuida do molde, não um conserto
   local.
4. **Em paralelo, a voz e a trilha:** a voz sai do roteiro fechado; a trilha, da folha com os marcos de cada
   capítulo.
5. **Montagem:** `node $SKILL/scripts/capitulos/montar.mjs <pasta> --locucao voz/<versao>/locucao.json` junta
   abertura + capítulos + fecho nos dois formatos, põe cada fala em `início da cena + 1,4 s`, recusa fala que não
   cabe e escreve a folha da trilha (bloco `voz` e um whoosh por passagem). Depois, a trilha sobre a folha
   (`references/trilha.md` §4, `references/voz-mix.md`) e o `finalizar.mjs` de cada formato.

Num trabalho dividido em janelas ou subagentes, escreva antes um contrato curto: quem faz o quê, onde cada um
grava, o roteiro fechado (pasta, duração, etiqueta, título, apoio com `em`, fala) e os rótulos exatos de cada palco.
Defeito no molde vai para um arquivo de pedidos que só quem cuida do molde resolve.

Cada capítulo é um vídeo curto: renderize e confira um sozinho, sem depender dos outros.

## 12. Folha de quadros: obrigatória, por formato

Antes de dizer pronto, para **cada formato** final:

```sh
# um quadro a cada 2 s, 5 por linha
ffmpeg -v error -i final-16x9.mp4 -vf "fps=1/2,scale=480:-1,tile=5x8" -frames:v 1 folha-16x9.jpg
ffmpeg -v error -i final-9x16.mp4 -vf "fps=1/2,scale=270:-1,tile=8x4" -frames:v 1 folha-9x16.jpg
```

Abra cada folha com a ferramenta de leitura de imagem e procure:

- **nada vazio:** quadro sem objeto, página carregando, fundo puro entre capítulos;
- **nada ilegível:** texto que não se lê na miniatura de 480 px provavelmente não se lê no celular;
- **nada cortado no vertical:** título, objeto ou índice fora da área segura ou da borda;
- **a composição:** etiqueta, título e objeto no mesmo lugar em todo capítulo;
- **o índice:** a abertura e o fecho mostram todos os itens, na ordem dos capítulos.

Confira também a duração (`ffprobe`), o áudio (`finalizar.mjs`: loudness, true peak, voz acima da trilha) e a
transcrição (`voz.mjs ouvir`). Ache defeito, corrija, refaça a folha.

## 13. O molde de exemplo (`assets/capitulos/`)

Um vídeo em capítulos mínimo, sem marca nenhuma (cores e nomes inventados), tirado de um vídeo de patch notes que
foi ao ar com este método:

- `molde/kit.js`: os componentes (fundo com grade e brilho, cartão do índice, moldura de capítulo com etiqueta,
  título de cartaz, apoio e saída, celular, cartão, pílula, toque, lista do índice) e o layout por formato;
- `molde/indice.js`: o índice, o nome, o endereço e os números do fecho;
- `cenas/00-abertura`, `cenas/01-exemplo`, `cenas/99-fecho`: uma abertura, um capítulo e um fecho que usam o kit;
- `LEIA.md`: como trocar os tokens, escrever um capítulo, renderizar e montar.

Os scripts moram em `scripts/capitulos/`: `novo.mjs` (cria o projeto), `render.mjs` (um capítulo ou todos, nos dois
formatos, com a folha) e `montar.mjs` (junta, põe a voz, escreve a folha da trilha). Troque os tokens pelos da
leitura (§3 da leitura: a cara do produto) e escreva os capítulos. O exemplo é estrutura, não identidade: o fundo, as fontes, a forma do celular e o movimento de cada
produto saem da leitura dele.

## 14. Armadilhas que já custaram tempo

- **Título largo demais:** palavra longa a 128 px passa de 750 px no 16:9. Quebre em duas linhas com o mesmo texto
  ("33" / "LAYOUTS"); só em último caso diminua (`tituloPx: { '16x9': 118 }`). O título nunca encosta no palco.
- **Medida com a fonte errada:** o motor carrega todo peso e estilo das famílias de `VIDEO.fontes` antes de
  construir as cenas. Fonte usada fora dessa lista é medida com a reserva (≈1,3× mais larga) e a checagem de
  largura mente: toda família do kit vai no `VIDEO.fontes` de cada cena.
- **Vão no 9:16:** o palco do vertical é alto para caber título de duas linhas e três apoios. Com título de uma
  linha, o conteúdo do palco encosta no topo dele (até 60 px) e cresce para baixo; um celular pequeno centralizado
  no meio do palco deixa um buraco entre o texto e o objeto.
- **Falsos positivos do `quadros.cjs --checar`:** a máscara da segunda linha do título encosta na primeira
  ("COLISÃO … em até 33%") e a etiqueta do 9:16 fica acima da área segura de rede social quando o vídeo não declara
  plataforma. Confira na folha olhada; se não há sobreposição visível, siga.
- **Fala que cresce depois da voz gerada:** as durações e os `em` do apoio saem dos tempos medidos
  (`locucao.json`), não da estimativa. Gere a voz antes de os capítulos ficarem prontos e avise quem faz capítulo
  quando os tempos mudarem.
- **Trabalho dividido sem contrato:** cada um inventa a própria passagem, o próprio fundo, o próprio tamanho de
  título, e o vídeo vira colagem. O molde e o contrato vêm antes do primeiro capítulo (§11).

