#!/usr/bin/env bash
# Пережимает видео проекта для сайта: обрезает чёрные поля и полосу записи экрана,
# убирает звук, делает H.264 (везде) и VP9 (легче) в двух ширинах плюс кадр-заставку.
# Нужен ffmpeg. Запуск: bash scripts/video.sh media/source/drilltrace.mp4 drilltrace
set -euo pipefail
SRC="${1:-media/source/drilltrace.mp4}"
NAME="${2:-drilltrace}"
CROP="${CROP:-crop=1894:932:24:76}"   # для этой записи: поля 76 px сверху, ~72 снизу и по 24 по бокам
POSTER_AT="${POSTER_AT:-10}"
OUT=public/media
mkdir -p "$OUT"

for W in 1600 960; do
  ffmpeg -v error -y -i "$SRC" -an -vf "$CROP,scale=$W:-2:flags=lanczos" \
    -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart "$OUT/$NAME-$W.mp4"
  ffmpeg -v error -y -i "$SRC" -an -vf "$CROP,scale=$W:-2:flags=lanczos" \
    -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -deadline good -cpu-used 2 "$OUT/$NAME-$W.webm"
done
ffmpeg -v error -y -ss "$POSTER_AT" -i "$SRC" -frames:v 1 -vf "$CROP,scale=1600:-2:flags=lanczos" "$OUT/$NAME-poster.png"
node -e "const s=require('sharp');(async()=>{await s('$OUT/$NAME-poster.png').webp({quality:78}).toFile('$OUT/$NAME-poster.webp');await s('$OUT/$NAME-poster.png').avif({quality:55}).toFile('$OUT/$NAME-poster.avif')})()"
rm "$OUT/$NAME-poster.png"
ls -la "$OUT"
