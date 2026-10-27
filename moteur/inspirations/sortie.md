## Ce que tu écris (dans le dossier courant, rien d'autre)

**`fiche.md`**, en français, avec ces sections :
- `## Résumé` : type de vidéo, format, durée, sujet, à qui elle s'adresse.
- `## Structure` : ouverture, parties, fin (avec les moments).
- `## Rythme et découpe`
- `## Cadrage et zooms`
- `## Ce qui s'affiche` : sous-titres, titres, encarts, listes, schémas, captures, flèches (position, taille, animation).
- `## Direction artistique` : couleurs (hexadécimal), polices, fonds, formes, niveau de sobriété.
- `## Transitions et animations`
- `## Son` (probable)
- `## Ce qui fonctionne` : 3 à 5 points.
- `## Règles` : la partie la plus importante. Des règles concrètes, mesurables, qu'un monteur peut appliquer sans voir la vidéo (« un zoom de 120 % sur la zone de l'écran dont il parle, tenu 2 à 4 s », pas « des zooms dynamiques »).

**`regles.json`**, JSON valide :
```json
{
  "style": "nom court du style, par exemple formation écran posée",
  "resume": "une phrase",
  "type": "formation | tutoriel | face caméra | pub | vlog | autre",
  "format": "16:9 | 9:16 | 1:1 | 4:5",
  "couleurs": ["#111111", "#FFFFFF"],
  "polices": ["Inter, 700, titres en minuscules"],
  "regles": ["règle 1", "règle 2"]
}
```
6 à 12 règles, les plus utiles et les plus propres à cette vidéo.

Écriture : français simple, aucun emoji, aucun tiret long (ni « — » ni « – »).
