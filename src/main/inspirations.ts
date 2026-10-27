import { spawn } from 'child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { basename, extname, join } from 'path'
import type { Activite, Inspiration, Question, Style } from '../shared/types'
import { lecteurClaude } from './activite'
import { env } from './environnement'
import { dossierMoteur, dossierStudio } from './moteur'
import { sousDossier } from './reglages'

// Tout reste dans le dossier Cliplex :
//   inspirations/<id>/inspiration.json   état, règles apprises
//   inspirations/<id>/media/             vidéo ou image déposée
//   inspirations/<id>/analyse/           mesures (coupes, planches, transcription)
//   inspirations/<id>/fiche.md           analyse détaillée écrite par Claude
//   style/style.md, style/style.json     le style de la personne, tiré de toutes ses inspirations

const VIDEO = /\.(mp4|mov|m4v|webm|mkv)$/i
const IMAGE = /\.(jpe?g|png|webp|gif|heic)$/i

export type JournalInspiration = (id: string, a: Activite) => void

const racine = () => sousDossier('inspirations')
const dossierStyle = () => sousDossier('style')
export const dossierInspiration = (id: string) => join(racine(), id)

function slug(texte: string): string {
  const base =
    texte
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/^https?:\/\/(www\.)?/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'inspiration'
  let id = base
  for (let n = 2; existsSync(dossierInspiration(id)); n++) id = `${base}-${n}`
  return id
}

function lire(id: string): Inspiration | null {
  try {
    return JSON.parse(readFileSync(join(dossierInspiration(id), 'inspiration.json'), 'utf8'))
  } catch {
    return null
  }
}

function ecrire(i: Inspiration): Inspiration {
  writeFileSync(join(dossierInspiration(i.id), 'inspiration.json'), JSON.stringify(i, null, 2))
  return i
}

function modifier(id: string, partiel: Partial<Inspiration>): Inspiration {
  const i = lire(id)
  if (!i) throw new Error(`Inspiration introuvable : ${id}`)
  return ecrire({ ...i, ...partiel })
}

export function listerInspirations(): Inspiration[] {
  return readdirSync(racine())
    .map(lire)
    .filter((i): i is Inspiration => i !== null)
    // Une analyse coupée (app fermée en route) se relance.
    .map((i) => (i.etat === 'analyse' && !enCours.has(i.id) ? modifier(i.id, { etat: 'erreur', erreur: 'Analyse interrompue.' }) : i))
    .sort((a, b) => b.ajouteLe.localeCompare(a.ajouteLe))
}

export function ajouterFichiers(fichiers: string[]): Inspiration[] {
  return fichiers
    .filter((f) => VIDEO.test(f) || IMAGE.test(f))
    .map((f) => {
      const titre = basename(f, extname(f))
      const id = slug(titre)
      mkdirSync(join(dossierInspiration(id), 'media'), { recursive: true })
      copyFileSync(f, join(dossierInspiration(id), 'media', basename(f)))
      return ecrire({ id, type: VIDEO.test(f) ? 'video' : 'image', titre, source: basename(f), ajouteLe: new Date().toISOString(), etat: 'nouvelle' })
    })
}

export function ajouterLien(url: string, note: string): Inspiration {
  const propre = url.trim()
  if (!/^https?:\/\//.test(propre)) throw new Error('Colle un lien complet, qui commence par https://')
  const id = slug(propre.replace(/[?&](si|feature|pp)=[^&]*/g, ''))
  mkdirSync(dossierInspiration(id), { recursive: true })
  return ecrire({ id, type: 'lien', titre: propre.replace(/^https?:\/\/(www\.)?/, ''), source: propre, note: note.trim() || undefined, ajouteLe: new Date().toISOString(), etat: 'nouvelle' })
}

export function supprimerInspiration(id: string): void {
  if (lire(id)) rmSync(dossierInspiration(id), { recursive: true, force: true })
}

const enCours = new Map<string, () => void>()

/** Lance Claude Code (ou un script) et transmet ce qu'il fait, en phrases lisibles. */
function executer(cmd: string, args: string[], cwd: string, ligne: (t: string) => void, cle: string): Promise<number> {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, {
      cwd,
      env: { ...env(), CLIPLEX_MOTEUR: dossierMoteur(), CLIPLEX_OUTILS: sousDossier('outils'), CLIPLEX_STUDIO: dossierStudio() },
      stdio: ['ignore', 'pipe', 'pipe']
    })
    enCours.set(cle, () => p.kill('SIGTERM'))
    let reste = ''
    const lireFlux = (b: Buffer) => {
      const morceaux = (reste + b.toString()).split(/\r?\n/)
      reste = morceaux.pop() ?? ''
      for (const m of morceaux) if (m.trim()) ligne(m)
    }
    p.stdout.on('data', lireFlux)
    p.stderr.on('data', lireFlux)
    p.on('close', (code) => {
      if (reste.trim()) ligne(reste)
      enCours.delete(cle)
      resolve(code ?? 1)
    })
    p.on('error', (e) => {
      ligne(e.message)
      enCours.delete(cle)
      resolve(1)
    })
  })
}

