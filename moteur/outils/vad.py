"""Détection de parole par énergie, calibrée sur le bruit de fond réel du rush.
Écrit les blancs au format silencedetect (silences.txt) pour le compilateur, + parole.json.
Usage : python3 vad.py <voix16k.wav> <dossier_rush>"""
import json, sys, wave, pathlib
import numpy as np
w = wave.open(sys.argv[1]); sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
hop = int(sr * 0.01)
n = len(x) // hop
rms = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-10)
db = 20 * np.log10(rms)
# lissage 30 ms
db = np.convolve(db, np.ones(3) / 3, mode="same")
bruit, voix = np.percentile(db, 12), np.percentile(db, 90)
seuil = bruit + max(6.0, (voix - bruit) * 0.30)
actif = db > seuil
# hystérésis : combler les trous < 120 ms, ignorer les éclats < 60 ms
def runs(a):
    out, s = [], None
    for i, v in enumerate(a):
        if v and s is None: s = i
        if not v and s is not None: out.append([s, i]); s = None
    if s is not None: out.append([s, len(a)])
    return out
seg = runs(actif)
fus = []
for s, e in seg:
    if fus and s - fus[-1][1] < 12: fus[-1][1] = e
    else: fus.append([s, e])
fus = [[s, e] for s, e in fus if e - s >= 6]
d = pathlib.Path(sys.argv[2])
(d / "parole.json").write_text(json.dumps({"bruit_db": round(float(bruit), 1), "voix_db": round(float(voix), 1), "seuil_db": round(float(seuil), 1),
                                           "segments": [[round(s / 100, 2), round(e / 100, 2)] for s, e in fus]}))
lignes = []
prev = 0.0
for s, e in fus:
    if s / 100 - prev >= 0.15: lignes.append(f"silence_start: {prev:.3f}\nsilence_end: {s / 100:.3f} | silence_duration: {s / 100 - prev:.3f}")
    prev = e / 100
lignes.append(f"silence_start: {prev:.3f}\nsilence_end: {n / 100:.3f}")
(d / "silences.txt").write_text("\n".join(lignes))
print(f"bruit {bruit:.1f} dB, voix {voix:.1f} dB, seuil {seuil:.1f} dB → {len(fus)} segments de parole, {len(lignes)} blancs")
