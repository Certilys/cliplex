---
name: demarrer
description: Premier lancement de Cliplex sans l'app. À utiliser quand la personne découvre Cliplex, dit bonjour, veut commencer, ou quand ./cliplex etat montre des outils manquants, aucune inspiration ou pas de style. Explique ce qu'il faut, installe les outils, demande ses vidéos d'inspiration, crée son style.
---

# Premier lancement

Tu accueilles quelqu'un qui vient de cloner Cliplex. Objectif : en une conversation, ses outils sont installés, son style est appris de ses inspirations, et elle peut monter sa première vidéo. Avance étape par étape, une question à la fois, en phrases courtes.

## 1. Ce qu'il faut

Lance `./cliplex etat`. Explique en trois lignes :
- Cliplex monte ses vidéos sur son Mac : sous-titres, zooms, chapitres, encarts, dans son style à elle.
- Le monteur, c'est Claude Code, avec son abonnement (Pro ou Max). Elle l'utilise déjà, puisqu'elle te parle.
- Tout va dans un seul dossier (`./cliplex dossier`). Le supprimer efface tout.

## 2. Les outils

S'il en manque, présente-les en tableau (seulement les manquants) :

| Outil | À quoi il sert | Taille |
| --- | --- | --- |
| ffmpeg | Découpe, assemble, exporte la vidéo | ≈ 80 Mo |
| Node.js | Fait tourner le moteur d'animation | ≈ 50 Mo |
| Python et whisper | Transcrit sa voix mot à mot, en local | ≈ 120 Mo |
| Modèle de transcription | Reconnaît la parole, 90 langues | ≈ 575 Mo |
| Débruiteur de voix | Retire le souffle et le bruit de fond | ≈ 300 Ko |
| Moteur d'animation (Remotion) | Dessine chaque image de la vidéo | ≈ 300 Mo |

Précise : sans mot de passe, sans Homebrew, tout dans `<dossier>/outils`, détail dans `docs/installation-manuelle.md`. Demande son accord, puis lance `./cliplex installer` au premier plan (plusieurs minutes selon la connexion). En cas d'échec, montre l'erreur et la commande manuelle du document.

## 3. Ses inspirations

Demande 2 à 5 vidéos dont elle aime le montage, proches de ce qu'elle veut faire (pour une formation : des formations). Elle peut :
- glisser un fichier vidéo ou une image dans le Terminal (ça colle son chemin) ;
- coller un lien YouTube.

Pour les liens, il te faut Chrome : si `./cliplex etat` dit que l'extension manque, ou si tes outils de navigateur ne répondent pas, explique-lui d'installer l'extension Claude pour Chrome (Chrome Web Store), de s'y connecter avec son compte Claude, puis de taper `/chrome` ici pour la relier. En attendant, elle peut donner des fichiers.

Ajoute chacune avec `./cliplex inspiration <fichier ou lien> "<sa note>"`, puis analyse-les et crée son style avec le skill `style`.

## 4. Son style

Le skill `style` se termine par des questions (police exacte, sous-titres, musique…). Pose-les-lui, une par une, avec les choix proposés.

## 5. Première vidéo

Montre le style en trois lignes (nom, couleurs, ce qui revient). Propose de monter sa première vidéo : skill `monter`.
