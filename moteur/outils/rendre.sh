#!/bin/bash
# Compile le plan, rend la vidéo, masterise le son (CIBLE LUFS, défaut -10, crête -1 dBTP) et génère les planches de contrôle.
# Usage : [FORMAT=9x16|16x9|1x1|4x5] [CIBLE=-10] [ECHELLE=1] rendre.sh <dossier_montage> [--brouillon]
# Variables : CLIPLEX_STUDIO (studio Remotion installé), CLIPLEX_OUTILS (Python), CLIPLEX_SONS / CLIPLEX_MUSIQUE / CLIPLEX_NAVIGATEUR (facultatives).
set -e
ICI="$(cd "$(dirname "$0")" && pwd)"; M="$(cd "$1" && pwd)"; STUDIO="${CLIPLEX_STUDIO:-$ICI/../studio}"
PY="${CLIPLEX_OUTILS:-}/python/bin/python"; [ -x "$PY" ] || PY=python3
"$PY" -I "$ICI/compiler.py" "$M"
PUBLIC="$(dirname "$M")/.$(basename "$M").public"
SCALE=${ECHELLE:-1}; [ "$2" == "--brouillon" ] && SCALE=0.5
SORTIE="montage.mp4"; [ -n "$FORMAT" ] && [ "$FORMAT" != "9x16" ] && SORTIE="montage_${FORMAT}.mp4"; [ "$2" == "--brouillon" ] && SORTIE="${SORTIE%.mp4}_brouillon.mp4"
TL="$M/timeline.json"
N=$("$PY" -c "import json;print(json.load(open('$TL'))['timeline']['duree'])"); PAS=${MORCEAU:-900}
RENDU=(npx remotion render src/index.ts Montage --props="$TL" --public-dir="$PUBLIC" --log=error)
# CLIPLEX_NAVIGATEUR : navigateur de rendu à utiliser (sinon Remotion télécharge le sien)
[ -n "$CLIPLEX_NAVIGATEUR" ] && RENDU+=(--browser-executable="$CLIPLEX_NAVIGATEUR")
# Rendu par morceaux de PAS images (30 s), chacun relancé jusqu'à 3 fois ; les morceaux déjà rendus
# pour la même timeline sont gardés (reprise après une coupure).
E=$(cat "$TL" | md5)-$SCALE; [ "$(cat "$M/_morceaux/empreinte" 2>/dev/null)" == "$E" ] || rm -rf "$M/_morceaux"
mkdir -p "$M/_morceaux"; echo "$E" > "$M/_morceaux/empreinte"; : > "$M/_morceaux/liste.txt"
cd "$STUDIO"
for ((a=0; a<N; a+=PAS)); do
  b=$((a+PAS-1)); [ $b -ge $N ] && b=$((N-1)); f="$M/_morceaux/m_$(printf %06d $a).mp4"
  for essai in 1 2 3; do
    [ -f "$f" ] && break
    "${RENDU[@]}" "$f" --frames=$a-$b --muted --scale=$SCALE 2>&1 | grep -v "^    at" | grep -v "^\[http" | grep -v "^$" || true
    [ -f "$f" ] && break; echo "Morceau $a-$b : nouvel essai ($essai)"
  done
  [ -f "$f" ] || { echo "ÉCHEC DU RENDU (images $a-$b)"; exit 1; }
  echo "file '$f'" >> "$M/_morceaux/liste.txt"; echo "Images $((b+1)) / $N"
done
# son en une fois (rapide) puis assemblage sans réencodage de l'image
for essai in 1 2 3; do SANS_CRF=1 "${RENDU[@]}" "$M/_morceaux/son.wav" --codec=wav 2>&1 | grep -v "^    at" | grep -v "^$" || true; [ -f "$M/_morceaux/son.wav" ] && break; done
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "$M/_morceaux/liste.txt" -i "$M/_morceaux/son.wav" -map 0:v -map 1:a -c:v copy -c:a pcm_s16le "$M/_brut.mov"
[ -f "$M/_brut.mov" ] || { echo "ÉCHEC DU RENDU (assemblage)"; exit 1; }
ffmpeg -hide_banner -loglevel error -y -i "$M/_brut.mov" -c:v copy -c:a aac -b:a 320k "$M/_brut.mp4" && rm -rf "$M/_brut.mov" "$M/_morceaux"
[ -f "$M/_brut.mp4" ] || { echo "ÉCHEC DU RENDU"; exit 1; }
# Mastering son : normalisation loudness en 2 passes
J=$(ffmpeg -hide_banner -i "$M/_brut.mp4" -af loudnorm=I=${CIBLE:--10}:TP=-1:LRA=8:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | "$PY" -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -hide_banner -loglevel error -y -i "$M/_brut.mp4" -c:v copy \
  -af "loudnorm=I=${CIBLE:--10}:TP=-1:LRA=8:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 320k -movflags +faststart "$M/$SORTIE"
rm -f "$M/_brut.mp4"
# Contrôle : planches 2 images/s + mesure finale
mkdir -p "$M/controle"; rm -f "$M"/controle/*.jpg
ffmpeg -hide_banner -loglevel error -i "$M/$SORTIE" -vf "fps=2,scale=216:-2,tile=6x4:padding=4:color=white" -vsync vfr "$M/controle/planche_%02d.jpg"
ffmpeg -hide_banner -i "$M/$SORTIE" -af ebur128=peak=true -f null - 2>&1 | grep -A12 Summary | grep -E " I:| Peak:" | tr -s ' '
echo "OK → $M/$SORTIE"
