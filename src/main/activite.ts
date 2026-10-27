import type { Activite } from '../shared/types'

// Traduit le flux de Claude Code (stream-json) en activité lisible :
// une ligne par action (avec son icône), ses messages à part, le reste en détail technique.

const court = (f: unknown) => String(f ?? '').split('/').slice(-2).join('/')
const image = (f: string) => /planche|\.(jpe?g|png|webp)$/i.test(f)

export function decrireAction(nom: string, entree: any): Activite | null {
  const f = String(entree?.file_path ?? entree?.path ?? '')
  if (nom === 'Read') return image(f) ? { genre: 'action', icone: 'oeil', texte: 'Regarde les images', groupe: 'regarde' } : { genre: 'action', icone: 'document', texte: `Lit ${court(f)}` }
  if (nom === 'Write' || nom === 'Edit') {
    if (f.endsWith('plan.json')) return { genre: 'action', icone: 'crayon', texte: nom === 'Edit' ? 'Corrige le plan de montage' : 'Écrit le plan de montage' }
    return { genre: 'action', icone: 'crayon', texte: `Écrit ${court(f)}` }
  }
  if (nom === 'WebSearch') return { genre: 'action', icone: 'recherche', texte: `Cherche « ${String(entree?.query ?? '').slice(0, 70)} »` }
  if (nom === 'WebFetch') return { genre: 'action', icone: 'globe', texte: `Lit ${hote(entree?.url)}` }
  if (nom === 'Bash') {
    const c = String(entree?.command ?? '').trim()
    if (c.startsWith('./rendre-brouillon.sh')) return { genre: 'action', icone: 'lecture', texte: 'Rend un brouillon pour vérifier' }
    if (c.startsWith('curl')) return { genre: 'action', icone: 'telecharger', texte: 'Télécharge une illustration' }
    if (c.startsWith('ffmpeg')) return { genre: 'action', icone: 'oeil', texte: 'Regarde les images', groupe: 'regarde' }
    return { genre: 'technique', texte: `$ ${c.split('\n')[0]}` }
  }
  if (nom.startsWith('mcp__claude-in-chrome__')) {
    const a = nom.replace('mcp__claude-in-chrome__', '')
    if (a === 'navigate') return { genre: 'action', icone: 'globe', texte: `Ouvre ${hote(entree?.url)}` }
    if (a === 'tabs_create_mcp') return { genre: 'action', icone: 'globe', texte: 'Ouvre un onglet dans Chrome' }
    if (a === 'get_page_text' || a === 'read_page') return { genre: 'action', icone: 'document', texte: 'Lit la page' }
    if (a === 'javascript_tool') return { genre: 'action', icone: 'oeil', texte: 'Regarde la vidéo', groupe: 'regarde' }
    if (a === 'computer') {
      const act = entree?.action
      if (act === 'screenshot' || act === 'zoom') return { genre: 'action', icone: 'oeil', texte: 'Regarde la vidéo', groupe: 'regarde' }
      return null
    }
    if (a === 'tabs_close_mcp') return { genre: 'action', icone: 'coche', texte: "Ferme l'onglet" }
    return null
  }
  return null
}

function hote(url: unknown): string {
  try {
    return new URL(String(url)).hostname.replace(/^www\./, '')
  } catch {
    return String(url ?? '').slice(0, 60)
  }
}

/** Retire la mise en forme Markdown des messages de Claude (gras, titres, puces). */
function propre(texte: string): string {
  return texte
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '· ')
    .trim()
}

/** Lecteur du flux : rend chaque activité, et garde le résultat final (« success » ou non). */
export function lecteurClaude(envoyer: (a: Activite) => void) {
  const etat = { resultat: '' }
  const ligne = (t: string) => {
    try {
      const m = JSON.parse(t)
      if (m.type === 'assistant')
        for (const c of m.message?.content ?? []) {
          if (c.type === 'text' && c.text.trim()) envoyer({ genre: 'message', texte: propre(c.text) })
          if (c.type === 'tool_use') {
            const a = decrireAction(c.name, c.input)
            if (a) envoyer(a)
          }
        }
      if (m.type === 'result') etat.resultat = m.subtype
    } catch {
      if (t.trim()) envoyer({ genre: 'technique', texte: t.trim() })
    }
  }
  return { ligne, etat }
}
