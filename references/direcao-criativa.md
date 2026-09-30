# Direção criativa

## Sumário
1. Anatomia de um vídeo de produto
2. De onde vêm as ideias (para os 3 conceitos)
3. Catálogo de movimentos e transições
4. Ritmo e tempo
5. Tipografia, cor e composição
6. Texto na tela
7. Lista de revisão (antes de mostrar qualquer coisa)
8. Anti-clone

---

## 1. Anatomia de um vídeo de produto

A estrutura que prende é: gancho, tensão, virada, prova, emoção e assinatura. As proporções mudam com a duração:

| Batida | 15 s | 30 s | 40 s | 60 s | Função |
|---|---|---|---|---|---|
| Gancho | 0–2 | 0–3 | 0–4 | 0–5 | algo já se move no quadro 0; a marca aparece ou é prometida |
| Tensão | 2–5 | 3–9 | 4–10 | 5–16 | o problema, o "antes", o que incomoda o público |
| Virada | 5–7 | 9–12 | 10–12 | 16–20 | a frase que muda o jogo, com build na música |
| Prova | 7–12 | 12–24 | 12–28 | 20–44 | o produto funcionando: 2 a 4 cenas, uma ideia por cena (no 15 s, uma só) |
| Emoção | — | 24–27 | 28–34 | 44–52 | quem ganha com isso; respiro ou breakdown |
| Assinatura | 12–15 | 27–30 | 34–40 | 52–60 | impacto, logo exato, frase-assinatura, endereço |

Isso é ponto de partida, não lei. Um vídeo só de tipografia, ou um "um dia na vida", reorganiza tudo. Só não abra mão de três coisas: gancho, uma ideia por cena e assinatura limpa.

## 2. De onde vêm as ideias

Gere os 3 conceitos a partir de **fontes diferentes**. Assim eles saem diferentes de verdade, e não três versões do mesmo.

- **A metáfora do logo:** o logo já conta uma história? Peças que se encaixam, uma folha que cresce, uma onda, um ponto que vira linha. Anime a história, não o desenho.
- **O gesto do produto:** qual é o gesto que o usuário faz? Tocar, arrastar, marcar, conversar, pagar. Transforme o gesto em transição.
- **Antes → agora:** frases do problema que se transformam na solução (riscar e trocar, virar o cartão, apagar e reescrever).
- **Número verdadeiro:** um dado real e verificável (tempo economizado, etapas, alunos), mostrado grande, com contador. Nunca invente.
- **Um dia na vida:** a rotina de uma pessoa do público, do começo ao fim do dia, e onde o produto entra.
- **Tipografia protagonista:** o texto é a imagem. Palavras em grade, escala, peso que muda, letras que viram formas.
- **Objeto que se transforma:** uma forma atravessa o vídeo todo virando coisas (ponto → gráfico → celular → logo). É o *match cut* contínuo.
- **Zoom infinito:** cada cena mora dentro de um detalhe da anterior.
- **Mapa, rede ou sistema:** nós que se conectam, mostrando como as partes do produto conversam.
- **Colagem editorial:** papel, recortes, grão e fita, pra marca artesanal ou calorosa.
- **Interface coreografada:** a UI reconstruída em HTML com os tokens do produto, dançando no ritmo (toques, listas que entram, gráficos que se desenham).
- **Contraste de mundos:** preto e branco caótico × cor e ordem; ruído × silêncio.

Para cada conceito, defina o **movimento-assinatura**: o gesto visual que volta no começo e no fim e amarra o vídeo. Ele vem desta marca, das seções 1 a 3 da leitura: um logo de peças pede encaixe, um produto de entregas pede trajeto, um caderno de receitas pede virar de página.

## 3. Catálogo de movimentos e transições

Escolha 4 a 6 para o vídeo e não repita a mesma transição duas vezes seguidas. As receitas de código estão em `motor.md`.

