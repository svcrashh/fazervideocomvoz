# lista-que-corre · PRONTO (02/10/2026)

## O que foi provado

Vídeos e folhas em `~/Desktop/moldes-teste/lista-que-corre/` (cada folha foi olhada por mim, quadro a quadro):

| Vídeo | Marca | Velocidade | Formato | Duração | Voz |
|---|---|---|---|---|---|
| `lumma-lista-16x9.mp4` | Lumma One | lista (5 itens) | 16:9 | 19,2 s | Davi Andrei, 6,2 s (33%) |
| `lumma-lista-9x16.mp4` | Lumma One | lista | 9:16 | 19,2 s | idem |
| `brotto-rajada-9x16.mp4` | Brotto (fictícia, clara) | rajada (6 itens) | 9:16 | 14,6 s | Raquel, 3,7 s (26%) |
| `brotto-cartaz-16x9.mp4` | Brotto | cartaz (3 itens, `--itens 1,2,3`) | 16:9 | 20,0 s | a mesma locução (copiada, sem crédito novo) |
| `lumma-lista-1x1.mp4`, `-4x5.mp4` | Lumma One | lista | 1:1 e 4:5 | 19,2 s | rascunho (30 fps, sem motion blur) |

- **Sem marca embutida**: as duas marcas saem do mesmo código só trocando o JSON: escuro × claro, Oswald/Rubik em
  caixa alta inclinada × Unbounded/Space Grotesk sem caixa alta, logo em PNG × nome escrito, laranja × coral com
  paleta pastel.
- **Botão de velocidade**: rajada, lista e cartaz renderizados; `--itens` manda o que não virou item para o muro (o
  total continua verdadeiro: 11 na abertura, 11 no muro).
- **Regras do catálogo**: promessa escrita no quadro 0 (número + "novidades …"); a interface nunca é tela encolhida
  (painel de 1520×730 no 16:9, 960×900 no 9:16, rótulos ≥ 24 px); etiqueta numerada **sempre no mesmo canto**;
  legenda = fala, palavra a palavra; voz 26–33% do tempo; 14,6 a 20 s; o muro mostra o tamanho da atualização;
  termina no bordão ("Tá no ar.", "Da roça pra sua porta.").
- **Recomposto, não recortado**: 16:9 (frase ao lado da etiqueta, muro dos lados), 9:16/1:1/4:5 (marca no alto,
  frase embaixo, muro em cima e embaixo).
- **Pronúncia conferida por transcrição** (`voz.mjs ouvir`): "Luma One", "press kit", "layouts", "Broto" ouvidos
  certos. O conferidor marca "Doze/Onze/Trinta e três" como não achados porque a transcrição escreve "12/11/33"
  (falso negativo já relatado pelo numero-que-conta).
- Gasto de voz: 35 + 23 créditos (uma geração por marca).
- Rótulos e números do Lumma são os conferidos em produção no `CONTRATO.md` do patch notes (33 layouts, Night
  Signal/Rave, 7.129 + 70 = 7.199, 2.739 → 1.060 KB, G7VEN).

## Defeito achado e corrigido

- Nos finais com motion blur, os **números que contam** saíam com dígitos fantasma ("5.833", "6.808"): cada subquadro
  mostrava um número diferente. Corrigido em `lista.js` (`qd()`: o texto do número fica preso ao quadro de 60 fps).
  O Lumma 16:9 e 9:16 foram renderizados de novo depois da correção; os dois da Brotto **são de antes** (o rajada quase
  não mostra número; o cartaz mostra o contador "cestas prontas" e "42 → 60 reais" com o fantasma durante a contagem).
  Para refazer: `node render.mjs exemplo-brotto.json --saida ~/Desktop/moldes-teste/lista-que-corre --nome brotto-rajada --sub 2 --formatos 9x16` (a voz fica em cache no projeto).
- Logo do fecho saía cortado no 9:16 (largura medida antes de a imagem carregar): o `render.mjs` lê o tamanho do PNG.
- Bordão longo vazava no 9:16: agora encolhe até caber.

## O que ficou de fora

- **Trilha.** O áudio é só a voz (−16 LUFS). Pedido em `PEDIDOS-AO-INTEGRADOR.md` (ligar ao `arranjo_serie.py` +
  `mix_voz.py`, com uma batida por corte de item).
- Motion blur com 2 subquadros (`--sub 2`), não os 8 do modo final, para caber no prazo (~5 min por vídeo em vez de ~20).
- Prova com tela **gravada** (clipe de Playwright): o molde usa interface redesenhada e print recortado (`foto`).
- Chiado de TV da rajada original, letras que se decifram e pilha de cartões: variações das fichas que não entraram.
- 1:1 e 4:5 só em rascunho e só com o Lumma.

## O que não consegui conferir

- **O som**: ninguém ouviu. A voz foi conferida por transcrição e pelo tempo de cada palavra (a legenda casa com
  ela), mas o timbre e a emenda não foram ouvidos.
- A checagem automática de colisão do motor (`quadros.cjs --checar`) não foi rodada; a conferência foi pela folha.
