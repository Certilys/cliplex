# Analyse d'une vidéo d'inspiration

La personne a déposé cette vidéo comme inspiration. Ton travail : comprendre précisément comment elle est montée, pour que Cliplex monte ses propres vidéos dans le même esprit. Tu ne la copies pas, tu en tires des règles.

Vidéo : `{{MEDIA}}`. Mesures déjà faites dans `analyse/` :
- `analyse/dossier.md` : format, durée, coupes, blancs, transcription horodatée. Des coupes très rapprochées sont une transition, pas plusieurs plans.
- `analyse/planches/p*.jpg` : la vidéo image par image (l'intervalle est indiqué dans dossier.md). **Regarde toutes les planches.**
- Pour voir un moment de près : `ffmpeg -hide_banner -loglevel error -y -ss <secondes> -i "{{MEDIA}}" -frames:v 1 -vf scale=960:-2 analyse/zoom_<secondes>.jpg`, puis lis l'image. Fais-le pour les textes à l'écran, les polices, les schémas, les zooms sur l'écran.
- Tu ne peux pas écouter. Pour le son, déduis-le (blancs, rythme) et écris « probable ».

Observe en particulier :
- le type de vidéo (formation, tutoriel écran, face caméra, pub, vlog…) et sa structure (introduction, chapitres, fin) ;
- le rythme : durée des plans, coupes dans la parole, respirations ;
- le cadrage : zooms (fréquence, force, sur quoi), recadrages, zooms sur une zone de l'écran ;
- tout ce qui s'affiche : sous-titres (oui ou non, position, taille, casse, nombre de mots), titres de chapitre, encarts à côté de la personne, listes, schémas, captures d'écran, flèches, surlignages ;
- la direction artistique : couleurs exactes (approxime en hexadécimal), polices (famille probable, graisse, casse), fonds, ombres, coins arrondis, sobriété ou effets ;
- les transitions et animations (entrées, sorties, vitesse) ;
- ce qui n'est **pas** fait (pas de sous-titres, pas de musique, pas d'emoji…) : c'est aussi une règle.