**Entradas e saídas de texto**
- Máscara por palavra (`riseWords`): o padrão elegante, com escalonamento de 0,06–0,09 s e easing outExpo.
- Letra a letra com mola (`spring` na escala): pra palavra-chave, uma letra por semicolcheia.
- Riscar e trocar: um traço desenhado atravessa, as letras antigas caem com gravidade e a nova frase sobe com marca-texto.
- Digitação com cursor: pra mensagem, chat ou relatório.
- Contador e odômetro: números que rolam.

**Transições entre cenas**
- Mergulho (zoom-through): a câmera entra numa forma até a cor dela encher a tela, e a próxima cena nasce dessa cor. Use `pontoInterno()` pra não vazar pela borda.
- Íris: círculo que cresce a partir de um ponto **com sentido**, como uma palavra, um botão ou uma notificação.
- Elemento que vira tela: pílula, cartão ou notificação que cresce até o quadro inteiro.
- Push (empurrão): a cena nova empurra a velha, na vertical ou na horizontal, no tempo.
- Whip-pan: panorâmica rápida com motion blur, da cena A pra cena B lado a lado.
- Colapso em pontos: painéis viram pontos, os pontos se juntam num só e ele cresce até virar o fundo da cena seguinte.
- Virada 3D: um cartão vira (`perspective`, `backface-visibility`); a frente é uma versão e o verso é outra.
- Dissolução em partículas: letras soltam pontos e se desfazem com blur.
- Match cut: uma forma ou cor igual em posição igual nas duas cenas, com corte seco no tempo.
- Corte seco no downbeat: o mais forte de todos quando a música bate. Não tenha medo dele.

**Vida e ênfase**
- Formas orgânicas respirando nos cantos (`breathe`), sangrando pra fora do quadro.
- Anel de choque no impacto, em vez de flash de tela inteira (o flash vira cinza).
- Tremor de câmera curto nos impactos (`VIDEO.impactos`).
- Pulso de escala quando algo "acende" (`pulse`), com ondulação saindo.
- Traço que se desenha (`traco`): sublinhado, conexão, gráfico de linha.
- Brilho que atravessa o logo (gradiente recortado pelo próprio logo).
- Estrelinhas, confete e partículas só no clímax, nunca como enfeite constante.
- "Boil" de 12 fps (textura ou contorno que treme) pra estética feita à mão.

## 4. Ritmo e tempo

- **Grade:** escolha o BPM junto com a duração. Com 120 BPM, a batida dura 0,5 s, o compasso 2 s, e 20 compassos dão 40 s. Com 100 BPM, o compasso tem 2,4 s. Todo corte, encaixe e palavra-chave cai num tempo; os detalhes, em colcheias ou semicolcheias.
- **Folha de sincronia:** é o contrato entre imagem e som. Cada evento de tela com som próprio vira um marco no `folha.json`. Mudou uma cena? Mude a folha e avise a trilha.
- **Leitura:** conte do momento em que o texto termina de entrar até a saída.
  - 2 a 4 palavras pedem ≥ 0,7 s.
  - 5 a 10 palavras pedem ≥ 1,5 s.
  - Um parágrafo pede digitação lenta mais 1 s.
  - Na dúvida, dê mais tempo.
- **Antecipação:** antes do drop e do logo final, o movimento "puxa" pra dentro por 0,15–0,25 s, e a música faz silêncio ou só respira.
- **Contraste de velocidade:** uma entrada rápida (outExpo, ~0,4 s) com uma permanência lenta lê melhor do que tudo em velocidade média.
- **Respiro:** perto dos 2/3 do vídeo entra um momento mais calmo (breakdown) antes do clímax. Sem ele, o final não pesa.
- **Hold final:** o logo fica parado e legível por pelo menos 1,5–2 s. É o quadro que vira capa.

## 5. Tipografia, cor e composição

