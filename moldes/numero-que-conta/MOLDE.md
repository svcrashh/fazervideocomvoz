# Molde: número que conta

Um número grande, sozinho, que sobe até o valor final, e só depois o rótulo de três palavras que diz o que ele
conta. É a regra 5 do catálogo ("um número só, grande, com rótulo de 3 palavras prova mais que qualquer adjetivo")
virando vídeo de 6 a 20 s, ou bloco de abertura/fecho de outro molde.

Junta, do catálogo: número que conta (Stripe, Figma), número como refrão (Redmi), etiqueta antes → depois
(VALORANT), número que corre (Nubank) e conta que sobe. Ficha completa: `references/catalogo/` (estilo
"número que conta").

## Quando usar
- Fechar trimestre, ano ou update com um número verdadeiro: "12 novidades", "1.248 pedidos", "50+ melhorias".
- Prestar contas para cliente, investidor ou comunidade (Reels, feed 1:1, telão sem som).
- Mudança de parâmetro que tem número: limite, prazo, preço, peso, tempo ("2.739 KB → 1.060 KB").
- Gancho de 2 s antes de outro molde (lista que corre, capítulos).

## Quando NÃO usar
- Produto novo sem número próprio, ou número pequeno que soa como desculpa.
- Número inventado. Nunca: sem número verdadeiro, use outro estilo.
- Dinheiro de cliente, saúde, qualquer assunto em que contar soa como se gabar.
- Ensinar a usar (é tutorial: tela real com câmera).

## Blocos (a ordem é livre, 2 a 5 por vídeo)
| tipo | o que faz | duração padrão |
|---|---|---|
| `contador` | número sozinho conta de `de` até `ate` (1,35 s, com borrão de velocidade), fica sozinho até `sozinho` (1,6 s), encolhe e o `rotulo` sobe embaixo. Com `lista`, os itens rolam ao lado (16:9, 1:1) ou embaixo (9:16), o do meio aceso na cor de destaque | 4,6 s; com lista 2,9 s + 0,28 s por item |
| `cartoes` | 2 a 4 números, um por cartão de cor chapada (paleta `cores.cartoes`), entrando como tinta a partir de um canto; texto escolhe sozinho a cor legível | 0,25 s + `cada` (1,5 s) por item |
| `antes-depois` | etiqueta `NOME`, valor antigo que é riscado e apaga, seta, valor novo contando até o final, duas barras proporcionais e o rótulo-pílula (`2,6× mais leve`) | 4,4 s |
| `refrao` | o número repetido em faixas que correm em direções opostas, a do meio cheia na cor de destaque | 2,6 s |
| `fecho` | logo (imagem) ou o nome da marca na fonte do número, bordão e endereço | 2,8 s |

Por cima de tudo: a **chamada** (`chamada`) escrita no quadro 0 — a promessa — até o fim do primeiro bloco; e a
**legenda** de cada fala, palavra por palavra, no tempo da locução.

Cada bloco cresce sozinho para caber a fala: `em + duração da fala + 0,5 s`.

