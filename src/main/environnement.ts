import { execFile, spawn } from 'child_process'
import { existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { dossierOutils } from './reglages'

/** Emplacements des outils installés par Cliplex, dans <dossier>/outils. */
export function chemins() {
  const o = dossierOutils()
  return {
    outils: o,
    bin: join(o, 'bin'),
    node: join(o, 'node', 'bin'),
    python: join(o, 'python', 'bin', 'python'),
    claude: join(o, 'claude', 'node_modules', '.bin'),
    /** Présent quand Claude Code a été installé par Cliplex (et non trouvé déjà sur le Mac). */
    claudeLocal: join(o, 'claude', '.cliplex'),
    configClaude: join(o, 'claude', 'config'),
    cache: join(o, 'cache')
  }
}

// Une app lancée depuis le Finder n'hérite pas du PATH du terminal.
// Les outils de Cliplex passent en premier ; ensuite les emplacements habituels,
// pour retrouver ce que la personne a déjà (Claude Code, ffmpeg, Node…) au lieu de le réinstaller.
const SYSTEME = [join(homedir(), '.local/bin'), join(homedir(), 'n/bin'), join(homedir(), '.volta/bin'), '/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin']

export function env(): NodeJS.ProcessEnv {
  const c = chemins()
  const actuels = (process.env.PATH ?? '').split(':').filter(Boolean)
  const path = [...new Set([c.bin, c.node, c.claude, ...SYSTEME, ...actuels])].join(':')
  const e: NodeJS.ProcessEnv = {
    ...process.env,
    PATH: path,
    // Caches de npm et de uv dans le dossier des outils, pas dans ~/.npm ni ~/.cache.
    npm_config_cache: join(c.cache, 'npm'),
    npm_config_update_notifier: 'false',
    UV_CACHE_DIR: join(c.cache, 'uv'),
    UV_PYTHON_INSTALL_DIR: join(c.outils, 'python-dist')
  }
  // Claude Code installé par Cliplex garde aussi sa configuration dans le dossier.
  if (existsSync(c.claudeLocal)) e.CLAUDE_CONFIG_DIR = c.configClaude
  return e
}

/** Les mêmes variables, à coller en tête d'une commande lancée dans le Terminal. */
export function exportsShell(): string {
  const e = env()
  return ['PATH', 'CLAUDE_CONFIG_DIR']
    .filter((n) => e[n])
    .map((n) => `export ${n}="${e[n]}"`)
    .join('; ')
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
