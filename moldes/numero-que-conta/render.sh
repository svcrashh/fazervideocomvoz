#!/bin/zsh
# Do parâmetro ao vídeo entregue, com voz e trilha, num formato ou em vários.
#   moldes/numero-que-conta/render.sh <parametros.json> <pasta-do-video> [formatos] [rascunho|final]
#   ex.: render.sh exemplo.json ~/Desktop/lumma-numeros 16x9,9x16 final
# Passos: preparar → voz (só a que falta, pelo cache da skill) → ouvir (transcrição) → preparar com a locução →
# render de cada formato → folha de quadros → trilha (arranjo_serie com o bloco voz) → finalizar (confere a entrega).
# PYTHON (ou FAZERVIDEO_PY): um python com numpy e scipy (padrão: o python3 do sistema).
set -e
M=${0:A:h}; SKILL=${M:h:h}; S=$SKILL/scripts
PJ=${1:A}; D=${2:A}; FMTS=${3:-16x9,9x16}; MODO=${4:-final}
PY=${PYTHON:-${FAZERVIDEO_PY:-python3}}
[[ -f $PJ && -n $2 ]] || { echo "uso: render.sh <parametros.json> <pasta-do-video> [16x9,9x16] [rascunho|final]"; exit 1 }

node $M/preparar.mjs $PJ $D
if [[ -f $D/voz/roteiro.json ]]; then
  (cd $D && node $S/voz.mjs gerar voz/roteiro.json --saida voz/pt)
  # a transcrição custa crédito: só de novo quando a locução mudou depois do último ouvido.md
  if [[ ! -f $D/voz/pt/ouvido.md || $D/voz/pt/locucao.json -nt $D/voz/pt/ouvido.md ]]; then
    (cd $D && node $S/voz.mjs ouvir voz/pt/locucao.json || echo "AVISO: a transcrição falhou ou não ouviu uma palavra de risco — leia voz/pt/ouvido.md e a mensagem acima")
  fi
  node $M/preparar.mjs $PJ $D --locucao $D/voz/pt/locucao.json
  (cd $D/audio && $PY $SKILL/assets/audio/arranjo_serie.py identidade.json folha.json)
fi
NOME=${D:t}; mkdir -p $D/entrega
for F in ${(s:,:)FMTS}; do
  if [[ $MODO == final ]]; then EXTRA=(--sub 4 --crf 16 --preset medium); else EXTRA=(); fi
  node $S/render.cjs --projeto $D --modo $MODO --formato $F --saida out/$F.mp4 --sem-folha $EXTRA
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $D/out/$F.mp4)
  case $F in 16x9) SC=480:-1; TL=6x4;; 9x16) SC=270:-1; TL=8x3;; *) SC=360:-1; TL=6x4;; esac
  if [[ -f $D/audio/trilha.wav ]]; then
    node $S/finalizar.mjs --projeto $D --video out/$F.mp4 --audio audio/trilha.wav --saida $D/entrega/$NOME-$F.mp4 || echo "AVISO: o finalizar acusou algo acima"
    V=$D/entrega/$NOME-$F.mp4
  else V=$D/out/$F.mp4; fi
  ffmpeg -v error -y -i $V -vf "fps=24/$DUR,scale=$SC,tile=$TL" -frames:v 1 $D/entrega/folha-$F.png
  echo "✓ $V  ·  folha: $D/entrega/folha-$F.png"
done
