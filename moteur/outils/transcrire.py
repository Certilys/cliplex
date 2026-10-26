"""Transcription fiable énoncé par énoncé.
Les segments de parole (vad.py) sont regroupés en énoncés (blanc < 0,45 s), chaque énoncé est transcrit
séparément par whisper : les horodatages ne peuvent plus dériver et chaque prise/reprise devient une ligne distincte.
Usage : python3 transcrire.py <dossier_rush> <id_rush> [prompt]"""
import json, os, pathlib, re, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
ICI = pathlib.Path(__file__).resolve().parent
MODELE = pathlib.Path(os.environ["CLIPLEX_OUTILS"]) / "modeles/ggml-large-v3-turbo-q5_0.bin"
d = pathlib.Path(sys.argv[1]); rush = sys.argv[2]
prompt = sys.argv[3] if len(sys.argv) > 3 else ""
segs = json.loads((d / "parole.json").read_text())["segments"]
enonces = []
for s, e in segs:
    if enonces and s - enonces[-1][1] < 0.45 and e - enonces[-1][0] < 28: enonces[-1][1] = e
    else: enonces.append([s, e])
tmp = pathlib.Path(tempfile.mkdtemp())

def run(k):
    s, e = enonces[k]
    a = max(0, s - 0.15); b = e + 0.15
    w = tmp / f"{k}.wav"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", str(d / "voix16k.wav"), str(w)], check=True)
    cmd = ["whisper-cli", "-m", str(MODELE), "-f", str(w), "-l", os.environ.get("CLIPLEX_LANGUE", "auto"), "-ml", "1", "-sow", "-ojf", "-of", str(tmp / str(k)), "-np"]
    if prompt: cmd += ["--prompt", prompt]
    subprocess.run(cmd, capture_output=True)
    out = []
    try: segs_w = json.loads((tmp / f"{k}.json").read_text(errors="ignore"))["transcription"]
    except Exception: return out
    for x in segs_w:
        t = x["text"].strip()
        if not t or re.fullmatch(r"[\[\(].*[\]\)]", t): continue
        ws, we = a + x["offsets"]["from"] / 1000, a + x["offsets"]["to"] / 1000
        ws, we = max(ws, s - 0.05), min(we, e + 0.05)
        if not re.search(r"\w", t):
            if out: out[-1]["mot"] += t
            continue
        out.append({"rush": rush, "mot": t, "debut": round(ws, 3), "fin": round(max(we, ws + 0.05), 3), "enonce": k})
    return out

with ThreadPoolExecutor(3) as ex: res = list(ex.map(run, range(len(enonces))))
mots = [w for r in res for w in r]
(d / "mots.json").write_text(json.dumps(mots, ensure_ascii=False, indent=0))
print(f"{len(enonces)} énoncés, {len(mots)} mots")
