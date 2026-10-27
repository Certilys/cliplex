import { shell } from 'electron'
import { existsSync, readdirSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import type { EtatChrome, EtatClaude } from '../shared/types'
import { exportsShell, lancer } from './environnement'
import { ouvrirTerminal } from './terminal'

/**
 * Cliplex n'a jamais accès aux identifiants : il lance le Claude Code de la
 * personne, connecté à son propre abonnement.
 */
export async function etatClaude(): Promise<EtatClaude> {
  const v = await lancer('claude', ['--version'])
  if (!v.ok) return { installe: false, connecte: false }
  const s = await lancer('claude', ['auth', 'status'])
  try {
    const j = JSON.parse(s.sortie)
    return { installe: true, connecte: Boolean(j.loggedIn), detail: j.loggedIn ? j.email : undefined }
  } catch {
    return { installe: true, connecte: false }
  }
}

/** Ouvre le Terminal sur la connexion : la personne se connecte dans son navigateur, Cliplex le détecte. */
export function connecterClaude(): Promise<void> {
  return ouvrirTerminal(`${exportsShell()}; claude auth login`)
}

// Extension Claude pour Chrome (Chrome Web Store) : Claude Code s'en sert pour regarder les liens YouTube.
const EXTENSION = 'fcoeoabgfenejglbffodgkkbkcdhcgfn'
const CHROME = join(homedir(), 'Library', 'Application Support', 'Google', 'Chrome')

export function etatChrome(): EtatChrome {
  const chrome = existsSync('/Applications/Google Chrome.app') || existsSync(CHROME)
  let extension = false
  try {
    extension = readdirSync(CHROME).some((profil) => existsSync(join(CHROME, profil, 'Extensions', EXTENSION)))
  } catch {
    extension = false
  }
  return { chrome, extension }
}

export function installerExtension(): Promise<void> {
  return shell.openExternal(`https://chromewebstore.google.com/detail/claude/${EXTENSION}`)
}
