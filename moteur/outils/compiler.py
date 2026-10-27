"""Compile un plan de montage (plan.json, ancré sur les index de mots) en timeline image par image
pour le moteur Remotion (<dossier_montage>/timeline.json, passé au rendu en paramètre).

Usage : python3 compiler.py <dossier_montage>

Principe : le monteur choisit QUOI garder (plages de mots) et OÙ placer les effets (sur un mot).
Le compilateur calcule les points de coupe exacts (calés sur les silences réels de la voix),
supprime les blancs, alterne les cadres à chaque jump cut, convertit tout en images et pose
automatiquement les sons associés aux effets (pic du son calé sur l'instant de l'effet)."""
import json, os, pathlib, re, subprocess, sys

# Formats de sortie : 9x16 (TikTok, Reels, Shorts), 16x9 (YouTube), 1x1 (feed carré), 4x5 (feed Instagram / LinkedIn)
FORMATS = {"9x16": (1080, 1920), "16x9": (1920, 1080), "1x1": (1080, 1080), "4x5": (1080, 1350)}

ICI = pathlib.Path(__file__).resolve().parent
# Bibliothèque de sons (facultative) : CLIPLEX_SONS/kit.json = {nom: {fichier, pic}, "_familles": {famille: [noms]}}
SONS = pathlib.Path(os.environ["CLIPLEX_SONS"]) if os.environ.get("CLIPLEX_SONS") else None
MUSIQUE = pathlib.Path(os.environ["CLIPLEX_MUSIQUE"]) if os.environ.get("CLIPLEX_MUSIQUE") else None
# Polices de la personne (facultatif) : CLIPLEX_POLICES/polices.json = [{famille, fichier, graisse, style}]
POLICES = pathlib.Path(os.environ["CLIPLEX_POLICES"]) if os.environ.get("CLIPLEX_POLICES") else None
# Thème sobre par défaut : texte blanc, aucune couleur imposée. Le style de la personne (montage/theme.json) et le plan le remplacent.
THEME = {"accent": "#FFFFFF", "rouge": "#E5484D", "cyan": "#3DE0FF", "blanc": "#FFFFFF", "police": "Inter", "policeTitre": "Inter Tight", "sobre": True}
KIT = json.loads((SONS / "kit.json").read_text()) if SONS and (SONS / "kit.json").exists() else {}

# Sons posés automatiquement par type d'effet (surchargeable dans plan.sonsAuto ou par élément avec "son")
# Familles « @… » : plusieurs sons interchangeables, joués en rotation (jamais deux fois le même d'affilée)
SONS_AUTO = {"notif": "@notif", "particules": "@pop", "titre3d": "@clic",
             "flash": "@whoosh", "leak": "@whoosh", "whip": "@whoosh", "zoomblur": "@whoosh", "traverse": "@whoosh", "balayage": "@whoosh", "glitch": "@glitch",
             "motGeant": "@pop", "titre": "@typing", "carton": None, "croix": "@faux", "coche": "@ding",
             "compteur": "@cash", "liste": "@clic", "broll": None, "image": "@whoosh", "fleche": "@clic", "carte": "@whoosh", "punch": None}
VOLUMES = {"whoosh": .32, "whoosh_court": .3, "whoosh_cine": .35, "whip": .3, "swoosh_leger": .35, "sweep": .3,
           "pop": .32, "pop_bulle": .35, "clic": .4, "clic_ui": .35, "coche": .35, "impact_grave": .4, "impact_zoom": .35,
           "bass_drop": .45, "riser": .3, "riser_long": .3, "glitch": .25, "glitch_cine": .3, "frappe": .3, "typing": .18,
           "cash": .3, "pieces": .3, "ding": .3, "faux": .25, "shutter": .35, "notif": .3, "boom": .35,
           }
FAMILLES = KIT.get("_familles", {})
_rotation = {}


def choisir(nom):
    """« @famille » → un son de la famille, en rotation (jamais deux fois de suite le même)."""
    if not nom or not nom.startswith("@"): return nom
    fam = FAMILLES.get(nom[1:])
    if not fam: return None
    k = _rotation.get(nom, -1) + 1
    _rotation[nom] = k
    return fam[k % len(fam)]


def err(msg):
    print("ERREUR :", msg); sys.exit(1)


