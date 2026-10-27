// Types partagés entre le processus principal, le preload et l'interface.

export type Objectif = 'montage' | 'planification' | 'tournage' | 'formation' | 'youtube' | 'courts'

export interface Reglages {
  /** Accueil terminé : on ouvre directement l'application. */
  accueilFini: boolean
  objectifs: Objectif[]
  /** Dossier Cliplex : outils, projets, inspirations, style. Supprimer ce dossier efface tout. */
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

export interface EtatChrome {
  /** Google Chrome est installé. */
  chrome: boolean
  /** L'extension Claude est installée dans au moins un profil Chrome. */
  extension: boolean
}

export type TypeInspiration = 'video' | 'image' | 'lien'

export interface Inspiration {
  id: string
  type: TypeInspiration
  titre: string
  /** Nom du fichier dans media/, ou adresse du lien. */
  source: string
  note?: string
  ajouteLe: string
  etat: 'nouvelle' | 'analyse' | 'analysee' | 'erreur'
  style?: string
  resume?: string
  regles?: string[]
  analyseLe?: string
  erreur?: string
}

export interface LigneInspiration {
  /** Id de l'inspiration, ou « style » pendant la synthèse. */
  id: string
  texte: string
}

export interface Question {
  id: string
  question: string
  pourquoi?: string
  choix?: string[]
  reponse?: string
}

export interface Theme {
  accent?: string
  texte?: string
  fond?: string
  police?: string
  policeTitre?: string
}

export interface Style {
  existe: boolean
  nom?: string
  resume?: string
  theme?: Theme
  questions: Question[]
  majLe?: string
  /** Inspirations prises en compte. */
  sources: string[]
  /** Contenu de style.md. */
  texte?: string
}

export type Genre = 'formation' | 'youtube' | 'court' | 'pub'

export interface Projet {
  id: string
  titre: string
  format: '9x16' | '16x9' | '1x1' | '4x5'
  /** Genre de vidéo : règles de montage adaptées (formation par défaut). */
  genre?: Genre
  /** Applique le style tiré des inspirations (oui par défaut s'il existe). */
  avecStyle?: boolean
  consignes: string
  rushs: { nom: string; taille: number }[]
  creeLe: string
  majLe: string
  statut: 'brouillon' | 'pret' | 'montage' | 'monte'
  /** Étape en cours pendant un montage. */
  etape?: EtapeMontage
  /** Vidéo finale, relative au dossier du projet. */
  video?: string
  erreur?: string
}

export type EtapeMontage = 'preparation' | 'claude' | 'rendu' | 'fini'

export interface LigneMontage {
  id: string
  etape: EtapeMontage
  texte: string
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
    chrome(): Promise<EtatChrome>
    installerExtension(): Promise<void>
  }
  inspirations: {
    lister(): Promise<Inspiration[]>
    /** Ouvre le sélecteur de fichiers (vidéos, images). */
    ajouterFichiers(): Promise<Inspiration[]>
    /** Fichiers glissés dans la fenêtre. */
    deposer(chemins: string[]): Promise<Inspiration[]>
    ajouterLien(url: string, note: string): Promise<Inspiration>
    supprimer(id: string): Promise<void>
    analyser(id: string): Promise<Inspiration>
    arreter(id: string): Promise<void>
    journal(rappel: (ligne: LigneInspiration) => void): () => void
    /** Adresse lisible par <img> ou <video> pour un fichier de l'inspiration. */
    adresse(id: string, fichier: string): string
    /** Chemin local d'un fichier glissé dans la fenêtre. */
    cheminDe(fichier: File): string
  }
  style: {
    lire(): Promise<Style>
    synthetiser(): Promise<Style>
    repondre(question: string, reponse: string): Promise<Style>
    modifierTexte(texte: string): Promise<Style>
  }
  projets: {
    lister(): Promise<Projet[]>
    creer(titre: string, format: Projet['format'], genre: Genre): Promise<Projet>
    modifier(id: string, partiel: Partial<Projet>): Promise<Projet>
    ajouterRushs(id: string): Promise<Projet>
    ouvrirDossier(id: string): Promise<void>
    /** Adresse lisible par la balise <video> pour un fichier du projet. */
    adresse(id: string, fichier: string): string
  }
  montage: {
    lancer(id: string): Promise<Projet>
    arreter(id: string): Promise<void>
    journal(rappel: (ligne: LigneMontage) => void): () => void
  }
}
