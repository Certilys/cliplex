// Jeu d'icônes au trait, dessinées à la main sur une grille de 24.
const TRACES = {
  lecture: <path d="M6 4l14 8-14 8z" />,
  calendrier: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  telephone: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  formation: (
    <>
      <path d="M2 8l10-5 10 5-10 5z" />
      <path d="M6 10v5c3 2.5 9 2.5 12 0v-5" />
    </>
  ),
  youtube: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="3" />
      <path d="M10 9l5 3-5 3z" />
    </>
  ),
  vertical: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <path d="M10 9l4 3-4 3z" />
    </>
  ),
  maison: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  ampoule: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z" />,
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 15l5-5 4 4 3-3 6 6" />
    </>
  ),
  musique: (
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>
  ),
  modeles: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M9 9v11" />
    </>
  ),
  coche: <path d="M5 12l5 5 9-10" />,
  fleche: <path d="M5 12h14M13 6l6 6-6 6" />,
  retour: <path d="M19 12H5M11 6l-6 6 6 6" />,
  dossier: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  terminal: <path d="M4 17l6-5-6-5M12 19h8" />,
  plus: <path d="M12 5v14M5 12h14" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  telecharger: <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />,
  micro: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  recherche: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>
  ),
  actualiser: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />
}

export type NomIcone = keyof typeof TRACES

export function Icone({ nom, taille = 16, className = '' }: { nom: NomIcone; taille?: number; className?: string }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`flex-none ${className}`}
      aria-hidden
    >
      {TRACES[nom]}
    </svg>
  )
}
