import type { EtatClaude } from '../shared/types'
import { lancer } from './environnement'
import { ouvrirTerminal } from './terminal'

/**
 * Cliplex n'a jamais accès aux identifiants : il lance le Claude Code que la
 * personne a installé et connecté elle-même, avec son propre abonnement.
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

export function connecterClaude(): Promise<void> {
  return ouvrirTerminal('claude auth login')
}
