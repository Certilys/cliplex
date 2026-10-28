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
Chaque règle doit pouvoir se monter : écris-la avec les éléments du moteur (liste ci-dessous) quand ils suffisent, en donnant leurs réglages. Si rien ne correspond, décris précisément le rendu voulu (forme, mouvement, durée, position) : le monteur écrira un composant sur mesure. Les durées dépendent de la longueur de la vidéo : « une ouverture de 3 à 6 s, jusqu'à 10 % d'une longue vidéo » plutôt que « 30 à 60 s ».
Garde ce qui revient dans plusieurs inspirations. Quand deux inspirations se contredisent, choisis ce qui va le mieux avec les réponses de la personne, ou pose la question. Règles concrètes et mesurables, pas d'adjectifs vagues.

**`style.json`**, JSON valide :
```json
{
  "nom": "nom court",
  "resume": "une phrase",
  "theme": {"accent": "#hex", "texte": "#hex", "fond": "#hex", "panneau": "sombre ou clair", "police": "famille du texte", "policeTitre": "famille des titres"},
  "questions": [
    {"id": "polices", "question": "…", "pourquoi": "…", "choix": ["…", "…"], "reponse": "…"}
  ]
}
```

**Ce que le moteur sait faire** (pour traduire les règles) :
- formation et YouTube : `chapitre` (plein cadre ou bandeau), `encart` (points à côté de la personne), `idee`, `definition`, `tiers` (nom), `ecran` (capture dans un cadre navigateur ou fenêtre, zones mises en avant), `code`, `schema`, `surlignage`, `zoom` (`lisse`, `doux`, `sec`, `recul`) ;
- courts et pubs : `motGeant`, `compteur`, `titre` tapé, `liste`, `carte`, `croix`, `coche`, `fleche`, `broll` et `image` (plein cadre, carte, haut) ;
- transitions : `balayage`, `whip`, `zoomblur`, `flash`, `volet` (panneau de couleur), `leak` ;
- sous-titres : `formation` (phrase en bas), `bold` (1 à 3 mots), `fin` ; position, mots par groupe, un mot coloré par groupe au plus ;
- effets sonores (kit libre, posés automatiquement à l'arrivée des éléments) : whoosh, swoosh, pop, clic, ding, impact, montée ; ils peuvent être discrets, marqués ou absents ;
- étalonnage (contraste, saturation, luminosité, chaleur), vignette ;
- **tout le reste se fait sur mesure** (composant écrit pour la vidéo) : ouverture typographique, personne dans un rond, captures inclinées, cartes d'une forme précise, graphique animé.
Les encarts, chapitres en bandeau et définitions sont des panneaux : sombres par défaut, clairs avec `"panneau": "clair"` dans `theme` (ou la couleur exacte avec `couleurPanneau` et `textePanneau`).

**Polices.** Le moteur connaît déjà : Inter, Inter Tight, Montserrat, Poppins, DM Sans, Manrope, Sora, Plus Jakarta Sans, Archivo Black, Anton, Bebas Neue, Unbounded, JetBrains Mono, Instrument Serif, Playfair Display, Caveat. Si une inspiration utilise clairement une autre police libre de Google Fonts, télécharge ses fichiers TTF (dépôt github.com/google/fonts, avec `curl -L --fail -o`) dans `../bibliotheque/polices/` et ajoute-la à `../bibliotheque/polices/polices.json` (`[{"famille": "…", "fichier": "….ttf", "graisse": 700, "style": "normal"}]`). Polices déjà déposées par la personne dans ce dossier : utilise-les en priorité. Pour une police commerciale, propose la plus proche parmi les libres et pose la question.

**Questions** (0 à 5) : seulement ce que tu ne peux pas savoir en regardant, et qui change vraiment le montage. Par exemple : la police exacte d'une inspiration, ses couleurs de marque, sous-titres ou non, musique ou non, effets sonores discrets ou marqués, un logo à afficher. Musique et effets sonores sont deux questions distinctes : sans musique, les effets sonores restent. Chaque question est courte, avec `pourquoi` (une phrase) et des `choix` quand c'est possible. Garde telles quelles les questions qui ont déjà une `reponse`. Ne repose pas une question déjà répondue.

Écriture : français simple, aucun emoji, aucun tiret long (ni « — » ni « – »). N'écris rien d'autre que ces fichiers (et les polices).
