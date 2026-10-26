import { contextBridge, ipcRenderer } from 'electron'
import type { Api, LigneJournal } from '../shared/types'

const api: Api = {
  reglages: {
    lire: () => ipcRenderer.invoke('reglages:lire'),
    ecrire: (partiel) => ipcRenderer.invoke('reglages:ecrire', partiel),
    choisirDossier: () => ipcRenderer.invoke('reglages:choisirDossier')
  },
  outils: {
    lister: () => ipcRenderer.invoke('outils:lister'),
    installer: (id) => ipcRenderer.invoke('outils:installer', id),
    journal: (rappel) => {
      const ecoute = (_e: unknown, ligne: LigneJournal) => rappel(ligne)
      ipcRenderer.on('outils:journal', ecoute)
      return () => ipcRenderer.removeListener('outils:journal', ecoute)
    }
  },
  claude: {
    etat: () => ipcRenderer.invoke('claude:etat'),
    connecter: () => ipcRenderer.invoke('claude:connecter')
  },
  projets: {
    lister: () => ipcRenderer.invoke('projets:lister'),
    creer: (titre, format) => ipcRenderer.invoke('projets:creer', titre, format),
    modifier: (id, partiel) => ipcRenderer.invoke('projets:modifier', id, partiel),
    ajouterRushs: (id) => ipcRenderer.invoke('projets:ajouterRushs', id),
    ouvrirDossier: (id) => ipcRenderer.invoke('projets:ouvrirDossier', id)
  }
}

contextBridge.exposeInMainWorld('cliplex', api)
