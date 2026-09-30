# Mix com voz

Como a trilha e a locução viram um áudio só, e como provar que ficou bom sem ninguém ouvir.

## Sumário
1. O que o mix faz, e por quê
2. A folha com voz
3. Os dois perfis
4. Efeitos debaixo da fala
5. Rodar
6. Conferir: `verifica.py` e `finalizar.mjs`
7. Quando algo reprova
8. O que só o ouvido julga

---

## 1. O que o mix faz, e por quê

Quando a folha tem o bloco `voz`, o `arranjo_serie.py` compõe a cama como sempre e depois chama o `mix_voz.py`. O
`trilha.wav` deixa de ser só a música: passa a ser o mix final (música, efeitos e voz), masterizado. É assim que
uma edição profissional trabalha. **A voz manda, e a música abre espaço para ela antes de ela começar.**

| Passo | Valor | Por quê |
|---|---|---|
| Ganho de entrada | cada fala a −23 LUFS | as falas saem do gerador em níveis diferentes (até 7 dB entre uma e outra); sem isso, o mesmo compressor apertaria uma e nem tocaria a outra |
| Passa-alta | 80 Hz | abaixo disso a voz só tem ronco e sopro, que roubam loudness e não trazem palavra |
| Compressor | −26 dBFS, 3:1, ataque 5 ms, soltura 90 ms | aproxima a sílaba forte da fraca: a última palavra da frase não some debaixo da música |
| Nível da fala | cada fala a −15 LUFS | todas iguais, 3 dB acima da cama |
| Nível da cama | −18 LUFS (música e efeitos, sem a voz) | é o nível de uma trilha de fundo; com voz, a música é sempre de fundo |
| A música desce | a partir de 0,15 s antes do 1º som | quem ouve percebe a música abrindo espaço, e a primeira sílaba já nasce limpa |
| Fica embaixo | enquanto a voz fala; segura 0,08 s depois da última palavra | a cauda da palavra não é engolida pela música voltando |
| Volta | em 0,45 s | rápido o bastante para a música preencher a pausa, lento o bastante para não saltar |
| Pausa curta | menor que 0,6 s não sobe | subir e descer de novo em meio segundo é bombear |
| Recorte | −3 dB extras em 1,5–4 kHz enquanto a voz fala | é a faixa em que a voz se entende; a música fica inteira no resto do espectro |
| Master | −14 LUFS integrado; true peak ≤ teto da folha (−1 dBTP), limitador de pico real 4× mirando 0,3 dB abaixo | o AAC da entrega sobe alguns décimos no pico |
| **Garantia** | em cada fala, voz ≥ 12 dB acima da trilha, em banda cheia e no alto-falante de celular (300 Hz–8 kHz) | no celular a cama "sobe" em relação à voz. Se não der, a música daquela fala desce até dar, e o log diz quanto. A conta é feita depois do master: o limitador segura os picos da voz e come alguns décimos da razão |

## 2. A folha com voz

O `compor.mjs` escreve na `folha.json`, e o mix lê:

```json
"loudness_lufs": -14, "teto_dbtp": -1.0,
"voz": { "arquivo": "voz.wav", "trechos": [[3.214, 4.702], …], "perfil": "calmo", "falas": […] }
```

- **`voz.wav`**: a locução inteira na linha do tempo do vídeo, 48 kHz mono, com silêncio fora das falas, ao lado
  da folha. O nível é o do gerador, sem ganho: o 1º som de cada fala é medido nele (10 ms a partir do instante,
  acima de −45 dBFS, a mesma régua do `inicio_voz` da locução).
- **`trechos`**: um por fala, do 1º som ao fim da última palavra. É o que o envelope da música segue.
- **`perfil`**: `calmo` ou `reels` (§3).
- O `mix_voz.py` tem de estar ao lado do `arranjo_serie.py`. Se faltar, o arranjo diz isso e para.

## 3. Os dois perfis

O perfil muda junto com a velocidade da voz: é o ritmo do vídeo.

| | `calmo` (tutorial, explicação) | `reels` (corte rápido, feed) |
|---|---|---|
| A música cede na fala | 11 dB | 9 dB |
| A música nas pausas, sobre a cama | −1 dB | 0 dB |

No `reels` a música fica mais presente, porque o vídeo é curto e a energia faz parte da mensagem. No `calmo` a
música recua mais, porque quem assiste está aprendendo.

## 4. Efeitos debaixo da fala

Um efeito toca "debaixo da fala" quando soa entre a descida da música (0,15 s antes do 1º som) e o fim do segura.

- **Ficam no nível deles:** `toque`, `clique`, `digitacao`. São o gesto que a tela mostra; se sumissem, a imagem
  perderia a causa.
- **Descem 6 dB:** `whoosh`, `virada` e `riser` (transições) e também `sucesso`, `impacto` e o acento musical dos
  marcos sem efeito. São longos ou afinados, e disputam a faixa da voz.
