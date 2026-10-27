import { execFile } from 'child_process'

/**
 * Ouvre le Terminal de macOS avec une commande déjà tapée et lancée.
 * Utilisé pour la connexion à Claude, qui se fait dans le navigateur :
 * la personne garde la main et voit tout.
 */
export function ouvrirTerminal(commande: string): Promise<void> {
  const echappee = commande.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const script = `tell application "Terminal"\n activate\n do script "${echappee}"\nend tell`
  return new Promise((resolve) => execFile('osascript', ['-e', script], () => resolve()))
}