def silences(dossier, rush):
    f = dossier / rush / "silences.txt"
    if not f.exists(): return []
    ev = re.findall(r"silence_(start|end): ([\d.]+)", f.read_text())
    out, s = [], None
    for k, v in ev:
        if k == "start": s = float(v)
        elif s is not None: out.append((s, float(v))); s = None
    # un « blanc » qui contient un mot dit très doucement (pic de voix bien au-dessus du bruit) n'est pas un blanc :
    # on ne le coupe pas, sinon le mot disparaît (ex. « quand vous tapez » murmuré)
    try:
        import numpy as np, wave
        w = wave.open(str(dossier / rush / "voix16k.wav")); sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
        hop = sr // 50; fr = x[:len(x) // hop * hop].reshape(-1, hop)
        e = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)
        bruit = json.loads((dossier / rush / "parole.json").read_text()).get("bruit_db", -60)
        def murmure(a, b):
            seg = e[int(a * 50) + 3:int(b * 50) - 3]
            return len(seg) > 0 and int((seg > bruit + 25).sum()) >= 2
        out = [(a, b) for a, b in out if not murmure(a, b)]
    except Exception:
        pass
    return out


def public(dossier):
    return dossier.parent / f".{dossier.name}.public"


def main(dossier):
    dossier = pathlib.Path(dossier).resolve()
    plan = json.loads((dossier / "plan.json").read_text())
    # Dossier public propre au projet pour Remotion : montage/ = ce projet, sons/ et musique/ = bibliothèques.
    # Rangé à côté du projet (pas dedans) pour que montage/ ne se contienne pas lui-même.
    pub = public(dossier); pub.mkdir(exist_ok=True)
    for nom, cible in (("montage", dossier), ("sons", SONS), ("musique", MUSIQUE), ("polices", POLICES)):
        l = pub / nom
        if l.is_symlink() or l.exists(): l.unlink()
        if cible: l.symlink_to(cible)

    # mode « motion » : pub sans voix (musique + SFX + écrans animés). Pas de rush : toutes les ancres sont en SECONDES
    # (« mot »: 2.5 = à 2,5 s, « jusqua »: 4 = jusqu'à 4 s, idem pour lignes / cartes / écrans), durée totale = plan.duree.
    motion = plan.get("mode") == "motion"
    mots = [] if motion else json.loads((dossier / "mots.json").read_text())
    info = json.loads((dossier / "info.json").read_text()) if (dossier / "info.json").exists() else {}
    fmt = {"largeur": 1080, "hauteur": 1920, "fps": info.get("fps", 30), **plan.get("format", {})}
    if os.environ.get("FORMAT") in FORMATS:
        fmt["largeur"], fmt["hauteur"] = FORMATS[os.environ["FORMAT"]]
    fps = fmt["fps"]
    F = lambda s: int(round(s * fps))
    coupe = {"seuil": 0.28, "avant": 0.07, "apres": 0.11, **plan.get("coupe", {})}
    cad = {"alterner": [1.0, 1.13], "focus": [0.5, 0.42], **plan.get("cadrage", {})}
    sil = {}
    infos = {}

    def info_src(rush):
        if rush not in infos:
            o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration",
                                "-of", "json", str(dossier / "sources" / f"{rush}.mp4")], capture_output=True, text=True).stdout
            j = json.loads(o); infos[rush] = (j["streams"][0]["width"], j["streams"][0]["height"], float(j["format"]["duration"]))
        return infos[rush]

    # Corrections de transcription : "corrections" (mot → mot, insensible à la casse) et "correctionsMots" (index → texte)
    corr = {k.lower(): v for k, v in plan.get("corrections", {}).items()}
    corr_i = {int(k): v for k, v in plan.get("correctionsMots", {}).items()}

    def corriger(w):
        if w["i"] in corr_i: return corr_i[w["i"]]
        m = re.match(r"^(.*?)([.,!?;:…]*)$", w["mot"])
        base, ponct = m.group(1), m.group(2)
        return corr.get(base.lower(), base) + ponct

    # ---------- 1. Segments → clips (suppression des blancs, coupes calées sur l'énergie de la voix)
    clips, gardes, t_frame, alt = [], {}, 0, 0
    if plan.get("integral") and not motion:
        # Montage intégral (rush déjà dérushé par l'utilisateur) : rien n'est coupé, blancs compris.
        # Les segments ne servent qu'à changer de cadre à leur premier mot ; ils doivent se suivre.
        segs = plan["segments"]
        for si, seg in enumerate(segs):
            a, b = seg["mots"]; rush = mots[a]["rush"]
            src_in = 0 if si == 0 else F(mots[a]["debut"] - 0.04)
            src_out = F(info_src(rush)[2]) if si == len(segs) - 1 else F(mots[segs[si + 1]["mots"][0]]["debut"] - 0.04)
            # « coupeApres » : il a demandé de retirer les mots qui suivent ce segment (ex. « Deuxième méthode, ») :
            # le plan s'arrête juste après son dernier mot, le segment suivant reprend au mot qu'il indique
            if seg.get("coupeApres") and si < len(segs) - 1:
                src_out = F(min(mots[b]["fin"] + 0.1, mots[b + 1]["debut"] - 0.02))
            dur = src_out - src_in
            if "zoom" in seg: z = seg["zoom"]
            else: z = cad["alterner"][alt % len(cad["alterner"])]; alt += 1
            zv = seg.get("zoomVers")
            clips.append({"rush": rush, "src": f"montage/sources/{rush}.mp4", "debutSrc": round(src_in / fps, 4), "de": t_frame, "duree": dur,
                          "zoom": [z, zv if zv else z], "focus": seg.get("focus", cad["focus"]), "segment": si,
                          "taille": info_src(rush)[:2], "derive": 0 if zv else seg.get("derive", cad.get("derive", 0.0)), "surPlace": cad.get("surPlace", False), "ajustement": seg.get("ajustement", cad.get("ajustement"))})
            for w in mots[a:b + 1]:
                de_w = t_frame + max(0, F(w["debut"]) - src_in)
                gardes[w["i"]] = {"i": w["i"], "mot": corriger(w), "de": de_w, "a": max(de_w + 2, min(t_frame + dur, t_frame + F(w["fin"]) - src_in))}
            t_frame += dur
    for si, seg in enumerate([] if motion or plan.get("integral") else plan["segments"]):
        if "mots" in seg:
            a, b = seg["mots"]
            ws = [w for w in mots[a:b + 1] if w["i"] not in seg.get("retirer", [])]
            if not ws: err(f"segment {si} vide")
            rush = ws[0]["rush"]
            if any(w["rush"] != rush for w in ws): err(f"segment {si} chevauche deux rushes")
            if rush not in sil: sil[rush] = silences(dossier, rush)
            # Blancs réels (détecteur de parole) : ce sont eux qui font foi pour les coupes, pas les horodatages whisper.
            S = sil[rush]
            internes = [(s, e) for s, e in S if e - s > coupe["seuil"] and ws[0]["debut"] < s and e < ws[-1]["fin"]]
            groupes, bornes = [], []   # bornes[k] = (blanc avant, blanc après) quand la coupe est interne
            cur, cur_av = [], None
            for w in ws:
                milieu = (w["debut"] + w["fin"]) / 2
                coupe_entre = None
                if cur:
                    for s, e in internes:
                        if (cur[-1]["debut"] + cur[-1]["fin"]) / 2 < (s + e) / 2 < milieu: coupe_entre = (s, e)
                if cur and (coupe_entre or w["i"] != cur[-1]["i"] + 1 or seg.get("couperChaqueMot")):
                    groupes.append(cur); bornes.append([cur_av, coupe_entre]); cur, cur_av = [], coupe_entre
                cur.append(w)
            groupes.append(cur); bornes.append([cur_av, None])
            for gi, g in enumerate(groupes):
                d, f = g[0]["debut"], g[-1]["fin"]
                av, ap = bornes[gi]
                cale_in = cale_out = True
                # On cherche le VRAI blanc entre le mot gardé et son voisin dans le rush (les horodatages
                # whisper peuvent déborder d'un côté comme de l'autre ; le détecteur de parole fait foi).
                p_mot = mots[g[0]["i"] - 1] if g[0]["i"] > 0 and mots[g[0]["i"] - 1]["rush"] == rush else None
                n_mot = mots[g[-1]["i"] + 1] if g[-1]["i"] + 1 < len(mots) and mots[g[-1]["i"] + 1]["rush"] == rush else None
                if av: src_in = av[1] - 0.08
                else:
                    lo = (p_mot["debut"] + p_mot["fin"]) / 2 if p_mot else -1
                    # blanc qui finit AVANT le mot (pas un creux à l'intérieur du mot)
                    cand = [e for s, e in S if lo < e <= min(g[0]["fin"], g[0]["debut"] + 0.12) and s >= lo - 0.05]
                    if cand: src_in = cand[-1] - 0.08
                    elif not p_mot: src_in = max(0, d - 0.1)
                    else: src_in, cale_in = d - coupe["avant"], False
                if ap: src_out = ap[0] + 0.10
                else:
                    hi = (n_mot["debut"] + n_mot["fin"]) / 2 if n_mot else 1e9
                    # blanc qui commence APRÈS le mot (un creux court au milieu du mot ne coupe pas la fin du mot)
                    cand = [s for s, e in S if max(g[-1]["debut"] + 0.08, g[-1]["fin"] - 0.12) <= s < hi]
                    if cand: src_out = cand[0] + 0.10
                    else: src_out, cale_out = f + coupe["apres"], False
                if gi == len(groupes) - 1: src_out += seg.get("pauseApres", 0)
                if gi == 0: src_in -= seg.get("pauseAvant", 0)
                src_in = max(0, src_in)
                # sans blanc détecté : ne pas déborder sur le mot voisin
                prev = mots[g[0]["i"] - 1] if g[0]["i"] > 0 else None
                nxt = mots[g[-1]["i"] + 1] if g[-1]["i"] + 1 < len(mots) else None
                if not cale_in and prev and prev["rush"] == rush: src_in = min(max(src_in, prev["fin"] + 0.02), d - 0.03)
                if not cale_out and nxt and nxt["rush"] == rush and not seg.get("pauseApres"): src_out = max(min(src_out, nxt["debut"] - 0.02), f + 0.03)
                # continuité : si ce plan suit directement le précédent dans le rush, pas de chevauchement (bégaiement)
                if clips and clips[-1]["rush"] == rush:
                    fin_prec = clips[-1]["debutSrc"] + clips[-1]["duree"] / fps
                    if fin_prec - 0.5 < src_in < fin_prec: src_in = fin_prec
                dur = F(src_out - src_in)
                if dur < 3: continue
                if "zoom" in seg:
                    z = seg["zoom"]
                else:
                    z = cad["alterner"][alt % len(cad["alterner"])]; alt += 1
                zv = seg.get("zoomVers")
                clip = {"rush": rush, "src": f"montage/sources/{rush}.mp4", "debutSrc": round(src_in, 3), "de": t_frame, "duree": dur,
                        "zoom": [z, zv if zv else z], "focus": seg.get("focus", cad["focus"]), "segment": si,
                        "taille": info_src(rush)[:2], "derive": 0 if zv else seg.get("derive", cad.get("derive", 0.0)), "surPlace": cad.get("surPlace", False), "ajustement": seg.get("ajustement", cad.get("ajustement"))}
                clips.append(clip)
                for w in g:
                    de_w = t_frame + max(0, F(w["debut"] - src_in))
                    gardes[w["i"]] = {"i": w["i"], "mot": corriger(w), "de": de_w, "a": max(de_w + 2, min(t_frame + dur, t_frame + F(w["fin"] - src_in)))}
                t_frame += dur
        else:  # plage brute d'un rush (plan sans parole, B-roll tourné…)
            rush = seg["rush"]; dur = F(seg["a"] - seg["de"])
            z = seg.get("zoom", 1.0)
            clips.append({"rush": rush, "src": f"montage/sources/{rush}.mp4", "debutSrc": seg["de"], "de": t_frame, "duree": dur,
                          "zoom": [z, seg.get("zoomVers", z)], "focus": seg.get("focus", cad["focus"]), "segment": si,
                          "taille": info_src(rush)[:2], "volume": seg.get("volume", 1)})
            t_frame += dur
    total = F(plan["duree"]) if motion else t_frame + F(plan.get("queue", 0.0))

    def t_mot(i, fin=False):
        if motion: return F(float(i))
        i = int(i)
        if i not in gardes: err(f"le mot #{i} « {mots[i]['mot']} » n'est pas dans le montage (coupé)")
        return gardes[i]["a" if fin else "de"]

    def ancre(ev, defaut=1.0):
        if "mot" in ev: de = t_mot(ev["mot"]) + F(ev.get("decalage", 0))
        elif "t" in ev: de = F(ev["t"])
        else: err(f"élément sans ancre : {ev}")
        if "jusqua" in ev: a = t_mot(ev["jusqua"], fin=True) + F(ev.get("prolonger", 0))
        else: a = de + F(ev.get("duree", defaut))
        return max(0, de), min(a, total)

    # ---------- 2. Éléments, zooms, transitions, sons
    elements, zooms, transitions, sons, masques, positions = [], [], [], [], [], []
    sons_auto = {**SONS_AUTO, **plan.get("sonsAuto", {})}

    def son(nom, t, volume=None, decalage=0.0):
        nom = choisir(nom)
        if not nom or not KIT: return
        # pas deux sons au même instant (empilement = effet « IA ») : on décale légèrement le second
        if any(abs(x["de"] - t) < 2 and x["nom"] == nom for x in sons): return
        k = KIT.get(nom)
        if k: sons.append({"src": f"sons/{k['fichier']}", "de": max(0, t - F(k["pic"]) + F(decalage)), "volume": volume if volume is not None else VOLUMES.get(nom, .3), "nom": nom})
        else: sons.append({"src": nom, "de": max(0, t + F(decalage)), "volume": volume if volume is not None else .3, "nom": nom})

    for ev in plan.get("evenements", []):
        typ = ev["type"]
        if typ == "son":
            son(ev["son"], ancre(ev)[0], ev.get("volume"), ev.get("decalageSon", 0)); continue
        if typ == "zoom":  # punch-in / zoom progressif sur une plage
            de, a = ancre(ev, 1.0)
            zooms.append({"de": de, "a": a, "facteur": ev.get("facteur", 1.18), "mode": ev.get("mode", "sec"), "focus": ev.get("focus"),
                          "entree": F(ev.get("entree", 0.7)), "sortie": F(ev.get("sortie", 0.8))})
            if ev.get("mode") == "impact" and ev.get("secousse", True):
                transitions.append({"type": "secousse", "a": de, "duree": 10, "amplitude": ev.get("amplitude", 18)})
            s = ev.get("son", sons_auto.get("punch"))
            if s: son(s, de, ev.get("volumeSon"))
            continue
        if typ == "transition":
            de = ancre(ev)[0]
            transitions.append({"type": ev.get("style", "flash"), "a": de, "duree": F(ev.get("duree", 0.3)), "couleur": ev.get("couleur"), "amplitude": ev.get("amplitude")})
            son(ev.get("son", sons_auto.get(ev.get("style", "flash"))), de, ev.get("volumeSon"))
            continue
        if typ == "musiqueCoupe":  # silence musical (avant une révélation)
            de, a = ancre(ev, 0.8); elements.append({"type": "musiqueCoupe", "de": de, "a": a}); continue
        de, a = ancre(ev, {"motGeant": 1.2, "titre": 2.5, "croix": 1.0, "coche": 1.0, "compteur": 1.6, "chapitre": 2.2, "tiers": 4.0, "encart": 4.0, "idee": 3.0, "definition": 4.0, "ecran": 4.0, "code": 5.0, "schema": 4.0, "surlignage": 2.5}.get(typ, 1.5))
        el = {k: v for k, v in ev.items() if k not in ("mot", "jusqua", "duree", "decalage", "prolonger", "t")}
        el.update({"de": de, "a": a})
        if typ == "carton":  # cartons plein écran mot par mot, calés sur chaque mot
            idx = list(range(int(ev["mot"]), int(ev.get("jusqua", ev["mot"])) + 1))
            textes = ev.get("textes")
            el["cartes"] = []
            for k, i in enumerate(idx):
                if i not in gardes: continue
                d2 = gardes[i]["de"]; a2 = gardes[idx[k + 1]]["de"] if k + 1 < len(idx) and idx[k + 1] in gardes else a
                el["cartes"].append({"de": d2, "a": a2, "texte": (textes[k] if textes else gardes[i]["mot"]).strip(",.?!"), "k": k})
            masques.append([de, a])
        if typ == "positionSousTitres":
            positions.append([de, a, ev.get("position"), ev.get("plaque", False)]); continue
        # listes, encarts, schémas (items) et zones d'un écran : chaque morceau apparaît sur son mot
        for cle in ("items", "zones"):
            if isinstance(ev.get(cle), list):
                el[cle] = [{**{k: v for k, v in it.items() if k != "mot"}, "de": t_mot(it["mot"]) if "mot" in it else de} for it in ev[cle]]
        if typ == "chapitre" and ev.get("mode", "plein") == "plein": masques.append([de, a])
        if typ in ("ecran", "schema") and ev.get("cote", "plein") not in ("gauche", "droite") and ev.get("masqueSousTitres", True): masques.append([de, a])
        if typ == "broll" and ev.get("mode", "plein") == "plein" and ev.get("masqueSousTitres", False): masques.append([de, a])
        if ev.get("masqueSousTitres") and typ != "broll": masques.append([de, a])
        if typ in ("broll", "image") and ev.get("entree"):
            transitions.append({"type": ev["entree"], "a": de, "duree": F(0.25)})
            son(sons_auto.get(ev["entree"]), de)
        if typ in ("broll", "image") and ev.get("sortie"):
            transitions.append({"type": ev["sortie"], "a": a, "duree": F(0.25)})
            son(sons_auto.get(ev["sortie"]), a)
        elements.append(el)
        s = ev.get("son", sons_auto.get(typ))
        if typ == "carton" and ev.get("sonParCarte"):
            for c in el["cartes"]: son(ev["sonParCarte"], c["de"], ev.get("volumeSon"))
        elif s: son(s, de, ev.get("volumeSon"))

    # ---------- 3. Sous-titres : groupes de mots
    st = {"actif": True, "motsParGroupe": 3, "maxCar": 18, "position": 0.72, "style": "bold", **plan.get("sousTitres", {})}
    couleurs = {int(k): v for k, v in st.get("couleurs", {}).items()}
    kept = sorted(gardes.values(), key=lambda w: w["de"])
    for w in kept:
        if w["i"] in couleurs: w["couleur"] = couleurs[w["i"]]
    groupes, cur = [], []
    caches = set(st.get("cacher", []))
    for w in kept:
        if w["i"] in caches: continue
        if cur and (len(cur) >= st["motsParGroupe"] or w["de"] - cur[-1]["a"] > F(0.3)
                    or sum(len(x["mot"]) + 1 for x in cur) + len(w["mot"]) > st["maxCar"]
                    or w["i"] != cur[-1]["i"] + 1):
            groupes.append(cur); cur = []
        cur.append(w)
        if re.search(r"[.?!,:;]$", w["mot"]): groupes.append(cur); cur = []
    if cur: groupes.append(cur)
    grp = []
    for k, g in enumerate(groupes):
        de = g[0]["de"]; nxt = groupes[k + 1][0]["de"] if k + 1 < len(groupes) else None
        a = nxt if nxt is not None and nxt - g[-1]["a"] < F(0.6) else g[-1]["a"] + F(0.25)
        if any(m0 <= de < m1 for m0, m1 in masques): continue
        a = min([a] + [m0 for m0, m1 in masques if de < m0 < a])
        pos = next((p for p0, p1, p, _ in positions if p0 <= de < p1), None)
        plaque = st.get("plaque", False) or any(pl for p0, p1, _, pl in positions if p0 <= de < p1)
        encadre = any(e["type"] == "fond" and e.get("style", "creme") != "creme" and e["de"] <= de < e["a"] for e in elements)
        # écran partagé (tableau) : sous-titres centrés sous la personne, dans la moitié gauche
        zone = "gauche" if any(e["type"] == "tableau" and e["de"] - 30 <= de < e["a"] + 30 for e in elements) else None
        grp.append({"de": de, "a": a, "position": pos, "encadre": encadre, "zone": zone, **({"plaque": True} if plaque else {}), "mots": [{"texte": w["mot"], "de": w["de"], "a": w["a"], "couleur": w.get("couleur")} for w in g]})

    musique = plan.get("musique")
    if musique:
        # Calibrage automatique : la musique est posée à `ecart` dB sous la voix (mesures LUFS réelles)
        def lufs(f):
            o = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(f), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
            return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", o)[-1])
        if motion:  # pas de voix : la musique porte la vidéo, les SFX ponctuent (mastering final à -10 LUFS)
            musique.setdefault("volume", musique.get("niveau", 0.55)); musique["volumeSansVoix"] = musique["volume"]
        if "volume" not in musique:
            l_m = lufs(pub / musique["src"])
            l_v = lufs(dossier / clips[0]["rush"] / "voix.wav") + 3  # +3 : la mesure inclut les blancs
            ec, ep = musique.get("ecart", 17), musique.get("ecartPause", 9)
            musique["volume"] = round(10 ** ((l_v - ec - l_m) / 20), 3)
            musique.setdefault("volumeSansVoix", round(10 ** ((l_v - ep - l_m) / 20), 3))
            print(f"Musique {l_m:.1f} LUFS, voix ≈{l_v:.1f} LUFS → volume {musique['volume']} / pauses {musique['volumeSansVoix']}")
        musique = {"volumeSansVoix": 0.22, "debut": 0, "fondu": 1.2, **musique}
        musique["coupes"] = [[e["de"], e["a"]] for e in elements if e["type"] == "musiqueCoupe"]

    # transitions et reculs calés pile sur la coupe la plus proche (sinon on voit le plan sauter)
    coupes = [c["de"] for c in clips]
    def caler(t):
        proche = min(coupes, key=lambda c: abs(c - t)) if coupes else t
        return proche if abs(proche - t) <= 8 else t
    for t in transitions:
        if t["type"] in ("traverse", "balayage", "whip", "zoomblur", "flash"): t["a"] = caler(t["a"])
    for z in zooms:
        if z["mode"] == "recul": z["de"] = caler(z["de"])

    # sources lourdes (4K) : copie 1080p « rN_apercu.mp4 » lue seulement par le Studio, le rendu garde l'original
    for c in clips:
        if c.get("src", "").startswith("montage/sources/") and (dossier / c["src"][len("montage/"):].replace(".mp4", "_apercu.mp4")).exists():
            c["apercu"] = c["src"].replace(".mp4", "_apercu.mp4")
    theme_style = json.loads((dossier / "theme.json").read_text()) if (dossier / "theme.json").exists() else {}
    tl = {"fps": fps, "largeur": fmt["largeur"], "hauteur": fmt["hauteur"], "duree": total, "mode": plan.get("mode", "filme"),
          "theme": {**THEME, **theme_style, **plan.get("theme", {})},
          "polices": json.loads((POLICES / "polices.json").read_text()) if POLICES and (POLICES / "polices.json").exists() else [],
          "sousTitres": {**st, "groupes": grp if st["actif"] else []},
          "clips": clips, "mots": kept, "zooms": zooms, "transitions": transitions,
          "elements": [e for e in elements if e["type"] != "musiqueCoupe"], "sons": sons, "musique": musique,
          "etalonnage": plan.get("etalonnage", {}), "vignette": plan.get("vignette", 0.25), "grain": plan.get("grain", 0)}
    (dossier / "timeline.json").write_text(json.dumps({"timeline": tl}, ensure_ascii=False))

    # ---------- 4. Rapport
    dur_s = total / fps
    src_s = sum(c["duree"] for c in clips) / fps
    print(f"Durée finale : {dur_s:.1f} s — {len(clips)} plans (moy. {src_s / max(1, len(clips)):.2f} s) — {len(kept)} mots gardés / {len(mots)}")
    print(f"{len(grp)} groupes de sous-titres, {len(elements)} éléments, {len(zooms)} zooms, {len(transitions)} transitions, {len(sons)} sons")
    # timeline lisible pour vérification
    lignes = []
    for c in clips:
        ws = [w for w in kept if c["de"] <= w["de"] < c["de"] + c["duree"]]
        lignes.append(f"{c['de'] / fps:6.2f}s  plan x{c['zoom'][0]:.2f}  " + " ".join(w["mot"] for w in ws))
    for e in elements: lignes.append(f"{e['de'] / fps:6.2f}s  [{e['type']}] {e.get('texte', e.get('src', ''))}")
    for t in transitions: lignes.append(f"{t['a'] / fps:6.2f}s  <transition {t['type']}>")
    for z in zooms: lignes.append(f"{z['de'] / fps:6.2f}s  (zoom x{z['facteur']} {z['mode']} → {z['a'] / fps:.2f}s)")
    for s in sons: lignes.append(f"{s['de'] / fps:6.2f}s  son : {s['nom']}")
    (dossier / "timeline.txt").write_text("\n".join(sorted(lignes, key=lambda l: float(l.split("s")[0]))))


if __name__ == "__main__":
    main(sys.argv[1])
