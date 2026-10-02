# Molde teaser-de-luz

Fundo escuro. Uma **linha de luz** entra, varre um **pedaço da interface** em close (que aparece atrás dela),
corre pela borda dele como um ponto de luz e salta para o pedaço seguinte. Depois de 2 a 5 pedaços, ela varre o
**produto inteiro** num celular (a câmera recua), e no fecho vai até o lugar do botão e **vira o botão** com o
endereço. É o molde "para ser lembrado": pouco texto, um bordão no fim, a luz como assinatura.

Junta as fichas "linha de luz" (Framer 3.0), "teaser de fragmentos" (Raycast) e
"revelação por partes" (Duolingo), do catálogo.

## Quando usar
- Versão grande, tema novo, temporada, "vem aí": app ou SaaS com interface que fica bonita de perto.
- Reels/TikTok, telão de evento, abertura de lançamento. 12 a 20 s.
- Marca de qualquer cor: a interface pode ser clara (os pedaços viram cartões claros sobre o fundo escuro da
  marca; ver o exemplo Pomar).

## Quando não usar
- Tutorial, passo a passo, explicação (vá de tela-real-com-camera).
- Público conservador ou leigo (banco, escola, serviço público): parece festa.
- Primeiro contato B2B frio: a pessoa precisa entender o que é antes de se interessar.
- Produto sem nada bonito de perto, ou update pequeno (vá de lista-que-corre).

## Estrutura (D = duração, N = número de fragmentos)
| Tempo | O que acontece |
|---|---|
| 0 | a **promessa** escrita grande no centro (regra 1: quadro 0 nunca vazio); a luz sobe do pé do quadro |
| 0,55–1,15 | a promessa encolhe para o sobretítulo no alto |
| 0,9 + i·FR | fragmento i: a luz cresce de ponto a barra, **varre** (0,15–0,8 s), o contorno se desenha; "NOVO · nome" sobe no lado vazio (16:9) ou acima (9:16); a microação do fragmento (número conta, campo se digita, linhas entram, botão acende); a luz corre pela borda; nos últimos 0,4 s o fragmento desfoca e a luz salta para o próximo |
| T_REV = 0,9 + N·FR | **revelação**: a luz varre o celular, a tela aparece, a câmera recua de 1,18× para 1×, a tela rola devagar |
| T_FECHO = T_REV + 3,8 | **fecho**: logo, frase (o bordão) palavra a palavra acendendo, data; a luz vai até o lugar do botão e vira o botão com o endereço |

`FR = (D − 0,9 − revelação − fecho) / N`; o `montar.mjs` recusa FR < 1,8 s. Com D = 16 e 3 fragmentos, FR ≈ 2,6 s.

## Parâmetros (`exemplo.json` = Lumma One · `exemplo-pomar.json` = marca fictícia clara)
| Campo | O que é |
|---|---|
| `marca`, `titulo`, `duracao`, `formatos` | `formatos`: `16x9`, `9x16` (recompostos, não recortados) |
| `plataforma` | opcional; `reels`/`youtube`… liga a área segura certa na checagem |
| `cores` | `fundo` (escuro da marca), `luz` (a cor da linha e do botão), `noLuz` (texto sobre a luz), `texto` |
| `ui` | a interface dos fragmentos: `superficie`, `superficie2`, `borda`, `texto`, `texto2`, `destaque`, `noDestaque`, `raio` |
| `fontes` | `titulo`, `texto`, `mono` (nomes do Google Fonts; o `montar.mjs` baixa) · `tituloCaixaAlta` |
| `logo` | `{ arquivo, altura }` (PNG/SVG) ou `{ texto }` |
| `promessa` | 3–6 palavras, aparece no quadro 0 |
| `etiqueta` | a palavra antes do nome do fragmento (`NOVO`) |
| `fragmentos[]` | 1–5 (3 é o certo). `nome` (2–3 palavras) + um `tipo`: |
| · `numero` | `titulo`, `valor`, `rotulo`, `casas` — o número conta |
| · `campo` | `rotulo`, `texto` (se digita), `ajuda` |
| · `lista` | `titulo`, `itens` (`"texto"` ou `["texto", "valor"]`), até 3 |
| · `botao` | `acima`, `texto`, `depois` — o botão acende no destaque ("toque") |
| · `imagem` | **tela real**: `arquivo`, `largura` (px do arquivo), `recorte` `[x, y, w, h]` — o close de um print |
| · `cartao` | `titulo`, `texto` |
| `revelacao` | `{ imagem: { arquivo, largura, altura, rolar: [de, até] } }` (print de celular, tela real) **ou** `{ fundo, blocos: [...] }` desenhados: `cabecalho`, `numero`, `lista`, `chips`, `botao` |
| `fecho` | `frase` (1–2 linhas; `*assim*` sai na cor da luz), `data`, `botao` (o endereço) |
| `falas[]` | `{ id, texto, em, ate }`: a legenda mostra o `texto` entre `em` e `ate`; a trilha põe a voz em `em` |
| `voz` | `id`, `nome`, `perfil`, `pronuncia` — copie-os para o `projeto/voz/roteiro.json`, escrito à mão (o `montar.mjs` não o escreve; sem ele o vídeo sai mudo) |
| `tempos` | opcional: `{ revelacao: 3.8, fecho: 3.6 }` · `zoomFragmento` (1,35) · `grade` (true) · `grao` |

