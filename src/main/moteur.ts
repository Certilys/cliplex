import { app } from 'electron'
import { spawn } from 'child_process'
import { appendFileSync, copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { EtapeMontage, Projet } from '../shared/types'
import { env } from './environnement'
import { dossierProjet, modifierProjet } from './projets'
import { dossierOutils } from './reglages'

/** Moteur de montage livré avec l'app : outils (préparation, compilation, rendu), studio Remotion, instructions pour Claude. */
export function dossierMoteur(): string {
  // Développement : out/main/ → racine du dépôt. App installée : Contents/Resources/moteur.
  return app.isPackaged ? join(process.resourcesPath, 'moteur') : join(__dirname, '..', '..', 'moteur')
}

/** Studio Remotion installé (avec ses dépendances) dans le dossier des outils. */
export function dossierStudio(): string {
  return join(dossierOutils(), 'studio')
}

const FORMATS: Record<Projet['format'], [number, number]> = { '9x16': [1080, 1920], '16x9': [1920, 1080], '1x1': [1080, 1080], '4x5': [1080, 1350] }

export type Journal = (etape: EtapeMontage, texte: string) => void

const enCours = new Map<string, () => void>()

function variables(): NodeJS.ProcessEnv {
  return {
    ...env(),
    CLIPLEX_MOTEUR: dossierMoteur(),
    CLIPLEX_OUTILS: dossierOutils(),
    CLIPLEX_STUDIO: dossierStudio()
  }
}

/** Lance une commande et transmet chaque ligne ; rend le code de sortie. */
function executer(cmd: string, args: string[], cwd: string, ligne: (t: string) => void, id: string): Promise<number> {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd, env: variables(), stdio: ['ignore', 'pipe', 'pipe'] })
    enCours.set(id, () => p.kill('SIGTERM'))
    let reste = ''
    const lire = (b: Buffer) => {
      const morceaux = (reste + b.toString()).split(/\r?\n/)
      reste = morceaux.pop() ?? ''
      for (const m of morceaux) if (m.trim()) ligne(m)
    }
    p.stdout.on('data', lire)
    p.stderr.on('data', lire)
    p.on('close', (code) => {
      if (reste.trim()) ligne(reste)
      resolve(code ?? 1)
    })
    p.on('error', (e) => {
      ligne(e.message)
      resolve(1)
    })
  })
}

// Traduit les actions de Claude Code (flux stream-json) en phrases lisibles.
function decrireOutil(nom: string, entree: any): string | null {
  const f = String(entree?.file_path ?? entree?.path ?? '')
  const court = f.split('/').slice(-2).join('/')
  if (nom === 'Read') return f.includes('planche') ? `Regarde ${court}` : `Lit ${court}`
  if (nom === 'Write' || nom === 'Edit') return f.endsWith('plan.json') ? 'Écrit le plan de montage' : `Écrit ${court}`
  if (nom === 'Bash') return String(entree?.command ?? '').trim().startsWith('./rendre-brouillon.sh') ? 'Rend un brouillon pour vérifier' : `Lance : ${String(entree?.command ?? '').split('\n')[0].slice(0, 80)}`
  if (nom === 'Glob' || nom === 'Grep') return null
  return nom
}

function consignes(p: Projet): string {
  const [l, h] = FORMATS[p.format]
  return [
    `Titre : ${p.titre}`,
    `Format de sortie : ${p.format.replace('x', ':')} (${l}x${h}). Mets "format": {"largeur": ${l}, "hauteur": ${h}} dans le plan.`,
    '',
    'Consignes de la personne :',
    p.consignes.trim() || '(aucune consigne particulière : applique les règles de montage)'
  ].join('\n')
}

