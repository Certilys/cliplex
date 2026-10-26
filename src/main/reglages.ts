import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import type { Reglages } from '../shared/types'

const DEFAUT: Reglages = { accueilFini: false, objectifs: [], dossier: null }

function fichier(): string {
  return join(app.getPath('userData'), 'reglages.json')
}

export function lireReglages(): Reglages {
  try {
    return { ...DEFAUT, ...JSON.parse(readFileSync(fichier(), 'utf8')) }
  } catch {
    return { ...DEFAUT }
  }
}

export function ecrireReglages(partiel: Partial<Reglages>): Reglages {
  const r = { ...lireReglages(), ...partiel }
  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(fichier(), JSON.stringify(r, null, 2))
  return r
}

/** Dossier de travail choisi, ou ~/Cliplex par défaut. Créé au besoin. */
export function dossierTravail(): string {
  const d = lireReglages().dossier ?? join(homedir(), 'Cliplex')
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
  return d
}

/** Outils installés par Cliplex lui-même (modèle de transcription, Python). */
export function dossierOutils(): string {
  const d = join(dossierTravail(), '.outils')
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
  return d
}
