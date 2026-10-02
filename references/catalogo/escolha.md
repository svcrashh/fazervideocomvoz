# Como escolher o estilo

Três perguntas: **para quê** (objetivo), **onde vai passar** (canal) e **que produto/público**. A tabela 1 dá os
estilos em ordem de preferência; a tabela 2 puxa, tira e ajusta o tom; os atalhos resolvem os casos comuns.
O primeiro da célula é o recomendado; os outros são as alternativas que a skill mostra junto.
Os rótulos entre parênteses são as chaves do `scripts/recomendar-estilo.mjs`: os dois têm de bater.

## 1. Objetivo × canal

| Objetivo | Site, ajuda, YouTube (`site`) | WhatsApp (`whatsapp`) | Reels, TikTok, Shorts 9:16 (`reels`) | Feed, LinkedIn 1:1/4:5 (`feed`) | Telão 16:9 sem som (`telao`) |
|---|---|---|---|---|---|
| **Ensinar** (`ensinar`) | `tela-real-com-camera` · `antes-e-depois` (um passo só) · `texto-que-se-digita` (a ideia é difícil: explica antes do botão) | `tela-real-com-camera` (9:16, cartão de passo) · `antes-e-depois` · `lista-que-corre` | `tela-real-com-camera` (relâmpago, legenda karaokê) · `lista-que-corre` (dicas numeradas) · `antes-e-depois` | `lista-que-corre` (dicas numeradas, 4:5) · `tela-real-com-camera` (1:1) · `antes-e-depois` | tutorial não serve em telão sem som. Se insistirem: `lista-que-corre` (um cartaz por passo, sem câmera nem fala) · `numero-que-conta` · `antes-e-depois` |
| **Anunciar novidade** (`novidade`) | `lista-que-corre` (cartão-frase ou muro) · `capitulos-com-indice` (6 a 12 novidades) · `antes-e-depois` · `numero-que-conta` (mudou número ou regra) | `numero-que-conta` · `antes-e-depois` · `lista-que-corre` | `lista-que-corre` (rajada) · `antes-e-depois` · `numero-que-conta` | `lista-que-corre` (1:1/4:5) · `antes-e-depois` · `numero-que-conta` | `teaser-de-luz` · `lista-que-corre` (rajada) · `numero-que-conta` |
| **Lançar / vender** (`lancar`) | `lista-que-corre` (cartaz e prova) · `texto-que-se-digita` (produto com caixa de texto) · `teaser-de-luz` (público exigente, cara de evento) · `capitulos-com-indice` | `numero-que-conta` (oferta em letreiro) · `texto-que-se-digita` · `antes-e-depois` | `texto-que-se-digita` · `numero-que-conta` (refrão) · `lista-que-corre` (relâmpago) | `lista-que-corre` (cartaz e prova, 1:1) · `texto-que-se-digita` · `numero-que-conta` | `teaser-de-luz` (identidade nova, cara de evento) · `lista-que-corre` (frase que acende) · `numero-que-conta` |
| **Chamar atenção** (`atencao`) | `teaser-de-luz` · `antes-e-depois` (zoom-out que revela) · `texto-que-se-digita` | `antes-e-depois` · `numero-que-conta` · `texto-que-se-digita` | `antes-e-depois` · `texto-que-se-digita` · `numero-que-conta` | `numero-que-conta` · `antes-e-depois` · `teaser-de-luz` | `teaser-de-luz` · `numero-que-conta` · `antes-e-depois` |
| **Prestar contas** (`contas`) | `numero-que-conta` · `lista-que-corre` (muro) · `capitulos-com-indice` (resumo longo do ano) · `antes-e-depois` | `numero-que-conta` · `antes-e-depois` · `lista-que-corre` | `numero-que-conta` · `antes-e-depois` (o mesmo lugar, meses depois) · `lista-que-corre` | `numero-que-conta` · `lista-que-corre` (muro) · `antes-e-depois` | `numero-que-conta` · `lista-que-corre` (muro) · `teaser-de-luz` |

**Prestar contas não tem molde próprio.** O molde de prova social (depoimento, mural de respostas, case) ficou para
a segunda leva porque depende de material real de cliente. Hoje: `numero-que-conta` para o número, `lista-que-corre`
com o muro para o volume, `antes-e-depois` para a mudança. Diga isso ao usuário quando recomendar.

## 2. Tipo de produto e público

