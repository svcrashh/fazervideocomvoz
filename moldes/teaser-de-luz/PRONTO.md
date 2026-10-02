# PRONTO · teaser-de-luz (02/10/2026)

## O que tem na pasta
- `teaser.js`: a cena (uma só, do 0 ao fim, a luz é contínua), toda guiada por `PARAM`.
- `index.html`: o do template da skill, carregando `parametros.js` e `teaser.js`.
- `montar.mjs`: JSON → projeto (video.js, parametros.js, motor, mídia, fontes pelo `scripts/fontes.mjs`), e
  recusa parâmetros que não cabem (fragmento com menos de 1,8 s, tipo inexistente, sem promessa).
- `trilha.py`: trilha casada com os tempos do molde + voz por cima, cedendo 10 dB, saída em −16 LUFS.
- `render.sh`: montar → trilha → render 60 fps por formato → som → folha de quadros.
- `exemplo.json` (Lumma One) e `exemplo-pomar.json` (Pomar, marca fictícia clara: feira orgânica entregue
  em casa; verde-noite, tangerina, rosa; Bricolage Grotesque + Space Grotesk), mais `exemplo-midia/`.
- `MOLDE.md`: o que é, quando usar e quando não, parâmetros, variações, como renderizar, limites.

## O que foi provado
- **Duas marcas bem diferentes, mesmo código:** Lumma (interface escura, caixa alta em Oswald, luz laranja,
  tela real) e Pomar (interface clara em cartões creme sobre fundo escuro da marca, minúsculas, luz tangerina,
  tudo desenhado). Nada da marca está no `teaser.js`.
- **Tela real:** a página pública `lummaone.com/7` gravada com Playwright (só leitura, sem login, 2×), com
  `presskit_analytics_events` e `record_device` interceptados (5 eventos de analytics bloqueados, nenhum
  gravado). Ela aparece como fragmento em close (recorte do nome G7VEN e dos números) e como revelação rolando
  dentro do celular. Nada foi publicado; a `primoteste` e kits de DJ não foram tocados.
- **16:9 e 9:16 recompostos, não recortados:** no 16:9 os fragmentos alternam de lado e o "NOVO · nome" ocupa o
  lado vazio, o celular entra no centro e vai para a direita no fecho; no 9:16 o nome fica acima do fragmento,
  os fragmentos sangram sempre pela esquerda (longe dos botões do Reels) e o celular desce atrás do fecho.
- **Regras do catálogo:** promessa escrita no quadro 0 (grande, depois vira sobretítulo); fragmentos em close
  (1,35× do corpo de tela, nunca a tela inteira encolhida para ler); legenda em toda fala; a voz fala ~30% do
  tempo; bordão no fim ("Seu kit, de cara nova." / "A feira chega antes."); 15–16 s.
- **Checagem do motor** (`quadros.cjs --checar`, 10 instantes por segundo, linha do tempo inteira): nenhuma
  colisão e nada fora da área segura nos quatro (Lumma 16:9 e 9:16, Pomar 16:9 e 9:16). Antes de chegar nisso,
  ela pegou e eu corrigi: o atalho `font` zerando a altura de linha, a promessa e a legenda fora da área do
  Reels, o nome do fragmento passando da margem e o botão maior que o cartão no 9:16.
- **Voz:** ElevenLabs, voz Davi Andrei, duas falas por marca (79 créditos ao todo, uma tentativa só). Transcrição
  (`voz.mjs ouvir`): Lumma "O seu press kit de cara nova" e "Luma One. Veja em lumaone.com/7"; Pomar "A feira vem
  até você" e "Pomar. A feira chega antes". O conferidor marcou ✗ no endereço só pela grafia ("lumaone" contra
  "lummaone"): a pronúncia está certa (pedido anotado em `PEDIDOS-AO-INTEGRADOR.md`).
- **Mixagem medida:** −15,6 LUFS integrado no WAV, pico −1,5 dBFS (nos MP4 em AAC: Lumma −16,5, Pomar −16,9 LUFS); nos trechos com voz o nível fica 2–4 dB acima dos
  trechos só de música (a cama embaixo da voz cede 10 dB). A primeira versão tinha a música mais alta que a voz;
  corrigido e medido de novo.

## Vídeos de teste (`~/Desktop/moldes-teste/teaser-de-luz/`)
| Arquivo | Formato | Duração | Folha (olhada) |
|---|---|---|---|
| `lumma/exemplo-16x9.mp4` | 1920×1080, 60 fps, motion blur (4 subquadros) | 16 s | `lumma/folha-exemplo-16x9.png` |
| `lumma/exemplo-9x16.mp4` | 1080×1920, 60 fps, motion blur (4 subquadros) | 16 s | `lumma/folha-exemplo-9x16.png` |
| `pomar/exemplo-pomar-16x9.mp4` | 1920×1080, 60 fps, sem motion blur | 15 s | `pomar/folha-exemplo-pomar-16x9.png` |
| `pomar/exemplo-pomar-9x16.mp4` | 1080×1920, 60 fps, sem motion blur | 15 s | `pomar/folha-exemplo-pomar-9x16.png` |

A Pomar saiu com `SUB=1` (sem motion blur) porque a máquina estava dividida com as outras janelas e o render
com blur levava 12 min por formato; o molde é o mesmo, só o render ficou mais simples.

## O que ficou de fora
- No 9:16 o terço de baixo (y > 1450) fica escuro durante os fragmentos: é a faixa que a interface do Reels
  cobre. Para Stories ou um player sem interface por cima, dá para descer `zonaY` em `G['9x16']`.
- Vidro 3D, partículas e a parede de telas do Framer (fora do motor).
- 1:1 (a ficha não pede; a geometria é por formato em `G`, dá para acrescentar).
- Cartões "NOVO · ___" em sequência no fim, como o Raycast: o nome entra junto de cada fragmento.
- Texto longo dentro do fragmento não quebra linha (ver Limites no `MOLDE.md`).
- A trilha usa o ducking simples do próprio `trilha.py`, não o `mix_voz.py` (Contrato M) da skill.

## O que eu não consegui conferir
- **Som: não ouvi nada.** Volume, sincronia das falas com as legendas e o ducking foram medidos (loudness, RMS
  por trecho); o gosto da trilha e se o sopro de luz soa bem não foram.
- A datas e frases do Lumma são de exemplo ("OUTUBRO · 2026"): não é um anúncio real.
