"""Transcription fiable énoncé par énoncé, avec whisper (pywhispercpp) installé dans le dossier des outils.
Les segments de parole (vad.py) sont regroupés en énoncés (blanc < 0,45 s), chaque énoncé est transcrit
séparément : les horodatages ne peuvent plus dériver et chaque prise/reprise devient une ligne distincte.
Usage : python transcrire.py <dossier_rush> <id_rush> [prompt]"""
import json, os, pathlib, re, sys, wave
import numpy as np
from pywhispercpp.model import Model
MODELE = pathlib.Path(os.environ["CLIPLEX_OUTILS"]) / "modeles/ggml-large-v3-turbo-q5_0.bin"
d = pathlib.Path(sys.argv[1]); rush = sys.argv[2]
prompt = sys.argv[3] if len(sys.argv) > 3 else ""
segs = json.loads((d / "parole.json").read_text())["segments"]
enonces = []
for s, e in segs:
    if enonces and s - enonces[-1][1] < 0.45 and e - enonces[-1][0] < 28: enonces[-1][1] = e
    else: enonces.append([s, e])

with wave.open(str(d / "voix16k.wav")) as w:
    sr = w.getframerate()
    audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0

# Recherche en faisceau (5), comme whisper-cli : sans elle, le premier mot d'un long énoncé se perd parfois.
options = {"language": os.environ.get("CLIPLEX_LANGUE", "auto"), "token_timestamps": True, "max_len": 1, "split_on_word": True,
           "beam_search": {"beam_size": 5, "patience": -1.0}}
if prompt: options["initial_prompt"] = prompt
modele = Model(str(MODELE), params_sampling_strategy=1, print_progress=False, print_realtime=False, redirect_whispercpp_logs_to=None)

mots = []
for k, (s, e) in enumerate(enonces):
    a = max(0, s - 0.15); b = e + 0.15
    morceau = audio[int(a * sr):int(b * sr)]
    # whisper attend au moins 1 s de son : on complète par du silence
    if len(morceau) < sr: morceau = np.pad(morceau, (0, sr - len(morceau)))
    out = []
    for x in modele.transcribe(morceau, **options):
        t = x.text.strip()
        if not t or re.fullmatch(r"[\[\(].*[\]\)]", t): continue
        ws, we = a + x.t0 / 100, a + x.t1 / 100
        ws, we = max(ws, s - 0.05), min(we, e + 0.05)
        if not re.search(r"\w", t):
            if out: out[-1]["mot"] += t
            continue
        out.append({"rush": rush, "mot": t, "debut": round(ws, 3), "fin": round(max(we, ws + 0.05), 3), "enonce": k})
    mots += out
(d / "mots.json").write_text(json.dumps(mots, ensure_ascii=False, indent=0))
print(f"{len(enonces)} énoncés, {len(mots)} mots")
