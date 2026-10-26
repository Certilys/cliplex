# Cliplex

**Tu tournes, ta vidéo est montée.**

Cliplex est un studio vidéo qui tourne sur ton ordinateur. Tu prépares ton idée, tu tournes avec le prompteur, tu déposes ton rush, et l'IA fait le montage : sous-titres mot à mot, animations, sons, musique. Pour les Shorts, Reels et TikTok, les vidéos YouTube et les formations.

Gratuit et open source. Tu branches simplement ton propre compte Claude.

![Écran de montage](docs/ecran-montage.png)

## Pourquoi « Cliplex »

Clip Express : ta vidéo montée en quelques minutes. Et un lexique : Cliplex apprend le style de tes vidéos préférées pour monter les tiennes de la même façon.

## Principes

- **Tout reste sur ton Mac.** Tes rushs, tes montages et la transcription de ta voix ne quittent pas ton ordinateur.
- **Transparence totale.** Chaque outil installé est montré, expliqué, avec la commande exacte lancée. Rien n'est caché.
- **Ton compte, tes règles.** Cliplex lance le Claude Code que tu as installé et connecté toi-même. Il ne voit jamais tes identifiants.
- **Des fichiers normaux.** Un projet = un dossier lisible que tu peux ouvrir, copier, sauvegarder.

## État

Version 0.1, en développement actif. macOS d'abord, Windows et Linux ensuite.

| Fonction | État |
| --- | --- |
| Premier lancement guidé (objectifs, dossier, installation, Claude) | Fait |
| Projets vidéo : rushs, format, consignes | Fait |
| Moteur de montage automatique | En cours |
| Inspirations et styles appris | À venir |
| Idées, scripts et planning | À venir |
| Prompteur sur téléphone, décor de tournage | À venir |
| Banque de sons libres de droits | À venir |

## Installer pour développer

Prérequis : macOS, Node.js 20 ou plus.

```bash
git clone https://github.com/mariusdjen/cliplex.git
cd cliplex
npm install
npm run dev
```

Les outils de montage (ffmpeg, whisper.cpp, Python, Claude Code) s'installent depuis l'app au premier lancement, ou à la main : voir [docs/installation-manuelle.md](docs/installation-manuelle.md).

## Structure

```
src/main/        processus principal Electron : outils, projets, Claude
src/preload/     pont sécurisé entre l'interface et le système
src/renderer/    interface React (Tailwind)
src/shared/      types communs
```

## Contribuer

Les contributions sont les bienvenues : voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

[Apache 2.0](LICENSE). Le nom et le logo Cliplex ne sont pas couverts par la licence du code.

Le moteur d'animation s'appuiera sur [Remotion](https://www.remotion.dev), gratuit pour les particuliers et les petites structures ; les entreprises de plus de trois personnes ont besoin d'une licence Remotion.
