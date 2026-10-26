import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { is } from '@electron-toolkit/utils'
import { writeFileSync } from 'fs'
import { join } from 'path'
import type { LigneJournal, Projet, Reglages } from '../shared/types'
import { connecterClaude, etatClaude } from './claude'
import { commandeTerminal, installerOutil, listerOutils } from './outils'
import { copierRushs, creerProjet, dossierProjet, listerProjets, modifierProjet } from './projets'
import { ecrireReglages, lireReglages } from './reglages'
import { ouvrirTerminal } from './terminal'

let fenetre: BrowserWindow | null = null

function creerFenetre(): void {
  fenetre = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    title: 'Cliplex',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#F4F4F5',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true
    }
  })
  fenetre.on('ready-to-show', () => fenetre?.show())
  // Les liens externes s'ouvrent dans le navigateur, jamais dans l'app.
  fenetre.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  // Développement : CLIPLEX_ETAPE ouvre l'accueil à cette étape, CLIPLEX_PAGE l'app sur cette page.
  if (is.dev && process.env.ELECTRON_RENDERER_URL) fenetre.loadURL(`${process.env.ELECTRON_RENDERER_URL}?etape=${process.env.CLIPLEX_ETAPE ?? ''}&page=${process.env.CLIPLEX_PAGE ?? ''}`)
  else fenetre.loadFile(join(__dirname, '../renderer/index.html'))
  if (is.dev && process.env.CLIPLEX_CAPTURE) capturerEnBoucle(process.env.CLIPLEX_CAPTURE)
}

// Développement : capture la fenêtre toutes les 2 s dans <dossier>/ecran.png,
// pour vérifier l'interface sans intervention.
function capturerEnBoucle(dossier: string): void {
  setInterval(async () => {
    const image = await fenetre?.webContents.capturePage()
    if (image) writeFileSync(join(dossier, 'ecran.png'), image.toPNG())
  }, 2000)
}

function journal(ligne: LigneJournal): void {
  fenetre?.webContents.send('outils:journal', ligne)
}

function brancherIpc(): void {
  ipcMain.handle('reglages:lire', () => lireReglages())
  ipcMain.handle('reglages:ecrire', (_e, partiel: Partial<Reglages>) => ecrireReglages(partiel))
  ipcMain.handle('reglages:choisirDossier', async () => {
    const r = await dialog.showOpenDialog(fenetre!, {
      title: 'Dossier de travail Cliplex',
      buttonLabel: 'Choisir ce dossier',
      properties: ['openDirectory', 'createDirectory']
    })
    return r.canceled ? null : r.filePaths[0]
  })

  ipcMain.handle('outils:lister', () => listerOutils())
  ipcMain.handle('outils:installer', async (_e, id: string) => {
    const terminal = commandeTerminal(id)
    if (terminal) {
      journal({ outil: id, type: 'note', texte: '# Cette installation demande ton mot de passe : elle s’ouvre dans le Terminal.' })
      journal({ outil: id, type: 'commande', texte: terminal })
      await ouvrirTerminal(terminal)
      return false
    }
    return installerOutil(id, journal)
  })

  ipcMain.handle('claude:etat', () => etatClaude())
  ipcMain.handle('claude:connecter', () => connecterClaude())

  ipcMain.handle('projets:lister', () => listerProjets())
  ipcMain.handle('projets:creer', (_e, titre: string, format: Projet['format']) => creerProjet(titre, format))
  ipcMain.handle('projets:modifier', (_e, id: string, partiel: Partial<Projet>) => modifierProjet(id, partiel))
  ipcMain.handle('projets:ajouterRushs', async (_e, id: string) => {
    const r = await dialog.showOpenDialog(fenetre!, {
      title: 'Ajouter des rushs',
      buttonLabel: 'Ajouter',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Vidéos', extensions: ['mp4', 'mov', 'm4v', 'webm', 'mkv'] }]
    })
    return r.canceled ? modifierProjet(id, {}) : copierRushs(id, r.filePaths)
  })
  ipcMain.handle('projets:ouvrirDossier', (_e, id: string) => shell.openPath(dossierProjet(id)))
}

app.setName('Cliplex')
// Développement : données isolées (réglages, état de l'accueil) pour les essais.
if (is.dev && process.env.CLIPLEX_DONNEES) app.setPath('userData', process.env.CLIPLEX_DONNEES)
app.whenReady().then(() => {
  brancherIpc()
  creerFenetre()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) creerFenetre()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
