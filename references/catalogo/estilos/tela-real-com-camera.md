# tela-real-com-camera

Tutorial com a tela real gravada, e uma câmera que dá zoom e desliza até o campo da vez, com véu e desfoque no resto.
A pessoa reconhece o botão de verdade e consegue ler tudo.

**Quando usar:** objetivo `ensinar` (fora da tabela, também tour de SaaS ou câmera sobre a UI num lançamento);
qualquer canal menos telão; produto `leigo`, `b2b`, `financas`. Fluxo de 3 a 8 passos em celular ou computador.
**Quando não usar:** anunciar ou vender para quem não conhece (falta gancho); fluxo com 15+ passos (quebre em vídeos);
feed sem gancho; tela que não pode ser gravada.

## Estrutura (30–60 s; tutorial que a pessoa segue pode passar disso)
- **0–2 s:** a promessa escrita ("Como entrar pelo convite") com a tela já atrás. Plano geral da tela por 1–2 s.
- **Cada passo (4–8 s):** a câmera vai até a região do passo (1,8–3×), véu escuro + desfoque fora dela, anel de
  toque ou cursor, cartão de passo ("Passo 3 de 7" + frase de 8–14 palavras) ou legenda igual à fala.
- **Entre etapas:** intertítulo de 2–3 palavras sozinho no fundo, ~1,5 s.
- **Fecho (3–4 s):** o resultado em close e "Pronto! É só isso." com o logo.

## Formatos (recompostos, não recortados)
- **16:9:** computador em moldura de notebook ou de navegador; celular à direita com o título à esquerda. No
  computador, nunca a janela inteira com letra pequena: a câmera chega até o texto ter ≥ 3% da altura.
- **9:16:** celular a ~85% da largura com o cartão de passo no alto; computador recortado numa coluna da UI, com
  legenda karaokê (palavra da vez numa caixa de cor).
- **1:1:** recorte quadrado do bloco em foco, cartão de passo embaixo.

## O pedido precisa trazer
Conta de teste com dados de exemplo bonitos (nada de "teste123"); a lista de passos com o rótulo exato de cada
botão; quem vai assistir; qual aparelho. A posição de cada campo sai do Playwright (`boundingBox`), que vira o
roteiro da câmera.

## Variações
- **aparelho em cena:** celular, o grupo em foco "sobe" como cartão sobre o véu (fluxo curto, quem tem pressa).
- **do notebook ao detalhe:** três níveis de câmera, notebook inteiro → janela → diálogo.
- **câmera que passeia:** SaaS denso, UI sem moldura cortada nas bordas, tom sóbrio.
- **janela flutuante com macro:** a janela sobre fundo desenhado, alternando com um macro de 2,5–3×; teclas de
  atalho desenhadas nos cantos.
- **relâmpago (9:16):** um passo a cada 1,5–3 s, promessa com tempo no título ("em menos de 60 s").

## Ideias de roteiro que combinam
[Objeção antes da hora](../sem-molde.md#ideias), [Fala com quem assiste](../sem-molde.md#ideias),
[Uma tarefa do começo ao fim](../sem-molde.md#ideias), [Achadinho que resolve um incômodo](../sem-molde.md#ideias).

## Como renderizar
`$SKILL/moldes/tela-real-com-camera/MOLDE.md` (e `references/tutorial.md` para a gravação com Playwright).
Vídeos de exemplo: `$SKILL/moldes/tela-real-com-camera/exemplo/`.