- **Tipografia:** use as fontes da marca, com duas famílias no máximo. Títulos grandes: 90–240 px no 16:9, 80–200 px no 9:16. Contraste de peso na mesma frase (regular + black) e ênfase numa palavra (cor da marca, itálico ou marca-texto).
- **Cor:** cada cor faz no vídeo o papel que faz no produto (leitura, seção 3): a cor que só aparece em botão e item ativo marca o toque e a palavra-chave, não pinta o fundo; a cor proibida como fundo de área continua proibida. Use a proporção do manual, quando existir; sem manual nem leitura que diga, 60% fundo, 25% texto/escuro e 15% acentos. Uma cor de ênfase por cena. Alternar cenas claras e escuras dá ritmo, mas só se o produto tiver as duas superfícies.
- **Composição:** o texto fica do lado oposto às formas decorativas. Formas decorativas: até 3 por cena, em cantos diferentes, sangrando pra fora. Deixe margem e respeite as áreas seguras do formato (`formatos.md`).
- **UI do produto:** reconstrua em HTML com os tokens reais (cores, raio, fonte do app), com conteúdo verossímil no vocabulário do produto. Um print chapado envelhece e fica ilegível.

## 6. Texto na tela

- Frases curtas, afirmativas, uma ideia por cena, na voz da marca (leia o manual e o briefing de marca, se existirem).
- Respeite as regras de linguagem do produto, como termos proibidos e linguagem inclusiva.
- Nada de estatística, depoimento, cliente ou selo que você não confirmou. Pessoas em cena ganham nome fictício.
- Nada de dado pessoal real, nem em interface de mentira.
- Revise acentuação e concordância, porque é o texto que fica na cabeça.

## 7. Lista de revisão (antes de mostrar qualquer coisa)

Rode `quadros.cjs --cenas` e uma tira em cada transição, abra as imagens e confira:

- [ ] Cada frase fica parada e legível pelo tempo mínimo (seção 4)?
- [ ] O quadro 0 e o primeiro segundo têm movimento de verdade?
- [ ] Alguma transição abre para tela vazia ou quase vazia?
- [ ] Algum texto encosta na borda, sai do quadro ou entra na área coberta pela interface da plataforma?
- [ ] Alguma cor intermediária suja (marrom, cinza, mostarda) aparece numa troca?
- [ ] Algum flash deixa a tela acinzentada?
- [ ] Alguma letra ou forma é cortada por máscara quando deveria cair ou sair?
- [ ] O logo final está exato (proporção, cores, sem distorção) e parado por ≥ 1,5 s?
- [ ] A marca d'água ou selo colide com formas ou texto em alguma cena?
- [ ] O script imprimiu erro de página ou de fonte? Se sim, nada mais importa: corrija primeiro.
- [ ] Os tempos das cenas batem com a folha de sincronia?
- [ ] **Teste da troca:** com o logo e o nome de um produto de outro mundo, este vídeo ainda serviria? Aponte pelo menos três elementos que só este produto pediria (leitura, seção 6). Se sobrarem só cor e logo, volte às decisões.
- [ ] Cada elemento que se repete na tela (fundo, moldura, legenda, selo, título, fechamento, realce) tem uma linha na seção 5 da leitura dizendo por quê?

## 8. Anti-clone

Antes de escrever o roteiro, escreva (na seção 5 da leitura, se ela já não disser):

1. O movimento-assinatura: de onde ele vem nesta marca?
2. Qual paleta musical (gênero, BPM, timbres) e por que ela é **deste público** (leitura, seção 4)?
3. Três decisões deste vídeo que o anterior não tinha.

**O molde do tutorial é a armadilha mais fácil.** O motor de tutoriais sabe desenhar um vídeo inteiro sem que você decida nada. O que ele desenha nesse caso (formas orgânicas que respiram no fundo, selo em pílula, janela com três bolinhas, cartão de legenda branco que vira, íris na cor da marca) é só o que sobrou de quando ninguém escolheu. Posto em dois produtos diferentes, faz os dois parecerem o mesmo. Numa série nova, cada um desses elementos é declarado (`references/tipos.md` §11). Se a declaração coincidir com esse desenho, a seção 5 da leitura diz por que este produto pede isso; "é o que o motor faz" não é motivo.

**O vídeo anterior é a segunda armadilha.** O último vídeo que você fez, o de um concorrente, o de outra série do mesmo usuário: nenhum deles é referência de estilo para este.
