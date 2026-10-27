# Le style de la personne

Tu écris le style de montage de cette personne, à partir des inspirations qu'elle a choisies. Cliplex le donnera à Claude à chaque montage : c'est ce qui fait que ses vidéos lui ressemblent à elle, et pas à un modèle générique.

Les inspirations analysées sont listées dans `inspirations.txt`. Pour chacune, lis `fiche.md` et `regles.json` (et regarde quelques planches de `analyse/planches/` si une règle n'est pas claire). Lis aussi `style.json` s'il existe déjà : les réponses de la personne (`questions[].reponse`) sont **prioritaires** sur tout ce que tu as observé.

## Ce que tu écris

**`style.md`**, en français, directement utilisable par un monteur :
- `# <nom du style>` puis une phrase de résumé.
- `## Pour quelles vidéos` : formats et types de vidéos concernés.
- `## Rythme`
- `## Cadrage et zooms`
- `## Texte à l'écran` : sous-titres (oui ou non, position, taille, casse, mots par groupe), titres de chapitre, encarts.
- `## Illustrations` : listes, schémas, captures d'écran, flèches, icônes ; quand et comment.
- `## Direction artistique` : couleurs (hexadécimal, avec leur rôle), polices (titres, texte), fonds, formes, ombres.
- `## Transitions et animations`
- `## Son`
- `## À ne jamais faire`
Garde ce qui revient dans plusieurs inspirations. Quand deux inspirations se contredisent, choisis ce qui va le mieux avec les réponses de la personne, ou pose la question. Règles concrètes et mesurables, pas d'adjectifs vagues.

**`style.json`**, JSON valide :
```json
{
  "nom": "nom court",
  "resume": "une phrase",
  "theme": {"accent": "#hex", "texte": "#hex", "fond": "#hex", "police": "famille du texte", "policeTitre": "famille des titres"},
  "questions": [
    {"id": "polices", "question": "…", "pourquoi": "…", "choix": ["…", "…"], "reponse": "…"}
  ]
}
```

**Polices.** Le moteur connaît déjà : Inter, Inter Tight, Montserrat, Poppins, DM Sans, Manrope, Sora, Plus Jakarta Sans, Archivo Black, Anton, Bebas Neue, Unbounded, JetBrains Mono, Instrument Serif, Playfair Display, Caveat. Si une inspiration utilise clairement une autre police libre de Google Fonts, télécharge ses fichiers TTF (dépôt github.com/google/fonts, avec `curl -L --fail -o`) dans `../bibliotheque/polices/` et ajoute-la à `../bibliotheque/polices/polices.json` (`[{"famille": "…", "fichier": "….ttf", "graisse": 700, "style": "normal"}]`). Polices déjà déposées par la personne dans ce dossier : utilise-les en priorité. Pour une police commerciale, propose la plus proche parmi les libres et pose la question.

**Questions** (0 à 5) : seulement ce que tu ne peux pas savoir en regardant, et qui change vraiment le montage. Par exemple : la police exacte d'une inspiration, ses couleurs de marque, sous-titres ou non, musique ou non, un logo à afficher. Chaque question est courte, avec `pourquoi` (une phrase) et des `choix` quand c'est possible. Garde telles quelles les questions qui ont déjà une `reponse`. Ne repose pas une question déjà répondue.

Écriture : français simple, aucun emoji, aucun tiret long (ni « — » ni « – »). N'écris rien d'autre que ces fichiers (et les polices).
