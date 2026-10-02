# Molde: texto que se digita

O pedido aparece escrito na tela desde o quadro 0, dentro de um campo grande do próprio produto. Ele é digitado
(ou colado), o produto responde ali mesmo, e o vídeo fecha com uma frase digitada e o endereço. Junta seis estilos
que as janelas do estudo acharam sem combinar: campo que se digita, prompt que vira produto, texto digitado
conduz, texto digitado em cor, história contada pela interface e a tela responde (catálogo §3, item 2).

## Quando usar
- O produto tem uma caixa de texto: busca, IA, chat, cadastro, um campo que limpa ou converte o que se cola.
- Lançamento ou "o que o app faz" em 10–30 s, para Reels, WhatsApp e site. Funciona sem som, porque o texto
  na tela já conta a história.
- Uma ideia de roteiro que cabe em pedidos: a [jornada pelo que se digita] (uma história em 4–6 pedidos).

## Quando não usar
- O valor do produto é visual e ninguém digita nada (jogo de ação, câmera, moda): use antes e depois ou
  teaser de luz.
- Lista de muitas novidades: use lista que corre ou capítulos com índice.
- Tutorial passo a passo, em que a pessoa precisa ver onde clicar na tela real: use tela real com câmera.

## Como é (blocos)
O vídeo é uma fila de blocos (`cenas`). Cada um dura `dur` segundos, e todos ficam sobre o mesmo fundo, então a
passagem de um para o outro não pisca: o bloco sai subindo e desfocando em 0,35 s.

| bloco | o que faz | campos |
|---|---|---|
| `pergunta` | título + campo com rótulo e placeholder já na tela no quadro 0; roleta de exemplos desfocados que sobem até o campo; o pedido digitado (`modo: "digita"`, ritmo humano semeado) ou colado (`"cola"`, com seleção que pisca); limpeza opcional (as letras que sobram encolhem e um prefixo entra); envio: o campo sobe e a resposta aparece embaixo | `titulo`, `destaque` (palavra do título na cor de destaque), `rotulo`, `placeholder`, `roleta[]`, `texto`, `modo`, `em`, `vel` (letras/s), `teclado` (`notebook`/`mecanico`/`tela`), `icone` (`seta`/`busca`), `limpa {fica, prefixo, em, selo}`, `resposta` |
| resposta `numeros` | cartões com número que conta e um total grande na cor de destaque, com rótulo de três palavras | `em`, `itens[{rotulo, valor}]`, `total {rotulo, valor}` (valor em formato brasileiro, "7.199" ou "2,7") |
| resposta `cartao` | o produto responde: título, etiquetas, e linhas numeradas que se escrevem palavra a palavra | `em`, `titulo`, `chips[]`, `linhas[]` |
| `frase` | texto grande digitado com cursor (o "narrador"), palavra de destaque, pílulas de sim/não que saltam depois | `texto`, `destaque`, `pilulas[{t, tipo: "sim"/"nao"}]`, `apaga`, `em`, `vel`, `fs`, `y` |
| `fecho` | o endereço se digita num campo, o campo vira o logo, o bordão e o endereço sobem | `digita`, `em`, `logoEm`, `bordao`, `endereco` |

A legenda da voz entra sozinha embaixo, em pílula, palavra acendendo no tempo da fala (regra 4).
Os sons também são automáticos: cada bloco marca as suas teclas, o clique de colar ou de enviar, um whoosh nas
passagens e um "sucesso" quando a resposta fecha. A voz fica por cima, e os efeitos abaixam enquanto ela fala.

## Parâmetros (`exemplo-*.json`)
Nada da marca está no código. Um arquivo tem:
- `nome`, `formatos` (`16x9`, `9x16`, `1x1`; cada formato tem a sua composição, nada é recortado), `plataforma`
  (opcional, área segura do motor), `grao`.
- `marca`: `nome`; `cores` (`fundo`, `superficie`, `campo`, `borda`, `texto`, `apoio`, `destaque`, `ok`,
  `sobreDestaque`, `sombra`, todas em hex); `fontes` (`titulo`, `texto`, `mono`: Google Fonts, baixadas para
  dentro da obra pelo `scripts/fontes.mjs`); `caixaAlta`; `raio` do campo (padrão: pílula); `raioCartao`;
  `fundo` (`grade` em px, `brilho` 0–1, `cor2` para uma segunda luz); `logo`, que pode ser
  `{ "arquivo": "x.png", "arquivo_origem": "midia/x.png", "proporcao": 5.33 }` ou `{ "texto": "sobrou", "ponto": "." }`.
- `voz.trechos`: pedaços de falas já geradas pela `scripts/voz.mjs` (`locucao.json`): `{ fala, de, ate, em }`.
  `de`/`ate` cortam a fala em segundos (corte entre palavras, de um silêncio a outro), e `em` é quando o trecho
  entra no vídeo. Dá para reaproveitar uma fala de outro vídeo em outra ordem sem gastar crédito.
- `cenas`: os blocos acima.

## Como renderizar
```sh
node moldes/texto-que-se-digita/renderizar.mjs moldes/texto-que-se-digita/exemplo-lumma.json \
  --saida ~/Desktop/saida [--formatos 16x9,9x16] [--modo rascunho|final] [--sem-som]
```
- Sai `<saida>/<nome>-<formato>.mp4` (com som) e `<saida>/<nome>-<formato>-folha.png`. **Olhe as folhas antes
  de entregar.** O rascunho (30 fps, sem motion blur) leva segundos; o final (60 fps, 8 subquadros) leva ~1–2 min
  por formato de 15 s.
- A obra montada fica em `<saida>/.obra-<nome>/`: abra `index.html?f=9x16&t=4.2` para ver um instante parado, ou
  `?play` para ver ao vivo.
- O som pede um Python com numpy e scipy (`FAZERVIDEO_PY=/caminho/do/python`). Sem ele, o vídeo sai mudo e o
  script avisa.
- Erro no console da cena (bloco desconhecido, fonte que não carregou) para o render com código 3.
- Voz nova: escreva o `roteiro.json` (o da Sobrou está em `voz/sobrou/`), rode `scripts/voz.mjs gerar` e depois
  `voz.mjs ouvir … --palavras "Nome,Marca"` para conferir a pronúncia antes de renderizar.

## Variações que já saem só com parâmetros
- **Pedido → resposta em números** (o campo limpa um link colado e o total conta): exemplo Lumma.
- **Roleta de exemplos → pedido digitado → o produto responde** (lançamento de IA, busca, gerador): exemplo Sobrou.
- **Texto que conduz**: só blocos `frase` em sequência, com pílulas "não é X / é Y".
- **Jornada em pedidos**: vários blocos `pergunta` seguidos, cada um com o seu pedido e a sua resposta (cada
  bloco de 2,5–4 s), e uma `frase` de virada antes do `fecho`.

## Limites
- Duas caixas lado a lado com número (o A/B do KitKat) e a grade final de muitos resultados (v0) ainda não têm
  bloco: ficaram para a segunda versão.
- A resposta é redesenhada (cartões, números, linhas). Uma prova em tela real gravada ainda não entra no cartão.
- A legenda quebra em no máximo duas linhas. Fala muito longa vira vários blocos de legenda seguidos.
- Campo com texto mais longo que a caixa rola para a esquerda, como um campo de verdade. Abaixo de 70% do corpo o
  texto não encolhe mais: prefira pedidos de 2 a 8 palavras.
- Sem trilha musical: o som é voz + efeitos. A trilha da skill (`references/trilha.md`) entra por cima, se o pedido
  pedir.
