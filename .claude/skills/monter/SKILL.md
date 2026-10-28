---
name: monter
description: Monter une vidéo avec Cliplex sans l'app. À utiliser quand la personne donne un rush, veut monter une vidéo (formation, YouTube, court, pub), demande une retouche sur un brouillon ou veut exporter en 4K.
---

# Monter une vidéo

Le parcours : rush, consignes, brouillon, retouches, validation, export. **Rien n'est exporté sans sa validation explicite.**

## 1. Ce qu'il faut savoir (une question à la fois, avec ces valeurs par défaut)

Avant les consignes, dis-lui clairement qu'elle est libre de tout demander, par exemple :

> **Dis-moi tout ce que tu veux pour cette vidéo, sans te limiter.** Du motion design, des animations de texte, des transitions, des effets sonores, des zooms, des sous-titres, une ouverture, ton logo, une ambiance comme celle d'une vidéo que tu aimes… Le moteur peut tout faire : si un effet n'existe pas encore, je le crée pour ta vidéo. Plus tu décris précisément ce que tu veux (à quel moment, comment ça bouge, de quelle couleur), plus le résultat te ressemblera.

- Le rush : elle glisse le fichier dans le Terminal. Plusieurs rushs possibles, montés dans l'ordre.
- Le titre. Elle peut le choisir plus tard : `./cliplex renommer <id> "<titre>"`.
- Le genre : `formation` (par défaut), `youtube`, `court` (Shorts, Reels, TikTok), `pub`.
- Le format : `16x9` pour formation et YouTube, `9x16` pour court et pub ; `1x1` et `4x5` possibles.
- Ses consignes : son prénom, ce qu'il faut montrer (un site, un outil), le nombre de parties, si le rush est déjà coupé, sous-titres ou non, et tout ce qu'elle imagine pour le montage. Note tout, mot pour mot.
- Effets sonores (whoosh sur les transitions, pop et swoosh à l'arrivée des encarts) : ils sont là par défaut, discrets. Demande seulement si son style ne le dit pas : discrets, marqués, ou aucun. Ne les confonds pas avec la musique.
- Son style s'applique s'il existe. Si elle n'en veut pas pour cette vidéo, mets `"avecStyle": false` dans `projet.json`.

## 2. Préparer

```
./cliplex projet "<titre>" <genre> <format> <rush> [rush…]     # affiche l'id
./cliplex preparer <id> "<consignes>"                            # affiche le dossier du montage
```
La préparation nettoie la voix, transcrit mot à mot et découpe le rush en planches : compte une à trois minutes par minute de rush. Lance-la au premier plan.

## 3. Monter

Le dossier du montage (affiché par `preparer`) contient tout. Lis **entièrement** son `CLAUDE.md` : ce sont les règles du monteur Cliplex, et tu les suis comme si tu travaillais dans ce dossier (les chemins y sont relatifs à lui). Lis `consignes.txt`, `style.md` s'il existe, la transcription et toutes les planches. Écris `plan.json`.

Brouillon : `<dossier du montage>/rendre-brouillon.sh`, au premier plan (quelques minutes). Vérifie `timeline.txt` et toutes les planches `controle/planche_*.jpg`, corrige, re-rends tant qu'un point de la checklist n'est pas bon. Termine par `resume.md`.

## 4. Faire valider

`./cliplex brouillon <id>` : il ouvre le brouillon (demi-résolution, mais le rythme, les textes et les animations sont ceux de la vidéo finale). Le brouillon s'ouvre dans le lecteur et le Finder le montre : dis-lui aussi où le trouver. Dis-lui en trois à cinq lignes ce que tu as fait (le contenu de `resume.md`, sans jargon), puis demande-lui de le regarder en entier et de te dire tout ce qu'elle veut changer : le moment (par exemple « à 0:32 »), ce qui ne va pas, et ce qu'elle voudrait à la place. Rien n'est figé : textes, animations, sons, rythme, couleurs, un effet nouveau.

Retouche : corrige `plan.json` (et écris un composant sur mesure si elle demande quelque chose de nouveau), re-rends le brouillon, vérifie, mets `resume.md` à jour, puis `./cliplex brouillon <id>` à nouveau. Autant de tours qu'il faut.

## 5. Exporter (seulement quand elle dit que c'est bon)

Demande la qualité : 4K (la plus nette, rendu plus long) ou 1080p (plus rapide). Puis `./cliplex exporter <id> 4k` (ou `hd`), au premier plan. Une version déjà exportée n'est jamais écrasée : elle est gardée sous un nom daté. Le Finder s'ouvre sur la vidéo.

Si elle a l'app Cliplex, la vidéo y apparaît aussi : ce sont les mêmes fichiers.
