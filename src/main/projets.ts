import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { basename, join } from 'path'
import type { Genre, Projet } from '../shared/types'
import { dossierTravail } from './reglages'

// Un projet = un dossier lisible à la main :
//   <dossier>/projets/<id>/projet.json
//   <dossier>/projets/<id>/rushs/      vidéos déposées
//   <dossier>/projets/<id>/montage/    plan, versions, sous-titres

const EXTENSIONS = /\.(mp4|mov|m4v|webm|mkv)$/i

function racine(): string {
  const d = join(dossierTravail(), 'projets')
  if (!existsSync(d)) mkdirSync(d, { recursive: true })
  return d
}

export function dossierProjet(id: string): string {
  return join(racine(), id)
}

function slug(titre: string): string {
  const base =
    titre
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'video'
  let id = base
  for (let n = 2; existsSync(dossierProjet(id)); n++) id = `${base}-${n}`
  return id
}

function rushs(id: string): Projet['rushs'] {
  const d = join(dossierProjet(id), 'rushs')
  if (!existsSync(d)) return []
  return readdirSync(d)
    .filter((f) => EXTENSIONS.test(f))
    .map((nom) => ({ nom, taille: statSync(join(d, nom)).size }))
}

function lire(id: string): Projet | null {
  try {
    const p = JSON.parse(readFileSync(join(dossierProjet(id), 'projet.json'), 'utf8')) as Projet
    return { ...p, rushs: rushs(id) }
  } catch {
    return null
  }
}

function ecrire(p: Projet): Projet {
  const { rushs: _, ...stocke } = p
  writeFileSync(join(dossierProjet(p.id), 'projet.json'), JSON.stringify(stocke, null, 2))
  return lire(p.id) ?? p
}

export function listerProjets(): Projet[] {
  return readdirSync(racine())
    .map(lire)
    .filter((p): p is Projet => p !== null)
    .sort((a, b) => b.majLe.localeCompare(a.majLe))
}

export function creerProjet(titre: string, format: Projet['format'], genre: Genre = 'formation'): Projet {
  const id = slug(titre)
  for (const sous of ['rushs', 'montage']) mkdirSync(join(dossierProjet(id), sous), { recursive: true })
  const maintenant = new Date().toISOString()
  return ecrire({ id, titre: titre.trim() || 'Nouvelle vidéo', format, genre, consignes: '', rushs: [], creeLe: maintenant, majLe: maintenant, statut: 'brouillon' })
}

export function modifierProjet(id: string, partiel: Partial<Projet>): Projet {
  const p = lire(id)
  if (!p) throw new Error(`Projet introuvable : ${id}`)
  const { id: _, creeLe: __, ...modifiable } = partiel
  return ecrire({ ...p, ...modifiable, majLe: new Date().toISOString() })
}

export function copierRushs(id: string, fichiers: string[]): Projet {
  const d = join(dossierProjet(id), 'rushs')
  mkdirSync(d, { recursive: true })
  for (const f of fichiers.filter((f) => EXTENSIONS.test(f))) copyFileSync(f, join(d, basename(f)))
  const p = modifierProjet(id, {})
  return p.rushs.length && p.statut === 'brouillon' ? modifierProjet(id, { statut: 'pret' }) : p
}
