import { execFile, spawn } from 'child_process'
import { homedir } from 'os'
import { join } from 'path'

// Une app lancée depuis le Finder n'hérite pas du PATH du terminal :
// on ajoute les emplacements habituels (Homebrew, installeur Claude, npm global).
const CHEMINS = [
  '/opt/homebrew/bin',
  '/usr/local/bin',
  join(homedir(), '.local/bin'),
  join(homedir(), '.npm-global/bin'),
  '/usr/bin',
  '/bin',
  '/usr/sbin',
  '/sbin'
]

export function env(): NodeJS.ProcessEnv {
  const actuels = (process.env.PATH ?? '').split(':').filter(Boolean)
  const path = [...new Set([...CHEMINS, ...actuels])].join(':')
  return { ...process.env, PATH: path }
}

export interface Resultat {
  ok: boolean
  sortie: string
}

/** Lance une commande courte et renvoie sa sortie (jamais d'exception). */
export function lancer(cmd: string, args: string[], delai = 15000): Promise<Resultat> {
  return new Promise((resolve) => {
    execFile(cmd, args, { env: env(), timeout: delai }, (err, stdout, stderr) => {
      resolve({ ok: !err, sortie: `${stdout}${stderr}`.trim() })
    })
  })
}

/** Lance une commande shell longue en transmettant chaque ligne au journal. */
export function suivre(commande: string, ligne: (texte: string, erreur: boolean) => void): Promise<boolean> {
  return new Promise((resolve) => {
    const p = spawn('/bin/zsh', ['-c', commande], { env: env() })
    const decoupe = (erreur: boolean) => {
      let reste = ''
      return (b: Buffer) => {
        const morceaux = (reste + b.toString()).split(/\r?\n|\r/)
        reste = morceaux.pop() ?? ''
        for (const m of morceaux) if (m.trim()) ligne(m, erreur)
      }
    }
    p.stdout.on('data', decoupe(false))
    p.stderr.on('data', decoupe(true))
    p.on('close', (code) => resolve(code === 0))
    p.on('error', () => resolve(false))
  })
}