const PROMPTS: Record<Inspiration['type'], string> = {
  video: 'Analyse cette inspiration en suivant CLAUDE.md : regarde toutes les planches de analyse/, lis analyse/dossier.md, puis écris fiche.md et regles.json.',
  image: 'Analyse cette image d’inspiration en suivant CLAUDE.md, puis écris fiche.md et regles.json.',
  lien: 'Analyse la vidéo du lien indiqué dans CLAUDE.md, avec ton navigateur, en suivant CLAUDE.md. Écris fiche.md et regles.json.'
}

export async function analyserInspiration(id: string, journal: JournalInspiration): Promise<Inspiration> {
  const i = lire(id)
  if (!i) throw new Error(`Inspiration introuvable : ${id}`)
  if (enCours.has(id)) return i
  const d = dossierInspiration(id)
  const moteur = join(dossierMoteur(), 'inspirations')
  const echec = (message: string) => {
    journal(id, { genre: 'erreur', texte: message })
    return modifier(id, { etat: 'erreur', erreur: message })
  }
  modifier(id, { etat: 'analyse', erreur: undefined })
  rmSync(join(d, 'fiche.md'), { force: true })
  rmSync(join(d, 'regles.json'), { force: true })

  // 1. Mesures (vidéo seulement) : coupes, planches d'images, silences, transcription.
  if (i.type === 'video') {
    journal(id, { genre: 'info', icone: 'actualiser', texte: 'Mesure le rythme : coupes, silences, images, paroles.' })
    const code = await executer(join(moteur, 'mesurer.sh'), [d], d, (t) => journal(id, { genre: 'technique', texte: t }), id)
    if (code !== 0) return echec('Les mesures de la vidéo ont échoué.')
  }

  // 2. Claude Code regarde et écrit la fiche et les règles.
  const consignes = readFileSync(join(moteur, `analyse-${i.type}.md`), 'utf8')
    .replaceAll('{{LIEN}}', i.source)
    .replaceAll('{{NOTE}}', i.note ?? '')
    .replaceAll('{{MEDIA}}', `media/${i.source}`)
  writeFileSync(join(d, 'CLAUDE.md'), `${consignes}\n\n${readFileSync(join(moteur, 'sortie.md'), 'utf8')}`)
  journal(id, { genre: 'info', icone: 'agent', texte: i.type === 'lien' ? 'Claude ouvre la vidéo dans Chrome et la regarde.' : 'Claude regarde la vidéo et note ce qui fait son style.' })
  const outils = i.type === 'lien' ? 'Read,Write,mcp__claude-in-chrome__*' : 'Read,Write,Glob,Bash(ffmpeg:*)'
  const { ligne, etat } = lecteurClaude((a) => journal(id, a))
  const args = ['-p', PROMPTS[i.type], '--output-format', 'stream-json', '--verbose', '--allowedTools', outils]
  if (i.type === 'lien') args.push('--chrome')
  const code = await executer('claude', args, d, ligne, id)
  if (code !== 0 || etat.resultat !== 'success') return echec('Claude n’a pas terminé l’analyse.')
  try {
    const r = JSON.parse(readFileSync(join(d, 'regles.json'), 'utf8'))
    journal(id, { genre: 'succes', texte: `Analyse terminée : ${r.regles?.length ?? 0} règles apprises.` })
    return modifier(id, { etat: 'analysee', style: r.style, resume: r.resume, regles: r.regles ?? [], titre: i.type === 'lien' && r.titre ? r.titre : i.titre, analyseLe: new Date().toISOString() })
  } catch {
    return echec('La fiche n’a pas été produite.')
  }
}

