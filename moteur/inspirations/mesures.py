"""Rassemble les mesures d'une inspiration dans analyse/dossier.md (lu par Claude).
Usage : python mesures.py <dossier_analyse> <images_par_seconde>"""
import json, os, pathlib, re, sys
A = pathlib.Path(sys.argv[1]); fps = float(sys.argv[2])
f = json.loads((A / "format.json").read_text())
duree = float(f["format"]["duration"])
video = next((s for s in f["streams"] if s.get("codec_type") == "video"), {})
l, h = video.get("width", 0), video.get("height", 0)
coupes = [float(x) for x in (A / "coupes.txt").read_text().split()] if (A / "coupes.txt").exists() else []
# Coupes à moins de 0,12 s l'une de l'autre = une transition (flash, glitch), pas deux plans.
plans, prec = [], 0.0
for c in coupes:
    if c - prec >= 0.12: plans.append(round(c - prec, 2)); prec = c
plans.append(round(duree - prec, 2))
sil = re.findall(r"silence_(start|end): ([\d.]+)", (A / "silences.txt").read_text()) if (A / "silences.txt").exists() else []
blancs, debut = [], None
for k, t in sil:
    if k == "start": debut = float(t)
    elif debut is not None: blancs.append((debut, float(t))); debut = None

# Transcription horodatée (whisper local), phrase par phrase.
lignes = []
if (A / "audio.wav").exists():
    try:
        from pywhispercpp.model import Model
        modele = pathlib.Path(os.environ["CLIPLEX_OUTILS"]) / "modeles/ggml-large-v3-turbo-q5_0.bin"
        m = Model(str(modele), print_progress=False, print_realtime=False, redirect_whispercpp_logs_to=None)
        for s in m.transcribe(str(A / "audio.wav"), language=os.environ.get("CLIPLEX_LANGUE", "auto")):
            t = s.text.strip()
            if t and not re.fullmatch(r"[\[\(].*[\]\)]", t): lignes.append(f"{s.t0 / 100:7.2f}  {t}")
    except Exception as e:
        lignes.append(f"(transcription impossible : {e})")

def mmss(s): return f"{int(s // 60)}:{s % 60:05.2f}"
moy = sum(plans) / len(plans) if plans else duree
out = [
    "# Mesures de la vidéo",
    f"- Format : {l}x{h} ({'vertical' if h > l else 'horizontal' if l > h else 'carré'}), durée {mmss(duree)}",
    f"- Planches : analyse/planches/p*.jpg, 20 images par planche (5 colonnes, 4 lignes, lecture ligne par ligne), une image toutes les {1 / fps:.2f} s, soit {20 / fps:.0f} s par planche.",
    f"- Plans : {len(plans)}, durée moyenne {moy:.2f} s, plus court {min(plans):.2f} s, plus long {max(plans):.2f} s",
    f"- Coupes (s) : {', '.join(f'{c:.2f}' for c in coupes[:300])}",
    f"- Blancs de plus de 0,25 s : {len(blancs)}" + (f", par exemple {', '.join(f'{a:.1f}-{b:.1f}' for a, b in blancs[:30])}" if blancs else ""),
    "",
    "## Transcription (début en secondes)",
    *(lignes or ["(pas de voix détectée)"]),
]
(A / "dossier.md").write_text("\n".join(out) + "\n")
