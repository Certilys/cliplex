"""Nettoie la sortie whisper.cpp en liste de mots horodatés, puis fusionne tous les rushes
en un transcript numéroté (transcript.txt) que le monteur utilise pour écrire plan.json."""
import json, sys, pathlib, re

def nettoyer(src, dst, rush):
    segs = json.loads(pathlib.Path(src).read_text(errors="ignore"))["transcription"]
    mots = []
    for s in segs:
        t = s["text"].strip()
        if not t or re.fullmatch(r"[\[\(].*[\]\)]", t): continue          # [Musique], (rires)…
        a, b = s["offsets"]["from"] / 1000, s["offsets"]["to"] / 1000
        if not re.search(r"\w", t):                                        # ponctuation seule → collée au mot précédent
            if mots: mots[-1]["mot"] += t
            continue
        mots.append({"rush": rush, "mot": t, "debut": round(a, 3), "fin": round(max(b, a + 0.05), 3)})
    pathlib.Path(dst).write_text(json.dumps(mots, ensure_ascii=False, indent=0))

def fusion(m):
    m = pathlib.Path(m); tous = []
    for f in sorted(m.glob("r*/mots.json"), key=lambda p: int(p.parent.name[1:])):
        tous += json.loads(f.read_text())
    for i, w in enumerate(tous): w["i"] = i
    (m / "mots.json").write_text(json.dumps(tous, ensure_ascii=False, indent=0))
    # transcript lisible : une ligne par phrase, préfixée par l'index du 1er mot et le temps source
    lignes, cur = [], []
    for w in tous:
        if cur and (w["rush"] != cur[-1]["rush"] or w.get("enonce") != cur[-1].get("enonce") or w["debut"] - cur[-1]["fin"] > 0.7): lignes.append(cur); cur = []
        cur.append(w)
        if w["mot"].endswith((".", "?", "!")): lignes.append(cur); cur = []
    if cur: lignes.append(cur)
    out = []
    for l in lignes:
        pause = ""
        out.append(f"#{l[0]['i']:>4}-{l[-1]['i']:<4} {l[0]['rush']} {l[0]['debut']:7.2f}-{l[-1]['fin']:7.2f}  " +
                   " ".join(f"{w['mot']}" for w in l))
    (m / "transcript.txt").write_text("\n".join(out))
    # version détaillée mot par mot
    (m / "transcript_mots.txt").write_text("\n".join(f"{w['i']:>4} {w['rush']} {w['debut']:7.2f} {w['fin']:7.2f} {w['mot']}" for w in tous))

if __name__ == "__main__":
    if sys.argv[1] == "--fusion": fusion(sys.argv[2])
    else: nettoyer(*sys.argv[1:4])
