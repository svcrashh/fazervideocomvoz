# Leitura do projeto

A leitura é um arquivo, `leitura.md`, escrito **antes** de qualquer decisão de imagem ou som, em
todo tipo de vídeo. Numa série, ele mora na pasta da série; num vídeo avulso, na pasta do projeto
do vídeo. Tudo o que o vídeo decide depois (fundo, legenda, título, fechamento, gênero da música)
aponta para uma linha dela.

## Sumário
1. Por que a leitura existe
2. Como fazer
3. O que conta como evidência
4. As sete seções, e por que cada uma existe
5. Leitura rasa × leitura
6. Armadilhas
7. Dois exemplos (inventados, de produtos opostos)

---

## 1. Por que a leitura existe

Dá para ler as cores, as fontes e o logo de um produto e, mesmo assim, entregar um vídeo que
serviria para qualquer outro: o mesmo fundo, a mesma legenda, a mesma moldura e uma música
"discreta" que não é de ninguém. Quem usa o produto percebe na hora. Uma cervejaria artesanal,
uma clínica pediátrica e uma transportadora podem ter o mesmo azul, e não têm nada mais em comum.

A falha não foi de gosto. Foi de ordem: as cores foram colhidas, mas ninguém escreveu **quem usa**,
**como o produto se parece além da paleta** e **o que esse público ouve** antes de decidir. Sem
isso escrito, o que decide é o padrão do motor, e o padrão do motor é a identidade de todo mundo.

Duas frases mostram a diferença:

- **Tinta:** "a marca é laranja".
- **Linguagem:** "o laranja é ação e item ativo, nunca fundo de área; sobre papel ele vira
  ferrugem (`--acao-no-papel`, `src/tema.css:31`)".

A primeira só permite pintar. A segunda diz onde o laranja entra no vídeo (o toque, o passo ativo),
onde ele nunca entra (o fundo do fechamento) e que cor ele vira sobre fundo claro. A leitura
existe para produzir frases do segundo tipo.

## 2. Como fazer

1. **Colha os fatos:** `node $SKILL/scripts/leitura.mjs <pasta-do-projeto> --saida <pasta-da-serie-ou-do-video>`.
   Ele escreve `leitura.bruta.json` e `leitura.bruta.md`: tokens de cor com o lugar onde cada um é
   usado, fontes, raios, sombras e bordas, superfícies, arquivos de marca, trechos de documentos
   que falam de público e produto, o vocabulário das telas, e os vídeos e séries que já existem.
   Ele não interpreta e não lê segredo. O bruto é o ponto de partida, não a leitura.
2. **Procure o que já existe antes de propor qualquer coisa.** O bruto lista, em "Vídeos e séries
   que já existem", as pastas `_serie/`, `serie.json`, `identidade.json` e vídeos no projeto, nas
   worktrees e branches do mesmo git e nas pastas irmãs (`produto-videos`, `produto-ajuda`). Abra
   cada uma: a identidade que ela usa, os roteiros, e se foi aprovada, publicada ou recusada (procure
   "recus", "aprov", "feedback" nos documentos dela). Uma série aprovada e publicada é a evidência
   mais forte que existe: a leitura diz se a nova continua ela ou por que não. Uma série recusada
   também: o que foi recusado vira proibição escrita. Propor uma identidade nova sem ter visto a que
   já está no ar faz o produto ter duas caras.
3. **Vá até a origem.** Para cada coisa que vai afirmar, abra o arquivo que o bruto aponta: o
   componente do botão, a barra de navegação, o fundo da página, o README, o documento de marca.
   Uma cor usada 40 vezes como `bg-` num `Button.tsx` e nenhuma vez em `body` diz um papel; o
   número sozinho não diz.
4. **Olhe o produto, se der.** Site público: um print de página inteira (só GET, `marca.md`). App
   que roda local: prints das telas principais. Num tutorial, a folha de toques do `--check` e da
   primeira gravação também é evidência da cara das telas. Prints e folhas ficam na pasta da
   leitura e são citados pelo caminho.
