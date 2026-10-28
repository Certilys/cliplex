// Composants écrits pour un montage précis (montage/composants/*.tsx) : rendre.sh les copie dans
// src/projets/<projet>/ et les enregistre ici avant le rendu. Le plan les appelle avec
// {"type": "perso", "composant": "<nom du fichier>", …}.
export const PERSO: Record<string, React.FC<{ el: any; theme: any }>> = {};