export function arreterInspiration(id: string): void {
  enCours.get(id)?.()
  enCours.delete(id)
  if (lire(id)?.etat === 'analyse') modifier(id, { etat: 'erreur', erreur: 'Analyse arrêtée.' })
}

// Style : la synthèse de toutes les inspirations analysées, plus les réponses de la personne.

function lireStyleJson(): Partial<Style> {
  try {
    return JSON.parse(readFileSync(join(dossierStyle(), 'style.json'), 'utf8'))
  } catch {
    return {}
  }
}

export function lireStyle(): Style {
  const j = lireStyleJson()
  const md = join(dossierStyle(), 'style.md')
  return {
    existe: existsSync(md),
    nom: j.nom,
    resume: j.resume,
    theme: j.theme,
    questions: j.questions ?? [],
    majLe: j.majLe,
    sources: j.sources ?? [],
    texte: existsSync(md) ? readFileSync(md, 'utf8') : undefined
  }
}

export function repondreQuestion(id: string, reponse: string): Style {
  const j = lireStyleJson()
  const questions = (j.questions ?? []).map((q: Question) => (q.id === id ? { ...q, reponse: reponse.trim() || undefined } : q))
  writeFileSync(join(dossierStyle(), 'style.json'), JSON.stringify({ ...j, questions }, null, 2))
  return lireStyle()
}

export function modifierStyleTexte(texte: string): Style {
  writeFileSync(join(dossierStyle(), 'style.md'), texte)
  return lireStyle()
}

export async function synthetiserStyle(journal: JournalInspiration): Promise<Style> {
  const analysees = listerInspirations().filter((i) => i.etat === 'analysee')
  if (!analysees.length) throw new Error('Analyse au moins une inspiration avant de créer ton style.')
  const d = dossierStyle()
  const moteur = join(dossierMoteur(), 'inspirations')
  writeFileSync(join(d, 'CLAUDE.md'), readFileSync(join(moteur, 'synthese.md'), 'utf8'))
  writeFileSync(join(d, 'inspirations.txt'), analysees.map((i) => `../inspirations/${i.id}/  (${i.type}) ${i.titre}`).join('\n') + '\n')
  sousDossier(join('bibliotheque', 'polices'))
  journal('style', { genre: 'info', icone: 'agent', texte: `Claude relit tes ${analysees.length} inspiration${analysees.length > 1 ? 's' : ''} et écrit ton style.` })
  const { ligne, etat } = lecteurClaude((a) => journal('style', a))
  const code = await executer(
    'claude',
    ['-p', 'Écris le style de la personne en suivant CLAUDE.md.', '--output-format', 'stream-json', '--verbose', '--allowedTools', 'Read,Write,Edit,Glob,Bash(curl:*),Bash(ls:*)', '--add-dir', join(d, '..')],
    d,
    ligne,
    'style'
  )
  if (code !== 0 || etat.resultat !== 'success' || !existsSync(join(d, 'style.md'))) throw new Error('Claude n’a pas terminé ton style.')
  const j = lireStyleJson()
  // Les réponses déjà données restent, même si Claude a reformulé les questions.
  writeFileSync(join(d, 'style.json'), JSON.stringify({ ...j, majLe: new Date().toISOString(), sources: analysees.map((i) => i.id) }, null, 2))
  journal('style', { genre: 'succes', texte: 'Ton style est prêt.' })
  return lireStyle()
}

/** Texte du style donné à Claude au moment du montage : style.md, puis les réponses de la personne. */
export function styleDuMontage(): { texte: string; theme?: Style['theme'] } | null {
  const s = lireStyle()
  if (!s.existe || !s.texte) return null
  const reponses = s.questions.filter((q) => q.reponse)
  const choix = reponses.length ? `\n\n## Choix de la personne (prioritaires)\n${reponses.map((q) => `- ${q.question} ${q.reponse}`).join('\n')}\n` : ''
  return { texte: s.texte + choix, theme: s.theme }
}
