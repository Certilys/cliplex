"""Fabrique le kit d'effets sonores de Cliplex (whoosh, pop, clic, ding…), entièrement synthétisé ici :
aucun son de banque, donc libre comme le reste du dépôt. Écrit les .wav et kit.json à côté de ce fichier.
Usage : python3 fabriquer.py   (numpy seulement)"""
import json, pathlib, wave
import numpy as np

ICI = pathlib.Path(__file__).resolve().parent
SR = 48000
rng = np.random.default_rng(7)


def temps(d): return np.arange(int(SR * d)) / SR


def bruit(d): return rng.standard_normal(int(SR * d))


def bande(x, centres, octave=0.6):
    """Filtre passe-bande dont la fréquence centrale suit `centres` (une valeur par échantillon)."""
    N, H = 1024, 256
    fen = np.hanning(N)
    f = np.fft.rfftfreq(N, 1 / SR)
    x = np.concatenate([np.zeros(N), x, np.zeros(N)])
    c = np.concatenate([np.full(N, centres[0]), centres, np.full(N, centres[-1])])
    out, norme = np.zeros(len(x)), np.zeros(len(x))
    for i in range(0, len(x) - N, H):
        g = np.exp(-0.5 * (np.log2(np.maximum(f, 1) / c[i + N // 2]) / octave) ** 2)
        out[i:i + N] += np.fft.irfft(np.fft.rfft(x[i:i + N] * fen) * g) * fen
        norme[i:i + N] += fen ** 2
    return (out / np.maximum(norme, 1e-6))[N:-N]


def balayage(n, debut, pic, fin, p):
    """Fréquences (log) qui montent de `debut` à `pic` jusqu'à la part p du son, puis vont vers `fin`."""
    t = np.linspace(0, 1, n)
    m = np.where(t < p, np.log(debut) + (np.log(pic) - np.log(debut)) * (t / p) ** 1.5,
                 np.log(pic) + (np.log(fin) - np.log(pic)) * ((t - p) / (1 - p)))
    return np.exp(m)


def enveloppe(n, p, montee=2.0, descente=3.0):
    t = np.linspace(0, 1, n)
    return np.where(t < p, (t / p) ** montee, np.exp(-descente * (t - p) / (1 - p)) * (1 - (t - p) / (1 - p)) ** 0.5)


def sinus(freqs):
    return np.sin(2 * np.pi * np.cumsum(freqs) / SR)


def decroit(n, tau, attaque=0.001):
    t = np.arange(n) / SR
    return np.minimum(1, t / attaque) * np.exp(-t / tau)


def stereo(x, pan):
    """pan : -1 (gauche) à 1 (droite), une valeur par échantillon, à puissance constante."""
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1)


# ---------- les sons

def whoosh(d, bas, haut, fin, p=0.58, air=0.0, corps=0.5):
    n = int(SR * d)
    c = balayage(n, bas, haut, fin, p)
    x = bande(bruit(d), c, 0.55) + corps * bande(bruit(d), c * 0.35, 0.8) + air * bande(bruit(d), c * 2.5, 0.5)
    x *= enveloppe(n, p, 2.2, 3.5)
    return stereo(x, np.linspace(-0.55, 0.55, n))


def pop(f0, f1, tau=0.035):
    n = int(SR * 0.18)
    f = f1 + (f0 - f1) * np.exp(-np.arange(n) / SR / 0.012)
    x = (sinus(f) + 0.18 * sinus(2 * f)) * decroit(n, tau)
    x[:150] += bande(bruit(150 / SR), np.full(150, 4000), 1.0) * 0.25 * np.linspace(1, 0, 150)
    return x


def clic(f, tau=0.006):
    n = int(SR * 0.06)
    x = sinus(np.full(n, f)) * decroit(n, tau, 0.0003)
    x += bande(bruit(n / SR), np.full(n, f * 1.6), 0.9) * decroit(n, tau * 0.6, 0.0002) * 0.7
    return x


def cloche(f, partiels, d=1.3):
    n = int(SR * d)
    x = sum(a * sinus(np.full(n, f * r)) * decroit(n, tau, 0.002) for r, a, tau in partiels)
    return x


def faux():
    out = []
    for f in (330, 247):
        n = int(SR * 0.13)
        out.append(sum(sinus(np.full(n, f * h)) / h for h in (1, 3, 5)) * decroit(n, 0.06, 0.004))
        out.append(np.zeros(int(SR * 0.02)))
    return np.concatenate(out + [np.zeros(int(SR * 0.15))])


def notif():
    n = int(SR * 0.7)
    x = np.zeros(n)
    for k, f in enumerate((988, 1319)):
        d0 = int(SR * 0.09 * k)
        m = n - d0
        x[d0:] += (sinus(np.full(m, f)) + 0.12 * sinus(np.full(m, 2 * f))) * decroit(m, 0.16, 0.002)
    return x


def frappe(nb=12, graine=1):
    r = np.random.default_rng(graine)
    pos, ts = 0.02, []
    for _ in range(nb):
        ts.append(pos); pos += r.uniform(0.06, 0.15)
    x = np.zeros(int(SR * (pos + 0.1)))
    for t0 in ts:
        n = int(SR * 0.03); i = int(SR * t0); g = r.uniform(0.55, 1.0)
        k = bande(bruit(n / SR), np.full(n, r.uniform(1800, 3200)), 0.8) * decroit(n, 0.004, 0.0002)
        k += 0.5 * sinus(np.full(n, r.uniform(160, 230))) * decroit(n, 0.008, 0.0005)
        x[i:i + n] += g * k
    return x


def glitch(graine=3):
    r = np.random.default_rng(graine)
    morceaux = []
    for _ in range(9):
        n = int(SR * r.uniform(0.018, 0.04))
        if r.random() < 0.5:
            s = np.sign(sinus(np.full(n, r.uniform(180, 1600))))
        else:
            s = np.round(bruit(n / SR) * 3) / 3
        morceaux.append(s * r.uniform(0.4, 1.0) * np.hanning(n) ** 0.2)
        if r.random() < 0.35: morceaux.append(np.zeros(int(SR * 0.012)))
    return np.concatenate(morceaux) * 0.8


def impact():
    d = 1.0; n = int(SR * d)
    f = 42 + 70 * np.exp(-np.arange(n) / SR / 0.06)
    x = sinus(f) * decroit(n, 0.28, 0.001)
    x += 0.6 * bande(bruit(d), np.full(n, 260), 1.0) * decroit(n, 0.07, 0.0005)
    x += 0.3 * bande(bruit(d), np.full(n, 3000), 1.0) * decroit(n, 0.01, 0.0002)
    return x


def montee(d=1.6):
    n = int(SR * d)
    c = np.exp(np.linspace(np.log(300), np.log(6500), n))
    x = bande(bruit(d), c, 0.5) + 0.25 * sinus(c * 0.18)
    t = np.linspace(0, 1, n)
    x *= t ** 2.4 * np.minimum(1, (1 - t) * SR * d / (SR * 0.02))
    return stereo(x, np.linspace(-0.3, 0.3, n))


def piece():
    n = int(SR * 0.6); x = np.zeros(n)
    for k, f in enumerate((2093, 2637)):
        d0 = int(SR * 0.07 * k); m = n - d0
        x[d0:] += sum(a * sinus(np.full(m, f * r)) * decroit(m, tau, 0.0005) for r, a, tau in ((1, 1, .18), (1.47, .5, .12), (2.09, .35, .08), (2.56, .2, .05)))
    return x


def declencheur():
    n = int(SR * 0.2); x = np.zeros(n)
    for k, g in ((0, 1.0), (int(SR * 0.07), 0.7)):
        m = int(SR * 0.03)
        x[k:k + m] += g * bande(bruit(m / SR), np.full(m, 1500), 1.2) * decroit(m, 0.006, 0.0003)
    return x


# ---------- écriture

def niveau(x):
    """Ramène le son à un niveau perçu commun (RMS max sur 100 ms à -16 dBFS), crête à -1 dBFS au plus."""
    m = x if x.ndim == 1 else x.mean(axis=1)
    w = int(SR * 0.1)
    rms = np.sqrt(np.convolve(m ** 2, np.ones(w) / w, mode="same")).max()
    x = x * (10 ** (-16 / 20) / max(rms, 1e-9))
    crete = np.abs(x).max()
    if crete > 10 ** (-1 / 20): x *= 10 ** (-1 / 20) / crete
    return x


def ecrire(nom, x):
    x = niveau(x)
    # fondus de 2 ms pour ne jamais claquer
    f = int(SR * 0.002); r = np.linspace(0, 1, f)
    x[:f] = (x[:f].T * r).T; x[-f:] = (x[-f:].T * r[::-1]).T
    m = x if x.ndim == 1 else x.mean(axis=1)
    lisse = np.convolve(np.abs(m), np.ones(int(SR * 0.01)) / int(SR * 0.01), mode="same")
    with wave.open(str(ICI / f"{nom}.wav"), "wb") as w:
        w.setnchannels(1 if x.ndim == 1 else 2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    return {"fichier": f"{nom}.wav", "duree": round(len(x) / SR, 3), "pic": round(float(lisse.argmax()) / SR, 3)}


SONS = {
    # nom : (fabrication, famille, volume dans le mix, usage)
    "whoosh_1": (lambda: whoosh(0.62, 350, 2600, 900), "whoosh", .3, "passage d'un plan à l'autre, chapitre"),
    "whoosh_2": (lambda: whoosh(0.8, 250, 1800, 600, 0.62), "whoosh", .3, "transition plus ample"),
    "whoosh_3": (lambda: whoosh(0.45, 600, 3800, 1500, 0.55, air=0.3), "whoosh", .28, "transition vive"),
    "swoosh_1": (lambda: whoosh(0.34, 1500, 5200, 2600, 0.5, air=0.4, corps=0.15), "swoosh", .22, "encart ou carte qui glisse"),
    "swoosh_2": (lambda: whoosh(0.4, 1100, 4200, 2000, 0.55, air=0.3, corps=0.2), "swoosh", .22, "élément qui entre en douceur"),
    "pop_1": (lambda: pop(1400, 460), "pop", .28, "mot, idée qui apparaît"),
    "pop_2": (lambda: pop(1700, 560, 0.03), "pop", .28, "mot, idée qui apparaît"),
    "pop_3": (lambda: pop(1200, 380, 0.04), "pop", .28, "mot, idée qui apparaît"),
    "clic_1": (lambda: clic(2400), "clic", .3, "point d'une liste, bouton"),
    "clic_2": (lambda: clic(1900, 0.008), "clic", .3, "point d'une liste, bouton"),
    "clic_3": (lambda: clic(3100, 0.005), "clic", .28, "point d'une liste, bouton"),
    "ding_1": (lambda: cloche(1319, ((1, 1, .5), (2.0, .35, .3), (2.76, .2, .2), (4.07, .08, .1))), "ding", .25, "validation, bonne réponse"),
    "ding_2": (lambda: cloche(1568, ((1, 1, .45), (2.0, .3, .25), (3.0, .12, .15)), 1.1), "ding", .25, "validation, bonne réponse"),
    "faux": (faux, "faux", .22, "erreur, à ne pas faire"),
    "notif": (notif, "notif", .28, "notification, message"),
    "frappe": (frappe, "typing", .2, "texte tapé"),
    "glitch": (glitch, "glitch", .2, "coupure numérique (courts et pubs)"),
    "impact": (impact, "impact", .35, "révélation, chiffre fort"),
    "montee": (montee, "riser", .25, "tension avant une révélation (le pic est à la fin)"),
    "piece": (piece, "cash", .25, "argent, prix, compteur"),
    "declencheur": (declencheur, "shutter", .28, "capture d'écran, photo"),
}

if __name__ == "__main__":
    kit, familles = {}, {}
    for nom, (fab, fam, vol, usage) in SONS.items():
        kit[nom] = {**ecrire(nom, fab()), "volume": vol, "usage": usage}
        familles.setdefault(fam, []).append(nom)
    kit["_familles"] = familles
    kit["_licence"] = "Sons synthétisés par moteur/sons/fabriquer.py, sous la licence du dépôt (Apache 2.0)."
    (ICI / "kit.json").write_text(json.dumps(kit, indent=2, ensure_ascii=False) + "\n")
    print(f"{len(SONS)} sons écrits dans {ICI}")