## Parâmetros (`exemplo.json`)
```jsonc
{
  "titulo": "…", "idioma": "pt-BR", "formatos": ["16x9", "9x16", "1x1"],
  "chamada": "Marca · o que este vídeo promete",        // quadro 0
  "lista_numerada": true,                                // "01 Layouts" na lista do contador
  "milhar": ".",                                         // separador de milhar
  "marca": {
    "nome": "…", "logo": "caminho/logo.png", "logoProporcao": 5.33,   // sem logo: o nome escrito na fonte do número
    "cores": { "fundo", "texto", "acento", "legendaFundo", "cartoes": ["#…", "#…"] },
    "fontes": { "numero": { "familia", "peso", "caixaAlta", "espaco" }, "texto": {…}, "etiqueta": {…} },  // Google Fonts
    "grade": true, "brilho": 0.13, "grao": 0.06
  },
  "voz": { "id", "nome", "perfil": "reels", "ajustes": { "speed": 1.06 }, "pronuncia": { "kit": "kít" } },
  "trilha": { "semente": 1001, "identidade": { "genero": "house", … } },   // assets/audio/API.md, identidade v2
  "blocos": [
    { "tipo": "contador", "de": 0, "ate": 12, "prefixo": "", "sufixo": "+", "casas": 0, "rotulo": "novidades no ar",
      "lista": ["…"], "sozinho": 1.6, "fala": "Doze novidades no seu press kit." },
    { "tipo": "cartoes", "cada": 1.5, "itens": [{ "valor": 33, "rotulo": "layouts prontos", "sufixo": " min", "casas": 1, "cor": "#…" }] },
    { "tipo": "antes-depois", "nome": "Peso da página", "de": 2739, "ate": 1060, "unidade": "KB", "rotulo": "2,6× mais leve", "fala": "…" },
    { "tipo": "refrao", "texto": "1.248 hortas" },
    { "tipo": "fecho", "bordao": "Tudo isso já está no ar.", "url": "lummaone.com/7" }
  ]
}
```
`fala` aceita texto ou `{ "texto", "em" }` (`em` = segundos depois do início do bloco; padrão: no contador, logo
depois do número ficar sozinho; nos outros, 0,45 s). Uma ou duas falas por vídeo: a voz fala 20–50% do tempo.

Exemplos: `exemplo.json` (Lumma One, escuro, Oswald/Rubik) e `exemplo-clara.json` (Brota, marca fictícia clara
de horta por assinatura, Bricolage Grotesque/Space Grotesk).

## Como renderizar
```zsh
PYTHON=<python com numpy e scipy> moldes/numero-que-conta/render.sh <parametros.json> <pasta-do-video> 16x9,9x16 final
```
Faz, em ordem: `preparar.mjs` (copia o molde e o `engine.js` da skill, baixa as fontes, escreve `params.js` e
`voz/roteiro.json`) → `voz.mjs gerar` (só o que não está no cache) → `voz.mjs ouvir` (transcrição) →
`preparar.mjs --locucao` (tempos das palavras na legenda, `audio/voz.wav`, `audio/folha.json`,
`audio/identidade.json`, `legenda.srt`) → `arranjo_serie.py` (trilha que cede à voz) → `render.cjs` por formato →
`finalizar.mjs` (confere duração, loudness, pico e a voz no AAC) → folha de quadros em `entrega/`.

Antes de gastar crédito, mostre o roteiro (as falas) para aprovar. Para olhar quadros soltos sem render:
`node scripts/quadros.cjs --projeto <pasta> --formato 9x16 --tempos 0,2,5`.

O `ouvir` compara número por extenso com o algarismo da transcrição ("Doze" = "12") e só roda de novo quando a
locução muda (cada transcrição custa crédito). O cache das falas fica em `<pasta-do-video>/voz/_takes`: numa pasta
nova, copie o `_takes` da anterior para não pagar as mesmas falas outra vez. Leia o `voz/pt/ouvido.md`.

## Formatos
16:9 (número até ~70% da altura útil, lista à direita), 9:16 (área segura do Reels, número em cima e lista
embaixo, legenda acima da faixa dos botões), 1:1 e 4:5 (como o 16:9, mais estreito). Recompostos, não recortados.

## Limites (o que o molde não faz)
- **Letreiro de oferta** (preço/prazo em carimbo com contorno, Mercado Livre) e **folha que sai da fenda**: não
  feitos. Hoje caem no `antes-depois` (prazo, preço) ou no `contador` com `prefixo: "R$"`.
- **Prova de tela**: o número não traz a tela do produto junto. Para mostrar onde o número mora, use o molde
  antes-e-depois ou lista-que-corre depois deste bloco.
- **Bloco dentro de outro molde**: o código é um bloco por cena (`BLOCOS[tipo](root, b)` em `molde.js`), mas outros
  moldes ainda não o importam (pedido ao integrador).
- Transição de "tinta" com textura (Figma): aqui é um círculo que cresce a partir de um canto.
- Número com mais de ~7 caracteres no 9:16 fica menor (cabe na largura, não na altura). Prefira "1,2 mi".
