#!/bin/zsh
# Renderiza o teaser-de-luz de um arquivo de parâmetros: monta o projeto, faz a trilha com a voz (se a voz
# já foi gerada em <pasta>/projeto/voz/pt), renderiza cada formato a 60 fps, junta o som e tira a folha.
#   moldes/teaser-de-luz/render.sh exemplo.json ~/Desktop/teaser-lumma [16x9 9x16 1x1]
#   MODO=rascunho moldes/teaser-de-luz/render.sh …     → 30 fps rápido, para olhar
#   SUB=1 … → 60 fps sem motion blur (4× mais rápido que o padrão de 4 subquadros)
# A voz vem antes, uma vez: escreva <pasta>/projeto/voz/roteiro.json (ver MOLDE.md) e rode
#   node scripts/voz.mjs gerar <pasta>/projeto/voz/roteiro.json --saida <pasta>/projeto/voz/pt --takes <pasta>/projeto/voz/_takes
set -e
M=${0:A:h}; SKILL=${M:h:h}
J=${1:?uso: render.sh exemplo.json <pasta> [formatos]}; S=${2:?falta a pasta de saída}; shift 2
FORMATOS=(${@:-16x9 9x16}); MODO=${MODO:-final}; PY=${PYTHON:-${FAZERVIDEO_PY:-python3}}
mkdir -p $S; P=$S/projeto
node $M/montar.mjs $J $P
NOME=${${J:t}:r}
if [[ -f $P/voz/pt/locucao.json ]]; then
  mkdir -p $P/audio; $PY $M/trilha.py $J $P/voz/pt/locucao.json $P/audio/mix.wav
else
  echo "sem voz em $P/voz/pt: o vídeo sai mudo"
fi
for F in $FORMATOS; do
  if [[ $MODO == final ]]; then EXTRA=(--sub ${SUB:-4} --crf 16 --preset medium); else EXTRA=(); fi
  node $SKILL/scripts/render.cjs --projeto $P --modo $MODO --formato $F --saida out/$F.mp4 --sem-folha $EXTRA
  V=$P/out/$F.mp4; OUT=$S/$NOME-$F.mp4
  if [[ -f $P/audio/mix.wav ]]; then ffmpeg -v error -y -i $V -i $P/audio/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart $OUT
  else cp $V $OUT; fi
  D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $OUT)
  case $F in 16x9) SC=480:-1; TL=6x4;; 9x16) SC=270:-1; TL=8x3;; *) SC=360:-1; TL=6x4;; esac
  N=${TL/x/*}; ffmpeg -v error -y -i $OUT -vf "fps=$(( N ))/$D,scale=$SC,tile=$TL" -frames:v 1 $S/folha-$NOME-$F.png
  echo "vídeo: $OUT · folha: $S/folha-$NOME-$F.png ($D s)"
done
