// Types partagés entre le processus principal, le preload et l'interface.

export type Objectif = 'montage' | 'planification' | 'tournage' | 'formation' | 'youtube' | 'courts'

export interface Reglages {
  /** Accueil terminé : on ouvre directement l'application. */
  accueilFini: boolean
  objectifs: Objectif[]
  /** Dossier de travail : projets, rushs, montages, outils. */
  dossier: string | null
}

export type EtatOutil = 'present' | 'absent' | 'installation' | 'erreur'

export interface Outil {
  id: string
  nom: string
  /** Ce que l'outil fait dans le montage, en une phrase simple. */
  role: string
  /** Commande exacte lancée pour l'installer, affichée telle quelle. */
  commande: string
  /** Taille approximative téléchargée. */
  taille: string
  /** Doit se faire dans le Terminal (mot de passe, questions). */
  terminal?: boolean
  etat: EtatOutil
  version?: string
  chemin?: string
}

export interface LigneJournal {
  outil: string
  texte: string
  type: 'commande' | 'sortie' | 'succes' | 'erreur' | 'note'
}

export interface EtatClaude {
  installe: boolean
  connecte: boolean
  detail?: string
}

export interface Projet {
  id: string
  titre: string
  format: '9x16' | '16x9' | '1x1' | '4x5'
  consignes: string
  rushs: { nom: string; taille: number }[]
  creeLe: string
  majLe: string
  statut: 'brouillon' | 'pret' | 'montage' | 'monte'
}

export interface Api {
  reglages: {
    lire(): Promise<Reglages>
    ecrire(partiel: Partial<Reglages>): Promise<Reglages>
    choisirDossier(): Promise<string | null>
  }
  outils: {
    lister(): Promise<Outil[]>
    installer(id: string): Promise<boolean>
    journal(rappel: (ligne: LigneJournal) => void): () => void
  }
  claude: {
    etat(): Promise<EtatClaude>
    connecter(): Promise<void>
  }
  projets: {
    lister(): Promise<Projet[]>
    creer(titre: string, format: Projet['format']): Promise<Projet>
    modifier(id: string, partiel: Partial<Projet>): Promise<Projet>
    ajouterRushs(id: string): Promise<Projet>
    ouvrirDossier(id: string): Promise<void>
  }
}
