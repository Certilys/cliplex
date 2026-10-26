import { existsSync, statSync } from 'fs'
import { join } from 'path'
import type { LigneJournal, Outil } from '../shared/types'
import { lancer, suivre } from './environnement'
import { dossierOutils } from './reglages'

export const MODELE_WHISPER = 'ggml-large-v3-turbo-q5_0.bin'

interface Definition extends Omit<Outil, 'etat' | 'version' | 'chemin' | 'commande'> {
  commande: () => string
  detecter: () => Promise<{ version?: string; chemin?: string } | null>
}

const premiere = (texte: string, motif: RegExp): string | undefined => texte.match(motif)?.[1]

function cheminModele(): string {
  return join(dossierOutils(), 'modeles', MODELE_WHISPER)
}

function pythonOutils(): string {
  return join(dossierOutils(), 'python', 'bin', 'python3')
}

// L'ordre compte : Homebrew installe ffmpeg, Node et whisper.cpp.
const DEFINITIONS: Definition[] = [
  {
    id: 'homebrew',
    nom: 'Homebrew',
    role: "Le gestionnaire d'outils de macOS. Il installe ffmpeg, Node et whisper.cpp proprement, comme le font les développeurs.",
    taille: '≈ 50 Mo',
    terminal: true,
    commande: () => '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
    detecter: async () => {
      const r = await lancer('brew', ['--version'])
      return r.ok ? { version: premiere(r.sortie, /Homebrew (\S+)/) } : null
    }
  },
  {
    id: 'ffmpeg',
    nom: 'ffmpeg',
    role: "Découpe, assemble et exporte la vidéo. C'est la base de presque tous les logiciels de montage.",
    taille: '≈ 80 Mo',
    commande: () => 'brew install ffmpeg',
    detecter: async () => {
      const r = await lancer('ffmpeg', ['-version'])
      return r.ok ? { version: premiere(r.sortie, /ffmpeg version (\S+)/) } : null
    }
  },
  {
    id: 'node',
    nom: 'Node.js',
    role: "Fait tourner le moteur d'animation qui dessine les textes, les sous-titres et les effets.",
    taille: '≈ 70 Mo',
    commande: () => 'brew install node',
    detecter: async () => {
      const r = await lancer('node', ['--version'])
      return r.ok ? { version: r.sortie.replace(/^v/, '') } : null
    }
  },
  {
    id: 'whisper',
    nom: 'whisper.cpp',
    role: 'Écoute ta voix et écrit les sous-titres, mot à mot, directement sur ton Mac. Rien n’est envoyé en ligne.',
    taille: '≈ 10 Mo',
    commande: () => 'brew install whisper.cpp',
    detecter: async () => {
      const r = await lancer('whisper-cli', ['--help'])
      if (!r.ok && !r.sortie.includes('usage')) return null
      const v = await lancer('brew', ['list', '--versions', 'whisper.cpp'])
      return { version: premiere(v.sortie, /whisper\.cpp (\S+)/) }
    }
  },
  {
    id: 'modele',
    nom: 'Modèle de transcription',
    role: 'Le « cerveau » de whisper.cpp, entraîné à reconnaître la parole en français et dans 90 autres langues.',
    taille: '≈ 575 Mo',
    commande: () => {
      const f = cheminModele()
      return `mkdir -p "${join(dossierOutils(), 'modeles')}" && curl -L --fail --progress-bar -o "${f}.part" https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${MODELE_WHISPER} && mv "${f}.part" "${f}"`
    },
    detecter: async () => {
      const f = cheminModele()
      return existsSync(f) && statSync(f).size > 400e6 ? { version: 'large-v3-turbo', chemin: f } : null
    }
  },
  {
    id: 'python',
    nom: 'Python et numpy',
    role: 'Repère les silences et les moments où tu parles, pour caler les sous-titres à la milliseconde.',
    taille: '≈ 40 Mo',
    commande: () => {
      const d = join(dossierOutils(), 'python')
      return `python3 -m venv "${d}" && "${d}/bin/pip" install --upgrade numpy`
    },
    detecter: async () => {
      const r = await lancer(pythonOutils(), ['-c', 'import numpy; print(numpy.__version__)'])
      return r.ok ? { version: `numpy ${r.sortie}`, chemin: pythonOutils() } : null
    }
  },
  {
    id: 'claude',
    nom: 'Claude Code',
    role: "L'assistant qui monte ta vidéo en suivant tes consignes. Il utilise ton propre compte Claude.",
    taille: '≈ 60 Mo',
    commande: () => 'curl -fsSL https://claude.ai/install.sh | bash',
    detecter: async () => {
      const r = await lancer('claude', ['--version'])
      return r.ok ? { version: premiere(r.sortie, /^(\S+)/) } : null
    }
  }
]

const enCours = new Set<string>()
const erreurs = new Set<string>()

export async function listerOutils(): Promise<Outil[]> {
  return Promise.all(
    DEFINITIONS.map(async ({ detecter, commande, ...d }) => {
      const base = { ...d, commande: commande() }
      if (enCours.has(d.id)) return { ...base, etat: 'installation' as const }
      const trouve = await detecter()
      if (trouve) return { ...base, etat: 'present' as const, ...trouve }
      return { ...base, etat: erreurs.has(d.id) ? ('erreur' as const) : ('absent' as const) }
    })
  )
}

export async function installerOutil(id: string, journal: (l: LigneJournal) => void): Promise<boolean> {
  const def = DEFINITIONS.find((d) => d.id === id)
  if (!def || enCours.has(id)) return false
  const commande = def.commande()
  enCours.add(id)
  erreurs.delete(id)
  journal({ outil: id, type: 'note', texte: `# ${def.nom} : ${def.role}` })
  journal({ outil: id, type: 'commande', texte: commande })
  let dernier = -1
  const ok = await suivre(commande, (texte, erreur) => {
    // Barre de progression de curl : une ligne tous les 5 %, pas des centaines.
    const pct = texte.match(/(\d+(?:\.\d+)?)%/)
    if (pct && /^[\s#]+/.test(texte)) {
      const p = Math.floor(parseFloat(pct[1]) / 5) * 5
      if (p === dernier) return
      dernier = p
      journal({ outil: id, type: 'sortie', texte: `téléchargement : ${p} %` })
      return
    }
    journal({ outil: id, type: erreur ? 'erreur' : 'sortie', texte })
  })
  enCours.delete(id)
  const present = ok && (await def.detecter())
  if (present) {
    journal({ outil: id, type: 'succes', texte: `${def.nom} est prêt${present.version ? ` (${present.version})` : ''}.` })
    return true
  }
  erreurs.add(id)
  journal({ outil: id, type: 'erreur', texte: `${def.nom} n'a pas pu être installé. La commande ci-dessus peut être lancée à la main dans le Terminal.` })
  return false
}

/** Commandes à lancer soi-même dans le Terminal (mot de passe demandé). */
export function commandeTerminal(id: string): string | null {
  const def = DEFINITIONS.find((d) => d.id === id)
  return def?.terminal ? def.commande() : null
}
