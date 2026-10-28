# Comment Cliplex fonctionne

Cliplex monte tes vidéos sur ton Mac, dans **ton** style. Ce style ne vient pas de nous : il vient des vidéos que tu aimes et que tu lui montres. Deux personnes qui donnent des inspirations différentes obtiennent deux montages différents.

Tu peux tout faire de deux façons, qui partagent les mêmes fichiers :
- **l'app** (`npm run dev`) ;
- **Claude Code seul** : `cd cliplex && claude`, puis dis bonjour.

## Le parcours

```
outils  →  inspirations  →  ton style  →  ton rush  →  brouillon  →  retouches  →  export 4K
```

### 1. Les outils (une seule fois)

Claude vérifie ce qui manque et te le présente avant d'installer quoi que ce soit : ffmpeg (la vidéo), Node.js et Remotion (les animations), Python et whisper (la transcription de ta voix, en local), un débruiteur de voix. Environ 1,1 Go, sans mot de passe ni Homebrew, tout dans le dossier Cliplex.

Le monteur, c'est Claude Code, avec ton abonnement Pro ou Max. Rien ne passe par un serveur Cliplex : il n'y en a pas.

### 2. Tes inspirations

Tu donnes 2 à 5 vidéos dont tu aimes le montage, proches de ce que tu veux faire : un fichier vidéo, une image (capture, miniature, charte) ou un lien YouTube.

Pour chacune, Claude :
- **vidéo** : la découpe en planches d'images, repère les coupes, les blancs et transcrit les paroles, puis regarde **toutes** les images ;
- **lien YouTube** : l'ouvre dans ton Chrome (extension Claude pour Chrome), se place à au moins 16 moments, fait des captures et zoome sur les textes ;
- écrit une **fiche** (structure, rythme, zooms, ce qui s'affiche, couleurs, polices, transitions, ce qui n'est pas fait) et **6 à 12 règles** concrètes, par exemple « un zoom de 120 % sur la zone de l'écran dont il parle, tenu 2 à 4 s ».

Il ne copie pas les vidéos : il en tire des règles.

### 3. Ton style

Claude relit toutes les fiches et écrit ton style : ce qui revient d'une inspiration à l'autre (rythme, cadrage, texte à l'écran, illustrations, couleurs, polices, transitions, son, ce qu'il ne faut jamais faire). Si une police libre est utilisée, il la télécharge.

Puis il te pose quelques questions sur ce qu'il ne peut pas deviner en regardant : la police exacte, tes couleurs de marque, sous-titres ou non, musique ou non. **Tes réponses passent avant tout ce qu'il a observé.** Tu peux changer ton style à tout moment, en le disant simplement.

### 4. Ta vidéo

Tu donnes ton rush, un titre, le genre (formation par défaut, YouTube, court, pub), le format (16:9 par défaut) et tes consignes (« je m'appelle Léa », « montre le site de Supabase quand j'en parle », « le rush est déjà coupé »).

Cliplex prépare le rush : voix nettoyée, transcription mot à mot, une image par seconde.

Claude lit tout, puis écrit le plan de montage. Il suit cet ordre de priorité :
1. tes consignes pour cette vidéo ;
2. ton style ;
3. les règles du genre (une formation doit faire comprendre et retenir : chapitres, encarts à côté de toi, listes, définitions, captures d'écran, zooms sur ce que tu montres) ;
4. les règles générales : sobre, une seule couleur d'accent, jamais d'emoji, jamais de texte sur le visage, rien qui fasse « montage IA ».

Pour illustrer, il peut chercher sur internet des images officielles ou libres (logos, captures de sites) et note leurs sources.

### 5. Le brouillon, puis tes retouches

Claude rend un brouillon en demi-résolution, le regarde image par image et se corrige. Ensuite, c'est toi qui le regardes. Tu dis ce qu'il faut changer (« le titre du chapitre 2 arrive trop tôt »), il corrige et te rend un nouveau brouillon. Autant de tours qu'il faut.

### 6. L'export

Seulement quand tu as validé : 4K (la plus nette) ou 1080p (plus rapide). Le son est masterisé. Une version déjà exportée n'est jamais écrasée.

## Où sont les fichiers

Tout est dans un seul dossier : `espace/` dans le dépôt si tu utilises Claude Code seul, ou celui choisi dans l'app. `./cliplex dossier` te le montre. Le supprimer efface tout.

```
outils/                 ffmpeg, Node, Python, modèles, moteur d'animation
inspirations/<nom>/     la vidéo, ses mesures, fiche.md, regles.json
style/                  style.md (ton style), style.json (couleurs, polices, tes réponses)
projets/<nom>/          rushs/, montage/ (plan, brouillon, montage.mp4, resume.md)
bibliotheque/polices/   polices téléchargées ou déposées
```

Ce sont des fichiers normaux : tu peux les lire, les modifier, les sauvegarder.

## Les commandes, si tu veux les lancer toi-même

`./cliplex` sans argument affiche l'aide. Les principales : `etat`, `installer`, `inspiration <fichier|lien>`, `projet`, `preparer`, `brouillon`, `exporter <id> 4k`.

Ce que Claude doit faire à chaque étape est écrit en clair dans `moteur/` : `moteur/inspirations/` pour l'analyse et le style, `moteur/claude/instructions.md` pour le montage. Tu peux les lire et les adapter.
