# Render, verificação e entrega

## Tempos de referência (Mac M-series, 8 workers)

| Etapa | 8 s | 40 s |
|---|---|---|
| Quadros soltos (16) | ~10 s | ~10 s |
| Rascunho (30 fps, sem blur) | ~5 s | ~30 s |
| Final (60 fps, 8 subquadros) | ~80 s | ~6–7 min por formato |
| Trilha (arranjo.py) | segundos | segundos |

Rode o render final em segundo plano (`run_in_background`) e trabalhe em outra coisa, ou avise que está rodando. Com dois formatos, rode um depois do outro: em paralelo, os dois disputam CPU e ficam mais lentos.

## Disco

O render faz streaming pro ffmpeg e não grava quadros, então precisa de pouco espaço. As prévias (`previas/`) crescem: apague as antigas. Se o `ambiente.mjs` avisar pouco disco, não use `--sub` alto.

## Abrir para o usuário ver

| Sistema | Arquivo | Prévia ao vivo |
|---|---|---|
| macOS | `open arquivo.mp4` | `open -a "Google Chrome" "file://…/index.html?play"` (ou o navegador padrão) |
| Windows | `start "" arquivo.mp4` | `start chrome "file:///C:/…/index.html?play"` |
| Linux | `xdg-open arquivo.mp4` | `xdg-open "file://…/index.html?play"` |

Em sessão remota, sem tela, só diga o caminho.

## Verificação da entrega (`finalizar.mjs`)

O script sai com código 1 se algo falhar, e aí você não entrega. Ele confere:

- resolução e fps;
- duração do vídeo = duração do áudio = `VIDEO.duracao`, com tolerância de um quadro;
- loudness perto do alvo (-14 LUFS, o padrão de redes e streaming) e true peak ≤ -0,5 dBTP;
- que cada silêncio do `folha.json` continua silencioso no MP4 e que o som volta logo depois. É a prova de que a sincronia sobreviveu ao AAC.

Por conta sua, ainda:

- extraia 6–10 quadros do **MP4 final** (`ffmpeg -ss T -i final.mp4 -frames:v 1 x.png`) nos momentos de movimento rápido e olhe o motion blur;
- abra o pôster.

## Pasta de entrega

Padrão: `~/Desktop/<marca>-video/`. No Windows, a Área de Trabalho do usuário. Use outro lugar se ele pedir.

```
<marca>-video/
  <marca>-<nome>-16x9.mp4
  <marca>-<nome>-16x9-poster.png
  <marca>-<nome>-9x16.mp4
  <marca>-<nome>-9x16-poster.png
  README.md          ← formatos, roteiro (tabela), como refazer, o que é fictício
  leitura.md         ← a leitura do projeto: por que o vídeo é assim
  fonte/             ← o projeto inteiro, sem out/ e previas/ (e sem audio/.venv)
```

Não crie nada dentro de repositório git sem o usuário pedir, e não faça commit.

## O que dizer no fim

- Onde está cada arquivo e o formato de cada um.
- O que foi verificado, com os números medidos (duração, LUFS, true peak, sincronia).
- O que você não conseguiu verificar: você não assiste nem ouve, então peça um play, de preferência no aparelho onde o vídeo vai passar.
- Premissas assumidas (nomes fictícios, identidade provisória, música sintetizada) e o que a leitura marcou como palpite ou deixou como pergunta.
- 1 ou 2 extras que valem a pena:
  - **Corte de 15 s:** mesma trilha encurtada, gancho e assinatura.
  - **Outro formato.**
  - **GIF de prévia:** `ffmpeg -i v.mp4 -vf "fps=15,scale=720:-1:flags=lanczos,palettegen" p.png` e depois `paletteuse`.
  - **Vinheta de logo de 3 s:** reutiliza a cena de assinatura.
  - **Página privada pra compartilhar o vídeo:** se a ferramenta de Artifact existir.
