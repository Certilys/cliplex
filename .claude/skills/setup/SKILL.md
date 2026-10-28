---
name: setup
description: Premier lancement de Cliplex sans l'app. À utiliser quand la personne découvre Cliplex, dit bonjour, veut commencer, ou quand ./cliplex etat montre des outils manquants, aucune inspiration ou pas de style. Explique ce qu'il faut, installe les outils, demande ses vidéos d'inspiration, crée son style.
---

# Premier lancement

Tu accueilles quelqu'un qui vient de cloner Cliplex. Objectif : en une conversation, ses outils sont installés, son style est appris de ses inspirations, et elle peut monter sa première vidéo. Avance étape par étape, une question à la fois, en phrases courtes.

## 1. Ce qu'il faut

Lance `./cliplex etat`. Explique en trois lignes :
- Cliplex monte ses vidéos sur son Mac : sous-titres, zooms, chapitres, encarts, transitions, effets sonores, motion design, dans son style à elle.
- Le monteur, c'est Claude Code, avec son abonnement (Pro ou Max). Elle l'utilise déjà, puisqu'elle te parle.
- Tout va dans un seul dossier (`./cliplex dossier`). Le supprimer efface tout.

## 2. Les outils

`./cliplex etat` vérifie déjà ce qu'elle a : un outil déjà sur son Mac (ffmpeg, Node, Python avec whisper, Claude Code) est utilisé tel quel et n'est jamais réinstallé. Fais-lui un récapitulatif en deux parties :

**Déjà prêt** : une ligne par outil trouvé, avec où il est (« déjà sur ton Mac » ou « installé par Cliplex »).

**À installer** (seulement s'il en manque) : un tableau avec l'outil, à quoi il sert et sa taille, puis le total. Précise : sans mot de passe, sans Homebrew, tout dans le dossier Cliplex, détail dans `docs/installation-manuelle.md`.

Si tout est prêt, dis-le en une phrase et passe à la suite. Sinon, demande son accord, puis lance `./cliplex installer` (plusieurs minutes selon la connexion). À la fin, refais `./cliplex etat` et confirme en une ligne. En cas d'échec, montre l'erreur et la commande manuelle du document.

## 3. Ses inspirations

Demande 2 à 5 vidéos dont elle aime le montage, proches de ce qu'elle veut faire (pour une formation : des formations). Elle peut :
- glisser un fichier vidéo ou une image dans le Terminal (ça colle son chemin) ;
- coller un lien YouTube.

Pour les liens, il te faut Chrome : si `./cliplex etat` dit que l'extension manque, ou si tes outils de navigateur ne répondent pas, explique-lui d'installer l'extension Claude pour Chrome (Chrome Web Store), de s'y connecter avec son compte Claude, puis de taper `/chrome` ici pour la relier. En attendant, elle peut donner des fichiers.

Ajoute chacune avec `./cliplex inspiration <fichier ou lien> "<sa note>"`, puis analyse-les et crée son style avec le skill `style`.

## 4. Son style

Le skill `style` se termine par des questions (police exacte, sous-titres, musique…). Pose-les-lui, une par une, avec les choix proposés.

## 5. Première vidéo

Montre le style en trois lignes (nom, couleurs, ce qui revient). Propose de monter sa première vidéo : skill `monter`. Dis-lui dès maintenant qu'elle pourra tout demander pour le montage (motion design, animations, transitions, effets sonores, une ambiance précise) : le moteur crée ce qui n'existe pas encore, il suffit de bien le décrire.
