import { useEffect, useMemo, useRef, useState } from 'react'
import type { Activite as Ligne } from '../../../shared/types'
import { Icone, type NomIcone } from './Icone'

type Entree = Ligne & { id?: string }

type Element =
  | { sorte: 'source'; texte: string }
  | { sorte: 'ligne'; ligne: Entree; nombre: number }

const ICONES = new Set<string>(['oeil', 'document', 'crayon', 'recherche', 'globe', 'lecture', 'telecharger', 'coche', 'agent', 'reglages', 'actualiser', 'micro', 'image'])

/**
 * Ce que fait Claude, lisible : une ligne par action (les actions répétées réunies),
 * ses messages dans une bulle, le détail technique à part pour qui veut le voir.
 */
export function Activite({ lignes, enCours, source, titre = 'Ce que fait Claude', sombre, className = '' }: { lignes: Entree[]; enCours: boolean; source?: (id: string) => string; titre?: string; sombre?: boolean; className?: string }) {
  const [detail, setDetail] = useState(false)
  const zone = useRef<HTMLDivElement>(null)
  const suivre = useRef(true)

  const elements = useMemo(() => {
    const out: Element[] = []
    let id: string | undefined
    for (const l of lignes) {
      if (l.genre === 'technique' || !l.texte) continue
      if (source && l.id && l.id !== id) {
        out.push({ sorte: 'source', texte: source(l.id) })
        id = l.id
      }
      const prec = out[out.length - 1]
      if (l.groupe && prec?.sorte === 'ligne' && prec.ligne.groupe === l.groupe && prec.ligne.texte === l.texte) prec.nombre++
      else out.push({ sorte: 'ligne', ligne: l, nombre: 1 })
    }
    return out
  }, [lignes, source])

  // Défile vers le bas tant que la personne n'est pas remontée lire.
  useEffect(() => {
    const z = zone.current
    if (z && suivre.current) z.scrollTop = z.scrollHeight
  }, [elements, detail])

  const c = sombre
    ? { cadre: 'border-white/10 bg-nuit-2 text-white', tete: 'border-white/10', muet: 'text-[#8C879A]', pastille: 'bg-white/[0.06] text-[#CFCADA]', bulle: 'bg-white/[0.06] text-[#E7E5EC]', bouton: 'text-[#8C879A] hover:text-white' }
    : { cadre: 'border-bord bg-white text-encre', tete: 'border-bord-2', muet: 'text-muet', pastille: 'bg-fond text-encre-2', bulle: 'bg-fond text-encre-2', bouton: 'text-muet hover:text-encre' }

  const derniere = elements.length - 1

  return (
    <div className={`flex min-h-0 flex-col overflow-hidden rounded-xl border ${c.cadre} ${className}`}>
      <div className={`flex h-10 flex-none items-center gap-2.5 border-b px-4 ${c.tete}`}>
        {enCours ? <span className="tourne h-3.5 w-3.5 rounded-full border-2 border-violet-fond border-t-violet" /> : <Icone nom="agent" taille={15} className={c.muet} />}
        <b className="text-[12.5px] font-semibold">{titre}</b>
        <span className={`text-[12px] ${c.muet}`}>{enCours ? 'en direct' : 'terminé'}</span>
        <button className={`ml-auto text-[12px] font-medium ${c.bouton}`} onClick={() => setDetail(!detail)}>
          {detail ? 'Vue simple' : 'Détail technique'}
        </button>
      </div>
      <div
        ref={zone}
        onScroll={(e) => {
          const z = e.currentTarget
          suivre.current = z.scrollHeight - z.scrollTop - z.clientHeight < 40
        }}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3"
      >
        {detail ? (
          <pre className={`whitespace-pre-wrap break-words font-mono text-[11px] leading-[1.7] select-text ${c.muet}`}>{lignes.map((l) => l.texte).join('\n') || 'Rien pour le moment.'}</pre>
        ) : elements.length === 0 ? (
          <p className={`text-[12.5px] ${c.muet}`}>{enCours ? 'Démarrage…' : 'Rien pour le moment.'}</p>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {elements.map((e, k) =>
              e.sorte === 'source' ? (
                <li key={k} className={`mt-2 truncate text-[11px] font-semibold uppercase tracking-[0.06em] first:mt-0 ${c.muet}`}>
                  {e.texte}
                </li>
              ) : (
                <LigneActivite key={k} ligne={e.ligne} nombre={e.nombre} active={enCours && k === derniere} c={c} />
              )
            )}
          </ol>
        )}
      </div>
    </div>
  )
}

function LigneActivite({ ligne: l, nombre, active, c }: { ligne: Entree; nombre: number; active: boolean; c: Record<string, string> }) {
  const [ouvert, setOuvert] = useState(false)
  if (l.genre === 'message')
    return (
      <li className="flex gap-2.5 py-1">
        <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-md bg-violet text-[11px] font-bold text-white">C</span>
        <button onClick={() => setOuvert(!ouvert)} className={`min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-[12.5px] leading-relaxed ${c.bulle}`}>
          <span className={`block whitespace-pre-line break-words ${ouvert ? '' : 'line-clamp-3'}`}>{l.texte}</span>
        </button>
      </li>
    )
  const ton = l.genre === 'succes' ? 'bg-vert-fond text-vert' : l.genre === 'erreur' ? 'bg-red-50 text-red-600' : l.genre === 'info' ? 'bg-violet-fond text-violet' : c.pastille
  const icone: NomIcone = l.genre === 'succes' ? 'coche' : l.genre === 'erreur' ? 'alerte' : ICONES.has(l.icone ?? '') ? (l.icone as NomIcone) : 'fleche'
  return (
    <li className="flex min-w-0 items-center gap-2.5">
      <span className={`grid h-6 w-6 flex-none place-items-center rounded-md ${ton}`}>
        {active && l.genre === 'action' ? <span className="tourne h-3 w-3 rounded-full border-[1.5px] border-current border-t-transparent" /> : <Icone nom={icone} taille={13} />}
      </span>
      <span className={`min-w-0 truncate text-[12.5px] ${l.genre === 'info' || l.genre === 'succes' ? 'font-medium' : ''} ${l.genre === 'erreur' ? 'text-red-600' : ''}`}>{l.texte}</span>
      {nombre > 1 && <span className={`flex-none rounded-full px-1.5 text-[11px] font-semibold ${c.pastille}`}>{nombre}</span>}
    </li>
  )
}