Caminhos de mídia são relativos ao próprio JSON (ou com `~`); o `montar.mjs` copia para `midia/`.

## Como renderizar
```zsh
# 1. projeto + quadros soltos para olhar (rápido)
node moldes/teaser-de-luz/montar.mjs meu.json ~/Desktop/teaser/projeto
node scripts/quadros.cjs --projeto ~/Desktop/teaser/projeto --tempos 0,1.5,4,7,10,13 [--formato 9x16]
node scripts/quadros.cjs --projeto ~/Desktop/teaser/projeto --checar --qps 10 [--formato 9x16]
# 2. voz: roteiro.json em projeto/voz (falas com "onde": "abertura" e "fechamento"), depois
node scripts/voz.mjs gerar ~/Desktop/teaser/projeto/voz/roteiro.json --saida ~/Desktop/teaser/projeto/voz/pt --takes ~/Desktop/teaser/projeto/voz/_takes
node scripts/voz.mjs ouvir ~/Desktop/teaser/projeto/voz/pt/locucao.json --palavras Marca,Termo
#    ajuste em/ate das falas no JSON com a duração de cada fala (locucao.json)
# 3. tudo: trilha + voz, render 60 fps de cada formato, som junto, folha de quadros
PYTHON=<python com numpy e scipy> moldes/teaser-de-luz/render.sh meu.json ~/Desktop/teaser 16x9 9x16
```
A trilha (`trilha.py`) segue os tempos do molde: cama escura que abre até a revelação, um sopro em cada
varredura, impacto grave na revelação, brilho quando a luz vira botão; cede 10 dB sob a voz; −16 LUFS.

## Variações
- **Tela real ou desenhada:** fragmento `imagem` (close de um print gravado com Playwright) ou fragmentos
  desenhados; revelação com print rolando ou com blocos desenhados.
- **Interface escura** (Lumma: cartões da cor da noite, luz laranja) ou **clara** (Pomar: cartões creme sobre
  verde-noite, luz tangerina, destaque rosa).
- **Mais seco / mais longo:** 2 fragmentos e D = 12 (teaser de 12 s), ou 4–5 fragmentos e D = 20.

## Limites
- Sem vidro 3D, partículas ou parede de telas do Framer (fora do motor).
- A voz fala ~30% do tempo, só na promessa e no fecho: o meio é luz e música (de propósito).
- Texto do fragmento não quebra linha: rótulos longos (> ~22 caracteres no campo/lista) passam da caixa no 9:16.
  O botão se encolhe sozinho para caber; o nome do fragmento também.
- O print da revelação é a página inteira encolhida num celular: serve de imagem de impacto, não para ler.
  O que a voz cita tem de estar num fragmento (close), não só na revelação.
- 1:1 não implementado (a ficha não pede).