- A virada da legenda cai sempre 0,15 s antes da fala do passo. Para ela ser ouvida sem abrir um buraco debaixo
  da primeira sílaba, o espaço que a cama abre para ela é curto: volta em 150 ms, antes do 1º som. Efeito que cai
  com a música já cedendo à voz não abre espaço nenhum: a voz já abriu.

## 5. Rodar

Pelo `compor.mjs`, com `video.voz`, nada muda: ele copia os arquivos de áudio e roda o arranjo. À mão:

```
python arranjo_serie.py identidade.json folha.json
```

Sai, ao lado da folha:

- `trilha.wav`: o mix final;
- `stems/voz.wav`, `stems/musica.wav`, `stems/efeitos.wav`: os três somam o `trilha.wav`;
- `stems/ref/`: as réguas (a música depois dos efeitos e antes da voz, a música crua, os efeitos antes de
  descerem), com o mesmo master;
- `trilha.voz.json`: perfil, quanto a música cedeu em cada fala (e quanto a mais pela garantia), a razão voz/trilha
  de cada fala depois do master.

Num arranjo próprio (sem série), o caminho é o mesmo que o `arranjo_serie.py` faz no bloco `if voz`: separar a
música dos efeitos, e chamar `mix_voz.salvar`.

## 6. Conferir: `verifica.py` e `finalizar.mjs`

**`python verifica.py folha.json`** mede, nos stems, cada linha da tabela do §1. Código 0 é tudo ok. A tabela por
fala mostra:

| coluna | o que é |
|---|---|
| 1º som | o 1º som da voz da folha; tem de cair a ±10 ms do início do trecho |
| lugar | quanto a voz do mix está deslocada da voz da folha (correlação em 300–3400 Hz; limite ±1 ms) |
| LUFS | o nível da fala; todas a ≤ 1 LU uma da outra |
| voz/tri, celular | quanto a voz fica acima da trilha, em banda cheia e no filtro de celular (mínimo 12) |
| bombear | quanto o mix varia a música dentro da fala (LUFS de 400 ms, contra a música crua; limite 3) |
| música, crua | a variação da própria música na fala, só para comparar |

Depois da tabela: a música nas pausas, quanto ela cede em cada fala e em que instantes (ainda em cima 0,18 s antes,
no meio da descida, embaixo no 1º som, embaixo até 0,08 s depois, no meio da volta, de volta 0,53 s depois), as
pausas curtas que não sobem, o recorte (medido em 2–3 kHz) e cada efeito debaixo da fala. Com voz, os marcos de
efeito são medidos na trilha sem a voz: a voz é outra camada, e o lugar dela é medido por fala.

**`finalizar.mjs`**, com a folha que tem `voz`, confere no áudio do MP4, já em AAC:

- o true peak contra o teto da folha;
- em cada fala, o 1º som no MP4 a ±1 quadro do início do trecho (a voz da folha é o gabarito; o atraso vem da
  correlação cruzada);
- em cada fala, quanto a voz fica acima do que toca debaixo dela, nos vãos entre as palavras: mínimo 15 dB (os
  12 dB da garantia mais os ~3 dB entre a sílaba forte e a média). Um mix bom fica acima de 19; uma trilha que não
  cedeu fica perto de 9.

## 7. Quando algo reprova

| Reprovou | O que costuma ser | O que fazer |
|---|---|---|
| garantia, e o log diz "nem a música 40 dB abaixo" | um toque, clique ou digitação alto demais debaixo da fala | baixe o `nivel` daquele marco na folha e rode de novo |
| 1º som fora do trecho | o `voz.wav` e os `trechos` discordam | é do `compor.mjs`; componha de novo, não mexa na folha à mão |
| lugar da voz | a voz andou depois do mix | o `trilha.wav` foi editado fora do arranjo; gere de novo |
| a música não cede no tempo | o `trilha.wav` não saiu deste arranjo, ou a folha mudou depois | rode o arranjo de novo com a folha atual |
| `finalizar`: destaque < 15 dB | a trilha que entrou no MP4 não é a que cede | confira se o `--audio` é o `trilha.wav` do arranjo com voz |
| `finalizar`: 1º som fora de ±1 quadro | vídeo e áudio de versões diferentes | junte de novo o vídeo e o `trilha.wav` da mesma composição |

## 8. O que só o ouvido julga

As medidas acima provam nível, tempo e espaço. Não provam gosto. Ninguém aqui ouve. Diga ao usuário, com todas as
letras, o que ainda precisa de um ouvido:

- se a voz soa natural sobre esta cama, ou comprimida demais;
- se a volta da música em 0,45 s soa como respiro ou como salto, neste gênero;
- se o `reels` está enérgico o bastante, ou o `calmo` recuado demais, para este público;
- sibilância e estalos de boca na voz (o mix não tem de-esser);
- se algum efeito que ficou no nível dele, debaixo da fala, distrai.
