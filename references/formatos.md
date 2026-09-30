# Formatos

| Formato | Tamanho | Onde | Assinatura final |
|---|---|---|---|
| `16x9` | 1920×1080 | site, YouTube, pitch, TV, LinkedIn | logo horizontal |
| `9x16` | 1080×1920 | Reels, Stories, TikTok, Shorts, status | logo vertical (símbolo sobre o nome), se a marca tiver |
| `1x1` | 1080×1080 | feed quadrado, anúncios | logo vertical ou horizontal pequeno |
| `4x5` | 1080×1350 | feed do Instagram/LinkedIn (ocupa mais tela que o 1:1) | logo vertical |

Todos a 60 fps no final. O rascunho sai a 30 fps.

## Áreas seguras

A interface da plataforma cobre partes do vídeo. Texto e logo ficam fora delas; forma decorativa pode passar por baixo.

- **9:16 (Reels/TikTok/Shorts):**
  - no topo, os ~220 px de cima (nome, "Reels", câmera);
  - embaixo, os ~420 px de baixo (legenda, música, nome);
  - à direita, uma faixa de ~140 px entre y 900 e 1650 (curtir, comentar, compartilhar).
  - Texto que importa: **y 250–1450, x 70–940**. Em Stories as margens são parecidas: evite os 250 px de cima e os 340 de baixo.
- **4:5 e 1:1 (feed):** o corte da prévia pode comer as bordas; deixe 60 px de margem.
- **16:9:** 5% de margem (96 px nas laterais, 54 em cima e embaixo) pra texto; logo final centralizado.

### `VIDEO.plataforma` e a checagem automática

Diga no `video.js` onde o vídeo vai passar. A checagem de colisão usa isso pra saber o retângulo seguro de cada formato:

| `plataforma` | Retângulo seguro |
|---|---|
| `'reels'`, `'tiktok'`, `'shorts'` (no 9:16) | x 70–940, y 250–1450 (a faixa dos botões à direita já fica de fora) |
| `'stories'` (no 9:16) | x 60–1020, y 250–1580 (evita os 250 px de cima e os 340 de baixo) |
| `'feed'` | 60 px de margem |
| `'youtube'` | 5% de margem |
| `'app'` | 60 px de margem (player dentro do produto ou do site, sem interface de rede por cima) |
| `null` (sem plataforma) | o padrão do formato: 16:9 → 5%; 9:16 → o retângulo do reels/tiktok/shorts (é pra lá que o 9:16 costuma ir); 1:1 e 4:5 → 60 px |

- Com vários formatos, use um objeto: `plataforma: { '9x16': 'stories', '16x9': 'youtube' }`. Um formato que não aparece no objeto usa o padrão dele.
- Um tutorial que passa no "Ver como fazer" do app usa `plataforma: 'app'`.

Todo texto marcado (as linhas de `textLine`/`bloco` já são; logo e legenda você marca com `marcar(el, 'logo')`) que estiver **parado e opaco** precisa caber no retângulo. O retângulo medido é o do que aparece (as letras, as formas do logo), não o da caixa. A checagem roda:

- em todo quadro do `quadros.cjs` (tiras, `--cenas`, `--auto`);
- na linha do tempo inteira com `node ferramentas/quadros.cjs --projeto . --checar [--qps 10] [--formato 9x16]`, sem imagem, em poucos segundos;
- na folha automática que o `render.cjs --modo rascunho` gera no fim.

A mensagem sai assim: `ÁREA SEGURA t=4,00–7,90 s: texto "Baixe agora" sai da área segura do reels (y 1636 > 1450)`, com código de saída 4. Corrija o layout (`L({...})`, corpo menor, quebra de linha). Num título centrado no 9:16, o reels só aceita até 800 px de largura, porque o centro fica em 540 e o limite em 940. Só desmarque (`marcar(el, false)`) o que é decorativo de verdade.

## Um vídeo, vários formatos

Decida os formatos no briefing e escreva cada cena **já com layout por formato**. Remontar depois custa o dobro (converter um vídeo pronto para outro formato pede um script só para isso).

- Use `L({ '16x9': …, '9x16': … })` em posição, tamanho de fonte, raio e número de linhas; `VERTICAL` e `W/H/CX/CY` servem pra lógica.
- Frase que cabe numa linha no 16:9 vira duas no 9:16. Monte com `bloco` e quebre pelo sentido ("O plano de / cada aluno,"), nunca pelo comprimento.
- Composições lado a lado (texto à esquerda, imagem à direita) viram empilhadas no vertical, com o título em cima e a imagem maior no centro.
- Colunas viram faixas horizontais empilhadas; carrossel horizontal vira vertical.
- Gráficos e anéis ficam centralizados e maiores no vertical, que tem altura sobrando.
- Whip-pan: no vertical, o movimento pode continuar horizontal (é natural no celular) ou virar vertical.
- Revise **cada formato** com `quadros.cjs --formato 9x16 --cenas` e `quadros.cjs --formato 9x16 --checar`. Um formato bom não garante o outro.

## Texto mínimo legível

- **16:9 visto em notebook:** 28 px pra rótulo, 56+ pra frase, 90+ pra título.
- **9:16 visto no celular:** 34 px pra rótulo, 60+ pra frase, 88+ pra título.
- Texto de interface dentro de mock de celular pode ser menor, porque é "imagem", mas a mensagem precisa estar num título fora dele.