export async function lancerMontage(id: string, envoyer: Journal): Promise<Projet> {
  if (enCours.has(id)) throw new Error('Un montage est déjà en cours pour cette vidéo.')
  const dossier = dossierProjet(id)
  const montage = join(dossier, 'montage')
  mkdirSync(montage, { recursive: true })
  // Chaque montage garde son journal complet (montage/journal.txt), utile pour comprendre un échec.
  writeFileSync(join(montage, 'journal.txt'), `Montage du ${new Date().toLocaleString('fr-FR')}\n`)
  const journal: Journal = (etape, texte) => {
    appendFileSync(join(montage, 'journal.txt'), `[${etape}] ${texte}\n`)
    envoyer(etape, texte)
  }
  const rushs = readdirSync(join(dossier, 'rushs'))
    .filter((f) => /\.(mp4|mov|m4v|webm|mkv)$/i.test(f))
    .sort()
    .map((f) => join(dossier, 'rushs', f))
  if (!rushs.length) throw new Error('Ajoute au moins un rush.')
  const moteur = dossierMoteur()
  let p = modifierProjet(id, { statut: 'montage', etape: 'preparation', erreur: undefined })

  const echec = (etape: EtapeMontage, message: string): Projet => {
    enCours.delete(id)
    journal(etape, message)
    return modifierProjet(id, { statut: 'pret', etape: undefined, erreur: message })
  }

  try {
    // 1. Préparation : voix nettoyée, transcription mot à mot, planches. Refaite seulement si les rushs ont changé.
    const empreinte = rushs.map((r) => r.split('/').pop()).join('|')
    const marque = join(montage, '.rushs')
    const deja = existsSync(join(montage, 'transcript.txt')) && existsSync(marque) && readFileSync(marque, 'utf8').trim() === empreinte
    if (deja) journal('preparation', 'Rushs déjà préparés.')
    else {
      journal('preparation', `Préparation de ${rushs.length} rush${rushs.length > 1 ? 's' : ''} : voix, transcription, images.`)
      const code = await executer(join(moteur, 'outils', 'preparer.sh'), [montage, ...rushs], dossier, (t) => journal('preparation', t), id)
      if (code !== 0) return echec('preparation', 'La préparation a échoué.')
      writeFileSync(join(montage, '.rushs'), empreinte)
    }

    // Le studio installé reçoit toujours les sources du moteur livré avec l'app (ses dépendances restent en place).
    if (!existsSync(join(dossierStudio(), 'node_modules', 'remotion'))) return echec('preparation', "Le moteur d'animation n'est pas installé : ouvre l'installation des outils.")
    cpSync(join(moteur, 'studio', 'src'), join(dossierStudio(), 'src'), { recursive: true })
    copyFileSync(join(moteur, 'studio', 'remotion.config.ts'), join(dossierStudio(), 'remotion.config.ts'))

    // 2. Montage par Claude Code, dans le dossier du montage, avec les instructions Cliplex.
    p = modifierProjet(id, { etape: 'claude' })
    copyFileSync(join(moteur, 'claude', 'instructions.md'), join(montage, 'CLAUDE.md'))
    writeFileSync(join(montage, 'consignes.txt'), consignes(p))
    writeFileSync(join(montage, 'rendre-brouillon.sh'), `#!/bin/bash\n# Rend un brouillon (demi-résolution) pour vérifier le plan.\nexec "${join(moteur, 'outils', 'rendre.sh')}" "$(dirname "$0")" --brouillon\n`, { mode: 0o755 })
    journal('claude', 'Claude Code lit le rush et écrit le montage.')
    let resultat = ''
    const code = await executer(
      'claude',
      [
        '-p',
        'Monte cette vidéo en suivant CLAUDE.md et consignes.txt. Pour rendre un brouillon, lance ./rendre-brouillon.sh. Termine par resume.md.',
        '--output-format',
        'stream-json',
        '--verbose',
        '--allowedTools',
        'Read,Write,Edit,Glob,Grep,Bash(./rendre-brouillon.sh:*),Bash(ls:*)'
      ],
      montage,
      (t) => {
        try {
          const m = JSON.parse(t)
          if (m.type === 'assistant')
            for (const c of m.message?.content ?? []) {
              if (c.type === 'text' && c.text.trim()) journal('claude', c.text.trim())
              if (c.type === 'tool_use') {
                const d = decrireOutil(c.name, c.input)
                if (d) journal('claude', d)
              }
            }
          if (m.type === 'result') resultat = m.subtype
        } catch {
          journal('claude', t)
        }
      },
      id
    )
    if (code !== 0 || resultat !== 'success' || !existsSync(join(montage, 'plan.json'))) return echec('claude', 'Claude Code n’a pas terminé le montage.')

    // 3. Rendu final en pleine qualité.
    p = modifierProjet(id, { etape: 'rendu' })
    journal('rendu', 'Rendu final en pleine qualité.')
    const rendu = await executer(join(moteur, 'outils', 'rendre.sh'), [montage], montage, (t) => journal('rendu', t), id)
    // Le format vient du plan (consignes.txt) : la sortie s'appelle toujours montage.mp4.
    const video = 'montage.mp4'
    if (rendu !== 0 || !existsSync(join(montage, video))) return echec('rendu', 'Le rendu final a échoué.')
    enCours.delete(id)
    journal('fini', 'Vidéo prête.')
    return modifierProjet(id, { statut: 'monte', etape: undefined, video: `montage/${video}` })
  } catch (e) {
    return echec('preparation', e instanceof Error ? e.message : String(e))
  }
}

export function arreterMontage(id: string): void {
  enCours.get(id)?.()
  enCours.delete(id)
}