5. **Leia a conversa.** O que o usuário disse sobre o público, o gosto dele e o que recusou vale
   como evidência (cite a frase).
6. **Escreva as sete seções** (§4), com evidência em cada afirmação das seções 1 a 4.
7. **Mostre o essencial** no resumo do reconhecimento (SKILL.md, passo 0.1): produto, público, a
   cara em três linhas, o som em uma, e as perguntas da seção 7, que vão para o briefing.

A leitura cabe em uma ou duas páginas. Não é redação: é uma lista de fatos com o porquê.

## 3. O que conta como evidência

| Conta | Não conta |
|---|---|
| `arquivo:linha` com o caminho a partir da raiz do repositório (`src/index.css:31`, `docs/produto/PRODUTO.md:12`); fora dele, o caminho inteiro | "a marca parece moderna"; `PRODUTO.md:12` quando o arquivo está em `docs/produto/` |
| endereço público (`https://produto.com/precos`), com o que se viu nele | o nome do produto ("o nome soa noturno") |
| um print ou folha que você gerou, pelo caminho (`leitura/home.png`) | o que "produtos da categoria costumam fazer", sem dizer que é conhecimento geral |
| uma frase do usuário nesta conversa, entre aspas | o padrão do motor ("o tutorial já vem com cartão branco") |
| pesquisa na web, com o endereço | o exemplo que vem com a skill |

Conhecimento geral é permitido onde o repositório não alcança, principalmente na seção 4 (as
convenções de um gênero musical não estão no código de ninguém). Nesse caso, escreva
**"conhecimento do gênero"** ou **"palpite"** no lugar da evidência. O que não pode é palpite sem
nome: ele vira premissa escondida, e premissa escondida é o que faz uma série inteira sair errada sem ninguém perceber.

