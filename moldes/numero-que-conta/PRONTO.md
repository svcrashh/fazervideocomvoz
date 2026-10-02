# PRONTO — número que conta (02/10/2026)

## O que está aqui
- `molde.js`, `video.js`, `index.html`: o molde, com o motor da skill (`assets/template/engine.js`, copiado pelo
  preparar). Cinco blocos: `contador` (com ou sem lista), `cartoes`, `antes-depois`, `refrao`, `fecho`, mais a
  chamada do quadro 0 e a legenda palavra a palavra.
- `preparar.mjs` (parâmetros → pasta pronta, roteiro de voz, voz.wav, folha da trilha, legenda.srt) e `render.sh`
  (do parâmetro ao mp4 entregue e conferido).
- `exemplo.json` — Lumma One (meia-noite/creme/laranja, Oswald/Rubik/Source Code Pro), com os números reais do
  update de 01/10 que estão no CONTRATO do patch notes: 12 novidades, 33 layouts, 6 idiomas, 6 tamanhos de tela,
  página de 2.739 KB → 1.060 KB, `lummaone.com/7`.
- `exemplo-clara.json` — **Brota**, marca fictícia (horta em casa por assinatura): creme claro, verde-escuro, rosa,
  cartões amarelo/verde/azul, Bricolage Grotesque/Space Grotesk, sem logo (o nome vira o logo). Números inventados,
  de marca inventada.
- `MOLDE.md`: o que é, quando usar e quando não, parâmetros, como renderizar, limites.

## O que foi provado
- **Duas marcas opostas no mesmo código** (escura e sóbria × clara e colorida), sem uma linha de marca no molde.
- **Três formatos recompostos**: 16:9 e 9:16 (Lumma), 9:16, 1:1 e 16:9 (Brota) — conferidos em folhas de quadros
  (`~/Desktop/moldes-teste/numero-que-conta/<marca>/previas/v2*.png`), olhadas por mim.
- **Checagem do motor** (colisão e área segura do YouTube/Reels/feed) limpa na última rodada, depois de corrigir o
  que ela e eu achamos: cartão antigo por baixo do novo, chamada fora da área do Reels, número alto demais para a
  área útil, rótulo largo demais no 9:16, rótulo-pílula batendo na legenda no 9:16. Lista de correções: ver
  "o que mudou na conferência" abaixo.
- **Regras do catálogo**: promessa escrita no quadro 0 (a chamada); número sozinho 1,6 s antes do rótulo; rótulo
  de 3 palavras; legenda sempre, acendendo palavra a palavra no tempo da voz; nada de tela encolhida (não há tela);
  vídeos de 18,2 s (Lumma) e 15,6 s (Brota).
- **Voz**: 3 falas no total (2 Lumma, 1 Brota), Davi Andrei, 154 caracteres, 61 créditos. Pronúncia conferida por
  transcrição (scribe): "12 novidades no seu press kit já no ar", "E a sua página carrega com menos da metade do
  peso", "1.248 hortas brotaram em setembro" — os números ditos por extenso voltam em algarismos, prova de que
  foram lidos certos (o `ouvir` marca ✗ nesses: falso negativo, pedido ao integrador). A voz fala 27% (Lumma) e
  20% (Brota) do tempo.
- **Trilha**: `arranjo_serie.py` com o bloco `voz` da folha (a música cede à fala), house para a Lumma, acústico
  para a Brota; Lumma mixada em −14,0 LUFS, pico −1,8 dBTP.

## O que mudou na conferência (para quem mexer depois)
- Número dimensionado também pela **altura da caixa de texto** (a fonte tem ascendente grande: Oswald 1,48× o
  corpo), não só pela largura.
- O número que conta fica com a largura do valor final, centrado: não corre para o lado enquanto sobe.
- O contador com lista ganha 0,28 s por item (a 1ª versão rolava 5 itens por segundo, ilegível).
- No 9:16 o rótulo do antes-depois fica ao lado da seta, não embaixo das barras.

## Vídeos de teste
`~/Desktop/moldes-teste/numero-que-conta/` — ver "Estado do render" no fim deste arquivo.

## O que ficou de fora
- **Passagem vazia de ~0,4 s** entre o contador e o primeiro cartão (o contador some antes de a tinta do cartão
  cobrir a tela): aparece nas folhas finais dos três vídeos. Correção simples (não sair quando o próximo bloco é
  `cartoes`, ou começar a tinta 0,4 s antes), não feita para não mudar o código depois dos renders conferidos.
- Letreiro de oferta (preço/prazo em carimbo) e folha que sai da fenda — caem em `antes-depois`/`contador`.
- O bloco ainda não é importável por outro molde (pedido em `PEDIDOS-AO-INTEGRADOR.md`).
- Prova de tela junto do número (o número não mostra onde mora no produto).
- Transição de tinta com textura: aqui é um círculo a partir de um canto.

## O que não consegui conferir
- **Som**: ninguém ouviu. Trilha, entonação e o equilíbrio voz × música só foram medidos (loudness, pico, voz
  destacada da trilha pelo `finalizar.mjs`), não ouvidos.
- A voz da Brota é a mesma da Lumma (não fiz a escolha de três candidatas para a marca fictícia, para não gastar
  crédito); num pedido de verdade a voz é escolhida por vídeo.

## Estado do render (final, 60 fps, motion blur de 4 subquadros)
Todos conferidos pelo `finalizar.mjs`: resolução e fps, duração vídeo = áudio, −14 LUFS, pico ≤ −1,5 dBTP, cada
fala começando no quadro certo (±1 quadro) e a voz 21–23 dB acima do que toca debaixo dela.

| vídeo | duração | folha (olhada) |
|---|---|---|
| `lumma/entrega/lumma-16x9.mp4` | 18,2 s | `lumma/entrega/folha-16x9.png` |
| `lumma/entrega/lumma-9x16.mp4` | 18,2 s | `lumma/entrega/folha-9x16.png` |
| `brota/entrega/brota-9x16.mp4` | 15,6 s | `brota/entrega/folha-9x16.png` |
| `brota/entrega/brota-1x1.mp4` | 15,6 s | `brota/entrega/folha-1x1.png` |

Brota em 16:9 só em quadros de conferência (`brota/previas/v2.png`), sem vídeo final.
O 1º encadeamento de render parou pelo limite de 30 min do processo no meio do 1:1 da Brota (seis moldes
renderizando juntos, carga ~80); o 1:1 foi refeito sozinho, com a mesma trilha e a mesma voz.
