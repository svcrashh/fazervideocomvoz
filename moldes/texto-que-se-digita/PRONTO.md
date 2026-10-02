# PRONTO: texto que se digita (02/10/2026)

## O que está aqui
- `cena/molde.js` + `cena/index.html`: o molde, com os blocos `pergunta` (campo, roleta, digitar ou colar,
  limpeza, envio, resposta `numeros` ou `cartao`), `frase` e `fecho`, mais a legenda karaokê e os sons marcados
  pela própria cena.
- `renderizar.mjs`: monta a obra (motor da skill + parâmetros + fontes), mixa o som e renderiza cada formato com
  a folha de quadros. `mixar.py`: voz + efeitos (sons da skill), efeitos abaixam sob a voz, −16 LUFS.
- `exemplo-lumma.json` (Lumma One) e `exemplo-sobrou.json` (marca fictícia: **Sobrou**, app de receitas com o que
  sobrou na geladeira; pêssego claro, anil, tomate e amarelo, Bricolage Grotesque + Space Grotesk).
- `MOLDE.md`: o que é, quando usar e quando não, parâmetros, variações, como renderizar, limites.
- `voz/`: o take `c04` do vídeo de patch notes do Lumma (reaproveitado, sem crédito) e a fala nova da Sobrou
  (`s1`, 65 caracteres, 26 créditos), cada uma com o `ouvido.md` da transcrição.

## Vídeos de teste (`~/Desktop/moldes-teste/texto-que-se-digita/`)
| arquivo | duração | o que prova |
|---|---|---|
| `lumma-16x9.mp4` | 16,0 s | link sujo colado → as letras que sobram encolhem e vira `@g7venn` com selo "Link limpo" → o campo sobe, os cartões Instagram 7.129 e TikTok 70 contam, o total 7.199 em laranja com "seguidores somados" → `lummaone.com/7` digitado vira o logo LUMMA1 + "Cole do jeito que vier." |
| `lumma-9x16.mp4` | 16,0 s | o mesmo recomposto na vertical (título, campo e cartões no eixo central, legenda por vírgula) |
| `sobrou-9x16.mp4` | 15,1 s | roleta de exemplos desfocados subindo até o campo → "2 ovos, tomate e pão amanhecido" digitado com teclado de celular → cartão "Shakshuka de pão" com etiquetas e três passos que se escrevem → frase "Sobrou? Vira janta." com pílulas → `sobrou.app` vira o logo |
| `sobrou-1x1.mp4` | 15,1 s | a mesma Sobrou no quadrado |

Cada um tem a sua `*-folha.png` (24 quadros), **olhada por mim** depois do último render: nada vazio depois de
1 s, nada cortado (o "2" do pedido da Sobrou no 9:16 cortava e foi corrigido), legenda e textos legíveis. O 16:9 da
Sobrou não foi renderizado (a construção pedia a fictícia em pelo menos um formato; saíram dois).
Render final a 60 fps com 2 subquadros de motion blur (`-- --sub 2`), e não com os 8 do padrão: com as outras
janelas renderizando juntas, o primeiro final com 8 subquadros levou ~20 min por formato e foi cortado no limite
de tempo. Os rascunhos de trabalho ficaram em `rascunho/`.

## O que foi provado
- **Sem marca no código:** as duas marcas saem do mesmo `molde.js`, só trocando o JSON (cores, fontes, logo em PNG
  ou em texto, caixa alta ou não, raio, fundo com grade ou com duas luzes).
- **Promessa no quadro 0:** o título e o campo com rótulo e placeholder estão no primeiro quadro dos quatro vídeos.
- **Nunca tela encolhida:** a interface é redesenhada e grande. O total tem 230–260 px, os valores dos cartões 80–88 px
  e o título 66–74 px.
- **Legenda sempre:** a voz aparece em pílula embaixo, palavra a palavra, em blocos que fecham na pontuação.
- **Voz em ~40% do tempo:** no Lumma são 6,2 s de voz em 16 s, em dois trechos de uma fala já existente,
  remontados em outra ordem; na Sobrou, 3,5 s em 15,1 s. Pronúncia conferida por transcrição (`voz.mjs ouvir`): as
  duas falas foram ouvidas exatamente como escritas, com "Instagram", "TikTok", "geladeira" e "receita" certos.
- **Formatos recompostos:** 16:9, 9:16 e 1:1 têm cada um a sua geometria, sem recorte.
- **Som medido (não ouvido):** −16,1 LUFS integrado nos quatro, pico de −1,0 a −1,5 dBTP. A voz está onde devia
  (Lumma: 1,0–3,6 s e 6,4–9,8 s; Sobrou: entra em 2,3 s, junto da digitação, e vai até 5,6 s).

## O que ficou de fora
- O bloco A/B (duas janelas lado a lado com número, como o do KitKat) e a grade final de muitos resultados (v0).
- Prova em tela real gravada dentro do cartão de resposta: hoje a resposta é sempre redesenhada.
- Trilha musical: o som é só voz + efeitos.
- A variação "jornada em pedidos" (vários blocos `pergunta` seguidos) é possível pelos parâmetros, mas não foi
  renderizada.

## O que não consegui conferir
- **O som, de ouvido.** Medi a loudness e onde há silêncio, mas não ouvi nada. Pela medição, os efeitos (teclas,
  whoosh, "sucesso") ficam baixos perto da voz: aparecem acima de −40 dB só na digitação. A Sobrou começa com 2 s
  sem som nenhum (a roleta não tem efeito). Se ficarem baixos demais de ouvido, é só subir o `NIVEL` em `mixar.py`.
- O texto do campo depois do envio, no 9:16 da Sobrou, fica com ~40 px (2% da altura), abaixo dos 3% da regra 2.
  A voz não cita esse texto, mas um pedido mais curto fica maior.