| Produto / público | Puxe para | Evite | Ajuste de tom |
|---|---|---|---|
| **B2B sério**: SaaS, ERP, painel, CRM (`b2b`) | `tela-real-com-camera` · `antes-e-depois` · `numero-que-conta` (sóbrio, antes → depois de limite) | `lista-que-corre` em rajada (< 1,5 s por item); humor de flagrante | uma cor de destaque, 2 s por item, o porquê antes do número |
| **Consumidor jovem**: rede, música, delivery, moda (`jovem`) | `texto-que-se-digita` · `lista-que-corre` (rajada) · `antes-e-depois` | `capitulos-com-indice` longo; `tela-real-com-camera` em tour lento | cor saturada, 0,8–1,2 s por item, piada a cada 3–4 itens |
| **Escola, serviço público, leigo** (`leigo`) | `tela-real-com-camera` (cartão de passo); para explicar uma ideia antes do botão, abra com `texto-que-se-digita` | `teaser-de-luz`; `lista-que-corre` em rajada | frase completa em cada passo, ritmo lento, "Pronto! É só isso." no fim |
| **Banco, finanças** (`financas`) | `tela-real-com-camera` · `numero-que-conta` (número que corre, sempre com contexto) | `teaser-de-luz`; humor de deboche e de flagrante | contido; número sempre com contexto; nada que pareça promessa de ganho |
| **Criador, DJ, marca pessoal** (`criador`) | `capitulos-com-indice` · `lista-que-corre` (vitrine do que se faz) · `numero-que-conta` | `tela-real-com-camera` em tour de SaaS | fotos e números da própria pessoa no palco |
| **Jogo, comunidade** (`jogo`) | `antes-e-depois` · `teaser-de-luz` · `lista-que-corre` (lista numerada); balanceamento com número: etiqueta `30 → 40` do `numero-que-conta` | `tela-real-com-camera` lento | aceita 220 palavras/min, cor da temporada, número da temporada fixo na abertura |
| **Loja, varejo, entrega** (`varejo`) | `numero-que-conta` (letreiro, refrão) · `antes-e-depois` | `teaser-de-luz` (abstrato demais para preço) | preço e prazo gigantes, refrão repetido |
| **Outro** (`outro`) | só a tabela 1 | nada | o tom sai da leitura da marca (`references/leitura.md`) |

Quando produto e canal discordam, o produto tira (coluna "Evite") e o canal ordena o que sobra.

## 3. Atalhos

- **Tutorial no computador** → `tela-real-com-camera`, sempre com a câmera indo até o campo da vez. Nunca a tela
  inteira.
- **Patch notes e o último vídeo do produto foi `capitulos-com-indice`** → `lista-que-corre` (cartão-frase ou muro);
  para Reels, `lista-que-corre` na velocidade rajada.
- **`capitulos-com-indice` nunca é recomendado duas vezes seguidas para o mesmo produto.** O script guarda o último
  estilo de cada produto (`recomendar-estilo.mjs --nome "Produto"` lê; `registrar --nome … --estilo …` grava depois
  da entrega). Sem histórico, procure o vídeo anterior (pasta do projeto, conversa) ou pergunte junto com a escolha.
  Se o usuário escolher capítulos de novo por conta própria, tudo bem: a regra é da recomendação.
- **O produto tem caixa de texto** (IA, busca, chat, cadastro) → `texto-que-se-digita` quase sempre é a melhor
  abertura, ou o vídeo inteiro (no script: `--caixa-de-texto`).
- **De 6 a 12 novidades para o site** → `capitulos-com-indice` sobe (no script: `--itens N`), salvo se foi o último.
- **Tem um número verdadeiro e forte** → `numero-que-conta` como vídeo próprio (6–20 s) ou como bloco de abertura ou
  fecho de qualquer outro molde.
- **O produto ainda não está no ar** (lançamento com data) → `teaser-de-luz`. Depois que lança, não: frustra quem
  quer ver.
- **WhatsApp** → 9:16, até 45 s, legenda grande, o "pronto" no fim; o celular de quem recebe é a tela.
- **O pedido traz uma ideia** (gancho, piada) **e pouca tela bonita** → escolha a ideia primeiro
  ([`sem-molde.md`](sem-molde.md#ideias)) e conte com `texto-que-se-digita` ou `lista-que-corre` (frase que acende).
- **O pedido cita um estilo que não tem molde** → [`sem-molde.md`](sem-molde.md) diz em qual molde ele cai; avise.
