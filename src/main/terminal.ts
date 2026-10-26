import { execFile } from 'child_process'

/**
 * Ouvre le Terminal de macOS avec une commande déjà tapée et lancée.
 * Utilisé quand l'installation demande le mot de passe du Mac ou une
 * connexion dans le navigateur : la personne garde la main et voit tout.
 */
export function ouvrirTerminal(commande: string): Promise<void> {
  const echappee = commande.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const script = `tell application "Terminal"\n activate\n do script "${echappee}"\nend tell`
  return new Promise((resolve) => execFile('osascript', ['-e', script], () => resolve()))
}