A dúvida da fonte viaja com a evidência. Se o documento diz que aquilo é "premissa", "rascunho",
"a confirmar" ou "proposta", a leitura escreve isso junto ("tom de voz: direto e próximo, premissa
ainda não confirmada em `docs/visao.md:50`"), e o item vai também para a seção 7. Uma premissa do
projeto citada como fato vira certeza que ninguém deu.

## 4. As sete seções

### 1. O produto
**Responde:** o que é, numa frase, com as palavras que o público usa.
**Por quê:** a frase do produto decide o que é o "gesto" dos vídeos e o vocabulário das legendas.
Escrita com as palavras do público ("fechar o caixa", não "conciliar recebíveis"), ela
também impede o vídeo de soar como material de venda genérico.
**Onde achar:** `description` do pacote, `<title>`, README, landing, vocabulário das telas no
bruto (as frases que mais aparecem são as palavras do produto).

### 2. O público
**Responde:** quem é, o que faz, o que consome, onde vai assistir, o que acharia falso.
**Por quê:** é o público que decide o gênero da música, o registro dos textos e o que "parece de
verdade". "O que acharia falso" é a pergunta mais útil: quem vive de pista acha falsa uma cama de
lounge genérica; um mecânico acha falso um vídeo com cara de anúncio de banco; um gamer acha falso
um visual de spa. Escreva isso antes de escolher, e a escolha sai sozinha.
**Onde achar:** documentos de visão, persona, planos, CLAUDE.md, textos da landing, os papéis que
o sistema tem (atendente, gerente, organizador), o idioma e o tom das telas. **Onde vai
assistir** muda o vídeo: dentro do app, numa central de ajuda, no Instagram, num grupo de WhatsApp.
Um público não é uma categoria: "comerciantes" pode ser dono de mercearia ou de loja de grife. Se o
repositório não diz qual, isso é pergunta da seção 7.

### 3. A cara do produto
**Responde**, uma linha por item, cada uma com evidência:
- **Superfície:** clara, escura, ou as duas, e onde cada uma aparece (a landing é escura, o painel
  é claro; o modo escuro existe mas não é o padrão).
- **Cor:** o **papel** de cada cor (palco, tinta, sinal de ação, item ativo, alerta, apoio), **onde
  ela é proibida** e como ela muda de uma superfície para outra. Proibição é fato: se uma cor nunca
  aparece como fundo de área em nenhuma tela, ela não vira fundo de área no vídeo.
- **Tipografia:** família, peso, caixa (alta ou normal), espaçamento entre letras, tamanho relativo
  do título. Uma marca de títulos em caixa alta condensada com tracking largo pede outro título de
  vídeo que uma de serifada em caixa baixa.
- **Forma:** raios (quadrado, 8 px, pílula), **borda ou sombra** (fio de 1 px ou sombra longa),
  chapado ou com gradiente.
- **Densidade:** muita informação por tela ou muito respiro; texto pequeno e tabelas ou blocos
  grandes.
- **Textura e grade:** grão, papel, ruído, linhas de grade, pontos, ou nada.
- **Fotografia:** tem fotos? de quê (pessoas, equipamento, lugar)? recortadas, sangradas, em
  moldura, em preto e branco?
- **Movimento:** o que a interface já faz (transições curtas e secas, molas, nada).

**Por quê:** esta seção é o que o vídeo copia da linguagem, e não só da tinta. Cada elemento do
visual de uma série (fundo, moldura, legenda, selo, título, abertura, fechamento, realce, indicador)
se decide olhando um item daqui. Sem ela, só há onde pôr quatro cores, e o resto sai do padrão.
**Onde achar:** no bruto, `cores` (com contexto e arquivos que mais usam cada cor), `superficies`,
`fontes`, `tipografia`, `forma`, `densidade`; depois, os componentes que ele aponta e os prints.

### 4. O som do público
**Responde:** o que esse público ouve, as convenções do gênero (andamento, groove, timbres), e o que
envergonharia a marca.
**Por quê:** o **gênero** é decisão de público; o **papel** da música (de fundo ou protagonista:
quão alto, quão cheio, quanto espaço deixa para a leitura) é decisão do tipo de vídeo. Misturar os
dois foi o erro: "tutorial pede música de fundo" virou "tutorial pede uma cama genérica sem bumbo".
De fundo é volume e densidade, não gênero. Para quem vive de forró, uma cama de fundo pode ser um
xote com a zabumba contida; para quem vive de pista, um quatro por quatro com o bumbo baixo. Uma
cama "neutra", sem gênero, é o que os dois achariam falso.
**Onde achar:** o repositório às vezes fala de música (gêneros, links de SoundCloud, eventos,
playlists — o bruto colhe isso em `som`). O resto vem da conversa, da pesquisa na web
(`trilha.md` §1) ou do conhecimento do gênero, marcado como tal. Escreva as convenções com números:
"xote: 80–100 BPM, zabumba no tempo e no contratempo, triângulo em semicolcheias, sanfona na
melodia".
**O que envergonharia:** o erro que o público notaria em um segundo (uma faixa de pista mal
sintetizada, uma música infantil para adolescentes, uma trilha épica para um app de contas).

### 5. Decisões
**Responde:** cada elemento do visual e a identidade da música, com o porquê de cada um apontando
para as seções 1 a 4.
- **Série (tutorial ou campanha):** os elementos do visual declarados em `serie.json` (fundo,
  moldura, legenda, selo, título, abertura, fechamento, realce, indicador, com as opções de
  `references/tutorial.md`) e a identidade musical em `identidade.json` (papel, gêneros e grooves
  aceitos, andamento, timbres, com os campos de `references/trilha.md` §9).
- **Vídeo avulso:** o papel de cada cor no vídeo, a tipografia, a forma e a textura, o tipo de
  imagem (tela real, UI recriada, tipografia), o que o conceito não pode ter, e a direção musical.

Formato de cada linha: **decisão — porque (seção, evidência)**. Exemplo: "legenda em faixa escura
na base, sem cartão — as telas são escuras e densas (§3, `src/App.css:12`), um cartão branco
estouraria sobre elas". Uma decisão que coincide com o padrão do motor precisa do mesmo porquê: se
ele não existe, o padrão está decidindo por você.

### 6. Teste da troca
**Responde:** "se eu trocar o logo e o nome pelos de outro produto, o vídeo ainda serve?" Faça a
troca de verdade, com um produto de outro mundo (um app de clínica, um jogo, uma escola), e diga o
que torna a confusão impossível: pelo menos três elementos que só este produto pediria.
**Por quê:** é o teste que um vídeo genérico reprova. Se o que separa este vídeo de outro são
só as cores e o logo, a identidade ainda é a do motor. Volte à seção 5.

### 7. O que não deu para saber
**Responde:** o que o repositório, o site e a conversa não disseram e que mudaria o vídeo (qual
recorte do público, se a marca tem som, se o modo escuro é o padrão, se a foto de pessoas é
permitida, se a série que já existe continua ou é substituída).
**Por quê:** o que não se sabe e não se escreve vira suposição calada. Cada item vira pergunta no
briefing, com opções tiradas do que você achou. Sem como perguntar, vira **premissa declarada** no
topo da entrega, com o que mudaria se ela estiver errada.

## 5. Leitura rasa × leitura

| Rasa | Leitura |
|---|---|
| "Cores: vermelho #F85149, cinza #0D1117." | "Palco: cinza-noite `#0D1117`, fundo de todo o app (`src/theme.ts:3`). Alerta: vermelho, só no selo de incidente ativo (`IncidentBadge.tsx:7`; 0 usos como fundo de área ou botão). Nenhuma cor de marca em botão." |
| "Fonte: Nunito." | "Títulos em Nunito 800, caixa normal, grandes: `text-3xl` é o menor título (64 usos, `src/**`); nenhum `uppercase` no app." |
| "Público: comerciantes." | "Donos de mercearia de 40 a 65 anos, no balcão (`docs/pesquisa-campo.md:10-22`); assistem no WhatsApp com som ligado (`docs/pesquisa-campo.md:31`)." |
| "Música: acústica de fundo." | "Forró e sertanejo do rádio do balcão (palpite, vai para a seção 7). Papel de fundo: sanfona e zabumba contidas, sem refrão cantado. Envergonharia: eletrônico frio de startup." |

## 6. Armadilhas

- **Colar o bruto e chamar de leitura.** O bruto tem fatos sem papel; a leitura tem o papel de
  cada fato.
- **Aceitar o padrão do motor sem declarar.** Formas que respiram, selo em pílula, janela com as
  bolinhas do macOS, cartão branco que vira, íris na cor da marca: tudo isso é o que o motor
  desenha quando ninguém decide. Pode servir a um produto, mas só com um porquê da seção 3.
- **Confundir papel com gênero** (seção 4).
- **Tirar o público do nome ou da cor do produto.** O público está nos documentos, nos papéis do
  sistema e na conversa. Se não está, é pergunta.
- **Copiar outro vídeo.** O último que você fez, o de um concorrente, o de outra série do mesmo
  usuário: nenhum é referência de estilo para este.
- **Evidência de enfeite:** um caminho de arquivo que não sustenta a frase. Se abrir a linha e ela
  não disser o que você escreveu, a frase é palpite.

## 7. Dois exemplos

Inventados e curtos. Os caminhos são de repositórios que não existem; o formato é o que vale.

### Exemplo A · "Caderneta", fiado digital para mercearia de bairro

**1. O produto.** "Anotar o fiado no celular e cobrar pelo WhatsApp" (`README.md:3`; as telas dizem
"anotar", "quem deve", "cobrar", `src/i18n/pt.json:4-40`).

**2. O público.** Donos de mercearia e padaria, 40 a 65 anos, balcão cheio, celular Android simples
(`docs/pesquisa-campo.md:10-22`). Assistem no WhatsApp, com som ligado, no intervalo do movimento
(`docs/pesquisa-campo.md:31`). Achariam falso: cara de banco digital, inglês, gente de terno.

**3. A cara.** Superfície clara, papel pautado creme `#FFF8E7` em todas as telas
(`src/styles/base.css:4`), sem modo escuro. Verde-folha `#2E7D32` só em "pago" e no botão
"anotar" (`Button.tsx:11`); vermelho-tijolo só em "deve", nunca em botão. Títulos em Nunito 800,
caixa normal, grandes (`text-3xl` é o menor título, 64 usos). Borda de 2 px escura, raio 12, sem
sombra (`base.css:18-30`; 0 `shadow-`). Pouca informação por tela, números grandes. Textura de
papel pautado no fundo (`public/pauta.png`). Sem fotos.

**4. O som.** Rádio AM e FM popular no balcão: forró, sertanejo, pagode (palpite; confirmar na
seção 7). Envergonharia: eletrônico frio, trilha "startup".

**5. Decisões.** Fundo de papel pautado (§3 textura); legenda em faixa na base, letra grande, borda
de 2 px, sem cartão flutuante (§3 forma e densidade; o público lê devagar, §2); realce do toque em
contorno verde, grosso (§3 cor); fechamento claro com o logo em cores, nunca em verde chapado de
área (§3). Música: papel de fundo; gênero xote ou arrasta-pé acústico, sanfona e zabumba, 90–100
BPM (§4, a confirmar).

**6. Teste da troca.** Com o logo de um app de academia, sobrariam o papel pautado, a faixa de
legenda com borda grossa e a sanfona: ninguém usaria para academia. Passa.

**7. Não deu para saber.** O público é do Nordeste, do Sudeste ou dos dois? Isso muda o gênero.
A marca aceita foto de balcão real?

### Exemplo B · "Vigia", painel de plantão para times de infraestrutura

**1. O produto.** "Ver o que caiu, quem está de plantão e silenciar o alerta" (`README.md:1`; telas:
"incidente", "reconhecer", "escalar", `src/components/**`).

**2. O público.** Engenheiros de SRE e plataforma, de madrugada, em monitor grande
(`docs/personas.md:5-19`). Assistem na documentação e no canal interno, sem som na maioria das vezes
(palpite). Achariam falso: animação fofa, cores de doce, texto de marketing.

**3. A cara.** Superfície escura `#0D1117` em todo o app (`src/theme.ts:3`), clara só no e-mail de
aviso. Cinzas em quatro níveis carregam a interface; vermelho `#F85149` só em incidente ativo
(`IncidentBadge.tsx:7`), âmbar em aviso; nenhuma cor de marca em botão. JetBrains Mono em números e
horários, Inter 500 no resto, caixa normal, tamanhos pequenos (`text-sm` é o mais usado, 410 usos).
Fio de 1 px `#30363D`, raio 6, sem sombra (`theme.ts:30-44`). Muito densa: tabelas e linhas do
tempo. Grade de fundo sutil nos gráficos. Movimento seco, 120 ms, sem mola (`theme.ts:52`).

**4. O som.** Eletrônica que se ouve trabalhando: ambient, techno minimalista, synthwave
(conhecimento do gênero; confirmar). Envergonharia: melodia chamativa ou trilha heroica.

**5. Decisões.** Fundo escuro liso com a grade dos gráficos (§3); moldura em fio de 1 px, sem as
bolinhas do macOS (§3 forma); legenda solta em mono, sem cartão (§3 densidade e tipografia); realce
em cantos, não em contorno cheio (a UI já é cheia de caixas); fechamento em corte seco, sem íris
(§3 movimento). Música: papel de fundo; techno minimalista a 118–124 BPM, bumbo seco e baixo, pulso
de sintetizador, sem melodia (§4).

**6. Teste da troca.** Com o logo da Caderneta, nada serve: a mono, o fio, a grade e o techno seco
são deste mundo. Passa.

**7. Não deu para saber.** O vídeo passa com som em algum lugar? Se nunca, a música pode ser
opcional. A marca tem cor própria fora do vermelho de incidente?
